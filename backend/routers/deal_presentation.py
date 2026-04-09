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


@router.post("/deals/presentations/batch")
async def get_batch_presentations(data: dict, user: UserResponse = Depends(get_current_user)):
    """Get lightweight card presentations for multiple deals."""
    if user.role not in ("buyer", "admin"):
        raise HTTPException(403, "Solo buyers")

    deal_ids = data.get("deal_ids", [])[:20]
    if not deal_ids:
        return []

    # Get buyer tier
    buyer_doc = await db.users.find_one({"user_id": user.user_id}, {"subscription": 1})
    sub = (buyer_doc or {}).get("subscription") or {}
    pt = sub.get("plan_type", "") if isinstance(sub, dict) else ""
    from services.deal_presentation.access_rules import get_buyer_tier_from_plan, compute_visibility_state
    tier = get_buyer_tier_from_plan(pt)

    results = []
    for did in deal_ids:
        # Minimal queries per deal
        contact = await db.contact_requests.find_one(
            {"deal_id": did, "buyer_id": user.user_id, "status": {"$in": ["pending", "accepted"]}},
            {"_id": 0, "status": 1},
        )
        contact_state = contact.get("status") if contact else None

        nda = await db.nda_signatures.find_one(
            {"deal_id": did, "buyer_user_id": user.user_id, "status": "signed"},
            {"_id": 0},
        )
        has_nda = bool(nda)

        vis = compute_visibility_state(tier, contact_state, has_nda)

        # CTA for card
        if vis == "LOCKED_CONTACT_REQUIRED":
            cta = {"action": "contact_request", "label": "Contactar" if tier != "free" else "Contactar para ampliar"}
        elif vis == "CONTACT_REQUESTED":
            cta = {"action": "wait", "label": "Solicitud enviada"}
        elif vis == "TEASER_UNLOCKED":
            cta = {"action": "view_teaser", "label": "Ver teaser"}
        elif vis == "NDA_AVAILABLE":
            cta = {"action": "sign_nda", "label": "Firmar NDA"}
        else:
            cta = {"action": "view_deal", "label": "Acceder al proceso"}

        results.append({
            "deal_id": did,
            "buyer_tier": tier,
            "visibility_state": vis,
            "contact_state": contact_state or "none",
            "has_nda": has_nda,
            "card_cta": cta,
            "show_financials": tier in ("pro", "pro+") or contact_state == "accepted" or has_nda,
            "is_premium": tier == "pro+",
        })

    return results


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
