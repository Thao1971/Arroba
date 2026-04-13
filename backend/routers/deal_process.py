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

        if pending_interests > 0:
            actions.append({"key": "respond_interest", "label": f"Responder interes ({pending_interests})", "microcopy": "Tienes expresiones de interes pendientes de respuesta."})
        if pending_meetings > 0:
            actions.append({"key": "respond_meeting", "label": f"Responder reunion ({pending_meetings})", "microcopy": "Tienes solicitudes de reunion pendientes."})
        if pending_dr > 0:
            actions.append({"key": "respond_dataroom", "label": f"Responder Data Room ({pending_dr})", "microcopy": "Solicitudes de acceso al Data Room pendientes. Tu seleccionas las carpetas."})
        if pending_docs > 0:
            actions.append({"key": "respond_document", "label": f"Responder documentos ({pending_docs})", "microcopy": "Solicitudes de documentos concretos pendientes."})
        if pending_excl > 0:
            actions.append({"key": "respond_exclusivity", "label": f"Responder exclusividad ({pending_excl})", "microcopy": "Solicitud de exclusividad pendiente. Puedes aceptar, rechazar o contraofertar plazo."})

    return {"actions": actions, "state": state, "sub_states": proc.get("sub_states")}
