"""
Deal Process Router — Unified entry point for the agentic deal flow.
"""
from fastapi import APIRouter, HTTPException, Depends
from database import db
from routers.auth import get_current_user
from models.user import UserResponse
from services.deal_process.orchestrator import init_process, get_process, execute_action
from services.deal_process.buyer_agent import build_buyer_snapshot

router = APIRouter(prefix="/deal-process", tags=["Deal Process"])


@router.post("/{deal_id}/init")
async def api_init_process(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Initialize deal process after NDA."""
    if user.role not in ("buyer", "admin"):
        raise HTTPException(403, "Solo buyers")
    result = await init_process(deal_id, user.user_id)
    if not result:
        raise HTTPException(404, "Deal no encontrado")
    return result


@router.get("/{deal_id}")
async def api_get_process(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Get current process state for this buyer-deal."""
    buyer_id = user.user_id if user.role == "buyer" else None

    if user.role == "seller":
        # Seller views a specific buyer's process
        proc = await db.deal_processes.find_one(
            {"deal_id": deal_id, "seller_id": user.user_id}, {"_id": 0}
        )
        if proc:
            return proc
        # Try to find any process for this deal owned by seller
        procs = await db.deal_processes.find(
            {"deal_id": deal_id, "seller_id": user.user_id}, {"_id": 0}
        ).to_list(50)
        return {"processes": procs}

    proc = await get_process(deal_id, buyer_id)
    if not proc:
        raise HTTPException(404, "Proceso no encontrado. Firma el NDA primero.")
    return proc


@router.get("/{deal_id}/timeline")
async def api_get_timeline(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Get timeline of events for this process."""
    proc = await get_process(deal_id, user.user_id)
    if not proc:
        raise HTTPException(404, "Proceso no encontrado")
    return {"timeline": proc.get("timeline", []), "state": proc.get("state")}


# ═══ Buyer actions ═══

@router.post("/{deal_id}/interest")
async def api_submit_interest(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Buyer submits interest expression."""
    if user.role != "buyer":
        raise HTTPException(403, "Solo buyers")
    result = await execute_action(deal_id, user.user_id, "buyer", "submit_interest", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/{deal_id}/meeting")
async def api_request_meeting(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Buyer requests a meeting."""
    if user.role != "buyer":
        raise HTTPException(403, "Solo buyers")
    result = await execute_action(deal_id, user.user_id, "buyer", "request_meeting", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


# ═══ Seller responses ═══

@router.post("/{deal_id}/interest/{interest_id}/respond")
async def api_respond_interest(deal_id: str, interest_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Seller responds to interest."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers")
    data["interest_id"] = interest_id
    result = await execute_action(deal_id, user.user_id, "seller", "respond_interest", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/{deal_id}/meeting/{meeting_id}/respond")
async def api_respond_meeting(deal_id: str, meeting_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Seller responds to meeting request."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers")
    data["meeting_id"] = meeting_id
    result = await execute_action(deal_id, user.user_id, "seller", "respond_meeting", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/{deal_id}/meeting/{meeting_id}/confirm")
async def api_confirm_meeting(deal_id: str, meeting_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """ARROBA confirms meeting."""
    if user.role != "admin":
        raise HTTPException(403, "Solo ARROBA/admin")
    data["meeting_id"] = meeting_id
    result = await execute_action(deal_id, user.user_id, "admin", "confirm_meeting", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


# ═══ DataRoom access ═══

@router.post("/{deal_id}/dataroom-request")
async def api_request_dataroom(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Buyer requests Data Room access."""
    if user.role != "buyer":
        raise HTTPException(403, "Solo buyers")
    result = await execute_action(deal_id, user.user_id, "buyer", "request_dataroom", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/{deal_id}/dataroom-request/{request_id}/respond")
async def api_respond_dataroom(deal_id: str, request_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Seller responds to Data Room request."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers")
    data["request_id"] = request_id
    result = await execute_action(deal_id, user.user_id, "seller", "respond_dataroom", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


# ═══ Document requests ═══

@router.post("/{deal_id}/document-request")
async def api_request_document(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Buyer requests a specific document."""
    if user.role != "buyer":
        raise HTTPException(403, "Solo buyers")
    result = await execute_action(deal_id, user.user_id, "buyer", "request_document", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/{deal_id}/document-request/{request_id}/respond")
async def api_respond_document(deal_id: str, request_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Seller responds to document request."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers")
    data["request_id"] = request_id
    result = await execute_action(deal_id, user.user_id, "seller", "respond_document", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


# ═══ Exclusivity ═══

@router.post("/{deal_id}/exclusivity")
async def api_request_exclusivity(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Buyer requests exclusivity."""
    if user.role != "buyer":
        raise HTTPException(403, "Solo buyers")
    result = await execute_action(deal_id, user.user_id, "buyer", "request_exclusivity", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/{deal_id}/exclusivity/{excl_id}/respond")
async def api_respond_exclusivity(deal_id: str, excl_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Seller responds to exclusivity request."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers")
    data["exclusivity_id"] = excl_id
    result = await execute_action(deal_id, user.user_id, "seller", "respond_exclusivity", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/{deal_id}/exclusivity/{excl_id}/counter-respond")
async def api_counter_respond_exclusivity(deal_id: str, excl_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Buyer responds to seller's exclusivity counter-offer."""
    if user.role != "buyer":
        raise HTTPException(403, "Solo buyers")
    data["exclusivity_id"] = excl_id
    result = await execute_action(deal_id, user.user_id, "buyer", "respond_exclusivity_counter", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result



# ═══ Preliminary Offers ═══

@router.post("/{deal_id}/preliminary-offer")
async def api_submit_offer(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Buyer submits preliminary offer."""
    if user.role != "buyer":
        raise HTTPException(403, "Solo buyers")
    result = await execute_action(deal_id, user.user_id, "buyer", "submit_offer", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/{deal_id}/preliminary-offer/{offer_id}/respond")
async def api_respond_offer(deal_id: str, offer_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Seller responds to preliminary offer."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers")
    data["offer_id"] = offer_id
    result = await execute_action(deal_id, user.user_id, "seller", "respond_offer", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.get("/{deal_id}/offers")
async def api_list_offers(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """List all preliminary offers for a deal."""
    from services.deal_process.preliminary_offer_agent import list_offers
    return await list_offers(deal_id)

# ═══ Data views ═══

@router.get("/{deal_id}/buyer-profile")
async def api_get_buyer_profile(deal_id: str, buyer_id: str = None, user: UserResponse = Depends(get_current_user)):
    """Get buyer profile snapshot (seller/admin view)."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers/admin")

    query = {"deal_id": deal_id, "seller_id": user.user_id}
    if buyer_id:
        query["buyer_id"] = buyer_id

    proc = await db.deal_processes.find_one(query, {"_id": 0, "buyer_profile_snapshot": 1, "buyer_id": 1, "state": 1})
    if not proc:
        raise HTTPException(404, "Proceso no encontrado")
    return {"buyer_id": proc.get("buyer_id"), "state": proc.get("state"), "profile": proc.get("buyer_profile_snapshot")}


@router.get("/{deal_id}/interests")
async def api_list_interests(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """List all interest expressions for a deal."""
    cursor = db.interest_expressions.find({"deal_id": deal_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(50)


@router.get("/{deal_id}/meetings")
async def api_list_meetings(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """List all meetings for a deal."""
    cursor = db.meetings.find({"deal_id": deal_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(50)


# ═══ Available actions ═══

@router.get("/{deal_id}/available-actions")
async def api_get_available_actions(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Get available actions for current user on this deal process."""
    proc = None
    if user.role == "buyer":
        proc = await get_process(deal_id, user.user_id)
    elif user.role in ("seller", "admin"):
        # Seller sees aggregated pending items across all buyers
        proc = await db.deal_processes.find_one({"deal_id": deal_id, "seller_id": user.user_id}, {"_id": 0})
    if not proc:
        return {"actions": [], "state": None}

    state = proc.get("state", "NDA_SIGNED")
    role = user.role

    actions = []
    if role == "buyer":
        if state in ("NDA_SIGNED", "INTEREST_RESPONDED"):
            actions.append({"key": "submit_interest", "label": "Expresar interes", "microcopy": "El vendedor recibira tu expresion de interes y podra aceptar, responder o declinar."})
        if state in ("NDA_SIGNED", "INTEREST_ACCEPTED", "MEETING_CONFIRMED"):
            actions.append({"key": "request_meeting", "label": "Solicitar reunion", "microcopy": "Las reuniones siempre incluyen buyer, seller y un representante de ARROBA."})
        if state in ("INTEREST_ACCEPTED", "MEETING_CONFIRMED"):
            actions.append({"key": "request_dataroom", "label": "Solicitar acceso al Data Room", "microcopy": "Esta solicitud no abre automaticamente todo el Data Room. El vendedor seleccionara las carpetas."})
            actions.append({"key": "request_document", "label": "Solicitar documento", "microcopy": "Describe el documento que necesitas. El vendedor podra enviartelo o anadirlo al Data Room."})
            actions.append({"key": "request_exclusivity", "label": "Solicitar exclusividad", "microcopy": "La exclusividad bloqueara otras acciones competitivas hasta la fecha indicada."})
            actions.append({"key": "submit_offer", "label": "Enviar oferta preliminar", "microcopy": "Presenta una oferta estructurada al vendedor con valoracion, estructura de pago y condiciones."})

    elif role == "seller":
        pending_interests = await db.interest_expressions.count_documents({"deal_id": deal_id, "status": "submitted"})
        pending_meetings = await db.meetings.count_documents({"deal_id": deal_id, "status": "proposed"})
        pending_dr = await db.dataroom_requests.count_documents({"deal_id": deal_id, "status": "requested"})
        pending_docs = await db.document_requests.count_documents({"deal_id": deal_id, "status": "requested"})
        pending_excl = await db.exclusivity_requests.count_documents({"deal_id": deal_id, "status": "requested"})
        pending_offers = await db.preliminary_offers.count_documents({"deal_id": deal_id, "status": "submitted"})

        if pending_excl > 0:
            actions.append({"key": "respond_exclusivity", "label": f"Responder exclusividad ({pending_excl})", "microcopy": "Solicitud de exclusividad pendiente. Puedes aceptar, rechazar o contraofertar plazo."})
        if pending_offers > 0:
            actions.append({"key": "respond_offer", "label": f"Responder oferta ({pending_offers})", "microcopy": "Tienes una oferta preliminar pendiente. Puedes aceptar, rechazar o invitar a LOI formal."})
        if pending_interests > 0:
            actions.append({"key": "respond_interest", "label": f"Responder interes ({pending_interests})", "microcopy": "Tienes expresiones de interes pendientes de respuesta."})
        if pending_meetings > 0:
            actions.append({"key": "respond_meeting", "label": f"Responder reunion ({pending_meetings})", "microcopy": "Tienes solicitudes de reunion pendientes."})
        if pending_dr > 0:
            actions.append({"key": "respond_dataroom", "label": f"Responder Data Room ({pending_dr})", "microcopy": "Solicitudes de acceso al Data Room pendientes."})
        if pending_docs > 0:
            actions.append({"key": "respond_document", "label": f"Responder documentos ({pending_docs})", "microcopy": "Solicitudes de documentos concretos pendientes."})

    return {"actions": actions, "state": state, "sub_states": proc.get("sub_states")}


@router.get("/{deal_id}/seller-dashboard")
async def api_seller_dashboard(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Seller-oriented dashboard for a deal's negotiation processes."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers")

    # Get all processes for this deal
    procs = await db.deal_processes.find({"deal_id": deal_id, "seller_id": user.user_id}, {"_id": 0}).to_list(50)

    # Pending decisions grouped by type
    pending = []

    interests = await db.interest_expressions.find({"deal_id": deal_id, "status": "submitted"}, {"_id": 0}).to_list(50)
    for i in interests:
        buyer = await db.users.find_one({"user_id": i["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "email": 1})
        pending.append({
            "type": "interest", "id": i["interest_id"],
            "buyer_name": f"{(buyer or {}).get('first_name','')} {(buyer or {}).get('last_name','')}".strip(),
            "buyer_id": i["buyer_id"],
            "interest_type": i.get("interest_type"),
            "message": i.get("message"),
            "created_at": i.get("created_at"),
            "actions": ["accept", "reject", "respond"],
        })

    meetings = await db.meetings.find({"deal_id": deal_id, "status": {"$in": ["proposed", "slot_accepted"]}}, {"_id": 0}).to_list(50)
    for m in meetings:
        buyer = await db.users.find_one({"user_id": m["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        pending.append({
            "type": "meeting", "id": m["meeting_id"],
            "buyer_name": f"{(buyer or {}).get('first_name','')} {(buyer or {}).get('last_name','')}".strip(),
            "buyer_id": m["buyer_id"],
            "purpose": m.get("purpose"),
            "slots_count": len(m.get("proposed_slots", [])),
            "message": m.get("message"),
            "created_at": m.get("created_at"),
            "actions": ["accept_slot", "counter_propose", "reject"],
        })

    dr_requests = await db.dataroom_requests.find({"deal_id": deal_id, "status": "requested"}, {"_id": 0}).to_list(50)
    for dr in dr_requests:
        buyer = await db.users.find_one({"user_id": dr["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        pending.append({
            "type": "dataroom", "id": dr["request_id"],
            "buyer_name": f"{(buyer or {}).get('first_name','')} {(buyer or {}).get('last_name','')}".strip(),
            "buyer_id": dr["buyer_id"],
            "message": dr.get("message"),
            "created_at": dr.get("created_at"),
            "actions": ["approve", "reject", "info_requested"],
        })

    doc_requests = await db.document_requests.find({"deal_id": deal_id, "status": "requested"}, {"_id": 0}).to_list(50)
    for doc in doc_requests:
        buyer = await db.users.find_one({"user_id": doc["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        pending.append({
            "type": "document", "id": doc["request_id"],
            "buyer_name": f"{(buyer or {}).get('first_name','')} {(buyer or {}).get('last_name','')}".strip(),
            "buyer_id": doc["buyer_id"],
            "category": doc.get("category"),
            "description": doc.get("description"),
            "created_at": doc.get("created_at"),
            "actions": ["confirm", "reject", "info_requested"],
        })

    excl_requests = await db.exclusivity_requests.find({"deal_id": deal_id, "status": "requested"}, {"_id": 0}).to_list(50)
    for ex in excl_requests:
        buyer = await db.users.find_one({"user_id": ex["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        pending.append({
            "type": "exclusivity", "id": ex["exclusivity_id"],
            "buyer_name": f"{(buyer or {}).get('first_name','')} {(buyer or {}).get('last_name','')}".strip(),
            "buyer_id": ex["buyer_id"],
            "period_days": ex.get("requested_period_days"),
            "rationale": ex.get("rationale"),
            "created_at": ex.get("created_at"),
            "actions": ["grant", "reject", "counter", "info_requested"],
        })


    offer_requests = await db.preliminary_offers.find({"deal_id": deal_id, "status": "submitted"}, {"_id": 0}).to_list(50)
    for off in offer_requests:
        buyer = await db.users.find_one({"user_id": off["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        pending.append({
            "type": "offer", "id": off["offer_id"],
            "buyer_name": f"{(buyer or {}).get('first_name','')} {(buyer or {}).get('last_name','')}".strip(),
            "buyer_id": off["buyer_id"],
            "enterprise_value": off.get("enterprise_value"),
            "operation_type": off.get("operation_type"),
            "commitment_level": off.get("commitment_level"),
            "executive_summary": off.get("executive_summary", "")[:100],
            "completeness": off.get("completeness_score"),
            "created_at": off.get("created_at"),
            "actions": ["accept", "reject", "info_requested", "invite_loi"],
        })

    # In-progress items
    in_progress = []
    responded_interests = await db.interest_expressions.find({"deal_id": deal_id, "status": {"$in": ["accepted", "responded"]}}, {"_id": 0}).to_list(20)
    for i in responded_interests:
        in_progress.append({"type": "interest", "id": i["interest_id"], "status": i["status"], "buyer_id": i["buyer_id"]})

    confirmed_meetings = await db.meetings.find({"deal_id": deal_id, "status": "confirmed"}, {"_id": 0, "meeting_id": 1, "confirmed_slot": 1}).to_list(20)
    for m in confirmed_meetings:
        in_progress.append({"type": "meeting", "id": m["meeting_id"], "status": "confirmed", "slot": m.get("confirmed_slot")})

    # Timeline (aggregated from all processes)
    timeline = []
    for p in procs:
        for ev in p.get("timeline", []):
            timeline.append({**ev, "buyer_id": p["buyer_id"]})
    timeline.sort(key=lambda x: x.get("at", ""), reverse=True)

    # Sort pending by criticality: exclusivity > offer > meeting > dataroom > document > interest
    type_order = {"exclusivity": 0, "offer": 1, "meeting": 2, "dataroom": 3, "document": 4, "interest": 5}
    pending.sort(key=lambda x: type_order.get(x["type"], 9))

    return {
        "deal_id": deal_id,
        "process_count": len(procs),
        "pending_decisions": pending,
        "pending_count": len(pending),
        "in_progress": in_progress,
        "timeline": timeline[:30],
    }
