"""Tests end-to-end del endpoint /api/companies/{cif}/resolve — Sprint F0.2.

Verifica:
  * Endpoint requiere auth.
  * En modo mock, resuelve desde `master_companies_mock` y devuelve
    `PublicResolveResult` (sin `master_id` en el payload · F0.2-OP3).
  * `404 resolve_not_found` canónico cuando el CIF no existe.
  * Cabecera `X-Intelligence-Mode` presente.
  * `master_id` NO aparece en el response body.
  * Cache hit: 2 llamadas al mismo CIF sólo generan 1 request al proveedor.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from src.modules.intelligence_layer.cache import reset_cache_for_tests
from src.modules.intelligence_layer.config import reset_intelligence_settings_cache
from src.modules.intelligence_layer.router import reset_intelligence_router_for_tests


@pytest.fixture
def force_mock_mode(monkeypatch):
    from src.modules.intelligence_layer import config as cfg_mod
    from src.modules.intelligence_layer import endpoints as ep_mod
    from src.modules.intelligence_layer import router as router_mod

    reset_intelligence_settings_cache()
    fake_settings = cfg_mod.IntelligenceSettings(agency_tool_mode="mock")
    monkeypatch.setattr(cfg_mod, "get_intelligence_settings", lambda: fake_settings)
    monkeypatch.setattr(ep_mod, "get_intelligence_settings", lambda: fake_settings)
    monkeypatch.setattr(router_mod, "get_intelligence_settings", lambda: fake_settings)
    reset_intelligence_router_for_tests()
    yield
    reset_intelligence_router_for_tests()


@pytest.fixture(autouse=True)
def _reset_intel_state():
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()
    yield
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()


async def _seed_master(mock_db, cif: str = "B47820150", **overrides) -> dict:
    from datetime import UTC, datetime
    doc = {
        "master_company_id": "mc_resolve_test",
        "cif": cif,
        "legal_name": "Grupo Resolve Test",
        "sector": "Servicios",
        "region": "Madrid",
        "country": "ES",
        "financials": {"revenue": 1_000_000, "ebitda": 200_000, "employees": 20, "fiscal_year": 2024},
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    doc.update(overrides)
    await mock_db.master_companies_mock.insert_one(doc)
    return doc


@pytest.mark.asyncio
async def test_resolve_requires_auth(client: AsyncClient, mock_db):
    await _seed_master(mock_db)
    r = await client.get("/api/companies/B47820150/resolve")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_resolve_hit_returns_public_result_without_master_id(
    alice: AsyncClient, mock_db, force_mock_mode
):
    await _seed_master(mock_db)
    r = await alice.get("/api/companies/B47820150/resolve")
    assert r.status_code == 200, r.text
    body = r.json()

    assert body["cif"] == "B47820150"
    assert body["resolved"] is True
    assert body["canonical_name"] == "Grupo Resolve Test"
    assert body["match_type"] == "cif_exact"
    assert body["score"] == 1.0
    assert body["engine_version"] == "arroba-resolve-v1"
    # F0.2-OP3: el master_id NO se expone al frontend.
    assert "master_id" not in body

    assert r.headers.get("X-Intelligence-Mode") == "mock"
    assert r.headers.get("X-Provider") == "mock"


@pytest.mark.asyncio
async def test_resolve_master_id_never_leaks_in_response(
    alice: AsyncClient, mock_db, force_mock_mode
):
    """Regresión F0.2-OP3: el master_id no aparece literal en el body."""
    await _seed_master(mock_db, cif="B47820150")
    r = await alice.get("/api/companies/B47820150/resolve")
    assert r.status_code == 200
    assert "mc_resolve_test" not in r.text


@pytest.mark.asyncio
async def test_resolve_returns_404_when_cif_unknown(alice: AsyncClient, mock_db):
    r = await alice.get("/api/companies/Z99999999/resolve")
    assert r.status_code == 404
    body = r.json()
    assert body["code"] == "resolve_not_found"


@pytest.mark.asyncio
async def test_resolve_cache_hit_second_request(
    alice: AsyncClient, mock_db, force_mock_mode
):
    """Segunda llamada al mismo CIF debe venir de caché (via métricas Prometheus)."""
    await _seed_master(mock_db)
    r1 = await alice.get("/api/companies/B47820150/resolve")
    assert r1.status_code == 200
    r2 = await alice.get("/api/companies/B47820150/resolve")
    assert r2.status_code == 200

    metrics = await alice.get("/api/internal/metrics")
    body = metrics.text
    import re
    m = re.search(
        r'intelligence_layer_cache_hits_total\{engine="resolve",layer="memory"\}\s+(\d+(?:\.\d+)?)',
        body,
    )
    assert m is not None, f"cache_hits_total métrica no encontrada:\n{body[:600]}"
    assert float(m.group(1)) >= 1.0


@pytest.mark.asyncio
async def test_resolve_openapi_documents_endpoint(alice: AsyncClient):
    """El nuevo endpoint aparece en el OpenAPI público."""
    r = await alice.get("/api/openapi.json")
    assert r.status_code == 200
    spec = r.json()
    assert "/api/companies/{cif}/resolve" in spec["paths"]
    op = spec["paths"]["/api/companies/{cif}/resolve"]["get"]
    assert "PublicResolveResult" in op["responses"]["200"]["content"]["application/json"]["schema"].get("$ref", "")
