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
    # HARDENING-012 · 2026-08-12 · Bloque `market` top-level entregado por Intel
    # (agregador `arroba-company-ficha-v1`). Shape observado:
    #   {
    #     available: bool,
    #     sector: { cnae_code, cnae_label, cnae_level, size_score, dynamism_score,
    #               growth_score, activity_score, active_companies, iberinform_companies,
    #               market_share, national_yoy_pct, trend_direction, primary_driver, signal },
    #     geo: { geo_id, geo_name, geo_level, parent_ccaa, size_score, dynamism_score,
    #            growth_score, revenue_growth, employment_growth, net_company_creation,
    #            active_companies, trend_direction, primary_driver, signal },
    #     concentration: { level, degraded, cnae_field, cnae_value, hhi,
    #                      concentration_label, market_actors_count,
    #                      distinct_ownership_groups, standalone_targets_count,
    #                      total_companies_in_universe, companies_with_revenue_data,
    #                      hhi_methodology, caveat|degraded_reason },
    #     position: { sector_revenue_percentile, market_position, locality_position, explain[] },
    #     coverage: { sector, geo, concentration, position },
    #   }
    # `position` duplica semánticamente `finances.ranking`. Se conserva la duplicidad
    # y se consumirá en la sección Mercado (panel Posición) mientras que
    # `finances.ranking` alimenta la sección Rankings independiente.
    market: dict | None = None

    # HARDENING-014 · 2026-08-13 · Bloque `control_graph` top-level entregado
    # por Intel (`arroba-company-ficha-v1`). Passthrough `dict | None`. Shape
    # observado (Servier B28184687):
    #   {
    #     available: bool,
    #     company: { master_id, name, cif },
    #     upstream: [ { name, cif, master_id, pct, as_of_year, is_person,
    #                    relationship, is_ubo } ],
    #     downstream: [ { name, cif, master_id, pct, as_of_year } ],
    #     ubo: { name, cif, is_person } | None,
    #     group_id: str | None,
    #     control: { controlling_shareholder, top1_pct, tier },
    #     nodes: [ { id, name, kind, cif?, pct?, is_ubo?, is_person? } ],
    #     edges: [ { source, target, pct, type } ],
    #     narrative: str,
    #     coverage: { upstream_count, downstream_count, truncated },
    #     engine_version: str,
    #   }
    # Anon: se aplica DPD en el endpoint (elimina PII de `upstream/downstream/
    # ubo/nodes/edges`, emite `summary` agregado). Auth: passthrough completo.
    control_graph: dict | None = None

    engine_version: str = INTERNAL_FICHA_ENGINE_VERSION


__all__ = ["CompanyFicha", "INTERNAL_FICHA_ENGINE_VERSION"]
