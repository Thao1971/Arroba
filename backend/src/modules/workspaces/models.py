"""Pydantic models for the Workspaces module.

The shape mirrors the discriminated union exposed by the Copilot module
(`BlockSpec`) so the frontend can render workspace blocks with the same
`WorkspaceArea` renderer it already uses for ephemeral workspaces.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


WorkspaceType = Literal["analyze", "value", "recommend", "search", "mixed"]
WorkspaceState = Literal["active", "archived"]
WorkspaceVisibility = Literal["private", "team", "organization", "public"]
MessageRole = Literal["user", "assistant", "system"]


def new_workspace_id() -> str:
    return f"wsp_{uuid.uuid4().hex[:12]}"


def new_message_id() -> str:
    return f"msg_{uuid.uuid4().hex[:12]}"


def new_block_id() -> str:
    return f"blk_{uuid.uuid4().hex[:12]}"


# ---------------------------------------------------------------------------
# Storage shapes
# ---------------------------------------------------------------------------
class Workspace(BaseModel):
    """Top-level workspace document."""
    model_config = ConfigDict(extra="forbid")
    workspace_id: str
    workspace_type: WorkspaceType
    title: str = Field(min_length=1, max_length=120)
    organization_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    state: WorkspaceState = "active"
    visibility: WorkspaceVisibility = "private"
    metadata: dict[str, Any] = Field(default_factory=dict)


class WorkspaceMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message_id: str
    workspace_id: str
    role: MessageRole
    content: str
    intent: str | None = None
    created_at: datetime


class WorkspaceBlock(BaseModel):
    """One block materialised inside a workspace. `type` matches the Copilot
    discriminated union (`search_results | empty_state | error | loading |
    hero | metrics | company_card | company_cards_grid | valuation | narrative`).
    `props` keeps the exact shape the frontend already understands."""
    model_config = ConfigDict(extra="forbid")
    block_id: str
    workspace_id: str
    message_id: str | None = None
    type: str
    props: dict[str, Any]
    order: int = Field(ge=0)
    created_at: datetime


# ---------------------------------------------------------------------------
# Request payloads
# ---------------------------------------------------------------------------
class EphemeralBlock(BaseModel):
    """Block as it travels in the ephemeral state when promoting to persistent."""
    model_config = ConfigDict(extra="forbid")
    id: str
    type: str
    props: dict[str, Any]


class EphemeralMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: MessageRole
    content: str
    intent: str | None = None


class EphemeralState(BaseModel):
    """Snapshot of the dock state that the user wants to persist."""
    model_config = ConfigDict(extra="forbid")
    messages: list[EphemeralMessage] = Field(default_factory=list)
    blocks: list[EphemeralBlock] = Field(default_factory=list)


class CreateWorkspacePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ephemeral_state: EphemeralState
    workspace_type: WorkspaceType = "mixed"
    title: str | None = Field(default=None, min_length=1, max_length=120)
    organization_id: str | None = Field(default=None, min_length=1, max_length=80)


class ExtendWorkspacePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=1, max_length=400)
    context: dict[str, Any] = Field(default_factory=dict)


class ShareWorkspacePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    visibility: Literal["private", "team"]


class PatchWorkspacePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=1, max_length=120)


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------
class WorkspaceSummary(BaseModel):
    """Lightweight item used by GET /workspaces list."""
    model_config = ConfigDict(extra="forbid")
    workspace_id: str
    workspace_type: WorkspaceType
    title: str
    organization_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    state: WorkspaceState
    visibility: WorkspaceVisibility


class CreateWorkspaceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    workspace_id: str
    url: str  # e.g. /es/w/{workspace_id}
    workspace_type: WorkspaceType
    title: str
    visibility: WorkspaceVisibility


class WorkspaceDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")
    workspace: Workspace
    messages: list[WorkspaceMessage]
    blocks: list[WorkspaceBlock]


class WorkspaceList(BaseModel):
    model_config = ConfigDict(extra="forbid")
    items: list[WorkspaceSummary]
    total: int
    has_more: bool


class ExtendWorkspaceResponse(BaseModel):
    """Returned by POST /workspaces/{id}/messages — just the delta so the
    frontend can append without reloading the whole workspace."""
    model_config = ConfigDict(extra="forbid")
    workspace_id: str
    message_user: WorkspaceMessage
    message_assistant: WorkspaceMessage
    blocks_added: list[WorkspaceBlock]
    intent: str  # the skill that was dispatched


# Helpers used by the service layer.
def now_utc() -> datetime:
    return datetime.now(UTC)
