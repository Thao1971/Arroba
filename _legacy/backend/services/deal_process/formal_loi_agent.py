"""
FormalLoiAgent — LOI formal precargada desde oferta preliminar.
Transicion guiada: oferta → invite_loi → buyer formaliza → seller responde/contraoferta.
"""
from database import db
from datetime import datetime, timezone
import uuid


async def formalize_loi(process_id: str, deal_id: str, buyer_id: str, payload: dict) -> dict:
    """Buyer formalizes LOI, optionally precloaded from preliminary offer."""
    now = datetime.now(timezone.utc).isoformat()
    loi_id = f"loi_{uuid.uuid4().hex[:12]}"
    source_offer_id = payload.get("source_offer_id")

    # Precarga desde oferta preliminar
    prefill = {}
    if source_offer_id:
        offer = await db.preliminary_offers.find_one({"offer_id": source_offer_id}, {"_id": 0})
        if offer:
            prefill = {
                "enterprise_value": offer.get("enterprise_value"),
                "operation_type": offer.get("operation_type"),
                "acquisition_pct": offer.get("acquisition_pct"),
                "cash_at_closing": offer.get("cash_at_closing"),
                "deferred_payment": offer.get("deferred_payment"),
                "earnout": offer.get("earnout"),
                "equity_rollover": offer.get("equity_rollover"),
                "subject_to_dd": offer.get("subject_to_dd"),
                "subject_to_approval": offer.get("subject_to_approval"),
                "subject_to_financing": offer.get("subject_to_financing"),
                "founder_permanence": offer.get("founder_permanence"),
                "buyer_entity": offer.get("buyer_entity"),
            }

    doc = {
        "loi_id": loi_id,
        "process_id": process_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "source_offer_id": source_offer_id,
        "status": "submitted",
        # Bloque 1: Alcance economico (precargado + override)
        "enterprise_value": payload.get("enterprise_value") or prefill.get("enterprise_value"),
        "equity_value": payload.get("equity_value"),
        "acquisition_pct": payload.get("acquisition_pct") or prefill.get("acquisition_pct", 100),
        "operation_type": payload.get("operation_type") or prefill.get("operation_type", "full_sale"),
        # Bloque 2: Estructura y calendario
        "cash_at_closing": payload.get("cash_at_closing") or prefill.get("cash_at_closing"),
        "deferred_payment": payload.get("deferred_payment") or prefill.get("deferred_payment"),
        "earnout": payload.get("earnout") or prefill.get("earnout"),
        "equity_rollover": payload.get("equity_rollover") or prefill.get("equity_rollover"),
        "valid_until": payload.get("valid_until"),
        "closing_timeline": payload.get("closing_timeline"),
        # Bloque 3: Condiciones
        "subject_to_dd": payload.get("subject_to_dd", prefill.get("subject_to_dd", True)),
        "subject_to_approval": payload.get("subject_to_approval", prefill.get("subject_to_approval", False)),
        "subject_to_financing": payload.get("subject_to_financing", prefill.get("subject_to_financing", False)),
        "exclusivity_requested": payload.get("exclusivity_requested", False),
        "exclusivity_days": payload.get("exclusivity_days"),
        "founder_permanence": payload.get("founder_permanence") or prefill.get("founder_permanence"),
        "management_rollover": payload.get("management_rollover"),
        # Bloque 4: Resumen
        "buyer_entity": payload.get("buyer_entity") or prefill.get("buyer_entity"),
        "executive_summary": payload.get("executive_summary", ""),
        "commitment_level": "formal",
        "legal_accepted": payload.get("legal_accepted", False),
        # Response
        "seller_response": None,
        "counter_terms": None,
        "counter_status": None,
        "milestone": None,
        "created_at": now,
        "updated_at": now,
    }

    # Completeness
    key_fields = ["enterprise_value", "cash_at_closing", "valid_until", "executive_summary", "legal_accepted", "acquisition_pct"]
    filled = sum(1 for f in key_fields if doc.get(f))
    doc["completeness_score"] = round(filled / len(key_fields) * 100)

    await db.formal_lois.insert_one(doc)

    # Mark source offer as upgraded
    if source_offer_id:
        await db.preliminary_offers.update_one(
            {"offer_id": source_offer_id},
            {"$set": {"status": "upgraded_to_loi", "upgraded_loi_id": loi_id, "updated_at": now}}
        )

    return {k: v for k, v in doc.items() if k != "_id"}


async def respond_to_loi(loi_id: str, seller_id: str, payload: dict) -> dict:
    """Seller responds to formal LOI."""
    doc = await db.formal_lois.find_one({"loi_id": loi_id}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")  # accept, reject, counter, clarification

    update = {"updated_at": now}

    if action == "accept":
        update["status"] = "accepted"
        update["seller_response"] = {"action": "accept", "message": payload.get("message")}
        # Generate milestone if exclusivity was part of LOI
        if doc.get("exclusivity_requested") and doc.get("exclusivity_days"):
            from datetime import timedelta
            start = datetime.now(timezone.utc)
            end = start + timedelta(days=doc["exclusivity_days"])
            update["milestone"] = {
                "exclusivity_start": start.isoformat(),
                "exclusivity_end": end.isoformat(),
                "buyer_selected": doc["buyer_id"],
                "conditions_summary": doc.get("executive_summary", "")[:200],
                "created_at": now,
            }
            # Also update deal exclusivity
            await db.deals.update_one(
                {"deal_id": doc["deal_id"]},
                {"$set": {"exclusivity": {
                    "buyer_id": doc["buyer_id"], "start": start.isoformat(), "end": end.isoformat(),
                    "source": "loi_formal", "loi_id": loi_id,
                }}}
            )

    elif action == "reject":
        update["status"] = "rejected"
        update["seller_response"] = {"action": "reject", "message": payload.get("message")}

    elif action == "counter":
        update["status"] = "countered"
        update["counter_terms"] = {
            "enterprise_value": payload.get("counter_ev"),
            "cash_at_closing": payload.get("counter_cash"),
            "earnout": payload.get("counter_earnout"),
            "exclusivity_days": payload.get("counter_exclusivity_days"),
            "conditions": payload.get("counter_conditions"),
            "message": payload.get("message"),
        }
        update["seller_response"] = {"action": "counter", "message": payload.get("message")}

    elif action == "clarification":
        update["status"] = "clarification_requested"
        update["seller_response"] = {"action": "clarification", "message": payload.get("message")}

    await db.formal_lois.update_one({"loi_id": loi_id}, {"$set": update})
    return {"loi_id": loi_id, "status": update.get("status", doc["status"])}


async def respond_to_counter(loi_id: str, buyer_id: str, payload: dict) -> dict:
    """Buyer responds to seller's counter-offer on LOI."""
    doc = await db.formal_lois.find_one({"loi_id": loi_id, "status": "countered"}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")  # accept, reject, request_meeting, clarification

    if action == "accept":
        await db.formal_lois.update_one(
            {"loi_id": loi_id},
            {"$set": {"status": "accepted", "counter_status": "buyer_accepted", "updated_at": now}}
        )
        return {"loi_id": loi_id, "status": "accepted"}
    elif action == "reject":
        await db.formal_lois.update_one(
            {"loi_id": loi_id},
            {"$set": {"counter_status": "buyer_rejected", "updated_at": now}}
        )
        return {"loi_id": loi_id, "status": "counter_rejected"}
    elif action == "request_meeting":
        # Buyer wants to negotiate face to face
        await db.formal_lois.update_one(
            {"loi_id": loi_id},
            {"$set": {"counter_status": "meeting_requested", "updated_at": now}}
        )
        return {"loi_id": loi_id, "status": "meeting_requested"}
    else:
        await db.formal_lois.update_one(
            {"loi_id": loi_id},
            {"$set": {"counter_status": "clarification_requested", "updated_at": now}}
        )
        return {"loi_id": loi_id, "status": "clarification_requested"}


async def list_lois(deal_id: str) -> list:
    """List all formal LOIs for a deal (for comparator)."""
    cursor = db.formal_lois.find({"deal_id": deal_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(50)
