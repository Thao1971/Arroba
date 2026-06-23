"""
PreliminaryOfferAgent — Oferta preliminar estructurada, comparable y reversible.
No es LOI formal. Es una expresion de intencion con estructura economica.
"""
from database import db
from datetime import datetime, timezone
import uuid


async def submit_offer(process_id: str, deal_id: str, buyer_id: str, payload: dict) -> dict:
    """Buyer submits a preliminary offer."""
    now = datetime.now(timezone.utc).isoformat()
    offer_id = f"off_{uuid.uuid4().hex[:12]}"

    # Pre-populate from buyer profile
    buyer = await db.users.find_one({"user_id": buyer_id}, {"_id": 0, "first_name": 1, "last_name": 1, "email": 1, "buyer_profile": 1})
    bp = (buyer or {}).get("buyer_profile", {})

    doc = {
        "offer_id": offer_id,
        "process_id": process_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "status": "submitted",
        # Identity (pre-populated)
        "buyer_entity": payload.get("buyer_entity") or bp.get("company_name") or f"{(buyer or {}).get('first_name','')} {(buyer or {}).get('last_name','')}".strip(),
        "buyer_type": payload.get("buyer_type") or bp.get("buyer_type"),
        # Core economics
        "enterprise_value": payload.get("enterprise_value"),
        "equity_value": payload.get("equity_value"),
        "valuation_basis": payload.get("valuation_basis", "EBITDA x multiplo"),
        "valuation_comment": payload.get("valuation_comment"),
        # Structure
        "operation_type": payload.get("operation_type", "full_sale"),
        "acquisition_pct": payload.get("acquisition_pct", 100),
        "target_structure": payload.get("target_structure"),
        "exclusions": payload.get("exclusions"),
        # Payment
        "cash_at_closing": payload.get("cash_at_closing"),
        "deferred_payment": payload.get("deferred_payment"),
        "earnout": payload.get("earnout"),
        "equity_rollover": payload.get("equity_rollover"),
        # Conditions
        "subject_to_dd": payload.get("subject_to_dd", True),
        "subject_to_approval": payload.get("subject_to_approval", False),
        "subject_to_financing": payload.get("subject_to_financing", False),
        "requests_exclusivity": payload.get("requests_exclusivity", False),
        "exclusivity_days": payload.get("exclusivity_days"),
        "founder_permanence": payload.get("founder_permanence"),
        # Meta
        "validity_date": payload.get("validity_date"),
        "commitment_level": payload.get("commitment_level", "indicative"),
        "executive_summary": payload.get("executive_summary", ""),
        "message": payload.get("message"),
        "legal_accepted": payload.get("legal_accepted", False),
        # Seller response
        "seller_response": None,
        "created_at": now,
        "updated_at": now,
    }

    # Compute completeness
    fields = ["enterprise_value", "operation_type", "acquisition_pct", "cash_at_closing", "validity_date", "executive_summary", "legal_accepted"]
    filled = sum(1 for f in fields if doc.get(f))
    doc["completeness_score"] = round(filled / len(fields) * 100)

    await db.preliminary_offers.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


async def respond_to_offer(offer_id: str, seller_id: str, payload: dict) -> dict:
    """Seller responds to preliminary offer."""
    doc = await db.preliminary_offers.find_one({"offer_id": offer_id}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")  # accept, reject, info_requested, invite_loi

    status_map = {"accept": "accepted", "reject": "rejected", "info_requested": "info_requested", "invite_loi": "upgraded_to_loi"}
    new_status = status_map.get(action, "responded")

    response = {
        "action": action,
        "message": payload.get("message"),
    }

    await db.preliminary_offers.update_one(
        {"offer_id": offer_id},
        {"$set": {"status": new_status, "seller_response": response, "updated_at": now}}
    )

    return {"offer_id": offer_id, "status": new_status, "response": response}


async def list_offers(deal_id: str) -> list:
    """List all offers for a deal (for comparator)."""
    cursor = db.preliminary_offers.find({"deal_id": deal_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(50)
