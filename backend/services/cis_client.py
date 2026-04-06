"""
CIS Client — adapter for company-master/resolve endpoint.
Primary provider for company resolution in ARROBA.

Config:
  CIS_BASE_URL = https://api.cis.wearebudadvisors.com (or equivalent)
  CIS_API_KEY = optional auth key
"""
import os
import logging
import httpx
from typing import Dict, Optional

logger = logging.getLogger(__name__)

CIS_BASE_URL = os.environ.get("CIS_BASE_URL", "")
CIS_API_KEY = os.environ.get("CIS_API_KEY", "")
CIS_TIMEOUT = int(os.environ.get("CIS_TIMEOUT", "15"))


async def resolve_via_cis(
    cif: str,
    requesting_user: str = "",
    required_blocks: list = None,
    force_refresh: bool = False,
) -> Optional[Dict]:
    """
    Call CIS POST /api/company-master/resolve
    Returns normalized payload or None on failure.
    """
    if not CIS_BASE_URL:
        raise ConnectionError("CIS_BASE_URL not configured")

    url = f"{CIS_BASE_URL}/api/company-master/resolve"
    payload = {
        "cif": cif,
        "requesting_system": "arroba",
        "requested_by": requesting_user,
        "required_blocks": required_blocks or ["identity", "financials", "enrichment"],
        "force_refresh": force_refresh,
    }

    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if CIS_API_KEY:
        headers["X-API-Key"] = CIS_API_KEY

    async with httpx.AsyncClient(timeout=CIS_TIMEOUT) as client:
        logger.info(f"[CIS] POST {url} for CIF={cif}")
        response = await client.post(url, json=payload, headers=headers)

        if response.status_code != 200:
            logger.warning(f"[CIS] Non-200 response: {response.status_code} — {response.text[:200]}")
            return None

        data = response.json()

        # Normalize CIS response to canonical ARROBA payload
        return _normalize_cis_response(data)


def _normalize_cis_response(data: Dict) -> Optional[Dict]:
    """
    Normalize CIS company-master response to ARROBA canonical payload.
    CIS is expected to return a structured response with identity, financials, enrichment blocks.
    """
    if not data:
        return None

    company = data.get("company", data)
    company_master_id = company.get("company_id") or company.get("id")

    # Identity
    identity = company.get("identity", {})
    if not identity and company.get("legal_name"):
        identity = {
            "legal_name": company.get("legal_name", ""),
            "cif": company.get("cif", ""),
            "trade_name": company.get("trade_name", ""),
            "legal_form": company.get("legal_form", ""),
            "company_status": company.get("status", ""),
            "street": company.get("street", ""),
            "city": company.get("city", ""),
            "province": company.get("province", ""),
            "postal_code": company.get("postal_code", ""),
            "country": company.get("country", "España"),
            "cnae_code": company.get("cnae_code", ""),
            "cnae_label": company.get("cnae_label", ""),
            "website": company.get("website", ""),
        }

    # Financials
    financials = company.get("financials", [])
    normalized_fins = []
    for f in financials:
        pnl = f.get("pnl", {})
        balance = f.get("balance", {})
        # Handle both nested and flat structures
        if not pnl and f.get("revenue"):
            pnl = {
                "revenue": f.get("revenue"),
                "supplies": f.get("supplies"),
                "gross_margin": f.get("gross_margin"),
                "operating_expenses": f.get("operating_expenses"),
                "personnel_expenses": f.get("personnel_expenses") or f.get("staff_costs"),
                "ebitda": f.get("ebitda"),
                "adjusted_ebitda": f.get("adjusted_ebitda"),
                "net_result": f.get("net_result") or f.get("net_income"),
                "operating_result": f.get("operating_result"),
                "depreciation": f.get("depreciation"),
            }
        normalized_fins.append({
            "year": f.get("year"),
            "pnl": pnl,
            "balance": balance,
            "sources": f.get("sources", {}),
            "data_source": f.get("data_source", "CIS"),
        })

    # Enrichment
    enrichment = company.get("enrichment", {})

    # Coverage
    coverage = company.get("coverage", {
        "identity": bool(identity.get("legal_name")),
        "financials": len(normalized_fins) > 0,
        "balance": False,
        "employees": False,
        "enrichment": bool(enrichment.get("description")),
    })

    return {
        "company_master_id": company_master_id,
        "source": "CIS",
        "coverage": coverage,
        "identity": identity,
        "financials": normalized_fins,
        "enrichment": enrichment,
    }
