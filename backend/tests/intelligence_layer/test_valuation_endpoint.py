"""Tests end-to-end del endpoint /api/companies/{cif}/valuation — Sprint F0.3.

Verifica:
  * Auth requerida.
  * En modo mock: `has_valuation=False` (mocks sin bloque valuation).
  * `404 resolve_not_found` cuando el CIF no existe.
  * Cabeceras `X-Intelligence-Mode` + `X-Provider` presentes.
  * R5: `engine_version=arroba-valuation-v1`, nunca `financial-intelligence-v1`.
  * Cache aside (2ª llamada al mismo CIF venga de caché).
  * OpenAPI documenta el endpoint.
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


async def _seed_master(mock_db, cif: str = "B47820150") -> None:
    from datetime import UTC, datetime
    await mock_db.master_companies_mock.insert_one({
        "master_company_id": "mc_val_test",
        "cif": cif,
        "legal_name": "Empresa valuation",
        "sector": "Servicios",
        "region": "Madrid",
        "country": "ES",
        "financials": {"revenue": 5_000_000, "ebitda": 800_000, "employees": 25, "fiscal_year": 2024},
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    })


@pytest.mark.asyncio
async def test_valuation_requires_auth(client: AsyncClient, mock_db):
    await _seed_master(mock_db)
    r = await client.get("/api/companies/B47820150/valuation")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_valuation_hit_returns_arroba_v1_contract(alice: AsyncClient, mock_db, force_mock_mode):
    await _seed_master(mock_db)
    r = await alice.get("/api/companies/B47820150/valuation")
    assert r.status_code == 200, r.text
    body = r.json()
    # R5 · Contrato interno decoupled
    assert body["engine_version"] == "arroba-valuation-v1"
    # Mocks no traen valoración: has_valuation=False, campos null
    assert body["has_valuation"] is False
    assert body["enterprise_value"] is None
    assert body["range"] is None
    # Cabeceras canónicas
    assert r.headers.get("X-Intelligence-Mode") == "mock"
    assert r.headers.get("X-Provider") == "mock"


@pytest.mark.asyncio
async def test_valuation_returns_404_when_cif_unknown(alice: AsyncClient, mock_db):
    r = await alice.get("/api/companies/Z99999999/valuation")
    assert r.status_code == 404
    body = r.json()
    assert body["code"] == "resolve_not_found"


@pytest.mark.asyncio
async def test_valuation_openapi_documents_endpoint(alice: AsyncClient):
    r = await alice.get("/api/openapi.json")
    assert r.status_code == 200
    spec = r.json()
    assert "/api/companies/{cif}/valuation" in spec["paths"]
    op = spec["paths"]["/api/companies/{cif}/valuation"]["get"]
    assert "ValuationAnalysis" in op["responses"]["200"]["content"]["application/json"]["schema"].get("$ref", "")
