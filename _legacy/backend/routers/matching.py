"""Matching router — recommended deals, compatible buyers"""
from fastapi import APIRouter, HTTPException, Depends

from models.user import UserResponse
from routers.auth import get_current_user
from services.matching_service import (
    get_recommended_deals_for_buyer,
    get_compatible_buyers_for_deal,
    affinity_label
)
from services.events_service import track_event

router = APIRouter(prefix="/matching", tags=["Matching"])


@router.get("/deals")
async def get_recommended_deals(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get deals recommended for the current buyer, sorted by match_score"""
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can access recommendations")

    bp = current_user.buyer_profile
    if not bp or not bp.profile_complete:
        return {
            "deals": [],
            "profile_complete": False,
            "message": "Completa tu perfil para ver recomendaciones personalizadas"
        }

    deals = await get_recommended_deals_for_buyer(current_user.user_id)

    return {
        "deals": deals,
        "profile_complete": True,
        "total": len(deals)
    }


@router.get("/buyers/{deal_id}")
async def get_compatible_buyers(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get compatible buyer stats for a deal (seller view)"""
    from database import deals_collection
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    stats = await get_compatible_buyers_for_deal(deal_id)

    return {
        "deal_id": deal_id,
        "compatible_buyers": stats,
        "message_high": f"{stats['high']} buyers altamente compatibles" if stats['high'] > 0 else None,
        "message_medium": f"{stats['medium']} buyers potencialmente compatibles" if stats['medium'] > 0 else None,
        "message_fallback": "Tenemos buyers activos buscando este tipo de compañías" if stats['total'] == 0 else None,
    }


@router.post("/click/{deal_id}")
async def track_match_click(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Track when a buyer clicks on a recommended deal"""
    await track_event("MATCH_CLICKED", deal_id=deal_id, user_id=current_user.user_id)
    return {"tracked": True}
