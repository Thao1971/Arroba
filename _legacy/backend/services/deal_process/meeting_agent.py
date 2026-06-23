"""
MeetingAgent — Gestiona solicitud, negociacion de slots y confirmacion de reuniones.
"""
from database import db
from datetime import datetime, timezone
import uuid


async def request_meeting(process_id: str, deal_id: str, buyer_id: str, payload: dict) -> dict:
    """Buyer requests a meeting."""
    now = datetime.now(timezone.utc).isoformat()
    meeting_id = f"mtg_{uuid.uuid4().hex[:12]}"

    doc = {
        "meeting_id": meeting_id,
        "process_id": process_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "seller_id": None,  # set by orchestrator
        "status": "proposed",
        "proposed_slots": payload.get("proposed_slots", []),
        "counter_slots": [],
        "confirmed_slot": None,
        "purpose": payload.get("purpose", "exploratorio"),
        "label": payload.get("label", ""),
        "message": payload.get("message"),
        "rejection_reason": None,
        "rejection_category": None,
        "meeting_brief": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.meetings.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


async def respond_to_meeting(meeting_id: str, responder_id: str, responder_role: str, payload: dict) -> dict:
    """Seller or ARROBA responds to meeting request."""
    doc = await db.meetings.find_one({"meeting_id": meeting_id}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")  # accept_slot, counter_propose, info_requested, reject

    update = {"updated_at": now}

    if action == "accept_slot":
        slot_index = payload.get("slot_index", 0)
        slots = doc.get("proposed_slots", []) + doc.get("counter_slots", [])
        if slot_index < len(slots):
            update["status"] = "slot_accepted"
        else:
            update["status"] = "slot_accepted"

    elif action == "counter_propose":
        new_slots = payload.get("counter_slots", [])
        for s in new_slots:
            s["proposed_by"] = responder_id
        update["status"] = "counter_proposed"
        await db.meetings.update_one(
            {"meeting_id": meeting_id},
            {"$push": {"counter_slots": {"$each": new_slots}}}
        )

    elif action == "info_requested":
        update["status"] = "info_requested"

    elif action == "reject":
        update["status"] = "rejected"
        update["rejection_reason"] = payload.get("rejection_reason")
        update["rejection_category"] = payload.get("rejection_category")

    await db.meetings.update_one({"meeting_id": meeting_id}, {"$set": update})
    return {"meeting_id": meeting_id, "status": update.get("status", doc["status"])}


async def confirm_meeting(meeting_id: str, confirmed_slot: dict) -> dict:
    """ARROBA confirms a meeting with final slot."""
    doc = await db.meetings.find_one({"meeting_id": meeting_id}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    brief = {
        "attendees": [doc["buyer_id"], doc.get("seller_id", "seller"), "arroba"],
        "objective": doc.get("purpose"),
        "deal_summary": doc["deal_id"],
        "notes": "",
        "recommended_materials": ["Teaser", "Infomemo"],
    }

    await db.meetings.update_one(
        {"meeting_id": meeting_id},
        {"$set": {
            "status": "confirmed",
            "confirmed_slot": {**confirmed_slot, "confirmed_by": "arroba"},
            "meeting_brief": brief,
            "updated_at": now,
        }}
    )
    return {"meeting_id": meeting_id, "status": "confirmed", "brief": brief}
