"""
Deal Health System
Synthesizes coaching nudges + additional signals into a deal health assessment.
Returns semaphore (VERDE/AMARILLO/ROJO) + structured alerts with problem/cause/action.
"""
from datetime import datetime, timezone
from database import deals_collection, engagements_collection, db
from services.coaching_service import get_deal_nudges


async def compute_deal_health(deal_id: str) -> dict:
    """
    Compute deal health combining nudges + additional checks.
    Each alert: problem, cause, action, severity.
    """
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        return {"error": "Deal not found"}

    status = deal.get("status", "draft")
    if status in ("draft", "closed", "dropped"):
        return {
            "deal_id": deal_id,
            "health": "INACTIVO",
            "color": "slate",
            "alerts": [],
            "summary": "Este deal no esta activo.",
        }

    now = datetime.now(timezone.utc)
    alerts = []

    # Get existing coaching nudges (already richly prescriptive)
    nudges = await get_deal_nudges(deal_id)

    # Map nudges to structured alerts
    nudge_map = {
        "NC-01": {
            "category": "TRACCION",
            "cause": "El deal no esta generando suficiente visibilidad o el teaser no convence.",
        },
        "NC-02": {
            "category": "CONVERSION",
            "cause": "Buyers evaluan pero no avanzan a oferta formal. El precio o el infomemo pueden ser el freno.",
        },
        "NC-03": {
            "category": "RIESGO",
            "cause": "Un buyer con LOI que no revisa documentos puede retirarse durante Due Diligence.",
        },
        "NC-04": {
            "category": "ENFRIAMIENTO",
            "cause": "Buyers que firmaron NDA pero dejaron de interactuar. Interes inicial que no se consolida.",
        },
        "NC-05": {
            "category": "ESTANCAMIENTO",
            "cause": "La exclusividad no esta avanzando. El buyer puede estar bloqueado o haber perdido interes.",
        },
        "NC-QA-12": {
            "category": "RESPUESTA",
            "cause": "Preguntas sin responder frenan el momentum del deal y enfrían al buyer.",
        },
        "NC-QA-24": {
            "category": "RESPUESTA",
            "cause": "Preguntas sin responder >24h. El buyer puede interpretar silencio como desinteres.",
        },
    }

    for nudge in nudges:
        nid = nudge.get("id", "")
        extra = nudge_map.get(nid, {})
        alerts.append({
            "id": nid,
            "severity": nudge.get("priority", "BAJA"),
            "category": extra.get("category", "GENERAL"),
            "problem": nudge.get("title", ""),
            "cause": extra.get("cause", ""),
            "action": nudge.get("prescription") or nudge.get("message", ""),
            "actions": nudge.get("actions", []),
            "metadata": {k: v for k, v in nudge.items() if k in ("buyer_id", "metadata", "inactive_buyers")},
        })

    # Additional check: NDA sin paso a interest (>10 days)
    ndas = deal.get("ndas_signed", [])
    for nda in ndas:
        bid = nda.get("buyer_id")
        if not bid:
            continue

        # Check if buyer has engagement (interest/LOI)
        eng = await engagements_collection.find_one(
            {"deal_id": deal_id, "buyer_id": bid}, {"_id": 0}
        )
        if eng:
            continue  # Has engagement, OK

        # No engagement — check NDA age
        signed_at = nda.get("signed_at")
        if not signed_at:
            continue
        if isinstance(signed_at, str):
            signed_dt = datetime.fromisoformat(signed_at.replace("Z", "+00:00"))
        else:
            signed_dt = signed_at

        days_since_nda = (now - signed_dt).days
        if days_since_nda >= 10:
            buyer = await db.users.find_one({"user_id": bid}, {"_id": 0, "first_name": 1, "last_name": 1})
            bname = f"{buyer['first_name']} {buyer['last_name']}" if buyer else bid

            alerts.append({
                "id": f"DH-NDA-{bid[:8]}",
                "severity": "MEDIA",
                "category": "CURIOSIDAD SIN AVANCE",
                "problem": f"NDA firmada sin interest — {bname} ({days_since_nda} dias)",
                "cause": f"{bname} firmo NDA hace {days_since_nda} dias pero no envio interest. Genera curiosidad pero no avance real.",
                "action": f"Contacta a {bname} para entender si necesita mas informacion o si el deal no encaja con su tesis. Si no responde, descartalo para mantener limpio tu pipeline.",
                "actions": ["Contactar buyer"],
                "metadata": {"buyer_id": bid},
            })

    # Sort by severity
    severity_order = {"ALTA": 0, "MEDIA": 1, "BAJA": 2}
    alerts.sort(key=lambda a: severity_order.get(a.get("severity", "BAJA"), 3))

    # Compute semaphore
    high_count = sum(1 for a in alerts if a["severity"] == "ALTA")
    medium_count = sum(1 for a in alerts if a["severity"] == "MEDIA")

    if high_count >= 2:
        health = "ROJO"
        color = "red"
        summary = f"{high_count} alertas criticas. Este deal necesita atencion inmediata."
    elif high_count == 1:
        health = "AMARILLO"
        color = "amber"
        summary = "1 alerta critica que puede afectar al deal."
    elif medium_count >= 2:
        health = "AMARILLO"
        color = "amber"
        summary = f"{medium_count} alertas moderadas. Hay riesgos que conviene revisar."
    elif medium_count == 1 or len(alerts) > 0:
        health = "AMARILLO"
        color = "amber"
        summary = "Algun punto de mejora, pero el deal avanza."
    else:
        health = "VERDE"
        color = "green"
        summary = "Deal sano. Sin alertas activas."

    return {
        "deal_id": deal_id,
        "health": health,
        "color": color,
        "summary": summary,
        "alerts": alerts,
        "counts": {
            "total": len(alerts),
            "alta": high_count,
            "media": medium_count,
            "baja": len(alerts) - high_count - medium_count,
        },
    }
