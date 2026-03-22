"""
Seller Coaching System — API Router
Endpoints para warnings, nudges y recomendaciones.
"""
from fastapi import APIRouter, Depends
from routers.auth import get_current_user
from models.user import UserResponse
from services.coaching_service import (
    check_exclusivity_readiness,
    get_deal_nudges,
    get_seller_nudges,
)

router = APIRouter(prefix="/coaching", tags=["Coaching"])


@router.get("/exclusivity-check/{deal_id}/{buyer_id}")
async def exclusivity_check(
    deal_id: str,
    buyer_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """Pre-check antes de otorgar exclusividad. Devuelve warning si criterios no se cumplen."""
    return await check_exclusivity_readiness(deal_id, buyer_id)


@router.get("/nudges/deal/{deal_id}")
async def deal_nudges(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """Nudges contextuales para un deal especifico."""
    nudges = await get_deal_nudges(deal_id)
    return {"deal_id": deal_id, "nudges": nudges, "count": len(nudges)}


@router.get("/nudges")
async def seller_nudges(
    current_user: UserResponse = Depends(get_current_user),
):
    """Todos los nudges para el seller actual (cross-deal)."""
    nudges = await get_seller_nudges(current_user.user_id)
    return {"nudges": nudges, "count": len(nudges)}
