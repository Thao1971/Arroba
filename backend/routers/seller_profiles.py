"""
Seller Company Profile — separates company master data (CIS) from seller overrides and deal config.
Handles: persistence, hydration, CIS resolution, balance reconciliation, pricing model.
"""
from fastapi import APIRouter, HTTPException, Depends
from database import db
from routers.auth import get_current_user
from models.user import UserResponse
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/seller-profiles", tags=["Seller Company Profile"])

# ─── Buyer-facing sanitization policy ───
BUYER_BLOCKED_FIELDS = {
    "phone", "telefono", "email", "contact_email", "contact_phone",
    "street", "direccion", "postal_code", "codigo_postal", "address",
}
BUYER_ALLOWED_FIELDS = {
    "city", "ciudad", "province", "provincia", "country", "sector",
    "category", "subcategory", "year_founded", "employees_range",
    "revenue_range", "ebitda_range", "description_anonymized",
}


def sanitize_for_buyer(data: dict, surface: str = "teaser") -> dict:
    """Remove identifying fields from company data for buyer-facing surfaces."""
    sanitized = {}
    for k, v in data.items():
        if k in BUYER_BLOCKED_FIELDS:
            continue
        if k == "website" or k == "web":
            continue  # website can identify the company
        sanitized[k] = v
    return sanitized


@router.post("")
async def create_seller_profile(data: dict, user: UserResponse = Depends(get_current_user)):
    """Create a seller company profile."""
    profile_id = f"scp_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "profile_id": profile_id,
        "seller_id": user.user_id,
        "company_master_id": data.get("company_master_id"),
        "company_id": data.get("company_id"),
        "cif": data.get("cif"),
        "auto_prefilled": {
            "identity": data.get("identity", {}),
            "taxonomy": data.get("taxonomy", {}),
            "financials": data.get("financials", []),
            "enrichment": data.get("enrichment", {}),
            "coverage": data.get("coverage", {}),
            "source": data.get("source", ""),
            "resolution_meta": data.get("resolution_meta", {}),
        },
        "seller_overrides": data.get("seller_overrides", {}),
        "pricing": {
            "price_strategy": "not_set",
            "asking_price": None,
            "comfort_margin_pct": None,
            "comfort_floor_price": None,
            "offers_mode": None,
            "internal_price_reference": None,
            "minimum_interest_price": None,
        },
        "panel_status": {
            "compania": "complete" if data.get("identity", {}).get("legal_name") else "empty",
            "ficha": "empty",
            "financieros": "complete" if data.get("financials") else "empty",
            "valoracion": "empty",
            "operacion": "empty",
        },
        "financial_validation": {
            "has_latest_year": False,
            "latest_year": None,
            "years_available": [],
            "balance_matches_by_year": {},
            "balance_deltas": {},
        },
        "profile_readiness": 0,
        "created_at": now,
        "updated_at": now,
    }

    # Compute financial validation
    fins = data.get("financials", [])
    if fins:
        years = sorted([f.get("year") for f in fins if f.get("year")], reverse=True)
        doc["financial_validation"]["years_available"] = years
        doc["financial_validation"]["latest_year"] = years[0] if years else None
        doc["financial_validation"]["has_latest_year"] = len(years) > 0

        for f in fins:
            y = f.get("year")
            bal = f.get("balance", {})
            if bal:
                nca = bal.get("non_current_assets") or 0
                ca = bal.get("current_assets") or 0
                eq = bal.get("equity") or 0
                ncl = bal.get("non_current_liabilities") or 0
                cl = bal.get("current_liabilities") or 0
                total_assets = nca + ca
                total_liab = eq + ncl + cl
                delta = round(total_assets - total_liab, 2)
                doc["financial_validation"]["balance_matches_by_year"][str(y)] = abs(delta) < 1
                doc["financial_validation"]["balance_deltas"][str(y)] = delta

    # Calculate readiness
    panels = doc["panel_status"]
    complete = sum(1 for v in panels.values() if v == "complete")
    doc["profile_readiness"] = round((complete / len(panels)) * 100)

    await db.seller_company_profiles.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@router.post("/resolve-and-save")
async def resolve_and_save(data: dict, user: UserResponse = Depends(get_current_user)):
    """Resolve company via CIS and persist as seller_company_profile."""
    cif = data.get("cif", "").strip()
    if not cif:
        raise HTTPException(400, "CIF requerido")

    # Resolve from CIS
    from services.company_resolution_service import resolve_company
    resolved = await resolve_company(cif=cif, requesting_user=user.email)

    if not resolved or not resolved.get("identity", {}).get("legal_name"):
        raise HTTPException(404, "No se encontraron datos para este CIF")

    # Check if profile already exists for this CIF
    existing = await db.seller_company_profiles.find_one(
        {"seller_id": user.user_id, "cif": cif}, {"_id": 0}
    )

    now = datetime.now(timezone.utc).isoformat()

    if existing:
        # Update auto_prefilled with fresh data
        await db.seller_company_profiles.update_one(
            {"profile_id": existing["profile_id"]},
            {"$set": {
                "auto_prefilled": {
                    "identity": resolved.get("identity", {}),
                    "taxonomy": resolved.get("taxonomy", {}),
                    "financials": resolved.get("financials", []),
                    "enrichment": resolved.get("enrichment", {}),
                    "coverage": resolved.get("coverage", {}),
                    "source": resolved.get("source", ""),
                    "resolution_meta": resolved.get("resolution_meta", {}),
                },
                "company_master_id": resolved.get("company_master_id"),
                "updated_at": now,
            }}
        )
        profile = await db.seller_company_profiles.find_one(
            {"profile_id": existing["profile_id"]}, {"_id": 0}
        )
        return profile
    else:
        # Create new profile
        profile_data = {
            "company_master_id": resolved.get("company_master_id"),
            "cif": cif,
            "identity": resolved.get("identity", {}),
            "taxonomy": resolved.get("taxonomy", {}),
            "financials": resolved.get("financials", []),
            "enrichment": resolved.get("enrichment", {}),
            "coverage": resolved.get("coverage", {}),
            "source": resolved.get("source", ""),
            "resolution_meta": resolved.get("resolution_meta", {}),
        }
        # Reuse create logic
        return await create_seller_profile(profile_data, user)


@router.get("/by-cif/{cif}")
async def get_profile_by_cif(cif: str, user: UserResponse = Depends(get_current_user)):
    """Get seller profile by CIF — used for hydration on workspace reopen."""
    doc = await db.seller_company_profiles.find_one(
        {"seller_id": user.user_id, "cif": cif.upper()}, {"_id": 0}
    )
    if not doc:
        return None
    return doc


@router.get("/by-company/{company_id}")
async def get_profile_by_company(company_id: str, user: UserResponse = Depends(get_current_user)):
    """Get seller profile by ARROBA company_id."""
    doc = await db.seller_company_profiles.find_one(
        {"seller_id": user.user_id, "company_id": company_id}, {"_id": 0}
    )
    return doc


@router.get("/my-profiles")
async def list_my_profiles(user: UserResponse = Depends(get_current_user)):
    """List all seller company profiles."""
    cursor = db.seller_company_profiles.find(
        {"seller_id": user.user_id}, {"_id": 0}
    ).sort("created_at", -1)
    return await cursor.to_list(20)


@router.get("/{profile_id}")
async def get_profile(profile_id: str, user: UserResponse = Depends(get_current_user)):
    """Get a specific seller company profile."""
    doc = await db.seller_company_profiles.find_one(
        {"profile_id": profile_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(404, "Perfil no encontrado")
    if doc["seller_id"] != user.user_id:
        raise HTTPException(403, "No autorizado")
    return doc


@router.put("/{profile_id}/overrides")
async def update_overrides(profile_id: str, overrides: dict, user: UserResponse = Depends(get_current_user)):
    """Update seller-specific overrides."""
    doc = await db.seller_company_profiles.find_one({"profile_id": profile_id}, {"_id": 0})
    if not doc or doc["seller_id"] != user.user_id:
        raise HTTPException(403, "No autorizado")

    now = datetime.now(timezone.utc).isoformat()
    merged = {**doc.get("seller_overrides", {}), **{k: v for k, v in overrides.items() if v is not None}}

    await db.seller_company_profiles.update_one(
        {"profile_id": profile_id},
        {"$set": {"seller_overrides": merged, "updated_at": now}}
    )
    return {"updated": True}


@router.put("/{profile_id}/pricing")
async def update_pricing(profile_id: str, pricing: dict, user: UserResponse = Depends(get_current_user)):
    """Update pricing/deal configuration."""
    doc = await db.seller_company_profiles.find_one({"profile_id": profile_id}, {"_id": 0})
    if not doc or doc["seller_id"] != user.user_id:
        raise HTTPException(403, "No autorizado")

    now = datetime.now(timezone.utc).isoformat()
    current = doc.get("pricing", {})
    merged = {**current, **{k: v for k, v in pricing.items() if v is not None}}

    # Calculate comfort floor
    if merged.get("asking_price") and merged.get("comfort_margin_pct"):
        merged["comfort_floor_price"] = round(
            merged["asking_price"] * (1 - merged["comfort_margin_pct"] / 100), 2
        )

    await db.seller_company_profiles.update_one(
        {"profile_id": profile_id},
        {"$set": {"pricing": merged, "updated_at": now}}
    )
    return {"updated": True, "pricing": merged}


@router.put("/{profile_id}/panel-status")
async def update_panel_status(profile_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Update panel status and recalculate readiness."""
    doc = await db.seller_company_profiles.find_one({"profile_id": profile_id}, {"_id": 0})
    if not doc or doc["seller_id"] != user.user_id:
        raise HTTPException(403, "No autorizado")

    panels = {**doc.get("panel_status", {}), **data}
    complete = sum(1 for v in panels.values() if v == "complete")
    readiness = round((complete / max(len(panels), 1)) * 100)

    await db.seller_company_profiles.update_one(
        {"profile_id": profile_id},
        {"$set": {"panel_status": panels, "profile_readiness": readiness, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"panel_status": panels, "profile_readiness": readiness}


@router.get("/{profile_id}/buyer-facing")
async def get_buyer_facing_profile(profile_id: str, surface: str = "teaser"):
    """Get sanitized profile for buyer-facing surfaces."""
    doc = await db.seller_company_profiles.find_one(
        {"profile_id": profile_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(404, "Perfil no encontrado")

    identity = doc.get("auto_prefilled", {}).get("identity", {})
    sanitized = sanitize_for_buyer(identity, surface)
    overrides = doc.get("seller_overrides", {})

    result = {
        "city": sanitized.get("city"),
        "province": sanitized.get("province"),
        "country": "España",
        "category": doc.get("auto_prefilled", {}).get("taxonomy", {}).get("category"),
        "subcategory": doc.get("auto_prefilled", {}).get("taxonomy", {}).get("subcategory"),
        "tags": doc.get("auto_prefilled", {}).get("taxonomy", {}).get("tags", []),
        "description": overrides.get("description") or doc.get("auto_prefilled", {}).get("enrichment", {}).get("description"),
        "year_founded": overrides.get("founded_year"),
        "employees_count": overrides.get("employees_count"),
    }

    # Pricing (sanitized)
    pricing = doc.get("pricing", {})
    if pricing.get("price_strategy") == "define_price":
        result["asking_price"] = pricing.get("asking_price") if surface != "teaser" else None
        result["price_display"] = f'{pricing.get("asking_price"):,.0f} €'.replace(",", ".") if pricing.get("asking_price") else None
    else:
        result["price_display"] = "Precio a discutir con compradores cualificados"

    return result
