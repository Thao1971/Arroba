"""
Deal Presentation Router
Endpoint del orquestador + seller contact policy.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from database import db
from routers.auth import get_current_user
from models.user import UserResponse
from services.deal_presentation.orchestrator import orchestrate_presentation
from datetime import datetime, timezone

router = APIRouter(tags=["Deal Presentation"])


@router.get("/deals/{deal_id}/presentation")
async def get_deal_presentation(deal_id: str, request: Request, user: UserResponse = Depends(get_current_user)):
    """Orchestrate and return the full deal presentation for a buyer."""
    if user.role not in ("buyer", "admin"):
        raise HTTPException(403, "Solo buyers pueden consultar la presentacion de un deal")

    result = await orchestrate_presentation(deal_id, user.user_id)
    if not result:
        raise HTTPException(404, "Deal no encontrado")

    return result


@router.put("/seller/settings/contact-policy")
async def update_contact_policy(data: dict, user: UserResponse = Depends(get_current_user)):
    """Seller updates their contact policy (auto_accept or manual_review)."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers pueden configurar la politica de contacto")

    policy = data.get("contact_policy", "manual_review")
    if policy not in ("auto_accept", "manual_review"):
        raise HTTPException(400, "Politica invalida. Valores: auto_accept, manual_review")

    now = datetime.now(timezone.utc).isoformat()
    await db.seller_settings.update_one(
        {"seller_id": user.user_id},
        {"$set": {"contact_policy": policy, "updated_at": now},
         "$setOnInsert": {"seller_id": user.user_id, "created_at": now}},
        upsert=True,
    )

    return {"contact_policy": policy, "updated_at": now}


@router.get("/seller/settings/contact-policy")
async def get_contact_policy(user: UserResponse = Depends(get_current_user)):
    """Get seller's current contact policy."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "No autorizado")

    settings = await db.seller_settings.find_one(
        {"seller_id": user.user_id}, {"_id": 0}
    )
    return {"contact_policy": (settings or {}).get("contact_policy", "manual_review")}
