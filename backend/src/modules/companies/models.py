"""Pydantic models for the companies module.

Shapes the API surface AND the Mongo documents in:
  - company_conversations
  - company_watchlists
  - company_analysis_refreshes
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from src.modules.copilot.models import (
    BlockSpec,
    CompanyCardsGridBlock,
    HeroBlock,
    MetricsBlock,
    NarrativeBlock,
    SkillContext,
    ValuationBlock,
)

# ---------------------------------------------------------------------------
# IDs
# ---------------------------------------------------------------------------
def new_conversation_id() -> str:
    return "conv_" + uuid.uuid4().hex[:12]


def new_message_id() -> str:
    return "cmsg_" + uuid.uuid4().hex[:12]


def new_watchlist_id() -> str:
    return "wl_" + uuid.uuid4().hex[:12]


def new_block_id(prefix: str) -> str:
    return f"blk_{prefix}_{uuid.uuid4().hex[:8]}"


def now_utc() -> datetime:
    return datetime.now(UTC)


# ---------------------------------------------------------------------------
# Section identifiers — the Company Advisor uses these literals when it
# returns `section_updates[]`, so they're locked here as a single source of
# truth.
# ---------------------------------------------------------------------------
SectionId = Literal[
    "identity", "financials", "score", "comparables", "valuation",
    "narrative", "metrics", "signals",
]

# Sections that are HIDDEN for anonymous (un-authenticated) visitors. They
# render under <LockedSectionBlur> on the frontend.
LOCKED_SECTIONS_FOR_ANONYMOUS: list[SectionId] = [
    "score", "comparables", "valuation", "narrative",
]
# "actions" is also locked for anonymous; we expose it as a flag separately
# rather than as a section block.
ANONYMOUS_LOCKED_FLAGS: list[str] = [
    "score", "comparables", "valuation", "narrative", "actions",
]


# ---------------------------------------------------------------------------
# Section update emitted by the Company Advisor.
# ---------------------------------------------------------------------------
class SectionUpdate(BaseModel):
    """A single section that the LLM advisor has decided to refresh in
    response to the user's message. The block carries the same shape used
    by the normal section endpoints."""
    model_config = ConfigDict(extra="forbid")
    section: SectionId
    block: BlockSpec


SuggestedAction = Literal[
    "activate_opportunity",
    "request_valuation",
    "view_finances",
    "save_to_watchlist",
    "share_with_team",
    "download_mercantile_memory",
    "claim_company",
    "refresh_analysis",
]


# ---------------------------------------------------------------------------
# Conversation persistence
# ---------------------------------------------------------------------------
class CompanyConversationMessage(BaseModel):
    """One message inside the (user, company) conversation."""
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=new_message_id)
    conversation_id: str
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1, max_length=8000)
    intent: str | None = None
    # When role == "assistant", we persist the section_updates so the page can
    # rehydrate the user's last view exactly.
    section_updates: list[dict] = Field(default_factory=list)
    suggested_actions: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=now_utc)


class CompanyConversation(BaseModel):
    """A conversation belongs to ONE user about ONE master company."""
    model_config = ConfigDict(extra="ignore")
    conversation_id: str = Field(default_factory=new_conversation_id)
    user_id: str
    master_company_id: str
    cif: str | None = None
    legal_name: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    message_count: int = 0


class GetConversationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    conversation_id: str
    master_company_id: str
    messages: list[CompanyConversationMessage] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Watchlist + Share
# ---------------------------------------------------------------------------
WatchlistVisibility = Literal["private", "team"]


# ---------------------------------------------------------------------------
# Sprint 1 — Módulos canónicos §3.7-§3.12 del ENTITY_FRAMEWORK (aditivos).
# Contratos estables desde el primer día para forward-compatibility.
# ---------------------------------------------------------------------------
class SignalItem(BaseModel):
    """Un evento externo (BORME, contratos públicos, cambios directivos)."""
    model_config = ConfigDict(extra="forbid")
    kind: str  # ej. "borme", "public_contract", "press"
    dated_at: datetime | None = None
    headline: str
    severity: Literal["info", "warning", "critical"] = "info"


class SignalsSection(BaseModel):
    """Sección Señales del ENTITY_FRAMEWORK §3.7.

    En Sprint 1 este objeto queda intencionalmente vacío: la fuente externa
    (BORME) está pendiente de REQ-008; el frontend renderiza
    `UnavailableBlock` cuando `unavailable=true`.
    """
    model_config = ConfigDict(extra="forbid")
    items: list[SignalItem] = Field(default_factory=list)
    unavailable: bool = True
    req: str | None = "REQ-008"
    eta: str | None = "Post-Sprint 1"


class DocumentItem(BaseModel):
    """Un documento en la sección Documentación §3.10."""
    model_config = ConfigDict(extra="forbid")
    doc_id: str
    kind: Literal["memoria_mercantil", "cuentas_anuales", "teaser", "otro"] = "otro"
    display_name: str
    size_bytes: int | None = None
    uploaded_at: datetime | None = None
    download_url: str | None = None


class DocumentsSection(BaseModel):
    model_config = ConfigDict(extra="forbid")
    items: list[DocumentItem] = Field(default_factory=list)


class ActivityItem(BaseModel):
    """Un evento del timeline de Actividad §3.11."""
    model_config = ConfigDict(extra="forbid")
    event_id: str
    kind: Literal[
        "watchlist_added", "watchlist_removed",
        "analysis_refreshed", "valuation_refreshed",
        "comparables_refreshed", "conversation_message",
    ]
    at: datetime
    actor_label: str | None = None  # display name del actor si aplica
    summary: str | None = None


class ActivitySection(BaseModel):
    model_config = ConfigDict(extra="forbid")
    items: list[ActivityItem] = Field(default_factory=list)


class NextBestAction(BaseModel):
    """Card de la sección Next Best Actions §3.12."""
    model_config = ConfigDict(extra="forbid")
    id: Literal[
        "value_company",
        "find_buyers",
        "activate_opportunity",
        "compare_with_other",
    ]
    title: str
    description: str
    icon: str  # canonical icon name; frontend maps to lucide-react
    disabled: bool = False


class CompanyWatchlistEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    watchlist_id: str = Field(default_factory=new_watchlist_id)
    org_id: str
    master_company_id: str
    cif: str | None = None
    legal_name: str | None = None
    saved_by: str  # user_id
    saved_at: datetime = Field(default_factory=now_utc)
    visibility: WatchlistVisibility = "private"


class WatchlistToggleResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    saved: bool
    visibility: WatchlistVisibility | None = None


class ShareToggleResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    visibility: WatchlistVisibility


# ---------------------------------------------------------------------------
# Rate-limit ledger
# ---------------------------------------------------------------------------
class CompanyAnalysisRefresh(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    master_company_id: str
    last_refresh_at: datetime = Field(default_factory=now_utc)


# ---------------------------------------------------------------------------
# Company detail (the response of GET /api/companies/{cif})
# ---------------------------------------------------------------------------
class CompanyIdentity(BaseModel):
    """Plain identity facts: shape is intentionally close to EnrichedCompany
    but tuned for the ficha page (so the frontend can render section 2
    without parsing block specs)."""
    model_config = ConfigDict(extra="forbid")
    master_company_id: str
    cif: str | None = None
    legal_name: str
    sector: str | None = None
    region: str | None = None
    country: str = "ES"
    founded_year: int | None = None
    employees: int | None = None


class CompanyHeaderInfo(BaseModel):
    """Data used by <CompanyHeader>."""
    model_config = ConfigDict(extra="forbid")
    name: str
    cif: str | None = None
    sector: str | None = None
    region: str | None = None
    country: str | None = "ES"
    initials: str
    score: int | None = None  # 0-100, locked for anon


class CompanySections(BaseModel):
    """The materialised sections of the company page. Each is either a
    BlockSpec the frontend already knows how to render, or null when the
    user does not have access to it."""
    model_config = ConfigDict(extra="forbid")
    # Section 1 — Resumen (always visible).
    hero: HeroBlock
    kpi_metrics: MetricsBlock
    # Section 2 — Identidad (always visible). Rendered by a dedicated
    # IdentitySection component using `identity` below.
    identity: CompanyIdentity
    # Section 3 — Financieros (always visible; detail tabs locked for anon).
    financials_metrics: MetricsBlock
    # Section 4 — Score (locked for anonymous).
    score_block: HeroBlock | None = None
    # Section 5 — Comparables (locked for anonymous).
    comparables: CompanyCardsGridBlock | None = None
    # Section 6 — Valoración indicativa (locked for anonymous).
    valuation: ValuationBlock | None = None
    # Section 7 — Análisis del Copilot (locked for anonymous).
    narrative: NarrativeBlock | None = None
    # Sprint 1 — módulos 7-12 del ENTITY_FRAMEWORK §3 (aditivos).
    # Todos son estables por contrato incluso cuando su contenido está
    # vacío o pendiente (REQ-008 en el caso de signals).
    signals: SignalsSection | None = None
    documents: DocumentsSection = Field(
        default_factory=lambda: DocumentsSection(items=[])
    )
    activity: ActivitySection = Field(
        default_factory=lambda: ActivitySection(items=[])
    )
    next_best_actions: list["NextBestAction"] = Field(default_factory=list)


class CompanyDetailResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    header: CompanyHeaderInfo
    sections: CompanySections
    locked_sections: list[str] = Field(default_factory=list)
    in_watchlist: bool = False
    watchlist_visibility: WatchlistVisibility | None = None
    conversation_id: str | None = None
    source: Literal["mock", "real"] = "mock"


# ---------------------------------------------------------------------------
# Messages endpoint
# ---------------------------------------------------------------------------
class SendMessageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=1, max_length=2000)
    context: SkillContext = Field(default_factory=SkillContext)


class SendMessageResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message_user: CompanyConversationMessage
    message_assistant: CompanyConversationMessage
    section_updates: list[SectionUpdate] = Field(default_factory=list)
    suggested_actions: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Skill refresh responses
# ---------------------------------------------------------------------------
class RefreshAnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    block: NarrativeBlock


class RefreshValuationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    block: ValuationBlock


class RefreshComparablesResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    block: CompanyCardsGridBlock


__all__ = [
    "ANONYMOUS_LOCKED_FLAGS",
    "ActivityItem",
    "ActivitySection",
    "CompanyAnalysisRefresh",
    "CompanyConversation",
    "CompanyConversationMessage",
    "CompanyDetailResponse",
    "CompanyHeaderInfo",
    "CompanyIdentity",
    "CompanySections",
    "CompanyWatchlistEntry",
    "DocumentItem",
    "DocumentsSection",
    "GetConversationResponse",
    "LOCKED_SECTIONS_FOR_ANONYMOUS",
    "NextBestAction",
    "RefreshAnalysisResponse",
    "RefreshComparablesResponse",
    "RefreshValuationResponse",
    "SectionId",
    "SectionUpdate",
    "SendMessageRequest",
    "SendMessageResponse",
    "ShareToggleResponse",
    "SignalItem",
    "SignalsSection",
    "SuggestedAction",
    "WatchlistToggleResponse",
    "WatchlistVisibility",
    "new_block_id",
    "new_conversation_id",
    "new_message_id",
    "new_watchlist_id",
    "now_utc",
]
