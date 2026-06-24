"""Agency Tool adapter — owns db.master_companies_mock.

=== Boundary First contract ============================================
This is the MOCK implementation. The real Agency Tool lives in a different
repo (see /app/_requirements_for_agency_tool/README.md REQ-001).

To replace mock by real:
  - DO NOT change the signature of these functions.
  - DO NOT change the shape of EnrichedCompany.
  - Only swap the body of `enrich_company` to call the real HTTPX client.
  - Keep the X-Source response header (mock|real) and the [MOCK]/[REAL]
    log marker so arroba can audit which path served each request.

No other module in this backend reads master_companies_mock directly.
========================================================================
"""
from datetime import UTC, datetime
from typing import Any

from src.core.database import get_db
from src.core.exceptions import ConflictError, NotFoundError
from src.core.logging import get_logger

try:
    from pymongo.errors import DuplicateKeyError
except ImportError:  # pragma: no cover
    DuplicateKeyError = Exception  # type: ignore[assignment,misc]
from src.modules.agency_tool_adapter.models import (
    AdapterStatus,
    CreateMasterCompanyMockPayload,
    CreatePlatformStatsMockPayload,
    EnrichedCompany,
    Financials,
    Lineage,
    MasterCompanyMockInDB,
    PlatformStats,
    Profile,
    StatusResponse,
    UpdateMasterCompanyMockPayload,
    UpdatePlatformStatsMockPayload,
    new_master_company_id,
)

log = get_logger("agency_tool_adapter")

ADAPTER_NAME = "enrich_company"
ADAPTER_MODE = "mock"
ADAPTER_SINCE = "2026-06-23"  # E0.4 launch


# =====================================================================
# Public surface — the only path arroba.com uses to read enriched data
# =====================================================================
async def enrich_company(master_company_id: str, profile: Profile = "full") -> EnrichedCompany:
    db = get_db()
    doc = await db.master_companies_mock.find_one(
        {"master_company_id": master_company_id}, {"_id": 0}
    )
    if not doc:
        raise NotFoundError("master_company_not_found", code="master_company_not_found")

    log.info(
        "[MOCK] agency_tool.enrich_company",
        source=ADAPTER_MODE,
        master_company_id=master_company_id,
        profile=profile,
    )

    fin = Financials(**doc["financials"]) if doc.get("financials") else None
    return EnrichedCompany(
        master_company_id=doc["master_company_id"],
        cif=doc.get("cif"),
        legal_name=doc["legal_name"],
        sector=doc.get("sector"),
        region=doc.get("region"),
        country=doc.get("country", "ES"),
        financials=fin,
        confidence=float(doc.get("confidence", 0.85)),
        lineage=Lineage(doc.get("lineage", "normalized")),
        valid_until=doc.get("valid_until"),
        signals=[],
        scores={},
        recommendations=[],
        source=ADAPTER_MODE,
    )


async def status() -> StatusResponse:
    return StatusResponse(
        adapters=[
            AdapterStatus(
                name=ADAPTER_NAME,
                mode=ADAPTER_MODE,
                since=ADAPTER_SINCE,
                endpoint_when_real="POST https://agency-tool/v1/enrich_company",
                note=(
                    "Mock implementation reads from master_companies_mock collection."
                    " Switch to real when Agency Tool delivers REQ-001."
                ),
            ),
            AdapterStatus(
                name=PLATFORM_STATS_NAME,
                mode=ADAPTER_MODE,
                since="2026-06-24",
                endpoint_when_real="GET https://agency-tool/v1/platform_stats",
                note=(
                    "Mock implementation reads from platform_stats_mock singleton."
                    " Switch to real when Agency Tool delivers REQ-002."
                ),
            ),
        ]
    )


# =====================================================================
# Platform stats — public read + admin CRUD over platform_stats_mock
# =====================================================================
PLATFORM_STATS_NAME = "platform_stats"
PLATFORM_STATS_KEY = "singleton"  # only ONE document per arroba.com deployment


async def get_platform_stats() -> PlatformStats:
    """PUBLIC read. Anonymous visitors see this on the home page."""
    db = get_db()
    doc = await db.platform_stats_mock.find_one({"_key": PLATFORM_STATS_KEY}, {"_id": 0})
    if not doc:
        raise NotFoundError("platform_stats_not_seeded", code="platform_stats_not_seeded")
    log.info("[MOCK] agency_tool.get_platform_stats", source=ADAPTER_MODE)
    return PlatformStats(
        companies_with_intelligence=int(doc["companies_with_intelligence"]),
        companies_with_financials=int(doc["companies_with_financials"]),
        economic_metrics_total=int(doc["economic_metrics_total"]),
        corporate_movements=int(doc["corporate_movements"]),
        investors_and_funds=int(doc["investors_and_funds"]),
        sectors_analyzed=int(doc["sectors_analyzed"]),
        companies_with_public_contracts=int(doc["companies_with_public_contracts"]),
        cross_sectors=int(doc["cross_sectors"]),
        last_updated=_as_dt(doc["last_updated"]),
        confidence=float(doc.get("confidence", 1.0)),
        lineage=Lineage(doc.get("lineage", "raw")),
        valid_until=_as_dt(doc.get("valid_until")) if doc.get("valid_until") else None,
        source=ADAPTER_MODE,
    )


async def upsert_platform_stats_mock(
    payload: "CreatePlatformStatsMockPayload", updated_by: str
) -> dict[str, Any]:
    """Admin write. Either creates the singleton or replaces all of its fields."""
    db = get_db()
    data = payload.model_dump(mode="json", exclude_none=True)
    now = datetime.now(UTC)
    data["last_updated"] = data.get("last_updated") or now
    data["_key"] = PLATFORM_STATS_KEY
    data["updated_at"] = now
    data["updated_by"] = updated_by
    await db.platform_stats_mock.update_one(
        {"_key": PLATFORM_STATS_KEY}, {"$set": data}, upsert=True
    )
    log.info("[MOCK] agency_tool.upsert_platform_stats_mock", updated_by=updated_by)
    return await _get_platform_stats_doc()


async def update_platform_stats_mock(
    payload: "UpdatePlatformStatsMockPayload", updated_by: str
) -> dict[str, Any]:
    """Partial admin update."""
    db = get_db()
    patch = payload.model_dump(mode="json", exclude_none=True)
    if not patch:
        return await _get_platform_stats_doc()
    patch["updated_at"] = datetime.now(UTC)
    patch["updated_by"] = updated_by
    if "last_updated" not in patch:
        patch["last_updated"] = patch["updated_at"]
    res = await db.platform_stats_mock.update_one(
        {"_key": PLATFORM_STATS_KEY}, {"$set": patch}
    )
    if res.matched_count == 0:
        raise NotFoundError("platform_stats_not_seeded", code="platform_stats_not_seeded")
    log.info("[MOCK] agency_tool.update_platform_stats_mock", updated_by=updated_by)
    return await _get_platform_stats_doc()


async def delete_platform_stats_mock() -> dict[str, str]:
    db = get_db()
    res = await db.platform_stats_mock.delete_one({"_key": PLATFORM_STATS_KEY})
    if res.deleted_count == 0:
        raise NotFoundError("platform_stats_not_seeded", code="platform_stats_not_seeded")
    return {"deleted": PLATFORM_STATS_KEY}


async def _get_platform_stats_doc() -> dict[str, Any]:
    db = get_db()
    doc = await db.platform_stats_mock.find_one({"_key": PLATFORM_STATS_KEY}, {"_id": 0})
    if not doc:
        raise NotFoundError("platform_stats_not_seeded", code="platform_stats_not_seeded")
    for k in ("last_updated", "updated_at", "valid_until"):
        v = doc.get(k)
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


def _as_dt(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    raise TypeError(f"unsupported datetime value: {value!r}")


# =====================================================================
# Admin surface — CRUD over master_companies_mock
# =====================================================================
async def create_master_company_mock(
    payload: CreateMasterCompanyMockPayload, created_by: str
) -> dict[str, Any]:
    db = get_db()
    data = payload.model_dump(mode="json", exclude_none=True)
    if "master_company_id" not in data:
        data["master_company_id"] = new_master_company_id()
    now = datetime.now(UTC)
    record = MasterCompanyMockInDB(**data, created_by=created_by)
    record_dict = record.model_dump(mode="json", exclude_none=True)
    # explicit timestamps (avoid drift from default_factory)
    record_dict["created_at"] = now
    record_dict["updated_at"] = now
    try:
        await db.master_companies_mock.insert_one(record_dict)
    except DuplicateKeyError as e:
        raise ConflictError(
            "master_company_duplicate_unique_field",
            code="master_company_duplicate_unique_field",
        ) from e
    log.info(
        "[MOCK] agency_tool.create_master_company_mock",
        master_company_id=record_dict["master_company_id"],
        created_by=created_by,
    )
    return await _project(record_dict)


async def list_master_companies_mock(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    db = get_db()
    cursor = db.master_companies_mock.find({}, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    return [d async for d in cursor]


async def get_master_company_mock(master_company_id: str) -> dict[str, Any]:
    db = get_db()
    doc = await db.master_companies_mock.find_one(
        {"master_company_id": master_company_id}, {"_id": 0}
    )
    if not doc:
        raise NotFoundError("master_company_not_found", code="master_company_not_found")
    return doc


async def update_master_company_mock(
    master_company_id: str, payload: UpdateMasterCompanyMockPayload
) -> dict[str, Any]:
    db = get_db()
    patch = payload.model_dump(mode="json", exclude_none=True)
    if not patch:
        # nothing to update; return existing
        return await get_master_company_mock(master_company_id)
    patch["updated_at"] = datetime.now(UTC)
    res = await db.master_companies_mock.update_one(
        {"master_company_id": master_company_id}, {"$set": patch}
    )
    if res.matched_count == 0:
        raise NotFoundError("master_company_not_found", code="master_company_not_found")
    log.info("[MOCK] agency_tool.update_master_company_mock", master_company_id=master_company_id)
    return await get_master_company_mock(master_company_id)


async def delete_master_company_mock(master_company_id: str) -> dict[str, str]:
    db = get_db()
    res = await db.master_companies_mock.delete_one({"master_company_id": master_company_id})
    if res.deleted_count == 0:
        raise NotFoundError("master_company_not_found", code="master_company_not_found")
    log.info("[MOCK] agency_tool.delete_master_company_mock", master_company_id=master_company_id)
    return {"deleted": master_company_id}


async def _project(doc: dict[str, Any]) -> dict[str, Any]:
    # Drop Mongo _id if present and ensure JSON-serialisable datetimes.
    doc = {k: v for k, v in doc.items() if k != "_id"}
    for k in ("created_at", "updated_at", "valid_until"):
        v = doc.get(k)
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc
