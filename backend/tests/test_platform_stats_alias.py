"""Tests del alias canónico `GET /api/platform/stats` (SPRINT 1 · F8).

Verifica que:
1. Sin datos seedeados devuelve 404 (misma semántica que el legacy).
2. Con el singleton seedeado devuelve 200, incluye `provenance: 'demo'`
   en el body y `X-Provenance` en el header.
3. Nunca expone la palabra `agency-tool` en la URL; el frontend habla
   únicamente el vocabulario canónico.
"""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.database import get_db
from src.main import app


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
            "companies_with_intelligence": 100,
            "companies_with_financials": 90,
            "economic_metrics_total": 4000,
            "corporate_movements": 5000,
            "investors_and_funds": 300,
            "sectors_analyzed": 70,
            "companies_with_public_contracts": 800,
            "cross_sectors": 45,
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
    assert body["companies_with_intelligence"] == 100
    assert body["sectors_analyzed"] == 70


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
            "companies_with_intelligence": 200,
            "companies_with_financials": 190,
            "economic_metrics_total": 9000,
            "corporate_movements": 12000,
            "investors_and_funds": 700,
            "sectors_analyzed": 88,
            "companies_with_public_contracts": 1200,
            "cross_sectors": 60,
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
