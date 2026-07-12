"""Tests del FinancialProvider · Fase B.6.b.

Cubre:
  * `analyze` — 200/404/500/breaker/cache.
  * `valuation` — 200/404/mapping.
  * `ratios/catalog` — 200/mapping/cache 24h.
  * R12 permanente — Financial jamás llama a `/api/v1/master/*`.
  * Contrato interno decoupled: `engine_version="arroba-financial-v1"` (nunca el del proveedor).
"""
from __future__ import annotations

from unittest.mock import AsyncMock

import httpx
import pytest

from src.modules.intelligence_layer.cache import (
    IntelligenceCache,
    MemoryCache,
    MongoCache,
    reset_cache_for_tests,
)
from src.modules.intelligence_layer.config import (
    IntelligenceSettings,
    reset_intelligence_settings_cache,
)
from src.modules.intelligence_layer.interfaces.financial import (
    FinancialNotFoundError,
    FinancialProviderError,
)
from src.modules.intelligence_layer.providers.agency_tool.client import AgencyToolClient
from src.modules.intelligence_layer.providers.agency_tool.financial import (
    FINANCIAL_ANALYZE_PATH,
    FINANCIAL_RATIOS_CATALOG_PATH,
    FINANCIAL_VALUATION_PATH,
    INTERNAL_ENGINE_VERSION,
    AgencyToolFinancialProvider,
)
from src.modules.intelligence_layer.router import (
    IntelligenceRouter,
    reset_intelligence_router_for_tests,
)


def _mk_response(status: int, body: dict | None = None) -> httpx.Response:
    return httpx.Response(status, json=body or {})


def _mk_client_with(*responses: httpx.Response) -> AgencyToolClient:
    client = AgencyToolClient(
        IntelligenceSettings(agency_tool_mode="real", arroba_service_api_key_primary="k")
    )
    client.request = AsyncMock(side_effect=list(responses))  # type: ignore[method-assign]
    return client


@pytest.fixture(autouse=True)
def _reset_all():
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()
    yield
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()


# ------------- analyze -------------


# ------------- analyze (F0.2 · shape con statements + evolution) -------------


@pytest.mark.asyncio
async def test_analyze_maps_f02_shape_statements_wrapper_and_evolution():
    """Verifica el shape F0.2 real del Intelligence Engine (TOTALENERGIES).

    Comprueba:
      * `statements.{income_statement, balance_sheet, cashflow, year, basis}`.
      * `evolution.points[]` → `years` derivado + `evolution` propagado.
      * `explainability.data_source` → `data_source` en contrato interno.
      * `assessment.{strengths, weaknesses, risks}` → `financial_quality.*`.
      * `cashflow: null` propagado (COMP-3005 BLOCKED en UI).
    """
    body = {
        "master_id": "mc_80e03f1e1627",
        "cif_normalized": "A87803862",
        "identity": {
            "name": "TOTALENERGIES ELECTRICIDAD Y GAS ESPAÑA",
            "cnae_code": "3515",
            "cnae_section": "D",
            "provincia": "MADRID",
        },
        "has_financials": True,
        "statements": {
            "year": 2024,
            "basis": "individual",
            "income_statement": {
                "revenue": 933267000.0,
                "supplies": -868893000.0,
                "personnel_costs": -6320000.0,
                "operating_income": 35519000.0,
                "depreciation": -1025000.0,
                "ebitda": 36544000.0,
                "ebit": 35519000.0,
                "financial_expenses": -2184000.0,
                "net_income": 25017000.0,
            },
            "balance_sheet": {
                "non_current_assets": 7670000.0,
                "current_assets": 180533000.0,
                "cash": 1000.0,
                "total_assets": 188203000.0,
                "equity": 30531000.0,
                "non_current_liabilities": 4189000.0,
                "current_liabilities": 153483000.0,
                "financial_debt": 904000.0,
                "total_liabilities": 157672000.0,
            },
            "cashflow": None,
            "employees": 79,
        },
        "kpis": {
            "revenue": 933267000.0,
            "ebitda": 36544000.0,
            "ebit": 35519000.0,
            "net_income": 25017000.0,
            "revenue_growth_yoy": -0.2757,
            "ebitda_margin": 0.0392,
            "net_margin": 0.0268,
        },
        "ratios": {
            "ebitda_margin": {"value": 0.0392, "name": "Margen EBITDA"},
        },
        "evolution": {
            "trend": "deterioration",
            "years": 3,
            "anomaly": False,
            "revenue_growth_yoy": -0.2757,
            "points": [
                {"year": 2024, "revenue": 933267000.0, "ebitda": 36544000.0, "net_income": 25017000.0},
                {"year": 2023, "revenue": 1288562000.0, "ebitda": 23984000.0, "net_income": 14425000.0},
                {"year": 2022, "revenue": 2229436000.0, "ebitda": 1009000.0, "net_income": -460000.0},
            ],
        },
        "financial_quality": {
            "score": 100,
            "max": 100,
            "rules": [{"rule": "Estados financieros disponibles", "points": 20, "max": 20, "passed": True}],
            "method": "rules_based",
            "ai_used": False,
        },
        "assessment": {
            "strengths": [],
            "weaknesses": ["Baja autonomía financiera (PN/Activo <20%)"],
            "risks": ["Tendencia de ingresos a la baja"],
        },
        "explainability": {
            "data_source": "master_companies + norm_financials (Iberinform)",
            "source_version": "iberinform",
            "basis": "individual",
            "year": 2024,
            "rules_applied": "KPIs/ratios/quality deterministas; valoración por múltiplos inferidos",
            "ai_used": False,
        },
        "engine_version": "financial-intelligence-v1",
        "generated_at": "2026-07-12T21:53:22.602413+00:00",
        "confidence": 1.0,
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolFinancialProvider(client=client)

    result = await provider.analyze("A87803862")

    # ---- Shape statements ----
    assert result.has_financials is True
    assert result.year == 2024
    assert result.basis == "individual"
    assert result.income_statement.revenue == 933267000.0
    assert result.income_statement.ebitda == 36544000.0
    assert result.balance_sheet.total_assets == 188203000.0
    assert result.balance_sheet.equity == 30531000.0
    # ---- Cash Flow BLOCKED (proveedor devuelve null) ----
    assert result.cashflow is None
    # ---- Evolution real: 3 ejercicios sin interpolación (R15) ----
    assert result.evolution is not None
    assert result.evolution["trend"] == "deterioration"
    assert len(result.evolution["points"]) == 3
    assert result.years == [2024, 2023, 2022]
    # ---- Explainability + data_source (P1) ----
    assert result.data_source == "master_companies + norm_financials (Iberinform)"
    assert result.source_version == "iberinform"
    assert result.explainability["rules_applied"].startswith("KPIs/ratios/quality")
    # ---- Assessment → financial_quality ----
    assert result.financial_quality.score == 100
    assert result.financial_quality.weaknesses == ["Baja autonomía financiera (PN/Activo <20%)"]
    assert result.financial_quality.risks == ["Tendencia de ingresos a la baja"]
    # ---- Identity extract (cnae_* desde identity.*) ----
    assert result.cnae_code == "3515"
    assert result.cnae_section == "D"
    assert result.provincia == "MADRID"
    # ---- R5: contrato interno decoupled ----
    assert result.engine_version == INTERNAL_ENGINE_VERSION
    assert result.engine_version != "financial-intelligence-v1"


@pytest.mark.asyncio
async def test_analyze_years_never_interpolated_r15():
    """R15: si `evolution.points` sólo tiene 1 año, `years` debe reflejarlo sin inventar."""
    body = {
        "master_id": "mc_x", "cif_normalized": "A11111111",
        "has_financials": True,
        "statements": {"year": 2024, "basis": "individual", "income_statement": {"revenue": 100.0}, "balance_sheet": {"total_assets": 200.0}, "cashflow": None},
        "evolution": {"trend": "flat", "years": 1, "anomaly": False, "points": [{"year": 2024, "revenue": 100.0}]},
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolFinancialProvider(client=client)
    result = await provider.analyze("A11111111")
    assert result.years == [2024]
    assert result.evolution["points"][0]["year"] == 2024


@pytest.mark.asyncio
async def test_analyze_backward_compat_flat_shape():
    """B.6.b: shape previo sin `statements` wrapper sigue mapeando correctamente."""
    body = {
        "master_id": "mc_abc",
        "cif_normalized": "B47820150",
        "has_financials": True,
        "year": 2024,
        "years": [2022, 2023, 2024],
        "basis": "individual",
        "income_statement": {"revenue": 12_500_000.0, "net_income": 2_100_000.0},
        "balance_sheet": {"total_assets": 22_000_000.0, "equity": 8_500_000.0},
        "kpis": {"revenue": 12_500_000.0, "ebitda": 3_200_000.0},
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolFinancialProvider(client=client)
    result = await provider.analyze("B47820150")
    assert result.income_statement.revenue == 12_500_000.0
    assert result.balance_sheet.equity == 8_500_000.0
    assert result.year == 2024
    assert result.years == [2022, 2023, 2024]
    assert result.evolution is None


@pytest.mark.asyncio
async def test_analyze_maps_full_payload_to_internal_schema():
    body = {
        "master_id": "mc_abc",
        "cif_normalized": "B47820150",
        "identity": {"legal_name": "Acme SL", "cif": "B47820150"},
        "cnae_code": "70.22",
        "cnae_section": "M",
        "provincia": "Madrid",
        "has_financials": True,
        "financials_source": "iberinform",
        "audited": True,
        "basis": "individual",
        "year": 2024,
        "years": [2022, 2023, 2024],
        "kpis": {
            "revenue": 12_500_000, "ebitda": 3_200_000, "ebitda_margin": 0.256,
            "employees_total": 45, "revenue_growth_yoy": 0.12, "revenue_cagr": 0.09,
        },
        "income_statement": {
            "revenue": 12_500_000, "operating_income": 3_100_000, "net_income": 2_100_000,
        },
        "balance_sheet": {"total_assets": 22_000_000, "equity": 8_500_000},
        "ratios": {"ebitda_margin": 0.256, "current_ratio": 1.4, "roe": 0.18},
        "financial_quality": {"score": 78, "assessment": "solid", "strengths": ["margin"]},
        "solvency": {"level": "high"},
        "engine_version": "financial-intelligence-v1",
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolFinancialProvider(client=client)

    result = await provider.analyze("B47820150")

    # ---- Verifica que el client fue llamado con el path correcto y payload ----
    args, kwargs = client.request.await_args
    assert args[0] == "POST" and args[1] == FINANCIAL_ANALYZE_PATH
    assert kwargs["json"] == {"identifier": "B47820150"}

    # ---- Mapeo ----
    assert result.master_id == "mc_abc"
    assert result.cif_normalized == "B47820150"
    assert result.has_financials is True
    assert result.kpis.revenue == 12_500_000
    assert result.kpis.ebitda_margin == 0.256
    assert result.income_statement.net_income == 2_100_000
    assert result.balance_sheet.equity == 8_500_000
    assert result.ratios["current_ratio"] == 1.4
    assert result.financial_quality.score == 78
    # ---- R5 · Contrato interno decoupled ----
    assert result.engine_version == INTERNAL_ENGINE_VERSION == "arroba-financial-v1"
    # NUNCA emitimos el engine_version del proveedor al frontend
    assert result.engine_version != "financial-intelligence-v1"


@pytest.mark.asyncio
async def test_analyze_raises_not_found_on_404():
    client = _mk_client_with(
        _mk_response(404, {"detail": "company not found in Master Layer"})
    )
    provider = AgencyToolFinancialProvider(client=client)
    with pytest.raises(FinancialNotFoundError):
        await provider.analyze("B99999999")


@pytest.mark.asyncio
async def test_analyze_raises_provider_error_on_5xx():
    client = _mk_client_with(_mk_response(503, {"detail": "unavailable"}))
    provider = AgencyToolFinancialProvider(client=client)
    with pytest.raises(FinancialProviderError) as exc_info:
        await provider.analyze("B47820150")
    assert exc_info.value.error_class == "server_5xx"


@pytest.mark.asyncio
async def test_analyze_raises_unauthorized_on_401():
    client = _mk_client_with(_mk_response(401, {"detail": "bad key"}))
    provider = AgencyToolFinancialProvider(client=client)
    with pytest.raises(FinancialProviderError) as exc_info:
        await provider.analyze("B47820150")
    assert exc_info.value.error_class == "unauthorized"


# ------------- valuation -------------


@pytest.mark.asyncio
async def test_valuation_maps_payload_with_comparables():
    body = {
        "master_id": "mc_abc",
        "cif_normalized": "B47820150",
        "valuation": {
            "method": "market_multiples",
            "multiple": 6.5,
            "multiple_basis": "EBITDA",
            "enterprise_value": 20_800_000,
            "equity_value": 18_300_000,
            "range": {"low": 17_500_000, "high": 22_200_000},
            "subject_ebitda_margin_percentile": 0.72,
        },
        "comparables": {
            "peers": [
                {"master_id": "mc_peer1", "name": "Peer 1", "ebitda_margin": 0.24, "multiple": 6.2},
                {"master_id": "mc_peer2", "name": "Peer 2", "ebitda_margin": 0.29, "multiple": 6.9},
            ],
            "criteria": {"same_cnae_section": True, "same_size_band": True},
            "count": 2,
        },
        "confidence": 0.78,
        "explanation": "Aplica múltiplo mediano de EBITDA de peers en sector M.",
        "engine_version": "financial-intelligence-v1",
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolFinancialProvider(client=client)

    result = await provider.valuation("B47820150")

    args, _ = client.request.await_args
    assert args[1] == FINANCIAL_VALUATION_PATH

    assert result.valuation.method == "market_multiples"
    assert result.valuation.multiple == 6.5
    assert result.valuation.range.low == 17_500_000
    assert result.valuation.range.high == 22_200_000
    assert len(result.comparables.peers) == 2
    assert result.comparables.peers[0].master_id == "mc_peer1"
    assert result.confidence == 0.78
    assert result.engine_version == INTERNAL_ENGINE_VERSION


@pytest.mark.asyncio
async def test_valuation_raises_not_found_on_404():
    client = _mk_client_with(_mk_response(404))
    provider = AgencyToolFinancialProvider(client=client)
    with pytest.raises(FinancialNotFoundError):
        await provider.valuation("B99999999")


# ------------- ratios/catalog -------------


@pytest.mark.asyncio
async def test_ratios_catalog_maps_response():
    body = {
        "ratios": [
            {"key": "ebitda_margin", "name": "Margen EBITDA", "category": "profitability",
             "formula": "EBITDA / Ingresos", "explanation": "Rentabilidad operativa."},
            {"key": "current_ratio", "name": "Ratio de liquidez", "category": "liquidity",
             "formula": "Activo corriente / Pasivo corriente"},
        ],
        "source": "Iberinform statements (Normalized Layer)",
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolFinancialProvider(client=client)

    cat = await provider.ratios_catalog()

    args, _ = client.request.await_args
    assert args[1] == FINANCIAL_RATIOS_CATALOG_PATH
    assert len(cat.ratios) == 2
    assert cat.ratios[0].key == "ebitda_margin"
    assert cat.ratios[0].formula == "EBITDA / Ingresos"
    assert cat.engine_version == INTERNAL_ENGINE_VERSION


# ------------- R12 permanente Financial -------------


@pytest.mark.asyncio
async def test_financial_provider_never_calls_master_admin():
    """20 llamadas Financial + valuation + catalog → 0 requests a `/master/*`."""
    responses = [_mk_response(200, {"master_id": f"mc_{i}", "has_financials": False, "kpis": {}, "engine_version": "v1"}) for i in range(30)]
    client = _mk_client_with(*responses)
    provider = AgencyToolFinancialProvider(client=client)

    for i in range(20):
        await provider.analyze(f"B{i:08d}")
    await provider.valuation("B00000001")
    # ratios catalog usa GET; usamos response con estructura mínima
    client.request.side_effect = [_mk_response(200, {"ratios": [], "source": "test"})]
    await provider.ratios_catalog()

    all_paths = [call.args[1] for call in client.request.await_args_list]
    for p in all_paths:
        assert "/master/" not in p, f"R12 VIOLATION: Financial llamó a {p}"
    assert set(all_paths).issubset(
        {FINANCIAL_ANALYZE_PATH, FINANCIAL_VALUATION_PATH, FINANCIAL_RATIOS_CATALOG_PATH}
    )


# ------------- Router integration: cache + metrics -------------


@pytest.mark.asyncio
async def test_router_caches_financial_analysis(mock_db):
    """Segunda llamada al mismo CIF debe venir de cache (1 solo fetch)."""
    from src.modules.intelligence_layer.interfaces.financial import FinancialProvider

    class _FakeFinancial(FinancialProvider):
        provider_name = "agency_tool"
        analyze = AsyncMock()  # type: ignore[assignment]
        valuation = AsyncMock()
        ratios_catalog = AsyncMock()

    settings = IntelligenceSettings(agency_tool_mode="real",
                                    arroba_service_api_key_primary="k")
    router = IntelligenceRouter(
        settings=settings,
        cache=IntelligenceCache(memory=MemoryCache(), mongo=MongoCache()),
    )
    from src.modules.intelligence_layer.interfaces.financial import FinancialAnalysis

    fake = _FakeFinancial()
    fake.analyze = AsyncMock(  # type: ignore[method-assign]
        return_value=FinancialAnalysis(
            master_id="mc1", cif_normalized="B47820150",
            has_financials=True, engine_version="arroba-financial-v1"
        )
    )
    router._financial_provider = fake

    r1 = await router.get_financial_analysis("B47820150")
    r2 = await router.get_financial_analysis("B47820150")
    assert r1.master_id == r2.master_id == "mc1"
    assert fake.analyze.await_count == 1  # cache hit en 2ª llamada


@pytest.mark.asyncio
async def test_router_records_financial_metrics_in_prometheus(mock_db):
    from src.modules.intelligence_layer.observability import REGISTRY

    settings = IntelligenceSettings(agency_tool_mode="real",
                                    arroba_service_api_key_primary="k")
    router = IntelligenceRouter(
        settings=settings,
        cache=IntelligenceCache(memory=MemoryCache(), mongo=MongoCache()),
    )
    from src.modules.intelligence_layer.interfaces.financial import (
        FinancialAnalysis,
        FinancialProvider,
    )

    class _F(FinancialProvider):
        provider_name = "agency_tool"

        async def analyze(self, cif: str) -> FinancialAnalysis:
            return FinancialAnalysis(cif_normalized=cif, engine_version="arroba-financial-v1")

        async def valuation(self, cif):
            raise NotImplementedError

        async def ratios_catalog(self):
            raise NotImplementedError

    router._financial_provider = _F()
    await router.get_financial_analysis("B47820150")

    from prometheus_client import generate_latest

    body = generate_latest(REGISTRY).decode()
    assert 'engine="financial"' in body
    assert 'method="analyze"' in body
