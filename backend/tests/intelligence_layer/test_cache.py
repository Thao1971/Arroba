"""Tests del IntelligenceCache — TTL, hit/miss, single-flight, error cache."""
from __future__ import annotations

import asyncio

import pytest

from src.modules.intelligence_layer.cache import (
    CachedError,
    IntelligenceCache,
    MemoryCache,
    MongoCache,
    build_key,
)


@pytest.mark.asyncio
async def test_build_key_deterministic_and_sensitive_to_payload():
    k1 = build_key(provider="mock", engine="master", method="get_by_id",
                   master_id="mc_1", payload={"a": 1, "b": 2})
    k2 = build_key(provider="mock", engine="master", method="get_by_id",
                   master_id="mc_1", payload={"b": 2, "a": 1})
    assert k1 == k2  # invariante a orden de keys
    k3 = build_key(provider="mock", engine="master", method="get_by_id",
                   master_id="mc_1", payload={"a": 2})
    assert k1 != k3


@pytest.mark.asyncio
async def test_memory_cache_get_set_expiry(monkeypatch):
    import time as _time

    fake_now = {"t": 1000.0}
    monkeypatch.setattr(_time, "time", lambda: fake_now["t"])
    from src.modules.intelligence_layer import cache as cache_mod
    monkeypatch.setattr(cache_mod.time, "time", lambda: fake_now["t"])

    mc = MemoryCache(maxsize=10)
    await mc.set("k", "v", ttl_s=10)
    entry = await mc.get("k")
    assert entry is not None and entry.value == "v"

    fake_now["t"] = 1011.0  # +11s → expirado
    assert await mc.get("k") is None


@pytest.mark.asyncio
async def test_memory_cache_lru_eviction():
    mc = MemoryCache(maxsize=2)
    await mc.set("a", 1, 60)
    await mc.set("b", 2, 60)
    await mc.get("a")  # touch → b se vuelve LRU
    await mc.set("c", 3, 60)  # evicta b
    assert (await mc.get("a")) is not None
    assert (await mc.get("b")) is None
    assert (await mc.get("c")) is not None


@pytest.mark.asyncio
async def test_get_or_compute_returns_value_and_caches(mock_db):
    cache = IntelligenceCache(memory=MemoryCache(), mongo=MongoCache())
    calls = 0

    async def compute():
        nonlocal calls
        calls += 1
        return {"hello": "world"}

    key = build_key(provider="mock", engine="master", method="m", master_id="id")
    r1 = await cache.get_or_compute(engine="master", key=key, ttl_s=60, compute=compute)
    r2 = await cache.get_or_compute(engine="master", key=key, ttl_s=60, compute=compute)
    assert r1 == r2 == {"hello": "world"}
    assert calls == 1  # segunda vez viene de memory cache


@pytest.mark.asyncio
async def test_get_or_compute_falls_back_to_mongo_layer(mock_db):
    """Si la capa memoria pierde el valor, Mongo debe rehidratarla."""
    memory = MemoryCache()
    mongo = MongoCache()
    cache = IntelligenceCache(memory=memory, mongo=mongo)

    async def compute():
        return {"v": 1}

    key = build_key(provider="mock", engine="master", method="m", master_id="id")
    await cache.get_or_compute(engine="master", key=key, ttl_s=60, compute=compute)
    await memory.clear()

    async def should_not_be_called():
        raise AssertionError("compute no debería ejecutarse (Mongo tiene el valor)")

    result = await cache.get_or_compute(
        engine="master", key=key, ttl_s=60, compute=should_not_be_called
    )
    assert result == {"v": 1}


@pytest.mark.asyncio
async def test_single_flight_deduplicates_concurrent_calls(mock_db):
    cache = IntelligenceCache(memory=MemoryCache(), mongo=MongoCache())
    calls = 0
    release = asyncio.Event()

    async def compute():
        nonlocal calls
        calls += 1
        await release.wait()
        return {"n": calls}

    key = build_key(provider="mock", engine="master", method="m", master_id="id-sf")

    async def caller():
        return await cache.get_or_compute(
            engine="master", key=key, ttl_s=60, compute=compute
        )

    tasks = [asyncio.create_task(caller()) for _ in range(5)]
    await asyncio.sleep(0.05)  # deja que se registren en _inflight
    release.set()
    results = await asyncio.gather(*tasks)
    assert calls == 1  # un único compute a pesar de 5 llamadas concurrentes
    assert all(r == {"n": 1} for r in results)


@pytest.mark.asyncio
async def test_error_is_cached_briefly(mock_db):
    """Un fallo del compute se cachea con error_ttl_s y se re-propaga sin llamar de nuevo."""
    cache = IntelligenceCache(memory=MemoryCache(), mongo=MongoCache())
    calls = 0

    async def compute():
        nonlocal calls
        calls += 1
        raise RuntimeError("upstream down")

    key = build_key(provider="mock", engine="master", method="m", master_id="err")

    with pytest.raises(RuntimeError):
        await cache.get_or_compute(
            engine="master", key=key, ttl_s=60, compute=compute, error_ttl_s=30
        )
    # segundo call: no debe volver a invocar compute
    with pytest.raises(CachedError):
        await cache.get_or_compute(
            engine="master", key=key, ttl_s=60, compute=compute, error_ttl_s=30
        )
    assert calls == 1


@pytest.mark.asyncio
async def test_ttl_zero_disables_cache(mock_db):
    """TTL=0 (event-driven engines como transaction) fuerza recompute cada vez."""
    cache = IntelligenceCache(memory=MemoryCache(), mongo=MongoCache())
    calls = 0

    async def compute():
        nonlocal calls
        calls += 1
        return {"x": calls}

    key = build_key(provider="mock", engine="transaction", method="m", master_id="id")
    r1 = await cache.get_or_compute(engine="transaction", key=key, ttl_s=0, compute=compute)
    r2 = await cache.get_or_compute(engine="transaction", key=key, ttl_s=0, compute=compute)
    assert calls == 2
    assert r1 != r2
