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

    # Get conversation mappings for this deal
    from database import db as _db
    conv_cursor = _db.conversations.find(
        {"deal_id": deal_id}, {"_id": 0, "conversation_id": 1, "buyer_id": 1}
    )
    conv_list = await conv_cursor.to_list(100)
    conv_by_buyer = {c["buyer_id"]: c["conversation_id"] for c in conv_list}
    conv_ids_here = [c["conversation_id"] for c in conv_list]

    # Get pending Q&A counts per conversation
    pending_map = {}
    if conv_ids_here:
        now_dt = datetime.now(timezone.utc)
        pending_cursor = _db.qa_items.find(
            {"conversation_id": {"$in": conv_ids_here}, "type": "QUESTION", "status": "PENDING"},
            {"_id": 0, "conversation_id": 1, "created_at": 1}
        )
        p_items = await pending_cursor.to_list(200)
        for pi in p_items:
            cid = pi["conversation_id"]
            created = pi["created_at"]
            if isinstance(created, str):
                created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            else:
                created_dt = created
            hours = (now_dt - created_dt).total_seconds() / 3600
            if cid not in pending_map:
                pending_map[cid] = {"count": 0, "oldest_hours": 0}
            pending_map[cid]["count"] += 1
            if hours > pending_map[cid]["oldest_hours"]:
                pending_map[cid]["oldest_hours"] = hours

    for eng in engagements:
        eng["conversation_id"] = conv_by_buyer.get(eng["buyer_id"])
        cid = eng["conversation_id"]
        if cid and cid in pending_map:
            p = pending_map[cid]
            eng["pending_questions"] = p["count"]
            eng["oldest_pending_hours"] = round(p["oldest_hours"], 1)
            eng["pending_urgency"] = "alta" if p["oldest_hours"] >= 24 else ("media" if p["oldest_hours"] >= 12 else "baja")
        else:
            eng["pending_questions"] = 0
            eng["oldest_pending_hours"] = 0
            eng["pending_urgency"] = None

    return {
        "engagements": engagements,
        "shortlisted_buyer_ids": shortlisted_ids,
        "exclusive_buyer_id": exclusive_buyer,
        "total_interests": sum(1 for e in engagements if e["type"] == "INTEREST"),
        "total_lois": sum(1 for e in engagements if e["type"] == "LOI"),
    }



@router.post("/deal/{deal_id}/accept/{buyer_id}")
async def accept_interest(
    deal_id: str,
    buyer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Seller accepts a buyer's interest — triggers Q&A conversation creation."""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    engagement = await engagements_collection.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0}
    )
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    if engagement.get("stage") in ("ACCEPTED", "SHORTLISTED", "EXCLUSIVITY"):
        raise HTTPException(status_code=400, detail="Interest ya aceptado")

    if engagement.get("stage") == "REJECTED":
        raise HTTPException(status_code=400, detail="Buyer rechazado, no se puede aceptar")

    now = datetime.now(timezone.utc).isoformat()

    await engagements_collection.update_one(
        {"deal_id": deal_id, "buyer_id": buyer_id},
        {"$set": {"stage": "ACCEPTED", "accepted_at": now, "updated_at": now}}
    )

    await track_event("INTEREST_ACCEPTED", deal_id=deal_id,
                      user_id=current_user.user_id,
                      metadata={"buyer_id": buyer_id})

    # Auto-create Q&A conversation
    from routers.conversations import create_conversation_for_engagement
    eng_id = engagement.get("engagement_id", "")
    conversation_id = await create_conversation_for_engagement(
        deal_id=deal_id,
        buyer_id=buyer_id,
        seller_id=current_user.user_id,
        engagement_id=eng_id
    )

    # Notify buyer
    import uuid as _uuid
    from database import db as _db
    await _db.notifications.insert_one({
        "notification_id": f"notif_{_uuid.uuid4().hex[:12]}",
        "user_id": buyer_id,
        "type": "INTEREST_ACCEPTED",
        "title": "Tu interes ha sido aceptado",
        "message": "El seller ha aceptado tu interes. Ya puedes hacer preguntas en el Q&A.",
        "deal_id": deal_id,
        "metadata": {"conversation_id": conversation_id},
        "read": False,
        "created_at": now,
    })

    return {
        "message": "Interest aceptado — Q&A creado",
        "conversation_id": conversation_id,
        "stage": "ACCEPTED"
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
    """List buyer's saved deals with full deal info"""
    cursor = saved_deals_collection.find(
        {"user_id": current_user.user_id}, {"_id": 0}
    ).sort("saved_at", -1)
    saved = await cursor.to_list(50)

    deals = []
    for s in saved:
        deal = await deals_collection.find_one(
            {"deal_id": s["deal_id"]}, {"_id": 0}
        )
        if deal:
            teaser = deal.get("teaser", {})
            deals.append({
                "deal_id": deal["deal_id"],
                "status": deal.get("status", ""),
                "saved_at": s.get("saved_at"),
                "teaser": {
                    "headline": teaser.get("headline"),
                    "sector_display": teaser.get("sector_display"),
                    "geography_display": teaser.get("geography_display"),
                    "revenue_display": teaser.get("revenue_display"),
                    "ebitda_display": teaser.get("ebitda_display"),
                }
            })

    return {"deals": deals, "total": len(deals)}


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



@router.get("/seller/interesados")
async def get_seller_interesados(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Optimized endpoint for Seller Interesados view.
    Returns ALL buyers across ALL seller deals with:
    - Enriched engagement data
    - Intent scores
    - Last activity timestamp
    - Suggested prescriptive action
    """
    from services.intent_service import compute_intent_score
    from services.coaching_service import get_seller_nudges

    seller_id = current_user.user_id

    # Get all seller deals (not draft, not closed/dropped)
    cursor = deals_collection.find(
        {"owner_id": seller_id, "status": {"$nin": ["draft", "closed", "dropped"]}},
        {"_id": 0}
    )
    deals = await cursor.to_list(20)

    if not deals:
        nudges = await get_seller_nudges(seller_id)
        return {"buyers": [], "deals_count": 0, "nudges": nudges, "summary": {
            "total": 0, "lois": 0, "interests": 0, "high_intent": 0, "needs_action": 0
        }}

    deal_map = {}
    for d in deals:
        deal_map[d["deal_id"]] = d

    # Get ALL engagements for these deals in one query
    deal_ids = [d["deal_id"] for d in deals]
    eng_cursor = engagements_collection.find(
        {"deal_id": {"$in": deal_ids}},
        {"_id": 0}
    ).sort("updated_at", -1)
    engagements = await eng_cursor.to_list(200)

    # Get conversations for these deals to map to buyers
    from database import db as _db
    conv_cursor = _db.conversations.find(
        {"deal_id": {"$in": deal_ids}}, {"_id": 0, "conversation_id": 1, "deal_id": 1, "buyer_id": 1}
    )
    conv_list = await conv_cursor.to_list(500)
    conv_map = {}
    conv_id_list = []
    for c in conv_list:
        conv_map[(c["deal_id"], c["buyer_id"])] = c["conversation_id"]
        conv_id_list.append(c["conversation_id"])

    # Get pending Q&A counts per conversation (Response Acceleration)
    pending_map = {}  # conversation_id -> {count, oldest_hours}
    if conv_id_list:
        now_dt = datetime.now(timezone.utc)
        pending_cursor = _db.qa_items.find(
            {"conversation_id": {"$in": conv_id_list}, "type": "QUESTION", "status": "PENDING"},
            {"_id": 0, "conversation_id": 1, "created_at": 1}
        )
        pending_items = await pending_cursor.to_list(500)
        for pi in pending_items:
            cid = pi["conversation_id"]
            created = pi["created_at"]
            if isinstance(created, str):
                created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            else:
                created_dt = created
            hours = (now_dt - created_dt).total_seconds() / 3600
            if cid not in pending_map:
                pending_map[cid] = {"count": 0, "oldest_hours": 0}
            pending_map[cid]["count"] += 1
            if hours > pending_map[cid]["oldest_hours"]:
                pending_map[cid]["oldest_hours"] = hours

    # Process each buyer
    enriched_buyers = []
    loi_count = 0
    interest_count = 0
    high_intent_count = 0
    needs_action_count = 0

    for eng in engagements:
        deal = deal_map.get(eng["deal_id"], {})
        teaser = deal.get("teaser", {})

        # Intent score
        intent = await compute_intent_score(eng["buyer_id"], eng["deal_id"])
        intent_score = intent.get("score", 0)
        intent_level = intent.get("level", "baja")

        # Last activity
        last_activity = eng.get("updated_at") or eng.get("created_at")

        # Derive suggested action based on stage + type + intent
        action = _derive_action(eng, intent_score, deal)

        buyer_entry = {
            "engagement_id": eng.get("engagement_id"),
            "deal_id": eng["deal_id"],
            "deal_title": teaser.get("headline") or deal.get("title") or eng["deal_id"],
            "buyer_id": eng["buyer_id"],
            "buyer_name": eng.get("buyer_name") or eng["buyer_id"],
            "buyer_type": eng.get("buyer_type", ""),
            "type": eng["type"],
            "stage": eng["stage"],
            "intent_score": intent_score,
            "intent_level": intent_level,
            "valuation_offer": eng.get("valuation_offer"),
            "structure": eng.get("structure"),
            "last_activity": last_activity,
            "created_at": eng.get("created_at"),
            "action": action,
            "conversation_id": conv_map.get((eng["deal_id"], eng["buyer_id"])),
        }

        # Pending Q&A stats (Response Acceleration)
        cid = buyer_entry["conversation_id"]
        if cid and cid in pending_map:
            p = pending_map[cid]
            buyer_entry["pending_questions"] = p["count"]
            buyer_entry["oldest_pending_hours"] = round(p["oldest_hours"], 1)
            buyer_entry["pending_urgency"] = "alta" if p["oldest_hours"] >= 24 else ("media" if p["oldest_hours"] >= 12 else "baja")
        else:
            buyer_entry["pending_questions"] = 0
            buyer_entry["oldest_pending_hours"] = 0
            buyer_entry["pending_urgency"] = None

        enriched_buyers.append(buyer_entry)

        if eng["type"] == "LOI":
            loi_count += 1
        else:
            interest_count += 1
        if intent_score >= 55:
            high_intent_count += 1
        if action.get("urgency") in ("alta", "media"):
            needs_action_count += 1

    # Sort: urgent actions first, then by intent score
    urgency_order = {"alta": 0, "media": 1, "baja": 2}
    enriched_buyers.sort(key=lambda b: (
        urgency_order.get(b["action"].get("urgency", "baja"), 3),
        -(b["intent_score"]),
    ))

    # Get nudges
    nudges = await get_seller_nudges(seller_id)

    return {
        "buyers": enriched_buyers,
        "deals_count": len(deals),
        "nudges": nudges,
        "summary": {
            "total": len(enriched_buyers),
            "lois": loi_count,
            "interests": interest_count,
            "high_intent": high_intent_count,
            "needs_action": needs_action_count,
        }
    }


def _derive_action(eng: dict, intent_score: int, deal: dict) -> dict:
    """
    Prescriptive action per buyer based on stage + type + intent.
    Returns: {text, urgency, cta}
    """
    stage = eng.get("stage", "SUBMITTED")
    eng_type = eng.get("type", "INTEREST")
    buyer_name = (eng.get("buyer_name") or "Buyer").split()[0]
    offer = eng.get("valuation_offer")

    if stage == "REJECTED":
        return {"text": "Descartado", "urgency": "baja", "cta": None}

    if stage == "EXCLUSIVITY":
        return {
            "text": f"En exclusividad — avanzar DD con {buyer_name}",
            "urgency": "alta",
            "cta": "Gestionar deal",
        }

    if stage == "ACCEPTED":
        if eng_type == "LOI":
            offer_str = f" ({offer/1e6:.1f}M)" if offer else ""
            return {
                "text": f"LOI aceptada{offer_str} — abrir Q&A o shortlistar",
                "urgency": "alta",
                "cta": "Abrir Q&A",
            }
        if intent_score >= 55:
            return {
                "text": "Aceptado, alta intencion — Q&A abierto, esperar LOI",
                "urgency": "media",
                "cta": "Abrir Q&A",
            }
        return {
            "text": "Aceptado — Q&A disponible, pendiente de avance",
            "urgency": "baja",
            "cta": "Abrir Q&A",
        }

    if eng_type == "LOI" and stage == "SHORTLISTED":
        offer_str = f" ({offer/1e6:.1f}M)" if offer else ""
        return {
            "text": f"LOI en shortlist{offer_str} — decidir exclusividad",
            "urgency": "alta",
            "cta": "Revisar LOI",
        }

    if eng_type == "LOI" and stage in ("SUBMITTED", "VIEWED"):
        offer_str = f" de {offer/1e6:.1f}M" if offer else ""
        return {
            "text": f"LOI recibida{offer_str} — evaluar y shortlistar",
            "urgency": "alta",
            "cta": "Evaluar LOI",
        }

    # INTEREST type
    if stage == "SHORTLISTED":
        if intent_score >= 55:
            return {
                "text": f"{buyer_name} en shortlist, alta intencion — esperar LOI",
                "urgency": "media",
                "cta": "Ver actividad",
            }
        return {
            "text": f"En shortlist pero intencion baja ({intent_score}) — contactar",
            "urgency": "media",
            "cta": "Contactar",
        }

    if stage == "SUBMITTED":
        return {
            "text": f"Nuevo interes — revisar perfil de {buyer_name}",
            "urgency": "media",
            "cta": "Revisar",
        }

    if intent_score >= 55:
        return {
            "text": f"Alta intencion ({intent_score}) — considerar shortlist",
            "urgency": "media",
            "cta": "Shortlistar",
        }

    if intent_score >= 25:
        return {
            "text": f"Intencion media ({intent_score}) — monitorizar actividad",
            "urgency": "baja",
            "cta": None,
        }

    if stage == "VIEWED":
        return {
            "text": "Visto, baja intencion — esperar senales",
            "urgency": "baja",
            "cta": None,
        }

    return {
        "text": f"Baja intencion ({intent_score}) — sin accion requerida",
        "urgency": "baja",
        "cta": None,
    }



def _compute_process_actions(eng: dict, deal: dict, has_nda: bool, conversation_id: str | None, buyer_id: str) -> dict:
    """Compute available, recommended, and blocked actions for a buyer process."""
    stage = eng.get("stage", "")
    eng_type = eng.get("type", "")
    deal_id = eng.get("deal_id", "")
    is_rejected = stage == "REJECTED"

    available = []
    blocked = []
    recommended = None

    if is_rejected:
        return {"recommended": None, "available": [], "blocked": [{"id": "all", "label": "Proceso no seleccionado", "reason": "El seller no ha continuado con este proceso."}]}

    # NDA
    if not has_nda:
        recommended = {"id": "sign_nda", "label": "Firmar NDA", "href": f"/explorar/{deal_id}", "priority": 1}
        available.append({"id": "sign_nda", "label": "Firmar NDA", "href": f"/explorar/{deal_id}"})
        blocked.append({"id": "view_infomemo", "label": "Ver infomemo", "reason": "Requiere NDA firmado"})
        blocked.append({"id": "view_dataroom", "label": "Acceder a Data Room", "reason": "Requiere NDA firmado"})
    else:
        available.append({"id": "view_infomemo", "label": "Ver infomemo", "href": f"/explorar/{deal_id}"})
        available.append({"id": "view_dataroom", "label": "Acceder a Data Room", "href": f"/explorar/{deal_id}"})

    # Q&A
    if conversation_id:
        available.append({"id": "ask_question", "label": "Hacer pregunta", "href": f"/qa/{conversation_id}"})
    elif stage in ("ACCEPTED", "SHORTLISTED", "EXCLUSIVITY"):
        blocked.append({"id": "ask_question", "label": "Hacer pregunta", "reason": "Q&A aún no activado para este proceso"})

    # Interest / LOI actions
    if eng_type == "INTEREST" and stage in ("SUBMITTED", "VIEWED", "ACCEPTED"):
        available.append({"id": "send_loi", "label": "Enviar oferta / LOI", "href": f"/explorar/{deal_id}"})
        if not recommended:
            if stage == "VIEWED":
                recommended = {"id": "send_loi", "label": "Enviar oferta / LOI", "href": f"/explorar/{deal_id}", "priority": 2}
            elif stage == "ACCEPTED" and conversation_id:
                recommended = {"id": "ask_question", "label": "Abrir Q&A", "href": f"/qa/{conversation_id}", "priority": 2}

    if stage == "SHORTLISTED":
        available.append({"id": "send_loi", "label": "Enviar oferta / LOI", "href": f"/explorar/{deal_id}"})
        if not recommended:
            recommended = {"id": "send_loi", "label": "Preparar LOI", "href": f"/explorar/{deal_id}", "priority": 2}

    if stage == "EXCLUSIVITY":
        if not recommended:
            recommended = {"id": "advance_dd", "label": "Avanzar Due Diligence", "href": f"/explorar/{deal_id}", "priority": 1}

    # General actions always available
    available.append({"id": "save_deal", "label": "Guardar / seguir", "href": f"/explorar/{deal_id}"})

    # Withdraw
    if stage not in ("EXCLUSIVITY",):
        available.append({"id": "withdraw", "label": "Retirar interés", "href": None})

    # Contact actions (placeholders for future)
    available.append({"id": "contact_seller", "label": "Agendar reunión con el seller", "href": None})
    available.append({"id": "contact_arroba", "label": "Agendar reunión con ARROBA", "href": "mailto:equipo@arroba.es"})

    return {
        "recommended": recommended,
        "available": available,
        "blocked": blocked,
    }



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

        # Lookup conversation for this buyer+deal
        from database import db as _db
        conv = await _db.conversations.find_one(
            {"deal_id": eng["deal_id"], "buyer_id": current_user.user_id},
            {"_id": 0, "conversation_id": 1}
        )
        conversation_id = conv.get("conversation_id") if conv else None

        # Determine suggested next step
        next_step = None
        if eng["stage"] == "SUBMITTED" and eng["type"] == "INTEREST":
            next_step = {"action": "Revisar Data Room", "href": f"/marketplace/{eng['deal_id']}"}
        elif eng["stage"] == "VIEWED" and eng["type"] == "INTEREST":
            next_step = {"action": "Enviar LOI", "href": f"/marketplace/{eng['deal_id']}"}
        elif eng["stage"] == "ACCEPTED":
            if conversation_id:
                next_step = {"action": "Abrir Q&A", "href": f"/qa/{conversation_id}"}
            else:
                next_step = {"action": "Preparar preguntas", "href": f"/marketplace/{eng['deal_id']}"}
        elif eng["stage"] == "SHORTLISTED":
            if conversation_id:
                next_step = {"action": "Continuar Q&A", "href": f"/qa/{conversation_id}"}
            else:
                next_step = {"action": "Preparar Due Diligence", "href": f"/marketplace/{eng['deal_id']}"}
        elif eng["stage"] == "EXCLUSIVITY":
            next_step = {"action": "Avanzar Due Diligence", "href": f"/marketplace/{eng['deal_id']}"}

        # Compute available actions for this process
        has_nda = any(n.get("buyer_id") == current_user.user_id for n in deal.get("ndas_signed", []))
        actions = _compute_process_actions(eng, deal, has_nda, conversation_id, current_user.user_id)

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
            "deal_revenue": teaser.get("revenue_display") or teaser.get("revenue_range"),
            "deal_ebitda": teaser.get("ebitda_display") or teaser.get("ebitda_range"),
            "has_nda": has_nda,
            "next_step": next_step,
            "conversation_id": conversation_id,
            "actions": actions,
        })

    return {"processes": processes, "total": len(processes)}


@router.get("/deal/{deal_id}/loi-comparator")
async def get_loi_comparator(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """LOI Comparator — enriched LOI data for seller comparison."""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal no encontrado")
    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(403, "No autorizado")

    asking_price = deal.get("asking_price", 0)

    # Get all LOI engagements for this deal
    cursor = engagements_collection.find(
        {"deal_id": deal_id, "type": "LOI"},
        {"_id": 0}
    ).sort("valuation_offer", -1)
    lois_raw = await cursor.to_list(50)

    if not lois_raw:
        return {"lois": [], "summary": {"count": 0}, "deal_asking_price": asking_price}

    from database import db as _db

    # Enrich each LOI
    lois = []
    best_offer = 0
    total_cash_pct = 0
    cash_count = 0

    for eng in lois_raw:
        buyer_id = eng["buyer_id"]
        buyer = await users_collection.find_one({"user_id": buyer_id}, {"_id": 0})
        bp = buyer.get("buyer_profile", {}) if buyer else {}

        # Buyer signals from time tracking
        time_docs = await _db.time_tracking.find(
            {"deal_id": deal_id, "user_id": buyer_id}, {"_id": 0}
        ).to_list(100)
        total_seconds = sum(t.get("duration_seconds", 0) for t in time_docs)
        total_minutes = round(total_seconds / 60, 1)

        # DR downloads
        dr_downloads = await _db.dataroom_access_log.count_documents(
            {"deal_id": deal_id, "user_id": buyer_id, "action": "download"}
        )
        dr_views = await _db.dataroom_access_log.count_documents(
            {"deal_id": deal_id, "user_id": buyer_id}
        )

        # Intent score
        intent_data = None
        try:
            from services.intent_service import compute_intent_score
            intent_data = await compute_intent_score(deal_id, buyer_id)
        except Exception:
            pass
        intent_score = intent_data.get("intent_score", 0) if intent_data else 0
        intent_level = intent_data.get("intent_level", "baja") if intent_data else "baja"

        # Certification
        cert_level = "basic"
        try:
            from routers.buyer_certification import _compute_certification, _get_plan_tier
            if buyer:
                from models.user import UserResponse as UR
                user_obj = UR(**buyer)
                cert = await _compute_certification(user_obj)
                cert_level = cert.get("level", "basic")
        except Exception:
            pass

        # Conversation
        conv = await _db.conversations.find_one(
            {"deal_id": deal_id, "buyer_id": buyer_id},
            {"_id": 0, "conversation_id": 1}
        )

        # Compute comparator fields
        offer = eng.get("valuation_offer", 0)
        if offer > best_offer:
            best_offer = offer
        pct_vs_asking = round((offer / asking_price * 100), 1) if asking_price > 0 else 0

        structure = eng.get("structure", "cash")
        cash_pct = 100 if structure == "cash" else (eng.get("cash_percentage", 0) or (100 - (eng.get("earn_out_percentage", 0) or 0)))
        earn_out_pct = 100 - cash_pct
        total_cash_pct += cash_pct
        cash_count += 1

        last_active = eng.get("updated_at") or eng.get("created_at")

        lois.append({
            "engagement_id": eng["engagement_id"],
            "buyer_id": buyer_id,
            "buyer_name": eng.get("buyer_name") or f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() if buyer else "Anónimo",
            "buyer_type": eng.get("buyer_type") or bp.get("buyer_type", "—"),
            "buyer_certification_level": cert_level,
            "valuation_offer": offer,
            "pct_vs_asking": pct_vs_asking,
            "structure": structure,
            "cash_percentage": cash_pct,
            "earn_out_percentage": earn_out_pct,
            "acquisition_percentage": eng.get("acquisition_percentage", 100),
            "conditions": eng.get("conditions", ""),
            "submitted_at": eng.get("upgraded_to_loi_at") or eng.get("created_at"),
            "expires_at": eng.get("expires_at"),
            "stage": eng.get("stage"),
            "intent_score": intent_score,
            "intent_level": intent_level,
            "dr_downloads": dr_downloads,
            "dr_views": dr_views,
            "total_time_minutes": total_minutes,
            "last_active_at": last_active,
            "conversation_id": conv.get("conversation_id") if conv else None,
            # Flags (computed below)
            "flags": [],
        })

    # Compute flags
    if lois:
        avg_cash = total_cash_pct / cash_count if cash_count > 0 else 0
        max_offer = max(l["valuation_offer"] for l in lois)
        max_cash = max(l["cash_percentage"] for l in lois)
        max_intent = max(l["intent_score"] for l in lois)
        max_activity = max(l["total_time_minutes"] for l in lois)

        for l in lois:
            flags = []
            if l["valuation_offer"] == max_offer and len(lois) > 1:
                flags.append({"type": "best_offer", "label": "Mejor oferta"})
            if l["cash_percentage"] == max_cash and max_cash > avg_cash and len(lois) > 1:
                flags.append({"type": "most_cash", "label": "Más cash"})
            if l["intent_score"] == max_intent and max_intent > 50 and len(lois) > 1:
                flags.append({"type": "highest_activity", "label": "Mayor actividad"})
            if l["total_time_minutes"] < 5 and l["stage"] not in ("EXCLUSIVITY",):
                flags.append({"type": "low_activity", "label": "Baja actividad"})
            if l["expires_at"]:
                flags.append({"type": "expires_soon", "label": "Con vencimiento"})
            l["flags"] = flags

    # Summary
    summary = {
        "count": len(lois),
        "best_offer": best_offer,
        "avg_cash_pct": round(total_cash_pct / cash_count, 1) if cash_count > 0 else 0,
        "highest_intent_buyer": max(lois, key=lambda x: x["intent_score"])["buyer_name"] if lois else None,
    }

    return {
        "lois": lois,
        "summary": summary,
        "deal_asking_price": asking_price,
    }
