"""Endpoints FastAPI del intelligence_layer.

* GET /api/companies/{cif}/identity  → proxy MasterRecord §6.1 (auth requerida).
* GET /api/internal/metrics          → Prometheus text/plain 0.0.4.

Contrato interno congelado. El frontend consume `/identity` a partir de B.6.f.
`X-API-Key` NUNCA se expone al frontend (Regla R5).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Response, status

from src.core.exceptions import DomainError, NotFoundError
from src.core.logging import get_logger
from src.modules.auth.dependencies import get_current_user
from src.modules.auth.models import UserPublic
from src.modules.intelligence_layer.circuit_breaker import BreakerOpenError
from src.modules.intelligence_layer.config import get_intelligence_settings
from src.modules.intelligence_layer.interfaces.master import (
    MasterNotFoundError,
    MasterProviderError,
    MasterRecord,
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


__all__ = ["companies_intel_router", "internal_router"]
