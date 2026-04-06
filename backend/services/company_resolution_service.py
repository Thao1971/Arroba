"""
Company Resolution Service — abstract resolver.
Primary: CIS company-master/resolve
Fallback: Iberinform direct (transitorio)

ARROBA nunca consume proveedores directamente.
Todo pasa por este resolver que normaliza a payload canónico interno.
"""
import logging
import os
from datetime import datetime, timezone
from typing import Optional, Dict
from .cis_client import resolve_via_cis
from services.cif_lookup_service import lookup_cif as fallback_lookup

logger = logging.getLogger(__name__)

CIS_CONFIGURED = bool(os.environ.get("CIS_BASE_URL"))


async def resolve_company(
    cif: str,
    requesting_user: str = "",
    required_blocks: list = None,
    force_refresh: bool = False,
) -> Dict:
    """
    Resolve a company to canonical internal payload.
    1. Try CIS if configured
    2. Fallback to existing Iberinform flow (transitorio)
    3. Always return normalized CanonicalCompanyPayload
    """
    if required_blocks is None:
        required_blocks = ["identity", "financials", "enrichment"]

    result = None
    provider = None
    fallback_reason = None

    # 1. Try CIS
    if CIS_CONFIGURED:
        try:
            logger.info(f"[RESOLVE] CIS attempt for CIF {cif}")
            result = await resolve_via_cis(
                cif=cif,
                requesting_user=requesting_user,
                required_blocks=required_blocks,
                force_refresh=force_refresh,
            )
            if result and result.get("identity"):
                provider = "CIS"
                logger.info(f"[RESOLVE] CIS hit for {cif} — company_master_id={result.get('company_master_id')}")
            else:
                fallback_reason = "CIS returned empty or incomplete"
                logger.warning(f"[RESOLVE] CIS incomplete for {cif}: {fallback_reason}")
                result = None
        except Exception as e:
            fallback_reason = f"CIS error: {str(e)[:100]}"
            logger.warning(f"[RESOLVE] CIS failed for {cif}: {fallback_reason}")
            result = None
    else:
        fallback_reason = "CIS not configured (CIS_BASE_URL missing)"

    # 2. Fallback transitorio
    if result is None:
        try:
            logger.info(f"[RESOLVE] Fallback (Iberinform direct) for CIF {cif} — reason: {fallback_reason}")
            raw = await fallback_lookup(cif)
            if raw and raw.get("found"):
                result = _normalize_fallback_to_canonical(raw, cif)
                provider = "IBERINFORM_DIRECT"
                logger.info(f"[RESOLVE] Fallback hit for {cif}")
            else:
                provider = "NONE"
                result = _empty_canonical(cif)
                logger.info(f"[RESOLVE] No data found for {cif}")
        except Exception as e:
            provider = "NONE"
            result = _empty_canonical(cif)
            logger.error(f"[RESOLVE] Fallback also failed for {cif}: {e}")

    # 3. Attach resolution metadata
    result["resolution_meta"] = {
        "provider": provider,
        "fallback_used": provider != "CIS",
        "fallback_reason": fallback_reason,
        "resolved_at": datetime.now(timezone.utc).isoformat(),
        "cif_queried": cif,
        "requesting_user": requesting_user,
        "required_blocks": required_blocks,
    }

    return result


def _normalize_fallback_to_canonical(raw: Dict, cif: str) -> Dict:
    """Normalize Iberinform direct response to canonical payload."""
    info = raw.get("company_info", {})
    financials_raw = raw.get("financials", [])

    # Identity
    identity = {
        "legal_name": info.get("legal_name", ""),
        "cif": info.get("cif", cif),
        "trade_name": info.get("trade_name", ""),
        "legal_form": info.get("legal_form", ""),
        "company_status": info.get("company_status", ""),
        "street": info.get("street", ""),
        "city": info.get("city", ""),
        "province": info.get("province", ""),
        "postal_code": info.get("postal_code", ""),
        "country": "España",
        "cnae_code": info.get("cnae_code", ""),
        "cnae_label": info.get("cnae_description", ""),
        "website": info.get("website", ""),
    }

    # Financials — normalize to canonical structure
    financials = []
    for f in financials_raw:
        entry = {
            "year": f.get("year"),
            "pnl": {
                "revenue": f.get("revenue"),
                "supplies": None,
                "gross_margin": None,
                "operating_expenses": None,
                "personnel_expenses": f.get("staff_costs"),
                "ebitda": f.get("ebitda"),
                "adjusted_ebitda": None,
                "net_result": f.get("net_income"),
                "operating_result": f.get("operating_result"),
                "depreciation": f.get("depreciation"),
            },
            "balance": {
                "non_current_assets": None,
                "current_assets": None,
                "equity": None,
                "non_current_liabilities": None,
                "current_liabilities": None,
            },
            "sources": {},
            "data_source": f.get("data_source", "IBERINFORM"),
        }
        # Fill sources
        for k, v in entry["pnl"].items():
            if v is not None:
                entry["sources"][f"pnl.{k}"] = "IBERINFORM"
        financials.append(entry)

    # Coverage
    has_identity = bool(identity.get("legal_name"))
    has_financials = len(financials) > 0
    has_balance = any(
        any(v for v in f.get("balance", {}).values() if v)
        for f in financials
    )

    coverage = {
        "identity": has_identity,
        "financials": has_financials,
        "balance": has_balance,
        "employees": False,
        "enrichment": False,
    }

    # Enrichment — empty from fallback
    enrichment = {
        "description": None,
        "logo_url": None,
        "screenshots": [],
        "categories": [],
        "subcategories": [],
        "tags": [],
        "evidence": [],
        "confidence": None,
    }

    return {
        "company_master_id": None,
        "source": "IBERINFORM_DIRECT",
        "coverage": coverage,
        "identity": identity,
        "financials": financials,
        "enrichment": enrichment,
    }


def _empty_canonical(cif: str) -> Dict:
    """Return empty canonical payload."""
    return {
        "company_master_id": None,
        "source": "NONE",
        "coverage": {
            "identity": False, "financials": False, "balance": False,
            "employees": False, "enrichment": False,
        },
        "identity": {"cif": cif},
        "financials": [],
        "enrichment": {},
    }
