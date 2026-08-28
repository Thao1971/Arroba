"""Router del módulo entities — resolución genérica multi-tipo (Sprint 1).

Solo un endpoint público en este sprint:
  GET /api/entities/lookup?q&types&limit

Regla 2: contract 100% genérico multi-tipo desde el primer día.
"""
from __future__ import annotations

from fastapi import APIRouter, Query

from src.modules.entities import service
from src.modules.entities.models import (
    EntityLookupResponse,
    EntityType,
)

router = APIRouter(prefix="/api/entities", tags=["entities"])

# Catálogo válido de tipos que la API acepta como filtro.
_VALID_TYPES: set[str] = {
    "company", "sector", "territory", "person", "advisor", "investor",
    "mandate", "match", "operation", "valuation", "document", "opportunity",
}


@router.get("/lookup", response_model=EntityLookupResponse)
async def lookup_entities(
    q: str = Query(..., min_length=1, max_length=200, description="Texto libre o CIF"),
    types: str = Query(
        default="company",
        description="Lista CSV de tipos canónicos a resolver.",
    ),
    limit: int = Query(default=10, ge=1, le=25),
) -> EntityLookupResponse:
    """Resuelve una query contra los tipos solicitados.

    En Sprint 1 sólo `company` está poblado. Otros tipos válidos del
    catálogo (sector, territory, …) se aceptan sin fallar y devuelven
    resultados vacíos hasta que sus motores estén listos.
    Tipos no reconocidos se ignoran silenciosamente para preservar
    forward-compatibility.
    """
    requested = [t.strip() for t in (types or "").split(",") if t.strip()]
    # Filtramos por el catálogo canónico; nunca falla por tipo desconocido.
    canonical_types: list[EntityType] = [
        t for t in requested if t in _VALID_TYPES  # type: ignore[misc]
    ]  # type: ignore[list-item]
    if not canonical_types:
        canonical_types = ["company"]
    results = await service.lookup(query=q, types=canonical_types, limit=limit)
    return EntityLookupResponse(query=q, results=results)


__all__ = ["router"]
