"""Time tracking and intent scoring router"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from models.user import UserResponse
from routers.auth import get_current_user
from services.intent_service import record_time, get_time_summary, get_deal_intent_scores, compute_intent_score
from services.events_service import track_event

router = APIRouter(prefix="/tracking", tags=["Tracking"])


class TimePayload(BaseModel):
    deal_id: str
    section: str  # deal_page, infomemo, data_room
    duration_seconds: int
    session_id: str


@router.post("/time")
async def track_time(
    data: TimePayload,
    current_user: UserResponse = Depends(get_current_user)
):
    """Record time spent by buyer on a deal section."""
    if data.section not in ("deal_page", "infomemo", "data_room"):
        raise HTTPException(status_code=400, detail="Sección inválida")
    if data.duration_seconds <= 0 or data.duration_seconds > 120:
        return {"tracked": False}

    await record_time(
        current_user.user_id, data.deal_id, data.section,
        data.duration_seconds, data.session_id
    )
    await track_event("TIME_TRACKED", deal_id=data.deal_id, user_id=current_user.user_id,
                       metadata={"section": data.section, "duration": data.duration_seconds})
    return {"tracked": True}


@router.get("/time/{deal_id}/{buyer_id}")
async def get_buyer_time(
    deal_id: str,
    buyer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get time summary for a specific buyer on a deal (seller view)."""
    summary = await get_time_summary(buyer_id, deal_id)
    return summary


@router.get("/intent/{deal_id}")
async def get_deal_intent(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get intent scores for all buyers on a deal (seller view)."""
    scores = await get_deal_intent_scores(deal_id)
    return {"deal_id": deal_id, "buyers": scores}


@router.get("/intent/{deal_id}/{buyer_id}")
async def get_buyer_intent(
    deal_id: str,
    buyer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get intent score for a specific buyer on a deal."""
    intent = await compute_intent_score(buyer_id, deal_id)
    return {"deal_id": deal_id, "buyer_id": buyer_id, **intent}
