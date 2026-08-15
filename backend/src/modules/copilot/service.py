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

import asyncio
import re
import uuid
from typing import Any
from urllib.parse import quote

from src.core.database import get_db
from src.core.logging import get_logger
# REQ-001 · REFACTOR (2026-08-14): cliente S2S canónico del `intelligence_layer`
# (retry + dual-key + semáforo + circuit breaker) en vez de un `intel_client.py`
# paralelo. Toggle canónico: `IntelligenceSettings.agency_tool_mode`.
from src.modules.intelligence_layer.config import get_intelligence_settings
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolHTTPError,
    get_agency_tool_client,
)
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
# HARDENING-REQ004 · 2026-08-15 · parser NL → filtros numéricos (5º modo).
# Puro (`re` + `unicodedata`), sin I/O. Consumido por `_execute_search_real`
# tras la rama CIF y antes de categorical/name/semantic para que consultas
# como "empresas con ingresos > 50M" no caigan al semántico (que ignora los
# números y devolvería empresas que NO cumplen el predicado).
from src.modules.copilot.financial_query import parse_financial_query

log = get_logger("copilot.search")

ADAPTER_MODE = "mock"

# Max items returned in one Workspace. UI typically shows top 6, the rest stay
# in the response so the frontend can paginate locally if it wants.
MAX_RESULTS = 12

# HARDENING-REQ003 · 2026-08-14 · Search-path constants
# ─────────────────────────────────────────────────────────────────────────
# `_SEARCH_TIMEOUT_S`: fail-fast cap para llamadas Intel del path search.
# El `AgencyToolClient` canónico tiene timeout global 30s + retry exponencial;
# aquí lo tapamos en 8s puntual para que un motor lento no cuelgue el request.
# `_RESULTS_PAGE`: tamaño de página que emitimos al frontend `/resultados`
# (`PAGE_SIZE=12` cuadrado con `resultados/page.tsx`).
# `_SEARCH_PAGE_LIMIT`: tamaño del top-pool que pedimos a Intel semantic (que
# no soporta offset server-side; ver DEPLOY_NOTES Backlog Intel). Slicing
# local sobre este pool.
_SEARCH_TIMEOUT_S: float = 8.0
_RESULTS_PAGE: int = 12
_SEARCH_PAGE_LIMIT: int = 50


async def _intel_call_ff(coro: Any) -> Any:
    """HARDENING-REQ003 · Fail-fast wrapper para el path search. Envuelve una
    coroutine del `AgencyToolClient` canónico con `asyncio.wait_for(8s)`.
    Cancela retry/backoff del cliente si el motor tarda: preserva el
    circuit-breaker/dual-key **dentro** de esos 8s. Si el cap expira, propaga
    `AgencyToolHTTPError` como cualquier otro fallo → caller degrada a
    `_empty_response` honesto (Regla R15: nunca pilotos)."""
    try:
        return await asyncio.wait_for(coro, timeout=_SEARCH_TIMEOUT_S)
    except asyncio.TimeoutError as exc:
        raise AgencyToolHTTPError(
            status_code=0, error_class="timeout",
            message=f"search_timeout_{int(_SEARCH_TIMEOUT_S)}s",
        ) from exc

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

    # Real mode: resolve against Intel arroba.v2. HARDENING-REQ003 (2026-08-14):
    # POLÍTICA DE FALLBACK · en modo real, cualquier fallo Intel → `_empty_response`
    # honesto. NO caemos al mock. Regla R15 del usuario ("nunca pilotos"): el mock
    # sólo existe cuando `agency_tool_mode='mock'`, no como red silenciosa que
    # invente datos si Intel se cae.
    if get_intelligence_settings().agency_tool_mode == "real":
        try:
            return await _execute_search_real(request, q, q_norm)
        except AgencyToolHTTPError as exc:
            log.warning(
                "copilot.search.real_failed_empty_response",
                error=str(exc),
                status=getattr(exc, "status_code", None),
                error_class=getattr(exc, "error_class", None),
                query=q,
            )
            return _empty_response(q, request.context.pathname, request.context.locale)

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
                    navigate_to=f"/empresa-f01/{cif_upper}",
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
                    navigate_to=f"/empresa-f01/{cif}",
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


async def _execute_search_real(
    request: SearchSkillRequest, q: str, q_norm: str
) -> SearchSkillResponse:
    """Real path (REQ-001 + REQ001b + REQ003 + REQ004): 5 branches ordered by
    precedence:

      #1  CIF detected → resolve → navigate `/empresa-f01/{cif}`.
      #2  Financial / attribute screen (REQ004) → `skills/search` with numeric
          predicates pushed down to Intel. Precedence over categorical/semantic
          because those ignore numbers. Falls through to #3/#5 if the engine
          has no such rows (not an error — the other modes may still match).
      #3  Categorical / exploratory sector query → `company-taxonomy/search`
          (full paginated set) → `/resultados` with server-side pagination.
      #4  Concrete-name query → resolve (single match or 2-5 disambiguation).
      #5  Natural-language exploratory → `semantic-intelligence/search` with
          local slicing → `/resultados` (offset applied locally over top-K).

    HARDENING-REQ003: all Intel calls wrapped with `_intel_call_ff` (8s
    fail-fast). Failure → propagates `AgencyToolHTTPError` so the caller
    turns it into `_empty_response` honestly (no mock fallback).
    Uses the canonical `AgencyToolClient` (retry + dual-key + semaphore +
    circuit breaker) — do NOT reintroduce `intel_client.py`.
    """
    pathname = request.context.pathname
    locale = request.context.locale
    offset = int(getattr(request, "offset", 0) or 0)
    resolve_path = "/api/v2/company-intelligence/resolve"

    async def _resolve(payload: dict[str, Any]) -> dict[str, Any]:
        resp = await _intel_call_ff(
            get_agency_tool_client().request("POST", resolve_path, json=payload)
        )
        if resp.status_code >= 400:
            raise AgencyToolHTTPError(
                status_code=resp.status_code,
                error_class="client_4xx" if resp.status_code < 500 else "server_5xx",
                message=f"resolve http_{resp.status_code}",
            )
        return resp.json()

    def _cif_of(m: dict[str, Any]) -> str | None:
        c = m.get("cif")
        return re.sub(r"[\s.\-]", "", str(c).upper()) if c else None

    # ---- #1 · CIF (highest precedence) ----------------------------------
    cif_upper = re.sub(r"[\s.\-]", "", q.upper())
    if _CIF_RE.match(cif_upper):
        resp = await _resolve({"cif": cif_upper, "limit": 1})
        matches = resp.get("matches") or []
        if matches:
            cif = _cif_of(matches[0]) or cif_upper
            return SearchSkillResponse(
                workspace=None, source="real", query=q,
                navigate_to=f"/empresa-f01/{cif}", entity_type="company",
            )
        return _empty_response(q, pathname, locale)

    # ---- #2 · FINANCIAL / attribute screen (REQ-004) ---------------------
    # NL queries with numeric predicates like "empresas con ingresos > 50M" or
    # "agencias con EBITDA > 1M y más de 100 empleados". The parser is pure
    # (regex + stdlib, no I/O) and returns None when there's no numeric
    # predicate → we skip this branch and continue with the REQ003 flow.
    # When Intel returns rows we emit them as `search_results`. When Intel
    # returns 0 rows we return None so the request falls through to
    # categorical/name/semantic (the query may still match textually — do
    # not short-circuit into an empty response).
    parsed = parse_financial_query(q)
    if parsed:
        fin = await _financial_search_results(
            q=q,
            filters=parsed["filters"],
            residual=parsed["residual"],
            offset=offset,
        )
        if fin is not None:
            return fin

    tokens = [t for t in re.split(r"\s+", q_norm) if t]
    is_concrete = (
        bool(tokens)
        and len(tokens) <= 3
        and all(re.match(r"^[a-z0-9]+$", t) for t in tokens)
        and not any(t in _EXPLORATORY_TOKENS for t in tokens)
    )

    # ---- #3 · CATEGORICAL (sector/geo/intent tokens) --------------------
    # HARDENING-REQ003 · Intel `/api/v1/company-taxonomy/search` returns the
    # full paginated set for queries like "agencias de marketing", "todas las
    # asesorías fiscales", "clínicas en Madrid". Server-side offset/total.
    # Latent until Intel enables the endpoint with enriched rows (see
    # DEPLOY_NOTES `HARDENING-REQ003 Gate Intel`).
    if not is_concrete:
        tax = await _taxonomy_search(q, offset=offset, limit=_RESULTS_PAGE)
        if tax is not None:
            rows: list[dict[str, Any]] = tax.get("results") or []
            total = int(tax.get("total") or tax.get("count") or len(rows))
            if rows:
                items = [_row_to_item(r) for r in rows]
                block = SearchResultsBlock(
                    id="blk_results_" + uuid.uuid4().hex[:8],
                    props=SearchResultsBlockProps(query=q, total=total, results=items),
                )
                return SearchSkillResponse(
                    workspace=Workspace(
                        workspace_id="wsp_" + uuid.uuid4().hex[:12],
                        intent="search", blocks=[block],
                    ),
                    source="real", query=q,
                )
        # Taxonomy returned no rows or endpoint unavailable → fall through to
        # semantic search (#5). Preserves REQ001b behaviour when categorical
        # gate is still latent.
        return await _semantic_search_results(q, pathname, locale, offset=offset)

    # ---- #4 · resolve by name (concrete → single/disambiguation) --------
    resp = await _resolve({"name": q, "limit": MAX_RESULTS})
    matches: list[dict[str, Any]] = resp.get("matches") or []
    matches.sort(key=lambda m: -float(m.get("score") or 0.0))

    strong = [m for m in matches if float(m.get("score") or 0.0) >= 0.85]
    if len(strong) == 1 and len(q_norm) >= 4:
        cif = _cif_of(strong[0])
        if cif and _CIF_RE.match(cif):
            return SearchSkillResponse(
                workspace=None, source="real", query=q,
                navigate_to=f"/empresa-f01/{cif}", entity_type="company",
            )
    candidates = matches[:5]
    if 1 <= len(candidates) <= 5:
        items = [
            DisambiguationItem(
                master_company_id=str(m.get("master_id") or ""),
                cif=_cif_of(m),
                name=str(m.get("legal_name") or "—"),
                sector=m.get("cnae_section"),
                region=m.get("province"),
            )
            for m in candidates
        ]
        return SearchSkillResponse(
            workspace=None, source="real", query=q, disambiguation=items,
        )
    if not matches:
        return _empty_response(q, pathname, locale)

    # ---- concrete fall-through → resolve matches as a results list ------
    top = matches[:MAX_RESULTS]
    items = [
        SearchResultItem(
            master_company_id=str(m.get("master_id") or ""),
            name=str(m.get("legal_name") or "—"),
            legal_name=m.get("legal_name"),
            cif=_cif_of(m),
            sector=m.get("cnae_section"),
            city=m.get("province"),
            score=round(float(m.get("score") or 0.0), 3),
        )
        for m in top
    ]
    block = SearchResultsBlock(
        id="blk_results_" + uuid.uuid4().hex[:8],
        props=SearchResultsBlockProps(query=q, total=len(matches), results=items),
    )
    return SearchSkillResponse(
        workspace=Workspace(
            workspace_id="wsp_" + uuid.uuid4().hex[:12], intent="search", blocks=[block]
        ),
        source="real", query=q,
    )


async def _semantic_search_results(
    q: str, pathname: str | None, locale: str, offset: int = 0
) -> SearchSkillResponse:
    """HARDENING-REQ001b + REQ003 · natural-language search vía Intel
    `POST /api/v1/semantic-intelligence/search`.

    Semantic no soporta `offset` server-side (top-K pool). Aplicamos slicing
    LOCAL sobre el top pool devuelto por Intel. Ver `DEPLOY_NOTES.md → Backlog
    Intel · REQ-INTEL semantic offset/total`.

    Cada `SearchHit` trae un `cif` navegable a la ficha (`/empresa-f01/{cif}`).
    Usa el `AgencyToolClient` canónico (retry + dual-key + semáforo + circuit
    breaker) envuelto con `_intel_call_ff` (fail-fast 8s). En caso de fallo,
    propaga `AgencyToolHTTPError` para que el caller devuelva `_empty_response`.
    """
    resp = await _intel_call_ff(
        get_agency_tool_client().request(
            "POST",
            "/api/v1/semantic-intelligence/search",
            json={"query": q, "limit": _SEARCH_PAGE_LIMIT, "cnae_section": None},
        )
    )
    if resp.status_code >= 400:
        raise AgencyToolHTTPError(
            status_code=resp.status_code,
            error_class="client_4xx" if resp.status_code < 500 else "server_5xx",
            message=f"semantic-search http_{resp.status_code}",
        )
    payload: dict[str, Any] = resp.json()
    hits: list[dict[str, Any]] = payload.get("results") or []
    total = len(hits)
    # Local slicing (semantic doesn't paginate server-side yet).
    page_slice = hits[offset : offset + _RESULTS_PAGE]
    if not page_slice:
        return _empty_response(q, pathname, locale)
    items = [_row_to_item(h) for h in page_slice]
    block = SearchResultsBlock(
        id="blk_results_" + uuid.uuid4().hex[:8],
        props=SearchResultsBlockProps(query=q, total=total, results=items),
    )
    return SearchSkillResponse(
        workspace=Workspace(
            workspace_id="wsp_" + uuid.uuid4().hex[:12], intent="search", blocks=[block]
        ),
        source="real", query=q,
    )


async def _financial_search_results(
    q: str,
    filters: dict[str, Any],
    residual: str,
    offset: int = 0,
) -> SearchSkillResponse | None:
    """HARDENING-REQ004 · Structured financial/attribute screen (5º modo).

    Push-down de predicados numéricos ("ingresos > 50M", "empleados > 100",
    "EBITDA entre 1M y 5M", "crecimiento > 20%") a Intel
    `POST /api/v1/skills/search`. Whole-universe filter, `total` server-side,
    paginación real. `has_domain: false` es explícito: un screen numérico no
    debe descartar empresas por no tener web.

    **Semántica de retorno tri-estado (crítico para el orquestador de modos):**
      · `SearchSkillResponse` → filas encontradas, se emite tabla.
      · `None`                → 0 filas del motor. **Fall-through** a #3/#4/#5
                                (categorical/name/semantic). NO es un error.
      · Propaga `AgencyToolHTTPError` → fallo HTTP/timeout. El caller
                                `search_skill` lo convierte a `_empty_response`
                                honesto (política REQ003, no fallback a mock).

    Reutiliza `_intel_call_ff` (fail-fast 8s uniforme del path search) y el
    cliente canónico — do NOT reintroduce `intel_client.py`.
    """
    page = (offset // _RESULTS_PAGE) + 1
    payload: dict[str, Any] = {
        "query": residual,
        # has_domain=False: un screen numérico no debe descartar empresas por
        # no tener web. El filtro por dominio es un refinamiento, no un gate.
        "filters": {**filters, "has_domain": False},
        "pagination": {"page": page, "page_size": _RESULTS_PAGE},
    }
    resp = await _intel_call_ff(
        get_agency_tool_client().request(
            "POST", "/api/v1/skills/search", json=payload
        )
    )
    if resp.status_code == 404:
        # Endpoint not enabled yet on Intel side (gate REQ-004 latent). Fall
        # through to categorical/semantic so the query still surfaces textual
        # matches instead of showing an empty page.
        log.info(
            "copilot.search.financial_endpoint_404",
            query=q, page=page, filters=list(filters.keys()),
        )
        return None
    if resp.status_code >= 400:
        raise AgencyToolHTTPError(
            status_code=resp.status_code,
            error_class="client_4xx" if resp.status_code < 500 else "server_5xx",
            message=f"skills-search http_{resp.status_code}",
        )
    payload_out: dict[str, Any] = resp.json()
    # `skills/search` puede emitir un shape workspace (blocks[]) o plano
    # (results[] + total). Aceptamos ambos: primero blocks, luego plano.
    blocks = ((payload_out.get("workspace") or {}).get("blocks") or [])
    block = next((b for b in blocks if b.get("type") == "search_results"), None)
    if block is not None:
        rows = ((block.get("props") or {}).get("results") or [])
        total = int((block.get("props") or {}).get("total") or len(rows))
    else:
        rows = payload_out.get("results") or []
        total = int(payload_out.get("total") or len(rows))
    if not rows:
        log.info(
            "copilot.search.financial_zero_rows_fallthrough",
            query=q, filters=list(filters.keys()), residual=residual,
        )
        return None
    items = [_row_to_item(r) for r in rows]
    out_block = SearchResultsBlock(
        id="blk_results_" + uuid.uuid4().hex[:8],
        props=SearchResultsBlockProps(query=q, total=total, results=items),
    )
    return SearchSkillResponse(
        workspace=Workspace(
            workspace_id="wsp_" + uuid.uuid4().hex[:12],
            intent="search", blocks=[out_block],
        ),
        source="real", query=q,
    )




def _row_to_item(r: dict[str, Any]) -> SearchResultItem:
    """HARDENING-REQ003 · maps an Intel enriched row → `SearchResultItem`.

    Único punto donde el shape Intel (taxonomy/semantic/skills) se aplana al
    contrato que consumen la home (`SearchResultsBlock`) y `/resultados/page.tsx`.
    Si Intel evoluciona (rename de `master_id`, campos nuevos, etc.), este
    helper es el único sitio a tocar.

    Defensivo con `summary` (aún no siempre presente; ver DEPLOY_NOTES gate
    Intel). Cuando falta, la tabla renderiza «—» en las columnas financieras.
    """
    cif_raw = r.get("cif")
    cif = re.sub(r"[\s.\-]", "", str(cif_raw).upper()) if cif_raw else None
    summ = r.get("summary") if isinstance(r.get("summary"), dict) else None
    return SearchResultItem(
        # HARDENING-REQ004 · algunas rows de Intel emiten `master_company_id`
        # (skills/search) en lugar de `master_id`. Fallback aditivo, no
        # sustituye el mapeo canónico existente.
        master_company_id=str(r.get("master_id") or r.get("master_company_id") or ""),
        name=str(r.get("name") or r.get("legal_name") or "—"),
        legal_name=r.get("legal_name") or r.get("name"),
        cif=cif,
        sector=r.get("cnae_section") or r.get("sector"),
        city=r.get("city") or r.get("province"),
        # Semantic emits similarity `score`; taxonomy emits categorical membership
        # (1.0). We normalize to a [0,1] float either way.
        score=round(float(r.get("score") or 1.0), 3),
        summary=summ,
    )


async def _taxonomy_search(
    q: str, offset: int = 0, limit: int = _RESULTS_PAGE
) -> dict[str, Any] | None:
    """HARDENING-REQ003 · Intel `GET /api/v1/company-taxonomy/search`.

    Full paginated set for categorical queries ("agencias de marketing",
    "todas las asesorías fiscales"). Returns `{results: [...], total: N}` or
    None if the endpoint is not enabled / gate-blocked. On 4xx/5xx we propagate
    `AgencyToolHTTPError` so the caller degrades to `_empty_response`.
    """
    url = (
        f"/api/v1/company-taxonomy/search"
        f"?q={quote(q)}&primary_only=true&limit={limit}&offset={offset}"
    )
    resp = await _intel_call_ff(get_agency_tool_client().request("GET", url))
    if resp.status_code == 404:
        # Endpoint not enabled yet on Intel side. Latent gate — signal caller
        # to fall through (semantic path).
        return None
    if resp.status_code >= 400:
        raise AgencyToolHTTPError(
            status_code=resp.status_code,
            error_class="client_4xx" if resp.status_code < 500 else "server_5xx",
            message=f"taxonomy-search http_{resp.status_code}",
        )
    return resp.json()


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
