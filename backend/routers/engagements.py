"""Engagement router — Interest + LOI flow, shortlist, exclusivity"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import List

from database import deals_collection, engagements_collection, saved_deals_collection, users_collection
from models.engagement import (
    EngagementCreate, LoiUpgrade, EngagementInDB, EngagementResponse
)
from models.user import UserResponse
from routers.auth import get_current_user
from services.events_service import track_event

router = APIRouter(prefix="/engagements", tags=["Engagements"])


def _require_nda(deal: dict, user_id: str):
    """Check buyer has signed NDA for this deal"""
    has_nda = any(nda["buyer_id"] == user_id for nda in deal.get("ndas_signed", []))
    if not has_nda:
        raise HTTPException(status_code=403, detail="Debes firmar el NDA antes de enviar interés")


def _check_exclusivity_block(deal: dict):
    """Check if deal is in exclusivity (blocks new engagements)"""
    exclusivity = deal.get("exclusivity", {})
    if exclusivity and exclusivity.get("buyer_id"):
        raise HTTPException(
            status_code=403,
            detail="Este deal está en exclusividad. No se admiten nuevos intereses."
        )


def _require_profile_complete(user_doc: dict):
    """Check buyer has completed profile before allowing engagement"""
    bp = user_doc.get("buyer_profile", {})
    if not bp or not bp.get("profile_complete"):
        raise HTTPException(
            status_code=403,
            detail="Debes completar tu perfil de comprador antes de enviar interés"
        )


# ==========================================
# BUYER ENDPOINTS
# ==========================================

@router.post("/interest")
async def submit_interest(
    data: EngagementCreate,
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    """Buyer submits an Interest for a deal (requires NDA)"""
    deal = await deals_collection.find_one({"deal_id": data.deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if deal["status"] == "draft":
        raise HTTPException(status_code=400, detail="Deal not published")

    _require_nda(deal, current_user.user_id)
    _check_exclusivity_block(deal)

    # Check profile completeness
    user_doc = await users_collection.find_one(
        {"user_id": current_user.user_id}, {"_id": 0}
    )
    _require_profile_complete(user_doc)

    # Check for existing engagement
    existing = await engagements_collection.find_one(
        {"deal_id": data.deal_id, "buyer_id": current_user.user_id},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ya has enviado tu interés en este deal")

    # Get buyer info for denormalization
    buyer_info = await users_collection.find_one(
        {"user_id": current_user.user_id}, {"_id": 0}
    )

    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "")
    ip = ip.split(",")[0].strip()

    engagement = EngagementInDB(
        deal_id=data.deal_id,
        buyer_id=current_user.user_id,
        type="INTEREST",
        stage="SUBMITTED",
        valuation_range_min=data.valuation_range_min,
        valuation_range_max=data.valuation_range_max,
        operation_type=data.operation_type,
        message=data.message,
        legal_accepted=data.legal_accepted,
        ip=ip,
        buyer_name=buyer_info.get("full_name", "Comprador") if buyer_info else "Comprador",
        buyer_type=buyer_info.get("buyer_profile", {}).get("buyer_type", "other") if buyer_info else "other",
    )

    eng_dict = engagement.model_dump()
    eng_dict["created_at"] = eng_dict["created_at"].isoformat()
    eng_dict["updated_at"] = eng_dict["updated_at"].isoformat()

    await engagements_collection.insert_one(eng_dict)

    # Track event
    await track_event("INTEREST_SUBMITTED", deal_id=data.deal_id,
                      user_id=current_user.user_id, ip=ip)

    # In-app notification + email placeholder for seller
    from services.notification_service import notify_interest_submitted
    from services.email_service import send_email
    await notify_interest_submitted(deal["owner_id"], data.deal_id, current_user.user_id,
                                     engagement.buyer_name)
    seller = await users_collection.find_one({"user_id": deal["owner_id"]}, {"_id": 0})
    if seller:
        await send_email(seller.get("email", ""), "INTEREST_SUBMITTED", {
            "seller_name": seller.get("first_name", ""),
            "buyer_name": engagement.buyer_name,
            "deal_title": deal.get("title", deal.get("deal_id")),
            "operation_type": data.operation_type or "",
            "valuation_range": f"{data.valuation_range_min or '?'} - {data.valuation_range_max or '?'}€",
            "deal_url": f"/seller/deal/{data.deal_id}",
        })

    return {"message": "Interés enviado correctamente", "engagement_id": engagement.engagement_id}


@router.post("/{engagement_id}/upgrade-to-loi")
async def upgrade_to_loi(
    engagement_id: str,
    data: LoiUpgrade,
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    """Upgrade an Interest to an indicative LOI"""
    engagement = await engagements_collection.find_one(
        {"engagement_id": engagement_id}, {"_id": 0}
    )
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    if engagement["buyer_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if engagement["type"] == "LOI":
        raise HTTPException(status_code=400, detail="Ya es un LOI")

    deal = await deals_collection.find_one({"deal_id": engagement["deal_id"]}, {"_id": 0})
    if deal:
        _check_exclusivity_block(deal)

    now = datetime.now(timezone.utc).isoformat()
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "")

    await engagements_collection.update_one(
        {"engagement_id": engagement_id},
        {"$set": {
            "type": "LOI",
            "valuation_offer": data.valuation_offer,
            "structure": data.structure,
            "acquisition_percentage": data.acquisition_percentage,
            "conditions": data.conditions,
            "is_binding": data.is_binding,
            "upgraded_to_loi_at": now,
            "updated_at": now,
        }}
    )

    await track_event("LOI_SUBMITTED", deal_id=engagement["deal_id"],
                      user_id=current_user.user_id, ip=ip.split(",")[0].strip())

    # In-app notification + email placeholder for seller
    from services.notification_service import notify_loi_submitted
    from services.email_service import send_email
    buyer_info = await users_collection.find_one({"user_id": current_user.user_id}, {"_id": 0})
    buyer_name = f"{buyer_info.get('first_name', '')} {buyer_info.get('last_name', '')}".strip() if buyer_info else "Comprador"
    await notify_loi_submitted(deal["owner_id"], engagement["deal_id"], current_user.user_id,
                                buyer_name, data.valuation_offer)
    seller = await users_collection.find_one({"user_id": deal["owner_id"]}, {"_id": 0})
    if seller:
        await send_email(seller.get("email", ""), "LOI_SUBMITTED", {
            "seller_name": seller.get("first_name", ""),
            "buyer_name": buyer_name,
            "deal_title": deal.get("title", deal.get("deal_id")),
            "valuation_offer": str(data.valuation_offer or ""),
            "structure": data.structure or "",
            "deal_url": f"/seller/deal/{engagement['deal_id']}",
        })

    return {"message": "LOI enviado correctamente", "engagement_id": engagement_id}


@router.get("/my-status/{deal_id}")
async def get_my_engagement_status(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Buyer sees their engagement status for a deal"""
    engagement = await engagements_collection.find_one(
        {"deal_id": deal_id, "buyer_id": current_user.user_id},
        {"_id": 0}
    )

    if not engagement:
        return {"has_engagement": False, "stage": None, "type": None}

    return {
        "has_engagement": True,
        "engagement_id": engagement["engagement_id"],
        "type": engagement["type"],
        "stage": engagement["stage"],
        "valuation_range_min": engagement.get("valuation_range_min"),
        "valuation_range_max": engagement.get("valuation_range_max"),
        "valuation_offer": engagement.get("valuation_offer"),
        "structure": engagement.get("structure"),
        "acquisition_percentage": engagement.get("acquisition_percentage"),
        "operation_type": engagement.get("operation_type"),
        "created_at": engagement.get("created_at"),
        "updated_at": engagement.get("updated_at"),
    }


# ==========================================
# SELLER ENDPOINTS (Comparator)
# ==========================================

@router.get("/deal/{deal_id}")
async def list_deal_engagements(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Seller sees all engagements (comparator view)"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    cursor = engagements_collection.find({"deal_id": deal_id}, {"_id": 0}).sort("created_at", -1)
    engagements = await cursor.to_list(100)

    # Mark as viewed if SUBMITTED
    for eng in engagements:
        if eng["stage"] == "SUBMITTED":
            await engagements_collection.update_one(
                {"engagement_id": eng["engagement_id"]},
                {"$set": {
                    "stage": "VIEWED",
                    "viewed_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            eng["stage"] = "VIEWED"
            await track_event("INTEREST_VIEWED", deal_id=deal_id,
                              user_id=current_user.user_id,
                              metadata={"buyer_id": eng["buyer_id"]})

    shortlist = deal.get("shortlist", {})
    shortlisted_ids = shortlist.get("buyers", []) if shortlist else []
    exclusivity = deal.get("exclusivity", {})
    exclusive_buyer = exclusivity.get("buyer_id") if exclusivity else None

    return {
        "engagements": engagements,
        "shortlisted_buyer_ids": shortlisted_ids,
        "exclusive_buyer_id": exclusive_buyer,
        "total_interests": sum(1 for e in engagements if e["type"] == "INTEREST"),
        "total_lois": sum(1 for e in engagements if e["type"] == "LOI"),
    }


@router.post("/deal/{deal_id}/shortlist/{buyer_id}")
async def add_to_shortlist(
    deal_id: str,
    buyer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Seller adds buyer to shortlist (max 3)"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    shortlist = deal.get("shortlist", {})
    current_buyers = shortlist.get("buyers", []) if shortlist else []

    if buyer_id in current_buyers:
        raise HTTPException(status_code=400, detail="Buyer ya está en shortlist")

    if len(current_buyers) >= 3:
        raise HTTPException(
            status_code=400,
            detail="Shortlist llena (máx 3). Elimina un buyer antes de añadir otro."
        )

    current_buyers.append(buyer_id)
    now = datetime.now(timezone.utc).isoformat()

    await deals_collection.update_one(
        {"deal_id": deal_id},
        {"$set": {
            "shortlist": {
                "buyers": current_buyers,
                "created_at": now,
                "created_by": current_user.user_id
            },
            "updated_at": now
        }}
    )

    # Update engagement stage
    await engagements_collection.update_one(
        {"deal_id": deal_id, "buyer_id": buyer_id},
        {"$set": {"stage": "SHORTLISTED", "updated_at": now}}
    )

    await track_event("BUYER_SHORTLISTED", deal_id=deal_id,
                      user_id=current_user.user_id,
                      metadata={"buyer_id": buyer_id})

    return {"message": "Buyer añadido a shortlist", "shortlist": current_buyers}


@router.delete("/deal/{deal_id}/shortlist/{buyer_id}")
async def remove_from_shortlist(
    deal_id: str,
    buyer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Seller removes buyer from shortlist"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    shortlist = deal.get("shortlist", {})
    current_buyers = shortlist.get("buyers", []) if shortlist else []

    if buyer_id not in current_buyers:
        raise HTTPException(status_code=400, detail="Buyer no está en shortlist")

    current_buyers.remove(buyer_id)
    now = datetime.now(timezone.utc).isoformat()

    await deals_collection.update_one(
        {"deal_id": deal_id},
        {"$set": {
            "shortlist.buyers": current_buyers,
            "updated_at": now
        }}
    )

    # Revert engagement stage to VIEWED
    await engagements_collection.update_one(
        {"deal_id": deal_id, "buyer_id": buyer_id},
        {"$set": {"stage": "VIEWED", "updated_at": now}}
    )

    return {"message": "Buyer eliminado de shortlist", "shortlist": current_buyers}


@router.post("/deal/{deal_id}/reject/{buyer_id}")
async def reject_buyer(
    deal_id: str,
    buyer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Seller rejects a buyer"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    now = datetime.now(timezone.utc).isoformat()

    await engagements_collection.update_one(
        {"deal_id": deal_id, "buyer_id": buyer_id},
        {"$set": {"stage": "REJECTED", "updated_at": now}}
    )

    # Remove from shortlist if present
    shortlist = deal.get("shortlist", {})
    current_buyers = shortlist.get("buyers", []) if shortlist else []
    if buyer_id in current_buyers:
        current_buyers.remove(buyer_id)
        await deals_collection.update_one(
            {"deal_id": deal_id},
            {"$set": {"shortlist.buyers": current_buyers}}
        )

    await track_event("BUYER_REJECTED", deal_id=deal_id,
                      user_id=current_user.user_id,
                      metadata={"buyer_id": buyer_id})

    return {"message": "Buyer rechazado"}


@router.post("/deal/{deal_id}/exclusivity/{buyer_id}")
async def grant_exclusivity(
    deal_id: str,
    buyer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Seller grants exclusivity to a single buyer"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    now = datetime.now(timezone.utc).isoformat()

    await deals_collection.update_one(
        {"deal_id": deal_id},
        {"$set": {
            "exclusivity": {
                "buyer_id": buyer_id,
                "granted_at": now,
                "terms": None
            },
            "status": "exclusivity",
            "status_history": deal.get("status_history", []) + [{
                "status": "exclusivity",
                "changed_at": now,
                "changed_by": current_user.user_id,
                "notes": f"Exclusividad otorgada a buyer {buyer_id}"
            }],
            "updated_at": now
        }}
    )

    # Mark buyer engagement
    await engagements_collection.update_one(
        {"deal_id": deal_id, "buyer_id": buyer_id},
        {"$set": {"stage": "EXCLUSIVITY", "updated_at": now}}
    )

    await track_event("EXCLUSIVITY_GRANTED", deal_id=deal_id,
                      user_id=current_user.user_id,
                      metadata={"buyer_id": buyer_id})

    return {"message": "Exclusividad otorgada", "buyer_id": buyer_id}


# ==========================================
# SAVE / FOLLOW DEAL
# ==========================================

@router.post("/save/{deal_id}")
async def save_deal(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Buyer saves/follows a deal"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    now = datetime.now(timezone.utc).isoformat()

    try:
        await saved_deals_collection.insert_one({
            "user_id": current_user.user_id,
            "deal_id": deal_id,
            "saved_at": now
        })
    except Exception:
        # Already saved (unique constraint)
        return {"message": "Deal ya guardado", "saved": True}

    await track_event("DEAL_SAVED", deal_id=deal_id, user_id=current_user.user_id)

    return {"message": "Deal guardado", "saved": True}


@router.delete("/save/{deal_id}")
async def unsave_deal(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Buyer removes saved deal"""
    await saved_deals_collection.delete_one({
        "user_id": current_user.user_id,
        "deal_id": deal_id
    })
    return {"message": "Deal eliminado de guardados", "saved": False}


@router.get("/saved")
async def list_saved_deals(
    current_user: UserResponse = Depends(get_current_user)
):
    """List buyer's saved deals"""
    cursor = saved_deals_collection.find(
        {"user_id": current_user.user_id}, {"_id": 0}
    ).sort("saved_at", -1)
    saved = await cursor.to_list(50)
    return {"saved_deals": [s["deal_id"] for s in saved]}


@router.get("/save/{deal_id}/status")
async def check_saved_status(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Check if a deal is saved by the current buyer"""
    saved = await saved_deals_collection.find_one(
        {"user_id": current_user.user_id, "deal_id": deal_id},
        {"_id": 0}
    )
    return {"saved": saved is not None}



@router.get("/my-processes")
async def get_my_processes(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all deals where buyer has an active engagement (Mis Procesos)."""
    cursor = engagements_collection.find(
        {"buyer_id": current_user.user_id},
        {"_id": 0}
    ).sort("updated_at", -1)
    engagements = await cursor.to_list(50)

    processes = []
    for eng in engagements:
        deal = await deals_collection.find_one({"deal_id": eng["deal_id"]}, {"_id": 0})
        if not deal:
            continue
        teaser = deal.get("teaser_full", deal.get("teaser", {}))

        # Determine suggested next step
        next_step = None
        if eng["stage"] == "SUBMITTED" and eng["type"] == "INTEREST":
            next_step = {"action": "Revisar Data Room", "href": f"/marketplace/{eng['deal_id']}"}
        elif eng["stage"] == "VIEWED" and eng["type"] == "INTEREST":
            next_step = {"action": "Enviar LOI", "href": f"/marketplace/{eng['deal_id']}"}
        elif eng["stage"] == "SHORTLISTED":
            next_step = {"action": "Preparar Due Diligence", "href": f"/marketplace/{eng['deal_id']}"}
        elif eng["stage"] == "EXCLUSIVITY":
            next_step = {"action": "Avanzar Due Diligence", "href": f"/marketplace/{eng['deal_id']}"}

        processes.append({
            "engagement_id": eng["engagement_id"],
            "deal_id": eng["deal_id"],
            "type": eng["type"],
            "stage": eng["stage"],
            "operation_type": eng.get("operation_type"),
            "valuation_offer": eng.get("valuation_offer"),
            "created_at": eng.get("created_at"),
            "updated_at": eng.get("updated_at"),
            "deal_title": teaser.get("title") or teaser.get("headline") or "Oportunidad",
            "deal_sector": teaser.get("sector_display", "Digital"),
            "deal_location": teaser.get("location") or teaser.get("geography_display", ""),
            "next_step": next_step,
        })

    return {"processes": processes, "total": len(processes)}
