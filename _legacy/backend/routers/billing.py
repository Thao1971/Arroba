"""
Billing & Invoices module.
Shared between buyer and seller.
Prepared for Stripe integration.
"""
from fastapi import APIRouter, Depends
from database import db
from routers.auth import get_current_user
from models.user import UserResponse
from datetime import datetime, timezone

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/summary")
async def get_billing_summary(user: UserResponse = Depends(get_current_user)):
    """Get billing summary for the current user."""
    # Plan info
    plan_name = "Free"
    plan_price = 0
    if hasattr(user, 'subscription') and user.subscription:
        pt = getattr(user.subscription, 'plan_type', '')
        if pt:
            plan_name = pt.replace('_', ' ').title()

    # Invoices
    invoices = await db.invoices.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    # Payment method
    pm = await db.payment_methods.find_one(
        {"user_id": user.user_id, "is_default": True}, {"_id": 0}
    )

    return {
        "plan": {
            "name": plan_name,
            "price": plan_price,
            "billing_cycle": "monthly",
            "status": "active",
        },
        "payment_method": {
            "type": pm.get("type", "card") if pm else None,
            "last_four": pm.get("last_four") if pm else None,
            "brand": pm.get("brand") if pm else None,
            "expires": pm.get("expires") if pm else None,
            "configured": pm is not None,
        } if pm else {"configured": False},
        "invoices": invoices,
        "total_invoices": len(invoices),
    }
