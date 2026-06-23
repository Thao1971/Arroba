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

CIS_TIMEOUT = 15


def _get_cis_config():
    """Read CIS config at runtime (after dotenv is loaded)."""
    return {
        "base_url": os.environ.get("CIS_BASE_URL", ""),
        "api_key": os.environ.get("CIS_API_KEY", ""),
        "service_key": os.environ.get("CIS_SERVICE_KEY", ""),
        "timeout": int(os.environ.get("CIS_TIMEOUT", "15")),
    }


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
    cfg = _get_cis_config()
    if not cfg["base_url"]:
        raise ConnectionError("CIS_BASE_URL not configured")

    url = f"{cfg['base_url']}/api/company-master/resolve"
    payload = {
        "cif": cif,
        "requesting_system": "arroba",
        "requested_by": requesting_user,
        "required_blocks": required_blocks or ["identity", "financials", "balance", "employees", "enrichment"],
        "force_refresh": force_refresh,
    }

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requesting-System": "arroba",
    }
    if cfg["service_key"]:
        headers["X-Service-Key"] = cfg["service_key"]
    elif cfg["api_key"]:
        headers["X-API-Key"] = cfg["api_key"]

    async with httpx.AsyncClient(timeout=cfg["timeout"]) as client:
        logger.info(f"[CIS] POST {url} for CIF={cif}")
        response = await client.post(url, json=payload, headers=headers)

        if response.status_code == 401:
            logger.warning("[CIS] Authentication failed (401) — API key may be missing or invalid")
            return None
        if response.status_code != 200:
            logger.warning(f"[CIS] Non-200 response: {response.status_code} — {response.text[:200]}")
            return None

        data = response.json()

        # Normalize CIS response to canonical ARROBA payload
        return _normalize_cis_response(data)


def _normalize_cis_response(data: Dict) -> Optional[Dict]:
    """
    Normalize CIS company-master response to ARROBA canonical payload.
    CIS returns Spanish field names in the company object.
    """
    if not data:
        return None

    company = data.get("company", data)
    company_master_id = data.get("company_id") or company.get("company_id")

    # Identity — CIS uses Spanish field names
    identity = {
        "legal_name": company.get("denominacion_social", ""),
        "cif": company.get("cif", ""),
        "trade_name": company.get("acronimo") or company.get("trade_name", ""),
        "legal_form": company.get("forma_juridica", ""),
        "company_status": company.get("estado", ""),
        "street": company.get("direccion", ""),
        "city": company.get("ciudad", ""),
        "province": company.get("provincia", ""),
        "province_id": company.get("province_id", ""),
        "postal_code": company.get("codigo_postal", ""),
        "country": "España",
        "cnae_code": company.get("codigo_cnae", ""),
        "cnae_label": company.get("actividad", ""),
        "website": company.get("web", ""),
        "phone": company.get("telefono", ""),
        "founded_date": company.get("fecha_constitucion", ""),
    }

    # Taxonomy
    taxonomy = {
        "category_id": company.get("category_id"),
        "subcategory_id": company.get("subcategory_id"),
        "category": company.get("categoria"),
        "subcategory": company.get("subcategoria"),
        "tags": company.get("tags", []),
        "confidence_score": company.get("confidence_score"),
    }

    # Financials — normalize CIS Spanish fields to canonical
    raw_financials = company.get("financials", [])
    normalized_fins = []
    for f in raw_financials:
        pnl = {
            "revenue": f.get("revenue"),
            "supplies": f.get("aprovisionamientos"),
            "gross_margin": None,
            "operating_expenses": f.get("otros_gastos"),
            "personnel_expenses": f.get("gastos_personal"),
            "ebitda": f.get("ebitda"),
            "adjusted_ebitda": None,
            "net_result": f.get("resultado_ejercicio"),
            "operating_result": f.get("resultado_explotacion"),
            "depreciation": f.get("amortizacion"),
            "ebitda_margin": f.get("margen_ebitda"),
            "gross_margin_pct": f.get("margen_bruto"),
        }
        # Compute gross margin
        if pnl["revenue"] and pnl["supplies"]:
            pnl["gross_margin"] = pnl["revenue"] - abs(pnl["supplies"])

        balance = {
            "non_current_assets": f.get("activo_no_corriente"),
            "current_assets": f.get("activo_corriente"),
            "equity": f.get("patrimonio_neto"),
            "non_current_liabilities": f.get("pasivo_no_corriente"),
            "current_liabilities": f.get("pasivo_corriente"),
        }

        # Sources: all from CIS
        sources = {k: "CIS" for k in [f"pnl.{x}" for x in pnl if pnl[x] is not None] + [f"balance.{x}" for x in balance if balance[x] is not None]}

        normalized_fins.append({
            "year": f.get("year") or f.get("ejercicio"),
            "pnl": pnl,
            "balance": balance,
            "sources": sources,
            "data_source": "CIS",
            "employees": f.get("num_empleados"),
        })

    # Enrichment
    enrichment = {
        "description": company.get("web_description") or company.get("description"),
        "logo_url": company.get("logo_url"),
        "screenshots": company.get("screenshots", []),
        "categories": [taxonomy["category"]] if taxonomy["category"] else [],
        "subcategories": [taxonomy["subcategory"]] if taxonomy["subcategory"] else [],
        "tags": taxonomy["tags"],
        "confidence": taxonomy["confidence_score"],
        "enrichment_status": company.get("enrichment_status"),
    }

    # Coverage
    coverage = data.get("coverage", {
        "identity": bool(identity.get("legal_name")),
        "financials": len(normalized_fins) > 0,
        "balance": any(any(v for v in f.get("balance", {}).values() if v) for f in normalized_fins),
        "employees": any(f.get("employees") for f in normalized_fins),
        "enrichment": bool(enrichment.get("description") or enrichment.get("tags")),
    })

    return {
        "company_master_id": company_master_id,
        "source": "CIS",
        "coverage": coverage,
        "identity": identity,
        "taxonomy": taxonomy,
        "financials": normalized_fins,
        "enrichment": enrichment,
    }
