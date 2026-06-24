from fastapi import Cookie, Depends

from src.core.exceptions import ForbiddenError, UnauthorizedError
from src.modules.auth import service as auth_service
from src.modules.auth.cookies import SESSION_COOKIE
from src.modules.auth.models import UserPublic
from src.shared.types import Role


async def get_current_user(
    arroba_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> UserPublic:
    doc = await auth_service.resolve_session(arroba_session)
    return UserPublic(**doc)


async def get_optional_current_user(
    arroba_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> UserPublic | None:
    """Same as `get_current_user` but returns None when there is no valid
    session instead of raising. Used by routes that have a mixed access mode
    (e.g. `/api/companies/{cif}` is partially public).
    """
    if not arroba_session:
        return None
    try:
        doc = await auth_service.resolve_session(arroba_session)
    except UnauthorizedError:
        return None
    return UserPublic(**doc)


async def get_admin_user(user: UserPublic = Depends(get_current_user)) -> UserPublic:
    if user.role != Role.admin:
        raise ForbiddenError("admin_required", code="admin_required")
    return user


async def get_session_id(
    arroba_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> str | None:
    return arroba_session
