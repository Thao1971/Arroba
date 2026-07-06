"""Tests E2E de los endpoints REST del Semantic Engine (B.6.c)."""
from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient

from src.modules.intelligence_layer.cache import reset_cache_for_tests
from src.modules.intelligence_layer.config import reset_intelligence_settings_cache
from src.modules.intelligence_layer.router import reset_intelligence_router_for_tests


@pytest.fixture(autouse=True)
def _reset_intel_state():
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()
    yield
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()


@pytest.fixture
def force_mock_mode(monkeypatch):
    from src.modules.intelligence_layer import config as cfg_mod
    from src.modules.intelligence_layer import endpoints as ep_mod
    from src.modules.intelligence_layer import router as router_mod

    fake_settings = cfg_mod.IntelligenceSettings(agency_tool_mode="mock")
    monkeypatch.setattr(cfg_mod, "get_intelligence_settings", lambda: fake_settings)
    monkeypatch.setattr(ep_mod, "get_intelligence_settings", lambda: fake_settings)
    monkeypatch.setattr(router_mod, "get_intelligence_settings", lambda: fake_settings)
    reset_intelligence_router_for_tests()
    yield


# ---------- Auth guards ----------


@pytest.mark.asyncio
async def test_profile_requires_auth(client: AsyncClient):
    r = await client.get("/api/companies/B47820150/profile")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_similar_requires_auth(client: AsyncClient):
    r = await client.get("/api/companies/B47820150/similar")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_semantic_search_requires_auth(client: AsyncClient):
    r = await client.post("/api/entities/semantic-search", json={"query": "hotel"})
    assert r.status_code == 401


# ---------- Modo mock: profile / similar 404 · search siempre 200 ----------


@pytest.mark.asyncio
async def test_profile_returns_404_in_mock_mode(alice: AsyncClient, force_mock_mode):
    r = await alice.get("/api/companies/B47820150/profile")
    assert r.status_code == 404
    assert r.json()["code"] == "profile_not_found"


@pytest.mark.asyncio
async def test_similar_returns_404_in_mock_mode(alice: AsyncClient, force_mock_mode):
    r = await alice.get("/api/companies/B47820150/similar?limit=5")
    assert r.status_code == 404
    assert r.json()["code"] == "similar_not_found"


@pytest.mark.asyncio
async def test_semantic_search_returns_200_empty_in_mock_mode(alice: AsyncClient, force_mock_mode):
    """El buscador SIEMPRE responde 200 (aunque vacío) para no romper la UX."""
    r = await alice.post(
        "/api/entities/semantic-search", json={"query": "hotel", "limit": 5}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["query"] == "hotel"
    assert body["count"] == 0
    assert body["results"] == []
    assert body["engine_version"] in ("mock-semantic-v1", "arroba-semantic-v1")


@pytest.mark.asyncio
async def test_semantic_schema_and_catalog_in_mock_mode(alice: AsyncClient, force_mock_mode):
    """schema y catalog devuelven estructura estable en mock (para dev)."""
    r_schema = await alice.get("/api/intelligence/semantic-schema")
    assert r_schema.status_code == 200
    assert "activities" in r_schema.json()["fields"]

    r_cat = await alice.get("/api/intelligence/semantic-catalog")
    assert r_cat.status_code == 200
    body = r_cat.json()
    assert isinstance(body["activities"], list)
    assert body["engine_version"] in ("mock-semantic-v1", "arroba-semantic-v1")


# ---------- Datos ricos (provider inyectado) ----------


@pytest.mark.asyncio
async def test_profile_200_with_injected_provider(alice: AsyncClient):
    """Inyectamos provider fake → verifica que el frontend recibe el schema completo."""
    from src.modules.intelligence_layer.interfaces.semantic import (
        SemanticProfile,
        SemanticProvider,
    )
    from src.modules.intelligence_layer.router import get_intelligence_router

    class _FakeSem(SemanticProvider):
        provider_name = "agency_tool"

        async def profile(self, cif):
            return SemanticProfile(
                master_id="mc_test",
                cif_normalized=cif,
                activities=["Consultoría", "M&A"],
                products_services=["Reports"],
                markets=["Iberia"],
                keywords=["mid-market"],
                value_proposition="Asesoramiento M&A a mid-market.",
                business_model="B2B",
                engine_version="arroba-semantic-v1",
            )

        async def similar(self, cif, limit=10):
            raise NotImplementedError

        async def search(self, query, limit=10, cnae_section=None):
            raise NotImplementedError

        async def schema(self):
            raise NotImplementedError

        async def catalog(self):
            raise NotImplementedError

    get_intelligence_router()._semantic_provider = _FakeSem()

    r = await alice.get("/api/companies/B47820150/profile")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["activities"] == ["Consultoría", "M&A"]
    assert body["value_proposition"].startswith("Asesoramiento")
    assert body["engine_version"] == "arroba-semantic-v1"
    # ---- R5: NUNCA leakear el nombre externo del proveedor ----
    assert "semantic-intelligence-v1" not in r.text
    assert r.headers.get("X-Provider") == "agency_tool"


# ---------- Zero leak / key ----------


@pytest.mark.asyncio
async def test_openapi_exposes_semantic_endpoints(alice: AsyncClient):
    r = await alice.get("/api/openapi.json")
    assert r.status_code == 200
    paths = r.json()["paths"]
    assert "/api/companies/{cif}/profile" in paths
    assert "/api/companies/{cif}/similar" in paths
    assert "/api/entities/semantic-search" in paths
    assert "/api/intelligence/semantic-schema" in paths
    assert "/api/intelligence/semantic-catalog" in paths


@pytest.mark.asyncio
async def test_semantic_key_never_leaked_via_openapi(alice: AsyncClient):
    from src.modules.intelligence_layer.config import get_intelligence_settings

    reset_intelligence_settings_cache()
    r = await alice.get("/api/openapi.json")
    real_key = get_intelligence_settings().arroba_service_api_key_primary
    if real_key:
        assert real_key not in r.text


@pytest.mark.asyncio
async def test_semantic_search_validates_body(alice: AsyncClient):
    """query mínimo 1 char + limit rango 1-50."""
    r = await alice.post("/api/entities/semantic-search", json={"query": "", "limit": 5})
    assert r.status_code == 422
    r2 = await alice.post("/api/entities/semantic-search", json={"query": "x", "limit": 100})
    assert r2.status_code == 422
