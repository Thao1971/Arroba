"""Deterministic Search Skill (E1.5-REWORK).

The Search Skill has two modes:
  - **entity resolution** (E1.5-REWORK): if the query looks like a concrete
    name or CIF, try to map it 1:1 to an entity and return `navigate_to`.
    With 2-5 partial matches, return a `disambiguation` dropdown for the
    dock to render.
  - **legacy exploratory** (E1.3): otherwise, fall back to a `Workspace`
    with `SearchResultsBlock` (or `EmptyStateBlock` when nothing matches).

No LLM, no ranking magic — just deterministic scoring against
`master_companies_mock`.
"""
from __future__ import annotations

import re
import uuid
from typing import Any

from src.core.database import get_db
from src.core.logging import get_logger
from src.modules.copilot.models import (
    DisambiguationItem,
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

# Tokens that mark a query as exploratory (sector/geo/intent). If any of
# these appears, we do NOT attempt entity resolution.
_EXPLORATORY_TOKENS: frozenset[str] = frozenset({
    "en", "de", "del", "para", "para", "con", "sin",
    "sector", "sectores", "sectoriales",
    "similares", "similar", "parecidos",
    "oportunidades", "oportunidad",
    "compradores", "compradoras", "vendedores", "vendedoras",
    "fondos", "inversores", "deals",
    "operaciones", "valoracion", "valoración",
    "hoteles", "agencias", "empresas",  # plural sectorial keywords
    "companies", "agencies", "deals",
    "software", "tecnologia", "tecnología", "construccion",
    "construcción", "industrial", "industriales",
    "termales", "saas", "fintech", "retail",
})

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

# Spanish CIF: leading letter + 8 digits.
_CIF_RE = re.compile(r"^[A-Z]\d{8}$")


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
    """Materialises a response for a search request.

    Decision tree (E1.5-REWORK):
      1. If the query is a CIF → exact-match company → `navigate_to`.
      2. If the query is a "concrete name" (≤3 alphabetic words, no
         exploratory tokens):
            - 1 strong match (score≥0.85) → `navigate_to`;
            - 2-5 candidates → `disambiguation`;
            - 0 → empty.
      3. Otherwise → legacy `SearchResultsBlock` workspace.
    """
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

    # ---- Path A: CIF (highest precedence) -------------------------------
    cif_upper = re.sub(r"[\s.\-]", "", q.upper())
    if _CIF_RE.match(cif_upper):
        for d in raw:
            doc_cif = re.sub(r"[\s.\-]", "", str(d.get("cif") or "").upper())
            if doc_cif == cif_upper:
                return SearchSkillResponse(
                    workspace=None,
                    source=ADAPTER_MODE,
                    query=q,
                    navigate_to=f"/empresa/{cif_upper}",
                    entity_type="company",
                )
        # Valid-shape CIF but unknown → empty.
        return _empty_response(q, request.context.pathname, request.context.locale)

    # ---- Path B: concrete-name heuristic --------------------------------
    tokens = [t for t in re.split(r"\s+", q_norm) if t]
    is_concrete = (
        bool(tokens)
        and len(tokens) <= 3
        and all(re.match(r"^[a-z0-9]+$", t) for t in tokens)
        and not any(t in _EXPLORATORY_TOKENS for t in tokens)
    )

    scored: list[tuple[float, dict[str, Any]]] = [
        (s, d) for d in raw if (s := _score(q_norm, d)) > 0
    ]
    scored.sort(key=lambda x: (-x[0], (x[1].get("legal_name") or x[1].get("name") or "").lower()))

    if is_concrete:
        strong = [(s, d) for s, d in scored if s >= 0.85]
        # 1 strong match → resolve. BUT only if the query is long enough
        # (≥4 chars); shorter queries like "K" should always show options
        # because the user is mid-typing.
        if len(strong) == 1 and len(q_norm) >= 4:
            d = strong[0][1]
            cif = re.sub(r"[\s.\-]", "", str(d.get("cif") or "").upper())
            if cif and _CIF_RE.match(cif):
                return SearchSkillResponse(
                    workspace=None,
                    source=ADAPTER_MODE,
                    query=q,
                    navigate_to=f"/empresa/{cif}",
                    entity_type="company",
                )
        # 2-5 candidates → disambiguation (also when 1 candidate but query <4 chars).
        candidates = scored[:5]
        if 1 <= len(candidates) <= 5:
            items = [
                DisambiguationItem(
                    master_company_id=str(d.get("master_company_id") or ""),
                    cif=(
                        re.sub(r"[\s.\-]", "", str(d.get("cif")).upper())
                        if d.get("cif") else None
                    ),
                    name=str(d.get("legal_name") or d.get("name") or "—"),
                    sector=d.get("sector"),
                    region=d.get("region") or d.get("city"),
                )
                for _, d in candidates
            ]
            return SearchSkillResponse(
                workspace=None,
                source=ADAPTER_MODE,
                query=q,
                disambiguation=items,
            )
        if not scored:
            return _empty_response(q, request.context.pathname, request.context.locale)
        # Fall through to legacy for ambiguous concrete (e.g. >5 partials).

    # ---- Path C: legacy exploratory -------------------------------------
    workspace_id = "wsp_" + uuid.uuid4().hex[:12]
    top = scored[:MAX_RESULTS]
    if not top:
        return _empty_response(q, request.context.pathname, request.context.locale)

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


def _empty_response(q: str, pathname: str | None, locale: str) -> SearchSkillResponse:
    workspace_id = "wsp_" + uuid.uuid4().hex[:12]
    suggestions = _SUGGESTIONS_BY_PATH.get(pathname or "", _DEFAULT_SUGGESTIONS)
    empty = EmptyStateBlock(
        id="blk_empty_" + uuid.uuid4().hex[:8],
        props=EmptyStateBlockProps(
            title=(
                f'Sin resultados para «{q}»'
                if locale == "es"
                else f'No matches for "{q}"'
            ),
            description=(
                "No hemos encontrado empresas que coincidan. Prueba con uno de estos términos:"
                if locale == "es"
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
