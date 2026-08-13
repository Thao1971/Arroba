"""Contrato `FinancialProvider` + DTOs para `financial-intelligence` §6.2/6.3.

Schema replica el pack §6.2 (`analyze`) y §6.3 (`valuation`) del contrato público
`arroba-integration-contract-v1`, con **renombre del `engine_version` interno** a
`arroba-financial-v1`. El frontend NUNCA ve `financial-intelligence-v1`.

Congelado. Cualquier cambio requiere bump de contrato interno.

R12: NUNCA se calcula lógica financiera en arroba (R4). Este módulo es un
transporte tipado — mapea 1:1 los campos del proveedor a DTOs Pydantic.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ---------- FinancialAnalysis (§6.2 `analyze`) ----------


class FinancialKpis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    revenue: float | None = None
    ebitda: float | None = None
    ebitda_margin: float | None = None
    ebit: float | None = None
    ebit_margin: float | None = None
    net_income: float | None = None
    net_margin: float | None = None
    gross_margin: float | None = None
    employees_total: int | None = None
    revenue_per_employee: float | None = None
    revenue_growth_yoy: float | None = None
    revenue_cagr: float | None = None
    ebitda_growth_yoy: float | None = None
    evolution: dict | None = None  # {revenue[], ebitda[], net_income[]}


class IncomeStatement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    revenue: float | None = None
    supplies: float | None = None
    personnel_costs: float | None = None
    depreciation: float | None = None
    operating_income: float | None = None
    financial_expenses: float | None = None
    ebit: float | None = None
    ebitda: float | None = None
    net_income: float | None = None


class BalanceSheet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    current_assets: float | None = None
    non_current_assets: float | None = None
    total_assets: float | None = None
    cash: float | None = None
    current_liabilities: float | None = None
    non_current_liabilities: float | None = None
    total_liabilities: float | None = None
    st_debt: float | None = None
    lt_debt: float | None = None
    financial_debt: float | None = None
    equity: float | None = None


class FinancialQuality(BaseModel):
    model_config = ConfigDict(extra="ignore")
    score: float | None = None
    assessment: str | None = None
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)


class FinancialAnalysis(BaseModel):
    """Contrato interno frozen para `/api/companies/{cif}/financial-analysis`."""

    model_config = ConfigDict(extra="ignore")

    # Identidad embebida (reutilizable si aún no se cachó desde IdentityResolver).
    master_id: str | None = None
    cif_normalized: str | None = None
    identity: dict | None = None  # copia parcial del identity §6.1
    cnae_code: str | None = None
    cnae_section: str | None = None
    provincia: str | None = None

    # Metadatos de datos
    has_financials: bool = False
    financials_source: str | None = None
    data_source: str | None = None
    source_version: str | None = None
    audited: bool | None = None
    basis: Literal["individual", "consolidated"] | None = None
    year: int | None = None
    years: list[int] = Field(default_factory=list)

    # Bloques principales §6.2
    kpis: FinancialKpis | None = None
    income_statement: IncomeStatement | None = None
    balance_sheet: BalanceSheet | None = None
    cashflow: dict | None = None  # F0.2 · null cuando el motor no expone el bloque
    ratios: dict = Field(default_factory=dict)  # ratios clave-valor dinámicos (ver catalog)
    financial_quality: FinancialQuality | None = None
    solvency: dict | None = None
    trend: dict | None = None
    anomaly: dict | None = None
    deterioration: dict | None = None
    evolution: dict | None = None  # F0.2 · {trend, years, anomaly, points[]}
    valuation: dict | None = None  # F0.2 · bloque valuation embebido (opcional)
    assessment: dict | None = None  # F0.2 · {strengths[], weaknesses[], risks[]}
    ranking: dict | None = None  # B-2.1 · HARDENING-003 · passthrough analyze.ranking (sector_revenue_percentile, market_position, locality_position, explain[])
    cash_flow: dict | None = None  # B-2.5 · HARDENING-005 · passthrough analyze.statements.cash_flow ({years[], rows[]}); coexiste con `cashflow` legacy (que puede venir null)
    size_band: str | None = None
    explainability: dict | None = None
    # HARDENING-021 · Fase 2 (2026-08-13) · Procedencia por métrica.
    # Intel emite `finances.provenance = {block: {metric_key: "verified"|"calculated"|"inferred"}}`
    # cubriendo kpis / income_statement / balance_sheet / cashflow / ratios / ranking.
    # Antes se descartaba silenciosamente (extra="ignore" + campo inexistente · mismo
    # patrón que HARDENING-020 con `comparables`). Ahora passthrough dict abierto —
    # el frontend consume las claves literales que Intel emite (zero coupling · sin enumerar).
    # DPD: la procedencia es metadato no-PII. En anon el bloque `finances` completo
    # se nulifica igualmente (patrón HARDENING-016), así que `provenance` viaja como null.
    provenance: dict | None = None

    # Metadatos engine (contrato interno arroba)
    engine_version: str | None = None
    generated_at: datetime | None = None


# ---------- Valuation (§6.3) ----------


class ValuationRange(BaseModel):
    model_config = ConfigDict(extra="ignore")
    low: float | None = None
    high: float | None = None


class ValuationDetails(BaseModel):
    model_config = ConfigDict(extra="ignore")
    method: str | None = None
    multiple: float | None = None
    multiple_basis: str | None = None
    enterprise_value: float | None = None
    equity_value: float | None = None
    range: ValuationRange | None = None
    subject_ebitda_margin_percentile: float | None = None


class ComparablePeer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    name: str | None = None
    cnae_section: str | None = None
    same_province: bool | None = None
    ebitda_margin: float | None = None
    multiple: float | None = None


class Comparables(BaseModel):
    model_config = ConfigDict(extra="ignore")
    peers: list[ComparablePeer] = Field(default_factory=list)
    criteria: dict | None = None
    count: int = 0


class Valuation(BaseModel):
    """Contrato interno frozen para `/api/companies/{cif}/valuation`."""

    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    valuation: ValuationDetails | None = None
    comparables: Comparables | None = None
    assumptions: dict | None = None
    criteria: dict | None = None
    confidence: float | None = None
    explanation: str | dict | None = None
    engine_version: str | None = None
    generated_at: datetime | None = None


# ---------- RatiosCatalog (§6 catálogo estático) ----------


class RatioDefinition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    name: str
    category: str | None = None
    formula: str | None = None
    explanation: str | None = None


class RatiosCatalog(BaseModel):
    """Catálogo canónico de ratios que arroba expone a través del proxy."""

    model_config = ConfigDict(extra="ignore")
    ratios: list[RatioDefinition] = Field(default_factory=list)
    source: str | None = None
    engine_version: str | None = None
    generated_at: datetime | None = None


# ---------- Interfaz del proveedor ----------


class FinancialProvider(ABC):
    """Contrato que cualquier proveedor Financial debe cumplir."""

    provider_name: str  # "mock" | "agency_tool"

    @abstractmethod
    async def analyze(self, cif: str) -> FinancialAnalysis:
        """`POST /financial-intelligence/analyze {"identifier": cif}` (§6.2)."""
        ...

    @abstractmethod
    async def valuation(self, cif: str) -> Valuation:
        """`POST /financial-intelligence/valuation {"identifier": cif}` (§6.3)."""
        ...

    @abstractmethod
    async def ratios_catalog(self) -> RatiosCatalog:
        """`GET /financial-intelligence/ratios/catalog` (§6, cache 24h)."""
        ...


class FinancialNotFoundError(LookupError):
    """El proveedor devolvió 404 (empresa no encontrada en Master Layer)."""


class FinancialProviderError(RuntimeError):
    """Fallo transitorio del proveedor (5xx, timeout, network, unauthorized)."""

    def __init__(self, message: str, *, error_class: str = "server_5xx") -> None:
        super().__init__(message)
        self.error_class = error_class


__all__ = [
    "FinancialAnalysis",
    "FinancialKpis",
    "IncomeStatement",
    "BalanceSheet",
    "FinancialQuality",
    "Valuation",
    "ValuationDetails",
    "ValuationRange",
    "Comparables",
    "ComparablePeer",
    "RatiosCatalog",
    "RatioDefinition",
    "FinancialProvider",
    "FinancialNotFoundError",
    "FinancialProviderError",
]
