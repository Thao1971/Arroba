"""
DocumentRequestAgent — Solicitud de documentos concretos con ciclo de vida completo.
"""
from database import db
from datetime import datetime, timezone
import uuid

DOCUMENT_CATEGORIES = ["financiero", "legal", "fiscal", "comercial", "operaciones", "equipo", "tecnologia"]


async def request_document(process_id: str, deal_id: str, buyer_id: str, payload: dict) -> dict:
    """Buyer requests a specific document."""
    now = datetime.now(timezone.utc).isoformat()
    request_id = f"docr_{uuid.uuid4().hex[:12]}"

    doc = {
        "request_id": request_id,
        "process_id": process_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "category": payload.get("category", ""),
        "description": payload.get("description", ""),
        "message": payload.get("message"),
        "status": "requested",
        "seller_response": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.document_requests.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


async def respond_document_request(request_id: str, seller_id: str, payload: dict) -> dict:
    """Seller responds to document request."""
    doc = await db.document_requests.find_one({"request_id": request_id}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")  # confirm, reject, info_requested, send, preparing

    update = {"updated_at": now}

    if action == "confirm" or action == "preparing":
        update["status"] = "preparing"
        update["seller_response"] = {"action": "preparing", "message": payload.get("message")}
    elif action == "send":
        update["status"] = "sent"
        update["seller_response"] = {
            "action": "send",
            "document_url": payload.get("document_url"),
            "added_to_dataroom": payload.get("added_to_dataroom", False),
            "message": payload.get("message"),
        }
    elif action == "reject":
        update["status"] = "rejected"
        update["seller_response"] = {"action": "reject", "reason": payload.get("reason"), "message": payload.get("message")}
    elif action == "info_requested":
        update["status"] = "info_requested"
        update["seller_response"] = {"action": "info_requested", "message": payload.get("message")}

    await db.document_requests.update_one({"request_id": request_id}, {"$set": update})
    return {"request_id": request_id, "status": update["status"]}
