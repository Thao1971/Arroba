"""Time tracking and buyer intent scoring service.
Tracks time spent by buyers on Deal Page, Infomemo, Data Room.
Computes buyer_intent_score (0-100) for seller decision-making."""
from datetime import datetime, timezone
from database import db

time_tracking_collection = db.time_tracking


async def record_time(buyer_id: str, deal_id: str, section: str, duration_seconds: int, session_id: str):
    """Record time spent on a section. Accumulates per session, capped at 30min/session."""
    if section not in ("deal_page", "infomemo", "data_room"):
        return
    if duration_seconds <= 0:
        return

    SESSION_CAP = 1800  # 30 min per session

    # Find existing record for this buyer+deal+section+session
    existing = await time_tracking_collection.find_one({
        "buyer_id": buyer_id,
        "deal_id": deal_id,
        "section": section,
        "session_id": session_id,
    })

    if existing:
        new_total = min(existing.get("session_seconds", 0) + duration_seconds, SESSION_CAP)
        await time_tracking_collection.update_one(
            {"buyer_id": buyer_id, "deal_id": deal_id, "section": section, "session_id": session_id},
            {"$set": {"session_seconds": new_total, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        capped = min(duration_seconds, SESSION_CAP)
        await time_tracking_collection.insert_one({
            "buyer_id": buyer_id,
            "deal_id": deal_id,
            "section": section,
            "session_id": session_id,
            "session_seconds": capped,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })


async def get_time_summary(buyer_id: str, deal_id: str) -> dict:
    """Get aggregated time per section for a buyer+deal."""
    pipeline = [
        {"$match": {"buyer_id": buyer_id, "deal_id": deal_id}},
        {"$group": {
            "_id": "$section",
            "total_seconds": {"$sum": "$session_seconds"},
            "session_count": {"$sum": 1},
            "first_session": {"$min": "$created_at"},
        }}
    ]
    cursor = time_tracking_collection.aggregate(pipeline)
    results = await cursor.to_list(10)

    summary = {"deal_page": 0, "infomemo": 0, "data_room": 0, "total": 0, "sessions": 0}
    first_session = None
    for r in results:
        section = r["_id"]
        summary[section] = r["total_seconds"]
        summary["total"] += r["total_seconds"]
        summary["sessions"] += r["session_count"]
        if first_session is None or r["first_session"] < first_session:
            first_session = r["first_session"]
    summary["first_session_time"] = first_session
    return summary


async def get_deal_time_summaries(deal_id: str) -> dict:
    """Get time summaries for ALL buyers on a deal (for seller view)."""
    pipeline = [
        {"$match": {"deal_id": deal_id}},
        {"$group": {
            "_id": {"buyer_id": "$buyer_id", "section": "$section"},
            "total_seconds": {"$sum": "$session_seconds"},
            "session_count": {"$sum": 1},
        }}
    ]
    cursor = time_tracking_collection.aggregate(pipeline)
    results = await cursor.to_list(500)

    by_buyer = {}
    for r in results:
        bid = r["_id"]["buyer_id"]
        section = r["_id"]["section"]
        if bid not in by_buyer:
            by_buyer[bid] = {"deal_page": 0, "infomemo": 0, "data_room": 0, "total": 0}
        by_buyer[bid][section] = r["total_seconds"]
        by_buyer[bid]["total"] += r["total_seconds"]
    return by_buyer


async def compute_intent_score(buyer_id: str, deal_id: str) -> dict:
    """Compute buyer_intent_score (0-100) based on multiple signals.
    Returns score, level (alta/media/baja), and factor breakdown."""

    score = 0
    factors = []

    # 1. LOI submitted → +40
    eng = await db.engagements.find_one({
        "buyer_id": buyer_id, "deal_id": deal_id, "type": "LOI"
    })
    if eng:
        score += 40
        factors.append({"factor": "LOI enviada", "points": 40})

    # 2. Data Room downloads → +20 (capped)
    dr_downloads = await db.dataroom_access_log.count_documents({
        "buyer_id": buyer_id, "deal_id": deal_id, "action": "DOWNLOAD"
    })
    if dr_downloads > 0:
        download_points = min(dr_downloads * 4, 20)
        score += download_points
        factors.append({"factor": f"{dr_downloads} descargas Data Room", "points": download_points})

    # 3. Data Room accessed (≥1) → +10
    dr_accessed = await db.dataroom_access_log.count_documents({
        "buyer_id": buyer_id, "deal_id": deal_id, "action": "DATA_ROOM_ACCESSED"
    })
    if dr_accessed > 0:
        score += 10
        factors.append({"factor": "Accedió al Data Room", "points": 10})

    # 4. Time in Data Room (≥15 min) → +15
    time_data = await get_time_summary(buyer_id, deal_id)
    if time_data["data_room"] >= 900:  # 15 min
        score += 15
        factors.append({"factor": f"{time_data['data_room'] // 60} min en Data Room", "points": 15})
    elif time_data["data_room"] >= 300:  # 5 min partial
        partial = min(int(time_data["data_room"] / 900 * 15), 15)
        score += partial
        factors.append({"factor": f"{time_data['data_room'] // 60} min en Data Room", "points": partial})

    # 5. Time in Infomemo (≥10 min) → +10
    if time_data["infomemo"] >= 600:  # 10 min
        score += 10
        factors.append({"factor": f"{time_data['infomemo'] // 60} min en Infomemo", "points": 10})
    elif time_data["infomemo"] >= 180:  # 3 min partial
        partial = min(int(time_data["infomemo"] / 600 * 10), 10)
        score += partial
        factors.append({"factor": f"{time_data['infomemo'] // 60} min en Infomemo", "points": partial})

    # 6. Matching alto → +5
    try:
        from services.matching_service import get_recommended_deals_for_buyer
        user = await db.users.find_one({"user_id": buyer_id}, {"_id": 0})
        if user and user.get("buyer_profile", {}).get("profile_complete"):
            deals_match = await get_recommended_deals_for_buyer(buyer_id)
            for dm in deals_match.get("deals", []):
                if dm.get("deal_id") == deal_id and dm.get("affinity") == "high":
                    score += 5
                    factors.append({"factor": "Alta afinidad matching", "points": 5})
                    break
    except Exception:
        pass

    # Cap at 100
    score = min(score, 100)

    # Determine level
    if score >= 55:
        level = "alta"
        label = "Alta intención"
    elif score >= 25:
        level = "media"
        label = "Media intención"
    else:
        level = "baja"
        label = "Baja intención"

    return {
        "score": score,
        "level": level,
        "label": label,
        "factors": factors,
        "time_summary": {
            "deal_page": time_data["deal_page"],
            "infomemo": time_data["infomemo"],
            "data_room": time_data["data_room"],
            "total": time_data["total"],
        }
    }


async def get_deal_intent_scores(deal_id: str) -> list:
    """Get intent scores for ALL buyers with engagement on a deal."""
    engagements = await db.engagements.find(
        {"deal_id": deal_id}, {"_id": 0, "buyer_id": 1}
    ).to_list(100)

    buyer_ids = list(set(e["buyer_id"] for e in engagements))
    results = []
    for bid in buyer_ids:
        intent = await compute_intent_score(bid, deal_id)
        results.append({"buyer_id": bid, **intent})

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results
