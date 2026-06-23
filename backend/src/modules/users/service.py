"""Users service — mutates db.users via the user_id key.
Reads happen via auth.service.get_user_public (Boundary First)."""
from datetime import UTC, datetime

from src.core.database import get_db
from src.core.logging import get_logger
from src.modules.auth.models import UserPublic
from src.modules.auth.service import get_user_public

log = get_logger("users")


async def update_me(user_id: str, full_name: str | None) -> UserPublic:
    db = get_db()
    patch: dict = {"updated_at": datetime.now(UTC)}
    if full_name is not None:
        patch["full_name"] = full_name
    await db.users.update_one({"user_id": user_id}, {"$set": patch})
    fresh = await get_user_public(user_id)
    log.info("users.update_me", user_id=user_id)
    assert fresh is not None
    return fresh
