"""
Contact Request System
Gestiona solicitudes de contacto buyer -> seller para deals.
"""
from fastapi import APIRouter, HTTPException, Depends
from database import db
from routers.auth import get_current_user
from models.user import UserResponse
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/deals", tags=["Contact Requests"])


@router.post("/{deal_id}/contact-request")
async def create_contact_request(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Buyer sends a contact request for a deal."""
    if user.role != "buyer":
        raise HTTPException(403, "Solo buyers pueden solicitar contacto")

    deal = await db.deals.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal no encontrado")

    # Check for existing pending/accepted request
    existing = await db.contact_requests.find_one(
        {"deal_id": deal_id, "buyer_id": user.user_id, "status": {"$in": ["pending", "accepted"]}},
        {"_id": 0},
    )
    if existing:
        if existing["status"] == "accepted":
            raise HTTPException(400, "Contacto ya aceptado para este deal")
        raise HTTPException(400, "Ya tienes una solicitud pendiente para este deal")

    now = datetime.now(timezone.utc).isoformat()
    request_id = f"cr_{uuid.uuid4().hex[:12]}"

    # Check seller contact policy
    seller_id = deal["owner_id"]
    seller_settings = await db.seller_settings.find_one(
        {"seller_id": seller_id}, {"_id": 0}
    )
    policy = (seller_settings or {}).get("contact_policy", "manual_review")

    # Buyer plan info
    buyer_plan = await _get_buyer_tier(user)

    doc = {
        "request_id": request_id,
        "deal_id": deal_id,
        "buyer_id": user.user_id,
        "seller_id": seller_id,
        "buyer_plan": buyer_plan,
        "buyer_name": f"{user.first_name} {user.last_name}".strip(),
        "buyer_email": user.email,
        "status": "accepted" if policy == "auto_accept" else "pending",
        "policy_applied": policy,
        "priority": buyer_plan == "pro+",
        "created_at": now,
        "updated_at": now,
        "responded_at": now if policy == "auto_accept" else None,
    }

    await db.contact_requests.insert_one(doc)

    # Notify seller if manual review
    if policy == "manual_review":
        await db.notifications.insert_one({
            "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
            "user_id": seller_id,
            "type": "CONTACT_REQUEST",
            "title": "Nueva solicitud de contacto",
            "message": f"{doc['buyer_name']} quiere acceder a tu oportunidad.",
            "data": {"deal_id": deal_id, "request_id": request_id, "buyer_plan": buyer_plan},
            "read": False,
            "created_at": now,
        })

    return {k: v for k, v in doc.items() if k != "_id"}


@router.post("/{deal_id}/contact-request/{request_id}/accept")
async def accept_contact_request(deal_id: str, request_id: str, user: UserResponse = Depends(get_current_user)):
    """Seller accepts a contact request."""
    req = await db.contact_requests.find_one(
        {"request_id": request_id, "deal_id": deal_id}, {"_id": 0}
    )
    if not req:
        raise HTTPException(404, "Solicitud no encontrada")
    if req["seller_id"] != user.user_id:
        raise HTTPException(403, "No autorizado")
    if req["status"] != "pending":
        raise HTTPException(400, f"Solicitud ya esta en estado: {req['status']}")

    now = datetime.now(timezone.utc).isoformat()
    await db.contact_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "accepted", "responded_at": now, "updated_at": now}},
    )

    # Notify buyer
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": req["buyer_id"],
        "type": "CONTACT_ACCEPTED",
        "title": "Solicitud de contacto aceptada",
        "message": "El vendedor ha aceptado tu solicitud. Ahora puedes ver mas detalles.",
        "data": {"deal_id": deal_id, "request_id": request_id},
        "read": False,
        "created_at": now,
    })

    return {"status": "accepted", "request_id": request_id}


@router.post("/{deal_id}/contact-request/{request_id}/reject")
async def reject_contact_request(deal_id: str, request_id: str, user: UserResponse = Depends(get_current_user)):
    """Seller rejects a contact request."""
    req = await db.contact_requests.find_one(
        {"request_id": request_id, "deal_id": deal_id}, {"_id": 0}
    )
    if not req:
        raise HTTPException(404, "Solicitud no encontrada")
    if req["seller_id"] != user.user_id:
        raise HTTPException(403, "No autorizado")
    if req["status"] != "pending":
        raise HTTPException(400, f"Solicitud ya esta en estado: {req['status']}")

    now = datetime.now(timezone.utc).isoformat()
    await db.contact_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "rejected", "responded_at": now, "updated_at": now}},
    )

    return {"status": "rejected", "request_id": request_id}


@router.get("/{deal_id}/contact-requests")
async def list_contact_requests(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Seller lists all contact requests for a deal."""
    deal = await db.deals.find_one({"deal_id": deal_id}, {"_id": 0, "owner_id": 1})
    if not deal or deal["owner_id"] != user.user_id:
        raise HTTPException(403, "No autorizado")

    cursor = db.contact_requests.find(
        {"deal_id": deal_id}, {"_id": 0}
    ).sort("created_at", -1)
    return await cursor.to_list(100)


async def _get_buyer_tier(user: UserResponse) -> str:
    """Get buyer tier from database subscription data."""
    # Query the database for the full user record with subscription
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"subscription": 1})
    if user_doc:
        sub = user_doc.get("subscription")
        if sub and isinstance(sub, dict):
            pt = sub.get("plan_type", "") or ""
            if "proplus" in pt or "pro+" in pt:
                return "pro+"
            if "pro" in pt:
                return "pro"
    return "free"
