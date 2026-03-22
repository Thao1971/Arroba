from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import List, Optional

from database import deals_collection, companies_collection
from models.deal import DealPublicResponse, Teaser
from models.user import UserResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("/deals", response_model=List[DealPublicResponse])
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
    """List published deals in marketplace (public endpoint)"""
    # Build filter - only published deals
    filter_query = {"status": "published"}
    
    if sector:
        filter_query["teaser.sector_display"] = {"$regex": sector, "$options": "i"}
    
    if operation_type:
        filter_query["operation_types_allowed"] = operation_type
    
    if country:
        filter_query["teaser.geography_display"] = {"$regex": country, "$options": "i"}
    
    # Execute query with pagination
    skip = (page - 1) * limit
    cursor = deals_collection.find(
        filter_query,
        {"_id": 0}
    ).sort("published_at", -1).skip(skip).limit(limit)
    
    deals = await cursor.to_list(limit)
    
    # Filter by revenue/EBITDA if company data is needed
    # For now, we use the teaser display values
    
    return [DealPublicResponse(**deal) for deal in deals]


@router.get("/deals/{deal_id}/teaser")
async def get_deal_teaser(deal_id: str):
    """Get deal teaser (public endpoint)"""
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
    
    # Return teaser data only
    return {
        "deal_id": deal["deal_id"],
        "teaser": deal.get("teaser", {}),
        "operation_types_allowed": deal.get("operation_types_allowed", []),
        "status": deal["status"],
        "created_at": deal.get("created_at")
    }


@router.get("/sectors")
async def list_sectors():
    """Get list of available sectors"""
    sectors = [
        {"id": "seo", "name": "SEO", "description": "Posicionamiento en buscadores"},
        {"id": "sem", "name": "SEM / PPC", "description": "Publicidad en buscadores"},
        {"id": "social", "name": "Social Media", "description": "Gestión de redes sociales"},
        {"id": "content", "name": "Content Marketing", "description": "Marketing de contenidos"},
        {"id": "programmatic", "name": "Programática", "description": "Compra programática"},
        {"id": "creative", "name": "Creatividad", "description": "Diseño y creatividad"},
        {"id": "development", "name": "Desarrollo Web/App", "description": "Desarrollo digital"},
        {"id": "data", "name": "Data & Analytics", "description": "Análisis de datos"},
        {"id": "ecommerce", "name": "E-commerce", "description": "Comercio electrónico"},
        {"id": "performance", "name": "Performance", "description": "Marketing de resultados"},
        {"id": "branding", "name": "Branding", "description": "Marca e identidad"},
        {"id": "video", "name": "Video & Audio", "description": "Producción audiovisual"},
        {"id": "influencer", "name": "Influencer Marketing", "description": "Marketing con influencers"},
        {"id": "pr", "name": "PR & Comunicación", "description": "Relaciones públicas"},
        {"id": "automation", "name": "Marketing Automation", "description": "Automatización"},
        {"id": "fullservice", "name": "Full Service", "description": "Agencia 360°"}
    ]
    return sectors


@router.get("/stats")
async def get_marketplace_stats():
    """Get marketplace statistics"""
    # Count published deals
    published_count = await deals_collection.count_documents({"status": "published"})
    
    # Count closed deals
    closed_count = await deals_collection.count_documents({"status": "closed"})
    
    # Count total deals (excluding drafts for public view)
    active_count = await deals_collection.count_documents({
        "status": {"$in": ["published", "nda", "evaluation", "intent", "shortlist", "exclusivity", "due_diligence"]}
    })
    
    return {
        "published_deals": published_count,
        "closed_deals": closed_count,
        "active_processes": active_count,
        "total_value_transacted": "50M+ €",  # Placeholder
        "average_deal_time": "4-6 meses"
    }


@router.get("/featured")
async def get_featured_deals():
    """Get featured/highlighted deals for homepage"""
    # Get latest 6 published deals
    cursor = deals_collection.find(
        {"status": "published"},
        {"_id": 0}
    ).sort("published_at", -1).limit(6)
    
    deals = await cursor.to_list(6)
    
    return [DealPublicResponse(**deal) for deal in deals]
