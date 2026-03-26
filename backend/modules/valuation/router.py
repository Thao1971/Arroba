"""
API router for valuation module.
Prefix: /valuation
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from database import db
from routers.auth import get_current_user
from .schemas import (
    ValuationEstimateRequest, ValuationEstimateResponse,
    PremiumRequestPayload, PremiumRequestResponse,
    SendResultEmailRequest, PublicConfigResponse,
)
from .service import run_estimate, request_premium, send_result_email
from .config_service import get_public_config, seed_default_multiples, seed_default_settings
from .repositories import get_lead, get_leads_by_user
from services.taxonomy import TAXONOMY

router = APIRouter(prefix="/valuation", tags=["Valuation"])


@router.get("/taxonomy/categories")
async def valuation_taxonomy_categories():
    """Get taxonomy categories with subcategories for the valuation wizard."""
    return [
        {"id": cat["id"], "name": cat["name"], "subcategories": cat["subcategories"]}
        for cat in TAXONOMY
    ]


@router.get("/taxonomy/subcategories/{category_id}")
async def valuation_taxonomy_subcategories(category_id: str):
    """Get subcategories for a given category."""
    for cat in TAXONOMY:
        if cat["id"] == category_id:
            return cat["subcategories"]
    raise HTTPException(status_code=404, detail="Categoria no encontrada")


@router.get("/config/public")
async def valuation_public_config():
    """Get public-facing valuation config (disclaimer, premium info)."""
    return await get_public_config(db)


@router.post("/estimate")
async def create_estimate(
    payload: ValuationEstimateRequest,
    user=Depends(get_current_user),
):
    """Run a valuation estimate for the authenticated user."""
    if not payload.legal_confirm_accuracy:
        raise HTTPException(status_code=400, detail="Debes confirmar la veracidad de los datos")

    result = await run_estimate(
        db=db,
        user_id=user.user_id,
        email=user.email,
        payload=payload.model_dump(),
    )
    return result


@router.get("/my-valuations")
async def list_my_valuations(user=Depends(get_current_user)):
    """List all valuations for the authenticated user."""
    return await get_leads_by_user(db, user.user_id)


@router.get("/lead/{lead_id}")
async def get_valuation_lead(lead_id: str, user=Depends(get_current_user)):
    """Get a specific valuation lead."""
    lead = await get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Valoracion no encontrada")
    if lead["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    return lead


@router.post("/premium-request")
async def create_premium_request(
    payload: PremiumRequestPayload,
    user=Depends(get_current_user),
):
    """Request a premium expert valuation."""
    result = await request_premium(
        db=db,
        user_id=user.user_id,
        lead_id=payload.lead_id,
        phone=payload.contact_phone,
        notes=payload.additional_notes,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Lead de valoracion no encontrado o no autorizado")
    return result


@router.post("/send-result-email")
async def send_valuation_email(
    payload: SendResultEmailRequest,
    user=Depends(get_current_user),
):
    """Send the valuation result email."""
    sent = await send_result_email(db, user.user_id, payload.lead_id)
    if not sent:
        raise HTTPException(status_code=404, detail="Lead no encontrado o no autorizado")
    return {"status": "sent", "message": "Email enviado correctamente"}
