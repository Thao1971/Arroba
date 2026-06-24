"""Copilot module — orchestrates Skills and returns Workspace specs.

In E1.3 the only Skill is `search`. The Skill is **deterministic** (no LLM):
it filters the `master_companies_mock` collection by name/sector/CIF and
returns a Workspace populated with `SearchResultsBlock`, `EmptyStateBlock` or
`ErrorBlock`.

Contract is designed so a future real Skill (powered by LLM or the Agency Tool
endpoint REQ-003) can swap implementation without changing the response shape.
"""
from __future__ import annotations

from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Request — what the frontend sends.
# ---------------------------------------------------------------------------
class SkillContext(BaseModel):
    """Context that travels with every Skill request."""
    model_config = ConfigDict(extra="forbid")
    locale: Literal["es", "en"] = "es"
    pathname: str = Field(default="/", max_length=512)
    user_id: str | None = Field(default=None, max_length=100)
    org_id: str | None = Field(default=None, max_length=100)


class SearchSkillRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=1, max_length=200)
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


# Discriminator
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


BlockSpec = Annotated[
    Union[SearchResultsBlock, EmptyStateBlock, ErrorBlock],
    Field(discriminator="type"),
]


# ---------------------------------------------------------------------------
# Response — Workspace = ordered list of blocks + metadata.
# ---------------------------------------------------------------------------
class Workspace(BaseModel):
    """A workspace is the materialised result of a Skill. Renders inside the
    Copilot dock's expanded panel (transient, no URL).
    """
    model_config = ConfigDict(extra="forbid")
    workspace_id: str
    intent: str
    blocks: list[BlockSpec]


class SearchSkillResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    workspace: Workspace
    source: Literal["mock", "real"] = "mock"
    # Echoes back what the frontend asked, helps debugging client-side.
    query: str


# Re-export only public surface.
__all__: list[str] = [
    "BlockSpec",
    "EmptyStateBlock",
    "EmptyStateBlockProps",
    "ErrorBlock",
    "ErrorBlockProps",
    "SearchResultItem",
    "SearchResultsBlock",
    "SearchResultsBlockProps",
    "SearchSkillRequest",
    "SearchSkillResponse",
    "SkillContext",
    "Workspace",
]


def _unused() -> Any:
    """Placeholder to silence linters about unused typing helpers."""
    return None
