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
from src.modules.auth.dependencies import get_current_user
from src.modules.auth.models import UserPublic
from src.modules.intelligence_layer.circuit_breaker import BreakerOpenError
from src.modules.intelligence_layer.config import get_intelligence_settings
from src.modules.intelligence_layer.interfaces.financial import (
    FinancialAnalysis,
    FinancialNotFoundError,
    FinancialProviderError,
    RatiosCatalog,
    Valuation,
)
from src.modules.intelligence_layer.interfaces.master import (
    MasterNotFoundError,
    MasterProviderError,
    MasterRecord,
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
    "/{cif}/valuation",
    response_model=Valuation,
    summary="Valoración canónica (§6.3) — proxy intelligence_layer",
)
async def get_company_valuation(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
) -> Valuation:
    """Devuelve `financial-intelligence/valuation` §6.3 con `engine_version=arroba-financial-v1`."""
    router = get_intelligence_router()
    try:
        val = await router.get_valuation(cif)
    except FinancialNotFoundError as exc:
        raise NotFoundError("valuation_not_found", code="valuation_not_found") from exc
    except BreakerOpenError as exc:
        raise ProviderUnavailableError(
            "circuit_breaker_open", code="provider_unavailable"
        ) from exc
    except FinancialProviderError as exc:
        raise ProviderError(exc.error_class, code="provider_error") from exc

    settings = get_intelligence_settings()
    response.headers["X-Intelligence-Mode"] = settings.agency_tool_mode
    response.headers["X-Provider"] = router._get_financial_provider().provider_name
    return val


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
