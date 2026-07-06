"""Caché 2 capas + single-flight — Decisión 0.1.2.

Capa 1: In-memory (LRU con TTL). Latencia sub-ms.
Capa 2: MongoDB colección `intelligence_cache`. Persistente entre reinicios.
Single-flight: 2 requests concurrentes con la misma key comparten resultado.
Error TTL corto: 5xx/timeout se cachea 30s para evitar hammering (via `set_error`).

Key canónica: `f"{provider}:{engine}:{method}:{master_id}:{payload_hash}"`.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import time
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any

from src.core.database import get_db
from src.core.logging import get_logger
from src.modules.intelligence_layer.observability import (
    cache_hits_total,
    cache_misses_total,
    deduplication_hits_total,
)

log = get_logger("intelligence_layer.cache")


def build_key(
    *, provider: str, engine: str, method: str, master_id: str, payload: Any = None
) -> str:
    """Genera la clave canónica. `payload` se hashea determinísticamente."""
    payload_hash = "-"
    if payload is not None:
        blob = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
        payload_hash = hashlib.sha256(blob.encode("utf-8")).hexdigest()[:16]
    return f"{provider}:{engine}:{method}:{master_id}:{payload_hash}"


@dataclass
class _Entry:
    value: Any
    expires_at: float
    is_error: bool = False


class MemoryCache:
    """LRU con TTL. Sin dependencias externas. Thread-safe vía asyncio.Lock."""

    def __init__(self, maxsize: int = 1024) -> None:
        self.maxsize = maxsize
        self._store: OrderedDict[str, _Entry] = OrderedDict()
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> _Entry | None:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            if entry.expires_at < time.time():
                self._store.pop(key, None)
                return None
            self._store.move_to_end(key)  # LRU touch
            return entry

    async def set(self, key: str, value: Any, ttl_s: int, *, is_error: bool = False) -> None:
        if ttl_s <= 0:
            return  # 0 = no cachear (event-driven engines)
        async with self._lock:
            self._store[key] = _Entry(
                value=value, expires_at=time.time() + ttl_s, is_error=is_error
            )
            self._store.move_to_end(key)
            while len(self._store) > self.maxsize:
                self._store.popitem(last=False)

    async def invalidate(self, key: str) -> None:
        async with self._lock:
            self._store.pop(key, None)

    async def clear(self) -> None:
        async with self._lock:
            self._store.clear()


class MongoCache:
    """Capa persistente. Colección `intelligence_cache`. TTL index en `expires_at`."""

    COLLECTION = "intelligence_cache"

    async def get(self, key: str) -> _Entry | None:
        doc = await get_db()[self.COLLECTION].find_one({"_id": key}, {"_id": 0})
        if not doc:
            return None
        if doc["expires_at"] < time.time():
            return None
        return _Entry(
            value=doc["value"],
            expires_at=doc["expires_at"],
            is_error=doc.get("is_error", False),
        )

    async def set(self, key: str, value: Any, ttl_s: int, *, is_error: bool = False) -> None:
        if ttl_s <= 0:
            return
        expires_at = time.time() + ttl_s
        await get_db()[self.COLLECTION].update_one(
            {"_id": key},
            {"$set": {"value": value, "expires_at": expires_at, "is_error": is_error}},
            upsert=True,
        )

    async def invalidate(self, key: str) -> None:
        await get_db()[self.COLLECTION].delete_one({"_id": key})


class IntelligenceCache:
    """Fachada 2 capas + single-flight.

    Uso típico:
        result = await cache.get_or_compute(
            engine="master", key=k, ttl_s=900, compute=fn, error_ttl_s=30,
        )

    `compute` es una coroutine que devuelve el valor real (llamada al proveedor).
    Si otra request concurrente pide la misma key, se pega al Future en vuelo.
    """

    def __init__(
        self,
        *,
        memory: MemoryCache | None = None,
        mongo: MongoCache | None = None,
    ) -> None:
        self.memory = memory or MemoryCache()
        self.mongo = mongo or MongoCache()
        self._inflight: dict[str, asyncio.Future[Any]] = {}
        self._inflight_lock = asyncio.Lock()

    async def get_or_compute(
        self,
        *,
        engine: str,
        key: str,
        ttl_s: int,
        compute,  # Callable[[], Awaitable[Any]]
        error_ttl_s: int = 30,
    ) -> Any:
        # ---- Capa 1: memory ----
        entry = await self.memory.get(key)
        if entry is not None:
            cache_hits_total.labels(engine=engine, layer="memory").inc()
            if entry.is_error:
                # Cache-de-error: propaga como excepción sin llamar al proveedor.
                raise CachedError(entry.value)
            return entry.value
        cache_misses_total.labels(engine=engine, layer="memory").inc()

        # ---- Capa 2: mongo ----
        entry = await self.mongo.get(key)
        if entry is not None:
            cache_hits_total.labels(engine=engine, layer="mongo").inc()
            # Rellena memory para próximas
            remaining = max(1, int(entry.expires_at - time.time()))
            await self.memory.set(key, entry.value, remaining, is_error=entry.is_error)
            if entry.is_error:
                raise CachedError(entry.value)
            return entry.value
        cache_misses_total.labels(engine=engine, layer="mongo").inc()

        # ---- Single-flight ----
        async with self._inflight_lock:
            fut = self._inflight.get(key)
            if fut is not None:
                deduplication_hits_total.labels(engine=engine).inc()
                waiter = fut
            else:
                fut = asyncio.get_running_loop().create_future()
                self._inflight[key] = fut
                waiter = None

        if waiter is not None:
            return await waiter  # otra request está calculando

        # Somos el "primer" caller: computamos + poblamos + resolvemos el future.
        try:
            value = await compute()
        except BaseException as exc:
            # Cachea el error brevemente y propaga.
            err_repr = {"error": type(exc).__name__, "detail": str(exc)}
            await self.memory.set(key, err_repr, error_ttl_s, is_error=True)
            await self.mongo.set(key, err_repr, error_ttl_s, is_error=True)
            async with self._inflight_lock:
                self._inflight.pop(key, None)
            fut.set_exception(exc)
            # Marca el future como "retrieved" para evitar warning de asyncio
            # cuando no hay otros callers pegados al single-flight.
            try:
                fut.exception()
            except Exception:  # noqa: BLE001
                pass
            raise
        else:
            await self.memory.set(key, value, ttl_s)
            await self.mongo.set(key, value, ttl_s)
            async with self._inflight_lock:
                self._inflight.pop(key, None)
            fut.set_result(value)
            return value


class CachedError(RuntimeError):
    """Excepción sintética emitida cuando un error previo del proveedor está cacheado."""

    def __init__(self, payload: Any) -> None:
        super().__init__(str(payload))
        self.payload = payload


# Instancia por defecto reutilizada por el router.
_default_cache: IntelligenceCache | None = None


def get_cache() -> IntelligenceCache:
    global _default_cache
    if _default_cache is None:
        _default_cache = IntelligenceCache()
    return _default_cache


def reset_cache_for_tests() -> None:
    global _default_cache
    _default_cache = None


__all__ = [
    "IntelligenceCache",
    "MemoryCache",
    "MongoCache",
    "CachedError",
    "build_key",
    "get_cache",
    "reset_cache_for_tests",
]
