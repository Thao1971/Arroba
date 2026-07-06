"""Tests end-to-end de los endpoints canónicos UI (B.6.f · D2).

Cubre:
  * GET /api/companies/{cif}/section/identity   → `IdentitySection`
  * GET /api/companies/{cif}/section/financial  → `FinancialSection`
  * GET /api/companies/{cif}/section/valuation  → `ValuationSection`
  * GET /api/companies/{cif}/section/semantic   → `SemanticSection`

Comprobaciones clave (R5 · zero coupling FE↔proveedor externo):
  * `metadata.engine_version` empieza por `arroba-` (nunca `*-intelligence-*`).
  * `metadata.source` NO menciona "Agency Tool", "agency_tool", "proveedor",
    ni el nombre técnico del engine externo.
  * En modo mock (Master Layer vacío) `coverage.*=False` y NO devuelve 404
    (degradación limpia hacia `UnavailableBlock` en la UI).
  * Auth requerida en los 4.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from src.modules.intelligence_layer.cache import reset_cache_for_tests
from src.modules.intelligence_layer.config import reset_intelligence_settings_cache
from src.modules.intelligence_layer.router import reset_intelligence_router_for_tests


PROVIDER_LEAK_TOKENS = (
    "financial-intelligence-v1",
    "semantic-intelligence-v1",
    "agency_tool",
    "Agency Tool",
    "X-API-Key",
    "arroba_service_api_key",
)


@pytest.fixture(autouse=True)
def _reset_intel_state():
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()
    yield
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()


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


async def _seed_master(mock_db, cif: str = "B47820150", **overrides) -> dict:
    from datetime import UTC, datetime

    doc = {
        "master_company_id": "mc_test001",
        "cif": cif,
        "legal_name": "Castilla Termal SL",
        "sector": "Servicios turísticos",
        "region": "Valladolid",
        "country": "ES",
        "financials": {
            "revenue": 12_500_000,
            "ebitda": 3_200_000,
            "employees": 45,
            "fiscal_year": 2024,
        },
        "confidence": 0.9,
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    doc.update(overrides)
    await mock_db.master_companies_mock.insert_one(doc)
    return doc


# ============================================================
# Auth
# ============================================================


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "path",
    [
        "/api/companies/B47820150/section/identity",
        "/api/companies/B47820150/section/financial",
        "/api/companies/B47820150/section/valuation",
        "/api/companies/B47820150/section/semantic",
    ],
)
async def test_section_endpoints_require_auth(client: AsyncClient, path: str):
    r = await client.get(path)
    assert r.status_code == 401, f"{path} → {r.status_code}"


# ============================================================
# /section/identity
# ============================================================


@pytest.mark.asyncio
async def test_identity_section_returns_canonical_ui_schema(
    alice: AsyncClient, mock_db, force_mock_mode
):
    await _seed_master(mock_db)
    r = await alice.get("/api/companies/B47820150/section/identity")
    assert r.status_code == 200, r.text
    body = r.json()

    # ---- estructura canónica UI ----
    assert body["legal_name"] == "Castilla Termal SL"
    assert body["classification"]["cnae_description"] == "Servicios turísticos"
    assert body["location"]["provincia"] == "Valladolid"
    assert body["size"]["employees_total"] == 45

    # ---- coverage explícito ----
    cov = body["coverage"]
    assert cov["core"] is True
    assert cov["ownership"] is False
    assert cov["officers"] is False
    assert cov["objeto_social"] is False

    # ---- explainability slot presente (siempre null en B.6.f) ----
    assert body["explainability"] is None

    # ---- R5 · engine_version canónico + zero leak ----
    assert body["metadata"]["engine_version"] == "arroba-identity-v1"
    assert body["metadata"]["source"] is not None
    for tok in PROVIDER_LEAK_TOKENS:
        assert tok not in r.text, f"provider leak `{tok}` en /section/identity"

    # ---- headers ----
    assert r.headers.get("X-Section-Engine") == "arroba-identity-v1"


@pytest.mark.asyncio
async def test_identity_section_404_when_master_layer_empty(
    alice: AsyncClient, mock_db, force_mock_mode
):
    r = await alice.get("/api/companies/B99999999/section/identity")
    assert r.status_code == 404
    assert r.json()["code"] == "identity_not_found"


# ============================================================
# /section/financial
# ============================================================


@pytest.mark.asyncio
async def test_financial_section_empty_coverage_when_master_layer_vacio(
    alice: AsyncClient, mock_db, force_mock_mode
):
    """Master Layer vacío → 200 con `coverage.*=False`. NO 404.

    Este es el comportamiento canónico que la UI espera para degradar a
    `UnavailableBlock` en cada sub-bloque de Finanzas (Regla G4 · copy
    "Estamos consolidando esta información").
    """
    r = await alice.get("/api/companies/B47820150/section/financial")
    assert r.status_code == 200, r.text
    body = r.json()
    cov = body["metadata"]["coverage"]
    assert cov == {
        "evolution": False,
        "profit_loss": False,
        "balance": False,
        "ratios": False,
    }
    assert body["evolution"] is None
    assert body["profit_loss"] is None
    assert body["balance"] is None
    assert body["ratios"] is None
    assert body["explainability"] is None
    assert body["annotations"] == []
    assert body["metadata"]["engine_version"] == "arroba-financial-v1"
    for tok in PROVIDER_LEAK_TOKENS:
        assert tok not in r.text
    assert r.headers.get("X-Section-Engine") == "arroba-financial-v1"


@pytest.mark.asyncio
async def test_financial_section_with_injected_provider_maps_ui_shape(
    alice: AsyncClient, monkeypatch
):
    """Con un provider inyectado que devuelve datos, verifica el mapping D2."""
    from src.modules.intelligence_layer.interfaces.financial import (
        BalanceSheet,
        FinancialAnalysis,
        FinancialKpis,
        FinancialProvider,
        IncomeStatement,
        RatiosCatalog,
        RatioDefinition,
    )
    from src.modules.intelligence_layer.router import get_intelligence_router

    class _FakeFin(FinancialProvider):
        provider_name = "agency_tool_test"

        async def analyze(self, cif):
            return FinancialAnalysis(
                master_id="mc_ui_test",
                cif_normalized=cif,
                has_financials=True,
                year=2024,
                years=[2022, 2023, 2024],
                kpis=FinancialKpis(
                    revenue=12_500_000,
                    ebitda=3_200_000,
                    net_income=2_100_000,
                    evolution={
                        "revenue": [10_000_000, 11_000_000, 12_500_000],
                        "ebitda": [2_400_000, 2_800_000, 3_200_000],
                        "net_income": [1_500_000, 1_800_000, 2_100_000],
                    },
                ),
                income_statement=IncomeStatement(
                    revenue=12_500_000,
                    ebitda=3_200_000,
                    ebit=2_800_000,
                    net_income=2_100_000,
                ),
                balance_sheet=BalanceSheet(
                    total_assets=22_000_000,
                    equity=8_500_000,
                    financial_debt=5_000_000,
                ),
                ratios={"current_ratio": 1.4, "roe": 0.18, "debt_ratio": 0.35},
                engine_version="arroba-financial-v1",
            )

        async def valuation(self, cif):
            raise NotImplementedError

        async def ratios_catalog(self):
            return RatiosCatalog(
                ratios=[
                    RatioDefinition(
                        key="current_ratio",
                        name="Ratio de liquidez",
                        category="liquidity",
                        formula="Activo corriente / Pasivo corriente",
                    ),
                    RatioDefinition(
                        key="roe",
                        name="Rentabilidad sobre fondos propios",
                        category="profitability",
                        formula="Beneficio neto / Patrimonio neto",
                    ),
                    RatioDefinition(
                        key="debt_ratio",
                        name="Ratio de endeudamiento",
                        category="solvency",
                        formula="Deuda total / Patrimonio neto",
                    ),
                ],
                engine_version="arroba-financial-v1",
            )

    r_router = get_intelligence_router()
    r_router._financial_provider = _FakeFin()

    r = await alice.get("/api/companies/B47820150/section/financial")
    assert r.status_code == 200, r.text
    body = r.json()

    # evolution multi-serie
    assert body["evolution"] is not None
    assert body["evolution"]["years"] == [2022, 2023, 2024]
    keys = {s["key"] for s in body["evolution"]["series"]}
    assert keys == {"revenue", "ebitda", "net_income"}

    # P&L multi-año con celdas por año (year más reciente poblado, previos None)
    assert body["profit_loss"] is not None
    assert body["profit_loss"]["years"] == [2022, 2023, 2024]
    revenue_row = next(r for r in body["profit_loss"]["rows"] if r["key"] == "revenue")
    assert revenue_row["category"] == "total"
    assert len(revenue_row["values"]) == 3
    assert revenue_row["values"][-1]["value"] == 12_500_000
    assert revenue_row["values"][-1]["format"] == "currency"
    assert revenue_row["values"][0]["value"] is None  # R4: no calculamos años previos

    # Balance
    assert body["balance"] is not None
    equity_row = next(r for r in body["balance"]["rows"] if r["key"] == "equity")
    assert equity_row["category"] == "total"
    assert equity_row["values"][-1]["value"] == 8_500_000

    # Ratios (categorizados desde catalog)
    assert body["ratios"] is not None
    ratio_map = {r["key"]: r for r in body["ratios"]["items"]}
    assert ratio_map["current_ratio"]["category"] == "liquidity"
    assert ratio_map["roe"]["category"] == "profitability"
    assert ratio_map["roe"]["formula"] == "Beneficio neto / Patrimonio neto"
    assert ratio_map["debt_ratio"]["category"] == "solvency"

    # coverage completo
    cov = body["metadata"]["coverage"]
    assert cov == {"evolution": True, "profit_loss": True, "balance": True, "ratios": True}

    # Explainability slot presente (D3) y siempre null en B.6.f
    assert body["explainability"] is None

    # R5 · Zero leak
    for tok in PROVIDER_LEAK_TOKENS:
        assert tok not in r.text, f"provider leak `{tok}` en /section/financial"


# ============================================================
# /section/valuation
# ============================================================


@pytest.mark.asyncio
async def test_valuation_section_empty_when_master_layer_vacio(
    alice: AsyncClient, mock_db, force_mock_mode
):
    r = await alice.get("/api/companies/B47820150/section/valuation")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["coverage"] == {"valuation": False, "peers": False}
    assert body["metadata"]["engine_version"] == "arroba-financial-v1"
    for tok in PROVIDER_LEAK_TOKENS:
        assert tok not in r.text


# ============================================================
# /section/semantic
# ============================================================


@pytest.mark.asyncio
async def test_semantic_section_empty_when_master_layer_vacio(
    alice: AsyncClient, mock_db, force_mock_mode
):
    r = await alice.get("/api/companies/B47820150/section/semantic")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["coverage"] == {"profile": False, "similar": False}
    assert body["metadata"]["engine_version"] == "arroba-semantic-v1"
    for tok in PROVIDER_LEAK_TOKENS:
        assert tok not in r.text


# ============================================================
# Regresión canónica: source strings NO mencionan proveedor
# ============================================================


@pytest.mark.asyncio
async def test_section_sources_never_mention_provider(
    alice: AsyncClient, mock_db, force_mock_mode
):
    """`metadata.source` es user-facing. Regla R5: nunca menciona nombres
    técnicos del proveedor. Cadenas prohibidas:
      - "Agency Tool", "agency_tool"
      - "financial-intelligence", "semantic-intelligence"
      - "proveedor externo"
    """
    await _seed_master(mock_db)
    forbidden = (
        "Agency Tool",
        "agency_tool",
        "financial-intelligence",
        "semantic-intelligence",
        "proveedor externo",
    )
    for path in (
        "/api/companies/B47820150/section/identity",
        "/api/companies/B47820150/section/financial",
        "/api/companies/B47820150/section/valuation",
        "/api/companies/B47820150/section/semantic",
    ):
        r = await alice.get(path)
        assert r.status_code == 200, f"{path}: {r.status_code} {r.text}"
        source = (r.json().get("metadata") or {}).get("source", "")
        for f in forbidden:
            assert f not in source, f"'{f}' aparece en {path} · source={source!r}"
