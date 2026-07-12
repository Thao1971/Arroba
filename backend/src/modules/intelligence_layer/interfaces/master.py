"""Contrato `MasterProvider` (IdentityResolver semánticamente) + DTOs del Master Record.

Schema replica **exactamente** el pack §6.1 · contract §6.1 del contrato público
`arroba-integration-contract-v1`. Es el contrato interno que arroba expone al
frontend en `/api/companies/{cif}/identity`. **Congelado** — cualquier cambio
requiere bump de contrato.

### Regla canónica R12 (2026-07-07)
arroba **NUNCA** consume `/api/v1/master/*` (endpoints administrativos con auth
JWT admin). La implementación real de `MasterProvider` es `AgencyToolIdentityResolver`
que **compone** llamadas a los engines públicos (`financial-intelligence/analyze` +
`semantic-intelligence/search`) con `X-API-Key`. El nombre `MasterProvider` se
conserva por compatibilidad semántica del contrato interno, pero su implementación
real es un *resolver* compositivo — jamás un cliente directo al Master admin.

Rellenos permitidos en el schema §6.1 cuando el engine público no aporta el campo:
    * campos escalares ausentes → `null`
    * arrays ausentes → `[]`
    * objetos ausentes → objeto con todos sus subcampos en `null`

Campos huérfanos (no cubiertos por engines públicos, quedan como REQ contra
Agency Tool para exponerlos en el futuro):
    * `ownership.{shareholders,parents,ultimate_parent,investees,group_id}`
    * `officers_count`
    * `objeto_social`
    * `provenance`, `sources`, `pipeline_version`, `source_hash`

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
    """Schema §6.1 completo. Contrato interno congelado (Decisión 0.1.5).

    Sprint F0.1 (2026-07-06): se añaden **campos opcionales V2** para exponer
    la identidad canónica pública de `CompanyIntelligenceV2` (endpoint
    `/api/v2/company-intelligence/identity`). Todos los nuevos campos son
    opcionales — cuando el proveedor no los aporta quedan como `None`.
    """

    model_config = ConfigDict(extra="ignore")

    master_id: str | None = None  # R12: puede ser null si el engine no lo devuelve
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
    # ---- Campos extendidos V2 (Sprint F0.1 · opcionales) ----
    activity: str | None = None
    activity_status: str | None = None
    mercantile_status: str | None = None
    record_status: str | None = None
    legal_form: str | None = None
    incorporation_date: str | None = None
    is_listed: bool | None = None
    listed_market: str | None = None
    sectors: list[str] = Field(default_factory=list)
    description: str | None = None
    address: str | None = None
    autonomous_community: str | None = None
    data_coverage: dict[str, bool] = Field(default_factory=dict)


# ---------- Interfaz del proveedor ----------


class MasterProvider(ABC):
    """Contrato semántico del `MasterProvider` de arroba.

    R12: la implementación real (`AgencyToolIdentityResolver`) NO llama a
    `/api/v1/master/*`. Compone `financial-intelligence/analyze` +
    `semantic-intelligence/search` para reconstruir el schema §6.1 desde
    engines públicos con `X-API-Key`.
    """

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
        """Resolución por CIF. Se usa desde `/api/companies/{cif}/identity`.

        En el implementador real: aplica el patrón R12 (Financial→Semantic→404).
        """
        ...


class MasterNotFoundError(LookupError):
    """No existe Master Record para el identificador dado (o Master Layer vacío)."""


class MasterProviderError(RuntimeError):
    """Fallo del proveedor (5xx, timeout, network, unauthorized)."""

    def __init__(self, message: str, *, error_class: str = "server_5xx") -> None:
        super().__init__(message)
        self.error_class = error_class


# Alias semántico para uso futuro (mismo tipo, distinta lectura).
IdentityResolver = MasterProvider


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
    "IdentityResolver",  # alias
    "MasterNotFoundError",
    "MasterProviderError",
]
