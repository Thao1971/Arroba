"""Idempotent demo seed for arroba.com (E1.5+).

Creates / refreshes:
  - 1 shared organisation: "ARROBA Demo Org" (tax_id B99999999, ES).
  - 4 demo users (buyer / seller / advisor / equipo) sharing that org as their
    active membership.

Usage:
    cd /app/backend
    python scripts/seed_demo_users.py

Idempotent: re-running the script will:
  - reuse the org by tax_id (no duplicate),
  - reuse each user by email (no duplicate),
  - reset the password to `Arroba2026!` and the membership status to `active`,
  - ensure email_verified=True and is_active=True so OnboardingGuard lets them
    straight into the app.

The `role` column in the table is a metadata tag for upcoming role-based
surfaces (E1.7). The platform doesn't differentiate UX by it yet.
"""
import asyncio
import sys
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import get_db  # noqa: E402
from src.core.security import hash_password  # noqa: E402
from src.modules.auth.models import new_user_id  # noqa: E402

DEMO_PASSWORD = "Arroba2026!"
DEMO_ORG = {
    "legal_name": "ARROBA Demo Org",
    "tax_id": "B99999999",
    "country": "ES",
}

# `mna_role` is a metadata tag, NOT the org-membership role enum.
DEMO_USERS = [
    {"email": "buyer@arroba.com",   "full_name": "Buyer Demo",   "mna_role": "buyer"},
    {"email": "seller@arroba.com",  "full_name": "Seller Demo",  "mna_role": "seller"},
    {"email": "advisor@arroba.com", "full_name": "Advisor Demo", "mna_role": "advisor"},
    {"email": "equipo@arroba.com",  "full_name": "Equipo Demo",  "mna_role": "team_member"},
]


async def _ensure_org() -> str:
    db = get_db()
    now = datetime.now(UTC)
    existing = await db.organizations.find_one({"tax_id": DEMO_ORG["tax_id"]}, {"_id": 0})
    if existing:
        await db.organizations.update_one(
            {"tax_id": DEMO_ORG["tax_id"]},
            {"$set": {"legal_name": DEMO_ORG["legal_name"], "country": DEMO_ORG["country"], "updated_at": now}},
        )
        return existing["org_id"]
    org_id = f"org_{new_user_id().split('_')[-1]}"
    await db.organizations.insert_one(
        {
            "org_id": org_id,
            "legal_name": DEMO_ORG["legal_name"],
            "tax_id": DEMO_ORG["tax_id"],
            "country": DEMO_ORG["country"],
            "created_by": "seed_demo",
            "created_at": now,
            "updated_at": now,
            "plan_type": None,
        }
    )
    return org_id


async def _ensure_user(user: dict, org_id: str) -> str:
    db = get_db()
    now = datetime.now(UTC)
    existing = await db.users.find_one({"email": user["email"]}, {"_id": 0})
    if existing:
        await db.users.update_one(
            {"email": user["email"]},
            {
                "$set": {
                    "hashed_password": hash_password(DEMO_PASSWORD),
                    "is_active": True,
                    "email_verified": True,
                    "full_name": user["full_name"],
                    "metadata": {**(existing.get("metadata") or {}), "mna_role": user["mna_role"]},
                    "updated_at": now,
                }
            },
        )
        user_id = existing["user_id"]
    else:
        user_id = new_user_id()
        await db.users.insert_one(
            {
                "user_id": user_id,
                "email": user["email"],
                "hashed_password": hash_password(DEMO_PASSWORD),
                "full_name": user["full_name"],
                "role": "subscriber",
                "is_active": True,
                "email_verified": True,
                "metadata": {"mna_role": user["mna_role"]},
                "created_at": now,
                "updated_at": now,
            }
        )
    # Ensure membership.
    membership_id = f"mem_{user_id}_{org_id}"
    await db.memberships.update_one(
        {"user_id": user_id, "org_id": org_id},
        {
            "$set": {
                "membership_id": membership_id,
                "user_id": user_id,
                "org_id": org_id,
                "role_in_org": "operator",
                "status": "active",
                "accepted_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    return user_id


async def seed_demo_users() -> dict:
    org_id = await _ensure_org()
    rows: list[tuple[str, str, str]] = []
    for u in DEMO_USERS:
        uid = await _ensure_user(u, org_id)
        rows.append((u["email"], DEMO_PASSWORD, u["mna_role"]))
    return {"org_id": org_id, "users": rows}


def main() -> None:
    result = asyncio.run(seed_demo_users())
    print(f"[seed_demo_users] org_id={result['org_id']} ('ARROBA Demo Org', B99999999)")
    print()
    print("  Email                       Password       M&A role")
    print("  --------------------------  -------------  -----------")
    for email, password, mna_role in result["users"]:
        print(f"  {email:<26}  {password:<13}  {mna_role}")
    print()
    print("Usuarios demo. NO usar en producción.")


if __name__ == "__main__":
    main()
