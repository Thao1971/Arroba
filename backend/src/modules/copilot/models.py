"""Copilot module — orchestrates Skills and returns Workspace specs.

Each Skill emits a Workspace = ordered list of Blocks. Blocks form a
discriminated union over `type` (see `BlockSpec`).

E1.3 shipped:
  - search → SearchResultsBlock / EmptyStateBlock / ErrorBlock / LoadingBlock

E1.4 adds:
  - analyze   → HeroBlock + MetricsBlock + CompanyCardBlock + NarrativeBlock
  - value     → HeroBlock + ValuationBlock + MetricsBlock + NarrativeBlock
  - recommend → HeroBlock + CompanyCardsGridBlock + NarrativeBlock (LLM-assisted intent
                routing; deterministic body backed by the Mock adapter for now).

Contract is designed so a future real Skill (powered by the Agency Tool real
endpoint REQ-003+) can swap implementation without breaking the response
shape.
"""
from __future__ import annotations

from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Field

from src.modules.entities.models import EntityLookupResult

# ---------------------------------------------------------------------------
# Request — what the frontend sends. One context shape for every Skill.
# ---------------------------------------------------------------------------
class SkillContext(BaseModel):
    """Context that travels with every Skill request."""
    model_config = ConfigDict(extra="forbid")
    locale: Literal["es", "en"] = "es"
    pathname: str = Field(default="/", max_length=512)
    user_id: str | None = Field(default=None, max_length=100)
    org_id: str | None = Field(default=None, max_length=100)
    # Entity context (Sprint 1, Regla 1): declarado cuando el usuario está
    # sobre la ficha de una entidad. El TC/Copilot lo usa para grounding.
    # Opcional y retrocompatible: si no se envía, el copilot razona sin
    # contexto de entidad.
    entity_type: Literal[
        "company", "sector", "territory", "person", "advisor",
        "mandate", "match", "operation", "valuation", "document", "opportunity",
    ] | None = None
    entity_id: str | None = Field(default=None, max_length=80)


class SearchSkillRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=1, max_length=200)
    context: SkillContext = Field(default_factory=SkillContext)
    # HARDENING-REQ003 · Server-side pagination for the results page
    # (categorical/taxonomy + semantic modes). `/resultados` re-pide cada
    # página con `offset = page * _RESULTS_PAGE`.
    offset: int = Field(default=0, ge=0)
    # BUGFIX-2026-09-09 · Daniel (Punto 2): ordenación server-side para el
    # Grupo A de columnas (`name`, `revenue`, `ebitda`, `employees`, `cif`).
    # Beta hace passthrough puro: reenvía el par (`sort_by`, `sort_dir`) a
    # Intel como query params — no reordena localmente. El resto de columnas
    # (Grupo B: growth_pct, signal_score, valuation, arroba_score) sigue
    # ordenándose front-only con `useMemo(sortedRows)` sobre la página visible.
    sort_by: str | None = None
    sort_dir: Literal["asc", "desc"] | None = None


class AnalyzeSkillRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=1, max_length=300)
    context: SkillContext = Field(default_factory=SkillContext)


class ValueSkillRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=1, max_length=300)
    context: SkillContext = Field(default_factory=SkillContext)


class RecommendSkillRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=1, max_length=300)
    context: SkillContext = Field(default_factory=SkillContext)


# ---------------------------------------------------------------------------
# Block specs — discriminated union by `type`.
# ---------------------------------------------------------------------------
class SearchResultItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    master_company_id: str
    name: str
    legal_name: str | None = None
    cif: str | None = None
    sector: str | None = None
    city: str | None = None
    score: float = Field(ge=0.0, le=1.0)
    # HARDENING-REQ003 · Intel row enrichment (revenue, ebitda, ebitda_margin,
    # growth_pct, signal_score, signal_badge, valuation{low,mid,high}, employees,
    # arroba_score, city, activity_label, updated_at). Present when Intel emits
    # `summary` in the SearchHit; None otherwise (table shows «—»).
    summary: dict | None = None


class SearchResultsBlockProps(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str
    total: int
    results: list[SearchResultItem]


class EmptyStateBlockProps(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    description: str | None = None
    suggestions: list[str] = Field(default_factory=list, max_length=4)


class ErrorBlockProps(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    message: str | None = None
    code: str | None = None
    retry_intent: str | None = None  # the intent to dispatch on "retry"


# ----- E1.4 props ---------------------------------------------------------
class HeroBlockProps(BaseModel):
    """Hero strap rendered above a workspace. Used by Analyze, Value, Recommend
    to anchor the workspace with a title + tagline + optional eyebrow."""
    model_config = ConfigDict(extra="forbid")
    eyebrow: str | None = None
    title: str
    subtitle: str | None = None
    tone: Literal["neutral", "success", "warning", "info"] = "neutral"


class MetricItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    label: str
    value: str
    hint: str | None = None
    trend: Literal["up", "down", "flat"] | None = None


class MetricsBlockProps(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = None
    items: list[MetricItem] = Field(min_length=1, max_length=8)


class CompanyCardProps(BaseModel):
    """Single rich card with the canonical bits the user expects to see for
    an analysed company."""
    model_config = ConfigDict(extra="forbid")
    master_company_id: str
    name: str
    legal_name: str | None = None
    cif: str | None = None
    sector: str | None = None
    region: str | None = None
    country: str | None = "ES"
    revenue: float | None = None  # EUR
    ebitda: float | None = None  # EUR
    employees: int | None = None
    fiscal_year: int | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)


class CompanyCardsGridItem(BaseModel):
    """Item inside CompanyCardsGridBlock. Lighter than CompanyCardProps —
    designed for grid density."""
    model_config = ConfigDict(extra="forbid")
    master_company_id: str
    name: str
    sector: str | None = None
    region: str | None = None
    score: float = Field(ge=0.0, le=1.0)
    reason: str | None = None  # 1-line LLM-style reason ("similar by sector & size")


class CompanyCardsGridProps(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = None
    subtype: Literal[
        "similar_to_company",
        "opportunities_by_sector",
        "list_by_sector",
        "generic",
    ] = "generic"
    items: list[CompanyCardsGridItem] = Field(default_factory=list, max_length=12)


class ValuationBlockProps(BaseModel):
    model_config = ConfigDict(extra="forbid")
    company_name: str
    sector: str | None = None
    method: Literal["ebitda_multiple", "revenue_multiple"] = "ebitda_multiple"
    multiple_label: str  # e.g. "EV/EBITDA 6.0x"
    multiple_value: float = Field(gt=0)
    central_value: float = Field(ge=0)  # EUR
    low_value: float = Field(ge=0)
    high_value: float = Field(ge=0)
    currency: Literal["EUR"] = "EUR"
    inputs: list[MetricItem] = Field(default_factory=list, max_length=6)
    disclaimer: str  # required — regulatory / non-binding language


class NarrativeBlockProps(BaseModel):
    """LLM-generated structured narrative. Strict shape so the frontend always
    knows where each list lives. All lists optional but at least one must be
    non-empty (validated at construction)."""
    model_config = ConfigDict(extra="forbid")
    title: str | None = None
    summary: str | None = None
    key_points: list[str] = Field(default_factory=list, max_length=6)
    risks: list[str] = Field(default_factory=list, max_length=6)
    opportunities: list[str] = Field(default_factory=list, max_length=6)
    citations: list[str] = Field(default_factory=list, max_length=6)


# Discriminator wrappers ----------------------------------------------------
class SearchResultsBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["search_results"] = "search_results"
    id: str
    props: SearchResultsBlockProps


class EmptyStateBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["empty_state"] = "empty_state"
    id: str
    props: EmptyStateBlockProps


class ErrorBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["error"] = "error"
    id: str
    props: ErrorBlockProps


class HeroBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["hero"] = "hero"
    id: str
    props: HeroBlockProps


class MetricsBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["metrics"] = "metrics"
    id: str
    props: MetricsBlockProps


class CompanyCardBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["company_card"] = "company_card"
    id: str
    props: CompanyCardProps


class CompanyCardsGridBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["company_cards_grid"] = "company_cards_grid"
    id: str
    props: CompanyCardsGridProps


class ValuationBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["valuation"] = "valuation"
    id: str
    props: ValuationBlockProps


class NarrativeBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["narrative"] = "narrative"
    id: str
    props: NarrativeBlockProps


BlockSpec = Annotated[
    Union[
        SearchResultsBlock,
        EmptyStateBlock,
        ErrorBlock,
        HeroBlock,
        MetricsBlock,
        CompanyCardBlock,
        CompanyCardsGridBlock,
        ValuationBlock,
        NarrativeBlock,
    ],
    Field(discriminator="type"),
]


# ---------------------------------------------------------------------------
# Response — Workspace = ordered list of blocks + metadata.
# ---------------------------------------------------------------------------
class Workspace(BaseModel):
    """A workspace is the materialised result of a Skill. Renders inside the
    Copilot dock's expanded panel (transient, no URL until E1.5)."""
    model_config = ConfigDict(extra="forbid")
    workspace_id: str
    intent: str
    blocks: list[BlockSpec]


class DisambiguationItem(BaseModel):
    """One row of the dropdown shown by the dock when a search query matches
    2-5 known companies. Used by the entity-resolution path of
    `POST /api/copilot/skills/search` (E1.5-REWORK)."""
    model_config = ConfigDict(extra="forbid")
    master_company_id: str
    cif: str | None = None
    name: str
    sector: str | None = None
    region: str | None = None


class SearchSkillResponse(BaseModel):
    """Multi-shape response:
      - legacy (exploratory query, no entity match): `workspace` is filled
        with a `SearchResultsBlock` or `EmptyStateBlock`.
      - resolve (exact match on name/CIF): `navigate_to` + `entity_type` are
        filled. `workspace` is None.
      - disambiguation (2-5 candidates): `disambiguation` is filled.
        `workspace` is None.
      - empty (0 matches, exploratory): `workspace` filled with EmptyState.
    """
    model_config = ConfigDict(extra="forbid")
    workspace: Workspace | None = None
    source: Literal["mock", "real"] = "mock"
    query: str
    # Entity-resolution surface (E1.5-REWORK).
    navigate_to: str | None = None
    entity_type: Literal["company", "sector", "territory"] | None = None
    disambiguation: list[DisambiguationItem] | None = None
    # HARDENING 2026-08-24 · "Sectores relacionados" — sector/territory/investor
    # que coinciden con la misma query, para chips sobre la tabla de resultados
    # y en el Composer. Solo se rellena cuando `workspace` trae contenido real
    # (nunca en un navigate_to directo ni en disambiguation). `None` si no hay
    # coincidencias o si Intel falla — nunca rompe la búsqueda principal.
    related_entities: list[EntityLookupResult] | None = None


class AnalyzeSkillResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    workspace: Workspace
    source: Literal["mock", "real"] = "mock"
    query: str


class ValueSkillResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    workspace: Workspace
    source: Literal["mock", "real"] = "mock"
    query: str


class RecommendSkillResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    workspace: Workspace
    source: Literal["mock", "real"] = "mock"
    query: str


# Re-export public surface.
__all__: list[str] = [
    "AnalyzeSkillRequest",
    "AnalyzeSkillResponse",
    "BlockSpec",
    "CompanyCardBlock",
    "CompanyCardProps",
    "CompanyCardsGridBlock",
    "CompanyCardsGridItem",
    "DisambiguationItem",
    "CompanyCardsGridProps",
    "EmptyStateBlock",
    "EmptyStateBlockProps",
    "ErrorBlock",
    "ErrorBlockProps",
    "HeroBlock",
    "HeroBlockProps",
    "MetricItem",
    "MetricsBlock",
    "MetricsBlockProps",
    "NarrativeBlock",
    "NarrativeBlockProps",
    "RecommendSkillRequest",
    "RecommendSkillResponse",
    "SearchResultItem",
    "SearchResultsBlock",
    "SearchResultsBlockProps",
    "SearchSkillRequest",
    "SearchSkillResponse",
    "SkillContext",
    "ValuationBlock",
    "ValuationBlockProps",
    "ValueSkillRequest",
    "ValueSkillResponse",
    "Workspace",
]


def _unused() -> Any:
    """Placeholder to silence linters about unused typing helpers."""
    return None
