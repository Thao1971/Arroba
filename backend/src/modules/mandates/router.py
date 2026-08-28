"""Rutas `/api/mandates/*`.

Consumido por la nueva página de Oportunidades (frontend). Auth igual que
`companies`/`workspaces`: JWT de usuario + `X-Active-Org` opcional.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException

from src.modules.auth.dependencies import get_current_user
from src.modules.mandates import service
from src.modules.mandates.models import (
    Mandate,
    MandateCreate,
    MandateTargetsResponse,
    MandateUpdate,
)

router = APIRouter(prefix="/api/mandates", tags=["mandates"])


def _error_status(error_class: str) -> int:
    return {"unauthorized": 502, "timeout": 504, "network": 502, "server_5xx": 502}.get(
        error_class, 400
    )


@router.post("", response_model=Mandate)
async def create_mandate(
    payload: MandateCreate,
    user=Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> Mandate:
    try:
        return await service.create_mandate(payload, user_id=user.user_id, org_id=x_active_org)
    except service.MandateProviderError as exc:
        raise HTTPException(_error_status(exc.error_class), str(exc)) from exc


@router.get("/mine", response_model=list[Mandate])
async def list_my_mandates(
    status: str | None = None,
    user=Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> list[Mandate]:
    return await service.list_my_mandates(user_id=user.user_id, org_id=x_active_org, status=status)


@router.get("/{mandate_id}", response_model=Mandate)
async def get_mandate(mandate_id: str, user=Depends(get_current_user)) -> Mandate:
    mandate = await service.get_mandate(mandate_id, user_id=user.user_id)
    if not mandate:
        raise HTTPException(404, "mandato no encontrado")
    return mandate


@router.patch("/{mandate_id}", response_model=Mandate)
async def update_mandate(
    mandate_id: str, payload: MandateUpdate, user=Depends(get_current_user)
) -> Mandate:
    try:
        mandate = await service.update_mandate(mandate_id, payload, user_id=user.user_id)
    except service.MandateProviderError as exc:
        raise HTTPException(_error_status(exc.error_class), str(exc)) from exc
    if not mandate:
        raise HTTPException(404, "mandato no encontrado")
    return mandate


@router.get("/{mandate_id}/targets", response_model=MandateTargetsResponse)
async def get_targets(
    mandate_id: str, limit: int = 20, user=Depends(get_current_user)
) -> MandateTargetsResponse:
    try:
        return await service.get_targets(mandate_id, user_id=user.user_id, limit=limit)
    except service.MandateNotFoundError as exc:
        raise HTTPException(404, "mandato no encontrado") from exc
    except service.MandateProviderError as exc:
        raise HTTPException(_error_status(exc.error_class), str(exc)) from exc


__all__ = ["router"]
