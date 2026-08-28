"""DTOs del módulo `mandates`.

Los campos de `MandateCreate`/`MandateUpdate` son un mapeo 1:1 de
`BuyerMandateCreate`/`BuyerMandateUpdate` en Intel (`backend/models.py:233-257`
de `Intel-140826`) — no se inventan campos nuevos, solo se traduce el nombre
al vocabulario de producto en español donde ayuda a la UI.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

MandateType = str  # "strategic" | "financial" | "roll_up" (validado en Intel)
OwnershipPreference = str  # "any" | "standalone_only"
MandateStatus = str  # "active" | "paused" | "closed"


class MandateCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    mandate_type: MandateType = "strategic"
    target_cnae_sections: list[str] | None = None
    target_cnae_codes: list[str] | None = None
    target_provincias: list[str] | None = None
    revenue_min: float | None = None
    revenue_max: float | None = None
    ownership_preference: OwnershipPreference = "any"
    exclude_master_ids: list[str] = Field(default_factory=list)
    notes: str | None = None


class MandateUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    status: MandateStatus | None = None
    mandate_type: MandateType | None = None
    target_cnae_sections: list[str] | None = None
    target_cnae_codes: list[str] | None = None
    target_provincias: list[str] | None = None
    revenue_min: float | None = None
    revenue_max: float | None = None
    ownership_preference: OwnershipPreference | None = None
    exclude_master_ids: list[str] | None = None
    notes: str | None = None


class Mandate(BaseModel):
    """Objeto mandato tal y como lo devuelve Intel, más el dueño en Beta."""

    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    mandate_type: MandateType
    status: MandateStatus = "active"
    target_cnae_sections: list[str] | None = None
    target_cnae_codes: list[str] | None = None
    target_provincias: list[str] | None = None
    revenue_min: float | None = None
    revenue_max: float | None = None
    ownership_preference: OwnershipPreference = "any"
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    # Propiedad en Beta (Intel no conoce el usuario/organización de Beta —
    # ver nota de auth en providers/agency_tool.py). Se guarda localmente.
    beta_user_id: str | None = None
    beta_org_id: str | None = None


class FitDimension(BaseModel):
    model_config = ConfigDict(extra="ignore")

    value: float | str | None = None
    score: float | None = None
    sources: list[str] = Field(default_factory=list)


class MandateTarget(BaseModel):
    """Una empresa candidata rankeada contra un mandato (1 target = 1 tarjeta)."""

    model_config = ConfigDict(extra="ignore")

    master_id: str
    name: str | None = None
    score: float | None = None
    fit_dimensions: dict[str, FitDimension] = Field(default_factory=dict)
    score_method: str | None = None
    explanation: str | None = None
    # Tipo de oportunidad real (no texto libre): reutiliza la misma clasificación
    # rules-based de `recommendation-intelligence` en Intel (_is_consolidator /
    # _is_standalone) — "roll_up_candidate" | "divestment_candidate" |
    # "acquisition_target". role_label ya viene traducido en español desde Intel.
    role: str | None = None
    role_label: str | None = None
    # Enriquecido en Beta si se necesita CIF/localización/sector para la card
    # (a resolver contra companies/service si el master_id no trae ya lo básico).
    cif: str | None = None
    sector: str | None = None
    location: str | None = None


class MandateTargetsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    mandate_id: str
    mandate_name: str | None = None
    candidates_scanned: int = 0
    count: int = 0
    targets: list[MandateTarget] = Field(default_factory=list)
    source: str = "real"  # siempre "real" — Beta no tiene modo mock propio


__all__ = [
    "MandateCreate",
    "MandateUpdate",
    "Mandate",
    "MandateTarget",
    "MandateTargetsResponse",
    "FitDimension",
]
