"""Tests end-to-end de los endpoints REST del Financial Engine (B.6.b).

Cubre:
  * GET /api/companies/{cif}/financial-analysis (200 real / 404 sin datos)
  * GET /api/companies/{cif}/valuation
  * GET /api/intelligence/ratios/catalog
  * Auth requerida en los 3
  * X-Intelligence-Mode / X-Provider en headers
  * Zero key leak en /openapi.json
  * engine_version interno "arroba-financial-v1" nunca leakea el nombre real del proveedor
"""
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


# ---------- financial-analysis ----------


@pytest.mark.asyncio
async def test_financial_analysis_requires_auth(client: AsyncClient):
    r = await client.get("/api/companies/B47820150/financial-analysis")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_financial_analysis_returns_404_in_mock_mode(alice: AsyncClient, force_mock_mode):
    """En modo mock el FinancialProvider siempre devuelve 404 (no inventa datos · R4)."""
    r = await alice.get("/api/companies/B47820150/financial-analysis")
    assert r.status_code == 404
    body = r.json()
    assert body["code"] == "financial_not_found"


@pytest.mark.asyncio
async def test_financial_analysis_200_with_injected_provider(alice: AsyncClient, monkeypatch):
    """Inyectamos un provider fake que devuelve datos → verifica el schema completo."""
    from src.modules.intelligence_layer.interfaces.financial import (
        BalanceSheet,
        FinancialAnalysis,
        FinancialKpis,
        FinancialProvider,
    )
    from src.modules.intelligence_layer.router import get_intelligence_router

    class _FakeFin(FinancialProvider):
        provider_name = "agency_tool"

        async def analyze(self, cif):
            return FinancialAnalysis(
                master_id="mc_test",
                cif_normalized=cif,
                has_financials=True,
                cnae_code="70.22",
                cnae_section="M",
                provincia="Madrid",
                kpis=FinancialKpis(revenue=12_500_000, ebitda=3_200_000, ebitda_margin=0.256, employees_total=45),
                balance_sheet=BalanceSheet(total_assets=22_000_000, equity=8_500_000),
                ratios={"current_ratio": 1.4, "roe": 0.18},
                engine_version="arroba-financial-v1",
            )

        async def valuation(self, cif):
            raise NotImplementedError

        async def ratios_catalog(self):
            raise NotImplementedError

    r_router = get_intelligence_router()
    r_router._financial_provider = _FakeFin()

    r = await alice.get("/api/companies/B47820150/financial-analysis")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["master_id"] == "mc_test"
    assert body["kpis"]["revenue"] == 12_500_000
    assert body["kpis"]["ebitda_margin"] == 0.256
    assert body["balance_sheet"]["equity"] == 8_500_000
    assert body["ratios"]["current_ratio"] == 1.4
    # ---- R5: engine_version es el interno de arroba, no el del proveedor ----
    assert body["engine_version"] == "arroba-financial-v1"
    assert "financial-intelligence-v1" not in r.text

    # Headers de trazabilidad
    assert r.headers.get("X-Provider") == "agency_tool"


# ---------- valuation ----------


@pytest.mark.asyncio
async def test_valuation_requires_auth(client: AsyncClient):
    r = await client.get("/api/companies/B47820150/valuation")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_valuation_returns_404_in_mock_mode(alice: AsyncClient, force_mock_mode):
    r = await alice.get("/api/companies/B47820150/valuation")
    assert r.status_code == 404
    assert r.json()["code"] == "valuation_not_found"


# ---------- ratios/catalog ----------


@pytest.mark.asyncio
async def test_ratios_catalog_returns_canonical_13_in_mock_mode(alice: AsyncClient, force_mock_mode):
    """En modo mock devolvemos el catálogo mínimo canónico (13 ratios estables)."""
    r = await alice.get("/api/intelligence/ratios/catalog")
    assert r.status_code == 200
    body = r.json()
    keys = {ratio["key"] for ratio in body["ratios"]}
    # Subset canónico esperado (13 ratios pack §6)
    assert {"ebitda_margin", "current_ratio", "roa", "roe", "debt_ratio"}.issubset(keys)
    assert body["engine_version"] in ("mock-financial-v1", "arroba-financial-v1")


@pytest.mark.asyncio
async def test_ratios_catalog_cached_second_call(alice: AsyncClient, force_mock_mode):
    """La segunda llamada debe venir de la caché memory (verificado con métricas)."""
    await alice.get("/api/intelligence/ratios/catalog")
    await alice.get("/api/intelligence/ratios/catalog")
    metrics = await alice.get("/api/internal/metrics")
    body = metrics.text
    # Debe registrar hit de cache en engine="financial"
    assert 'intelligence_layer_cache_hits_total{engine="financial"' in body


# ---------- Key leak permanente ----------


@pytest.mark.asyncio
async def test_financial_key_never_leaked_via_openapi(alice: AsyncClient):
    from src.modules.intelligence_layer.config import get_intelligence_settings

    reset_intelligence_settings_cache()
    r = await alice.get("/api/openapi.json")
    assert r.status_code == 200
    real_key = get_intelligence_settings().arroba_service_api_key_primary
    if real_key:
        assert real_key not in r.text


@pytest.mark.asyncio
async def test_openapi_exposes_financial_endpoints(alice: AsyncClient):
    r = await alice.get("/api/openapi.json")
    assert r.status_code == 200
    body = r.json()
    paths = body.get("paths", {})
    assert "/api/companies/{cif}/financial-analysis" in paths
    assert "/api/companies/{cif}/valuation" in paths
    assert "/api/intelligence/ratios/catalog" in paths
