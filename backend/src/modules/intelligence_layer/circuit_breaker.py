"""Circuit Breaker async — implementación propia (~90 líneas · Decisión 0.1.1).

Estados canónicos:
  * closed    → normal. Cuenta fallos consecutivos. Al llegar a `threshold` → open.
  * open      → devuelve BreakerOpenError sin llamar al proveedor. Tras
                `timeout_s` transiciona automáticamente a half_open al siguiente call.
  * half_open → 1 sola llamada de prueba en vuelo. Éxito → closed (contador reset).
                Fallo → open (rearma timeout).

Diseñado async-first: usa `asyncio.Lock` para la transición half_open→closed/open.

El estado se refleja en `observability.circuit_breaker_state` como Gauge cada
vez que cambia (auditoría permanente).
"""
from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from typing import Literal, TypeVar

from src.core.logging import get_logger
from src.modules.intelligence_layer.observability import (
    BREAKER_STATE_CODE,
    circuit_breaker_state,
)

log = get_logger("intelligence_layer.circuit_breaker")

State = Literal["closed", "open", "half_open"]
T = TypeVar("T")


class BreakerOpenError(RuntimeError):
    """Se lanza cuando el breaker está open y rechaza la llamada sin ejecutar."""

    def __init__(self, provider: str, engine: str) -> None:
        super().__init__(f"circuit breaker open for {provider}/{engine}")
        self.provider = provider
        self.engine = engine


class CircuitBreaker:
    """Breaker por (provider, engine). Instanciar uno por combinación."""

    def __init__(
        self,
        *,
        provider: str,
        engine: str,
        threshold: int = 5,
        timeout_s: float = 60.0,
        now: Callable[[], float] = time.monotonic,
    ) -> None:
        if threshold <= 0:
            raise ValueError("threshold debe ser > 0")
        if timeout_s <= 0:
            raise ValueError("timeout_s debe ser > 0")
        self.provider = provider
        self.engine = engine
        self.threshold = threshold
        self.timeout_s = timeout_s
        self._now = now
        self._state: State = "closed"
        self._consecutive_failures = 0
        self._opened_at: float | None = None
        self._half_open_in_flight = False
        self._lock = asyncio.Lock()
        self._publish_state()

    # ---------- Introspección (útil para tests) ----------
    @property
    def state(self) -> State:
        return self._state

    @property
    def failures(self) -> int:
        return self._consecutive_failures

    # ---------- API principal ----------
    async def call(self, fn: Callable[[], Awaitable[T]]) -> T:
        """Ejecuta `fn` respetando el estado del breaker."""
        async with self._lock:
            self._maybe_transition_to_half_open()
            if self._state == "open":
                raise BreakerOpenError(self.provider, self.engine)
            if self._state == "half_open":
                if self._half_open_in_flight:
                    # Otra llamada de prueba en curso — rechaza para preservar la regla "1 sola prueba".
                    raise BreakerOpenError(self.provider, self.engine)
                self._half_open_in_flight = True

        try:
            result = await fn()
        except BaseException:
            await self._on_failure()
            raise
        else:
            await self._on_success()
            return result

    # ---------- Transiciones ----------
    def _maybe_transition_to_half_open(self) -> None:
        if self._state != "open":
            return
        assert self._opened_at is not None
        if (self._now() - self._opened_at) >= self.timeout_s:
            self._set_state("half_open")

    async def _on_success(self) -> None:
        async with self._lock:
            self._half_open_in_flight = False
            if self._state == "half_open":
                self._set_state("closed")
            self._consecutive_failures = 0

    async def _on_failure(self) -> None:
        async with self._lock:
            self._half_open_in_flight = False
            if self._state == "half_open":
                # Fallo en la prueba: reabrir y rearmar timeout.
                self._opened_at = self._now()
                self._set_state("open")
                return
            self._consecutive_failures += 1
            if self._consecutive_failures >= self.threshold:
                self._opened_at = self._now()
                self._set_state("open")

    def _set_state(self, new: State) -> None:
        if new == self._state:
            return
        log.info(
            "breaker.transition",
            provider=self.provider,
            engine=self.engine,
            from_state=self._state,
            to_state=new,
            failures=self._consecutive_failures,
        )
        self._state = new
        self._publish_state()

    def _publish_state(self) -> None:
        circuit_breaker_state.labels(provider=self.provider, engine=self.engine).set(
            BREAKER_STATE_CODE[self._state]
        )


__all__ = ["CircuitBreaker", "BreakerOpenError", "State"]
