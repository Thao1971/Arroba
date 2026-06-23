"""Mongo (Motor) async client + index init + test-override hook.
Every module accesses the database via `get_db()` only. Tests inject a
mongomock-motor instance through `override_db()`."""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.core.config import get_settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(settings.mongo_url, uuidRepresentation="standard")
    return _client


def get_db() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        settings = get_settings()
        _db = get_client()[settings.db_name]
    return _db


def override_db(db: AsyncIOMotorDatabase | None) -> None:
    """Used exclusively by tests."""
    global _db
    _db = db


async def init_indexes() -> None:
    """Idempotent index creation for every collection owned by a module."""
    db = get_db()
    # users
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.users.create_index("google_id", unique=True, sparse=True)
    # organizations
    await db.organizations.create_index("org_id", unique=True)
    await db.organizations.create_index("tax_id", sparse=True)
    # memberships
    await db.memberships.create_index("membership_id", unique=True)
    await db.memberships.create_index([("user_id", 1), ("org_id", 1)], unique=True)
    await db.memberships.create_index("user_id")
    await db.memberships.create_index("org_id")
    # user_sessions — TTL on expires_at
    await db.user_sessions.create_index("session_id", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    # org_invitations
    await db.org_invitations.create_index("invitation_id", unique=True)
    await db.org_invitations.create_index("token", unique=True)
    await db.org_invitations.create_index("email")
    await db.org_invitations.create_index("org_id")


async def close_client() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None
