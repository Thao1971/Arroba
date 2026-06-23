"""Idempotent admin seed for arroba.com backend.

Usage:
    cd /app/backend
    python scripts/seed_admin.py

Creates or updates the admin user described in /app/memory/test_credentials.md
(`admin@arroba.dev` / `Admin1234!`, role=admin). Connects to the REAL MongoDB
configured via MONGO_URL env (or default localhost:27017 / DB_NAME=arroba_com).

E0.4: there is NO public endpoint to promote users to admin. This script is the
official way to bootstrap the first admin. Subsequent admin promotion endpoints
will land in later stages once an admin already exists.
"""
import asyncio
import sys
from datetime import UTC, datetime
from pathlib import Path

# Make `src` importable when run as `python scripts/seed_admin.py`.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.config import get_settings  # noqa: E402
from src.core.database import get_db  # noqa: E402
from src.core.security import hash_password  # noqa: E402
from src.modules.auth.models import new_user_id  # noqa: E402

ADMIN_EMAIL = "admin@arroba.dev"
ADMIN_PASSWORD = "Admin1234!"
ADMIN_FULL_NAME = "arroba.com Bootstrap Admin"


async def seed_admin() -> dict:
    settings = get_settings()
    db = get_db()
    existing = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
    now = datetime.now(UTC)
    if existing:
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {
                "$set": {
                    "role": "admin",
                    "hashed_password": hash_password(ADMIN_PASSWORD),
                    "updated_at": now,
                    "email_verified": True,
                }
            },
        )
        action = "updated"
        user_id = existing["user_id"]
    else:
        user_id = new_user_id()
        doc = {
            "user_id": user_id,
            "email": ADMIN_EMAIL,
            "hashed_password": hash_password(ADMIN_PASSWORD),
            "full_name": ADMIN_FULL_NAME,
            "role": "admin",
            "is_active": True,
            "email_verified": True,
            "created_at": now,
            "updated_at": now,
        }
        await db.users.insert_one(doc)
        action = "created"
    return {
        "action": action,
        "user_id": user_id,
        "email": ADMIN_EMAIL,
        "mongo_url": settings.mongo_url,
        "db_name": settings.db_name,
    }


def main() -> None:
    result = asyncio.run(seed_admin())
    print(f"[seed_admin] {result['action']} admin user")
    print(f"            user_id : {result['user_id']}")
    print(f"            email   : {result['email']}")
    print(f"            password: {ADMIN_PASSWORD}  (CHANGE IN PROD)")
    print(f"            mongo   : {result['mongo_url']} / db={result['db_name']}")


if __name__ == "__main__":
    main()
