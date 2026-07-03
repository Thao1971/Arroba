from __future__ import annotations

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, ConfigDict, Field

from src.modules.auth.dependencies import get_current_user
from src.modules.auth.models import UserPublic
from src.modules.companies import service as companies_service
from src.modules.users import service
from src.modules.users.models import UpdateMePayload

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def get_me(user: UserPublic = Depends(get_current_user)) -> UserPublic:
    return user


@router.patch("/me", response_model=UserPublic)
async def patch_me(
    payload: UpdateMePayload, user: UserPublic = Depends(get_current_user)
) -> UserPublic:
    return await service.update_me(user.user_id, payload.full_name)


# ---------------------------------------------------------------------------
# GET /api/users/me/watchlist  (Sprint 1)
# ---------------------------------------------------------------------------
class WatchlistItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    # Forma genérica multi-tipo (Regla 2 del brief): en Sprint 1 sólo `company`;
    # cuando lleguen sector/opportunity/territory el contract no cambia.
    type: Literal["company"] = "company"
    id: str
    display_name: str
    secondary_label: str | None = None
    icon: Literal["building"] = "building"
    added_at: datetime | None = None
    visibility: Literal["private", "team"] = "private"


class WatchlistResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    items: list[WatchlistItem] = Field(default_factory=list)
    total: int = 0


@router.get("/me/watchlist", response_model=WatchlistResponse)
async def get_my_watchlist(
    user: UserPublic = Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> WatchlistResponse:
    raw = await companies_service.list_user_watchlist(
        user_id=user.user_id, org_id=x_active_org
    )
    items = [WatchlistItem(**row) for row in raw]
    return WatchlistResponse(items=items, total=len(items))
