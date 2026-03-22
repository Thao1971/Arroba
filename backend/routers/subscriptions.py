from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
from typing import Optional
import os

from database import subscriptions_collection, users_collection, payment_transactions_collection
from models.user import UserResponse
from models.transactions import SubscriptionInDB, SubscriptionPlanType
from routers.auth import get_current_user
from config import SUBSCRIPTION_PLANS, STRIPE_API_KEY
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse
)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get("/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return SUBSCRIPTION_PLANS


@router.post("/create-checkout")
async def create_checkout_session(
    plan_type: SubscriptionPlanType,
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create Stripe checkout session for subscription"""
    if plan_type not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan type")
    
    plan = SUBSCRIPTION_PLANS[plan_type]
    
    # Get host URL from request
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    # Build success/cancel URLs
    origin = request.headers.get("origin", host_url)
    success_url = f"{origin}/dashboard?session_id={{CHECKOUT_SESSION_ID}}&payment=success"
    cancel_url = f"{origin}/pricing?payment=cancelled"
    
    try:
        stripe_checkout = StripeCheckout(
            api_key=STRIPE_API_KEY,
            webhook_url=webhook_url
        )
        
        checkout_request = CheckoutSessionRequest(
            amount=float(plan["price"]),
            currency=plan["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": current_user.user_id,
                "plan_type": plan_type,
                "email": current_user.email
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create pending payment transaction
        await payment_transactions_collection.insert_one({
            "session_id": session.session_id,
            "user_id": current_user.user_id,
            "plan_type": plan_type,
            "amount": plan["price"],
            "currency": plan["currency"],
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(
    session_id: str,
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get checkout session status and update subscription if paid"""
    # Get transaction
    transaction = await payment_transactions_collection.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check if already processed
    if transaction.get("payment_status") == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "message": "Payment already processed"
        }
    
    try:
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(
            api_key=STRIPE_API_KEY,
            webhook_url=webhook_url
        )
        
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        await payment_transactions_collection.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "status": status.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # If paid, create/update subscription
        if status.payment_status == "paid":
            await activate_subscription(
                user_id=transaction["user_id"],
                plan_type=transaction["plan_type"],
                amount=transaction["amount"],
                currency=transaction["currency"],
                session_id=session_id
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check status: {str(e)}")


async def activate_subscription(
    user_id: str,
    plan_type: str,
    amount: float,
    currency: str,
    session_id: str
):
    """Activate subscription after successful payment"""
    now = datetime.now(timezone.utc)
    
    # Create subscription record
    subscription = SubscriptionInDB(
        user_id=user_id,
        plan_type=plan_type,
        status="active",
        price_amount=amount,
        currency=currency,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
        payments=[{
            "stripe_payment_id": session_id,
            "amount": amount,
            "status": "paid",
            "paid_at": now.isoformat()
        }]
    )
    
    sub_dict = subscription.model_dump()
    sub_dict["created_at"] = sub_dict["created_at"].isoformat()
    sub_dict["updated_at"] = sub_dict["updated_at"].isoformat()
    sub_dict["current_period_start"] = sub_dict["current_period_start"].isoformat()
    sub_dict["current_period_end"] = sub_dict["current_period_end"].isoformat()
    
    await subscriptions_collection.insert_one(sub_dict)
    
    # Update user with subscription
    await users_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "subscription_id": subscription.subscription_id,
            "updated_at": now.isoformat()
        }}
    )


@router.get("/status")
async def get_subscription_status(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get current user's subscription status"""
    if not current_user.subscription_id:
        return {"status": "none", "message": "No active subscription"}
    
    subscription = await subscriptions_collection.find_one(
        {"subscription_id": current_user.subscription_id},
        {"_id": 0}
    )
    
    if not subscription:
        return {"status": "none", "message": "Subscription not found"}
    
    return {
        "status": subscription.get("status"),
        "plan_type": subscription.get("plan_type"),
        "current_period_end": subscription.get("current_period_end"),
        "price_amount": subscription.get("price_amount"),
        "currency": subscription.get("currency")
    }


@router.post("/cancel")
async def cancel_subscription(
    current_user: UserResponse = Depends(get_current_user)
):
    """Cancel current subscription"""
    if not current_user.subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription")
    
    await subscriptions_collection.update_one(
        {"subscription_id": current_user.subscription_id},
        {"$set": {
            "status": "cancelled",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Subscription cancelled"}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(
            api_key=STRIPE_API_KEY,
            webhook_url=webhook_url
        )
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            # Update transaction
            await payment_transactions_collection.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"status": "ok"}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
