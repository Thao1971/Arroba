"""Contratos canónicos UI del `intelligence_layer` (D2 · B.6.f).

Estos schemas son los que el **frontend consume directamente** vía endpoints
`/api/companies/{cif}/section/*`. Están optimizados para el render de la
ficha canónica de empresa:

* Arrays por año (para tablas multi-año y charts multi-serie).
* `metadata.coverage` explícito → el frontend sabe qué mostrar y qué
  degradar a `UnavailableBlock`.
* `explainability` slot vacío/opcional en cada bloque (D3).
* Superficie `annotations[]` en charts (A1).
* Celdas ricas (`variation`, `semantic`, `benchmark`, `explanation`) en
  tablas (A2).

Regla R5 (zero coupling FE↔proveedor externo):
    * `metadata.engine_version` **siempre** empieza por `arroba-`.
    * `metadata.source` es user-facing (ej. "Iberinform · Registradores
      Mercantiles"). NUNCA menciona "Agency Tool" ni nombres internos del
      proveedor.
    * Ningún campo de este schema replica nombres del contrato externo
      `financial-intelligence-v1` / `semantic-intelligence-v1`.

Regla R4/R10 (zero calculation en arroba):
    * `variation`, `benchmark`, `semantic`, `explanation` sólo se pueblan
      con lo que el proveedor devuelve. Si no lo devuelve → `None`.
    * `explainability` es un slot para `arroba-explainability-v1` (fase
      futura). Hoy siempre es `None`.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ============================================================
# Tipos comunes
# ============================================================

ConfidenceLevel = Literal["low", "medium", "high"]
Severity = Literal["low", "medium", "high"]
Impact = Literal["low", "medium", "high"]
Direction = Literal["up", "down", "flat"]
Magnitude = Literal["weak", "medium", "strong"]
CellFormat = Literal["currency", "percent", "number", "ratio"]
Semantic = Literal["positive", "negative", "neutral", "warning"]
RowCategory = Literal["total", "subtotal", "line", "derived"]
RatioCategory = Literal["profitability", "liquidity", "solvency", "efficiency", "growth"]
SeriesFormat = Literal["currency", "percent", "ratio"]
RatioFormat = Literal["percent", "ratio", "currency", "multiple", "days"]


class ConfidenceInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    level: ConfidenceLevel
    score: float | None = None  # 0-100 opcional


class SectionCoverage(BaseModel):
    """Flags booleanos por sub-bloque. El frontend degrada a UnavailableBlock
    cualquier sub-bloque con `False`."""

    model_config = ConfigDict(extra="ignore")
    evolution: bool = False
    profit_loss: bool = False
    balance: bool = False
    ratios: bool = False


class SectionMetadata(BaseModel):
    """Metadata canónica de cada `*Section`. R5 la aplica estrictamente."""

    model_config = ConfigDict(extra="ignore")
    source: str | None = None
    updated_at: datetime | None = None
    confidence: ConfidenceInfo | None = None
    engine_version: str  # `arroba-*-v1`
    coverage: SectionCoverage | None = None
    generated_at: datetime | None = None


class Variation(BaseModel):
    """Variación relativa/absoluta por celda (YoY, QoQ, …). Poblada por el
    proveedor, no calculada por arroba (R4)."""

    model_config = ConfigDict(extra="ignore")
    value: float
    direction: Direction
    magnitude: Magnitude


class Benchmark(BaseModel):
    model_config = ConfigDict(extra="ignore")
    median: float
    percentile: float | None = None


class ChartAnnotation(BaseModel):
    """Anotación temporal para charts (A1). Superficie preparada para B.6.d/e."""

    model_config = ConfigDict(extra="ignore")
    id: str
    timestamp: str | int  # eje X donde vive (ISO o número)
    type: Literal["anomaly", "trend_change", "milestone", "corporate_event"]
    subtype: str | None = None
    title: str
    description: str | None = None
    severity: Severity | None = None


class BlockExplainabilityRisk(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    description: str
    severity: Severity


class BlockExplainabilityOpportunity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    description: str
    impact: Impact


class BlockExplainability(BaseModel):
    """Slot canónico D3 · vacío en B.6.f, poblado por `arroba-explainability-v1`
    en fase futura."""

    model_config = ConfigDict(extra="ignore")
    key_insight: str | None = None
    relevance: str | None = None
    buyer_perspective: str | None = None
    seller_perspective: str | None = None
    risks: list[BlockExplainabilityRisk] = Field(default_factory=list)
    opportunities: list[BlockExplainabilityOpportunity] = Field(default_factory=list)
    confidence: ConfidenceInfo | None = None
    generated_at: datetime | None = None
    engine_version: str | None = None  # p.ej. `arroba-explainability-v1`


# ============================================================
# FinancialSection (D2)
# ============================================================


class FinancialTableCell(BaseModel):
    model_config = ConfigDict(extra="ignore")
    value: float | None = None
    format: CellFormat = "number"
    variation: Variation | None = None
    semantic: Semantic | None = None
    benchmark: Benchmark | None = None
    explanation: str | None = None


class FinancialTableRow(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    label: str
    category: RowCategory = "line"
    values: list[FinancialTableCell] = Field(default_factory=list)


class FinancialSeries(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    label: str
    values: list[float | None] = Field(default_factory=list)
    format: SeriesFormat = "currency"


class FinancialEvolutionBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    years: list[int] = Field(default_factory=list)
    series: list[FinancialSeries] = Field(default_factory=list)
    annotations: list[ChartAnnotation] = Field(default_factory=list)


class FinancialTableBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    years: list[int] = Field(default_factory=list)
    rows: list[FinancialTableRow] = Field(default_factory=list)


class FinancialRatioItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    name: str
    value: float | None = None
    format: RatioFormat = "ratio"
    category: RatioCategory
    formula: str | None = None
    benchmark: Benchmark | None = None
    # Fase 5 (2026-09-01) · None/True = sin marcar (ratios propios de arroba,
    # siempre fiables). False = pendiente de verificar contra el diccionario
    # oficial de Iberinform (ver IBERINFORM_RATIOS_PRIORITY.md) — el frontend
    # pinta un icono "!" ámbar, nunca oculta la fila (R15: mostrar con aviso,
    # no fabricar ni esconder).
    verified: bool | None = None


class FinancialRatiosBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    items: list[FinancialRatioItem] = Field(default_factory=list)


class FinancialAnomaly(BaseModel):
    model_config = ConfigDict(extra="ignore")
    detected: bool = False
    severity: Severity | None = None
    title: str | None = None
    explanation: str | None = None


class FinancialSection(BaseModel):
    """Contrato canónico UI arroba-financial-v1 (D2)."""

    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    evolution: FinancialEvolutionBlock | None = None
    profit_loss: FinancialTableBlock | None = None
    balance: FinancialTableBlock | None = None
    ratios: FinancialRatiosBlock | None = None
    anomaly: FinancialAnomaly | None = None
    annotations: list[ChartAnnotation] = Field(default_factory=list)
    explainability: BlockExplainability | None = None
    metadata: SectionMetadata


# ============================================================
# IdentitySection (D2)
# ============================================================


class IdentityContact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    web: str | None = None
    domain: str | None = None


class IdentitySize(BaseModel):
    model_config = ConfigDict(extra="ignore")
    employees_total: int | None = None
    capital_social: float | None = None


class IdentityClassification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cnae_code: str | None = None
    cnae_description: str | None = None
    cnae_section: str | None = None
    cnae_division: str | None = None


class IdentityLocation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    provincia: str | None = None
    municipio: str | None = None
    codigo_postal: str | None = None
    pais: str | None = None


class IdentitySectionCoverage(BaseModel):
    """Coverage específico de la sección Resumen/Identity."""

    model_config = ConfigDict(extra="ignore")
    core: bool = False
    ownership: bool = False
    officers: bool = False
    objeto_social: bool = False


class IdentityRegistryStatus(BaseModel):
    """Estado registral y mercantil (Sprint F0.1 · V2). P1 Explainability first."""

    model_config = ConfigDict(extra="ignore")
    mercantile_status: str | None = None
    record_status: str | None = None
    activity_status: str | None = None
    legal_form: str | None = None
    incorporation_date: str | None = None
    is_listed: bool | None = None
    listed_market: str | None = None


class IdentitySection(BaseModel):
    """Contrato canónico UI arroba-identity-v1 (D2).

    Sprint F0.1 (2026-07-06): superficie extendida con `registry_status`,
    `activity`, `sectors[]`, `address`, `description` y `data_coverage`
    para alimentar los COMP-1001..1005 del Header sin acoplarse al shape
    crudo del proveedor V2.
    """

    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    status: Literal["active", "merged", "deprecated"] = "active"
    legal_name: str | None = None
    commercial_name: str | None = None
    aliases: list[str] = Field(default_factory=list)
    country: str | None = None
    classification: IdentityClassification
    location: IdentityLocation
    contact: IdentityContact
    size: IdentitySize
    objeto_social: str | None = None
    officers_count: int | None = None
    coverage: IdentitySectionCoverage
    explainability: BlockExplainability | None = None
    metadata: SectionMetadata
    # ---- F0.1 · superficie ampliada ----
    activity: str | None = None
    sectors: list[str] = Field(default_factory=list)
    address: str | None = None
    autonomous_community: str | None = None
    description: str | None = None
    registry_status: IdentityRegistryStatus | None = None
    data_coverage: dict[str, bool] = Field(default_factory=dict)


# ============================================================
# ValuationSection (D2)
# ============================================================


class ValuationRangeBar(BaseModel):
    model_config = ConfigDict(extra="ignore")
    low: float | None = None
    central: float | None = None
    high: float | None = None
    currency: Literal["EUR"] = "EUR"


class ValuationPeer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    name: str | None = None
    cnae_section: str | None = None
    same_province: bool | None = None
    ebitda_margin: float | None = None
    multiple: float | None = None


class ValuationSectionCoverage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    valuation: bool = False
    peers: bool = False


class ValuationSection(BaseModel):
    """Contrato canónico UI arroba-financial-v1 (D2, sección valoración)."""

    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    method: str | None = None  # "ebitda_multiple" | "revenue_multiple" | …
    multiple_label: str | None = None
    multiple_value: float | None = None
    range: ValuationRangeBar | None = None
    peers: list[ValuationPeer] = Field(default_factory=list)
    inputs: list[dict] = Field(default_factory=list)  # [{label,value,hint?}]
    disclaimer: str | None = None
    coverage: ValuationSectionCoverage
    explainability: BlockExplainability | None = None
    metadata: SectionMetadata


# ============================================================
# SemanticSection (D2)
# ============================================================


class SemanticSimilarItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif: str | None = None
    name: str
    sector: str | None = None
    region: str | None = None
    score: float
    matched_dimensions: list[str] = Field(default_factory=list)


class SemanticSectionCoverage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    profile: bool = False
    similar: bool = False


class SemanticSection(BaseModel):
    """Contrato canónico UI arroba-semantic-v1 (D2)."""

    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    activities: list[str] = Field(default_factory=list)
    products_services: list[str] = Field(default_factory=list)
    markets: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    value_proposition: str | None = None
    business_model: str | None = None
    similar: list[SemanticSimilarItem] = Field(default_factory=list)
    coverage: SemanticSectionCoverage
    explainability: BlockExplainability | None = None
    metadata: SectionMetadata


__all__ = [
    # Tipos comunes
    "ConfidenceInfo",
    "SectionCoverage",
    "SectionMetadata",
    "Variation",
    "Benchmark",
    "ChartAnnotation",
    "BlockExplainability",
    "BlockExplainabilityRisk",
    "BlockExplainabilityOpportunity",
    "FinancialTableCell",
    "FinancialTableRow",
    "FinancialSeries",
    "FinancialEvolutionBlock",
    "FinancialTableBlock",
    "FinancialRatioItem",
    "FinancialRatiosBlock",
    "FinancialAnomaly",
    # Secciones
    "FinancialSection",
    "IdentitySection",
    "IdentityContact",
    "IdentitySize",
    "IdentityClassification",
    "IdentityLocation",
    "IdentitySectionCoverage",
    "IdentityRegistryStatus",
    "ValuationSection",
    "ValuationRangeBar",
    "ValuationPeer",
    "ValuationSectionCoverage",
    "SemanticSection",
    "SemanticSimilarItem",
    "SemanticSectionCoverage",
]
