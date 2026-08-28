"""Modelos canónicos del módulo entities.

Contrato de `EntityLookupResult` (Regla 2):
    { type, id, display_name, secondary_label, icon }

Estable desde el primer día para que el frontend renderice cualquier tipo
sin conocer el detalle interno.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Catálogo cerrado de tipos canónicos declarado en ENTITY_MODEL §3.
# `investor` añadido 2026-08-24 — ver nota en ENTITY_MODEL.md junto a la tabla
# de tipos (bloqueo de auth conocido con el endpoint CNMV de Intel).
EntityType = Literal[
    "company",
    "sector",
    "territory",
    "person",
    "advisor",
    "investor",
    "mandate",
    "match",
    "operation",
    "valuation",
    "document",
    "opportunity",
]

# Iconos canónicos (mapping estable). El frontend traduce a lucide-react.
EntityIcon = Literal[
    "building",   # company
    "grid",       # sector
    "map",        # territory
    "user",       # person / advisor
    "briefcase",  # mandate / advisor / investor
    "handshake",  # match / operation / opportunity
    "trending-up",  # valuation
    "file-text",  # document
]


class EntityLookupResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: EntityType
    id: str = Field(min_length=1, max_length=80)
    display_name: str = Field(min_length=1, max_length=200)
    secondary_label: str | None = Field(default=None, max_length=200)
    icon: EntityIcon


class EntityLookupResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str
    results: list[EntityLookupResult] = Field(default_factory=list)


__all__ = [
    "EntityIcon",
    "EntityLookupResponse",
    "EntityLookupResult",
    "EntityType",
]
