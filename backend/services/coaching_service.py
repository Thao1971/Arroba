"""
Seller Coaching System v1
Warnings, nudges y recomendaciones para sellers/advisors.
Separa DECIDIR de VER — este modulo interpreta datos y sugiere acciones.
"""
from datetime import datetime, timezone, timedelta
from database import (
    deals_collection, engagements_collection, events_collection,
    db, users_collection
)

time_tracking_collection = db.time_tracking


async def check_exclusivity_readiness(deal_id: str, buyer_id: str) -> dict:
    """
    Pre-check antes de otorgar exclusividad.
    Devuelve warning si el buyer no cumple criterios minimos.
    No bloquea — solo informa.
    """
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        return {"ready": False, "warning": "Deal no encontrado"}

    # Get buyer info
    buyer = await users_collection.find_one({"user_id": buyer_id}, {"_id": 0})
    buyer_name = f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() if buyer else buyer_id

    # Get engagement
    engagement = await engagements_collection.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0}
    )
    has_loi = engagement and engagement.get("type") == "LOI"
    valuation_offer = engagement.get("valuation_offer") if engagement else None

    # Get DR downloads
    from database import db
    dr_downloads = await db.dataroom_access_log.count_documents(
        {"deal_id": deal_id, "buyer_id": buyer_id, "action": "DOWNLOAD"}
    )

    # Get total time
    cursor = time_tracking_collection.find(
        {"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0}
    )
    records = await cursor.to_list(200)
    total_seconds = sum(r.get("session_seconds", 0) for r in records)
    total_minutes = total_seconds // 60

    # Compute intent score
    from services.intent_service import compute_intent_score
    intent = await compute_intent_score(buyer_id, deal_id)
    score = intent.get("score", 0)

    # Criteria
    score_ok = score >= 55
    downloads_ok = dr_downloads >= 1
    time_ok = total_seconds >= 600  # 10 min

    criteria_met = sum([score_ok, downloads_ok, time_ok, has_loi])
    is_ready = criteria_met >= 3  # At least 3 of 4 criteria

    warnings = []
    if not has_loi:
        warnings.append("No ha enviado LOI")
    if not score_ok:
        warnings.append(f"Intent score bajo ({score}/100)")
    if not downloads_ok:
        warnings.append(f"Solo {dr_downloads} descargas en Data Room")
    if not time_ok:
        warnings.append(f"Solo {total_minutes} min de tiempo invertido (minimo recomendado: 10 min)")

    return {
        "ready": is_ready,
        "buyer_id": buyer_id,
        "buyer_name": buyer_name,
        "metrics": {
            "intent_score": score,
            "has_loi": has_loi,
            "valuation_offer": valuation_offer,
            "dr_downloads": dr_downloads,
            "total_minutes": total_minutes,
        },
        "criteria": {
            "score_ok": score_ok,
            "downloads_ok": downloads_ok,
            "time_ok": time_ok,
            "has_loi": has_loi,
            "criteria_met": criteria_met,
            "criteria_total": 4,
        },
        "warnings": warnings,
        "message": (
            f"{buyer_name} cumple {criteria_met}/4 criterios recomendados para exclusividad."
            if is_ready else
            f"{buyer_name} solo cumple {criteria_met}/4 criterios. Considera esperar mas actividad."
        ),
    }


async def get_deal_nudges(deal_id: str) -> list:
    """
    Genera nudges contextuales para un deal especifico.
    Devuelve lista de mensajes con prioridad.
    """
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        return []

    nudges = []
    now = datetime.now(timezone.utc)
    status = deal.get("status", "draft")

    if status == "draft":
        return []

    # NC-01: Deal sin traccion (>7 dias, 0 NDAs)
    published_at = deal.get("published_at")
    if published_at and status == "published":
        if isinstance(published_at, str):
            pub_dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        else:
            pub_dt = published_at
        days_published = (now - pub_dt).days
        ndas_count = len(deal.get("ndas_signed", []))

        if days_published >= 7 and ndas_count == 0:
            nudges.append({
                "id": "NC-01",
                "type": "warning",
                "priority": "ALTA",
                "title": "Deal sin traccion",
                "message": f"Tu deal lleva {days_published} dias publicado sin NDAs. Considera revisar el teaser o ajustar el precio.",
                "action": "Revisar teaser",
            })

    # NC-02: Muchos intereses, 0 LOIs
    interests_count = await engagements_collection.count_documents(
        {"deal_id": deal_id, "type": "INTEREST"}
    )
    lois_count = await engagements_collection.count_documents(
        {"deal_id": deal_id, "type": "LOI"}
    )

    if interests_count >= 3 and lois_count == 0:
        nudges.append({
            "id": "NC-02",
            "type": "warning",
            "priority": "ALTA",
            "title": "Interes sin conversion",
            "message": f"{interests_count} intereses recibidos pero ninguna LOI. Posibles causas: precio alto, infomemo poco convincente, o falta de urgencia.",
            "action": "Revisar pricing",
        })

    # NC-03: Buyer con LOI pero 0 descargas DR
    from database import db
    loi_engagements = await engagements_collection.find(
        {"deal_id": deal_id, "type": "LOI"}, {"_id": 0}
    ).to_list(20)

    for eng in loi_engagements:
        bid = eng["buyer_id"]
        dr_count = await db.dataroom_access_log.count_documents(
            {"deal_id": deal_id, "buyer_id": bid, "action": "DOWNLOAD"}
        )
        if dr_count == 0:
            bname = eng.get("buyer_name") or bid
            nudges.append({
                "id": "NC-03",
                "type": "info",
                "priority": "MEDIA",
                "title": f"LOI sin due diligence",
                "message": f"{bname} envio LOI pero no ha descargado documentos del Data Room. Considera pedirle que revise la documentacion antes de avanzar.",
                "action": "Contactar buyer",
                "buyer_id": bid,
            })

    # NC-04: Buyer fantasma (NDA + 0 actividad en >7 dias)
    ndas = deal.get("ndas_signed", [])
    for nda in ndas:
        bid = nda["buyer_id"]
        # Check last activity
        last_event = await events_collection.find_one(
            {"deal_id": deal_id, "user_id": bid},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        last_dr = await db.dataroom_access_log.find_one(
            {"deal_id": deal_id, "buyer_id": bid},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        last_time = await time_tracking_collection.find_one(
            {"deal_id": deal_id, "buyer_id": bid},
            {"_id": 0},
            sort=[("updated_at", -1)]
        )

        # Find most recent activity
        latest = None
        for source in [last_event, last_dr, last_time]:
            if source:
                ts = source.get("created_at") or source.get("timestamp") or source.get("updated_at")
                if ts:
                    if isinstance(ts, str):
                        ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    if latest is None or ts > latest:
                        latest = ts

        if latest and (now - latest).days >= 7:
            # Check not already rejected
            eng = await engagements_collection.find_one(
                {"deal_id": deal_id, "buyer_id": bid}, {"_id": 0}
            )
            if eng and eng.get("stage") not in ("REJECTED", "EXCLUSIVITY"):
                buyer = await users_collection.find_one({"user_id": bid}, {"_id": 0})
                bname = f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() if buyer else bid
                days_inactive = (now - latest).days
                nudges.append({
                    "id": "NC-04",
                    "type": "info",
                    "priority": "BAJA",
                    "title": "Buyer inactivo",
                    "message": f"{bname} firmo NDA pero no ha tenido actividad en {days_inactive} dias.",
                    "buyer_id": bid,
                })

    # NC-05: Exclusividad activa sin progreso (>14 dias sin nuevas descargas)
    exclusivity = deal.get("exclusivity")
    if exclusivity and status == "exclusivity":
        excl_buyer = exclusivity.get("buyer_id")
        granted_at = exclusivity.get("granted_at")
        if granted_at:
            if isinstance(granted_at, str):
                granted_dt = datetime.fromisoformat(granted_at.replace("Z", "+00:00"))
            else:
                granted_dt = granted_at
            days_exclusive = (now - granted_dt).days

            if days_exclusive >= 14:
                # Check for activity since exclusivity
                recent_dr = await db.dataroom_access_log.count_documents({
                    "deal_id": deal_id,
                    "buyer_id": excl_buyer,
                    "action": "DOWNLOAD",
                    "timestamp": {"$gte": granted_at}
                })
                if recent_dr == 0:
                    buyer = await users_collection.find_one({"user_id": excl_buyer}, {"_id": 0})
                    bname = f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() if buyer else excl_buyer
                    nudges.append({
                        "id": "NC-05",
                        "type": "warning",
                        "priority": "ALTA",
                        "title": "Exclusividad sin progreso",
                        "message": f"La exclusividad con {bname} lleva {days_exclusive} dias activa sin nuevas descargas en Data Room.",
                        "action": "Contactar buyer",
                        "buyer_id": excl_buyer,
                    })

    return nudges


async def get_seller_nudges(seller_id: str) -> list:
    """
    Genera nudges para TODOS los deals de un seller.
    Para mostrar en el dashboard.
    """
    cursor = deals_collection.find(
        {"owner_id": seller_id, "status": {"$nin": ["closed", "dropped"]}},
        {"_id": 0, "deal_id": 1, "status": 1, "teaser": 1}
    )
    deals = await cursor.to_list(20)

    all_nudges = []
    for d in deals:
        deal_nudges = await get_deal_nudges(d["deal_id"])
        headline = d.get("teaser", {}).get("headline", d["deal_id"])
        for n in deal_nudges:
            n["deal_id"] = d["deal_id"]
            n["deal_title"] = headline
        all_nudges.extend(deal_nudges)

    # Sort: ALTA first, then MEDIA, then BAJA
    priority_order = {"ALTA": 0, "MEDIA": 1, "BAJA": 2}
    all_nudges.sort(key=lambda x: priority_order.get(x.get("priority", "BAJA"), 3))

    return all_nudges
