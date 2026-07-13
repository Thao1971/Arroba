"""Contrato `ValuationProvider` — Sprint F0.3 · endpoint canónico
`POST /api/v1/financial-intelligence/valuation`.

Contratos internos canónicos (`arroba-valuation-v1`):
  * `ValuationAnalysis` (uso backend + UI-facing): shape decoupled del
    proveedor externo. Nunca menciona `financial-intelligence-v1`.
  * `ValuationRange`: rango canónico low/central/high (arroba añade
    `central` derivado de `enterprise_value` para facilitar el pintado).
  * `ValuationLineage`: trazabilidad P1 (fuente de las cifras).

R5 · R12 · P3: la implementación real usa endpoint público `X-API-Key`.
Nunca toca rutas administrativas (R12).
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from pydantic import BaseModel, ConfigDict, Field

ENGINE_VERSION = "arroba-valuation-v1"


class ValuationRange(BaseModel):
    model_config = ConfigDict(extra="ignore")
    low: float | None = None
    central: float | None = None  # = enterprise_value canónico (arroba añade)
    high: float | None = None


class ValuationLineage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    financials_source: str | None = None
    basis: str | None = None
    year: int | None = None


class ValuationAnalysis(BaseModel):
    """Contrato canónico `arroba-valuation-v1` (interno + UI-facing)."""

    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    method: str | None = None
    method_label: str | None = None  # legible en UI (`EV/EBITDA sectorial`, etc.)
    multiple: float | None = None
    multiple_basis: str | None = None  # e.g. `inferred_reference` · `sector_median`
    enterprise_value: float | None = None
    equity_value: float | None = None
    range: ValuationRange | None = None
    confidence: float | None = None
    confidence_level: str | None = None  # low/medium/high · derivado de confidence
    hypotheses: list[str] = Field(default_factory=list)
    lineage: ValuationLineage | None = None
    # Capacidades futuras del motor (BLOCKED en F0.3):
    bridge_components: list[dict] | None = None
    scenarios: list[dict] | None = None
    sensitivity: dict | None = None
    # Metadatos canónicos:
    has_valuation: bool = False
    engine_version: str = ENGINE_VERSION


class ValuationProvider(ABC):
    """Contrato semántico. R12/P3."""

    provider_name: str

    @abstractmethod
    async def analyze_valuation(self, identifier: str) -> ValuationAnalysis:
        """Devuelve la valoración canónica.

        `identifier` puede ser un CIF o un `master_id`.

        Errores esperados:
          * `ValuationNotFoundError` — 404 en el proveedor.
          * `ValuationProviderError` — 5xx / unauthorized / body inválido.
        """
        ...


class ValuationNotFoundError(LookupError):
    """El proveedor no encontró la empresa o no tiene valoración."""


class ValuationProviderError(RuntimeError):
    """Fallo del proveedor."""

    def __init__(self, message: str, *, error_class: str = "server_5xx") -> None:
        super().__init__(message)
        self.error_class = error_class


__all__ = [
    "ENGINE_VERSION",
    "ValuationRange",
    "ValuationLineage",
    "ValuationAnalysis",
    "ValuationProvider",
    "ValuationNotFoundError",
    "ValuationProviderError",
]
