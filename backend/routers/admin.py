"""
Admin Console Router — Moderacion de Deals + Gestion de Usuarios
Solo accesible por role=admin.
"""
from fastapi import APIRouter, HTTPException, Depends
from database import db
from routers.auth import get_current_user
from models.user import UserResponse
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/admin", tags=["Admin Console"])


def _require_admin(user: UserResponse):
    if user.role != "admin":
        raise HTTPException(403, "Solo administradores")


# ═══ DEAL MODERATION ═══

@router.get("/deals")
async def list_admin_deals(status: str = None, user: UserResponse = Depends(get_current_user)):
    """List all deals with moderation info."""
    _require_admin(user)
    query = {}
    if status:
        query["status"] = status

    cursor = db.deals.find(query, {"_id": 0}).sort("created_at", -1)
    deals = await cursor.to_list(100)

    results = []
    for d in deals:
        comp = await db.companies.find_one({"company_id": d.get("company_id")}, {"_id": 0, "trade_name": 1, "legal_name": 1, "financials": 1})
        seller = await db.users.find_one({"user_id": d.get("owner_id")}, {"_id": 0, "email": 1, "first_name": 1, "last_name": 1})

        teaser = d.get("teaser") or {}
        fins = (comp or {}).get("financials") or []

        # Quality checklist
        checklist = {
            "has_teaser": bool(teaser.get("headline")),
            "has_description": bool(teaser.get("description")),
            "has_financials": len(fins) > 0,
            "has_revenue": any(f.get("revenue", 0) > 0 for f in fins),
            "has_ebitda": any(f.get("ebitda", 0) > 0 for f in fins),
            "has_asking_price": bool(d.get("asking_price")),
            "has_operation_types": bool(d.get("operation_types_allowed")),
        }
        quality_score = sum(checklist.values()) / len(checklist) * 100

        # Flags
        flags = []
        if fins:
            latest = sorted(fins, key=lambda f: f.get("year", 0), reverse=True)[0]
            rev = latest.get("revenue", 0)
            ebt = latest.get("ebitda", 0)
            if rev > 0 and ebt > 0 and (ebt / rev * 100) > 60:
                flags.append({"type": "high_margin", "message": f"Margen EBITDA > 60% ({ebt/rev*100:.0f}%)"})
            if rev > 0 and not (comp or {}).get("employees_count"):
                flags.append({"type": "no_employees", "message": "Revenue sin datos de empleados"})

        results.append({
            "deal_id": d["deal_id"],
            "status": d.get("status"),
            "title": teaser.get("headline") or (comp or {}).get("trade_name") or "Sin titulo",
            "seller_name": f"{(seller or {}).get('first_name', '')} {(seller or {}).get('last_name', '')}".strip(),
            "seller_email": (seller or {}).get("email"),
            "company_name": (comp or {}).get("trade_name") or (comp or {}).get("legal_name"),
            "asking_price": d.get("asking_price"),
            "created_at": d.get("created_at"),
            "published_at": d.get("published_at"),
            "quality_checklist": checklist,
            "quality_score": round(quality_score),
            "flags": flags,
            "engagement_count": len(d.get("lois", [])),
            "nda_count": len(d.get("ndas_signed", [])),
        })

    return results


@router.post("/deals/{deal_id}/approve")
async def approve_deal(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Approve a deal for publication."""
    _require_admin(user)
    deal = await db.deals.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal no encontrado")

    now = datetime.now(timezone.utc).isoformat()
    await db.deals.update_one(
        {"deal_id": deal_id},
        {"$set": {"status": "published", "published_at": now, "updated_at": now, "approved_by": user.user_id},
         "$push": {"status_history": {"status": "published", "changed_at": now, "changed_by": user.user_id, "reason": "Aprobado por admin"}}}
    )
    return {"deal_id": deal_id, "status": "published"}


@router.post("/deals/{deal_id}/reject")
async def reject_deal(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Reject a deal with reason."""
    _require_admin(user)
    reason = data.get("reason", "")
    now = datetime.now(timezone.utc).isoformat()
    await db.deals.update_one(
        {"deal_id": deal_id},
        {"$set": {"status": "draft", "updated_at": now, "rejection_reason": reason},
         "$push": {"status_history": {"status": "rejected", "changed_at": now, "changed_by": user.user_id, "reason": reason}}}
    )

    # Notify seller
    deal = await db.deals.find_one({"deal_id": deal_id}, {"_id": 0, "owner_id": 1})
    if deal:
        await db.notifications.insert_one({
            "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
            "user_id": deal["owner_id"],
            "type": "DEAL_REJECTED",
            "title": "Deal requiere mejoras",
            "message": reason or "Tu deal requiere ajustes antes de ser publicado.",
            "data": {"deal_id": deal_id},
            "read": False,
            "created_at": now,
        })

    return {"deal_id": deal_id, "status": "rejected", "reason": reason}


@router.post("/deals/{deal_id}/flag")
async def flag_deal(deal_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Flag a deal for review."""
    _require_admin(user)
    now = datetime.now(timezone.utc).isoformat()
    flag = {
        "type": data.get("type", "manual_review"),
        "message": data.get("message", "Flagged by admin"),
        "flagged_by": user.user_id,
        "flagged_at": now,
    }
    await db.deals.update_one(
        {"deal_id": deal_id},
        {"$push": {"admin_flags": flag}, "$set": {"updated_at": now}}
    )
    return {"deal_id": deal_id, "flagged": True}


# ═══ USER MANAGEMENT ═══

@router.get("/users")
async def list_admin_users(role: str = None, user: UserResponse = Depends(get_current_user)):
    """List all users with management info."""
    _require_admin(user)
    query = {}
    if role:
        query["role"] = role

    cursor = db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1)
    users = await cursor.to_list(200)

    results = []
    for u in users:
        uid = u["user_id"]

        # Activity stats
        nda_count = await db.nda_signatures.count_documents({"buyer_user_id": uid})
        engagement_count = await db.engagements.count_documents({"buyer_id": uid})
        contact_count = await db.contact_requests.count_documents({"buyer_id": uid})

        sub = u.get("subscription") or {}
        plan = sub.get("plan_type", "free") if isinstance(sub, dict) else "free"

        results.append({
            "user_id": uid,
            "email": u.get("email"),
            "first_name": u.get("first_name"),
            "last_name": u.get("last_name"),
            "role": u.get("role"),
            "plan": plan,
            "is_active": u.get("is_active", True),
            "created_at": u.get("created_at"),
            "last_login": u.get("last_login"),
            "stats": {
                "ndas": nda_count,
                "engagements": engagement_count,
                "contacts": contact_count,
            },
        })

    return results


@router.put("/users/{user_id}/plan")
async def update_user_plan(user_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Change a user's subscription plan."""
    _require_admin(user)
    plan_type = data.get("plan_type")
    if not plan_type:
        raise HTTPException(400, "plan_type requerido")

    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"subscription": {"plan_type": plan_type, "status": "active", "updated_by": user.user_id, "updated_at": now}}}
    )
    return {"user_id": user_id, "plan_type": plan_type}


@router.put("/users/{user_id}/status")
async def update_user_status(user_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Activate or deactivate a user."""
    _require_admin(user)
    is_active = data.get("is_active", True)
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_active": is_active}}
    )
    return {"user_id": user_id, "is_active": is_active}


# ═══ PLATFORM STATS ═══

@router.get("/stats")
async def get_platform_stats(user: UserResponse = Depends(get_current_user)):
    """Get platform overview stats."""
    _require_admin(user)

    deals_total = await db.deals.count_documents({})
    deals_published = await db.deals.count_documents({"status": "published"})
    deals_draft = await db.deals.count_documents({"status": "draft"})
    users_total = await db.users.count_documents({})
    buyers = await db.users.count_documents({"role": "buyer"})
    sellers = await db.users.count_documents({"role": "seller"})
    ndas = await db.nda_signatures.count_documents({})
    contacts = await db.contact_requests.count_documents({})
    engagements = await db.engagements.count_documents({})

    return {
        "deals": {"total": deals_total, "published": deals_published, "draft": deals_draft},
        "users": {"total": users_total, "buyers": buyers, "sellers": sellers},
        "activity": {"ndas": ndas, "contacts": contacts, "engagements": engagements},
    }
