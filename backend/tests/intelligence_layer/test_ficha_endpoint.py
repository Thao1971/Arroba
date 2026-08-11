"""Tests end-to-end del endpoint /api/companies/{cif}/ficha (B-2.4 + HARDENING-008).

Cubre:
  * Happy path · agregador OK → `X-Ficha-Source: aggregator`, payload completo.
  * Fallback · agregador lanza `FinancialNotFoundError` → composición por sección
    (identity legacy + financial-analysis) → `X-Ficha-Source: fallback_per_section`.
  * Fallback total · agregador falla + `get_master_by_cif` también falla →
    HTTPException(404, "ficha_not_found") como respuesta final.
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


def _fake_master_record(cif: str, master_id: str = "mc_fallback_test"):
    """Construye un MasterRecord real (contrato §6.1) para inyectar en el router."""
    from src.modules.intelligence_layer.interfaces.master import (
        Classification, Contact, Financials, Identity, Location, MasterRecord, Ownership, Size,
    )
    return MasterRecord(
        master_id=master_id,
        cif_normalized=cif,
        status="active",
        identity=Identity(legal_name="ACME FALLBACK SA", commercial_name="ACME", aliases=[]),
        classification=Classification(cnae_code="2120", cnae_description="Farmacéutico", cnae_section="C"),
        location=Location(provincia="Madrid", municipio="Madrid", codigo_postal="28001", pais="ES"),
        contact=Contact(web="https://acme.example", domain="acme.example"),
        size=Size(employees_total=42, capital_social=1_000_000),
        financials=Financials(),
        ownership=Ownership(),
        officers_count=None,
        objeto_social="Fabricación farmacéutica.",
        activity="Manufacture of pharmaceutical",
        mercantile_status="activa",
        legal_form="SA",
        is_listed=False,
        sectors=["Health", "Pharma"],
        description="ACME es una compañía farmacéutica.",
        address="Calle Falsa 123, Madrid",
        autonomous_community="Madrid",
    )


@pytest.mark.asyncio
async def test_ficha_happy_path_returns_aggregator_header(alice: AsyncClient):
    """Happy path: el router devuelve una CompanyFicha completa → header aggregator."""
    from src.modules.intelligence_layer.interfaces.ficha import CompanyFicha
    from src.modules.intelligence_layer.interfaces.financial import FinancialAnalysis
    from src.modules.intelligence_layer.router import get_intelligence_router

    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(
        return_value=CompanyFicha(
            cif_normalized="B99999999",
            master_id="mc_happy",
            finances=FinancialAnalysis(cif_normalized="B99999999", has_financials=True),
            identity={"cif": "B99999999", "legal_name": "HAPPY SA"},
            ownership={"available": True},
            governance={"available": True},
            events={"available": False},
            ranking=None,
            engine_version="arroba-ficha-v1",
        )
    )

    r = await alice.get("/api/companies/B99999999/ficha")
    assert r.status_code == 200, r.text
    assert r.headers.get("X-Ficha-Source") == "aggregator"
    body = r.json()
    assert body["engine_version"] == "arroba-ficha-v1"
    assert body["finances"]["cif_normalized"] == "B99999999"
    assert body["identity"]["legal_name"] == "HAPPY SA"


@pytest.mark.asyncio
async def test_ficha_fallback_when_aggregator_notfound(alice: AsyncClient, monkeypatch):
    """HARDENING-008 · Fallback per section cuando el agregador devuelve 404.

    Simula que Intel `/company/{cif}/ficha` lanza `FinancialNotFoundError` (p.ej.
    tenant divergente prod vs preview). El endpoint compone la ficha desde
    `get_master_by_cif` (legacy identity) + `get_financial_analysis` (legacy).
    """
    from src.modules.intelligence_layer.interfaces.financial import (
        FinancialAnalysis, FinancialNotFoundError,
    )
    from src.modules.intelligence_layer.router import get_intelligence_router

    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(side_effect=FinancialNotFoundError("cif not in aggregator"))
    router.get_master_by_cif = AsyncMock(return_value=_fake_master_record("B22222222"))
    router.get_financial_analysis = AsyncMock(
        return_value=FinancialAnalysis(
            master_id="mc_fallback_test", cif_normalized="B22222222", has_financials=True,
        )
    )

    r = await alice.get("/api/companies/B22222222/ficha")
    assert r.status_code == 200, r.text
    assert r.headers.get("X-Ficha-Source") == "fallback_per_section"
    body = r.json()
    # engine_version marca la procedencia del fallback (observabilidad).
    assert body["engine_version"] == "arroba-ficha-v1-fallback"
    # identity poblada desde MasterRecord legacy, shape compatible con el agregador.
    assert body["identity"] is not None
    assert body["identity"]["cif"] == "B22222222"
    assert body["identity"]["legal_name"] == "ACME FALLBACK SA"
    assert body["identity"]["cnae_primary"]["code"] == "2120"
    assert body["identity"]["is_listed"] is False
    assert body["identity"]["sectors"] == ["Health", "Pharma"]
    # finances presente desde legacy analyze.
    assert body["finances"] is not None
    assert body["finances"]["has_financials"] is True
    # Bloques que sólo entrega el agregador → None en fallback.
    assert body["ownership"] is None
    assert body["governance"] is None
    assert body["events"] is None
    # ranking top-level = None cuando no hay finances.ranking (fake vacío).
    assert body["ranking"] is None


@pytest.mark.asyncio
async def test_ficha_fallback_404_when_identity_also_missing(alice: AsyncClient, monkeypatch):
    """HARDENING-008 · Si ambos (agregador + identity legacy) fallan con NotFound,
    devolvemos 404 canónico `ficha_not_found` (CIF realmente inexistente en Intel)."""
    from src.modules.intelligence_layer.interfaces.financial import FinancialNotFoundError
    from src.modules.intelligence_layer.interfaces.master import MasterNotFoundError
    from src.modules.intelligence_layer.router import get_intelligence_router

    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(side_effect=FinancialNotFoundError("cif not in aggregator"))
    router.get_master_by_cif = AsyncMock(side_effect=MasterNotFoundError("cif nowhere"))

    r = await alice.get("/api/companies/B00000000/ficha")
    assert r.status_code == 404, r.text
    body = r.json()
    assert body["code"] == "ficha_not_found"
    # Sin header aggregator ni fallback: la excepción final es antes de setear headers.
    assert r.headers.get("X-Ficha-Source") in (None, "fallback_per_section")  # tolerancia al framework
