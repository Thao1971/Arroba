"""
Seller Company Profile — separates company master data (CIS) from seller-specific overrides and deal config.
"""
from fastapi import APIRouter, HTTPException, Depends
from database import db
from routers.auth import get_current_user
from models.user import UserResponse
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/seller-profiles", tags=["Seller Company Profile"])


@router.post("")
async def create_seller_profile(data: dict, user: UserResponse = Depends(get_current_user)):
    """Create a seller company profile linked to a CIS company_master_id."""
    profile_id = f"scp_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "profile_id": profile_id,
        "seller_id": user.user_id,
        "company_master_id": data.get("company_master_id"),
        "company_id": data.get("company_id"),  # ARROBA internal company_id
        # Auto-prefilled from CIS
        "auto_prefilled": {
            "identity": data.get("identity", {}),
            "financials": data.get("financials", []),
            "enrichment": data.get("enrichment", {}),
            "coverage": data.get("coverage", {}),
            "source": data.get("source", ""),
        },
        # Seller overrides (manual edits)
        "seller_overrides": {
            "trade_name": data.get("trade_name"),
            "description": data.get("description"),
            "employees_count": data.get("employees_count"),
            "founded_year": data.get("founded_year"),
            "taxonomy_category": data.get("taxonomy_category"),
            "taxonomy_subcategory": data.get("taxonomy_subcategory"),
            "recurring_revenue_pct": data.get("recurring_revenue_pct"),
            "client_concentration_top5": data.get("client_concentration_top5"),
            "founder_dependency": data.get("founder_dependency"),
            "adjusted_ebitda_by_year": data.get("adjusted_ebitda_by_year", {}),
            "sale_motivation": data.get("sale_motivation"),
        },
        # Panel status tracking
        "panel_status": {
            "identity": "complete" if data.get("identity", {}).get("legal_name") else "empty",
            "financials": "complete" if data.get("financials") else "empty",
            "valuation": "empty",
            "operation": "empty",
            "documents": "empty",
        },
        "profile_readiness": 0,
        "created_at": now,
        "updated_at": now,
    }

    # Calculate readiness
    panels = doc["panel_status"]
    complete = sum(1 for v in panels.values() if v == "complete")
    doc["profile_readiness"] = round((complete / len(panels)) * 100)

    await db.seller_company_profiles.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@router.get("/my-profiles")
async def list_my_profiles(user: UserResponse = Depends(get_current_user)):
    """List all seller company profiles for the current user."""
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
