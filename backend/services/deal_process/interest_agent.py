"""
InterestAgent — Gestiona expresiones de interes buyer → seller.
"""
from database import db
from datetime import datetime, timezone
import uuid


async def submit_interest(process_id: str, deal_id: str, buyer_id: str, payload: dict) -> dict:
    """Buyer submits interest expression."""
    now = datetime.now(timezone.utc).isoformat()
    interest_id = f"int_{uuid.uuid4().hex[:12]}"

    doc = {
        "interest_id": interest_id,
        "process_id": process_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "interest_type": payload.get("interest_type", "exploratory"),
        "message": payload.get("message", ""),
        "indicative_range": payload.get("indicative_range"),
        "status": "submitted",
        "seller_response": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.interest_expressions.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


async def respond_to_interest(interest_id: str, seller_id: str, payload: dict) -> dict:
    """Seller responds to interest."""
    doc = await db.interest_expressions.find_one({"interest_id": interest_id}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")  # accept, reject, respond

    new_status = {"accept": "accepted", "reject": "rejected", "respond": "responded"}.get(action, "responded")

    response = {
        "action": action,
        "message": payload.get("message"),
        "rejection_reason": payload.get("rejection_reason"),
        "guided_response": payload.get("guided_response"),
    }

    await db.interest_expressions.update_one(
        {"interest_id": interest_id},
        {"$set": {"status": new_status, "seller_response": response, "updated_at": now}}
    )

    # If accepted, auto-create Q&A conversation
    if action == "accept":
        conv_id = f"conv_{uuid.uuid4().hex[:12]}"
        await db.conversations.update_one(
            {"deal_id": doc["deal_id"], "buyer_id": doc["buyer_id"]},
            {"$setOnInsert": {
                "conversation_id": conv_id,
                "deal_id": doc["deal_id"],
                "buyer_id": doc["buyer_id"],
                "seller_id": seller_id,
                "created_at": now,
            }},
            upsert=True,
        )

    return {"interest_id": interest_id, "status": new_status, "response": response}
