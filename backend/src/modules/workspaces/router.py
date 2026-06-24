"""Workspaces router. All endpoints require an authenticated user; the
visibility model is enforced inside the service layer."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Query

from src.modules.auth.dependencies import get_current_user
from src.modules.auth.models import UserPublic
from src.modules.workspaces import service
from src.modules.workspaces.models import (
    CreateWorkspacePayload,
    CreateWorkspaceResponse,
    ExtendWorkspacePayload,
    ExtendWorkspaceResponse,
    PatchWorkspacePayload,
    ShareWorkspacePayload,
    Workspace,
    WorkspaceDetail,
    WorkspaceList,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("", response_model=CreateWorkspaceResponse, status_code=201)
async def create(
    payload: CreateWorkspacePayload,
    user: UserPublic = Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
    accept_language: str | None = Header(default=None, alias="Accept-Language"),
) -> CreateWorkspaceResponse:
    """Persist an ephemeral workspace into the database. The user becomes the
    `created_by`. Defaults to the org passed in `X-Active-Org` header; falls
    back to the user's first active membership."""
    if x_active_org and not payload.organization_id:
        payload = payload.model_copy(update={"organization_id": x_active_org})
    locale = (accept_language or "es").split(",")[0].split("-")[0].lower() or "es"
    if locale not in ("es", "en"):
        locale = "es"
    return await service.create_workspace(payload, user.user_id, locale=locale)


@router.get("", response_model=WorkspaceList)
async def list_(
    user: UserPublic = Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
    type: str | None = Query(default=None),
    state: str = Query(default="active"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> WorkspaceList:
    return await service.list_workspaces(
        user.user_id,
        x_active_org,
        workspace_type=type,
        state=state,
        limit=limit,
        offset=offset,
    )


@router.get("/{workspace_id}", response_model=WorkspaceDetail)
async def detail(
    workspace_id: str,
    user: UserPublic = Depends(get_current_user),
) -> WorkspaceDetail:
    return await service.get_workspace(workspace_id, user.user_id)


@router.post(
    "/{workspace_id}/messages", response_model=ExtendWorkspaceResponse
)
async def extend(
    workspace_id: str,
    payload: ExtendWorkspacePayload,
    user: UserPublic = Depends(get_current_user),
) -> ExtendWorkspaceResponse:
    return await service.extend_workspace(workspace_id, payload, user.user_id)


@router.post("/{workspace_id}/share", response_model=Workspace)
async def share(
    workspace_id: str,
    payload: ShareWorkspacePayload,
    user: UserPublic = Depends(get_current_user),
) -> Workspace:
    return await service.share_workspace(workspace_id, payload, user.user_id)


@router.patch("/{workspace_id}", response_model=Workspace)
async def patch(
    workspace_id: str,
    payload: PatchWorkspacePayload,
    user: UserPublic = Depends(get_current_user),
) -> Workspace:
    return await service.patch_workspace(workspace_id, payload, user.user_id)


@router.delete("/{workspace_id}")
async def archive(
    workspace_id: str,
    user: UserPublic = Depends(get_current_user),
) -> dict[str, str]:
    return await service.archive_workspace(workspace_id, user.user_id)
