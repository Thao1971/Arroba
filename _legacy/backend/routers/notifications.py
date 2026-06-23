"""Notifications router — In-app notifications for sellers"""
from fastapi import APIRouter, Depends
from models.user import UserResponse
from routers.auth import get_current_user
from services.notification_service import get_notifications, count_unread, mark_read, mark_all_read

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def list_notifications(
    unread_only: bool = False,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get notifications for current user"""
    notifs = await get_notifications(current_user.user_id, unread_only=unread_only)
    unread = await count_unread(current_user.user_id)
    return {"notifications": notifs, "unread_count": unread}


@router.get("/unread-count")
async def get_unread_count(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get count of unread notifications"""
    count = await count_unread(current_user.user_id)
    return {"unread_count": count}


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Mark a notification as read"""
    ok = await mark_read(notification_id, current_user.user_id)
    return {"marked": ok}


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: UserResponse = Depends(get_current_user)
):
    """Mark all notifications as read"""
    count = await mark_all_read(current_user.user_id)
    return {"marked_count": count}
