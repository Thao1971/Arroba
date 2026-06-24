"""FastAPI router for the companies module — 8 endpoints.

Boundary:
  - GET /api/companies/{cif}              public partial / auth full
  - GET /api/companies/by-id/{master_id}  307 redirect to canonical CIF
  - GET /api/companies/{cif}/conversation auth
  - POST /api/companies/{cif}/messages    auth — invokes Company Advisor
  - POST /api/companies/{cif}/skills/analyze     auth — rate-limited 60s
  - POST /api/companies/{cif}/skills/value       auth — deterministic
  - POST /api/companies/{cif}/skills/comparables auth — graceful fallback
  - POST /api/companies/{cif}/watchlist          auth — toggle save/unsave
  - POST /api/companies/{cif}/share              auth — toggle private/team

The `X-Source: mock` header is set on every response that returns adapter-
sourced data so the frontend can banner the boundary state.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Path, Response
from fastapi.responses import RedirectResponse

from src.core.exceptions import BadRequestError
from src.modules.auth.dependencies import (
    get_current_user,
    get_optional_current_user,
)
from src.modules.auth.models import UserPublic
from src.modules.companies import service
from src.modules.companies.models import (
    CompanyDetailResponse,
    GetConversationResponse,
    RefreshAnalysisResponse,
    RefreshComparablesResponse,
    RefreshValuationResponse,
    SendMessageRequest,
    SendMessageResponse,
    ShareToggleResponse,
    WatchlistToggleResponse,
)

router = APIRouter(prefix="/api/companies", tags=["companies"])


def _cif_param(cif: str = Path(..., min_length=9, max_length=9, regex=r"^[A-Za-z]\d{8}$")) -> str:
    return cif.upper()


# ---------------------------------------------------------------------------
# 1) GET /api/companies/{cif} — public partial / auth full
# ---------------------------------------------------------------------------
@router.get("/by-id/{master_company_id}")
async def get_by_master_id(
    master_company_id: str = Path(..., min_length=3, max_length=80),
) -> RedirectResponse:
    """307 redirect from the unstable master_company_id to the canonical CIF
    URL. Kept as a separate route so the SDK can keep links stable across
    identity refactors."""
    cif = await service.get_canonical_cif_for_master_id(master_company_id)
    return RedirectResponse(
        url=f"/api/companies/{cif.upper()}", status_code=307,
    )


@router.get("/{cif}", response_model=CompanyDetailResponse)
async def get_detail(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic | None = Depends(get_optional_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
    locale: str = Header(default="es", alias="X-Locale"),
) -> CompanyDetailResponse:
    """Anonymous → sections 1-3 + `locked_sections`. Authenticated → full."""
    detail = await service.get_company_detail(
        cif,
        user_id=user.user_id if user else None,
        org_id=x_active_org if user else None,
        locale=locale or "es",
    )
    response.headers["X-Source"] = detail.source
    return detail


# ---------------------------------------------------------------------------
# 2) Conversation (auth)
# ---------------------------------------------------------------------------
@router.get("/{cif}/conversation", response_model=GetConversationResponse)
async def get_conversation(
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
) -> GetConversationResponse:
    return await service.get_conversation(user_id=user.user_id, cif=cif)


@router.post("/{cif}/messages", response_model=SendMessageResponse)
async def post_message(
    payload: SendMessageRequest,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
    locale: str = Header(default="es", alias="X-Locale"),
) -> SendMessageResponse:
    return await service.send_message(
        user_id=user.user_id, cif=cif, query=payload.query, locale=locale or "es"
    )


# ---------------------------------------------------------------------------
# 3) Skill refreshes (auth)
# ---------------------------------------------------------------------------
@router.post(
    "/{cif}/skills/analyze",
    response_model=RefreshAnalysisResponse,
    responses={429: {"description": "Rate limited"}},
)
async def post_analyze(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
    locale: str = Header(default="es", alias="X-Locale"),
) -> RefreshAnalysisResponse:
    try:
        block = await service.refresh_analysis(
            user_id=user.user_id, cif=cif, locale=locale or "es"
        )
    except service.RateLimitedError as exc:
        response.status_code = 429
        response.headers["Retry-After"] = str(exc.retry_after_s)
        # Return a body the frontend can parse for UX feedback.
        return RefreshAnalysisResponse.model_construct(
            block={
                "id": "blk_rate_limit",
                "type": "narrative",
                "props": {
                    "title": "Rate limit",
                    "summary": f"Espera {exc.retry_after_s}s.",
                    "key_points": [], "risks": [], "opportunities": [], "citations": [],
                },
            }  # type: ignore[arg-type]
        )
    response.headers["X-Source"] = "mock"
    return RefreshAnalysisResponse(block=block)


@router.post("/{cif}/skills/value", response_model=RefreshValuationResponse)
async def post_value(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
) -> RefreshValuationResponse:
    block = await service.refresh_valuation(user_id=user.user_id, cif=cif)
    response.headers["X-Source"] = "mock"
    return RefreshValuationResponse(block=block)


@router.post("/{cif}/skills/comparables", response_model=RefreshComparablesResponse)
async def post_comparables(
    response: Response,
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
) -> RefreshComparablesResponse:
    block = await service.refresh_comparables(user_id=user.user_id, cif=cif)
    response.headers["X-Source"] = "mock"
    return RefreshComparablesResponse(block=block)


# ---------------------------------------------------------------------------
# 4) Watchlist + Share (auth)
# ---------------------------------------------------------------------------
@router.post("/{cif}/watchlist", response_model=WatchlistToggleResponse)
async def post_watchlist(
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> WatchlistToggleResponse:
    if not x_active_org:
        raise BadRequestError("organization_required", code="organization_required")
    saved, visibility = await service.toggle_watchlist(
        user_id=user.user_id, org_id=x_active_org, cif=cif
    )
    return WatchlistToggleResponse(saved=saved, visibility=visibility)


@router.post("/{cif}/share", response_model=ShareToggleResponse)
async def post_share(
    cif: str = Depends(_cif_param),
    user: UserPublic = Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> ShareToggleResponse:
    if not x_active_org:
        raise BadRequestError("organization_required", code="organization_required")
    visibility = await service.toggle_share(
        user_id=user.user_id, org_id=x_active_org, cif=cif
    )
    return ShareToggleResponse(visibility=visibility)


__all__ = ["router"]
