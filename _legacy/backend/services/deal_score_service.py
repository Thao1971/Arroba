"""
Deal Score & Signals Service
- Internal score (0-100): ordering, signal selection. NEVER shown to users.
- Signals: max 2 per deal, ordered by hierarchy. Designed to create market pressure.

Signal hierarchy (highest to lowest priority):
1. LOI — "X LOIs recibidas"
2. Competition — "Varios buyers evaluando"
3. Process — "En fase avanzada" / "En negociacion"
4. DR Activity — "Revision activa de documentacion"
5. Freshness — "Nuevo esta semana" / "Interes reciente"
"""
from datetime import datetime, timezone, timedelta
from database import engagements_collection, db

time_tracking_collection = db.time_tracking


async def compute_signals_batch(deals: list) -> dict:
    """
    Compute signals + internal score for a batch of deals.
    Returns: {deal_id: {"signals": [...], "score": int}}
    Optimized: batch queries instead of N+1.
    """
    if not deals:
        return {}

    deal_ids = [d["deal_id"] for d in deals]
    now = datetime.now(timezone.utc)
    seven_days_ago = (now - timedelta(days=7)).isoformat()

    # --- Batch queries ---

    # 1. Engagements per deal (count by type, excluding REJECTED)
    eng_pipeline = [
        {"$match": {"deal_id": {"$in": deal_ids}, "stage": {"$ne": "REJECTED"}}},
        {"$group": {
            "_id": {"deal_id": "$deal_id", "type": "$type"},
            "count": {"$sum": 1}
        }}
    ]
    eng_results = await engagements_collection.aggregate(eng_pipeline).to_list(500)

    eng_map = {}  # deal_id -> {loi_count, interest_count}
    for r in eng_results:
        did = r["_id"]["deal_id"]
        if did not in eng_map:
            eng_map[did] = {"loi_count": 0, "interest_count": 0}
        if r["_id"]["type"] == "LOI":
            eng_map[did]["loi_count"] = r["count"]
        else:
            eng_map[did]["interest_count"] = r["count"]

    # 2. Recent engagements (created in last 7 days)
    recent_eng_pipeline = [
        {"$match": {
            "deal_id": {"$in": deal_ids},
            "created_at": {"$gte": seven_days_ago},
            "stage": {"$ne": "REJECTED"}
        }},
        {"$group": {
            "_id": {"deal_id": "$deal_id", "type": "$type"},
            "count": {"$sum": 1}
        }}
    ]
    recent_eng_results = await engagements_collection.aggregate(recent_eng_pipeline).to_list(500)

    recent_eng_map = {}
    for r in recent_eng_results:
        did = r["_id"]["deal_id"]
        if did not in recent_eng_map:
            recent_eng_map[did] = {"recent_loi": 0, "recent_interest": 0}
        if r["_id"]["type"] == "LOI":
            recent_eng_map[did]["recent_loi"] = r["count"]
        else:
            recent_eng_map[did]["recent_interest"] = r["count"]

    # 3. Recent DR activity (last 7 days)
    dr_pipeline = [
        {"$match": {
            "deal_id": {"$in": deal_ids},
            "timestamp": {"$gte": seven_days_ago}
        }},
        {"$group": {"_id": "$deal_id", "count": {"$sum": 1}}}
    ]
    try:
        dr_results = await db.dataroom_access_log.aggregate(dr_pipeline).to_list(500)
    except Exception:
        dr_results = []

    dr_map = {r["_id"]: r["count"] for r in dr_results}

    # 4. Recent time tracking (last 7 days)
    tt_pipeline = [
        {"$match": {
            "deal_id": {"$in": deal_ids},
            "updated_at": {"$gte": seven_days_ago}
        }},
        {"$group": {"_id": "$deal_id", "count": {"$sum": 1}}}
    ]
    try:
        tt_results = await time_tracking_collection.aggregate(tt_pipeline).to_list(500)
    except Exception:
        tt_results = []

    tt_map = {r["_id"]: r["count"] for r in tt_results}

    # --- Process each deal ---
    results = {}
    for deal in deals:
        did = deal["deal_id"]

        engs = eng_map.get(did, {"loi_count": 0, "interest_count": 0})
        recent_engs = recent_eng_map.get(did, {"recent_loi": 0, "recent_interest": 0})

        # NDA count from deal document (real commitment)
        nda_count = len(deal.get("ndas_signed", []))

        # Active buyers = NDA holders (minimum bar for "evaluando")
        active_buyers = nda_count

        # Process stage
        shortlist = deal.get("shortlist") or {}
        exclusivity = deal.get("exclusivity") or {}
        has_shortlist = bool(shortlist.get("buyers"))
        has_exclusivity = bool(exclusivity.get("buyer_id"))

        # Freshness
        published_at = deal.get("published_at")
        days_since_published = 999
        if published_at:
            if isinstance(published_at, str):
                try:
                    pub_dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                except Exception:
                    pub_dt = now
            else:
                pub_dt = published_at
            days_since_published = (now - pub_dt).days

        # Recent activity (DR + time tracking)
        recent_dr = dr_map.get(did, 0)
        recent_tt = tt_map.get(did, 0)
        recent_activity_count = recent_dr + recent_tt

        data = {
            "loi_count": engs["loi_count"],
            "interest_count": engs["interest_count"],
            "active_buyers": active_buyers,
            "has_shortlist": has_shortlist,
            "has_exclusivity": has_exclusivity,
            "days_since_published": days_since_published,
            "recent_dr": recent_dr,
            "recent_tt": recent_tt,
            "recent_activity": recent_activity_count,
            "recent_loi": recent_engs["recent_loi"],
            "recent_interest": recent_engs["recent_interest"],
        }

        signals = _compute_signals(data)
        score = _compute_score(data)

        results[did] = {"signals": signals, "score": score}

    return results


def _compute_signals(data: dict) -> list:
    """
    Generate ordered signals (max 2) based on priority hierarchy.
    Each signal answers: "por que deberia moverme ahora?"
    """
    signals = []

    # --- Priority 1: LOI (strongest signal) ---
    lc = data["loi_count"]
    if lc > 0:
        signals.append({
            "type": "loi",
            "text": f"LOI{'s' if lc > 1 else ''} recibida{'s' if lc > 1 else ''}",
            "color": "red",
        })

    # --- Priority 2: Competition ---
    ab = data["active_buyers"]
    if ab >= 3:
        signals.append({
            "type": "competition",
            "text": "Varios buyers evaluando",
            "color": "amber",
        })
    elif ab >= 2:
        signals.append({
            "type": "competition",
            "text": "Varias partes interesadas",
            "color": "amber",
        })

    if len(signals) >= 2:
        return signals[:2]

    # --- Priority 3: Process stage ---
    if data["has_exclusivity"]:
        signals.append({
            "type": "process",
            "text": "En negociacion",
            "color": "amber",
        })
    elif data["has_shortlist"]:
        signals.append({
            "type": "process",
            "text": "En fase avanzada",
            "color": "amber",
        })

    if len(signals) >= 2:
        return signals[:2]

    # --- Priority 4: DR Activity (recent) ---
    if data["recent_dr"] > 0:
        signals.append({
            "type": "dr_activity",
            "text": "Revision activa de documentacion",
            "color": "blue",
        })

    if len(signals) >= 2:
        return signals[:2]

    # --- Priority 5: Freshness ---
    if data["recent_loi"] > 0:
        signals.append({
            "type": "freshness",
            "text": "LOI recibida esta semana",
            "color": "green",
        })
    elif data["days_since_published"] <= 7:
        signals.append({
            "type": "freshness",
            "text": "Nuevo esta semana",
            "color": "green",
        })
    elif data["recent_interest"] > 0:
        signals.append({
            "type": "freshness",
            "text": "Interes reciente",
            "color": "green",
        })

    return signals[:2]


def _compute_score(data: dict) -> int:
    """
    Internal deal score (0-100). Used for:
    - Marketplace ordering (most active deals first)
    - Signal selection priority
    NEVER shown as a number to users.
    """
    score = 0

    # LOIs — max 35 points
    score += min(data["loi_count"] * 18, 35)

    # Active buyers (NDA holders) — max 25 points
    score += min(data["active_buyers"] * 6, 25)

    # Stage advancement — max 10 points
    if data["has_exclusivity"]:
        score += 10
    elif data["has_shortlist"]:
        score += 6

    # Freshness — max 15 points
    days = data["days_since_published"]
    if days <= 7:
        score += 15
    elif days <= 14:
        score += 10
    elif days <= 30:
        score += 5

    # Recent activity (7d) — max 15 points
    score += min(data["recent_activity"] * 3, 15)

    return min(score, 100)
