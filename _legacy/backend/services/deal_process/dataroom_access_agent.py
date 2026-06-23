"""
DataRoomAccessAgent — Solicitud de acceso al Data Room con aprobacion parcial por carpetas.
"""
from database import db
from datetime import datetime, timezone
import uuid


async def request_dataroom_access(process_id: str, deal_id: str, buyer_id: str, payload: dict) -> dict:
    """Buyer requests Data Room access."""
    now = datetime.now(timezone.utc).isoformat()
    request_id = f"dra_{uuid.uuid4().hex[:12]}"

    doc = {
        "request_id": request_id,
        "process_id": process_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "message": payload.get("message", ""),
        "status": "requested",
        "seller_response": None,
        "granted_folders": [],
        "created_at": now,
        "updated_at": now,
    }
    await db.dataroom_requests.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


async def respond_dataroom_request(request_id: str, seller_id: str, payload: dict) -> dict:
    """Seller responds to Data Room access request."""
    doc = await db.dataroom_requests.find_one({"request_id": request_id}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")  # approve, reject, info_requested

    update = {"updated_at": now}

    if action == "approve":
        folders = payload.get("folders", [])
        update["status"] = "partially_granted"
        update["granted_folders"] = folders
        update["seller_response"] = {"action": "approve", "folders": folders, "message": payload.get("message")}
        # Update process permissions
        await db.deal_processes.update_one(
            {"process_id": doc["process_id"]},
            {"$set": {"permissions.dataroom_folders": folders}}
        )
    elif action == "reject":
        update["status"] = "rejected"
        update["seller_response"] = {"action": "reject", "reason": payload.get("reason"), "message": payload.get("message")}
    elif action == "info_requested":
        update["status"] = "info_requested"
        update["seller_response"] = {"action": "info_requested", "message": payload.get("message")}

    await db.dataroom_requests.update_one({"request_id": request_id}, {"$set": update})
    return {"request_id": request_id, "status": update["status"]}
