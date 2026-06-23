from fastapi import APIRouter, Depends

from src.modules.auth.dependencies import get_current_user
from src.modules.auth.models import UserPublic
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
