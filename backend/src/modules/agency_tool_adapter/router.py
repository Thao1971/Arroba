from fastapi import APIRouter, Depends, Query, Response

from src.modules.agency_tool_adapter import service
from src.modules.agency_tool_adapter.dependencies import get_admin_user, get_current_user
from src.modules.agency_tool_adapter.models import (
    CreateMasterCompanyMockPayload,
    EnrichedCompany,
    Profile,
    StatusResponse,
    UpdateMasterCompanyMockPayload,
)
from src.modules.auth.models import UserPublic

# ====================================================================
# Public surface (any authenticated user)
# ====================================================================
public_router = APIRouter(prefix="/agency-tool", tags=["agency-tool"])


@public_router.get("/status", response_model=StatusResponse)
async def get_status(
    _user: UserPublic = Depends(get_current_user),
) -> StatusResponse:
    return await service.status()


@public_router.get(
    "/companies/{master_company_id}",
    response_model=EnrichedCompany,
    responses={
        200: {
            "description": (
                "Enriched company. Response header `X-Source` reports the source "
                "of truth (`mock` in E0.4, `real` once REQ-001 lands)."
            )
        },
        404: {"description": "master_company_id not found."},
    },
)
async def get_company(
    master_company_id: str,
    response: Response,
    profile: Profile = Query("full"),
    _user: UserPublic = Depends(get_current_user),
) -> EnrichedCompany:
    data = await service.enrich_company(master_company_id, profile)
    response.headers["X-Source"] = data.source
    return data


# ====================================================================
# Admin surface (role == admin)
# ====================================================================
admin_router = APIRouter(prefix="/admin/agency-tool", tags=["agency-tool-admin"])


@admin_router.post("/master-companies-mock", status_code=201)
async def admin_create(
    payload: CreateMasterCompanyMockPayload,
    admin: UserPublic = Depends(get_admin_user),
) -> dict:
    return await service.create_master_company_mock(payload, created_by=admin.user_id)


@admin_router.get("/master-companies-mock")
async def admin_list(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _admin: UserPublic = Depends(get_admin_user),
) -> list[dict]:
    return await service.list_master_companies_mock(limit=limit, offset=offset)


@admin_router.get("/master-companies-mock/{master_company_id}")
async def admin_get(
    master_company_id: str,
    _admin: UserPublic = Depends(get_admin_user),
) -> dict:
    return await service.get_master_company_mock(master_company_id)


@admin_router.put("/master-companies-mock/{master_company_id}")
async def admin_update(
    master_company_id: str,
    payload: UpdateMasterCompanyMockPayload,
    _admin: UserPublic = Depends(get_admin_user),
) -> dict:
    return await service.update_master_company_mock(master_company_id, payload)


@admin_router.delete("/master-companies-mock/{master_company_id}")
async def admin_delete(
    master_company_id: str,
    _admin: UserPublic = Depends(get_admin_user),
) -> dict:
    return await service.delete_master_company_mock(master_company_id)
