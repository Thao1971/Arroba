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
        "requires_confirmation": not is_ready,
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
        "recommendation": (
            f"Todo en orden. {buyer_name} ha demostrado interes serio con LOI, actividad en Data Room y tiempo invertido."
            if is_ready else
            f"Recomendacion: Espera a que {buyer_name} complete su due diligence antes de otorgar exclusividad. Sin revision de documentos, la exclusividad puede colapsar durante la DD."
        ),
        "message": (
            f"{buyer_name} cumple {criteria_met}/4 criterios recomendados."
            if is_ready else
            f"{buyer_name} solo cumple {criteria_met}/4 criterios. Riesgo: exclusividad prematura."
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

    # NC-01: Deal sin traccion (>7 dias, 0 NDAs) — PRESCRIPTIVE
    published_at = deal.get("published_at")
    if published_at and status == "published":
        if isinstance(published_at, str):
            pub_dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        else:
            pub_dt = published_at
        days_published = (now - pub_dt).days
        ndas_count = len(deal.get("ndas_signed", []))
        views = deal.get("metrics", {}).get("teaser_views", 0)

        if days_published >= 7 and ndas_count == 0:
            # Prescriptive: analyze WHY based on data
            asking = deal.get("asking_price", 0)
            teaser = deal.get("teaser", {})

            if views < 20:
                diagnosis = f"Solo {views} vistas al teaser — el deal no esta llegando a buyers."
                prescription = "Revisa que los sectores y la geografia del teaser coincidan con tu publico objetivo. Si el titulo es generico, hazlo mas especifico."
            elif views >= 20 and ndas_count == 0:
                diagnosis = f"{views} personas vieron el teaser pero nadie pidio acceso."
                prescription = f"El teaser no convence. Revisa: 1) Que el precio ({asking/1e6:.1f}M) sea competitivo para tu sector. 2) Que los highlights sean concretos (numeros, no adjetivos). 3) Que el EBITDA sea visible."

            nudges.append({
                "id": "NC-01",
                "type": "warning",
                "priority": "ALTA",
                "title": f"Sin traccion — {days_published} dias publicado",
                "message": diagnosis,
                "prescription": prescription,
                "actions": ["Editar teaser", "Revisar precio"],
            })

    # NC-02: Muchos intereses, 0 LOIs
    interests_count = await engagements_collection.count_documents(
        {"deal_id": deal_id, "type": "INTEREST"}
    )
    lois_count = await engagements_collection.count_documents(
        {"deal_id": deal_id, "type": "LOI"}
    )

    if interests_count >= 3 and lois_count == 0:
        # Analyze which buyers are most active to give specific advice
        asking = deal.get("asking_price", 0)

        # Find the most active buyer to reference
        interest_engs = await engagements_collection.find(
            {"deal_id": deal_id, "type": "INTEREST"}, {"_id": 0}
        ).to_list(20)

        best_buyer_name = None
        best_time = 0
        for eng in interest_engs:
            bid = eng["buyer_id"]
            cursor = time_tracking_collection.find({"deal_id": deal_id, "buyer_id": bid}, {"_id": 0})
            recs = await cursor.to_list(100)
            total = sum(r.get("session_seconds", 0) for r in recs)
            if total > best_time:
                best_time = total
                best_buyer_name = eng.get("buyer_name") or bid

        prescription_parts = [f"{interests_count} buyers evaluaron tu deal pero ninguno dio el paso a LOI."]
        if asking > 0:
            prescription_parts.append(f"Accion 1: Valida si {asking/1e6:.1f}M es competitivo para tu sector — compara con deals similares en el marketplace.")
        prescription_parts.append("Accion 2: Revisa el infomemo. Si no detalla financieros claros (revenue, EBITDA, crecimiento), los buyers no van a ofertar.")
        if best_buyer_name and best_time > 0:
            prescription_parts.append(f"Accion 3: {best_buyer_name} fue quien mas tiempo invirtio ({best_time // 60} min). Es tu mejor candidato a LOI — considera contactarle directamente.")

        nudges.append({
            "id": "NC-02",
            "type": "warning",
            "priority": "ALTA",
            "title": f"{interests_count} intereses, 0 LOIs",
            "message": " ".join(prescription_parts),
            "actions": ["Revisar precio", "Mejorar infomemo"],
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
            offer = eng.get("valuation_offer")
            offer_str = f" de {offer/1e6:.1f}M" if offer else ""
            nudges.append({
                "id": "NC-03",
                "type": "info",
                "priority": "MEDIA",
                "title": f"LOI{offer_str} sin due diligence",
                "message": f"{bname} envio LOI pero tiene 0 descargas en Data Room. Una LOI sin DD es una senal de riesgo: el buyer puede retirarse cuando vea los detalles. Accion: Contacta a {bname} y pidele que revise los documentos financieros y legales antes de avanzar.",
                "actions": ["Contactar buyer"],
                "buyer_id": bid,
            })

    # NC-04: GROUPED — Inactive buyers (NDA + 0 activity in >7 days)
    ndas = deal.get("ndas_signed", [])
    inactive_buyers = []
    best_inactive = None
    best_inactive_time = 0

    for nda in ndas:
        bid = nda["buyer_id"]
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
            eng = await engagements_collection.find_one(
                {"deal_id": deal_id, "buyer_id": bid}, {"_id": 0}
            )
            if eng and eng.get("stage") not in ("REJECTED", "EXCLUSIVITY"):
                buyer = await users_collection.find_one({"user_id": bid}, {"_id": 0})
                bname = f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() if buyer else bid
                days_inactive = (now - latest).days

                # Get total time for ranking
                cursor = time_tracking_collection.find({"deal_id": deal_id, "buyer_id": bid}, {"_id": 0})
                recs = await cursor.to_list(100)
                total_secs = sum(r.get("session_seconds", 0) for r in recs)

                inactive_buyers.append({
                    "name": bname, "buyer_id": bid,
                    "days": days_inactive, "total_minutes": total_secs // 60,
                })
                if total_secs > best_inactive_time:
                    best_inactive_time = total_secs
                    best_inactive = bname

    if inactive_buyers:
        count = len(inactive_buyers)
        if count == 1:
            b = inactive_buyers[0]
            msg = f"{b['name']} firmo NDA hace {b['days']} dias y no ha vuelto ({b['total_minutes']} min de actividad total). Accion: Contactale — si no responde en 48h, descartalo."
        else:
            names = ", ".join(b["name"] for b in sorted(inactive_buyers, key=lambda x: -x["total_minutes"])[:3])
            msg = f"{count} buyers inactivos: {names}."
            if best_inactive:
                msg += f" El mas prometedor era {best_inactive} ({best_inactive_time // 60} min de actividad). Prioriza contactarle."
            else:
                msg += " Ninguno tuvo actividad significativa — considera descartarlos para limpiar tu pipeline."

        nudges.append({
            "id": "NC-04",
            "type": "info",
            "priority": "BAJA",
            "title": f"{count} buyer{'s' if count > 1 else ''} inactivo{'s' if count > 1 else ''}",
            "message": msg,
            "actions": ["Contactar" if best_inactive else "Descartar"],
            "inactive_buyers": [{"name": b["name"], "buyer_id": b["buyer_id"], "days": b["days"], "minutes": b["total_minutes"]} for b in inactive_buyers],
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
                        "title": f"Exclusividad sin progreso — {days_exclusive} dias",
                        "message": f"{bname} tiene exclusividad desde hace {days_exclusive} dias pero no ha descargado documentos nuevos. Esto puede significar que perdio interes o esta bloqueado. Accion: Contacta a {bname} hoy y preguntale directamente si necesita algo o si sigue interesado. Si no responde en 72h, revoca la exclusividad.",
                        "actions": ["Contactar buyer", "Revocar exclusividad"],
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
