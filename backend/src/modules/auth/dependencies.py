from fastapi import Cookie, Depends

from src.core.exceptions import ForbiddenError
from src.modules.auth import service as auth_service
from src.modules.auth.models import UserPublic
from src.shared.types import Role

SESSION_COOKIE = "arroba_session"


async def get_current_user(
    arroba_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> UserPublic:
    doc = await auth_service.resolve_session(arroba_session)
    return UserPublic(**doc)


async def get_admin_user(user: UserPublic = Depends(get_current_user)) -> UserPublic:
    if user.role != Role.admin:
        raise ForbiddenError("admin_required", code="admin_required")
    return user


async def get_session_id(
    arroba_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> str | None:
    return arroba_session
