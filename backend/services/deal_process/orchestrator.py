"""
Deal Process Orchestrator — Punto central de todas las transiciones de estado.
Recibe eventos, valida con BuyerAgent, delega a subagentes, actualiza estado y emite efectos.
"""
from database import db
from datetime import datetime, timezone
from services.deal_process.buyer_agent import validate_buyer_action, build_buyer_snapshot
from services.deal_process.interest_agent import submit_interest, respond_to_interest
from services.deal_process.meeting_agent import request_meeting, respond_to_meeting, confirm_meeting
from services.deal_process.dataroom_access_agent import request_dataroom_access, respond_dataroom_request
from services.deal_process.document_request_agent import request_document, respond_document_request
from services.deal_process.exclusivity_agent import request_exclusivity, respond_exclusivity, respond_counter
import uuid

VALID_TRANSITIONS = {
    "NDA_SIGNED": ["INTEREST_SUBMITTED", "MEETING_REQUESTED"],
    "INTEREST_SUBMITTED": ["INTEREST_ACCEPTED", "INTEREST_REJECTED", "INTEREST_RESPONDED"],
    "INTEREST_ACCEPTED": ["MEETING_REQUESTED", "DATA_ROOM_REQUESTED", "DOCUMENT_REQUESTED",
                          "EXCLUSIVITY_REQUESTED", "PRELIMINARY_OFFER_SUBMITTED", "FORMAL_LOI_SUBMITTED"],
    "INTEREST_RESPONDED": ["MEETING_REQUESTED", "INTEREST_SUBMITTED"],
    "MEETING_REQUESTED": ["MEETING_INFO_REQUESTED", "MEETING_COUNTER_PROPOSED", "MEETING_CONFIRMED", "MEETING_REJECTED"],
    "MEETING_CONFIRMED": ["DATA_ROOM_REQUESTED", "DOCUMENT_REQUESTED", "EXCLUSIVITY_REQUESTED",
                          "PRELIMINARY_OFFER_SUBMITTED"],
    "DATA_ROOM_REQUESTED": ["DATA_ROOM_PARTIALLY_GRANTED", "DATA_ROOM_REJECTED"],
    "EXCLUSIVITY_REQUESTED": ["EXCLUSIVITY_GRANTED", "EXCLUSIVITY_COUNTERED", "EXCLUSIVITY_REJECTED"],
    "PRELIMINARY_OFFER_SUBMITTED": ["PRELIMINARY_OFFER_ACCEPTED", "PRELIMINARY_OFFER_REJECTED",
                                    "PRELIMINARY_OFFER_INFO_REQUESTED", "FORMAL_LOI_SUBMITTED"],
    "FORMAL_LOI_SUBMITTED": ["FORMAL_LOI_ACCEPTED", "FORMAL_LOI_COUNTERED", "FORMAL_LOI_REJECTED"],
    "FORMAL_LOI_ACCEPTED": ["DD_IN_PROGRESS"],
    "DD_IN_PROGRESS": ["DD_COMPLETED_READY_TO_CLOSE"],
    "DD_COMPLETED_READY_TO_CLOSE": ["CLOSING_IN_PROGRESS"],
    "CLOSING_IN_PROGRESS": ["DEAL_CLOSED_SUCCESS", "DEAL_CLOSED_FAILED", "DEAL_CLOSED_PENDING_FORMALIZATION"],
}


async def init_process(deal_id: str, buyer_id: str) -> dict:
    """Initialize a deal process after NDA is signed."""
    deal = await db.deals.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        return None

    # Check if process already exists
    existing = await db.deal_processes.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0}
    )
    if existing:
        return existing

    # Build buyer snapshot
    buyer = await db.users.find_one({"user_id": buyer_id}, {"_id": 0, "password_hash": 0})
    snapshot = build_buyer_snapshot(buyer) if buyer else {}

    now = datetime.now(timezone.utc).isoformat()
    process_id = f"proc_{uuid.uuid4().hex[:12]}"

    doc = {
        "process_id": process_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "seller_id": deal.get("owner_id"),
        "state": "NDA_SIGNED",
        "sub_states": {
            "interest": None, "meeting": None, "qa": None,
            "dataroom": None, "documents": None, "exclusivity": None,
            "preliminary_offer": None, "formal_loi": None,
            "due_diligence": None, "closing": None,
        },
        "buyer_profile_snapshot": snapshot,
        "timeline": [{"event": "NDA_SIGNED", "at": now, "by": buyer_id}],
        "permissions": {
            "dataroom_folders": [],
            "can_submit_offer": True,
            "can_request_exclusivity": True,
        },
        "created_at": now,
        "updated_at": now,
    }
    await db.deal_processes.insert_one(doc)

    # Create index
    await db.deal_processes.create_index([("deal_id", 1), ("buyer_id", 1)], unique=True)

    return {k: v for k, v in doc.items() if k != "_id"}


async def get_process(deal_id: str, buyer_id: str) -> dict:
    """Get current process state."""
    proc = await db.deal_processes.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0}
    )
    if not proc:
        # Auto-init if NDA exists
        nda = await db.nda_signatures.find_one(
            {"deal_id": deal_id, "buyer_user_id": buyer_id, "status": "signed"}, {"_id": 0}
        )
        if nda:
            proc = await init_process(deal_id, buyer_id)
    return proc


async def execute_action(deal_id: str, actor_id: str, actor_role: str, action: str, payload: dict) -> dict:
    """Main entry point — routes actions to the right subagent."""
    proc = await get_process(deal_id, actor_id if actor_role == "buyer" else None)
    if not proc and actor_role != "seller":
        return {"error": "Proceso no encontrado. Firma el NDA primero."}

    now = datetime.now(timezone.utc).isoformat()
    result = {}

    # ── Buyer actions ──
    if action == "submit_interest":
        validation = await validate_buyer_action(actor_id, "show_interest")
        if not validation["ok"]:
            return {"error": validation["message"], "detail": validation}

        result = await submit_interest(proc["process_id"], deal_id, actor_id, payload)
        await _update_state(proc["process_id"], "INTEREST_SUBMITTED", "interest", "submitted", actor_id, now, payload)
        await _notify(proc["seller_id"], "INTEREST_RECEIVED", deal_id, f"Nuevo interes recibido de {proc['buyer_profile_snapshot'].get('entity_name', 'un comprador')}.")

    elif action == "request_meeting":
        validation = await validate_buyer_action(actor_id, "request_meeting")
        if not validation["ok"]:
            return {"error": validation["message"], "detail": validation}

        meeting = await request_meeting(proc["process_id"], deal_id, actor_id, payload)
        meeting_doc = await db.meetings.find_one({"meeting_id": meeting["meeting_id"]})
        if meeting_doc:
            await db.meetings.update_one({"meeting_id": meeting["meeting_id"]}, {"$set": {"seller_id": proc["seller_id"]}})
        await _update_state(proc["process_id"], None, "meeting", "proposed", actor_id, now, {"meeting_id": meeting["meeting_id"]})
        await _notify(proc["seller_id"], "MEETING_REQUESTED", deal_id, "Un comprador ha solicitado una reunion.")

        result = meeting

    # ── Seller actions ──
    elif action == "respond_interest":
        proc = await db.deal_processes.find_one({"deal_id": deal_id, "seller_id": actor_id}, {"_id": 0})
        if not proc:
            return {"error": "Proceso no encontrado"}

        interest_id = payload.get("interest_id")
        resp = await respond_to_interest(interest_id, actor_id, payload)
        if not resp:
            return {"error": "Interes no encontrado"}

        new_main = {"accept": "INTEREST_ACCEPTED", "reject": "INTEREST_REJECTED", "respond": "INTEREST_RESPONDED"}.get(payload.get("action"))
        await _update_state(proc["process_id"], new_main, "interest", resp["status"], actor_id, now, payload)
        await _notify(proc["buyer_id"], f"INTEREST_{payload.get('action','').upper()}", deal_id, f"El vendedor ha respondido a tu expresion de interes.")

        result = resp

    elif action == "respond_meeting":
        proc = await db.deal_processes.find_one({"deal_id": deal_id, "seller_id": actor_id}, {"_id": 0})
        if not proc:
            return {"error": "Proceso no encontrado"}

        meeting_id = payload.get("meeting_id")
        resp = await respond_to_meeting(meeting_id, actor_id, "seller", payload)
        if not resp:
            return {"error": "Reunion no encontrada"}

        await _update_state(proc["process_id"], None, "meeting", resp["status"], actor_id, now, payload)

        if resp["status"] == "rejected":
            await _notify(proc["buyer_id"], "MEETING_REJECTED", deal_id, f"El vendedor ha declinado la reunion. Motivo: {payload.get('rejection_reason', '')}")
        else:
            await _notify(proc["buyer_id"], "MEETING_UPDATED", deal_id, "El vendedor ha respondido a tu solicitud de reunion.")

        result = resp

    elif action == "confirm_meeting":
        # Only ARROBA/admin
        meeting_id = payload.get("meeting_id")
        confirmed_slot = payload.get("confirmed_slot")
        resp = await confirm_meeting(meeting_id, confirmed_slot)
        if not resp:
            return {"error": "Reunion no encontrada"}

        # Find process by meeting
        meeting = await db.meetings.find_one({"meeting_id": meeting_id}, {"_id": 0})
        if meeting:
            proc = await db.deal_processes.find_one({"process_id": meeting["process_id"]}, {"_id": 0})
            if proc:
                await _update_state(proc["process_id"], "MEETING_CONFIRMED", "meeting", "confirmed", "arroba", now, payload)
                await _notify(proc["buyer_id"], "MEETING_CONFIRMED", proc["deal_id"], f"Reunion confirmada por ARROBA.")
                await _notify(proc["seller_id"], "MEETING_CONFIRMED", proc["deal_id"], f"Reunion confirmada por ARROBA.")

        result = resp

    # ── Buyer: DataRoom request ──
    elif action == "request_dataroom":
        validation = await validate_buyer_action(actor_id, "request_dataroom")
        if not validation["ok"]:
            return {"error": validation["message"], "detail": validation}

        result = await request_dataroom_access(proc["process_id"], deal_id, actor_id, payload)
        await _update_state(proc["process_id"], "DATA_ROOM_REQUESTED", "dataroom", "requested", actor_id, now, {"request_id": result.get("request_id")})
        await _notify(proc["seller_id"], "DATAROOM_REQUESTED", deal_id, "Un comprador ha solicitado acceso al Data Room.")

    # ── Buyer: Document request ──
    elif action == "request_document":
        validation = await validate_buyer_action(actor_id, "request_document")
        if not validation["ok"]:
            return {"error": validation["message"], "detail": validation}

        result = await request_document(proc["process_id"], deal_id, actor_id, payload)
        await _update_state(proc["process_id"], None, "documents", "requested", actor_id, now, {"request_id": result.get("request_id"), "category": payload.get("category")})
        await _notify(proc["seller_id"], "DOCUMENT_REQUESTED", deal_id, f"Solicitud de documento: {payload.get('category', '')} — {payload.get('description', '')[:60]}")

    # ── Buyer: Exclusivity request ──
    elif action == "request_exclusivity":
        validation = await validate_buyer_action(actor_id, "request_exclusivity")
        if not validation["ok"]:
            return {"error": validation["message"], "detail": validation}

        result = await request_exclusivity(proc["process_id"], deal_id, actor_id, payload)
        await _update_state(proc["process_id"], "EXCLUSIVITY_REQUESTED", "exclusivity", "requested", actor_id, now, {"period_days": payload.get("period_days")})
        await _notify(proc["seller_id"], "EXCLUSIVITY_REQUESTED", deal_id, f"Un comprador solicita exclusividad de {payload.get('period_days', 30)} dias.")

    # ── Seller: Respond DataRoom ──
    elif action == "respond_dataroom":
        proc = await db.deal_processes.find_one({"deal_id": deal_id, "seller_id": actor_id}, {"_id": 0})
        if not proc:
            return {"error": "Proceso no encontrado"}

        request_id = payload.get("request_id")
        resp = await respond_dataroom_request(request_id, actor_id, payload)
        if not resp:
            return {"error": "Solicitud no encontrada"}

        new_main = "DATA_ROOM_PARTIALLY_GRANTED" if resp["status"] == "partially_granted" else None
        await _update_state(proc["process_id"], new_main, "dataroom", resp["status"], actor_id, now, payload)
        await _notify(proc["buyer_id"], f"DATAROOM_{payload.get('action','').upper()}", deal_id, "El vendedor ha respondido a tu solicitud de Data Room.")
        result = resp

    # ── Seller: Respond Document ──
    elif action == "respond_document":
        proc = await db.deal_processes.find_one({"deal_id": deal_id, "seller_id": actor_id}, {"_id": 0})
        if not proc:
            return {"error": "Proceso no encontrado"}

        request_id = payload.get("request_id")
        resp = await respond_document_request(request_id, actor_id, payload)
        if not resp:
            return {"error": "Solicitud no encontrada"}

        await _update_state(proc["process_id"], None, "documents", resp["status"], actor_id, now, payload)
        status_msg = {"preparing": "en preparacion", "sent": "enviado", "rejected": "rechazado"}.get(resp["status"], resp["status"])
        await _notify(proc["buyer_id"], f"DOCUMENT_{resp['status'].upper()}", deal_id, f"Tu solicitud de documento esta {status_msg}.")
        result = resp

    # ── Seller: Respond Exclusivity ──
    elif action == "respond_exclusivity":
        proc = await db.deal_processes.find_one({"deal_id": deal_id, "seller_id": actor_id}, {"_id": 0})
        if not proc:
            return {"error": "Proceso no encontrado"}

        excl_id = payload.get("exclusivity_id")
        resp = await respond_exclusivity(excl_id, actor_id, payload)
        if not resp:
            return {"error": "Solicitud no encontrada"}

        new_main = {"granted": "EXCLUSIVITY_GRANTED", "countered": "EXCLUSIVITY_COUNTERED", "rejected": "EXCLUSIVITY_REJECTED"}.get(resp["status"])
        await _update_state(proc["process_id"], new_main, "exclusivity", resp["status"], actor_id, now, payload)

        if resp["status"] == "granted":
            await _notify(proc["buyer_id"], "EXCLUSIVITY_GRANTED", deal_id, "El vendedor ha concedido exclusividad.")
        elif resp["status"] == "countered":
            await _notify(proc["buyer_id"], "EXCLUSIVITY_COUNTERED", deal_id, f"El vendedor propone un plazo alternativo de {payload.get('counter_period_days')} dias.")
        result = resp

    # ── Buyer: Respond to exclusivity counter ──
    elif action == "respond_exclusivity_counter":
        excl_id = payload.get("exclusivity_id")
        resp = await respond_counter(excl_id, actor_id, payload)
        if not resp:
            return {"error": "Solicitud no encontrada"}

        new_main = "EXCLUSIVITY_GRANTED" if resp["status"] == "granted" else None
        await _update_state(proc["process_id"], new_main, "exclusivity", resp["status"], actor_id, now, payload)
        result = resp

    else:
        return {"error": f"Accion no reconocida: {action}"}

    return result


async def _update_state(process_id: str, new_main_state: str | None, sub_key: str, sub_value: str, actor_id: str, now: str, data: dict = None):
    """Update process state and append normalized event to timeline."""
    update = {"updated_at": now, f"sub_states.{sub_key}": sub_value}
    if new_main_state:
        update["state"] = new_main_state

    event_type = new_main_state or f"{sub_key}_{sub_value}".upper()

    # Determine actor role
    user = await db.users.find_one({"user_id": actor_id}, {"_id": 0, "role": 1})
    actor_role = (user or {}).get("role", "system")
    if actor_id == "arroba":
        actor_role = "arroba"

    event = {
        "event": event_type,
        "status": sub_value,
        "actor_id": actor_id,
        "actor_role": actor_role,
        "at": now,
        "by": actor_id,
        "metadata": {k: str(v)[:200] for k, v in (data or {}).items() if k not in ("_id",)} if data else None,
    }

    await db.deal_processes.update_one(
        {"process_id": process_id},
        {"$set": update, "$push": {"timeline": event}}
    )


async def _notify(user_id: str, event_type: str, deal_id: str, message: str):
    """Emit notification."""
    now = datetime.now(timezone.utc).isoformat()
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "type": event_type,
        "title": event_type.replace("_", " ").title(),
        "message": message,
        "data": {"deal_id": deal_id},
        "read": False,
        "created_at": now,
    })
