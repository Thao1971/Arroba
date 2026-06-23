"""Event tracking service for analytics metrics"""
from datetime import datetime, timezone
from database import db

events_collection = db.events


async def track_event(event_type: str, deal_id: str = None, user_id: str = None,
                      ip: str = None, metadata: dict = None):
    """Track a platform event for analytics"""
    event = {
        "event_type": event_type,
        "deal_id": deal_id,
        "user_id": user_id,
        "ip": ip,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await events_collection.insert_one(event)


async def get_deal_events(deal_id: str, event_type: str = None) -> list:
    """Get events for a deal"""
    query = {"deal_id": deal_id}
    if event_type:
        query["event_type"] = event_type
    cursor = events_collection.find(query, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(100)


async def get_deal_funnel(deal_id: str) -> dict:
    """Get funnel metrics for a deal"""
    pipeline = [
        {"$match": {"deal_id": deal_id}},
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}}
    ]
    results = await events_collection.aggregate(pipeline).to_list(20)
    funnel = {}
    for r in results:
        funnel[r["_id"]] = r["count"]
    return funnel


async def count_compatible_buyers(sectors: list) -> int:
    """Basic buyer matching: count buyers whose profile overlaps with given sectors"""
    from database import users_collection
    if not sectors:
        return 0
    query = {
        "role": "buyer",
        "$or": [
            {"buyer_profile.sectors_of_interest": {"$in": sectors}},
            {"buyer_profile.taxonomy_categories": {"$in": sectors}},
        ]
    }
    count = await users_collection.count_documents(query)
    return count
