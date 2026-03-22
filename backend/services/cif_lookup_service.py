import logging
from datetime import datetime, timezone
from typing import Optional

from database import cis_collection
from services.iberinform_service import (
    search_organisation_by_cif,
    get_identification_details,
    get_financial_data,
    get_sales_data,
    parse_iberinform_financials,
    parse_iberinform_company_info
)

logger = logging.getLogger(__name__)


async def lookup_cif(cif: str) -> dict:
    """
    Orchestrate CIF lookup: CIS → Iberinform → Manual fallback
    Returns: {found: bool, source: str, company_info: dict, financials: list}
    """
    cif = cif.strip().upper()

    # Step 1: Check CIS (internal cache)
    cis_result = await _lookup_cis(cif)
    if cis_result:
        logger.info(f"CIF {cif} found in CIS")
        return {
            "found": True,
            "source": "CIS",
            "company_info": cis_result.get("company_info", {}),
            "financials": cis_result.get("financials", [])
        }

    # Step 2: Try Iberinform
    iberinform_result = await _lookup_iberinform(cif)
    if iberinform_result:
        logger.info(f"CIF {cif} found in Iberinform")
        # Save to CIS for future lookups
        await _save_to_cis(cif, iberinform_result)
        return {
            "found": True,
            "source": "IBERINFORM",
            "company_info": iberinform_result.get("company_info", {}),
            "financials": iberinform_result.get("financials", [])
        }

    # Step 3: Manual fallback
    logger.info(f"CIF {cif} not found in any source")
    return {
        "found": False,
        "source": "MANUAL",
        "company_info": {},
        "financials": []
    }


async def _lookup_cis(cif: str) -> Optional[dict]:
    """Look up CIF in our internal CIS cache"""
    record = await cis_collection.find_one({"cif": cif}, {"_id": 0})
    if record:
        return record
    return None


async def _lookup_iberinform(cif: str) -> Optional[dict]:
    """Look up CIF via Iberinform API"""
    try:
        # Search for the organisation
        org = await search_organisation_by_cif(cif)
        if not org:
            return None

        organisation_id = org.get("organisationId") or org.get("id")
        if not organisation_id:
            return None

        # Get details in parallel-ish (sequential for simplicity)
        identification = await get_identification_details(organisation_id)
        financial = await get_financial_data(organisation_id)

        result = {
            "company_info": {},
            "financials": []
        }

        if identification:
            result["company_info"] = parse_iberinform_company_info(identification)

        if financial:
            result["financials"] = parse_iberinform_financials(financial)

        # Only return if we got something useful
        if result["company_info"] or result["financials"]:
            return result

    except Exception as e:
        logger.error(f"Iberinform lookup error for CIF {cif}: {e}")

    return None


async def _save_to_cis(cif: str, data: dict):
    """Save Iberinform data to CIS cache"""
    try:
        doc = {
            "cif": cif,
            "company_info": data.get("company_info", {}),
            "financials": data.get("financials", []),
            "source": "IBERINFORM",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        await cis_collection.update_one(
            {"cif": cif},
            {"$set": doc},
            upsert=True
        )
    except Exception as e:
        logger.error(f"Error saving to CIS: {e}")
