"""Match alerts service — Scaffolding for NEW_MATCH_FOUND events and weekly digest.
IMPORTANT: No actual email sending (SendGrid) is integrated yet. This is placeholder logic only."""
from datetime import datetime, timezone
from database import db
from services.events_service import track_event

match_alerts_collection = db.match_alerts


async def trigger_new_match_found(buyer_id: str, deal_id: str, affinity: str, match_score: int):
    """
    Record a NEW_MATCH_FOUND event when a new deal matches a buyer profile.
    This is a placeholder — no email is sent yet.
    """
    alert = {
        "buyer_id": buyer_id,
        "deal_id": deal_id,
        "affinity": affinity,
        "match_score": match_score,
        "alert_type": "NEW_MATCH_FOUND",
        "status": "pending",  # pending -> sent (when email integration is added)
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await match_alerts_collection.insert_one(alert)
    await track_event("NEW_MATCH_FOUND", deal_id=deal_id, user_id=buyer_id,
                       metadata={"affinity": affinity, "match_score": match_score})


async def get_pending_digest(buyer_id: str) -> list:
    """Get pending match alerts for a buyer (for future weekly digest)."""
    cursor = match_alerts_collection.find(
        {"buyer_id": buyer_id, "status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1)
    return await cursor.to_list(50)


async def mark_alerts_sent(buyer_id: str):
    """Mark all pending alerts as sent (for future digest sending)."""
    await match_alerts_collection.update_many(
        {"buyer_id": buyer_id, "status": "pending"},
        {"$set": {"status": "sent", "sent_at": datetime.now(timezone.utc).isoformat()}}
    )


async def check_and_trigger_matches_for_deal(deal_id: str):
    """
    When a deal is published or updated, check all buyers with complete profiles
    and trigger NEW_MATCH_FOUND for high/medium affinity matches.
    """
    from services.matching_service import compute_match_score, _score_to_affinity
    from database import deals_collection, companies_collection, users_collection

    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        return

    company = await companies_collection.find_one(
        {"company_id": deal.get("company_id")}, {"_id": 0}
    )
    if not company:
        return

    cursor = users_collection.find(
        {"role": "buyer", "buyer_profile.profile_complete": True},
        {"_id": 0}
    )
    buyers = await cursor.to_list(500)

    for buyer in buyers:
        match = await compute_match_score(buyer["buyer_profile"], deal, company)
        if match["affinity"] in ("high", "medium"):
            # Check if alert already exists for this buyer-deal pair
            existing = await match_alerts_collection.find_one(
                {"buyer_id": buyer["user_id"], "deal_id": deal_id, "alert_type": "NEW_MATCH_FOUND"}
            )
            if not existing:
                await trigger_new_match_found(
                    buyer["user_id"], deal_id, match["affinity"], match["match_score"]
                )


async def check_and_trigger_matches_for_buyer(buyer_id: str):
    """
    When a buyer completes/updates their profile, check all published deals
    and trigger NEW_MATCH_FOUND for high/medium affinity matches.
    """
    from services.matching_service import compute_match_score
    from database import deals_collection, companies_collection, users_collection

    user = await users_collection.find_one({"user_id": buyer_id}, {"_id": 0})
    if not user or not user.get("buyer_profile", {}).get("profile_complete"):
        return

    buyer_profile = user["buyer_profile"]
    cursor = deals_collection.find(
        {"status": {"$in": ["published", "nda", "evaluation"]}},
        {"_id": 0}
    )
    deals = await cursor.to_list(100)

    for deal in deals:
        company = await companies_collection.find_one(
            {"company_id": deal.get("company_id")}, {"_id": 0}
        )
        if not company:
            continue

        match = await compute_match_score(buyer_profile, deal, company)
        if match["affinity"] in ("high", "medium"):
            existing = await match_alerts_collection.find_one(
                {"buyer_id": buyer_id, "deal_id": deal["deal_id"], "alert_type": "NEW_MATCH_FOUND"}
            )
            if not existing:
                await trigger_new_match_found(
                    buyer_id, deal["deal_id"], match["affinity"], match["match_score"]
                )
