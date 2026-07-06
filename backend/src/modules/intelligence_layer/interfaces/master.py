"""Contrato `MasterProvider` + DTOs del Master Record.

Schema replica **exactamente** el pack §6.1 · contract §6.1 del contrato público
`arroba-integration-contract-v1`. Es el contrato interno que arroba expone al
frontend en `/api/companies/{cif}/identity`. **Congelado** — cualquier cambio
requiere bump de contrato.

Rellenos permitidos:
    * campos escalares ausentes → `null`
    * arrays ausentes → `[]`
    * objetos ausentes → objeto con todos sus subcampos en `null`

NO se inventan datos. NO se calcula lógica de negocio (Regla R4).
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ---------- Sub-modelos del schema §6.1 ----------


class Identity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    legal_name: str | None = None
    commercial_name: str | None = None
    aliases: list[str] = Field(default_factory=list)
    cif: str | None = None
    country: str | None = None


class Classification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cnae_code: str | None = None
    cnae_description: str | None = None
    cnae_division: str | None = None
    cnae_section: str | None = None


class Location(BaseModel):
    model_config = ConfigDict(extra="ignore")
    provincia: str | None = None
    municipio: str | None = None
    codigo_postal: str | None = None
    pais: str | None = None


class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    web: str | None = None
    domain: str | None = None


class Size(BaseModel):
    model_config = ConfigDict(extra="ignore")
    employees_total: int | None = None
    capital_social: float | None = None


class FinancialsLatest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    year: int | None = None
    basis: Literal["individual", "consolidated"] | None = None
    revenue: float | None = None
    ebitda: float | None = None
    ebitda_margin: float | None = None
    equity: float | None = None
    total_assets: float | None = None
    net_income: float | None = None
    operating_income: float | None = None


class FinancialsHistoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    year: int | None = None
    basis: Literal["individual", "consolidated"] | None = None
    revenue: float | None = None
    ebitda: float | None = None
    net_income: float | None = None


class Financials(BaseModel):
    model_config = ConfigDict(extra="ignore")
    latest: FinancialsLatest | None = None
    history: list[FinancialsHistoryItem] = Field(default_factory=list)


class OwnershipParty(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cif: str | None = None
    name: str | None = None
    pct: float | None = None


class Ownership(BaseModel):
    model_config = ConfigDict(extra="ignore")
    shareholders: list[OwnershipParty] = Field(default_factory=list)
    parents: list[OwnershipParty] = Field(default_factory=list)
    ultimate_parent: OwnershipParty | None = None
    investees: list[OwnershipParty] = Field(default_factory=list)
    group_id: str | None = None


class MasterRecord(BaseModel):
    """Schema §6.1 completo. Contrato interno congelado (Decisión 0.1.5)."""

    model_config = ConfigDict(extra="ignore")

    master_id: str
    cif_normalized: str | None = None
    status: Literal["active", "merged", "deprecated"] = "active"
    identity: Identity
    classification: Classification
    location: Location
    contact: Contact
    name_key: str | None = None
    size: Size
    financials: Financials
    ownership: Ownership
    officers_count: int | None = None
    objeto_social: str | None = None
    provenance: dict = Field(default_factory=dict)
    sources: list[dict] = Field(default_factory=list)
    pipeline_version: str | None = None
    source_hash: str | None = None
    dirty: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None
    built_at: datetime | None = None
    # Metadatos del engine (contract §6.x global)
    engine_version: str | None = None
    generated_at: datetime | None = None


# ---------- Interfaz del proveedor ----------


class MasterProvider(ABC):
    """Contrato que cualquier proveedor de Master Record debe cumplir."""

    provider_name: str  # etiqueta observable ("mock" | "agency_tool")

    @abstractmethod
    async def get_by_id(self, master_id: str) -> MasterRecord:
        """Devuelve el `MasterRecord` para el `master_id` dado.

        Contrato de errores esperado (a mapear en el router hacia el consumidor):
          * `MasterNotFoundError` — 404 lógico del proveedor.
          * `MasterProviderError` — cualquier fallo transitorio del proveedor.
        """
        ...

    @abstractmethod
    async def get_by_cif(self, cif: str) -> MasterRecord:
        """Resolución alternativa por CIF. Se usa desde `/api/companies/{cif}/identity`."""
        ...


class MasterNotFoundError(LookupError):
    """No existe Master Record para el identificador dado."""


class MasterProviderError(RuntimeError):
    """Fallo del proveedor (5xx, timeout, network, unauthorized)."""

    def __init__(self, message: str, *, error_class: str = "server_5xx") -> None:
        super().__init__(message)
        self.error_class = error_class


__all__ = [
    "MasterRecord",
    "Identity",
    "Classification",
    "Location",
    "Contact",
    "Size",
    "Financials",
    "FinancialsLatest",
    "FinancialsHistoryItem",
    "Ownership",
    "OwnershipParty",
    "MasterProvider",
    "MasterNotFoundError",
    "MasterProviderError",
]
