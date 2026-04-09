"""
Deal Presentation Router
Endpoint del orquestador + seller contact policy.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from database import db
from routers.auth import get_current_user
from models.user import UserResponse
from services.deal_presentation.orchestrator import orchestrate_presentation
from services.deal_presentation.premium_quant import compute_premium_kpis
from services.deal_presentation.premium_benchmark import compute_benchmark
from services.deal_presentation.premium_intelligence import generate_premium_analysis
from services.deal_presentation.access_rules import get_buyer_tier_from_plan
from datetime import datetime, timezone

router = APIRouter(tags=["Deal Presentation"])


@router.get("/deals/{deal_id}/presentation")
async def get_deal_presentation(deal_id: str, request: Request, user: UserResponse = Depends(get_current_user)):
    """Orchestrate and return the full deal presentation for a buyer."""
    if user.role not in ("buyer", "admin"):
        raise HTTPException(403, "Solo buyers pueden consultar la presentacion de un deal")

    result = await orchestrate_presentation(deal_id, user.user_id)
    if not result:
        raise HTTPException(404, "Deal no encontrado")

    return result


@router.get("/deals/{deal_id}/premium-analysis")
async def get_premium_analysis(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Separate endpoint for GPT-5.2 premium analysis. Cached in DB, invalidated on deal update."""
    if user.role not in ("buyer", "admin"):
        raise HTTPException(403, "Solo buyers")

    buyer_doc = await db.users.find_one({"user_id": user.user_id}, {"subscription": 1})
    sub = (buyer_doc or {}).get("subscription") or {}
    pt = sub.get("plan_type", "") if isinstance(sub, dict) else ""
    tier = get_buyer_tier_from_plan(pt)
    if tier != "pro+":
        raise HTTPException(403, "Solo disponible para Pro+")

    nda = await db.nda_signatures.find_one(
        {"deal_id": deal_id, "buyer_user_id": user.user_id, "status": "signed"}, {"_id": 0}
    )
    if not nda:
        raise HTTPException(403, "Requiere NDA firmado")

    # Check cache first
    deal = await db.deals.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal no encontrado")

    deal_updated = deal.get("updated_at", "")
    cached = await db.premium_analysis_cache.find_one(
        {"deal_id": deal_id}, {"_id": 0}
    )
    if cached and cached.get("deal_updated_at") == deal_updated and cached.get("analysis"):
        return cached["analysis"]

    # Generate fresh analysis
    company = await db.companies.find_one({"company_id": deal.get("company_id")}, {"_id": 0}) if deal.get("company_id") else None
    profile = await db.seller_company_profiles.find_one({"company_id": deal.get("company_id")}, {"_id": 0}) if deal.get("company_id") else None

    ap = (profile or {}).get("auto_prefilled", {}) if profile else {}
    cis_fins = ap.get("financials") or (company or {}).get("financials") or []
    category = ap.get("taxonomy", {}).get("category") or ""
    employees = int((profile or {}).get("seller_overrides", {}).get("employees_count") or (company or {}).get("employees_count") or 0) or None

    quant = compute_premium_kpis(cis_fins, employees) if cis_fins else {"available": False}
    benchmark = await compute_benchmark(cis_fins, category, employees) if cis_fins else {"available": False}

    teaser = deal.get("teaser") or {}
    overrides = (profile or {}).get("seller_overrides", {}) if profile else {}
    summary = {
        "title": teaser.get("headline") or (company or {}).get("trade_name"),
        "sector": category,
        "city": (company or {}).get("city"),
        "employees": employees,
        "revenue": cis_fins[0].get("pnl", {}).get("revenue") if cis_fins and cis_fins[0].get("pnl") else (company or {}).get("financials", [{}])[0].get("revenue") if (company or {}).get("financials") else None,
        "ebitda": cis_fins[0].get("pnl", {}).get("ebitda") if cis_fins and cis_fins[0].get("pnl") else None,
        "asking_price": deal.get("asking_price"),
    }

    qualitative = None
    if profile:
        qd = {}
        for k in ["founder_dependency", "recurring_revenue_pct", "client_concentration_top5", "client_diversification", "margin_stability"]:
            if overrides.get(k):
                qd[k] = overrides[k]
        qualitative = qd if qd else None

    analysis = await generate_premium_analysis(summary, quant, benchmark, qualitative)

    # Cache the result
    now = datetime.now(timezone.utc).isoformat()
    await db.premium_analysis_cache.update_one(
        {"deal_id": deal_id},
        {"$set": {"deal_id": deal_id, "deal_updated_at": deal_updated, "analysis": analysis, "cached_at": now}},
        upsert=True,
    )

    return analysis


@router.post("/deals/presentations/batch")
async def get_batch_presentations(data: dict, user: UserResponse = Depends(get_current_user)):
    """Get lightweight card presentations for multiple deals."""
    if user.role not in ("buyer", "admin"):
        raise HTTPException(403, "Solo buyers")

    deal_ids = data.get("deal_ids", [])[:20]
    if not deal_ids:
        return []

    # Get buyer tier
    buyer_doc = await db.users.find_one({"user_id": user.user_id}, {"subscription": 1})
    sub = (buyer_doc or {}).get("subscription") or {}
    pt = sub.get("plan_type", "") if isinstance(sub, dict) else ""
    from services.deal_presentation.access_rules import get_buyer_tier_from_plan, compute_visibility_state
    tier = get_buyer_tier_from_plan(pt)

    results = []
    for did in deal_ids:
        # Minimal queries per deal
        contact = await db.contact_requests.find_one(
            {"deal_id": did, "buyer_id": user.user_id, "status": {"$in": ["pending", "accepted"]}},
            {"_id": 0, "status": 1},
        )
        contact_state = contact.get("status") if contact else None

        nda = await db.nda_signatures.find_one(
            {"deal_id": did, "buyer_user_id": user.user_id, "status": "signed"},
            {"_id": 0},
        )
        has_nda = bool(nda)

        vis = compute_visibility_state(tier, contact_state, has_nda)

        # CTA for card
        if vis == "LOCKED_CONTACT_REQUIRED":
            cta = {"action": "contact_request", "label": "Contactar" if tier != "free" else "Contactar para ampliar"}
        elif vis == "CONTACT_REQUESTED":
            cta = {"action": "wait", "label": "Solicitud enviada"}
        elif vis == "TEASER_UNLOCKED":
            cta = {"action": "view_teaser", "label": "Ver teaser"}
        elif vis == "NDA_AVAILABLE":
            cta = {"action": "sign_nda", "label": "Firmar NDA"}
        else:
            cta = {"action": "view_deal", "label": "Acceder al proceso"}

        results.append({
            "deal_id": did,
            "buyer_tier": tier,
            "visibility_state": vis,
            "contact_state": contact_state or "none",
            "has_nda": has_nda,
            "card_cta": cta,
            "show_financials": tier in ("pro", "pro+") or contact_state == "accepted" or has_nda,
            "is_premium": tier == "pro+",
        })

    return results


@router.put("/seller/settings/contact-policy")
async def update_contact_policy(data: dict, user: UserResponse = Depends(get_current_user)):
    """Seller updates their contact policy (auto_accept or manual_review)."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "Solo sellers pueden configurar la politica de contacto")

    policy = data.get("contact_policy", "manual_review")
    if policy not in ("auto_accept", "manual_review"):
        raise HTTPException(400, "Politica invalida. Valores: auto_accept, manual_review")

    now = datetime.now(timezone.utc).isoformat()
    await db.seller_settings.update_one(
        {"seller_id": user.user_id},
        {"$set": {"contact_policy": policy, "updated_at": now},
         "$setOnInsert": {"seller_id": user.user_id, "created_at": now}},
        upsert=True,
    )

    return {"contact_policy": policy, "updated_at": now}


@router.get("/seller/settings/contact-policy")
async def get_contact_policy(user: UserResponse = Depends(get_current_user)):
    """Get seller's current contact policy."""
    if user.role not in ("seller", "admin"):
        raise HTTPException(403, "No autorizado")

    settings = await db.seller_settings.find_one(
        {"seller_id": user.user_id}, {"_id": 0}
    )
    return {"contact_policy": (settings or {}).get("contact_policy", "manual_review")}
