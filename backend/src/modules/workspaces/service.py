"""Workspaces service — owns db.workspaces, db.workspace_messages, db.workspace_blocks.

Access control:
  - read: created_by OR (visibility in {"team","organization","public"} AND
          requester is an active member of the same organization).
  - write (extend / share / patch / archive): created_by ONLY.
  - The "organization" / "public" visibilities are accepted by the schema for
    future use, but `POST /share` only flips between "private" and "team" in
    E1.5.

All datetime fields are UTC and serialised as ISO strings when needed.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from src.core.database import get_db
from src.core.exceptions import DomainError, ForbiddenError, NotFoundError
from src.core.logging import get_logger
from src.modules.copilot.intent_router import route_intent
from src.modules.copilot.models import SkillContext as CopilotSkillContext
from src.modules.copilot.skills.analyze import execute_analyze
from src.modules.copilot.skills.recommend import execute_recommend
from src.modules.copilot.skills.value import execute_value
from src.modules.copilot import service as search_service
from src.modules.copilot.models import (
    AnalyzeSkillRequest,
    RecommendSkillRequest,
    SearchSkillRequest,
    ValueSkillRequest,
)
from src.modules.organizations.service import _require_active_member
from src.modules.workspaces.models import (
    CreateWorkspacePayload,
    CreateWorkspaceResponse,
    EphemeralBlock,
    EphemeralMessage,
    ExtendWorkspacePayload,
    ExtendWorkspaceResponse,
    PatchWorkspacePayload,
    ShareWorkspacePayload,
    Workspace,
    WorkspaceBlock,
    WorkspaceDetail,
    WorkspaceList,
    WorkspaceMessage,
    WorkspaceSummary,
    new_block_id,
    new_message_id,
    new_workspace_id,
    now_utc,
)

log = get_logger("workspaces")

DEFAULT_TITLE_MAX_CHARS = 80


def _auto_title_from_query(query: str) -> str:
    """Deterministic auto-title rules (from user's spec):
    - Strip leading verb-of-command (analiza/valora/etc) if present.
    - Capitalise first letter.
    - Truncate to DEFAULT_TITLE_MAX_CHARS, breaking at the last space before
      the cut and appending '…' when truncated.
    """
    import re
    import unicodedata

    raw = (query or "").strip()
    if not raw:
        return "Nueva conversación"

    # Strip verb prefix using the same map as the intent router (case-insensitive,
    # accent-insensitive).
    from src.modules.copilot.intent_router import VERB_PREFIXES, normalize

    norm = normalize(raw)
    candidate = raw
    for kind in ("analyze", "value", "recommend"):
        for prefix in sorted(VERB_PREFIXES[kind], key=len, reverse=True):
            p = normalize(prefix)
            if norm.startswith(p + " "):
                # Slice the raw string by the length of the matched prefix,
                # using the normalised view as a length yardstick.
                tail = raw[len(prefix):].strip()
                tail = re.sub(r"^[\s,:;?¿!¡\-—]+", "", tail)
                if tail:
                    candidate = tail
                    break
            elif norm == p:
                candidate = ""
                break
        if candidate != raw:
            break

    if not candidate:
        candidate = raw

    # Capitalise first letter without lowercasing the rest.
    candidate = candidate[0].upper() + candidate[1:] if candidate else "Nueva conversación"
    candidate = unicodedata.normalize("NFC", candidate)

    if len(candidate) <= DEFAULT_TITLE_MAX_CHARS:
        return candidate
    cut = candidate.rfind(" ", 0, DEFAULT_TITLE_MAX_CHARS - 1)
    if cut < 30:
        cut = DEFAULT_TITLE_MAX_CHARS - 1
    return candidate[:cut].rstrip() + "…"


def _workspace_url(workspace_id: str, locale: str = "es") -> str:
    return f"/{locale}/w/{workspace_id}"


def _project_workspace(doc: dict[str, Any]) -> Workspace:
    """Drop Mongo _id + coerce dates if they came back as strings."""
    d = {k: v for k, v in doc.items() if k != "_id"}
    for k in ("created_at", "updated_at"):
        v = d.get(k)
        if isinstance(v, str):
            d[k] = datetime.fromisoformat(v.replace("Z", "+00:00"))
    return Workspace(**d)


def _project_message(doc: dict[str, Any]) -> WorkspaceMessage:
    d = {k: v for k, v in doc.items() if k != "_id"}
    v = d.get("created_at")
    if isinstance(v, str):
        d["created_at"] = datetime.fromisoformat(v.replace("Z", "+00:00"))
    return WorkspaceMessage(**d)


def _project_block(doc: dict[str, Any]) -> WorkspaceBlock:
    d = {k: v for k, v in doc.items() if k != "_id"}
    v = d.get("created_at")
    if isinstance(v, str):
        d["created_at"] = datetime.fromisoformat(v.replace("Z", "+00:00"))
    return WorkspaceBlock(**d)


# ---------------------------------------------------------------------------
# Org resolution
# ---------------------------------------------------------------------------
async def _resolve_active_org(
    user_id: str, requested_org_id: str | None
) -> str:
    """Resolve the org the user is acting on. Validates membership."""
    db = get_db()
    if requested_org_id:
        await _require_active_member(user_id, requested_org_id)
        return requested_org_id
    # Pick the user's first active membership.
    m = await db.memberships.find_one(
        {"user_id": user_id, "status": "active"}, {"_id": 0}
    )
    if not m:
        raise ForbiddenError("no_active_membership", code="no_active_membership")
    return m["org_id"]


async def _user_orgs(user_id: str) -> set[str]:
    db = get_db()
    cur = db.memberships.find(
        {"user_id": user_id, "status": "active"}, {"_id": 0, "org_id": 1}
    )
    return {m["org_id"] async for m in cur}


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------
async def create_workspace(
    payload: CreateWorkspacePayload,
    user_id: str,
    locale: str = "es",
) -> CreateWorkspaceResponse:
    org_id = await _resolve_active_org(user_id, payload.organization_id)
    db = get_db()
    now = now_utc()
    wsid = new_workspace_id()

    # Title: explicit > auto from first user message > "Nueva conversación".
    if payload.title:
        title = payload.title.strip()
    else:
        first_user = next(
            (m for m in payload.ephemeral_state.messages if m.role == "user"),
            None,
        )
        title = _auto_title_from_query(first_user.content if first_user else "")

    ws_doc = {
        "workspace_id": wsid,
        "workspace_type": payload.workspace_type,
        "title": title,
        "organization_id": org_id,
        "created_by": user_id,
        "created_at": now,
        "updated_at": now,
        "state": "active",
        "visibility": "private",
        "metadata": {},
    }
    await db.workspaces.insert_one(ws_doc)

    # Persist messages with chronological order.
    msg_docs: list[dict[str, Any]] = []
    for m in payload.ephemeral_state.messages:
        msg_docs.append(
            {
                "message_id": new_message_id(),
                "workspace_id": wsid,
                "role": m.role,
                "content": m.content,
                "intent": m.intent,
                "created_at": now,
            }
        )
    if msg_docs:
        await db.workspace_messages.insert_many(msg_docs)

    # Persist blocks with `order` reflecting their position in the ephemeral
    # state. We tie them to the LAST assistant message when there is one.
    last_assistant_mid: str | None = None
    for md in reversed(msg_docs):
        if md["role"] == "assistant":
            last_assistant_mid = md["message_id"]
            break

    block_docs: list[dict[str, Any]] = []
    for idx, b in enumerate(payload.ephemeral_state.blocks):
        block_docs.append(
            {
                "block_id": new_block_id(),
                "workspace_id": wsid,
                "message_id": last_assistant_mid,
                "type": b.type,
                "props": b.props,
                "order": idx,
                "created_at": now,
            }
        )
    if block_docs:
        await db.workspace_blocks.insert_many(block_docs)

    log.info(
        "workspaces.created",
        workspace_id=wsid,
        org_id=org_id,
        user_id=user_id,
        messages=len(msg_docs),
        blocks=len(block_docs),
        type=payload.workspace_type,
    )
    return CreateWorkspaceResponse(
        workspace_id=wsid,
        url=_workspace_url(wsid, locale=locale),
        workspace_type=payload.workspace_type,
        title=title,
        visibility="private",
    )


# ---------------------------------------------------------------------------
# LIST
# ---------------------------------------------------------------------------
async def list_workspaces(
    user_id: str,
    organization_id: str | None,
    *,
    workspace_type: str | None = None,
    state: str = "active",
    limit: int = 20,
    offset: int = 0,
) -> WorkspaceList:
    org_id = await _resolve_active_org(user_id, organization_id)
    db = get_db()
    q: dict[str, Any] = {"organization_id": org_id, "state": state}
    if workspace_type:
        q["workspace_type"] = workspace_type
    # Visibility: created_by user OR (visibility=team/organization/public).
    q["$or"] = [
        {"created_by": user_id},
        {"visibility": {"$in": ["team", "organization", "public"]}},
    ]
    total = await db.workspaces.count_documents(q)
    cursor = (
        db.workspaces.find(q, {"_id": 0})
        .sort("updated_at", -1)
        .skip(offset)
        .limit(limit)
    )
    items: list[WorkspaceSummary] = []
    async for d in cursor:
        ws = _project_workspace(d)
        items.append(
            WorkspaceSummary(
                workspace_id=ws.workspace_id,
                workspace_type=ws.workspace_type,
                title=ws.title,
                organization_id=ws.organization_id,
                created_by=ws.created_by,
                created_at=ws.created_at,
                updated_at=ws.updated_at,
                state=ws.state,
                visibility=ws.visibility,
            )
        )
    return WorkspaceList(
        items=items, total=total, has_more=(offset + len(items)) < total
    )


# ---------------------------------------------------------------------------
# GET DETAIL
# ---------------------------------------------------------------------------
async def get_workspace(workspace_id: str, user_id: str) -> WorkspaceDetail:
    db = get_db()
    doc = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not doc:
        raise NotFoundError("workspace_not_found", code="workspace_not_found")
    ws = _project_workspace(doc)
    _ensure_read_access(ws, user_id, await _user_orgs(user_id))

    msgs_cur = db.workspace_messages.find(
        {"workspace_id": workspace_id}, {"_id": 0}
    ).sort("created_at", 1)
    messages = [_project_message(d) async for d in msgs_cur]

    blocks_cur = db.workspace_blocks.find(
        {"workspace_id": workspace_id}, {"_id": 0}
    ).sort("order", 1)
    blocks = [_project_block(d) async for d in blocks_cur]

    return WorkspaceDetail(workspace=ws, messages=messages, blocks=blocks)


def _ensure_read_access(ws: Workspace, user_id: str, user_orgs: set[str]) -> None:
    if ws.created_by == user_id:
        return
    if ws.visibility in ("team", "organization", "public") and ws.organization_id in user_orgs:
        return
    if ws.visibility == "public":
        return
    raise ForbiddenError("workspace_access_denied", code="workspace_access_denied")


def _ensure_write_access(ws: Workspace, user_id: str) -> None:
    if ws.created_by != user_id:
        raise ForbiddenError("workspace_write_denied", code="workspace_write_denied")


# ---------------------------------------------------------------------------
# EXTEND (POST messages)
# ---------------------------------------------------------------------------
async def extend_workspace(
    workspace_id: str,
    payload: ExtendWorkspacePayload,
    user_id: str,
) -> ExtendWorkspaceResponse:
    db = get_db()
    doc = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not doc:
        raise NotFoundError("workspace_not_found", code="workspace_not_found")
    ws = _project_workspace(doc)
    _ensure_write_access(ws, user_id)

    # Run the orchestrator on the backend so the skill choice doesn't depend
    # on what the client sent. Default to "search" when in doubt.
    intent = route_intent(payload.query)
    ctx_dict = payload.context or {}
    skill_context = CopilotSkillContext(
        locale=ctx_dict.get("locale", "es"),
        pathname=ctx_dict.get("pathname", f"/es/w/{workspace_id}"),
        user_id=user_id,
        org_id=ws.organization_id,
    )

    if intent == "analyze":
        result = await execute_analyze(
            AnalyzeSkillRequest(query=payload.query, context=skill_context)
        )
        workspace_payload = result.workspace
    elif intent == "value":
        result = await execute_value(
            ValueSkillRequest(query=payload.query, context=skill_context)
        )
        workspace_payload = result.workspace
    elif intent == "recommend":
        result = await execute_recommend(
            RecommendSkillRequest(query=payload.query, context=skill_context)
        )
        workspace_payload = result.workspace
    else:
        result = await search_service.execute_search(
            SearchSkillRequest(query=payload.query, context=skill_context)
        )
        workspace_payload = result.workspace

    now = now_utc()
    user_msg = {
        "message_id": new_message_id(),
        "workspace_id": workspace_id,
        "role": "user",
        "content": payload.query,
        "intent": intent,
        "created_at": now,
    }
    assistant_msg = {
        "message_id": new_message_id(),
        "workspace_id": workspace_id,
        "role": "assistant",
        "content": _assistant_text_for(intent, workspace_payload),
        "intent": intent,
        "created_at": now,
    }
    await db.workspace_messages.insert_many([user_msg, assistant_msg])

    # Append new blocks AFTER the current max(order).
    last = await db.workspace_blocks.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0, "order": 1},
        sort=[("order", -1)],
    )
    base_order = (last or {}).get("order", -1) + 1

    block_docs: list[dict[str, Any]] = []
    for idx, blk in enumerate(workspace_payload.blocks):
        block_docs.append(
            {
                "block_id": new_block_id(),
                "workspace_id": workspace_id,
                "message_id": assistant_msg["message_id"],
                "type": blk.type,
                "props": blk.model_dump(mode="json")["props"],
                "order": base_order + idx,
                "created_at": now,
            }
        )
    if block_docs:
        await db.workspace_blocks.insert_many(block_docs)

    await db.workspaces.update_one(
        {"workspace_id": workspace_id}, {"$set": {"updated_at": now}}
    )

    log.info(
        "workspaces.extended",
        workspace_id=workspace_id,
        user_id=user_id,
        intent=intent,
        blocks_added=len(block_docs),
    )

    return ExtendWorkspaceResponse(
        workspace_id=workspace_id,
        message_user=_project_message(user_msg),
        message_assistant=_project_message(assistant_msg),
        blocks_added=[_project_block(b) for b in block_docs],
        intent=intent,
    )


def _assistant_text_for(intent: str, workspace) -> str:
    """Mirror of the TS `assistantSummaryFor` so the persisted assistant
    message in the thread reads naturally."""
    blocks = workspace.blocks
    if not blocks:
        return "Listo."
    first = blocks[0]
    ftype = getattr(first, "type", "")
    if ftype == "search_results":
        total = first.props.total
        return (
            "He encontrado 1 empresa que encaja. Te la muestro abajo."
            if total == 1
            else f"He encontrado {total} empresas que encajan. Te muestro las primeras abajo."
        )
    if ftype == "empty_state":
        return "No he encontrado coincidencias directas. Prueba con una de estas sugerencias:"
    if ftype == "hero":
        if intent == "analyze":
            return "He preparado el análisis. Aquí abajo."
        if intent == "value":
            return "Aquí tienes la valoración indicativa."
        if intent == "recommend":
            return "Estas son mis recomendaciones."
    return "Listo."


# ---------------------------------------------------------------------------
# SHARE
# ---------------------------------------------------------------------------
async def share_workspace(
    workspace_id: str, payload: ShareWorkspacePayload, user_id: str
) -> Workspace:
    db = get_db()
    doc = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not doc:
        raise NotFoundError("workspace_not_found", code="workspace_not_found")
    ws = _project_workspace(doc)
    _ensure_write_access(ws, user_id)
    if payload.visibility not in ("private", "team"):
        raise DomainError(
            "visibility_not_supported",
            code="visibility_not_supported",
            status_code=422,
        )
    now = now_utc()
    await db.workspaces.update_one(
        {"workspace_id": workspace_id},
        {"$set": {"visibility": payload.visibility, "updated_at": now}},
    )
    updated = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    log.info(
        "workspaces.shared",
        workspace_id=workspace_id,
        user_id=user_id,
        visibility=payload.visibility,
    )
    return _project_workspace(updated)


# ---------------------------------------------------------------------------
# PATCH (title)
# ---------------------------------------------------------------------------
async def patch_workspace(
    workspace_id: str, payload: PatchWorkspacePayload, user_id: str
) -> Workspace:
    db = get_db()
    doc = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not doc:
        raise NotFoundError("workspace_not_found", code="workspace_not_found")
    ws = _project_workspace(doc)
    _ensure_write_access(ws, user_id)
    update: dict[str, Any] = {"updated_at": now_utc()}
    if payload.title is not None:
        update["title"] = payload.title.strip()
    await db.workspaces.update_one(
        {"workspace_id": workspace_id}, {"$set": update}
    )
    updated = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    return _project_workspace(updated)


# ---------------------------------------------------------------------------
# ARCHIVE (soft delete)
# ---------------------------------------------------------------------------
async def archive_workspace(workspace_id: str, user_id: str) -> dict[str, str]:
    db = get_db()
    doc = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not doc:
        raise NotFoundError("workspace_not_found", code="workspace_not_found")
    ws = _project_workspace(doc)
    _ensure_write_access(ws, user_id)
    await db.workspaces.update_one(
        {"workspace_id": workspace_id},
        {"$set": {"state": "archived", "updated_at": now_utc()}},
    )
    log.info("workspaces.archived", workspace_id=workspace_id, user_id=user_id)
    return {"workspace_id": workspace_id, "state": "archived"}


# Helpers for the create-from-ephemeral flow used by tests.
__all__ = [
    "archive_workspace",
    "create_workspace",
    "extend_workspace",
    "get_workspace",
    "list_workspaces",
    "patch_workspace",
    "share_workspace",
]
