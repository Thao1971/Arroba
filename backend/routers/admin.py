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

def _compute_deal_quality(teaser: dict, fins: list) -> tuple:
    """Compute quality checklist and score for a deal."""
    checklist = {
        "has_teaser": bool(teaser.get("headline")),
        "has_description": bool(teaser.get("description")),
        "has_financials": len(fins) > 0,
        "has_revenue": any(f.get("revenue", 0) > 0 for f in fins),
        "has_ebitda": any(f.get("ebitda", 0) > 0 for f in fins),
        "has_asking_price": False,
        "has_operation_types": False,
    }
    score = sum(checklist.values()) / max(len(checklist), 1) * 100
    return checklist, round(score)


def _compute_deal_flags(fins: list, comp: dict) -> list:
    """Detect suspicious data in a deal."""
    flags = []
    if fins:
        latest = sorted(fins, key=lambda f: f.get("year", 0), reverse=True)[0]
        rev = latest.get("revenue", 0)
        ebt = latest.get("ebitda", 0)
        if rev > 0 and ebt > 0 and (ebt / rev * 100) > 60:
            flags.append({"type": "high_margin", "message": f"Margen EBITDA > 60% ({ebt/rev*100:.0f}%)"})
        if rev > 0 and not (comp or {}).get("employees_count"):
            flags.append({"type": "no_employees", "message": "Revenue sin datos de empleados"})
    return flags


@router.get("/deals")
async def list_admin_deals(status: str = None, user: UserResponse = Depends(get_current_user)):
    """List all deals with moderation info."""
    _require_admin(user)
    query = {"status": status} if status else {}

    cursor = db.deals.find(query, {"_id": 0}).sort("created_at", -1)
    deals = await cursor.to_list(100)

    results = []
    for d in deals:
        comp = await db.companies.find_one({"company_id": d.get("company_id")}, {"_id": 0, "trade_name": 1, "legal_name": 1, "financials": 1, "employees_count": 1})
        seller = await db.users.find_one({"user_id": d.get("owner_id")}, {"_id": 0, "email": 1, "first_name": 1, "last_name": 1})

        teaser = d.get("teaser") or {}
        fins = (comp or {}).get("financials") or []

        checklist, quality_score = _compute_deal_quality(teaser, fins)
        checklist["has_asking_price"] = bool(d.get("asking_price"))
        checklist["has_operation_types"] = bool(d.get("operation_types_allowed"))
        quality_score = round(sum(checklist.values()) / max(len(checklist), 1) * 100)

        flags = _compute_deal_flags(fins, comp)

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
            "quality_score": quality_score,
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


# ═══ PLATFORM HEALTH ═══

@router.get("/health")
async def get_platform_health(user: UserResponse = Depends(get_current_user)):
    """Detailed platform health: stale deals, incomplete sellers, funnel, activity by plan."""
    _require_admin(user)
    from datetime import timedelta

    now_dt = datetime.now(timezone.utc)
    seven_days_ago = (now_dt - timedelta(days=7)).isoformat()
    two_days_ago = (now_dt - timedelta(days=2)).isoformat()

    # Stale deals (published, no activity in 7 days)
    stale_deals = []
    cursor = db.deals.find({"status": "published"}, {"_id": 0, "deal_id": 1, "updated_at": 1, "teaser.headline": 1})
    async for d in cursor:
        if d.get("updated_at", "") < seven_days_ago:
            stale_deals.append({"deal_id": d["deal_id"], "title": d.get("teaser", {}).get("headline", "?"), "last_update": d.get("updated_at")})

    # Incomplete seller workspaces
    incomplete_sellers = []
    cursor2 = db.seller_company_profiles.find({"profile_readiness": {"$lt": 80}}, {"_id": 0, "profile_id": 1, "seller_id": 1, "profile_readiness": 1, "panel_status": 1})
    async for p in cursor2:
        seller = await db.users.find_one({"user_id": p["seller_id"]}, {"_id": 0, "email": 1, "first_name": 1})
        incomplete_sellers.append({"profile_id": p["profile_id"], "seller": (seller or {}).get("email"), "readiness": p.get("profile_readiness", 0), "panels": p.get("panel_status")})

    # Free buyers never advanced
    free_stuck = await db.users.count_documents({"role": "buyer", "$or": [{"subscription": None}, {"subscription.plan_type": "free"}, {"subscription": {"$exists": False}}]})
    total_buyers = await db.users.count_documents({"role": "buyer"})

    # Pending NDAs > 7 days (no signature after contact accepted)
    pending_nda_deals = []
    cursor3 = db.contact_requests.find({"status": "accepted"}, {"_id": 0, "deal_id": 1, "buyer_id": 1, "updated_at": 1})
    async for cr in cursor3:
        nda = await db.nda_signatures.find_one({"deal_id": cr["deal_id"], "buyer_user_id": cr["buyer_id"], "status": "signed"})
        if not nda and cr.get("updated_at", "") < seven_days_ago:
            pending_nda_deals.append({"deal_id": cr["deal_id"], "buyer_id": cr["buyer_id"], "accepted_at": cr.get("updated_at")})

    # Unanswered contact requests > 48h
    unanswered = []
    cursor4 = db.contact_requests.find({"status": "pending"}, {"_id": 0, "request_id": 1, "deal_id": 1, "buyer_id": 1, "created_at": 1})
    async for cr in cursor4:
        if cr.get("created_at", "") < two_days_ago:
            unanswered.append({"request_id": cr["request_id"], "deal_id": cr["deal_id"], "buyer_id": cr["buyer_id"], "waiting_since": cr.get("created_at")})

    # Funnel
    registered = await db.users.count_documents({"role": "buyer"})
    contacted = len(set([cr["buyer_id"] async for cr in db.contact_requests.find({}, {"buyer_id": 1})]))
    nda_signed = len(set([n["buyer_user_id"] async for n in db.nda_signatures.find({"status": "signed"}, {"buyer_user_id": 1})]))
    loi_sent = await db.engagements.count_documents({"type": "LOI"})

    # Activity by plan
    plan_activity = {}
    for plan_label, plan_filter in [("free", {"$or": [{"subscription": None}, {"subscription.plan_type": "free"}]}), ("pro", {"subscription.plan_type": "buyer_pro"}), ("pro+", {"subscription.plan_type": "buyer_proplus"})]:
        count = await db.users.count_documents({"role": "buyer", **plan_filter})
        plan_activity[plan_label] = {"users": count}

    return {
        "stale_deals": stale_deals,
        "stale_deals_count": len(stale_deals),
        "incomplete_sellers": incomplete_sellers,
        "incomplete_sellers_count": len(incomplete_sellers),
        "free_stuck": {"count": free_stuck, "total_buyers": total_buyers, "pct": round(free_stuck / max(total_buyers, 1) * 100)},
        "pending_nda": pending_nda_deals,
        "pending_nda_count": len(pending_nda_deals),
        "unanswered_contacts": unanswered,
        "unanswered_count": len(unanswered),
        "funnel": {"registered": registered, "contacted": contacted, "nda_signed": nda_signed, "loi_sent": loi_sent},
        "plan_distribution": plan_activity,
    }


# ═══ TAXONOMY & MULTIPLES ═══

@router.get("/taxonomy/multiples")
async def list_multiples(user: UserResponse = Depends(get_current_user)):
    """List all valuation multiples by category."""
    _require_admin(user)
    cursor = db.valuation_multiples.find({}, {"_id": 0}).sort("scope_name", 1)
    return await cursor.to_list(50)


@router.put("/taxonomy/multiples/{scope_id}")
async def update_multiple(scope_id: str, data: dict, user: UserResponse = Depends(get_current_user)):
    """Update multiples for a category. Returns impact preview."""
    _require_admin(user)

    existing = await db.valuation_multiples.find_one({"scope_id": scope_id}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Categoria no encontrada")

    now = datetime.now(timezone.utc).isoformat()
    update = {}
    for field in ["multiple_min", "multiple_mid", "multiple_max"]:
        if field in data:
            update[field] = float(data[field])
    update["updated_by"] = user.user_id
    update["updated_at"] = now

    # Impact preview: how many deals would change
    old_mid = existing.get("multiple_mid", 4.5)
    new_mid = update.get("multiple_mid", old_mid)

    await db.valuation_multiples.update_one({"scope_id": scope_id}, {"$set": update})

    # Log change
    await db.admin_audit_log.insert_one({
        "action": "multiple_update",
        "scope_id": scope_id,
        "old_values": {k: existing.get(k) for k in ["multiple_min", "multiple_mid", "multiple_max"]},
        "new_values": {k: update.get(k) for k in ["multiple_min", "multiple_mid", "multiple_max"] if k in update},
        "changed_by": user.user_id,
        "changed_at": now,
    })

    return {"scope_id": scope_id, "updated": True, "old_mid": old_mid, "new_mid": new_mid}


@router.get("/taxonomy/multiples/history")
async def get_multiples_history(user: UserResponse = Depends(get_current_user)):
    """Get audit log of multiple changes."""
    _require_admin(user)
    cursor = db.admin_audit_log.find({"action": "multiple_update"}, {"_id": 0}).sort("changed_at", -1).limit(50)
    return await cursor.to_list(50)


# ═══ NDA & LEGAL ═══

@router.get("/ndas")
async def list_all_ndas(user: UserResponse = Depends(get_current_user)):
    """List all NDA signatures for governance."""
    _require_admin(user)
    cursor = db.nda_signatures.find({}, {"_id": 0, "rendered_text": 0}).sort("signed_at", -1)
    return await cursor.to_list(200)


# ═══ COMMUNICATIONS LOG ═══

@router.get("/notifications/log")
async def list_notification_log(user: UserResponse = Depends(get_current_user)):
    """List all notifications sent (comms audit)."""
    _require_admin(user)
    cursor = db.notifications.find({}, {"_id": 0}).sort("created_at", -1).limit(100)
    return await cursor.to_list(100)

