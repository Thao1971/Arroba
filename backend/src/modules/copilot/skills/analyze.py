"""Analyze Skill — LLM-powered company analysis.

Flow (E1.4 mock + Claude):
  1. Resolve company from query (via EnrichCompanyAdapter).
  2. If 0 matches → EmptyState with sector suggestions.
  3. If ≥2 close matches → EmptyState asking the user to disambiguate.
  4. Otherwise enrich the chosen company → build a strict JSON prompt for
     Claude → parse → assemble Workspace: Hero + Metrics + CompanyCard +
     Narrative.

LLM errors:
  - 1 retry on invalid JSON (factory parses tolerantly).
  - Timeout / upstream / repeated bad JSON → ErrorBlock with retry_intent=analyze.
"""
from __future__ import annotations

import json
import uuid

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
    AnalyzeSkillRequest,
    AnalyzeSkillResponse,
    BlockSpec,
    CompanyCardBlock,
    CompanyCardProps,
    EmptyStateBlock,
    EmptyStateBlockProps,
    ErrorBlock,
    ErrorBlockProps,
    HeroBlock,
    HeroBlockProps,
    MetricItem,
    MetricsBlock,
    MetricsBlockProps,
    NarrativeBlock,
    NarrativeBlockProps,
    Workspace,
)
from src.modules.copilot.skills.company_resolver import resolve_company

log = get_logger("copilot.skill.analyze")

ADAPTER_MODE = "mock"

SYSTEM_PROMPT_ES = (
    "Eres un analista senior de M&A para pymes españolas. Recibes datos "
    "financieros y descriptivos de UNA empresa y devuelves un JSON ESTRICTO "
    "con la forma exacta:\n\n"
    "{\n"
    '  "summary": "máx 320 chars, español neutro de negocio",\n'
    '  "key_points": ["3-5 puntos clave"],\n'
    '  "risks": ["2-4 riesgos accionables, español, sin tecnicismos"],\n'
    '  "opportunities": ["2-4 oportunidades accionables"]\n'
    "}\n\n"
    "Reglas: NO inventes cifras, usa solo las que vienen en el input. NO "
    "menciones el dataset ni el JSON. Frases cortas. No incluyas títulos. "
    "No uses markdown ni emojis."
)

SYSTEM_PROMPT_EN = (
    "You are a senior M&A analyst for Spanish SMEs. You receive financial and "
    "descriptive data of ONE company and return STRICT JSON in this exact shape:"
    '\n\n{\n  "summary": "max 320 chars",\n  "key_points": ["3-5 bullets"],\n  '
    '"risks": ["2-4 actionable risks"],\n  "opportunities": ["2-4 actionable opportunities"]\n}\n\n'
    "Rules: do NOT make up numbers, use only the ones in the input. Short sentences. "
    "No markdown, no emojis, no headers."
)


def _system_prompt(locale: str) -> str:
    return SYSTEM_PROMPT_ES if locale != "en" else SYSTEM_PROMPT_EN


def _company_payload_for_llm(company: EnrichedCompany) -> dict:
    f = company.financials
    return {
        "legal_name": company.legal_name,
        "cif": company.cif,
        "sector": company.sector,
        "region": company.region,
        "country": company.country,
        "revenue_eur": f.revenue if f else None,
        "ebitda_eur": f.ebitda if f else None,
        "employees": f.employees if f else None,
        "fiscal_year": f.fiscal_year if f else None,
        "confidence": company.confidence,
        "lineage": company.lineage.value if hasattr(company.lineage, "value") else str(company.lineage),
    }


def _fmt_eur(value: float | None) -> str:
    if value is None:
        return "—"
    if value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M €"
    if value >= 1_000:
        return f"{value / 1_000:.0f}k €"
    return f"{value:.0f} €"


def _margin_pct(company: EnrichedCompany) -> str:
    f = company.financials
    if not f or not f.ebitda or not f.revenue:
        return "—"
    if f.revenue == 0:
        return "—"
    return f"{(f.ebitda / f.revenue) * 100:.1f}%"


def _wsid() -> str:
    return "wsp_" + uuid.uuid4().hex[:12]


def _bid(prefix: str) -> str:
    return f"blk_{prefix}_{uuid.uuid4().hex[:8]}"


def _empty_workspace(title: str, description: str, suggestions: list[str], intent: str) -> Workspace:
    return Workspace(
        workspace_id=_wsid(),
        intent=intent,
        blocks=[
            EmptyStateBlock(
                id=_bid("empty"),
                props=EmptyStateBlockProps(
                    title=title, description=description, suggestions=suggestions
                ),
            )
        ],
    )


def _error_workspace(title: str, message: str, code: str, intent: str) -> Workspace:
    return Workspace(
        workspace_id=_wsid(),
        intent=intent,
        blocks=[
            ErrorBlock(
                id=_bid("err"),
                props=ErrorBlockProps(
                    title=title, message=message, code=code, retry_intent=intent
                ),
            )
        ],
    )


async def _call_llm(
    llm: LLMProvider,
    locale: str,
    company: EnrichedCompany,
) -> dict | None:
    """Calls the LLM with 1 retry on invalid JSON. Returns None on permanent failure."""
    sys_prompt = _system_prompt(locale)
    user_payload = json.dumps(_company_payload_for_llm(company), ensure_ascii=False)
    user_msg = (
        f"Analiza la empresa cuyo dataset es:\n{user_payload}\n\n"
        "Devuelve solo el JSON."
        if locale != "en"
        else f"Analyze the company whose dataset is:\n{user_payload}\n\nReturn only the JSON."
    )
    messages = [{"role": "user", "content": user_msg}]
    try:
        data = await llm.complete(messages, system=sys_prompt, response_format="json")
    except LLMInvalidJSONError:
        log.warning("[LLM] analyze invalid JSON; retrying once", company=company.master_company_id)
        try:
            data = await llm.complete(messages, system=sys_prompt, response_format="json")
        except (LLMInvalidJSONError, LLMTimeoutError, LLMUpstreamError) as exc:
            log.error("[LLM] analyze retry failed", err=str(exc))
            return None
    except (LLMTimeoutError, LLMUpstreamError) as exc:
        log.error("[LLM] analyze failed", err=str(exc))
        return None
    if not isinstance(data, dict):
        return None
    return data


def _coerce_str_list(v, *, limit: int) -> list[str]:
    if not isinstance(v, list):
        return []
    out = []
    for item in v:
        if isinstance(item, str) and item.strip():
            out.append(item.strip()[:200])
        if len(out) >= limit:
            break
    return out


def _build_analyze_workspace(
    company: EnrichedCompany,
    llm_data: dict | None,
    locale: str,
) -> Workspace:
    summary = (llm_data or {}).get("summary") if isinstance(llm_data, dict) else None
    summary = summary if isinstance(summary, str) else None
    if summary:
        summary = summary.strip()[:600]
    key_points = _coerce_str_list((llm_data or {}).get("key_points"), limit=5)
    risks = _coerce_str_list((llm_data or {}).get("risks"), limit=4)
    opps = _coerce_str_list((llm_data or {}).get("opportunities"), limit=4)

    hero = HeroBlock(
        id=_bid("hero"),
        props=HeroBlockProps(
            eyebrow="Análisis de empresa" if locale != "en" else "Company analysis",
            title=company.legal_name,
            subtitle=" · ".join(
                [
                    s
                    for s in [
                        company.sector,
                        company.region,
                        company.cif,
                    ]
                    if s
                ]
            ) or None,
            tone="info",
        ),
    )

    metric_items: list[MetricItem] = []
    f = company.financials
    if f:
        if f.revenue is not None:
            metric_items.append(MetricItem(label="Ingresos", value=_fmt_eur(f.revenue)))
        if f.ebitda is not None:
            metric_items.append(MetricItem(label="EBITDA", value=_fmt_eur(f.ebitda)))
        metric_items.append(MetricItem(label="Margen EBITDA", value=_margin_pct(company)))
        if f.employees is not None:
            metric_items.append(MetricItem(label="Empleados", value=str(f.employees)))
        if f.fiscal_year is not None:
            metric_items.append(MetricItem(label="Año fiscal", value=str(f.fiscal_year)))
    if not metric_items:
        # Always have at least one metric so MetricsBlockProps validates.
        metric_items.append(
            MetricItem(label="Confianza", value=f"{int((company.confidence or 0) * 100)}%")
        )

    metrics = MetricsBlock(
        id=_bid("metrics"),
        props=MetricsBlockProps(
            title="Indicadores clave" if locale != "en" else "Key indicators",
            items=metric_items,
        ),
    )

    card = CompanyCardBlock(
        id=_bid("card"),
        props=CompanyCardProps(
            master_company_id=company.master_company_id,
            name=company.legal_name,
            legal_name=company.legal_name,
            cif=company.cif,
            sector=company.sector,
            region=company.region,
            country=company.country,
            revenue=f.revenue if f else None,
            ebitda=f.ebitda if f else None,
            employees=f.employees if f else None,
            fiscal_year=f.fiscal_year if f else None,
            confidence=company.confidence,
        ),
    )

    # Narrative — guaranteed to have at least one populated list.
    if not summary and not key_points and not risks and not opps:
        # LLM totally failed but we still want a workspace; offer a minimal
        # narrative so the user knows what to do next.
        summary = (
            "No hemos podido generar el análisis automático ahora. "
            "Te mostramos los indicadores básicos. Vuelve a intentarlo."
            if locale != "en"
            else "We couldn't generate the automated analysis now. "
            "We are showing the key indicators. Please try again."
        )
    narrative = NarrativeBlock(
        id=_bid("narrative"),
        props=NarrativeBlockProps(
            title="Lectura del analista" if locale != "en" else "Analyst takeaway",
            summary=summary,
            key_points=key_points,
            risks=risks,
            opportunities=opps,
            citations=[],
        ),
    )

    blocks: list[BlockSpec] = [hero, metrics, card, narrative]
    return Workspace(workspace_id=_wsid(), intent="analyze", blocks=blocks)


async def execute_analyze(
    request: AnalyzeSkillRequest,
    *,
    adapter: EnrichCompanyAdapter | None = None,
    llm: LLMProvider | None = None,
) -> AnalyzeSkillResponse:
    adapter = adapter or get_enrich_company_adapter()
    llm = llm or get_llm_provider()
    locale = request.context.locale

    candidate, matches = await resolve_company(request.query, adapter=adapter, limit=3)
    log.info(
        "[MOCK] copilot.analyze",
        query=request.query,
        candidate=candidate,
        matches=len(matches),
    )

    if not candidate:
        return AnalyzeSkillResponse(
            workspace=_empty_workspace(
                title=(
                    "Necesito un nombre de empresa para analizar"
                    if locale != "en"
                    else "I need a company name to analyse"
                ),
                description=(
                    "Prueba con: analiza Kitchen Studio, analiza Grupo Olmedo Hoteles."
                    if locale != "en"
                    else "Try: analyze Kitchen Studio, analyze Grupo Olmedo Hoteles."
                ),
                suggestions=["Analiza Kitchen Studio", "Analiza Grupo Olmedo Hoteles"],
                intent="analyze",
            ),
            source=ADAPTER_MODE,
            query=request.query,
        )

    if not matches:
        return AnalyzeSkillResponse(
            workspace=_empty_workspace(
                title=(
                    f"No encuentro la empresa «{candidate}»"
                    if locale != "en"
                    else f'I could not find "{candidate}"'
                ),
                description=(
                    "Revisa el nombre o prueba con otra sugerencia."
                    if locale != "en"
                    else "Check the name or try another suggestion."
                ),
                suggestions=["Kitchen Studio", "Grupo Olmedo Hoteles", "Quickads"],
                intent="analyze",
            ),
            source=ADAPTER_MODE,
            query=request.query,
        )

    # Ambiguity guard: ≥2 matches with similar score → ask user to disambiguate.
    # Heuristic: top score - second score < 0.15 AND neither is an exact match.
    if (
        len(matches) >= 2
        and (matches[0].confidence or 0) < 1.0
        and abs(_score_of(matches[0]) - _score_of(matches[1])) < 0.15
    ):
        suggestions = [m.legal_name for m in matches[:4]]
        return AnalyzeSkillResponse(
            workspace=_empty_workspace(
                title=(
                    f"Hay varias empresas que encajan con «{candidate}»"
                    if locale != "en"
                    else f'Several companies match "{candidate}"'
                ),
                description=(
                    "Indícame cuál quieres analizar:"
                    if locale != "en"
                    else "Tell me which one you want to analyse:"
                ),
                suggestions=suggestions,
                intent="analyze",
            ),
            source=ADAPTER_MODE,
            query=request.query,
        )

    company = matches[0]
    llm_data = await _call_llm(llm, locale, company)
    workspace = _build_analyze_workspace(company, llm_data, locale)
    return AnalyzeSkillResponse(workspace=workspace, source=ADAPTER_MODE, query=request.query)


def _score_of(_company: EnrichedCompany) -> float:
    """We don't currently propagate the resolver score with the EnrichedCompany
    model. Confidence acts as a proxy for ambiguity tie-breaking."""
    return float(_company.confidence or 0.85)
