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


# Static routes MUST come before /{deal_id} to avoid being caught by the catch-all
@router.get("/my-process-tree")
async def api_my_process_tree_static(user: UserResponse = Depends(get_current_user)):
    """Redirect to the actual implementation."""
    from services.deal_process.orchestrator import get_process
    # Inline implementation to avoid circular routing
    role = user.role
    uid = user.user_id
    tree = []
    if role == "buyer":
        procs = await db.deal_processes.find({"buyer_id": uid}, {"_id": 0, "deal_id": 1, "state": 1}).to_list(20)
        for p in procs:
            deal = await db.deals.find_one({"deal_id": p["deal_id"]}, {"_id": 0, "teaser.headline": 1, "company_id": 1})
            comp = await db.companies.find_one({"company_id": (deal or {}).get("company_id")}, {"_id": 0, "trade_name": 1}) if deal else None
            nda = await db.nda_signatures.find_one({"deal_id": p["deal_id"], "buyer_user_id": uid, "status": "signed"})
            ints = await db.interest_expressions.find({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1}).to_list(5)
            offs = await db.preliminary_offers.find({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1}).to_list(5)
            lois_d = await db.formal_lois.find({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1}).to_list(5)
            dd = await db.dd_checklists.find_one({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1})
            def ps(h, c): return "completed" if c else ("current" if h else "pending")
            tree.append({
                "deal_id": p["deal_id"],
                "company_name": (comp or {}).get("trade_name") or (deal or {}).get("teaser", {}).get("headline", "Deal"),
                "state": p["state"],
                "phases": {
                    "nda": "completed" if nda else "pending",
                    "interes": ps(len(ints)>0, any(i["status"]=="accepted" for i in ints)),
                    "reunion": "pending", "dataroom": "pending",
                    "oferta": ps(len(offs)>0, any(o["status"] in ("accepted","upgraded_to_loi") for o in offs)),
                    "loi": ps(len(lois_d)>0, any(l["status"]=="accepted" for l in lois_d)),
                    "exclusividad": "pending",
                    "dd": ps(bool(dd), dd and dd.get("status")=="completada"),
                    "closing": "pending",
                },
            })
    elif role in ("seller", "advisor"):
        deals = await db.deals.find({"owner_id": uid, "status": {"$in": ["published", "exclusivity"]}}, {"_id": 0, "deal_id": 1, "teaser.headline": 1, "company_id": 1}).to_list(20)
        for d in deals:
            comp = await db.companies.find_one({"company_id": d.get("company_id")}, {"_id": 0, "trade_name": 1})
            tree.append({
                "deal_id": d["deal_id"],
                "company_name": (comp or {}).get("trade_name") or d.get("teaser", {}).get("headline", "Deal"),
                "state": "active",
                "phases": {"nda": "current", "interes": "pending", "reunion": "pending", "dataroom": "pending", "oferta": "pending", "loi": "pending", "exclusividad": "pending", "dd": "pending", "closing": "pending"},
            })
    return tree


@router.get("/buyer-phase/{deal_id}/{phase}")
async def api_buyer_phase_detail(deal_id: str, phase: str, user: UserResponse = Depends(get_current_user)):
    """Get detailed data for a specific phase from buyer perspective."""
    if user.role not in ("buyer", "admin"):
        raise HTTPException(403, "Solo buyers")
    uid = user.user_id

    if phase == "nda":
        nda = await db.nda_signatures.find_one({"deal_id": deal_id, "buyer_user_id": uid, "status": "signed"}, {"_id": 0, "signed_at": 1, "signature_id": 1})
        return {"phase": "nda", "status": "firmado" if nda else "pendiente", "signed_at": nda.get("signed_at") if nda else None, "unlocks": "Ficha completa + infomemo", "cta": "Descargar NDA" if nda else "Firmar NDA"}

    elif phase == "interes":
        ints = await db.interest_expressions.find({"deal_id": deal_id, "buyer_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(5)
        latest = ints[0] if ints else None
        return {"phase": "interes", "expressions": ints, "latest_status": latest.get("status") if latest else None, "cta": "Ver estado" if latest else "Enviar expresión de interés"}

    elif phase == "reunion":
        mtgs = await db.meetings.find({"deal_id": deal_id, "buyer_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(5)
        latest = mtgs[0] if mtgs else None
        return {"phase": "reunion", "meetings": mtgs, "latest_status": latest.get("status") if latest else None, "cta": "Ver detalles" if latest else "Solicitar reunión"}

    elif phase == "dataroom":
        drs = await db.dataroom_requests.find({"deal_id": deal_id, "buyer_id": uid}, {"_id": 0}).to_list(5)
        proc = await db.deal_processes.find_one({"deal_id": deal_id, "buyer_id": uid}, {"_id": 0, "permissions": 1})
        folders = (proc or {}).get("permissions", {}).get("dataroom_folders", [])
        return {"phase": "dataroom", "requests": drs, "granted_folders": folders, "cta": "Explorar Data Room" if folders else "Solicitar acceso"}

    elif phase == "oferta":
        offs = await db.preliminary_offers.find({"deal_id": deal_id, "buyer_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(5)
        latest = offs[0] if offs else None
        return {"phase": "oferta", "offers": offs, "latest_status": latest.get("status") if latest else None, "latest_ev": latest.get("enterprise_value") if latest else None, "cta": "Ver oferta" if latest else "Enviar oferta indicativa"}

    elif phase == "loi":
        lois = await db.formal_lois.find({"deal_id": deal_id, "buyer_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(5)
        latest = lois[0] if lois else None
        return {"phase": "loi", "lois": lois, "latest_status": latest.get("status") if latest else None, "cta": "Ver LOI" if latest else "Formalizar LOI"}

    elif phase == "exclusividad":
        excls = await db.exclusivity_requests.find({"deal_id": deal_id, "buyer_id": uid}, {"_id": 0}).to_list(5)
        granted = next((e for e in excls if e.get("status") == "granted"), None)
        return {"phase": "exclusividad", "requests": excls, "granted": bool(granted), "end_date": granted.get("granted_end") if granted else None, "cta": "Ver estado" if excls else "Solicitar exclusividad"}

    elif phase == "dd":
        dd = await db.dd_checklists.find_one({"deal_id": deal_id, "buyer_id": uid}, {"_id": 0, "status": 1, "completion_pct": 1, "sections": 1})
        if dd:
            section_summary = [{"name": s["name"], "status": s["status"], "total": len(s["items"]), "resolved": sum(1 for i in s["items"] if i["status"]=="resuelto")} for s in dd.get("sections", [])]
            return {"phase": "dd", "status": dd.get("status"), "completion_pct": dd.get("completion_pct"), "sections": section_summary, "cta": "Ver checklist"}
        return {"phase": "dd", "status": "no_iniciada", "cta": "Pendiente de iniciar por el vendedor"}

    elif phase == "closing":
        cls = await db.closing_records.find_one({"deal_id": deal_id, "buyer_id": uid}, {"_id": 0})
        return {"phase": "closing", "status": cls.get("status") if cls else "no_iniciado", "data": cls, "cta": "Ver estado del cierre" if cls else "Pendiente"}

    return {"phase": phase, "status": "sin_datos"}


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


# ═══ Formal LOI ═══

@router.post("/{deal_id}/loi/formalize")
async def api_formalize_loi(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Buyer formalizes LOI (optionally precloaded from offer)."""
    if user.role != "buyer":
        raise HTTPException(403, "Solo buyers")
    result = await execute_action(deal_id, user.user_id, "buyer", "formalize_loi", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/{deal_id}/loi/{loi_id}/respond")
async def api_respond_loi(deal_id: str, loi_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Seller responds to LOI."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers")
    data["loi_id"] = loi_id
    result = await execute_action(deal_id, user.user_id, "seller", "respond_loi", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/{deal_id}/loi/{loi_id}/counter-respond")
async def api_counter_respond_loi(deal_id: str, loi_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Buyer responds to seller's counter-offer on LOI."""
    if user.role != "buyer":
        raise HTTPException(403, "Solo buyers")
    data["loi_id"] = loi_id
    result = await execute_action(deal_id, user.user_id, "buyer", "respond_loi_counter", data)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.get("/{deal_id}/lois")
async def api_list_lois(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """List all formal LOIs for a deal."""
    from services.deal_process.formal_loi_agent import list_lois
    return await list_lois(deal_id)



# ═══ Process Tree (sidebar expandable) ═══

@router.get("/my-process-tree")
async def api_my_process_tree(user: UserResponse = Depends(get_current_user)):
    """Get tree of active processes for sidebar — buyer or seller."""
    role = user.role
    uid = user.user_id

    tree = []

    if role == "buyer":
        # Find all deals where buyer has a process
        procs = await db.deal_processes.find({"buyer_id": uid}, {"_id": 0, "deal_id": 1, "state": 1, "sub_states": 1}).to_list(20)
        for p in procs:
            deal = await db.deals.find_one({"deal_id": p["deal_id"]}, {"_id": 0, "teaser.headline": 1, "company_id": 1})
            comp = await db.companies.find_one({"company_id": (deal or {}).get("company_id")}, {"_id": 0, "trade_name": 1}) if deal else None

            # Phase statuses from buyer perspective
            nda = await db.nda_signatures.find_one({"deal_id": p["deal_id"], "buyer_user_id": uid, "status": "signed"})
            ints = await db.interest_expressions.find({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1}).to_list(5)
            mtgs = await db.meetings.find({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1}).to_list(5)
            drs = await db.dataroom_requests.find({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1}).to_list(5)
            offs = await db.preliminary_offers.find({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1}).to_list(5)
            lois = await db.formal_lois.find({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1}).to_list(5)
            excls = await db.exclusivity_requests.find({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1}).to_list(5)
            dd = await db.dd_checklists.find_one({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1})
            cls = await db.closing_records.find_one({"deal_id": p["deal_id"], "buyer_id": uid}, {"_id": 0, "status": 1})

            def ps(has, completed):
                if completed: return "completed"
                if has: return "current"
                return "pending"

            phases = {
                "nda": "completed" if nda else "pending",
                "interes": ps(len(ints)>0, any(i["status"]=="accepted" for i in ints)),
                "reunion": ps(len(mtgs)>0, any(m["status"]=="confirmed" for m in mtgs)),
                "dataroom": ps(len(drs)>0, any(d["status"]=="partially_granted" for d in drs)),
                "oferta": ps(len(offs)>0, any(o["status"] in ("accepted","upgraded_to_loi") for o in offs)),
                "loi": ps(len(lois)>0, any(l["status"]=="accepted" for l in lois)),
                "exclusividad": ps(len(excls)>0, any(e["status"]=="granted" for e in excls)),
                "dd": ps(bool(dd), dd and dd.get("status")=="completada"),
                "closing": ps(bool(cls), cls and cls.get("status") in ("cerrado_exito",)),
            }

            tree.append({
                "deal_id": p["deal_id"],
                "company_name": (comp or {}).get("trade_name") or (deal or {}).get("teaser", {}).get("headline", "Deal"),
                "state": p["state"],
                "phases": phases,
            })

    elif role in ("seller", "advisor"):
        # Find all deals owned by seller
        deals = await db.deals.find({"owner_id": uid, "status": {"$in": ["published", "exclusivity"]}}, {"_id": 0, "deal_id": 1, "teaser.headline": 1, "company_id": 1}).to_list(20)
        for d in deals:
            comp = await db.companies.find_one({"company_id": d.get("company_id")}, {"_id": 0, "trade_name": 1})
            proc_count = await db.deal_processes.count_documents({"deal_id": d["deal_id"]})

            # Aggregate phase statuses across all buyers
            nda_c = await db.nda_signatures.count_documents({"deal_id": d["deal_id"], "status": "signed"})
            int_c = await db.interest_expressions.count_documents({"deal_id": d["deal_id"]})
            mtg_c = await db.meetings.count_documents({"deal_id": d["deal_id"]})
            dr_c = await db.dataroom_requests.count_documents({"deal_id": d["deal_id"]})
            off_c = await db.preliminary_offers.count_documents({"deal_id": d["deal_id"]})
            loi_c = await db.formal_lois.count_documents({"deal_id": d["deal_id"]})
            excl_c = await db.exclusivity_requests.count_documents({"deal_id": d["deal_id"]})
            dd_doc = await db.dd_checklists.find_one({"deal_id": d["deal_id"]}, {"_id": 0, "status": 1})
            cls_doc = await db.closing_records.find_one({"deal_id": d["deal_id"]}, {"_id": 0, "status": 1})

            phases = {
                "nda": "completed" if nda_c > 0 else "pending",
                "interes": "current" if int_c > 0 else "pending",
                "reunion": "current" if mtg_c > 0 else "pending",
                "dataroom": "current" if dr_c > 0 else "pending",
                "oferta": "current" if off_c > 0 else "pending",
                "loi": "current" if loi_c > 0 else "pending",
                "exclusividad": "current" if excl_c > 0 else "pending",
                "dd": dd_doc.get("status", "pending") if dd_doc else "pending",
                "closing": cls_doc.get("status", "pending") if cls_doc else "pending",
            }

            tree.append({
                "deal_id": d["deal_id"],
                "company_name": (comp or {}).get("trade_name") or d.get("teaser", {}).get("headline", "Deal"),
                "state": "active",
                "process_count": proc_count,
                "phases": phases,
            })

    return tree


# ═══ Process Summary (deterministic funnel) ═══

@router.get("/{deal_id}/process-summary")
async def api_process_summary(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Aggregated process summary with canonical funnel status per phase."""

    # Gather all real data
    nda = await db.nda_signatures.find_one({"deal_id": deal_id, "status": "signed"}, {"_id": 0, "signed_at": 1})
    interests = await db.interest_expressions.find({"deal_id": deal_id}, {"_id": 0, "status": 1, "created_at": 1}).to_list(20)
    meetings = await db.meetings.find({"deal_id": deal_id}, {"_id": 0, "status": 1, "created_at": 1}).to_list(20)
    dr_requests = await db.dataroom_requests.find({"deal_id": deal_id}, {"_id": 0, "status": 1}).to_list(20)
    offers = await db.preliminary_offers.find({"deal_id": deal_id}, {"_id": 0, "status": 1, "enterprise_value": 1, "created_at": 1}).to_list(20)
    lois = await db.formal_lois.find({"deal_id": deal_id}, {"_id": 0, "status": 1, "enterprise_value": 1, "created_at": 1}).to_list(20)
    excl = await db.exclusivity_requests.find({"deal_id": deal_id}, {"_id": 0, "status": 1}).to_list(10)
    dd = await db.dd_checklists.find_one({"deal_id": deal_id}, {"_id": 0, "status": 1, "completion_pct": 1})
    closing = await db.closing_records.find_one({"deal_id": deal_id}, {"_id": 0, "status": 1, "target_close_date": 1})

    # Build funnel phases deterministically
    def phase_status(has_data, has_completed, has_blocked=False):
        if has_blocked: return "blocked"
        if has_completed: return "completed"
        if has_data: return "current"
        return "pending"

    has_interest_accepted = any(i["status"] == "accepted" for i in interests)
    has_meeting_confirmed = any(m["status"] == "confirmed" for m in meetings)
    has_dr_granted = any(d["status"] == "partially_granted" for d in dr_requests)
    has_offer_submitted = any(o["status"] in ("submitted", "accepted", "upgraded_to_loi") for o in offers)
    has_offer_accepted = any(o["status"] in ("accepted", "upgraded_to_loi") for o in offers)
    has_loi_submitted = any(l["status"] in ("submitted", "accepted", "countered") for l in lois)
    has_loi_accepted = any(l["status"] == "accepted" for l in lois)
    has_excl_granted = any(e["status"] == "granted" for e in excl)
    dd_blocked = dd and dd.get("status") == "bloqueada"

    phases = [
        {"id": "nda", "label": "NDA", "status": "completed" if nda else "pending"},
        {"id": "interes", "label": "Interés", "status": phase_status(len(interests) > 0, has_interest_accepted)},
        {"id": "reunion", "label": "Reunión", "status": phase_status(len(meetings) > 0, has_meeting_confirmed)},
        {"id": "dataroom", "label": "Data Room", "status": phase_status(len(dr_requests) > 0, has_dr_granted)},
        {"id": "oferta", "label": "Oferta indicativa", "status": phase_status(has_offer_submitted, has_offer_accepted)},
        {"id": "loi", "label": "LOI", "status": phase_status(has_loi_submitted, has_loi_accepted)},
        {"id": "exclusividad", "label": "Exclusividad", "status": phase_status(len(excl) > 0, has_excl_granted)},
        {"id": "dd", "label": "Due Diligence", "status": phase_status(bool(dd), dd and dd.get("status") == "completada", dd_blocked)},
        {"id": "closing", "label": "Cierre", "status": phase_status(bool(closing), closing and closing.get("status") in ("cerrado_exito",))},
    ]

    # Determine current phase, last hito, next step, actor
    current = "NDA"
    last_hito = "NDA firmado" if nda else "Sin actividad"
    next_step = "Expresar interés"
    actor = "buyer"
    blocker = None

    if has_loi_accepted:
        current = "Due Diligence"
        last_hito = "LOI aceptada"
        if dd and dd.get("status") == "completada":
            current = "Cierre"
            last_hito = "DD completada"
            next_step = "Iniciar cierre"
            actor = "arroba"
        elif dd_blocked:
            next_step = "Resolver bloqueos DD"
            actor = "seller"
            blocker = "DD bloqueada"
        else:
            next_step = "Completar due diligence"
            actor = "seller"
    elif has_loi_submitted:
        current = "LOI"
        last_hito = "LOI formal enviada"
        next_step = "Seller debe responder LOI"
        actor = "seller"
    elif has_offer_accepted:
        current = "Oferta indicativa"
        last_hito = "Oferta aceptada"
        next_step = "Formalizar LOI"
        actor = "buyer"
    elif has_offer_submitted:
        current = "Oferta indicativa"
        last_hito = "Oferta enviada"
        next_step = "Seller debe responder oferta"
        actor = "seller"
    elif has_interest_accepted:
        current = "Interés aceptado"
        last_hito = "Interés aceptado"
        next_step = "Solicitar reunión, Data Room o enviar oferta"
        actor = "buyer"
    elif len(interests) > 0:
        current = "Interés"
        last_hito = "Interés enviado"
        next_step = "Seller debe responder interés"
        actor = "seller"
    elif nda:
        current = "NDA"
        last_hito = "NDA firmado"

# ═══ Buyer Process Summary (isomorphic to seller) ═══

@router.get("/{deal_id}/buyer-process-summary")
async def api_buyer_process_summary(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Buyer-perspective process summary — same structure as seller, different perspective."""
    if user.role not in ("buyer", "admin"):
        raise HTTPException(403, "Solo buyers")

    buyer_id = user.user_id

    # Same data gathering as seller
    nda = await db.nda_signatures.find_one({"deal_id": deal_id, "buyer_user_id": buyer_id, "status": "signed"}, {"_id": 0, "signed_at": 1})
    interests = await db.interest_expressions.find({"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0, "status": 1}).to_list(10)
    meetings = await db.meetings.find({"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0, "status": 1}).to_list(10)
    dr_requests = await db.dataroom_requests.find({"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0, "status": 1}).to_list(10)
    offers = await db.preliminary_offers.find({"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0, "status": 1}).to_list(10)
    lois = await db.formal_lois.find({"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0, "status": 1}).to_list(10)
    excl = await db.exclusivity_requests.find({"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0, "status": 1}).to_list(10)
    dd = await db.dd_checklists.find_one({"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0, "status": 1, "completion_pct": 1})
    closing = await db.closing_records.find_one({"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0, "status": 1})

    def ps(has_data, has_completed, has_blocked=False):
        if has_blocked: return "blocked"
        if has_completed: return "completed"
        if has_data: return "current"
        return "pending"

    has_interest_accepted = any(i["status"] == "accepted" for i in interests)
    has_offer_accepted = any(o["status"] in ("accepted", "upgraded_to_loi") for o in offers)
    has_loi_accepted = any(l["status"] == "accepted" for l in lois)
    has_excl_granted = any(e["status"] == "granted" for e in excl)

    phases = [
        {"id": "nda", "label": "NDA", "status": "completed" if nda else "pending"},
        {"id": "interes", "label": "Interés", "status": ps(len(interests) > 0, has_interest_accepted)},
        {"id": "reunion", "label": "Reunión", "status": ps(len(meetings) > 0, any(m["status"] == "confirmed" for m in meetings))},
        {"id": "dataroom", "label": "Data Room", "status": ps(len(dr_requests) > 0, any(d["status"] == "partially_granted" for d in dr_requests))},
        {"id": "oferta", "label": "Oferta indicativa", "status": ps(len(offers) > 0, has_offer_accepted)},
        {"id": "loi", "label": "LOI", "status": ps(len(lois) > 0, has_loi_accepted)},
        {"id": "exclusividad", "label": "Exclusividad", "status": ps(len(excl) > 0, has_excl_granted)},
        {"id": "dd", "label": "Due Diligence", "status": ps(bool(dd), dd and dd.get("status") == "completada", dd and dd.get("status") == "bloqueada")},
        {"id": "closing", "label": "Cierre", "status": ps(bool(closing), closing and closing.get("status") in ("cerrado_exito",))},
    ]

    # Buyer perspective context
    current = "NDA"
    last_hito = "NDA firmado" if nda else "Sin actividad"
    next_step = "Expresar interés"
    actor = "comprador"
    blocker = None

    if has_loi_accepted:
        current = "Due Diligence"
        last_hito = "LOI aceptada"
        next_step = "Seguimiento de due diligence"
        actor = "vendedor"
        if dd and dd.get("status") == "bloqueada":
            blocker = "DD bloqueada"
    elif any(l["status"] == "submitted" for l in lois):
        current = "LOI"
        last_hito = "LOI enviada"
        next_step = "Esperando respuesta del vendedor"
        actor = "vendedor"
    elif has_offer_accepted:
        current = "Oferta indicativa"
        last_hito = "Oferta aceptada"
        next_step = "Formalizar LOI"
        actor = "comprador"
    elif any(o["status"] == "submitted" for o in offers):
        current = "Oferta indicativa"
        last_hito = "Oferta enviada"
        next_step = "Esperando respuesta del vendedor"
        actor = "vendedor"
    elif has_interest_accepted:
        current = "Interés aceptado"
        last_hito = "Interés aceptado"
        next_step = "Solicitar reunión, Data Room o enviar oferta"
        actor = "comprador"
    elif len(interests) > 0:
        current = "Interés"
        last_hito = "Interés enviado"
        next_step = "Esperando respuesta del vendedor"
        actor = "vendedor"

    return {
        "viewer_role": "buyer",
        "deal_id": deal_id,
        "phases": phases,
        "current_phase": current,
        "last_hito": last_hito,
        "next_step": next_step,
        "actor": actor,
        "blocker": blocker,
        "dd_completion_pct": dd.get("completion_pct") if dd else None,
    }


# ═══ Advisor Dashboard ═══

@router.get("/advisor/dashboard")
async def api_advisor_dashboard(user: UserResponse = Depends(get_current_user)):
    """Advisor transversal dashboard across all mandated deals."""
    if user.role not in ("advisor", "admin"):
        raise HTTPException(403, "Solo advisors")

    # Get all deals (advisor sees all for now — future: filter by mandate)
    deals = await db.deals.find({"status": {"$in": ["published", "exclusivity"]}}, {"_id": 0, "deal_id": 1, "teaser.headline": 1, "status": 1, "asking_price": 1, "owner_id": 1, "company_id": 1}).to_list(50)

    active_deals = []
    critical_alerts = []
    total_pending = 0

    for d in deals:
        deal_id = d["deal_id"]

        # Process count and pending
        procs = await db.deal_processes.find({"deal_id": deal_id}, {"_id": 0, "state": 1, "buyer_id": 1, "updated_at": 1}).to_list(20)
        pending_interests = await db.interest_expressions.count_documents({"deal_id": deal_id, "status": "submitted"})
        pending_meetings = await db.meetings.count_documents({"deal_id": deal_id, "status": {"$in": ["proposed", "slot_accepted"]}})
        pending_offers = await db.preliminary_offers.count_documents({"deal_id": deal_id, "status": "submitted"})
        pending_lois = await db.formal_lois.count_documents({"deal_id": deal_id, "status": "submitted"})
        dd = await db.dd_checklists.find_one({"deal_id": deal_id}, {"_id": 0, "status": 1, "completion_pct": 1})
        closing = await db.closing_records.find_one({"deal_id": deal_id}, {"_id": 0, "status": 1, "target_close_date": 1})

        deal_pending = pending_interests + pending_meetings + pending_offers + pending_lois
        total_pending += deal_pending

        seller = await db.users.find_one({"user_id": d.get("owner_id")}, {"_id": 0, "first_name": 1, "last_name": 1})

        active_deals.append({
            "deal_id": deal_id,
            "title": d.get("teaser", {}).get("headline", "?"),
            "status": d.get("status"),
            "asking_price": d.get("asking_price"),
            "seller": f"{(seller or {}).get('first_name','')} {(seller or {}).get('last_name','')}".strip(),
            "process_count": len(procs),
            "pending_decisions": deal_pending,
            "dd_status": dd.get("status") if dd else None,
            "dd_completion": dd.get("completion_pct") if dd else None,
            "closing_status": closing.get("status") if closing else None,
            "closing_target": closing.get("target_close_date") if closing else None,
        })

        # Critical alerts
        if dd and dd.get("status") == "bloqueada":
            critical_alerts.append({"type": "dd_blocked", "deal_id": deal_id, "title": d.get("teaser", {}).get("headline", "?"), "message": "DD bloqueada"})
        if pending_lois > 0:
            critical_alerts.append({"type": "loi_pending", "deal_id": deal_id, "title": d.get("teaser", {}).get("headline", "?"), "message": f"{pending_lois} LOI pendiente"})
        if closing and closing.get("status") == "preparado":
            critical_alerts.append({"type": "closing_ready", "deal_id": deal_id, "title": d.get("teaser", {}).get("headline", "?"), "message": f"Cierre previsto: {closing.get('target_close_date')}"})

    # Sort by pending decisions (most urgent first)
    active_deals.sort(key=lambda x: x["pending_decisions"], reverse=True)

    return {
        "total_deals": len(active_deals),
        "total_pending": total_pending,
        "critical_alerts": critical_alerts,
        "deals": active_deals,
    }


# ═══ Due Diligence ═══

@router.post("/{deal_id}/dd/start")
async def api_start_dd(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Start DD checklist for a deal."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo seller/admin puede iniciar DD")
    from services.deal_process.due_diligence_agent import start_dd
    proc = await db.deal_processes.find_one({"deal_id": deal_id, "seller_id": user.user_id}, {"_id": 0})
    if not proc:
        raise HTTPException(404, "Proceso no encontrado")
    result = await start_dd(proc["process_id"], deal_id, proc["buyer_id"])
    return result


@router.get("/{deal_id}/dd/dashboard")
async def api_dd_dashboard(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Get DD dashboard with progress."""
    from services.deal_process.due_diligence_agent import get_dd_dashboard
    buyer_id = user.user_id if user.role == "buyer" else None
    result = await get_dd_dashboard(deal_id, buyer_id)
    if not result:
        return {"status": "no_iniciada", "completion_pct": 0, "sections": [], "section_progress": [], "blockers": []}
    return result


@router.post("/{deal_id}/dd/checklist/{item_id}/update")
async def api_update_dd_item(deal_id: str, item_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Update DD checklist item."""
    from services.deal_process.due_diligence_agent import update_item
    dd = await db.dd_checklists.find_one({"deal_id": deal_id}, {"_id": 0, "checklist_id": 1})
    if not dd:
        raise HTTPException(404, "Checklist no encontrada")
    result = await update_item(dd["checklist_id"], item_id, user.user_id, user.role, data)
    if not result:
        raise HTTPException(404, "Ítem no encontrado")
    return result


# ═══ Closing ═══

@router.get("/{deal_id}/closing")
async def api_get_closing(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Get closing record."""
    from services.deal_process.closing_agent import get_closing
    result = await get_closing(deal_id)
    if not result:
        return {"status": "no_iniciado"}
    return result


@router.post("/{deal_id}/closing/init")
async def api_init_closing(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Initialize closing after DD completion. Only ARROBA/admin."""
    if user.role != "admin":
        raise HTTPException(403, "Solo ARROBA puede iniciar el cierre")
    from services.deal_process.closing_agent import init_closing
    proc = await db.deal_processes.find_one({"deal_id": deal_id}, {"_id": 0})
    if not proc:
        raise HTTPException(404, "Proceso no encontrado")
    result = await init_closing(deal_id, proc["buyer_id"], data)
    return result


@router.post("/{deal_id}/closing/update")
async def api_update_closing(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Update closing status or checklist. Only ARROBA/admin."""
    if user.role != "admin":
        raise HTTPException(403, "Solo ARROBA gestiona el cierre")
    from services.deal_process.closing_agent import update_closing
    closing = await db.closing_records.find_one({"deal_id": deal_id}, {"_id": 0, "closing_id": 1})
    if not closing:
        raise HTTPException(404, "Registro de cierre no encontrado")
    result = await update_closing(closing["closing_id"], data)
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
        pending_offers = await db.preliminary_offers.count_documents({"deal_id": deal_id, "status": "submitted"})
        pending_lois = await db.formal_lois.count_documents({"deal_id": deal_id, "status": "submitted"})

        if pending_excl > 0:
            actions.append({"key": "respond_exclusivity", "label": f"Responder exclusividad ({pending_excl})", "microcopy": "Solicitud de exclusividad pendiente. Puedes aceptar, rechazar o contraofertar plazo."})
        if pending_lois > 0:
            actions.append({"key": "respond_loi", "label": f"Responder LOI formal ({pending_lois})", "microcopy": "Tienes una LOI formal pendiente. Puedes aceptar, contraofertar, pedir aclaracion o rechazar."})
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


    loi_requests = await db.formal_lois.find({"deal_id": deal_id, "status": "submitted"}, {"_id": 0}).to_list(50)
    for loi in loi_requests:
        buyer = await db.users.find_one({"user_id": loi["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        pending.append({
            "type": "loi", "id": loi["loi_id"],
            "buyer_name": f"{(buyer or {}).get('first_name','')} {(buyer or {}).get('last_name','')}".strip(),
            "buyer_id": loi["buyer_id"],
            "enterprise_value": loi.get("enterprise_value"),
            "cash_at_closing": loi.get("cash_at_closing"),
            "acquisition_pct": loi.get("acquisition_pct"),
            "exclusivity_requested": loi.get("exclusivity_requested"),
            "exclusivity_days": loi.get("exclusivity_days"),
            "valid_until": loi.get("valid_until"),
            "completeness": loi.get("completeness_score"),
            "executive_summary": loi.get("executive_summary", "")[:150],
            "created_at": loi.get("created_at"),
            "actions": ["accept", "counter", "clarification", "reject"],
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
    type_order = {"exclusivity": 0, "loi": 1, "offer": 2, "meeting": 3, "dataroom": 4, "document": 5, "interest": 6}
    pending.sort(key=lambda x: type_order.get(x["type"], 9))

    return {
        "deal_id": deal_id,
        "process_count": len(procs),
        "pending_decisions": pending,
        "pending_count": len(pending),
        "in_progress": in_progress,
        "timeline": timeline[:30],
    }
