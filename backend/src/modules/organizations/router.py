from fastapi import APIRouter, Depends

from src.modules.auth.dependencies import get_current_user
from src.modules.auth.models import UserPublic
from src.modules.organizations import service
from src.modules.organizations.models import (
    CreateOrgPayload,
    CreateOrgResponse,
    InvitationPublic,
    InvitePayload,
    MembershipPublic,
    OrgPublic,
    OrgWithMembership,
)

orgs_router = APIRouter(prefix="/organizations", tags=["organizations"])
inv_router = APIRouter(prefix="/invitations", tags=["organizations"])


@orgs_router.post("", response_model=CreateOrgResponse, status_code=201)
async def create_org(
    payload: CreateOrgPayload, user: UserPublic = Depends(get_current_user)
) -> CreateOrgResponse:
    return await service.create_org(payload, created_by=user.user_id)


@orgs_router.get("/mine", response_model=list[OrgWithMembership])
async def list_mine(
    user: UserPublic = Depends(get_current_user),
) -> list[OrgWithMembership]:
    return await service.list_my_orgs(user.user_id)


@orgs_router.get("/{org_id}", response_model=OrgPublic)
async def get_org(
    org_id: str, user: UserPublic = Depends(get_current_user)
) -> OrgPublic:
    return await service.get_org(org_id, requesting_user_id=user.user_id)


@orgs_router.get("/{org_id}/members", response_model=list[MembershipPublic])
async def list_members(
    org_id: str, user: UserPublic = Depends(get_current_user)
) -> list[MembershipPublic]:
    return await service.list_members(org_id, requesting_user_id=user.user_id)


@orgs_router.post("/{org_id}/invitations", response_model=InvitationPublic, status_code=201)
async def create_invitation(
    org_id: str, payload: InvitePayload, user: UserPublic = Depends(get_current_user)
) -> InvitationPublic:
    return await service.create_invitation(org_id, payload, invited_by=user.user_id)


@inv_router.post("/{token}/accept", response_model=MembershipPublic, status_code=201)
async def accept_invitation(
    token: str, user: UserPublic = Depends(get_current_user)
) -> MembershipPublic:
    return await service.accept_invitation(token, accepting_user_id=user.user_id)
