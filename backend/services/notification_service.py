"""In-app notification service — high-signal events only.
Events: DOCUMENT_DOWNLOADED, DATA_ROOM_ACCESSED (first time), LOI_SUBMITTED, INTEREST_SUBMITTED, NDA_SIGNED"""
from datetime import datetime, timezone
import uuid

from database import notifications_collection


async def create_notification(
    recipient_id: str,
    event_type: str,
    deal_id: str,
    actor_id: str = None,
    actor_name: str = None,
    metadata: dict = None,
):
    """Create an in-app notification for the recipient (seller).
    Groups events within 60s window for the same event_type + deal_id + actor_id."""

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # Grouping: check if there's a recent notification (within 60s) for same event+deal+actor
    cutoff = datetime(now.year, now.month, now.day, now.hour, now.minute - 1 if now.minute > 0 else 0, tzinfo=timezone.utc).isoformat()
    existing = await notifications_collection.find_one({
        "recipient_id": recipient_id,
        "event_type": event_type,
        "deal_id": deal_id,
        "actor_id": actor_id,
        "created_at": {"$gte": cutoff},
    })

    if existing:
        # Group: increment count instead of creating new
        await notifications_collection.update_one(
            {"notification_id": existing["notification_id"]},
            {
                "$inc": {"group_count": 1},
                "$set": {"updated_at": now_iso},
                "$push": {"grouped_meta": metadata or {}},
            }
        )
        return existing["notification_id"]

    notif = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "recipient_id": recipient_id,
        "event_type": event_type,
        "deal_id": deal_id,
        "actor_id": actor_id,
        "actor_name": actor_name or "",
        "metadata": metadata or {},
        "group_count": 1,
        "grouped_meta": [],
        "read": False,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    await notifications_collection.insert_one(notif)
    return notif["notification_id"]


async def get_notifications(user_id: str, unread_only: bool = False, limit: int = 50) -> list:
    """Get notifications for a user, newest first."""
    query = {"recipient_id": user_id}
    if unread_only:
        query["read"] = False
    cursor = notifications_collection.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    return await cursor.to_list(limit)


async def count_unread(user_id: str) -> int:
    """Count unread notifications."""
    return await notifications_collection.count_documents({"recipient_id": user_id, "read": False})


async def mark_read(notification_id: str, user_id: str) -> bool:
    """Mark a single notification as read."""
    result = await notifications_collection.update_one(
        {"notification_id": notification_id, "recipient_id": user_id},
        {"$set": {"read": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return result.modified_count > 0


async def mark_all_read(user_id: str) -> int:
    """Mark all notifications as read for a user."""
    result = await notifications_collection.update_many(
        {"recipient_id": user_id, "read": False},
        {"$set": {"read": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return result.modified_count


# ==========================================
# HIGH-SIGNAL NOTIFICATION TRIGGERS
# ==========================================

async def notify_document_downloaded(deal_owner_id: str, deal_id: str, buyer_id: str, buyer_name: str, doc_name: str, folder: str):
    """Trigger when buyer downloads a document from data room."""
    await create_notification(
        recipient_id=deal_owner_id,
        event_type="DOCUMENT_DOWNLOADED",
        deal_id=deal_id,
        actor_id=buyer_id,
        actor_name=buyer_name,
        metadata={"document_name": doc_name, "folder": folder},
    )


async def notify_dataroom_first_access(deal_owner_id: str, deal_id: str, buyer_id: str, buyer_name: str):
    """Trigger when buyer accesses data room for the FIRST time."""
    # Check if we already notified about this buyer's first access
    existing = await notifications_collection.find_one({
        "recipient_id": deal_owner_id,
        "event_type": "DATA_ROOM_ACCESSED",
        "deal_id": deal_id,
        "actor_id": buyer_id,
    })
    if existing:
        return  # Already notified, skip

    await create_notification(
        recipient_id=deal_owner_id,
        event_type="DATA_ROOM_ACCESSED",
        deal_id=deal_id,
        actor_id=buyer_id,
        actor_name=buyer_name,
    )


async def notify_loi_submitted(deal_owner_id: str, deal_id: str, buyer_id: str, buyer_name: str, valuation: float = None):
    """Trigger when buyer submits an LOI."""
    await create_notification(
        recipient_id=deal_owner_id,
        event_type="LOI_SUBMITTED",
        deal_id=deal_id,
        actor_id=buyer_id,
        actor_name=buyer_name,
        metadata={"valuation_offer": valuation},
    )


async def notify_interest_submitted(deal_owner_id: str, deal_id: str, buyer_id: str, buyer_name: str):
    """Trigger when buyer submits an Interest."""
    await create_notification(
        recipient_id=deal_owner_id,
        event_type="INTEREST_SUBMITTED",
        deal_id=deal_id,
        actor_id=buyer_id,
        actor_name=buyer_name,
    )


async def notify_nda_signed(deal_owner_id: str, deal_id: str, buyer_id: str, buyer_name: str):
    """Trigger when buyer signs NDA."""
    await create_notification(
        recipient_id=deal_owner_id,
        event_type="NDA_SIGNED",
        deal_id=deal_id,
        actor_id=buyer_id,
        actor_name=buyer_name,
    )
