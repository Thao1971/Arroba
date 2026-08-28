"""FastAPI router — listas guardadas / oportunidades manuales.

Recurso NUEVO y aditivo (ver `models.py`, sección "Listas guardadas /
oportunidades manuales"): un conjunto explícito, con nombre, de empresas
elegidas a mano. No toca `company_watchlists` (la cartera única sin nombre,
que sigue viviendo en `companies/router.py`).

Boundary:
  - POST   /api/lists                       auth — crea lista (+ CIFs iniciales opcionales)
  - GET    /api/lists                       auth — lista las listas del usuario en su org activa
  - GET    /api/lists/{list_id}             auth — detalle con items
  - POST   /api/lists/{list_id}/items       auth — añade empresas a una lista existente
  - DELETE /api/lists/{list_id}/items/{cif} auth — quita una empresa de la lista
  - PATCH  /api/lists/{list_id}             auth — renombra
  - DELETE /api/lists/{list_id}             auth — borra la lista entera

"Crear oportunidad desde selección" en /resultados = POST /api/lists con
kind="opportunity" y los CIFs seleccionados — mismo endpoint que "guardar
lista", solo cambia el `kind`.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Response

from src.core.exceptions import BadRequestError
from src.modules.auth.dependencies import get_current_user
from src.modules.auth.models import UserPublic
from src.modules.companies import service
from src.modules.companies.models import (
    SavedListAddItemsPayload,
    SavedListCreatePayload,
    SavedListDetail,
    SavedListRenamePayload,
    SavedListsResponse,
    SavedListSummary,
)

router = APIRouter(prefix="/api/lists", tags=["saved-lists"])


def _require_org(x_active_org: str | None) -> str:
    if not x_active_org:
        raise BadRequestError("organization_required", code="organization_required")
    return x_active_org


@router.post("", response_model=SavedListDetail)
async def create_list(
    payload: SavedListCreatePayload,
    user: UserPublic = Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> SavedListDetail:
    org_id = _require_org(x_active_org)
    detail = await service.create_saved_list(
        user_id=user.user_id, org_id=org_id, name=payload.name,
        kind=payload.kind, cifs=payload.cifs,
    )
    return SavedListDetail(**detail)


@router.get("", response_model=SavedListsResponse)
async def get_lists(
    user: UserPublic = Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> SavedListsResponse:
    rows = await service.list_saved_lists(user_id=user.user_id, org_id=x_active_org)
    return SavedListsResponse(lists=[SavedListSummary(**r) for r in rows])


@router.get("/{list_id}", response_model=SavedListDetail)
async def get_list_detail(
    list_id: str,
    user: UserPublic = Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> SavedListDetail:
    org_id = _require_org(x_active_org)
    detail = await service.get_saved_list_detail(list_id=list_id, org_id=org_id)
    return SavedListDetail(**detail)


@router.post("/{list_id}/items", response_model=SavedListDetail)
async def add_items(
    list_id: str,
    payload: SavedListAddItemsPayload,
    user: UserPublic = Depends(get_current_user),
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> SavedListDetail:
    org_id = _require_org(x_active_org)
    detail = await service.add_items_to_saved_list(
        user_id=user.user_id, org_id=org_id, list_id=list_id, cifs=payload.cifs,
    )
    return SavedListDetail(**detail)


@router.delete("/{list_id}/items/{cif}")
async def remove_item(
    list_id: str,
    cif: str,
    user: UserPublic = Depends(get_current_user),  # noqa: ARG001 — auth gate
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> Response:
    org_id = _require_org(x_active_org)
    await service.remove_item_from_saved_list(org_id=org_id, list_id=list_id, cif=cif)
    return Response(status_code=204)


@router.patch("/{list_id}", response_model=SavedListDetail)
async def rename_list(
    list_id: str,
    payload: SavedListRenamePayload,
    user: UserPublic = Depends(get_current_user),  # noqa: ARG001 — auth gate
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> SavedListDetail:
    org_id = _require_org(x_active_org)
    detail = await service.rename_saved_list(org_id=org_id, list_id=list_id, name=payload.name)
    return SavedListDetail(**detail)


@router.delete("/{list_id}")
async def delete_list(
    list_id: str,
    user: UserPublic = Depends(get_current_user),  # noqa: ARG001 — auth gate
    x_active_org: str | None = Header(default=None, alias="X-Active-Org"),
) -> Response:
    org_id = _require_org(x_active_org)
    await service.delete_saved_list(org_id=org_id, list_id=list_id)
    return Response(status_code=204)
