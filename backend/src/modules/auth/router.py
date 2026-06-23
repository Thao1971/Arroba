from datetime import datetime

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel

from src.modules.auth import service as auth_service
from src.modules.auth.dependencies import (
    SESSION_COOKIE,
    get_current_user,
    get_session_id,
)
from src.modules.auth.models import (
    AuthResponse,
    LoginPayload,
    RegisterPayload,
    SessionExchangePayload,
    UserPublic,
)
from src.modules.organizations.service import (
    list_memberships_for_user as _list_memberships,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_cookie(response: Response, session_id: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=False,  # toggled at the proxy in prod
        max_age=60 * 60 * 24 * 7,
        path="/",
    )


class MeResponse(BaseModel):
    user: UserPublic
    memberships: list[dict]


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: RegisterPayload, request: Request, response: Response) -> AuthResponse:
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    user, sid, expires = await auth_service.register_user(
        email=payload.email, password=payload.password, full_name=payload.full_name, ip=ip, user_agent=ua
    )
    _set_cookie(response, sid)
    return AuthResponse(user=user, session_expires_at=expires)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginPayload, request: Request, response: Response) -> AuthResponse:
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    user, sid, expires = await auth_service.login_user(
        email=payload.email, password=payload.password, ip=ip, user_agent=ua
    )
    _set_cookie(response, sid)
    return AuthResponse(user=user, session_expires_at=expires)


@router.post("/session", response_model=AuthResponse, status_code=201)
async def session_exchange(
    payload: SessionExchangePayload, request: Request, response: Response
) -> AuthResponse:
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    user, sid, expires = await auth_service.exchange_emergent_session(
        session_id=payload.session_id, ip=ip, user_agent=ua
    )
    _set_cookie(response, sid)
    return AuthResponse(user=user, session_expires_at=expires)


@router.get("/me", response_model=MeResponse)
async def me(user: UserPublic = Depends(get_current_user)) -> MeResponse:
    memberships = await _list_memberships(user.user_id)
    return MeResponse(
        user=user,
        memberships=[m.model_dump(mode="json") for m in memberships],
    )


@router.post(
    "/logout",
    summary="Logout (idempotent)",
    description=(
        "Invalidates the server-side session and clears the `arroba_session` cookie.\n\n"
        "**Idempotent**: returns 200 with `{ok: true}` regardless of session state "
        "(no session, expired session, or active session). Clients SHOULD treat any "
        "200 here as 'definitely logged out' and never branch on prior state."
    ),
    responses={200: {"description": "Logged out (always, idempotent)."}},
)
async def logout(
    response: Response, session_id: str | None = Depends(get_session_id)
) -> dict:
    await auth_service.logout(session_id)
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True, "logged_out_at": datetime.utcnow().isoformat()}
