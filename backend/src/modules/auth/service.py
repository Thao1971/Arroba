"""Auth service — owns db.users + db.user_sessions.
No other module reads these collections directly."""
from datetime import UTC, datetime
from typing import Any

import httpx

from src.core.config import get_settings
from src.core.database import get_db
from src.core.exceptions import ConflictError, UnauthorizedError
from src.core.logging import get_logger
from src.core.security import (
    hash_password,
    new_session_id,
    session_expiry,
    verify_password,
)
from src.modules.auth.models import UserInDB, UserPublic
from src.shared.types import Role

log = get_logger("auth")


def _to_public(doc: dict[str, Any]) -> UserPublic:
    return UserPublic(**doc)


async def _create_session(
    user_id: str, ip: str | None = None, user_agent: str | None = None
) -> tuple[str, datetime]:
    db = get_db()
    sid = new_session_id()
    expires = session_expiry()
    await db.user_sessions.insert_one(
        {
            "session_id": sid,
            "user_id": user_id,
            "expires_at": expires,
            "ip": ip,
            "user_agent": user_agent,
            "created_at": datetime.now(UTC),
        }
    )
    return sid, expires


async def register_user(
    email: str,
    password: str,
    full_name: str | None,
    ip: str | None = None,
    user_agent: str | None = None,
) -> tuple[UserPublic, str, datetime]:
    db = get_db()
    email_norm = email.lower()
    if await db.users.find_one({"email": email_norm}):
        raise ConflictError("email_already_registered", code="email_already_registered")
    user = UserInDB(
        email=email_norm,
        hashed_password=hash_password(password),
        full_name=full_name,
        role=Role.subscriber,
    )
    await db.users.insert_one(user.model_dump(mode="json"))
    sid, expires = await _create_session(user.user_id, ip, user_agent)
    log.info("auth.register", user_id=user.user_id, email=email_norm)
    return _to_public(user.model_dump(mode="json")), sid, expires


async def login_user(
    email: str, password: str, ip: str | None = None, user_agent: str | None = None
) -> tuple[UserPublic, str, datetime]:
    db = get_db()
    email_norm = email.lower()
    doc = await db.users.find_one({"email": email_norm}, {"_id": 0})
    if not doc or not doc.get("hashed_password"):
        raise UnauthorizedError("invalid_credentials", code="invalid_credentials")
    if not verify_password(password, doc["hashed_password"]):
        raise UnauthorizedError("invalid_credentials", code="invalid_credentials")
    now = datetime.now(UTC)
    await db.users.update_one(
        {"user_id": doc["user_id"]}, {"$set": {"last_login": now, "updated_at": now}}
    )
    doc["last_login"] = now
    sid, expires = await _create_session(doc["user_id"], ip, user_agent)
    log.info("auth.login", user_id=doc["user_id"])
    return _to_public(doc), sid, expires


async def exchange_emergent_session(
    session_id: str, ip: str | None = None, user_agent: str | None = None
) -> tuple[UserPublic, str, datetime]:
    settings = get_settings()
    async with httpx.AsyncClient(timeout=12) as client:
        r = await client.get(
            settings.emergent_auth_full_url,
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise UnauthorizedError("emergent_auth_failed", code="emergent_auth_failed")
    data = r.json() or {}
    email = (data.get("email") or "").lower()
    if not email:
        raise UnauthorizedError("emergent_auth_missing_email", code="emergent_auth_failed")
    db = get_db()
    doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not doc:
        user = UserInDB(
            email=email,
            full_name=data.get("name"),
            google_id=data.get("id") or data.get("sub"),
            role=Role.subscriber,
            email_verified=True,
        )
        await db.users.insert_one(user.model_dump(mode="json"))
        doc = user.model_dump(mode="json")
        log.info("auth.register_oauth", user_id=user.user_id, email=email)
    else:
        await db.users.update_one(
            {"user_id": doc["user_id"]},
            {"$set": {"last_login": datetime.now(UTC)}},
        )
        log.info("auth.login_oauth", user_id=doc["user_id"])
    sid, expires = await _create_session(doc["user_id"], ip, user_agent)
    return _to_public(doc), sid, expires


async def resolve_session(session_id: str | None) -> dict[str, Any]:
    """Returns the raw user doc (dict). Caller wraps as needed."""
    if not session_id:
        raise UnauthorizedError("no_session", code="no_session")
    db = get_db()
    sdoc = await db.user_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not sdoc:
        raise UnauthorizedError("invalid_session", code="invalid_session")
    exp = sdoc["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=UTC)
    if exp < datetime.now(UTC):
        raise UnauthorizedError("session_expired", code="session_expired")
    udoc = await db.users.find_one({"user_id": sdoc["user_id"]}, {"_id": 0})
    if not udoc:
        raise UnauthorizedError("user_not_found", code="user_not_found")
    return udoc


async def logout(session_id: str | None) -> None:
    if not session_id:
        return
    db = get_db()
    await db.user_sessions.delete_one({"session_id": session_id})
    log.info("auth.logout", session_id=session_id[:12] + "…")


# === Public cross-module accessor (Boundary First) =====================
async def get_user_public(user_id: str) -> UserPublic | None:
    """Other modules import THIS, not the collection."""
    db = get_db()
    doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return _to_public(doc) if doc else None
