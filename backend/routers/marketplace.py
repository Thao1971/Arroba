from fastapi import APIRouter, HTTPException, Depends, Query, Request
from datetime import datetime, timezone
from typing import List, Optional

from database import deals_collection, companies_collection
from models.deal import DealPublicResponse, Teaser
from models.user import UserResponse
from routers.auth import get_current_user
from services.deal_score_service import compute_signals_batch

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("/deals")
async def list_marketplace_deals(
    sector: Optional[str] = Query(None, description="Filter by sector"),
    revenue_min: Optional[float] = Query(None, description="Minimum revenue"),
    revenue_max: Optional[float] = Query(None, description="Maximum revenue"),
    ebitda_min: Optional[float] = Query(None, description="Minimum EBITDA"),
    ebitda_max: Optional[float] = Query(None, description="Maximum EBITDA"),
    operation_type: Optional[str] = Query(None, description="Operation type filter"),
    country: Optional[str] = Query(None, description="Country filter"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """List published deals in marketplace with soft signals (public endpoint)"""
    filter_query = {"status": {"$in": ["published", "exclusivity"]}}

    if sector:
        filter_query["teaser.sector_display"] = {"$regex": sector, "$options": "i"}

    if operation_type:
        filter_query["operation_types_allowed"] = operation_type

    if country:
        filter_query["teaser.geography_display"] = {"$regex": country, "$options": "i"}

    skip = (page - 1) * limit
    cursor = deals_collection.find(
        filter_query,
        {"_id": 0}
    ).sort("published_at", -1).skip(skip).limit(limit)

    deals = await cursor.to_list(limit)

    # Compute signals + internal score for all deals in batch
    score_data = await compute_signals_batch(deals)

    # Build enriched response, sorted by internal score (descending)
    enriched = []
    for d in deals:
        d.pop("infomemo", None)
        did = d["deal_id"]
        sd = score_data.get(did, {"signals": [], "score": 0})

        enriched.append({
            "deal_id": d["deal_id"],
            "teaser": d.get("teaser", {}),
            "teaser_full": d.get("teaser_full"),
            "operation_types_allowed": d.get("operation_types_allowed", []),
            "status": d.get("status", "published"),
            "created_at": d.get("created_at"),
            "published_at": d.get("published_at"),
            "signals": sd["signals"],
            "_score": sd["score"],  # internal, for sorting only
        })

    # Sort by internal score (most active first)
    enriched.sort(key=lambda x: -x["_score"])

    # Remove internal score from response
    for e in enriched:
        e.pop("_score", None)

    return enriched


@router.get("/deals/{deal_id}/teaser")
async def get_deal_teaser(deal_id: str):
    """Get deal teaser with signals (public endpoint)"""
    deal = await deals_collection.find_one(
        {"deal_id": deal_id, "status": {"$in": ["published", "nda", "evaluation", "intent", "shortlist", "exclusivity", "due_diligence"]}},
        {"_id": 0}
    )

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Increment view count
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {"$inc": {"metrics.teaser_views": 1}}
    )

    # Compute signals for this deal
    score_data = await compute_signals_batch([deal])
    sd = score_data.get(deal_id, {"signals": [], "score": 0})

    return {
        "deal_id": deal["deal_id"],
        "teaser": deal.get("teaser", {}),
        "operation_types_allowed": deal.get("operation_types_allowed", []),
        "status": deal["status"],
        "created_at": deal.get("created_at"),
        "signals": sd["signals"],
    }


@router.get("/sectors")
async def list_sectors():
    """Get sectors from official BUD Advisors taxonomy"""
    from services.taxonomy import TAXONOMY
    return [{"id": cat["id"], "name": cat["name"], "subcategories": cat["subcategories"]} for cat in TAXONOMY]


@router.get("/stats")
async def get_marketplace_stats():
    """Get marketplace statistics"""
    published_count = await deals_collection.count_documents(
        {"status": {"$in": ["published", "exclusivity"]}}
    )
    closed_count = await deals_collection.count_documents({"status": "closed"})
    active_count = await deals_collection.count_documents({
        "status": {"$in": ["published", "nda", "evaluation", "intent", "shortlist", "exclusivity", "due_diligence"]}
    })

    return {
        "published_deals": published_count,
        "closed_deals": closed_count,
        "active_processes": active_count,
        "total_value_transacted": "50M+ €",
        "average_deal_time": "4-6 meses"
    }


@router.get("/featured")
async def get_featured_deals():
    """Get featured deals sorted by activity score"""
    cursor = deals_collection.find(
        {"status": {"$in": ["published", "exclusivity"]}},
        {"_id": 0}
    ).sort("published_at", -1).limit(12)

    deals = await cursor.to_list(12)

    # Compute signals + score
    score_data = await compute_signals_batch(deals)

    enriched = []
    for d in deals:
        d.pop("infomemo", None)
        did = d["deal_id"]
        sd = score_data.get(did, {"signals": [], "score": 0})
        enriched.append({
            "deal_id": d["deal_id"],
            "teaser": d.get("teaser", {}),
            "teaser_full": d.get("teaser_full"),
            "operation_types_allowed": d.get("operation_types_allowed", []),
            "status": d.get("status", "published"),
            "created_at": d.get("created_at"),
            "signals": sd["signals"],
            "_score": sd["score"],
        })

    # Sort by score, return top 6
    enriched.sort(key=lambda x: -x["_score"])
    for e in enriched:
        e.pop("_score", None)

    return enriched[:6]



# ─── ACCESS LEVELS ───
# public: teaser only, limited metrics, no visuals avanzados
# post_nda: full teaser + infomemo + buyer_advanced visuals + Q&A
# dataroom: everything including documents

def _determine_access_level(deal: dict, user_id: str | None) -> str:
    """Determine buyer access level for a deal."""
    if not user_id:
        return "public"
    ndas = deal.get("ndas_signed", [])
    has_nda = any(n.get("buyer_id") == user_id for n in ndas)
    if has_nda:
        return "post_nda"
    return "public"


@router.get("/deals/{deal_id}/gated")
async def get_gated_deal(deal_id: str, request: Request):
    """
    Gated deal endpoint — returns data filtered by buyer access level.
    """
    deal = await deals_collection.find_one(
        {"deal_id": deal_id, "status": {"$nin": ["draft", "dropped"]}},
        {"_id": 0}
    )
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Extract user from token (optional — no 401 if missing)
    user_id = None
    try:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            from utils.security import decode_jwt_token
            payload = decode_jwt_token(token)
            user_id = payload.get("sub") or payload.get("user_id")
    except Exception:
        pass

    access_level = _determine_access_level(deal, user_id)

    # Base response (always visible)
    response = {
        "deal_id": deal["deal_id"],
        "status": deal["status"],
        "access_level": access_level,
        "teaser": deal.get("teaser", {}),
        "operation_types_allowed": deal.get("operation_types_allowed", []),
        "asking_price": deal.get("asking_price") if access_level != "public" else None,
        "created_at": deal.get("created_at"),
    }

    # Load visuals filtered by surface
    company_id = deal.get("company_id")
    if company_id:
        from services.financial_visuals_service import get_financial_visuals
        visuals_doc = await get_financial_visuals(company_id)
        all_visuals = visuals_doc.get("financial_visuals", {}) if visuals_doc else {}

        if access_level == "public":
            # Only teaser visuals
            response["visuals"] = {k: v for k, v in all_visuals.items() if v.get("use_in_teaser") and v.get("enabled")}
            response["visuals_surface"] = "teaser"
        elif access_level == "post_nda":
            # Teaser + infomemo + buyer_advanced
            response["visuals"] = {k: v for k, v in all_visuals.items() if (v.get("use_in_teaser") or v.get("use_in_infomemo") or v.get("use_in_buyer_advanced")) and v.get("enabled")}
            response["visuals_surface"] = "full"
            # Include infomemo content
            response["infomemo"] = deal.get("infomemo")
            response["asking_price"] = deal.get("asking_price")
            # Include NDA status
            response["nda_signed"] = True
        else:
            response["visuals"] = {}
            response["visuals_surface"] = "none"

    # Compute signals
    score_data = await compute_signals_batch([deal])
    sd = score_data.get(deal_id, {"signals": [], "score": 0})
    response["signals"] = sd["signals"]

    return response
