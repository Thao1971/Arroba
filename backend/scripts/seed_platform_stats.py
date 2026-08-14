"""Idempotent seed for the platform_stats_mock singleton.

Usage:
    cd /app/backend
    python scripts/seed_platform_stats.py

Initial values come from the public Etapa 1.1.5 brief (Spanish economic
intelligence aggregates). Re-running the script is safe: it upserts the single
document keyed by `_key="singleton"`.
"""
import asyncio
import sys
from datetime import UTC, datetime
from pathlib import Path

# Make `src` importable when run as `python scripts/seed_platform_stats.py`.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import get_db  # noqa: E402

SEED = {
    # REQ-001 · shape canónico (2026-08-14): 4 métricas top-level.
    # Ver `PlatformStats` en `src/modules/agency_tool_adapter/models.py`.
    "companies_analyzed": 24992,
    "active_opportunities": 672190,
    "market_movements": 28458,
    "signals_detected": 6159,
    "confidence": 1.0,
    "lineage": "raw",
}


async def seed_platform_stats() -> dict:
    db = get_db()
    now = datetime.now(UTC)
    payload = {
        **SEED,
        "_key": "singleton",
        "last_updated": now,
        "valid_until": None,
        "updated_at": now,
        "updated_by": "seed_script",
    }
    result = await db.platform_stats_mock.update_one(
        {"_key": "singleton"}, {"$set": payload}, upsert=True
    )
    return {
        "action": "inserted" if result.upserted_id else "updated",
        "updated_at": now.isoformat(),
        "companies_analyzed": SEED["companies_analyzed"],
    }


def main() -> None:
    result = asyncio.run(seed_platform_stats())
    print(f"[seed_platform_stats] {result['action']} singleton")
    print(f"                       last_updated: {result['updated_at']}")


if __name__ == "__main__":
    main()
