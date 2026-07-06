"""Tests del CircuitBreaker propio — verifica las 4 transiciones canónicas.

    closed → open           (fallos consecutivos ≥ threshold)
    open → half_open        (timeout expirado)
    half_open → closed      (llamada de prueba OK)
    half_open → open        (llamada de prueba KO)

Además: 1 sola prueba concurrente en half_open · reset de contador en OK.
"""
from __future__ import annotations

import asyncio

import pytest

from src.modules.intelligence_layer.circuit_breaker import (
    BreakerOpenError,
    CircuitBreaker,
)


class FakeClock:
    def __init__(self, start: float = 0.0) -> None:
        self.t = start

    def __call__(self) -> float:
        return self.t

    def advance(self, seconds: float) -> None:
        self.t += seconds


async def _ok() -> str:
    return "ok"


async def _boom() -> str:
    raise RuntimeError("boom")


@pytest.mark.asyncio
async def test_closed_on_success():
    br = CircuitBreaker(provider="p", engine="e", threshold=3, timeout_s=10)
    assert br.state == "closed"
    assert await br.call(_ok) == "ok"
    assert br.state == "closed"
    assert br.failures == 0


@pytest.mark.asyncio
async def test_transition_closed_to_open():
    br = CircuitBreaker(provider="p", engine="e", threshold=3, timeout_s=10)
    for _ in range(2):
        with pytest.raises(RuntimeError):
            await br.call(_boom)
    assert br.state == "closed"
    with pytest.raises(RuntimeError):
        await br.call(_boom)
    assert br.state == "open"
    # Llamadas siguientes rechazadas sin ejecutar
    with pytest.raises(BreakerOpenError):
        await br.call(_ok)


@pytest.mark.asyncio
async def test_transition_open_to_half_open_after_timeout():
    clock = FakeClock()
    br = CircuitBreaker(
        provider="p", engine="e", threshold=1, timeout_s=5, now=clock
    )
    with pytest.raises(RuntimeError):
        await br.call(_boom)
    assert br.state == "open"
    # aún dentro del timeout → sigue open
    clock.advance(4)
    with pytest.raises(BreakerOpenError):
        await br.call(_ok)
    # tras el timeout, siguiente call pasa a half_open y ejecuta
    clock.advance(2)
    result = await br.call(_ok)
    assert result == "ok"
    # tras éxito de la prueba → closed
    assert br.state == "closed"


@pytest.mark.asyncio
async def test_transition_half_open_to_closed_on_success():
    clock = FakeClock()
    br = CircuitBreaker(
        provider="p", engine="e", threshold=1, timeout_s=1, now=clock
    )
    with pytest.raises(RuntimeError):
        await br.call(_boom)
    clock.advance(2)
    # llamada de prueba OK → closed + failures reset
    assert await br.call(_ok) == "ok"
    assert br.state == "closed"
    assert br.failures == 0


@pytest.mark.asyncio
async def test_transition_half_open_to_open_on_failure():
    clock = FakeClock()
    br = CircuitBreaker(
        provider="p", engine="e", threshold=1, timeout_s=1, now=clock
    )
    with pytest.raises(RuntimeError):
        await br.call(_boom)
    clock.advance(2)
    with pytest.raises(RuntimeError):
        await br.call(_boom)  # llamada de prueba KO
    assert br.state == "open"
    # timeout rearmado — necesita otro avance para volver a half_open
    with pytest.raises(BreakerOpenError):
        await br.call(_ok)


@pytest.mark.asyncio
async def test_half_open_allows_only_one_probe_concurrently():
    """En half_open, si una prueba está en vuelo, otras deben rechazarse."""
    clock = FakeClock()
    br = CircuitBreaker(
        provider="p", engine="e", threshold=1, timeout_s=1, now=clock
    )
    with pytest.raises(RuntimeError):
        await br.call(_boom)
    clock.advance(2)  # pasa a half_open en próxima call

    started = asyncio.Event()
    release = asyncio.Event()

    async def slow_ok() -> str:
        started.set()
        await release.wait()
        return "ok"

    task = asyncio.create_task(br.call(slow_ok))
    await started.wait()
    # segunda llamada mientras la primera está en vuelo → rechazada
    with pytest.raises(BreakerOpenError):
        await br.call(_ok)
    release.set()
    assert await task == "ok"
    assert br.state == "closed"


@pytest.mark.asyncio
async def test_success_resets_failure_counter():
    br = CircuitBreaker(provider="p", engine="e", threshold=3, timeout_s=10)
    with pytest.raises(RuntimeError):
        await br.call(_boom)
    with pytest.raises(RuntimeError):
        await br.call(_boom)
    assert br.failures == 2
    await br.call(_ok)
    assert br.failures == 0
    assert br.state == "closed"


@pytest.mark.asyncio
async def test_invalid_config_rejected():
    with pytest.raises(ValueError):
        CircuitBreaker(provider="p", engine="e", threshold=0, timeout_s=10)
    with pytest.raises(ValueError):
        CircuitBreaker(provider="p", engine="e", threshold=1, timeout_s=0)
