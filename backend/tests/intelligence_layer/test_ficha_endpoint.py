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


# ================================================================
# B-2.3 · DPD backend Governance (2026-08-11)
# Anonymous aggregation · Auth passthrough · available:false passthrough.
# ================================================================


def _fake_governance_nominal() -> dict:
    """Payload nominal (con `officers[]`) como emite Intel para authenticated."""
    return {
        "identifier": "B28184687",
        "cif": "B28184687",
        "available": True,
        "officers": [
            {"name": "Persona Uno", "role": "Administrador Solidario", "since": "2020-01-01", "year": 2020},
            {"name": "Persona Dos", "role": "Administrador Solidario", "since": "2021-01-01", "year": 2021},
            {"name": "Persona Tres", "role": "Administrador Solidario", "since": "2022-01-01", "year": 2022},
            {"name": "Persona Cuatro", "role": "Apoderado", "since": "2020-01-01", "year": 2020},
            {"name": "Persona Cinco", "role": "Apoderado", "since": "2021-01-01", "year": 2021},
            {"name": "Persona Seis", "role": "Auditor", "since": "2023-01-01", "year": 2023},
        ],
        "coverage": {"officers_count": 6},
        "engine_version": "arroba-company-ficha-v1",
    }


def _fake_ficha_with_governance(governance: dict | None):
    """CompanyFicha stub con governance parametrizado (resto de bloques mínimos)."""
    from src.modules.intelligence_layer.interfaces.ficha import CompanyFicha
    from src.modules.intelligence_layer.interfaces.financial import FinancialAnalysis
    return CompanyFicha(
        cif_normalized="B28184687",
        master_id="mc_governance_test",
        finances=FinancialAnalysis(cif_normalized="B28184687", has_financials=True),
        identity={"cif": "B28184687", "legal_name": "SERVIER TEST SA"},
        ownership={"available": True},
        governance=governance,
        events={"available": False},
        ranking=None,
        engine_version="arroba-ficha-v1",
    )


@pytest.mark.asyncio
async def test_ficha_governance_dpd_anonymous_aggregates_no_pii(client: AsyncClient):
    """B-2.3 · Anónimo NO recibe `officers` nominales · sí recibe `summary` agregado.

    Regla DPD: si `governance.available:true`, el backend transforma la lista
    nominal a un `summary` con `total` + `roles[]` (role/role_label/count),
    y ELIMINA la clave `officers`. Cero PII en la respuesta.
    """
    from src.modules.intelligence_layer.router import get_intelligence_router

    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(
        return_value=_fake_ficha_with_governance(_fake_governance_nominal())
    )

    # Cliente anónimo (sin cookie).
    r = await client.get("/api/companies/B28184687/ficha")
    assert r.status_code == 200, r.text
    body = r.json()
    gov = body["governance"]
    assert gov is not None
    assert gov["available"] is True
    # PII: la clave `officers` NO existe en modo anónimo.
    assert "officers" not in gov, f"PII leak · officers present in anon payload: {gov}"
    # `summary` agregado presente.
    assert "summary" in gov
    assert gov["summary"]["total"] == 6
    roles = gov["summary"]["roles"]
    assert isinstance(roles, list) and len(roles) == 3
    # Ordenación determinista: count desc, luego role_label alfabético asc.
    assert roles[0]["role_label"] == "Administrador Solidario"
    assert roles[0]["count"] == 3
    assert roles[0]["role"] == "administrador_solidario"
    assert roles[1]["role_label"] == "Apoderado"
    assert roles[1]["count"] == 2
    assert roles[2]["role_label"] == "Auditor"
    assert roles[2]["count"] == 1
    # `coverage` original preservado.
    assert gov["coverage"] == {"officers_count": 6}
    # `finances` gated para anónimo (mixed-access baseline).
    assert body["finances"] is None
    # Adicional grep de fuga · ningún nombre de persona en el body serializado.
    raw = r.text
    for name in ("Persona Uno", "Persona Dos", "Persona Tres", "Persona Cuatro", "Persona Cinco", "Persona Seis"):
        assert name not in raw, f"PII leak in serialized body: {name}"


@pytest.mark.asyncio
async def test_ficha_governance_dpd_auth_passthrough_with_officers(alice: AsyncClient):
    """B-2.3 · Autenticado recibe passthrough completo · `officers[]` nominales intactos."""
    from src.modules.intelligence_layer.router import get_intelligence_router

    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(
        return_value=_fake_ficha_with_governance(_fake_governance_nominal())
    )

    r = await alice.get("/api/companies/B28184687/ficha")
    assert r.status_code == 200, r.text
    body = r.json()
    gov = body["governance"]
    assert gov is not None
    assert gov["available"] is True
    # PII intacta para autenticado.
    assert "officers" in gov
    officers = gov["officers"]
    assert len(officers) == 6
    assert officers[0]["name"] == "Persona Uno"
    assert officers[0]["role"] == "Administrador Solidario"
    # NO se emite `summary` cuando pasa nominal (no aporta valor y no está en el contrato Intel).
    assert "summary" not in gov
    # `finances` NO nullificado para autenticado.
    assert body["finances"] is not None


@pytest.mark.asyncio
async def test_ficha_governance_dpd_available_false_passthrough_both_modes(
    client: AsyncClient, alice: AsyncClient
):
    """B-2.3 · `governance.available:false` → passthrough idéntico para anon y auth.

    Cuando Intel no tiene datos de gobernanza, no hay PII que proteger; el
    bloque baja tal cual (`available:false`) para que el frontend renderice
    `<Empty/>`.
    """
    from src.modules.intelligence_layer.router import get_intelligence_router

    unavailable_gov = {
        "identifier": "B00000001",
        "cif": "B00000001",
        "available": False,
        "engine_version": "arroba-company-ficha-v1",
    }

    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(
        return_value=_fake_ficha_with_governance(unavailable_gov)
    )

    r_anon = await client.get("/api/companies/B00000001/ficha")
    assert r_anon.status_code == 200, r_anon.text
    gov_anon = r_anon.json()["governance"]
    assert gov_anon == unavailable_gov, f"passthrough anon rompe shape: {gov_anon}"

    # Reset del mock para el auth (mismo lock del router es global).
    router.get_company_ficha = AsyncMock(
        return_value=_fake_ficha_with_governance(unavailable_gov)
    )
    r_auth = await alice.get("/api/companies/B00000001/ficha")
    assert r_auth.status_code == 200, r_auth.text
    gov_auth = r_auth.json()["governance"]
    assert gov_auth == unavailable_gov, f"passthrough auth rompe shape: {gov_auth}"

# ================================================================
# B-2.2 · DPD backend Ownership (2026-08-11)
# Anonymous aggregation (sin nombres) · Auth passthrough · available:false passthrough.
# ================================================================


def _fake_ownership_nominal() -> dict:
    """Payload nominal Intel para Servier (`B28184687`) autenticado."""
    return {
        "identifier": "B28184687",
        "cif": "B28184687",
        "available": True,
        "shareholders": [
            {"name": "SERVIER INTERNATIONAL, BV", "cif": None, "pct": 73.35, "as_of_year": 2024},
            {"name": "ARTS ET TECHNIQUES DU PROGRES", "cif": None, "pct": 26.65, "as_of_year": 2024},
        ],
        "control": {
            "controlling_shareholder": "SERVIER INTERNATIONAL, BV",
            "top1_pct": 73.35,
            "top1_name": "SERVIER INTERNATIONAL, BV",
            "tier": "Control mayoritario",
        },
        "coverage": {"shareholders_count": 2},
        "engine_version": "arroba-company-ficha-v1",
    }


def _fake_ficha_with_ownership(ownership: dict | None):
    """CompanyFicha stub con ownership parametrizado."""
    from src.modules.intelligence_layer.interfaces.ficha import CompanyFicha
    from src.modules.intelligence_layer.interfaces.financial import FinancialAnalysis
    return CompanyFicha(
        cif_normalized="B28184687",
        master_id="mc_ownership_test",
        finances=FinancialAnalysis(cif_normalized="B28184687", has_financials=True),
        identity={"cif": "B28184687", "legal_name": "SERVIER TEST SA"},
        ownership=ownership,
        governance={"available": False},
        events={"available": False},
        ranking=None,
        engine_version="arroba-ficha-v1",
    )


@pytest.mark.asyncio
async def test_ficha_ownership_dpd_anonymous_hides_all_names(client: AsyncClient):
    """B-2.2 · Anónimo NO recibe nombres (ni físicos ni jurídicos) · sí `summary`.

    Regla DPD simplificada (2026-08-11): sin discriminación tipo → todos los
    nombres ocultos en anónimo. Solo `total_shareholders` + `tier` (opcional)
    + `top1_pct` (opcional, sin nombre).
    """
    from src.modules.intelligence_layer.router import get_intelligence_router

    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(
        return_value=_fake_ficha_with_ownership(_fake_ownership_nominal())
    )

    r = await client.get("/api/companies/B28184687/ficha")
    assert r.status_code == 200, r.text
    body = r.json()
    own = body["ownership"]
    assert own is not None
    assert own["available"] is True
    # PII: la clave `shareholders` NO existe en modo anónimo.
    assert "shareholders" not in own, f"PII leak · shareholders present in anon: {own}"
    # `control` completo NO existe (contiene top1_name / controlling_shareholder).
    assert "control" not in own, f"PII leak · control block present: {own}"
    # `summary` presente con los campos permitidos.
    assert "summary" in own
    s = own["summary"]
    assert s["total_shareholders"] == 2
    assert s["tier"] == "Control mayoritario"
    assert s["top1_pct"] == 73.35
    # No debe emitir top1_name / controlling_shareholder ni nombres.
    assert "top1_name" not in s
    assert "controlling_shareholder" not in s
    # `coverage` original preservado.
    assert own["coverage"] == {"shareholders_count": 2}
    # `finances` gated para anónimo (mixed-access baseline).
    assert body["finances"] is None
    # Adicional grep de fuga · ningún nombre de accionista en el body.
    raw = r.text
    for name_fragment in ("SERVIER INTERNATIONAL", "ARTS ET TECHNIQUES", "controlling_shareholder"):
        assert name_fragment not in raw, f"PII leak in serialized body: {name_fragment}"


@pytest.mark.asyncio
async def test_ficha_ownership_dpd_auth_passthrough_with_shareholders(alice: AsyncClient):
    """B-2.2 · Autenticado recibe passthrough completo · shareholders + control intactos."""
    from src.modules.intelligence_layer.router import get_intelligence_router

    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(
        return_value=_fake_ficha_with_ownership(_fake_ownership_nominal())
    )

    r = await alice.get("/api/companies/B28184687/ficha")
    assert r.status_code == 200, r.text
    body = r.json()
    own = body["ownership"]
    assert own is not None
    assert own["available"] is True
    # PII intacta para autenticado.
    assert "shareholders" in own
    shs = own["shareholders"]
    assert len(shs) == 2
    assert shs[0]["name"] == "SERVIER INTERNATIONAL, BV"
    assert shs[0]["pct"] == 73.35
    # `control` block completo.
    assert "control" in own
    ctrl = own["control"]
    assert ctrl["top1_name"] == "SERVIER INTERNATIONAL, BV"
    assert ctrl["controlling_shareholder"] == "SERVIER INTERNATIONAL, BV"
    assert ctrl["tier"] == "Control mayoritario"
    # NO se emite `summary` en modo autenticado.
    assert "summary" not in own
    # `finances` NO nullificado.
    assert body["finances"] is not None


@pytest.mark.asyncio
async def test_ficha_ownership_dpd_available_false_passthrough_both_modes(
    client: AsyncClient, alice: AsyncClient
):
    """B-2.2 · `ownership.available:false` → passthrough idéntico anon y auth."""
    from src.modules.intelligence_layer.router import get_intelligence_router

    unavailable_own = {
        "identifier": "B00000002",
        "cif": "B00000002",
        "available": False,
        "engine_version": "arroba-company-ficha-v1",
    }

    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(
        return_value=_fake_ficha_with_ownership(unavailable_own)
    )
    r_anon = await client.get("/api/companies/B00000002/ficha")
    assert r_anon.status_code == 200, r_anon.text
    assert r_anon.json()["ownership"] == unavailable_own

    router.get_company_ficha = AsyncMock(
        return_value=_fake_ficha_with_ownership(unavailable_own)
    )
    r_auth = await alice.get("/api/companies/B00000002/ficha")
    assert r_auth.status_code == 200, r_auth.text
    assert r_auth.json()["ownership"] == unavailable_own


# ================================================================
# HARDENING-012 · Market top-level passthrough (2026-08-12)
# Intel entrega `market` en el agregador `/company/{cif}/ficha`.
# ================================================================


@pytest.mark.asyncio
async def test_ficha_market_top_level_passthrough_anonymous(client: AsyncClient):
    """HARDENING-012 · el bloque `market` viaja passthrough top-level en anon.

    Regla: `market` es dato público (sector + geo + concentration + position);
    el backend NO lo anonimiza en la ruta anónima (a diferencia de governance
    y ownership). El frontend gate sub-bloques según análisis-dependencia.
    """
    from src.modules.intelligence_layer.interfaces.ficha import CompanyFicha
    from src.modules.intelligence_layer.interfaces.financial import FinancialAnalysis
    from src.modules.intelligence_layer.router import get_intelligence_router

    market_block = {
        "available": True,
        "sector": {
            "cnae_code": "2120", "cnae_label": "Fabricación de especialidades farmacéuticas",
            "cnae_level": "group", "size_score": 0, "dynamism_score": 19,
            "growth_score": 10, "activity_score": 43, "trend_direction": "down",
            "signal": "sector_contraction", "primary_driver": "activity",
        },
        "geo": {
            "geo_id": "28", "geo_name": "Madrid", "geo_level": "province",
            "size_score": 95, "dynamism_score": 61, "growth_score": 15,
            "trend_direction": "down", "signal": "corporate_hub",
        },
        "concentration": {
            "level": "group", "degraded": False, "hhi": 10000.0,
            "concentration_label": "highly_concentrated",
            "caveat": "Universo reducido (por debajo del umbral de estabilidad); HHI orientativo.",
        },
        "position": {
            "sector_revenue_percentile": 100,
            "market_position": {"rank": 2, "total": 9, "scope": "sector CNAE + banda de tamaño"},
            "locality_position": {"rank": 1, "total": 34, "scope": "municipio"},
            "explain": ["En el percentil 100 por ingresos de su sector"],
        },
        "coverage": {"sector": True, "geo": True, "concentration": True, "position": True},
    }
    ficha = CompanyFicha(
        cif_normalized="B28184687",
        master_id="mc_market_test",
        finances=FinancialAnalysis(cif_normalized="B28184687", has_financials=True),
        identity={"cif": "B28184687"},
        ownership={"available": False},
        governance={"available": False},
        events={"available": False},
        ranking=None,
        market=market_block,
        engine_version="arroba-ficha-v1",
    )
    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(return_value=ficha)

    r = await client.get("/api/companies/B28184687/ficha")
    assert r.status_code == 200, r.text
    body = r.json()
    # Bloque market debe viajar en anon con sus sub-bloques públicos.
    assert body.get("market") is not None
    m = body["market"]
    assert m["available"] is True
    assert m["sector"]["cnae_code"] == "2120"
    assert m["sector"]["dynamism_score"] == 19
    assert m["geo"]["geo_id"] == "28"
    assert m["concentration"]["hhi"] == 10000.0
    assert m["concentration"]["degraded"] is False
    # HARDENING-013 (2026-08-12) · `market.position` NO viaja en anon
    # (dato analítico derivado de ingresos · nulificado por gating extendido).
    assert "position" not in m, f"HARDENING-013 · market.position leak in anon: {m.get('position')}"
    # `finances` gated en anon (baseline mixed-access).
    assert body["finances"] is None


# ================================================================
# HARDENING-013 · Anon gating extendido (2026-08-12)
# ranking top-level + market.position nulificados en anon (antes solo finances=None).
# ================================================================


@pytest.mark.asyncio
async def test_ficha_hardening_013_anon_gating_ranking_and_market_position(client: AsyncClient):
    """HARDENING-013 · en anon: `ranking` y `market.position` NO deben viajar.

    Contexto: ambos son derivados de los ingresos de la empresa (mismo valor
    analítico que `finances.ranking`). La UI ya cubría con `<Gate>` pero la
    respuesta JSON los servía. Fix: nulificar `ranking` (top-level) + eliminar
    `market.position` en el flujo de anonimización de `get_company_ficha`.
    Sub-bloques `market.{sector, geo, concentration}` permanecen públicos.
    """
    from src.modules.intelligence_layer.interfaces.ficha import CompanyFicha
    from src.modules.intelligence_layer.interfaces.financial import FinancialAnalysis
    from src.modules.intelligence_layer.router import get_intelligence_router

    ranking_block = {
        "sector_revenue_percentile": 100,
        "market_position": {"rank": 2, "total": 9, "scope": "sector CNAE + banda"},
        "locality_position": {"rank": 1, "total": 34, "scope": "municipio"},
        "explain": ["En el percentil 100 por ingresos de su sector"],
    }
    market_block = {
        "available": True,
        "sector": {"cnae_code": "2120", "dynamism_score": 19, "signal": "sector_contraction"},
        "geo": {"geo_id": "28", "geo_name": "Madrid", "geo_level": "province"},
        "concentration": {"level": "group", "degraded": False, "hhi": 10000.0},
        "position": ranking_block,  # DUPLICA `ranking` top-level (paridad Intel).
        "coverage": {"sector": True, "geo": True, "concentration": True, "position": True},
    }
    ficha = CompanyFicha(
        cif_normalized="B28184687",
        master_id="mc_gating_test",
        finances=FinancialAnalysis(cif_normalized="B28184687", has_financials=True),
        identity={"cif": "B28184687"},
        ownership={"available": False},
        governance={"available": False},
        events={"available": False},
        ranking=ranking_block,  # top-level poblado (fuga previa al fix).
        market=market_block,
        engine_version="arroba-ficha-v1",
    )
    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(return_value=ficha)

    r = await client.get("/api/companies/B28184687/ficha")
    assert r.status_code == 200, r.text
    body = r.json()

    # (1) `finances` nullificado (baseline mixed-access · pre-existente).
    assert body["finances"] is None

    # (2) `ranking` top-level nullificado (NUEVO · HARDENING-013).
    assert body.get("ranking") is None, f"PII leak · ranking present in anon: {body.get('ranking')}"

    # (3) `market.position` NO EXISTE como clave (NUEVO · HARDENING-013).
    m = body["market"]
    assert isinstance(m, dict), f"market debe seguir siendo dict en anon: {m}"
    assert "position" not in m, f"PII leak · market.position present in anon: {m.get('position')}"

    # (4) Sub-bloques públicos preservados.
    assert m.get("sector") is not None
    assert m["sector"]["cnae_code"] == "2120"
    assert m.get("geo") is not None
    assert m["geo"]["geo_id"] == "28"
    assert m.get("concentration") is not None
    assert m["concentration"]["hhi"] == 10000.0

    # (5) Grep bruto de la respuesta serializada: cero fugas de campos
    # analíticos derivados de ingresos.
    raw = r.text
    assert "sector_revenue_percentile" not in raw, "PII leak · sector_revenue_percentile in body"
    assert "locality_position" not in raw, "PII leak · locality_position in body"
    # `market_position` es una key anidada (dentro de ranking.market_position);
    # tras eliminar ranking + market.position del payload no debe aparecer.
    assert '"market_position"' not in raw, "PII leak · market_position in body"


@pytest.mark.asyncio
async def test_ficha_hardening_013_auth_keeps_ranking_and_position(alice: AsyncClient):
    """HARDENING-013 · regresión · autenticado sigue recibiendo ambos bloques."""
    from src.modules.intelligence_layer.interfaces.ficha import CompanyFicha
    from src.modules.intelligence_layer.interfaces.financial import FinancialAnalysis
    from src.modules.intelligence_layer.router import get_intelligence_router

    ranking_block = {
        "sector_revenue_percentile": 100,
        "market_position": {"rank": 2, "total": 9, "scope": "sector CNAE + banda"},
        "locality_position": {"rank": 1, "total": 34, "scope": "municipio"},
        "explain": ["ok"],
    }
    market_block = {
        "available": True,
        "sector": {"cnae_code": "2120"},
        "geo": {"geo_id": "28"},
        "concentration": {"level": "group"},
        "position": ranking_block,
    }
    ficha = CompanyFicha(
        cif_normalized="B28184687",
        master_id="mc_gating_test_auth",
        finances=FinancialAnalysis(cif_normalized="B28184687", has_financials=True),
        identity={"cif": "B28184687"},
        ownership={"available": False},
        governance={"available": False},
        events={"available": False},
        ranking=ranking_block,
        market=market_block,
        engine_version="arroba-ficha-v1",
    )
    router = get_intelligence_router()
    router.get_company_ficha = AsyncMock(return_value=ficha)

    r = await alice.get("/api/companies/B28184687/ficha")
    assert r.status_code == 200, r.text
    body = r.json()

    # `finances` presente en auth.
    assert body["finances"] is not None
    # `ranking` top-level intacto en auth.
    assert body["ranking"] is not None
    assert body["ranking"]["sector_revenue_percentile"] == 100
    # `market.position` intacto en auth.
    assert body["market"]["position"] is not None
    assert body["market"]["position"]["sector_revenue_percentile"] == 100

