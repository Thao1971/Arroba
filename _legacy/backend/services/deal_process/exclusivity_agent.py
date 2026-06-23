"""
ExclusivityAgent — Solicitud, contraoferta y gestion de exclusividad con bloqueo competitivo.
"""
from database import db
from datetime import datetime, timezone, timedelta
import uuid


async def request_exclusivity(process_id: str, deal_id: str, buyer_id: str, payload: dict) -> dict:
    """Buyer requests exclusivity."""
    now = datetime.now(timezone.utc).isoformat()
    excl_id = f"excl_{uuid.uuid4().hex[:12]}"

    doc = {
        "exclusivity_id": excl_id,
        "process_id": process_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "requested_period_days": payload.get("period_days", 30),
        "rationale": payload.get("rationale", ""),
        "message": payload.get("message"),
        "status": "requested",
        "counter_period_days": None,
        "granted_start": None,
        "granted_end": None,
        "waitlist": [],
        "created_at": now,
        "updated_at": now,
    }
    await db.exclusivity_requests.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


async def respond_exclusivity(excl_id: str, seller_id: str, payload: dict) -> dict:
    """Seller responds to exclusivity request."""
    doc = await db.exclusivity_requests.find_one({"exclusivity_id": excl_id}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")  # grant, reject, counter, info_requested

    update = {"updated_at": now}

    if action == "grant":
        period = doc.get("requested_period_days", 30)
        start = datetime.now(timezone.utc)
        end = start + timedelta(days=period)
        update["status"] = "granted"
        update["granted_start"] = start.isoformat()
        update["granted_end"] = end.isoformat()
        # Block competitive actions on the deal
        await db.deals.update_one(
            {"deal_id": doc["deal_id"]},
            {"$set": {"exclusivity": {
                "buyer_id": doc["buyer_id"],
                "start": start.isoformat(),
                "end": end.isoformat(),
                "exclusivity_id": excl_id,
            }}}
        )
    elif action == "reject":
        update["status"] = "rejected"
    elif action == "counter":
        update["status"] = "countered"
        update["counter_period_days"] = payload.get("counter_period_days")
    elif action == "info_requested":
        update["status"] = "info_requested"

    await db.exclusivity_requests.update_one({"exclusivity_id": excl_id}, {"$set": update})
    return {"exclusivity_id": excl_id, "status": update["status"]}


async def respond_counter(excl_id: str, buyer_id: str, payload: dict) -> dict:
    """Buyer responds to seller's counter-offer on exclusivity."""
    doc = await db.exclusivity_requests.find_one({"exclusivity_id": excl_id}, {"_id": 0})
    if not doc or doc["status"] != "countered":
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")  # accept, reject

    if action == "accept":
        period = doc.get("counter_period_days", 30)
        start = datetime.now(timezone.utc)
        end = start + timedelta(days=period)
        await db.exclusivity_requests.update_one(
            {"exclusivity_id": excl_id},
            {"$set": {"status": "granted", "granted_start": start.isoformat(), "granted_end": end.isoformat(), "updated_at": now}}
        )
        await db.deals.update_one(
            {"deal_id": doc["deal_id"]},
            {"$set": {"exclusivity": {"buyer_id": buyer_id, "start": start.isoformat(), "end": end.isoformat(), "exclusivity_id": excl_id}}}
        )
        return {"exclusivity_id": excl_id, "status": "granted"}
    else:
        await db.exclusivity_requests.update_one({"exclusivity_id": excl_id}, {"$set": {"status": "rejected", "updated_at": now}})
        return {"exclusivity_id": excl_id, "status": "rejected"}


async def join_waitlist(deal_id: str, buyer_id: str) -> dict:
    """Buyer joins waitlist for when exclusivity ends."""
    excl = await db.exclusivity_requests.find_one(
        {"deal_id": deal_id, "status": "granted"}, {"_id": 0}
    )
    if not excl:
        return {"error": "No hay exclusividad activa"}

    if buyer_id not in excl.get("waitlist", []):
        await db.exclusivity_requests.update_one(
            {"exclusivity_id": excl["exclusivity_id"]},
            {"$push": {"waitlist": buyer_id}}
        )
    return {"joined": True, "ends": excl.get("granted_end")}
