"""Recommend Skill — LLM-assisted intent routing + deterministic body.

The LLM job is small: parse the user query into ONE of three subtypes:
  - similar_to_company       ("compañías similares a Kitchen Studio")
  - opportunities_by_sector  ("oportunidades en software")
  - list_by_sector           ("empresas en alimentación")

Everything else is deterministic, served by the EnrichCompanyAdapter (mock today,
real once REQ-005 ships).

Workspace emitted: HeroBlock + CompanyCardsGridBlock + NarrativeBlock.
"""
from __future__ import annotations

import json
import re
import unicodedata
import uuid

from src.core.database import get_db
from src.core.logging import get_logger
from src.modules.agency_tool_adapter.enrich_company import (
    EnrichCompanyAdapter,
    get_enrich_company_adapter,
)
from src.modules.agency_tool_adapter.models import EnrichedCompany
from src.modules.copilot.llm import LLMProvider, get_llm_provider
from src.modules.copilot.llm.provider import (
    LLMInvalidJSONError,
    LLMTimeoutError,
    LLMUpstreamError,
)
from src.modules.copilot.models import (
    BlockSpec,
    CompanyCardsGridBlock,
    CompanyCardsGridItem,
    CompanyCardsGridProps,
    EmptyStateBlock,
    EmptyStateBlockProps,
    HeroBlock,
    HeroBlockProps,
    NarrativeBlock,
    NarrativeBlockProps,
    RecommendSkillRequest,
    RecommendSkillResponse,
    Workspace,
)
from src.modules.copilot.skills.company_resolver import resolve_company

log = get_logger("copilot.skill.recommend")

ADAPTER_MODE = "mock"

# Adjacent-sector map for graceful coverage fallback. When the strict sector
# match yields <3 results, we top up with companies from these adjacent
# sectors (clearly marked in the `reason` field so the user knows what they
# are seeing). The REAL Recommendation Engine (REQ-005) will subsume this.
_ADJACENT_SECTORS: dict[str, list[str]] = {
    "alimentacion": ["hoteles", "retail"],
    "hoteles": ["alimentacion", "servicios profesionales"],
    "retail": ["alimentacion", "industria"],
    "software": ["marketing", "servicios profesionales"],
    "marketing": ["software", "servicios profesionales"],
    "industria": ["retail", "servicios profesionales"],
    "salud": ["servicios profesionales"],
    "servicios profesionales": ["software", "marketing"],
}


def _adjacent_sectors_for(sector_norm: str) -> list[str]:
    if not sector_norm:
        return []
    for key, values in _ADJACENT_SECTORS.items():
        if key in sector_norm or sector_norm in key:
            return values
    return []


SYSTEM_PROMPT_ES = (
    "Eres un router de intención para una plataforma de M&A de pymes españolas. "
    "Recibes una petición libre y la clasificas en UNA de tres subtipos:\n\n"
    "- similar_to_company: el usuario pide empresas parecidas a OTRA empresa "
    "  concreta cuyo nombre aparece en la query.\n"
    "- opportunities_by_sector: el usuario pide oportunidades/empresas "
    "  invertibles, en venta o crecimiento, dentro de un sector.\n"
    "- list_by_sector: el usuario quiere un listado neutro de empresas de un "
    "  sector concreto sin connotación de inversión.\n\n"
    "Devuelve JSON ESTRICTO con la forma EXACTA:\n"
    '{\n'
    '  "subtype": "similar_to_company" | "opportunities_by_sector" | "list_by_sector",\n'
    '  "company_name": "...si subtype = similar_to_company. Si no, null",\n'
    '  "sector": "...si subtype != similar_to_company. Si no, null"\n'
    '}\n\n'
    "No incluyas texto antes ni después del JSON. No uses markdown."
)
SYSTEM_PROMPT_EN = (
    "You are an intent router for an M&A platform for Spanish SMEs. Classify "
    "the free-text query into ONE of three subtypes:\n"
    "- similar_to_company\n- opportunities_by_sector\n- list_by_sector\n\n"
    "Return STRICT JSON: {\"subtype\": \"...\", \"company_name\": \"...|null\", "
    "\"sector\": \"...|null\"}. No markdown."
)


def _wsid() -> str:
    return "wsp_" + uuid.uuid4().hex[:12]


def _bid(prefix: str) -> str:
    return f"blk_{prefix}_{uuid.uuid4().hex[:8]}"


def _normalize(s: str) -> str:
    text = unicodedata.normalize("NFD", s or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text.lower().strip())


def _empty(title: str, description: str, suggestions: list[str]) -> Workspace:
    return Workspace(
        workspace_id=_wsid(),
        intent="recommend",
        blocks=[
            EmptyStateBlock(
                id=_bid("empty"),
                props=EmptyStateBlockProps(
                    title=title, description=description, suggestions=suggestions
                ),
            )
        ],
    )


def _heuristic_intent(query: str) -> dict:
    """Deterministic fallback for intent parsing when the LLM is unavailable.
    Conservative: returns subtype=list_by_sector with the trailing sector
    string when in doubt."""
    q = _normalize(query)
    company_markers = [
        "similares a ",
        "parecidas a ",
        "similar to ",
        "como ",
        "tipo ",
    ]
    for m in company_markers:
        if m in q:
            after = q.split(m, 1)[1].strip()
            if after:
                return {
                    "subtype": "similar_to_company",
                    "company_name": after,
                    "sector": None,
                }
    opp_markers = ["oportunidad", "inversion", "invertir", "compra", "venta"]
    if any(k in q for k in opp_markers):
        # Try to extract sector from the trailing words.
        # Strip the verb. Keep last 4 words.
        trailing = " ".join(q.split()[-4:])
        sector = re.sub(r"^(en|de|del|la|el|los|las)\s+", "", trailing)
        return {"subtype": "opportunities_by_sector", "company_name": None, "sector": sector}
    # Plain "empresas en X" / "compañías de Y" → list_by_sector.
    list_markers = ["empresas en ", "empresas de ", "companias en ", "companias de ", "list "]
    for m in list_markers:
        if m in q:
            after = q.split(m, 1)[1].strip()
            return {"subtype": "list_by_sector", "company_name": None, "sector": after}
    # Last resort: treat the entire query as a sector probe.
    return {"subtype": "list_by_sector", "company_name": None, "sector": q}


async def _classify_intent(llm: LLMProvider, *, locale: str, query: str) -> dict:
    """LLM-assisted intent classifier; falls back to heuristic on any failure."""
    sys = SYSTEM_PROMPT_ES if locale != "en" else SYSTEM_PROMPT_EN
    msg = [{"role": "user", "content": query}]
    try:
        data = await llm.complete(msg, system=sys, response_format="json")
    except LLMInvalidJSONError:
        log.warning("[LLM] recommend intent invalid JSON, retrying once")
        try:
            data = await llm.complete(msg, system=sys, response_format="json")
        except (LLMInvalidJSONError, LLMTimeoutError, LLMUpstreamError) as exc:
            log.warning("[LLM] recommend intent retry failed, heuristic", err=str(exc))
            return _heuristic_intent(query)
    except (LLMTimeoutError, LLMUpstreamError) as exc:
        log.warning("[LLM] recommend intent failed, heuristic", err=str(exc))
        return _heuristic_intent(query)

    if not isinstance(data, dict) or "subtype" not in data:
        return _heuristic_intent(query)
    subtype = str(data.get("subtype") or "")
    if subtype not in ("similar_to_company", "opportunities_by_sector", "list_by_sector"):
        return _heuristic_intent(query)
    return {
        "subtype": subtype,
        "company_name": data.get("company_name") if isinstance(data.get("company_name"), str) else None,
        "sector": data.get("sector") if isinstance(data.get("sector"), str) else None,
    }


async def _companies_by_sector(sector: str, limit: int = 8) -> list[EnrichedCompany]:
    if not sector:
        return []
    sector_norm = _normalize(sector)
    db = get_db()
    raw = await db.master_companies_mock.find({}, {"_id": 0}).to_list(length=500)
    out: list[tuple[float, EnrichedCompany]] = []
    for d in raw:
        sec = _normalize(str(d.get("sector") or ""))
        score = 0.0
        if sector_norm and sec:
            if sector_norm == sec:
                score = 1.0
            elif sector_norm in sec or sec in sector_norm:
                score = 0.8
            else:
                tokens_a = {t for t in sector_norm.split() if len(t) >= 4}
                tokens_b = {t for t in sec.split() if len(t) >= 4}
                if tokens_a & tokens_b:
                    score = 0.6
        if score == 0:
            continue
        from src.modules.agency_tool_adapter.models import Financials, Lineage

        fin = Financials(**d["financials"]) if d.get("financials") else None
        out.append(
            (
                score,
                EnrichedCompany(
                    master_company_id=d["master_company_id"],
                    cif=d.get("cif"),
                    legal_name=d["legal_name"],
                    sector=d.get("sector"),
                    region=d.get("region"),
                    country=d.get("country", "ES"),
                    financials=fin,
                    confidence=float(d.get("confidence", 0.85)),
                    lineage=Lineage(d.get("lineage", "normalized")),
                    valid_until=d.get("valid_until"),
                    signals=[],
                    scores={},
                    recommendations=[],
                    source="mock",
                ),
            )
        )
    out.sort(key=lambda x: (-x[0], x[1].legal_name.lower()))
    return [c for _, c in out[:limit]]


def _grid_item_from_company(
    c: EnrichedCompany, *, score: float, reason: str | None
) -> CompanyCardsGridItem:
    return CompanyCardsGridItem(
        master_company_id=c.master_company_id,
        name=c.legal_name,
        sector=c.sector,
        region=c.region,
        score=round(min(max(score, 0.0), 1.0), 3),
        reason=reason,
    )


async def _sector_with_adjacent(
    sector_label: str, *, min_total: int, limit: int
) -> tuple[list[EnrichedCompany], list[EnrichedCompany]]:
    """Return (strict_sector_matches, adjacent_sector_matches).

    Adjacent matches are returned only when the strict set is below `min_total`,
    and the union is capped at `limit` items. Adjacent matches exclude any
    company already in the strict set.
    """
    strict = await _companies_by_sector(sector_label, limit=limit)
    if len(strict) >= min_total:
        return (strict[:limit], [])
    strict_ids = {c.master_company_id for c in strict}
    sector_norm = _normalize(sector_label)
    adj_sectors = _adjacent_sectors_for(sector_norm)
    adjacent: list[EnrichedCompany] = []
    for adj in adj_sectors:
        if len(strict) + len(adjacent) >= limit:
            break
        cands = await _companies_by_sector(adj, limit=limit)
        for c in cands:
            if c.master_company_id in strict_ids:
                continue
            if any(a.master_company_id == c.master_company_id for a in adjacent):
                continue
            adjacent.append(c)
            if len(strict) + len(adjacent) >= limit:
                break
    return (strict, adjacent[: max(0, limit - len(strict))])


async def execute_recommend(
    request: RecommendSkillRequest,
    *,
    adapter: EnrichCompanyAdapter | None = None,
    llm: LLMProvider | None = None,
) -> RecommendSkillResponse:
    adapter = adapter or get_enrich_company_adapter()
    llm = llm or get_llm_provider()
    locale = request.context.locale

    intent = await _classify_intent(llm, locale=locale, query=request.query)
    subtype = intent["subtype"]
    log.info(
        "[MOCK] copilot.recommend",
        query=request.query,
        subtype=subtype,
        company_name=intent.get("company_name"),
        sector=intent.get("sector"),
    )

    items: list[CompanyCardsGridItem] = []
    reference_name: str | None = None
    sector_label: str | None = None
    narrative_summary: str | None = None
    narrative_points: list[str] = []

    if subtype == "similar_to_company":
        name_q = intent.get("company_name") or ""
        _candidate, matches = await resolve_company(name_q, adapter=adapter, limit=1)
        if not matches:
            return RecommendSkillResponse(
                workspace=_empty(
                    title=(
                        f"No encuentro «{name_q}» como empresa de referencia"
                        if locale != "en"
                        else f'I could not find "{name_q}" as a reference company'
                    ),
                    description=(
                        "Indícame una empresa que conozca para encontrar similares."
                        if locale != "en"
                        else "Give me a known company to find similar ones."
                    ),
                    suggestions=[
                        "Empresas similares a Kitchen Studio",
                        "Compañías parecidas a Grupo Olmedo Hoteles",
                    ],
                ),
                source=ADAPTER_MODE,
                query=request.query,
            )
        reference = matches[0]
        reference_name = reference.legal_name
        sector_label = reference.sector
        # "Similar" = same sector, exclude the reference itself.
        sector_companies = await _companies_by_sector(reference.sector or "", limit=12)
        sector_companies = [c for c in sector_companies if c.master_company_id != reference.master_company_id]
        for idx, c in enumerate(sector_companies[:6]):
            base = 0.92 - (idx * 0.07)
            items.append(
                _grid_item_from_company(
                    c,
                    score=base,
                    reason=(
                        f"Mismo sector ({c.sector})"
                        if locale != "en"
                        else f"Same sector ({c.sector})"
                    ),
                )
            )
        narrative_summary = (
            f"He localizado {len(items)} empresas con sector próximo a {reference.legal_name}."
            if locale != "en"
            else f"Found {len(items)} companies close in sector to {reference.legal_name}."
        )
        narrative_points = [
            (
                "Criterio principal: coincidencia sectorial."
                if locale != "en"
                else "Main criterion: sector match."
            ),
            (
                "Cuando llegue REQ-005 (Recommendation Engine) se añadirán similitud "
                "por tamaño, geografía y momento del ciclo."
                if locale != "en"
                else "Once REQ-005 (Recommendation Engine) ships we'll add similarity "
                "by size, geography and lifecycle."
            ),
        ]

    elif subtype == "opportunities_by_sector":
        sector_label = intent.get("sector") or ""
        strict, adjacent = await _sector_with_adjacent(sector_label, min_total=3, limit=6)
        for idx, c in enumerate(strict):
            base = 0.9 - (idx * 0.06)
            items.append(
                _grid_item_from_company(
                    c,
                    score=base,
                    reason=(
                        f"Sector identificado ({c.sector}) · indicador de oportunidad mock"
                        if locale != "en"
                        else f"Sector match ({c.sector}) · mock opportunity signal"
                    ),
                )
            )
        for idx, c in enumerate(adjacent):
            base = 0.62 - (idx * 0.04)
            items.append(
                _grid_item_from_company(
                    c,
                    score=base,
                    reason=(
                        f"Sector próximo ({c.sector}) · cobertura limitada en «{sector_label}»"
                        if locale != "en"
                        else f"Near-by sector ({c.sector}) · limited coverage in '{sector_label}'"
                    ),
                )
            )
        coverage_note = (
            f"Cobertura limitada en {sector_label}: completamos con sectores próximos."
            if locale != "en"
            else f"Limited coverage in {sector_label}: padded with near-by sectors."
        ) if adjacent else None
        narrative_summary = (
            f"He preseleccionado {len(items)} empresas en {sector_label} como "
            f"oportunidades preliminares."
            if locale != "en"
            else f"Preselected {len(items)} companies in {sector_label} as preliminary opportunities."
        )
        narrative_points = [
            (
                "Estos resultados son mock. REQ-005 los sustituirá por señales "
                "reales (intención de venta, crecimiento, eventos corporativos)."
                if locale != "en"
                else "These results are mock. REQ-005 will replace them with real "
                "signals (sale intent, growth, corporate events)."
            ),
        ]
        if coverage_note:
            narrative_points.insert(0, coverage_note)

    else:  # list_by_sector
        sector_label = intent.get("sector") or ""
        strict, adjacent = await _sector_with_adjacent(sector_label, min_total=3, limit=8)
        for idx, c in enumerate(strict):
            base = 0.85 - (idx * 0.05)
            items.append(
                _grid_item_from_company(
                    c,
                    score=base,
                    reason=(
                        f"Empresa con sector {c.sector}"
                        if locale != "en"
                        else f"Sector: {c.sector}"
                    ),
                )
            )
        for idx, c in enumerate(adjacent):
            base = 0.55 - (idx * 0.04)
            items.append(
                _grid_item_from_company(
                    c,
                    score=base,
                    reason=(
                        f"Sector próximo ({c.sector})"
                        if locale != "en"
                        else f"Near-by sector ({c.sector})"
                    ),
                )
            )
        coverage_note = (
            f"Cobertura limitada en {sector_label}: completamos con sectores próximos."
            if locale != "en"
            else f"Limited coverage in {sector_label}: padded with near-by sectors."
        ) if adjacent else None
        narrative_summary = (
            f"{len(items)} empresas listadas para el sector {sector_label}."
            if locale != "en"
            else f"{len(items)} companies listed for sector {sector_label}."
        )
        if coverage_note:
            narrative_points = [coverage_note]

    if not items:
        return RecommendSkillResponse(
            workspace=_empty(
                title=(
                    f"Sin resultados para {sector_label or reference_name or 'esa búsqueda'}"
                    if locale != "en"
                    else f"No results for {sector_label or reference_name or 'that query'}"
                ),
                description=(
                    "Prueba con un sector más amplio o una empresa de referencia conocida."
                    if locale != "en"
                    else "Try a broader sector or a known reference company."
                ),
                suggestions=[
                    "Empresas en software",
                    "Oportunidades en hoteles",
                    "Empresas similares a Kitchen Studio",
                ],
            ),
            source=ADAPTER_MODE,
            query=request.query,
        )

    hero_title = {
        "similar_to_company": (
            f"Empresas similares a {reference_name}"
            if locale != "en"
            else f"Companies similar to {reference_name}"
        ),
        "opportunities_by_sector": (
            f"Oportunidades en {sector_label}"
            if locale != "en"
            else f"Opportunities in {sector_label}"
        ),
        "list_by_sector": (
            f"Empresas en {sector_label}"
            if locale != "en"
            else f"Companies in {sector_label}"
        ),
    }[subtype]

    hero = HeroBlock(
        id=_bid("hero"),
        props=HeroBlockProps(
            eyebrow="Recomendaciones" if locale != "en" else "Recommendations",
            title=hero_title,
            subtitle=None,
            tone="info",
        ),
    )

    grid = CompanyCardsGridBlock(
        id=_bid("grid"),
        props=CompanyCardsGridProps(
            title=None,
            subtype=subtype,
            items=items,
        ),
    )

    narrative = NarrativeBlock(
        id=_bid("narrative"),
        props=NarrativeBlockProps(
            title="Lectura del analista" if locale != "en" else "Analyst takeaway",
            summary=narrative_summary,
            key_points=narrative_points,
            risks=[],
            opportunities=[],
            citations=[],
        ),
    )

    blocks: list[BlockSpec] = [hero, grid, narrative]
    return RecommendSkillResponse(
        workspace=Workspace(workspace_id=_wsid(), intent="recommend", blocks=blocks),
        source=ADAPTER_MODE,
        query=request.query,
    )


# Re-export for callers that want the raw classifier.
__all__ = ["execute_recommend", "_classify_intent", "_heuristic_intent"]


def _unused_json() -> str:  # pragma: no cover
    return json.dumps({})
