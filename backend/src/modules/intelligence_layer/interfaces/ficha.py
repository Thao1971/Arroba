"""Contrato interno `CompanyFicha` — agregador `/company/{cif}/ficha` (B-2.4).

Passthrough puro (R4/R10/R15): mapea el response del agregador de Intel
(`GET /company/{cif}/ficha`) al DTO interno `arroba-ficha-v1`.

* `finances` se REUTILIZA de `FinancialAnalysis` (F0.2 · con `ranking` [B-2.1] y
  `cash_flow` [B-2.5]) — mismo shape que `/api/companies/{cif}/financial-analysis`.
* `identity`, `ownership`, `governance`, `events`, `ranking` (top-level): passthrough
  como `dict | None`. **No hacen transformaciones**. El frontend consume el shape
  literal para B-2.2 (Ownership) y B-2.3 (Governance) en fases posteriores.

Mixed-access: en el endpoint, `finances` se nullifica para usuario anónimo.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from src.modules.intelligence_layer.interfaces.financial import FinancialAnalysis

# Nombre del contrato interno que arroba emite al frontend (R5 decoupled).
INTERNAL_FICHA_ENGINE_VERSION = "arroba-ficha-v1"


class CompanyFicha(BaseModel):
    """Payload agregador · un solo response del backend contiene la ficha completa."""

    model_config = ConfigDict(extra="ignore")

    cif_normalized: str | None = None
    master_id: str | None = None

    # Sección finanzas (auth gated en el endpoint)
    finances: FinancialAnalysis | None = None

    # Bloques públicos (mixed-access permite anónimo)
    identity: dict | None = None
    ownership: dict | None = None
    governance: dict | None = None
    events: dict | None = None
    # Ranking top-level (duplicado de `finances.ranking`; se mantiene para paridad
    # con el shape del agregador Intel).
    ranking: dict | None = None

    engine_version: str = INTERNAL_FICHA_ENGINE_VERSION


__all__ = ["CompanyFicha", "INTERNAL_FICHA_ENGINE_VERSION"]
