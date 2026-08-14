"""Tests del alias canónico `GET /api/platform/stats` (SPRINT 1 · F8).

Verifica que:
1. Sin datos seedeados devuelve 404 (misma semántica que el legacy).
2. Con el singleton seedeado devuelve 200, incluye `provenance: 'demo'`
   en el body y `X-Provenance` en el header.
3. Nunca expone la palabra `agency-tool` en la URL; el frontend habla
   únicamente el vocabulario canónico.

REQ-001 (2026-08-14): estos tests validan el PATH MOCK. Fuerzan
`agency_tool_mode=mock` vía fixture autouse porque el pod puede tener
la variable en `real` (Intel S2S) y el path real interceptaría antes de
llegar al mock.
"""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.database import get_db
from src.main import app


@pytest.fixture(autouse=True)
def _force_mock_mode(monkeypatch):
    """REQ-001 · fuerza modo mock para estos tests (ver test_platform_stats.py)."""
    from src.modules.intelligence_layer import config as _il_config
    _il_config.get_intelligence_settings.cache_clear()
    monkeypatch.setenv("AGENCY_TOOL_MODE", "mock")
    _il_config.get_intelligence_settings.cache_clear()
    yield
    _il_config.get_intelligence_settings.cache_clear()


@pytest.mark.asyncio
async def test_platform_stats_returns_404_when_not_seeded():
    db = get_db()
    await db.platform_stats_mock.delete_many({})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/platform/stats")
    assert res.status_code == 404
    assert res.json()["code"] == "platform_stats_not_seeded"


@pytest.mark.asyncio
async def test_platform_stats_alias_translates_source_to_provenance_demo():
    db = get_db()
    await db.platform_stats_mock.delete_many({})
    await db.platform_stats_mock.insert_one(
        {
            "_key": "singleton",
            # REQ-001 · shape canónico (2026-08-14): 4 métricas top-level.
            "companies_analyzed": 24992,
            "active_opportunities": 672190,
            "market_movements": 28458,
            "signals_detected": 6159,
            "last_updated": "2026-06-24T09:19:10.224000",
            "confidence": 1.0,
            "lineage": "raw",
            "valid_until": None,
            "source": "mock",
        }
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/platform/stats")

    assert res.status_code == 200
    body = res.json()
    # Campo canónico presente.
    assert body["provenance"] == "demo"
    # Header canónico presente.
    assert res.headers.get("x-provenance") == "demo"
    # Sanity: los KPIs se mantienen.
    assert body["companies_analyzed"] == 24992
    assert body["market_movements"] == 28458


@pytest.mark.asyncio
async def test_platform_stats_alias_maps_real_to_live(monkeypatch):
    """Verifica el mapeo real→live simulando `ADAPTER_MODE='real'`."""
    from src.modules.agency_tool_adapter import service as _svc

    monkeypatch.setattr(_svc, "ADAPTER_MODE", "real")

    db = get_db()
    await db.platform_stats_mock.delete_many({})
    await db.platform_stats_mock.insert_one(
        {
            "_key": "singleton",
            # REQ-001 · shape canónico (2026-08-14): 4 métricas top-level.
            "companies_analyzed": 24992,
            "active_opportunities": 672190,
            "market_movements": 28458,
            "signals_detected": 6159,
            "last_updated": "2026-06-24T09:19:10.224000",
            "confidence": 0.9,
            "lineage": "raw",
            "valid_until": None,
            "source": "real",
        }
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/platform/stats")

    assert res.status_code == 200
    assert res.json()["provenance"] == "live"
    assert res.headers.get("x-provenance") == "live"
