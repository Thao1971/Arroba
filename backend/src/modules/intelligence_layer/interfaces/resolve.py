"""Contrato `ResolveProvider` — Sprint F0.2 · resolución CIF → master_id.

Endpoint canónico externo (V2):
    POST /api/v2/company-intelligence/resolve   { "cif": "<CIF>" | "name": "<name>" }
    → 200 { "query": {...}, "count": N, "matches": [...], "capability_version": ... }

Contrato interno canónico (arroba-resolve-v1):
    - `ResolveResult` es el resultado interno canónico (uso backend); contiene
      `master_id` para orquestación posterior (identity, financial, …).
    - `PublicResolveResult` es el resultado UI-facing; NO contiene `master_id`
      (F0.2-OP3 · master_id es identificador interno, nunca expuesto al usuario
      final).

R12/P3: `ResolveProvider` es la única frontera del engine `company-intelligence`
para resolución. `AgencyToolResolveProvider` mapea el payload externo al
contrato interno; los consumidores nunca ven el shape crudo del proveedor.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from pydantic import BaseModel, ConfigDict, Field

ENGINE_VERSION = "arroba-resolve-v1"


class ResolveMatch(BaseModel):
    """Match individual devuelto por `resolve`. Uso interno backend."""

    model_config = ConfigDict(extra="ignore")
    master_id: str
    cif: str | None = None
    legal_name: str | None = None
    province: str | None = None
    cnae_section: str | None = None
    match_type: str  # cif_exact | name_partial | …
    score: float


class ResolveResult(BaseModel):
    """Resultado canónico interno de una operación de resolución.

    Contiene `master_id` para orquestación posterior en el mismo request cycle.
    NO se expone directamente por endpoint público UI-facing.
    """

    model_config = ConfigDict(extra="ignore")
    cif: str
    resolved: bool = True
    master_id: str
    canonical_name: str | None = None
    match_type: str
    score: float
    engine_version: str = ENGINE_VERSION


class PublicResolveResult(BaseModel):
    """Resultado UI-facing (contrato F0.2-OP3).

    - NO expone `master_id` (identificador interno, protegido).
    - Sí expone `canonical_name`, `match_type`, `score` para tooltips P1
      explainability-first en el frontend.
    """

    model_config = ConfigDict(extra="ignore")
    cif: str
    resolved: bool = True
    canonical_name: str | None = None
    match_type: str
    score: float
    engine_version: str = ENGINE_VERSION


class PublicResolveNotFound(BaseModel):
    """Respuesta canónica cuando `count=0` en el proveedor."""

    model_config = ConfigDict(extra="ignore")
    cif: str
    resolved: bool = False
    reason: str = "not_found_in_master_layer"
    engine_version: str = ENGINE_VERSION


class ResolveProvider(ABC):
    """Contrato semántico del `ResolveProvider`.

    R12/P3: la implementación real usa `POST /api/v2/company-intelligence/resolve`
    (endpoint público con `X-API-Key`). Nunca rutas administrativas (R12).
    """

    provider_name: str

    @abstractmethod
    async def resolve_by_cif(self, cif: str) -> ResolveResult:
        """Devuelve la resolución canónica para el CIF.

        Errores esperados:
          * `ResolveNotFoundError` — `count=0` en la respuesta del proveedor.
          * `ResolveProviderError` — cualquier fallo transitorio.
        """
        ...


class ResolveNotFoundError(LookupError):
    """No existe empresa con ese CIF en el Master Layer del proveedor."""


class ResolveProviderError(RuntimeError):
    """Fallo del proveedor (5xx, timeout, network, unauthorized, 4xx inesperado)."""

    def __init__(self, message: str, *, error_class: str = "server_5xx") -> None:
        super().__init__(message)
        self.error_class = error_class


__all__ = [
    "ENGINE_VERSION",
    "ResolveMatch",
    "ResolveResult",
    "PublicResolveResult",
    "PublicResolveNotFound",
    "ResolveProvider",
    "ResolveNotFoundError",
    "ResolveProviderError",
]
