from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from database import deals_collection, companies_collection, teasers_collection
from models.user import UserResponse
from routers.auth import get_current_user
from services.teaser_service import generate_teaser

router = APIRouter(prefix="/teaser", tags=["Teaser"])


@router.post("/generate/{company_id}")
async def generate_company_teaser(
    company_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Generate anonymized teaser for a company deal"""
    company = await companies_collection.find_one(
        {"company_id": company_id},
        {"_id": 0}
    )

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if company["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get active deal
    deal = await deals_collection.find_one(
        {"company_id": company_id, "status": {"$nin": ["closed", "dropped"]}},
        {"_id": 0}
    )

    if not deal:
        deal = {
            "operation_types_allowed": ["full_sale"],
            "asking_price": None,
            "price_negotiable": True
        }

    teaser = await generate_teaser(company, deal)

    # Save teaser
    teaser_doc = {
        "company_id": company_id,
        "deal_id": deal.get("deal_id"),
        **teaser,
        "created_by": current_user.user_id
    }

    await teasers_collection.update_one(
        {"company_id": company_id},
        {"$set": teaser_doc},
        upsert=True
    )

    # Update deal with new teaser structure
    if deal.get("deal_id"):
        await deals_collection.update_one(
            {"deal_id": deal["deal_id"]},
            {"$set": {
                "teaser": {
                    "headline": teaser["title"],
                    "description": teaser["short_description"],
                    "highlights": teaser["highlights"],
                    "revenue_display": teaser["revenue_range"],
                    "ebitda_display": teaser["ebitda_range"],
                    "sector_display": teaser["sector_display"],
                    "geography_display": teaser["location"],
                    "year_founded": teaser["year_founded"],
                },
                "teaser_full": teaser,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )

    return {
        "message": "Teaser generated successfully",
        "teaser": teaser
    }


@router.get("/{deal_id}")
async def get_deal_teaser(deal_id: str):
    """Get teaser for a deal (public - no auth required for published deals)"""
    deal = await deals_collection.find_one(
        {"deal_id": deal_id},
        {"_id": 0}
    )

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if deal["status"] == "draft":
        raise HTTPException(status_code=403, detail="Deal not yet published")

    teaser = deal.get("teaser_full") or deal.get("teaser", {})
    return {
        "deal_id": deal_id,
        "status": deal["status"],
        "teaser": teaser
    }


@router.put("/{deal_id}")
async def update_teaser(
    deal_id: str,
    teaser_updates: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update/edit teaser content"""
    deal = await deals_collection.find_one(
        {"deal_id": deal_id},
        {"_id": 0}
    )

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    current_teaser = deal.get("teaser_full", deal.get("teaser", {}))
    current_teaser.update(teaser_updates)
    current_teaser["edited_at"] = datetime.now(timezone.utc).isoformat()
    current_teaser["edited_by"] = current_user.user_id

    # Also update the compact teaser
    compact_teaser = {
        "headline": current_teaser.get("title", current_teaser.get("headline")),
        "description": current_teaser.get("short_description", current_teaser.get("description")),
        "highlights": current_teaser.get("highlights", []),
        "revenue_display": current_teaser.get("revenue_range", current_teaser.get("revenue_display")),
        "ebitda_display": current_teaser.get("ebitda_range", current_teaser.get("ebitda_display")),
        "sector_display": current_teaser.get("sector_display", ""),
        "geography_display": current_teaser.get("location", current_teaser.get("geography_display")),
        "year_founded": current_teaser.get("year_founded"),
    }

    await deals_collection.update_one(
        {"deal_id": deal_id},
        {"$set": {
            "teaser": compact_teaser,
            "teaser_full": current_teaser,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    return {"message": "Teaser updated", "teaser": current_teaser}
