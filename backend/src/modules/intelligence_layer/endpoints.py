"""Endpoints FastAPI del intelligence_layer.

* GET /api/companies/{cif}/identity  → proxy MasterRecord §6.1 (auth requerida).
* GET /api/internal/metrics          → Prometheus text/plain 0.0.4.

Contrato interno congelado. El frontend consume `/identity` a partir de B.6.f.
`X-API-Key` NUNCA se expone al frontend (Regla R5).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query, Response, status
from pydantic import BaseModel, Field

from src.core.exceptions import DomainError, NotFoundError
from src.core.logging import get_logger
from src.modules.auth.dependencies import get_current_user, get_optional_current_user
from src.modules.auth.models import UserPublic
from src.modules.intelligence_layer.circuit_breaker import BreakerOpenError
from src.modules.intelligence_layer.config import get_intelligence_settings
from src.modules.intelligence_layer.interfaces.ficha import CompanyFicha
from src.modules.intelligence_layer.interfaces.financial import (
    FinancialAnalysis,
    FinancialNotFoundError,
    FinancialProviderError,
    RatiosCatalog,
    Valuation,
)
from src.modules.intelligence_layer.interfaces.signal import (
    SignalAnalysis,
    SignalNotFoundError,
    SignalProviderError,
)
from src.modules.intelligence_layer.interfaces.recommendation import (
    RecommendationNotFoundError,
    RecommendationProviderError,
    RecommendationSet,
)
from src.modules.intelligence_layer.interfaces.master import (
    MasterNotFoundError,
    MasterProviderError,
    MasterRecord,
)
from src.modules.intelligence_layer.interfaces.resolve import (
    PublicResolveNotFound,
    PublicResolveResult,
    ResolveNotFoundError,
    ResolveProviderError,
)
from src.modules.intelligence_layer.interfaces.valuation import (
    ValuationAnalysis,
    ValuationNotFoundError,
    ValuationProviderError,
)
from src.modules.intelligence_layer.interfaces.semantic import (
    SemanticCatalog,
    SemanticNotFoundError,
    SemanticProfile,
    SemanticProviderError,
    SemanticSchema,
    SemanticSearchResponse,
    SimilarCompanies,
)
from src.modules.intelligence_layer.observability import render_metrics
from src.modules.intelligence_layer.router import get_intelligence_router
from src.modules.intelligence_layer.router import IntelligenceRouter  # HARDENING-008 · type hint fallback helper
from src.modules.intelligence_layer.canonical_ui_adapter import (
    to_financial_section,
    to_identity_section,
    to_semantic_section,
    to_valuation_section,
)
from src.modules.intelligence_layer.interfaces.canonical_ui import (
    FinancialSection,
    IdentitySection,
    SemanticSection,
    ValuationSection,
)

log = get_logger("intelligence_layer.endpoints")


class ProviderUnavailableError(DomainError):
    code = "provider_unavailable"
    status_code = 503


class ProviderError(DomainError):
    code = "provider_error"
    status_code = 502


# Nota: prefix /api ya se aplica desde main.py include_router.
companies_intel_router = APIRouter(
    prefix="/api/companies", tags=["companies-intelligence"]
)
intelligence_router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])
entities_semantic_router = APIRouter(prefix="/api/entities", tags=["entities-semantic"])
internal_router = APIRouter(prefix="/api/internal", tags=["internal"])


def _cif_param(
    cif: str = Path(..., min_length=9, max_length=9, regex=r"^[A-Za-z]\d{8}$"),
) -> str:
    return cif.upper()


@companies_intel_router.get(
    "/{cif}/valuation",
    response_model=ValuationAnalysis,
    summary="Valoración canónica (arroba-valuation-v1) · F0.3",
)
async def get_company_valuation(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),  # auth requerida
) -> ValuationAnalysis:
    """Devuelve la valoración canónica `arroba-valuation-v1` de la empresa.

    Orquestación:
      1. `resolve_by_cif` (F0.2 · para 404 canónico si el CIF no existe).
      2. `analyze_valuation(master_id)` contra el endpoint dedicado del motor.

    Cache 1h. `bridge_components`, `scenarios` y `sensitivity` quedan `None`
    hasta que el motor los exponga (F0.3 · BLOCKED BY DATA).
    """
    router = get_intelligence_router()
    try:
        resolved = await router.resolve_by_cif(cif)
    except ResolveNotFoundError as exc:
        raise NotFoundError("valuation_cif_not_found", code="resolve_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except ResolveProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    try:
        analysis = await router.analyze_valuation(resolved.master_id)
    except ValuationNotFoundError as exc:
        raise NotFoundError("valuation_not_available", code="valuation_not_available") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except ValuationProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_valuation_provider().provider_name
    # `master_id` se propaga al contrato interno (útil para debugging/logs);
    # el frontend NUNCA lo muestra al usuario final (F0.2-OP3).
    return analysis


@companies_intel_router.get(
    "/{cif}/resolve",
    response_model=PublicResolveResult,
    responses={404: {"model": PublicResolveNotFound}},
    summary="Resolución canónica CIF → identidad (arroba-resolve-v1) · F0.2",
)
async def get_company_resolve(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),  # auth requerida
) -> PublicResolveResult:
    """Resuelve un CIF contra el Master Layer del Intelligence Engine.

    Contrato interno canónico `arroba-resolve-v1`. F0.2-OP3: **NO expone
    `master_id`** al frontend (identificador interno estable, cacheado por
    el backend en `intelligence_cache`).

    Errores canónicos:
      * `404 resolve_not_found` — `count=0` en el Master Layer del proveedor.
      * `503 provider_unavailable` — circuit breaker abierto.
      * `502 provider_error` — otros fallos del proveedor.
    """
    router = get_intelligence_router()
    try:
        result = await router.resolve_by_cif(cif)
    except ResolveNotFoundError as exc:
        raise NotFoundError("resolve_not_found", code="resolve_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except ResolveProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_resolve_provider().provider_name
    return PublicResolveResult(
        cif=result.cif,
        resolved=result.resolved,
        canonical_name=result.canonical_name,
        match_type=result.match_type,
        score=result.score,
        engine_version=result.engine_version,
    )


@companies_intel_router.get(
    "/{cif}/identity",
    response_model=MasterRecord,
    summary="Identidad canónica (Master Record §6.1) — proxy intelligence_layer",
)
async def get_company_identity(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),  # auth requerida
) -> MasterRecord:
    """Devuelve el `master_companies` §6.1 del intelligence_layer.

    En modo `mock` traduce `master_companies_mock` al schema §6.1. En modo
    `real` proxya a Agency Tool `/api/v1/master/{master_id}`. En ambos casos
    la respuesta tiene la MISMA forma (contrato interno frozen · Decisión 0.1.5).
    """
    router = get_intelligence_router()
    try:
        record = await router.get_master_by_cif(cif)
    except MasterNotFoundError as exc:
        raise NotFoundError("master_not_found", code="master_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except MasterProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_master_provider().provider_name
    return record


# ============================================================
# B.6.b · Financial Engine (§6.2 · §6.3 · ratios/catalog)
# ============================================================


@companies_intel_router.get(
    "/{cif}/financial-analysis",
    response_model=FinancialAnalysis,
    summary="Análisis financiero canónico (§6.2) — proxy intelligence_layer",
)
async def get_company_financial_analysis(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),  # auth requerida
) -> FinancialAnalysis:
    """Devuelve el `financial-intelligence/analyze` §6.2.

    Frontend recibe `engine_version="arroba-financial-v1"` (R5: contrato interno
    decoupled). Cuando el proveedor devuelve 404 (Master Layer sin datos), arroba
    responde `404 financial_not_found` canónico → frontend degrada a `UnavailableBlock`.
    """
    router = get_intelligence_router()
    try:
        analysis = await router.get_financial_analysis(cif)
    except FinancialNotFoundError as exc:
        raise NotFoundError("financial_not_found", code="financial_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except FinancialProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_financial_provider().provider_name
    return analysis


@companies_intel_router.get(
    "/{cif}/ficha",
    response_model=CompanyFicha,
    summary="Ficha agregada (arroba-ficha-v1) · B-2.4 · mixed-access",
)
async def get_company_ficha(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic | None = Depends(get_optional_current_user),
    authenticated: bool = Query(
        default=False,
        description=(
            "HARDENING-015 (2026-08-13) · Opt-in explícito de vista autenticada. "
            "Fail-closed: por defecto (ausente o false) el endpoint devuelve el "
            "shape anónimo con DPD aplicada aunque exista cookie de sesión. Sólo "
            "authenticated=true junto con cookie de sesión válida resuelve a "
            "vista autenticada. El query param por sí solo, sin sesión válida, "
            "NUNCA desbloquea datos protegidos."
        ),
    ),
) -> CompanyFicha:
    """Agrega en una sola llamada `identity + finances + ownership + governance + events + ranking`.

    Mixed-access:
      * Anónimo: devuelve `identity`, `ownership` (**agregado sin nombres**),
        `governance` (**agregado sin PII**), `events`, `ranking`; `finances` se
        nullifica (secciones con cifras siguen gated bajo `<Gate>`).
      * Autenticado: payload completo, con `ownership.shareholders[]` nominales
        y `governance.officers[]` con nombres.

    B-2.3 · DPD backend governance (2026-08-11): `_anonymize_governance()`
    elimina `officers` y emite `summary{total, roles[]}`. B-2.2 · DPD backend
    ownership (2026-08-11): `_anonymize_ownership()` elimina TODOS los nombres
    (físicos y jurídicos) y emite `summary{total_shareholders, tier?, top1_pct?}`.
    R15 + DPD estrictos.

    Reduce el waterfall SWR frontend de 5 llamadas Arroba→Intel a 1 (cf.
    `PARA_BETA_B24_FICHA_SHAPE.md`). Endpoints legacy por sección permanecen
    operativos hasta deprecación futura.

    HARDENING-008 · Resiliencia agregador (2026-08-10): si Intel `/company/{cif}/ficha`
    devuelve `NotFoundError` (404 upstream) o `FinancialProviderError` (5xx/breaker
    intermedio propagado), componemos `CompanyFicha` a partir de las llamadas por
    sección legacy (`master_by_cif` + `financial_analysis`). Sólo se propaga 404 final
    si TAMBIÉN el legacy `master_by_cif` falla (`MasterNotFoundError`). Observabilidad:
    header `X-Ficha-Source: aggregator | fallback_per_section` en la respuesta.
    """
    router = get_intelligence_router()
    ficha_source = "aggregator"
    try:
        ficha = await router.get_company_ficha(cif)
    except FinancialNotFoundError as exc:
        # Fallback por sección: el agregador reportó 404 upstream, intentamos legacy.
        log.warning(
            "ficha_aggregator_not_found",
            extra={"cif": cif, "reason": "aggregator_404", "error_class": getattr(exc, "error_class", None)},
        )
        try:
            ficha = await _compose_ficha_fallback(router, cif)
            ficha_source = "fallback_per_section"
        except MasterNotFoundError as inner:
            raise NotFoundError("ficha_not_found", code="ficha_not_found") from inner
        except MasterProviderError as inner:
            raise ProviderError(getattr(inner, "error_class", "provider_error"), code="provider_error") from inner
    except BreakerOpenError as exc:
        # Circuit breaker abierto para el agregador → intentar legacy por sección.
        log.warning(
            "ficha_aggregator_breaker_open",
            extra={"cif": cif, "reason": "breaker_open"},
        )
        try:
            ficha = await _compose_ficha_fallback(router, cif)
            ficha_source = "fallback_per_section"
        except MasterNotFoundError as inner:
            raise NotFoundError("ficha_not_found", code="ficha_not_found") from inner
        except MasterProviderError:
            raise ProviderUnavailableError(
                "circuit_breaker_open", code="provider_unavailable"
            ) from exc
    except FinancialProviderError as exc:
        # 5xx / auth upstream / server / breaker interno propagado → probamos legacy.
        error_class = getattr(exc, "error_class", "")
        if error_class in ("server_5xx", "unauthorized", "client_4xx", "network"):
            log.warning(
                "ficha_aggregator_provider_error",
                extra={"cif": cif, "reason": "aggregator_provider_error", "error_class": error_class},
            )
            try:
                ficha = await _compose_ficha_fallback(router, cif)
                ficha_source = "fallback_per_section"
            except MasterNotFoundError as inner:
                raise NotFoundError("ficha_not_found", code="ficha_not_found") from inner
            except (MasterProviderError, BreakerOpenError):
                raise ProviderError(error_class or "provider_error", code="provider_error") from exc
        else:
            raise ProviderError(error_class or "provider_error", code="provider_error") from exc

    if user is None or authenticated is not True:
        # HARDENING-015 (2026-08-13) · Fail-closed mixed-access:
        #   * `user is None` → sin sesión → anónimo.
        #   * `authenticated != true` → sesión presente pero SIN opt-in explícito → anónimo.
        # Bloque gated (`finances`) se nullifica para visitante anónimo. Además,
        # `governance` y `ownership` se anonimizan (DPD · B-2.3 / B-2.2):
        # governance elimina la lista nominal `officers`; ownership elimina
        # todos los nombres (físicos y jurídicos) y sólo emite un `summary` no
        # identificativo. Ver R15 + DPD.
        #
        # HARDENING-013 (2026-08-12) · gating extendido: `ranking` top-level
        # y `market.position` son datos analíticos derivados de los ingresos
        # de la empresa; equivalen semánticamente a `finances.ranking` y por
        # tanto DEBEN nulificarse en anon.
        #
        # HARDENING-014 (2026-08-13) · `control_graph` top-level: se anonimiza
        # con `_anonymize_control_graph` (elimina upstream/downstream/ubo/nodes/edges).
        #
        # HARDENING-024 (2026-08-14) · `opportunity` top-level: bloque gateado.
        # `thesis.narrative` + `chips` son inteligencia derivada del set financiero
        # completo → nulificar en anon (mismo patrón que `finances` y `ranking`).
        effective_auth = False
        update_dict: dict = {
            "finances": None,
            "governance": _anonymize_governance(ficha.governance),
            "ownership": _anonymize_ownership(ficha.ownership),
            "ranking": None,
            # HARDENING-014 (2026-08-13) · DPD backend `control_graph`: elimina
            # PII de shareholders/participadas/UBO/nodes/edges + HARDENING-016
            # elimina también `narrative` (menciona nombres) y `control.*`
            # (KPIs derivados de la lista gateada). Ver `_anonymize_control_graph`.
            "control_graph": _anonymize_control_graph(ficha.control_graph),
            # HARDENING-016 (2026-08-13) · DPD sweep exhaustivo · `market`:
            # elimina `position` completo (bloque gateado) + `concentration.explain`
            # defensivo. Preserva sector/geo/concentration (contexto CNAE público).
            "market": _anonymize_market(ficha.market),
            # HARDENING-024 (2026-08-14) · DPD backend `opportunity`: bloque
            # gateado completo · nulificado para anon.
            "opportunity": None,
        }
        ficha = ficha.model_copy(update=update_dict)
    else:
        effective_auth = True

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_financial_provider().provider_name
    response.headers["X-Ficha-Source"] = ficha_source
    # HARDENING-015 · trazabilidad: header con la resolución efectiva de auth
    # aplicada al payload (útil para depurar 4 curls del amendment y para QA).
    response.headers["X-Ficha-Auth"] = "authenticated" if effective_auth else "anonymous"
    return ficha


def _anonymize_ownership(ownership: dict | None) -> dict | None:
    """B-2.2 · DPD backend · agrega el bloque `ownership` para usuario anónimo.

    Política canónica **HARDENING-016 (2026-08-13 · DPD SWEEP exhaustivo)**:
      * Si `ownership` es `None` o no es dict → passthrough.
      * Si `available` no es `True` → passthrough del bloque tal cual.
      * Si `available:true` → devuelve un shape agregado NO identificativo,
        SIN nombres (ni físicos ni jurídicos), SIN cifs individuales, SIN pcts
        individuales, SIN KPIs derivados de la lista gateada:
          {
            "available": True,
            "coverage": <coverage passthrough sin PII>,
            "summary": { "total_shareholders": <N> }
          }

    **Ley del turno HARDENING-016**: cualquier `narrative` / `summary.top1_pct`
    / `summary.top3_pct` / `summary.tier` / `summary.hhi` / `control.*` es un
    resumen o KPI derivado de la lista nominal → se **elimina en anon**. Sólo
    persiste el `total_shareholders` (contador agregado sin PII derivada).

    Cero heurística de clasificación jurídica/física (descartada por Fase 0:
    Intel no emite `type` explícito y los CIF llegan `null` para sociedades
    extranjeras, haciendo la heurística por CIF/nombre poco fiable).

    HARDENING-010: contrato Pydantic `CompanyFicha.ownership` permanece como
    `dict | None` passthrough. La discriminación de shape entre autenticado
    (`shareholders`) y anónimo (`summary`) queda a cargo del consumidor
    (frontend usa union type discriminado).
    """
    if ownership is None or not isinstance(ownership, dict):
        return ownership
    if ownership.get("available") is not True:
        return ownership

    shareholders_raw = ownership.get("shareholders")
    shareholders: list[dict] = (
        [sh for sh in shareholders_raw if isinstance(sh, dict)]
        if isinstance(shareholders_raw, list)
        else []
    )
    coverage = ownership.get("coverage") if isinstance(ownership.get("coverage"), dict) else None
    coverage_count = None
    if coverage is not None:
        sc = coverage.get("shareholders_count")
        if isinstance(sc, int):
            coverage_count = sc
    total = coverage_count if coverage_count is not None else len(shareholders)

    # HARDENING-016 · Sweep DPD: NO propagar `control.tier` ni `control.top1_pct`
    # al anon. Son KPIs derivados de la lista de accionistas gateada. Preservar
    # sólo el contador agregado `total_shareholders`.
    summary: dict = {"total_shareholders": total}

    return {
        "available": True,
        "coverage": coverage,
        "summary": summary,
    }


def _anonymize_control_graph(cg: dict | None) -> dict | None:
    """HARDENING-014 + HARDENING-016 · DPD backend `control_graph` para anon.

    Shape del contrato Intel (2026-08-13 · post-REQ):
      { available, company, as_of_year, shareholders[], subsidiaries[], ubo,
        graph{nodes[], edges[]}, distribution[], narrative, coverage, engine_version }

    Política canónica (2026-08-13 · SWEEP DPD exhaustivo tras P0 tester):
      * `None` o no dict → passthrough.
      * `available` no `True` → passthrough del bloque tal cual (conserva señal).
      * `available:true` → shape agregado NO identificativo:
          - Elimina `shareholders[]`, `subsidiaries[]`, `ubo`, `graph`,
            `distribution` (aunque Intel ya anonimice los nombres, la política
            de opt-in explícito exige ocultar la totalidad de las estructuras
            gateadas en anon).
          - **HARDENING-016** · Elimina `narrative` (menciona control/porcentajes
            derivados de la lista gateada).
          - **HARDENING-016** · `summary` reducido a counts puros
            (`shareholders_count`, `participations_count`).
          - Preserva `available`, `company` (identidad de la propia empresa
            consultada · pública), `coverage` (flags booleanos de cobertura
            sin PII), `engine_version`.

    **Ley del turno HARDENING-016**: si en anon oculto una lista o campo
    gateado, oculto también toda su prosa, resúmenes y KPIs derivados.

    R15 + DPD estrictos: cero fabricación, cero prosa que mencione datos
    gateados, cero KPIs derivados.
    """
    if cg is None or not isinstance(cg, dict):
        return cg
    if cg.get("available") is not True:
        return cg

    shareholders = cg.get("shareholders") if isinstance(cg.get("shareholders"), list) else []
    subsidiaries = cg.get("subsidiaries") if isinstance(cg.get("subsidiaries"), list) else []
    coverage = cg.get("coverage") if isinstance(cg.get("coverage"), dict) else None

    # HARDENING-016 · Sweep DPD: counts puros derivados sólo de las listas.
    summary: dict = {
        "shareholders_count": len(shareholders),
        "participations_count": len(subsidiaries),
    }

    out: dict = {
        "available": True,
        "company": cg.get("company") if isinstance(cg.get("company"), dict) else None,
        "coverage": coverage,
        "summary": summary,
        "engine_version": cg.get("engine_version"),
    }
    return {k: v for k, v in out.items() if v is not None}


def _anonymize_market(market: dict | None) -> dict | None:
    """HARDENING-016 (2026-08-13) · DPD backend para el bloque `market`.

    **Ley del turno HARDENING-016**: si en anon oculto una lista/campo gateado,
    oculto también su prosa, resúmenes y KPIs derivados.

    Decisiones por sub-bloque (criterio documentado en el reporte):
      * `market.position` → **nulificar completo** (bloque gateado). Ya lo
        hacía el update_dict antes; aquí se refuerza por seguridad.
      * `market.sector.narrative` → **MANTENER** (contexto CNAE público del
        sector · no menciona ranking/posición/facturación privados).
      * `market.geo.narrative` → **MANTENER** (contexto territorial público ·
        no menciona datos privados de la empresa).
      * `market.concentration.narrative` → **MANTENER** (concentración
        agregada del mercado · dato público del universo CNAE, aplicable a
        todas las empresas del sector; no revela KPI privado de la empresa).
      * `market.concentration.hhi` → **MANTENER** (índice del mercado, no de
        la empresa).
      * `market.concentration.explain` → **ELIMINAR** si menciona los KPIs
        privados de la empresa consultada (defensivo · payload actual no lo
        emite pero contrato Intel podría poblar).

    En Servier (payload real 2026-08-13): sector/geo/concentration son
    contexto CNAE público sin datos privados de la empresa. Se preservan.
    """
    if market is None or not isinstance(market, dict):
        return market

    out: dict = {}
    for k, v in market.items():
        if k == "position":
            # HARDENING-013 · bloque gateado (ranking/percentil de la empresa).
            continue
        if k == "concentration" and isinstance(v, dict):
            # Defensivo: eliminar `explain` si existe (podría enumerar KPIs
            # privados de la empresa; en payload actual no viene). Mantener
            # `narrative`, `hhi`, `hhi_band`, `concentration_label_es` (dato
            # sectorial público).
            cleaned = {kk: vv for kk, vv in v.items() if kk != "explain"}
            out[k] = cleaned
            continue
        out[k] = v
    return out


def _anonymize_governance(governance: dict | None) -> dict | None:
    """B-2.3 · DPD backend · agrega el bloque `governance` para usuario anónimo.

    Regla estricta (R11/R15/DPD):
      * Si `governance` es `None` → passthrough `None`.
      * Si `available` no es `True` → passthrough del bloque tal cual (no hay
        PII que anonimizar; conserva la señal `available:false`).
      * Si `available:true` → devuelve un shape agregado SIN `officers`:
          {
            "available": True,
            "coverage": <coverage original>,
            "summary": {
              "total": <int>,
              "roles": [
                {"role": "<slug>", "role_label": "<label CF ES>", "count": <int>},
                ...
              ]
            }
          }
        Ordenación determinista: `count` desc, luego `role_label` ASC.

    El backend es la ÚNICA capa que ve nombres nominales; la respuesta que
    viaja al frontend anónimo no contiene ningún nombre de persona física.

    HARDENING-019 · Fase B canon CF (2026-08-13): el mapa i18n local
    `_GOVERNANCE_ROLE_ES` se retira en el mismo commit — Intel ya emite
    labels ES por officer (`officers[i].role_label_es`), por el dict a nivel
    sección (`governance.governance_role_labels_es`) y en el campo primario
    `officers[i].role` (que llega ya en español CF). Prioridad de resolución:
    `role_label_es` > `role_es` > `role`.
    `role` (slug de salida) sigue siendo el slug determinista del label ES
    (útil para keys estables y ordenación).
    """
    if governance is None:
        return None
    if not isinstance(governance, dict):
        return governance
    if governance.get("available") is not True:
        # `available: false` o desconocido → passthrough (no hay PII).
        return governance

    officers_raw = governance.get("officers")
    officers: list[dict] = [o for o in officers_raw if isinstance(o, dict)] if isinstance(officers_raw, list) else []

    role_counts: dict[str, dict] = {}
    for off in officers:
        # HARDENING-019 · Fase B canon CF · label ES directo del payload Intel.
        # Prioridad `role_label_es` > `role_es` > `role`. Cero traducción local.
        es_label = off.get("role_label_es") or off.get("role_es") or off.get("role")
        if not isinstance(es_label, str) or not es_label.strip():
            continue
        es_label = es_label.strip()
        slug = _slugify_role(es_label)
        bucket = role_counts.setdefault(slug, {"role": slug, "role_label": es_label, "count": 0})
        bucket["count"] += 1

    roles_sorted = sorted(
        role_counts.values(),
        key=lambda r: (-r["count"], r["role_label"].lower()),
    )
    coverage = governance.get("coverage")
    coverage_count = None
    if isinstance(coverage, dict):
        oc = coverage.get("officers_count")
        if isinstance(oc, int):
            coverage_count = oc
    total = coverage_count if coverage_count is not None else len(officers)

    return {
        "available": True,
        "coverage": coverage if isinstance(coverage, dict) else None,
        "summary": {
            "total": total,
            "roles": roles_sorted,
        },
    }


def _slugify_role(label: str) -> str:
    """Slug determinista para un role. Lower + ascii + `_`.

    Sin traducción: `label` ya viene en español CF (Intel `role_label_es`).
    El slug es SOLO para uso interno (ordenación estable, keys, testing).
    """
    import unicodedata
    ascii_str = unicodedata.normalize("NFKD", label).encode("ascii", "ignore").decode("ascii")
    slug = "".join(ch if ch.isalnum() else "_" for ch in ascii_str.lower())
    while "__" in slug:
        slug = slug.replace("__", "_")
    return slug.strip("_")


async def _compose_ficha_fallback(router: IntelligenceRouter, cif: str) -> CompanyFicha:
    """HARDENING-008 · compone `CompanyFicha` desde endpoints legacy por sección.

    Requiere que `identity` legacy resuelva (si no, propagamos `MasterNotFoundError`
    para que el caller emita el 404 final `ficha_not_found`). Si `financial-analysis`
    falla, seguimos con `finances=None` (mejor UX que rechazar toda la ficha).
    `ownership`, `governance`, `events`, `ranking` (top-level) quedan `None` — no hay
    endpoints legacy que los sirvan.
    """
    # 1. identity legacy · obligatoria (si falla, propagamos MasterNotFoundError).
    record = await router.get_master_by_cif(cif)
    identity_dict = _master_record_to_ficha_identity(record)
    master_id = record.master_id

    # 2. finances legacy · opcional (best-effort).
    finances: FinancialAnalysis | None = None
    try:
        finances = await router.get_financial_analysis(cif)
    except (FinancialNotFoundError, FinancialProviderError, BreakerOpenError) as exc:
        log.warning(
            "ficha_fallback_finances_unavailable",
            extra={"cif": cif, "master_id": master_id, "error": type(exc).__name__,
                   "error_class": getattr(exc, "error_class", None)},
        )
        finances = None

    log.info(
        "ficha_fallback_composed",
        extra={"cif": cif, "master_id": master_id, "finances_present": finances is not None},
    )
    return CompanyFicha(
        cif_normalized=record.cif_normalized or cif.upper(),
        master_id=master_id,
        finances=finances,
        identity=identity_dict,
        ownership=None,
        governance=None,
        events=None,
        ranking=finances.ranking if (finances and finances.ranking) else None,
        engine_version="arroba-ficha-v1-fallback",
    )


def _master_record_to_ficha_identity(record: "MasterRecord") -> dict:
    """HARDENING-008 · construye el dict `identity` con el shape del agregador Intel
    a partir de un `MasterRecord` legacy. Passthrough puro de campos existentes;
    R15 estricto: sin cálculo, solo mapping de claves. Mimica el shape que consume
    `adaptIdentityFromFicha` (frontend) para que el fallback sea transparente en UI.
    """
    ident = record.identity
    cls = record.classification
    loc = record.location
    ctc = record.contact
    sz = record.size
    return {
        "cif": record.cif_normalized,
        "master_id": record.master_id,
        "record_status": record.record_status or record.status,
        "legal_name": ident.legal_name if ident else None,
        "commercial_name": ident.commercial_name if ident else None,
        "aliases": list(ident.aliases) if (ident and ident.aliases) else [],
        "country": (loc.pais if loc else None) or (ident.country if ident else None),
        "cnae_primary": {
            "code": cls.cnae_code,
            "description": cls.cnae_description,
            "section": cls.cnae_section,
            "division": getattr(cls, "cnae_division", None),
        } if cls else None,
        "province": loc.provincia if loc else None,
        "locality": loc.municipio if loc else None,
        "postal_code": loc.codigo_postal if loc else None,
        "website": ctc.web if ctc else None,
        "domain": getattr(ctc, "domain", None) if ctc else None,
        "employees_total": sz.employees_total if sz else None,
        "capital_social": sz.capital_social if sz else None,
        "corporate_purpose": record.objeto_social,
        "activity": record.activity,
        "activity_status": record.activity_status,
        "mercantile_status": record.mercantile_status,
        "legal_form": record.legal_form,
        "incorporation_date": record.incorporation_date,
        "is_listed": record.is_listed,
        "listed_market": record.listed_market,
        "sectors": list(record.sectors) if record.sectors else [],
        "description": record.description,
        "address": record.address,
        "autonomous_community": record.autonomous_community,
        "data_coverage": dict(record.data_coverage) if record.data_coverage else {},
    }


@companies_intel_router.get(
    "/{cif}/signals",
    response_model=SignalAnalysis,
    summary="Señales de oportunidad/riesgo (§6.4) — proxy intelligence_layer",
)
async def get_company_signals(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),  # auth requerida
) -> SignalAnalysis:
    """Devuelve `signal-intelligence/analyze` §6.4 (score + señales + counts).

    Frontend recibe `engine_version="arroba-signal-v1"` (R5). 404 del proveedor →
    `404 signal_not_found` canónico → el frontend degrada a `UnavailableBlock`.
    """
    router = get_intelligence_router()
    try:
        analysis = await router.get_signal_analysis(cif)
    except SignalNotFoundError as exc:
        raise NotFoundError("signal_not_found", code="signal_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except SignalProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_signal_provider().provider_name
    return analysis


@companies_intel_router.get(
    "/{cif}/buyers",
    response_model=RecommendationSet,
    summary="Compradores encajados (§6.6) — proxy intelligence_layer",
)
async def get_company_buyers(
    response: Response,
    cif: str = Depends(_cif_param),
    limit: int = 10,
    user: UserPublic = Depends(get_current_user),  # auth requerida
) -> RecommendationSet:
    """Devuelve `recommendation-intelligence/buyers` §6.6 (compradores + encaje).

    `engine_version="arroba-recommendation-v1"` (R5). 404 → `buyers_not_found`
    canónico → el frontend degrada a `UnavailableBlock`.
    """
    router = get_intelligence_router()
    try:
        result = await router.get_buyers(cif, limit=limit)
    except RecommendationNotFoundError as exc:
        raise NotFoundError("buyers_not_found", code="buyers_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except RecommendationProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_recommendation_provider().provider_name
    return result


@companies_intel_router.get(
    "/{cif}/opportunities",
    response_model=RecommendationSet,
    summary="Oportunidades detectadas (§6.6) — proxy intelligence_layer",
)
async def get_company_opportunities(
    response: Response,
    cif: str = Depends(_cif_param),
    limit: int = 10,
    user: UserPublic = Depends(get_current_user),  # auth requerida
) -> RecommendationSet:
    """Devuelve `recommendation-intelligence/opportunities` §6.6. 404 →
    `opportunities_not_found` → el frontend degrada a `UnavailableBlock`."""
    router = get_intelligence_router()
    try:
        result = await router.get_opportunities(cif, limit=limit)
    except RecommendationNotFoundError as exc:
        raise NotFoundError("opportunities_not_found", code="opportunities_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except RecommendationProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_recommendation_provider().provider_name
    return result


@intelligence_router.get(
    "/ratios/catalog",
    response_model=RatiosCatalog,
    summary="Catálogo canónico de ratios financieros (cacheado 24h)",
)
async def get_ratios_catalog(
    response: Response,
    user: UserPublic = Depends(get_current_user),
) -> RatiosCatalog:
    """Catálogo estable, sin `identifier`. Se cachea 24h en `intelligence_cache`."""
    router = get_intelligence_router()
    try:
        catalog = await router.get_ratios_catalog()
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except FinancialProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_financial_provider().provider_name
    return catalog


# ============================================================
# B.6.c · Semantic Engine (§6.5)
# ============================================================


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=256)
    limit: int = Field(10, ge=1, le=50)
    cnae_section: str | None = Field(default=None, max_length=8)


@companies_intel_router.get(
    "/{cif}/profile",
    response_model=SemanticProfile,
    summary="Perfil semántico canónico (§6.5) — proxy intelligence_layer",
)
async def get_company_semantic_profile(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
) -> SemanticProfile:
    """Devuelve `semantic-intelligence/profile` §6.5. `engine_version=arroba-semantic-v1`."""
    router = get_intelligence_router()
    try:
        prof = await router.get_semantic_profile(cif)
    except SemanticNotFoundError as exc:
        raise NotFoundError("profile_not_found", code="profile_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except SemanticProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_semantic_provider().provider_name
    return prof


@companies_intel_router.get(
    "/{cif}/similar",
    response_model=SimilarCompanies,
    summary="Empresas similares (§6.5) — proxy intelligence_layer",
)
async def get_company_similar(
    response: Response,
    cif: str = Depends(_cif_param),
    limit: int = Query(10, ge=1, le=50),
    user: UserPublic = Depends(get_current_user),
) -> SimilarCompanies:
    router = get_intelligence_router()
    try:
        sim = await router.get_semantic_similar(cif, limit=limit)
    except SemanticNotFoundError as exc:
        raise NotFoundError("similar_not_found", code="similar_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except SemanticProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_semantic_provider().provider_name
    return sim


@entities_semantic_router.post(
    "/semantic-search",
    response_model=SemanticSearchResponse,
    summary="Búsqueda semántica canónica (§6.5) — proxy intelligence_layer",
)
async def semantic_search(
    body: SemanticSearchRequest,
    response: Response,
    user: UserPublic = Depends(get_current_user),
) -> SemanticSearchResponse:
    """Búsqueda semántica. Sustituirá al legacy `/api/entities/lookup` en B.6.f (marcado deprecado)."""
    router = get_intelligence_router()
    try:
        res = await router.semantic_search(
            body.query, limit=body.limit, cnae_section=body.cnae_section
        )
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except SemanticProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_semantic_provider().provider_name
    return res


@intelligence_router.get(
    "/semantic-schema",
    response_model=SemanticSchema,
    summary="Schema del perfil semántico (§6.5) — cache 24h",
)
async def get_semantic_schema(
    response: Response,
    user: UserPublic = Depends(get_current_user),
) -> SemanticSchema:
    router = get_intelligence_router()
    try:
        s = await router.get_semantic_schema()
    except SemanticProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_semantic_provider().provider_name
    return s


@intelligence_router.get(
    "/semantic-catalog",
    response_model=SemanticCatalog,
    summary="Catálogo de taxonomías semánticas (§6.5) — cache 24h",
)
async def get_semantic_catalog(
    response: Response,
    user: UserPublic = Depends(get_current_user),
) -> SemanticCatalog:
    router = get_intelligence_router()
    try:
        c = await router.get_semantic_catalog()
    except SemanticProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_semantic_provider().provider_name
    return c


# ============================================================
# B.6.f · Endpoints canónicos UI (D2)
# `/api/companies/{cif}/section/{financial,identity,valuation,semantic}`
# devuelven `*Section` (schema optimizado para render UI).
# Los endpoints legacy `/identity`, `/financial-analysis`, `/valuation`,
# `/profile`, `/similar` se mantienen para retrocompat (Copilot, tests).
# ============================================================


@companies_intel_router.get(
    "/{cif}/section/identity",
    response_model=IdentitySection,
    summary="IdentitySection canónica UI (arroba-identity-v1) — B.6.f",
)
async def get_company_identity_section(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic | None = Depends(get_optional_current_user),  # mixed-access
) -> IdentitySection:
    """Sección Resumen (identidad + clasificación + ubicación + tamaño).

    Traducción a canónico UI vía `to_identity_section`. Devuelve
    `metadata.coverage.{core,ownership,officers,objeto_social}` explícito.
    """
    router = get_intelligence_router()
    try:
        record = await router.get_master_by_cif(cif)
    except MasterNotFoundError as exc:
        raise NotFoundError("identity_not_found", code="identity_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except MasterProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    section = to_identity_section(record)
    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Section-Engine"] = section.metadata.engine_version
    return section


@companies_intel_router.get(
    "/{cif}/section/financial",
    response_model=FinancialSection,
    summary="FinancialSection canónica UI (arroba-financial-v1) — B.6.f",
)
async def get_company_financial_section(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
) -> FinancialSection:
    """Sección Finanzas (evolution + P&L + Balance + Ratios + Anomaly).

    Se resuelven en paralelo `analyze` + `ratios/catalog`. Si el proveedor
    devuelve 404 (Master Layer vacío) el frontend recibe una `FinancialSection`
    con `metadata.coverage.*=False` en lugar de un error — se degrada con
    `UnavailableBlock` canónico.
    """
    router = get_intelligence_router()
    # Analyze (obligatorio)
    try:
        analysis = await router.get_financial_analysis(cif)
    except FinancialNotFoundError:
        # Devolvemos sección vacía con coverage=False (no rompe UI).
        empty = FinancialAnalysis(cif_normalized=cif.upper(), has_financials=False)
        section = to_financial_section(empty, None)
        settings = get_intelligence_settings()
        response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
        response.headers["X-Section-Engine"] = section.metadata.engine_version
        response.headers["X-Section-Coverage"] = "empty"
        return section
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except FinancialProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    # Ratios catalog (opcional — si falla el fetch, mapeamos sin catálogo).
    catalog = None
    try:
        catalog = await router.get_ratios_catalog()
    except (BreakerOpenError, FinancialProviderError):
        catalog = None

    section = to_financial_section(analysis, catalog)
    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Section-Engine"] = section.metadata.engine_version
    return section


@companies_intel_router.get(
    "/{cif}/section/valuation",
    response_model=ValuationSection,
    summary="ValuationSection canónica UI (arroba-financial-v1) — B.6.f",
)
async def get_company_valuation_section(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
) -> ValuationSection:
    router = get_intelligence_router()
    try:
        v = await router.get_valuation(cif)
    except FinancialNotFoundError:
        empty = Valuation(cif_normalized=cif.upper())
        section = to_valuation_section(empty)
        settings = get_intelligence_settings()
        response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
        response.headers["X-Section-Engine"] = section.metadata.engine_version
        response.headers["X-Section-Coverage"] = "empty"
        return section
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except FinancialProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    section = to_valuation_section(v)
    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Section-Engine"] = section.metadata.engine_version
    return section


@companies_intel_router.get(
    "/{cif}/section/semantic",
    response_model=SemanticSection,
    summary="SemanticSection canónica UI (arroba-semantic-v1) — B.6.f",
)
async def get_company_semantic_section(
    response: Response,
    limit: int = Query(10, ge=1, le=50),
    cif: str = Depends(_cif_param),
    user: UserPublic | None = Depends(get_optional_current_user),  # mixed-access
) -> SemanticSection:
    """Sección semántica (perfil + similares)."""
    router = get_intelligence_router()
    profile: SemanticProfile | None = None
    similar: SimilarCompanies | None = None
    try:
        profile = await router.get_semantic_profile(cif)
    except SemanticNotFoundError:
        profile = None
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except SemanticProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    try:
        similar = await router.get_semantic_similar(cif, limit=limit)
    except SemanticNotFoundError:
        similar = None
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except SemanticProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    section = to_semantic_section(profile, similar)
    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Section-Engine"] = section.metadata.engine_version
    if not section.coverage.profile and not section.coverage.similar:
        response.headers["X-Section-Coverage"] = "empty"
    return section


@internal_router.get(
    "/metrics",
    summary="Métricas Prometheus del intelligence_layer",
    include_in_schema=False,  # endpoint operativo, fuera del OpenAPI público
)
async def metrics(
    x_metrics_token: str | None = Header(default=None, alias="X-Metrics-Token"),
) -> Response:
    """Formato `text/plain; version=0.0.4`. Protegido opcionalmente por token."""
    settings = get_intelligence_settings()
    if settings.internal_metrics_token:
        if x_metrics_token != settings.internal_metrics_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="metrics_token_invalid",
            )
    body, content_type = render_metrics()
    return Response(content=body, media_type=content_type)


__all__ = [
    "companies_intel_router",
    "intelligence_router",
    "entities_semantic_router",
    "internal_router",
]
