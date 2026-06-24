"""Deterministic Search Skill.

Filters the `master_companies_mock` collection by query string against
name/legal_name/sector/CIF. Returns a `Workspace` with the appropriate Block.
No LLM, no ranking magic — just a simple scoring function for E1.3.
"""
from __future__ import annotations

import re
import uuid
from typing import Any

from src.core.database import get_db
from src.core.logging import get_logger
from src.modules.copilot.models import (
    EmptyStateBlock,
    EmptyStateBlockProps,
    SearchResultItem,
    SearchResultsBlock,
    SearchResultsBlockProps,
    SearchSkillRequest,
    SearchSkillResponse,
    Workspace,
)

log = get_logger("copilot.search")

ADAPTER_MODE = "mock"

# Max items returned in one Workspace. UI typically shows top 6, the rest stay
# in the response so the frontend can paginate locally if it wants.
MAX_RESULTS = 12

# Suggestions shown when no match found, tailored to the current pathname.
_SUGGESTIONS_BY_PATH: dict[str, list[str]] = {
    "/analizar": ["Software a medida en Madrid", "Hoteles termales", "Construcción industrial"],
    "/valorar": ["Múltiplos del sector SaaS", "Valoración tecnología", "Comparables retail"],
    "/comprar-vender": ["Empresas en venta", "Compradores activos", "Operaciones recientes"],
}
_DEFAULT_SUGGESTIONS = [
    "Kitchen Studio",
    "Hoteles en Valladolid",
    "Empresas de software en Madrid",
]


def _normalize(s: str) -> str:
    """NFD + lowercase + strip diacritics. Same logic as the frontend's
    `normalizeES` so both sides match the same query."""
    import unicodedata

    return (
        "".join(
            c
            for c in unicodedata.normalize("NFD", s or "")
            if unicodedata.category(c) != "Mn"
        )
        .lower()
        .strip()
    )


def _score(query_norm: str, doc: dict[str, Any]) -> float:
    """Cheap deterministic relevance: exact substring → 1.0, prefix → 0.85,
    partial → 0.5, sector match → 0.4. Score is clipped to [0,1]."""
    name = _normalize(str(doc.get("name") or doc.get("legal_name") or ""))
    sector = _normalize(str(doc.get("sector") or ""))
    cif = re.sub(r"[\s.\-]", "", _normalize(str(doc.get("cif") or "")))
    q_cif = re.sub(r"[\s.\-]", "", query_norm)
    score = 0.0
    if query_norm and query_norm in name:
        score = 1.0 if name == query_norm else 0.85 if name.startswith(query_norm) else 0.7
    elif q_cif and len(q_cif) >= 3 and q_cif in cif:
        score = 0.9
    elif query_norm and query_norm in sector:
        score = 0.5
    return min(score, 1.0)


async def execute_search(
    request: SearchSkillRequest,
) -> SearchSkillResponse:
    """Materialises the Workspace for a search request."""
    q = request.query.strip()
    q_norm = _normalize(q)
    log.info(
        "[MOCK] copilot.search",
        query=q,
        locale=request.context.locale,
        pathname=request.context.pathname,
        user_id=request.context.user_id,
    )

    db = get_db()
    raw = await db.master_companies_mock.find({}, {"_id": 0}).to_list(length=500)
    scored: list[tuple[float, dict[str, Any]]] = [
        (s, d) for d in raw if (s := _score(q_norm, d)) > 0
    ]
    scored.sort(key=lambda x: (-x[0], (x[1].get("name") or "").lower()))
    top = scored[:MAX_RESULTS]

    workspace_id = "wsp_" + uuid.uuid4().hex[:12]
    if not top:
        suggestions = _SUGGESTIONS_BY_PATH.get(request.context.pathname, _DEFAULT_SUGGESTIONS)
        empty = EmptyStateBlock(
            id="blk_empty_" + uuid.uuid4().hex[:8],
            props=EmptyStateBlockProps(
                title=(
                    f'Sin resultados para «{q}»'
                    if request.context.locale == "es"
                    else f'No matches for "{q}"'
                ),
                description=(
                    "No hemos encontrado empresas que coincidan. Prueba con uno de estos términos:"
                    if request.context.locale == "es"
                    else "We couldn't find matching companies. Try one of these:"
                ),
                suggestions=suggestions,
            ),
        )
        return SearchSkillResponse(
            workspace=Workspace(workspace_id=workspace_id, intent="search", blocks=[empty]),
            source=ADAPTER_MODE,
            query=q,
        )

    items = [
        SearchResultItem(
            master_company_id=str(d.get("master_company_id") or d.get("id") or ""),
            name=str(d.get("name") or d.get("legal_name") or "—"),
            legal_name=d.get("legal_name"),
            cif=d.get("cif"),
            sector=d.get("sector"),
            city=d.get("city"),
            score=round(score, 3),
        )
        for score, d in top
    ]
    block = SearchResultsBlock(
        id="blk_results_" + uuid.uuid4().hex[:8],
        props=SearchResultsBlockProps(query=q, total=len(scored), results=items),
    )
    return SearchSkillResponse(
        workspace=Workspace(workspace_id=workspace_id, intent="search", blocks=[block]),
        source=ADAPTER_MODE,
        query=q,
    )
