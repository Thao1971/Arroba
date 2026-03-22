"""Auto-Shortlist Suggestion Engine — Decision assistance for sellers.
Classifies buyers as RECOMMENDED_SHORTLIST / CONSIDER / LOW_PRIORITY.
Suggests exclusivity when a single standout buyer exists.
NEVER applies automatically — always suggests."""
from database import db
from services.intent_service import compute_intent_score, get_time_summary
from services.events_service import track_event


async def compute_suggestions(deal_id: str) -> dict:
    """Compute shortlist/exclusivity suggestions for a deal.
    Returns classification per buyer + system recommendation banner."""

    # Get all engagements for the deal
    engagements = await db.engagements.find(
        {"deal_id": deal_id}, {"_id": 0}
    ).to_list(100)

    if not engagements:
        return {"buyers": [], "recommendation": None, "exclusivity_candidate": None}

    # Get current shortlist
    deal = await db.deals.find_one({"deal_id": deal_id}, {"_id": 0})
    current_shortlist = (deal.get("shortlist") or {}).get("buyers", []) if deal else []
    shortlist_count = len(current_shortlist)

    buyer_suggestions = []

    for eng in engagements:
        bid = eng["buyer_id"]

        # Get intent score
        intent = await compute_intent_score(bid, deal_id)
        score = intent["score"]
        level = intent["level"]

        # Get specific signals
        has_loi = eng.get("type") == "LOI"
        dr_downloads = await db.dataroom_access_log.count_documents(
            {"buyer_id": bid, "deal_id": deal_id, "action": "DOWNLOAD"}
        )
        time_data = await get_time_summary(bid, deal_id)
        dr_time_min = time_data.get("data_room", 0) / 60

        # Classification logic (strict criteria)
        if has_loi and level == "alta" and dr_downloads >= 1:
            classification = "RECOMMENDED_SHORTLIST"
            action = "shortlist"
            action_label = "Enviar a shortlist"
            reason = "LOI enviada + alta actividad en Data Room"
        elif level == "alta" and not has_loi:
            classification = "CONSIDER"
            action = "wait"
            action_label = "Esperar más actividad"
            reason = "Alta intención, pendiente de LOI"
        elif has_loi and (level != "alta" or dr_downloads < 1):
            classification = "CONSIDER"
            action = "wait"
            action_label = "Esperar más actividad"
            reason = "LOI enviada pero actividad limitada"
        else:
            classification = "LOW_PRIORITY"
            action = "discard"
            action_label = "Descartar"
            reason = "Baja actividad/interés"

        # Override if already in shortlist/exclusivity/rejected
        stage = eng.get("stage", "SUBMITTED")
        if stage == "SHORTLISTED":
            classification = "ALREADY_SHORTLISTED"
            action = None
            action_label = "Ya en shortlist"
            reason = "Buyer ya está en shortlist"
        elif stage == "EXCLUSIVITY":
            classification = "EXCLUSIVITY"
            action = None
            action_label = "En exclusividad"
            reason = "Buyer en exclusividad"
        elif stage == "REJECTED":
            classification = "REJECTED"
            action = None
            action_label = "Descartado"
            reason = "Buyer rechazado"

        # Get buyer info
        buyer = await db.users.find_one({"user_id": bid}, {"_id": 0, "first_name": 1, "last_name": 1, "email": 1})
        buyer_name = f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() if buyer else "Comprador"

        buyer_suggestions.append({
            "buyer_id": bid,
            "buyer_name": buyer_name,
            "buyer_email": buyer.get("email", "") if buyer else "",
            "engagement_type": eng.get("type"),
            "stage": stage,
            "intent_score": score,
            "intent_level": level,
            "intent_label": intent["label"],
            "intent_factors": intent["factors"],
            "classification": classification,
            "action": action,
            "action_label": action_label,
            "reason": reason,
            "signals": {
                "has_loi": has_loi,
                "dr_downloads": dr_downloads,
                "dr_time_min": round(dr_time_min, 1),
                "total_time_min": round(time_data.get("total", 0) / 60, 1),
            },
            "time_summary": intent.get("time_summary", {}),
        })

    # Sort: RECOMMENDED first, then CONSIDER, then LOW_PRIORITY — by intent_score
    order = {"RECOMMENDED_SHORTLIST": 0, "ALREADY_SHORTLISTED": 1, "EXCLUSIVITY": 1, "CONSIDER": 2, "LOW_PRIORITY": 3, "REJECTED": 4}
    buyer_suggestions.sort(key=lambda x: (order.get(x["classification"], 5), -x["intent_score"]))

    # System recommendation banner
    recommended = [b for b in buyer_suggestions if b["classification"] == "RECOMMENDED_SHORTLIST"]
    already_shortlisted = [b for b in buyer_suggestions if b["classification"] == "ALREADY_SHORTLISTED"]

    recommendation = None
    slots_available = 3 - shortlist_count

    if recommended and slots_available > 0:
        suggest_count = min(len(recommended), slots_available)
        top_recommended = recommended[:suggest_count]
        recommendation = {
            "type": "SHORTLIST",
            "message": f"Te recomendamos shortlistar {suggest_count} buyer{'s' if suggest_count > 1 else ''}",
            "detail": f"Basado en LOI + actividad en Data Room. {3 - shortlist_count} plaza{'s' if slots_available != 1 else ''} disponible{'s' if slots_available != 1 else ''}.",
            "buyer_ids": [b["buyer_id"] for b in top_recommended],
            "buyer_names": [b["buyer_name"] for b in top_recommended],
        }

    # Exclusivity suggestion (strict criteria)
    exclusivity_candidate = None
    if shortlist_count > 0 or len(already_shortlisted) > 0:
        # Check each shortlisted buyer for exclusivity criteria
        for b in buyer_suggestions:
            if b["stage"] not in ("SHORTLISTED",):
                continue
            if (b["signals"]["has_loi"] and
                b["intent_level"] == "alta" and
                b["signals"]["dr_downloads"] >= 2 and
                b["signals"]["dr_time_min"] >= 20):
                exclusivity_candidate = {
                    "buyer_id": b["buyer_id"],
                    "buyer_name": b["buyer_name"],
                    "message": f"Sugerir exclusividad para {b['buyer_name']}",
                    "detail": f"LOI + alta intención + {b['signals']['dr_downloads']} descargas + {b['signals']['dr_time_min']} min en Data Room",
                }
                break

    # Track suggestion events
    if recommendation:
        await track_event("SHORTLIST_SUGGESTED", deal_id=deal_id, metadata={
            "suggested_buyers": recommendation["buyer_ids"],
            "count": len(recommendation["buyer_ids"]),
        })
    if exclusivity_candidate:
        await track_event("EXCLUSIVITY_SUGGESTED", deal_id=deal_id, metadata={
            "candidate": exclusivity_candidate["buyer_id"],
        })

    return {
        "buyers": buyer_suggestions,
        "recommendation": recommendation,
        "exclusivity_candidate": exclusivity_candidate,
        "shortlist_status": {
            "current_count": shortlist_count,
            "max": 3,
            "available_slots": max(0, 3 - shortlist_count),
        },
    }
