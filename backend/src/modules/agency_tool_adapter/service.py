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
    EnrichedCompany,
    Financials,
    Lineage,
    MasterCompanyMockInDB,
    Profile,
    StatusResponse,
    UpdateMasterCompanyMockPayload,
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
            )
        ]
    )


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
