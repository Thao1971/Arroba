"""Value Skill — indicative valuation. SIMPLIFIED scope (E1.4).

No sector multiples table. No methodology engine. Deterministic formula:
  central = revenue * 1.5
  range   = [central * 0.75, central * 1.30]

The REAL Valuation Engine lives in REQ-004 (Agency Tool). This Skill exists
to wire the conversational surface — when REQ-004 lands we swap the body
without touching the response shape.

Workspace emitted: HeroBlock + ValuationBlock + NarrativeBlock (LLM-generated
brief 2-3 sentence explanation of what REQ-004 will do; deterministic
fallback when LLM is unavailable so the workspace always renders).
"""
from __future__ import annotations

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
    BlockSpec,
    EmptyStateBlock,
    EmptyStateBlockProps,
    HeroBlock,
    HeroBlockProps,
    MetricItem,
    NarrativeBlock,
    NarrativeBlockProps,
    ValuationBlock,
    ValuationBlockProps,
    ValueSkillRequest,
    ValueSkillResponse,
    Workspace,
)
from src.modules.copilot.skills.company_resolver import resolve_company

log = get_logger("copilot.skill.value")

ADAPTER_MODE = "mock"

# Generic indicative factor. NOT a sector multiple — we made a deliberate
# decision to NOT hardcode sector multiples here. REQ-004 will own that logic.
REVENUE_FACTOR = 1.5
LOW_BAND = 0.75
HIGH_BAND = 1.30

DISCLAIMER_ES = (
    "Valoración indicativa. No constituye recomendación profesional ni "
    "asesoramiento financiero."
)
DISCLAIMER_EN = (
    "Indicative valuation. Not professional advice or financial recommendation."
)

NARRATIVE_FALLBACK_ES = (
    "La valoración indicativa de {name} se sitúa entre {low} y {high}, "
    "con un valor central de {central}. Cuando el Valuation Engine esté "
    "disponible vía REQ-004, se aplicarán comparables sectoriales y "
    "ajustes por crecimiento, deuda neta e intangibles."
)
NARRATIVE_FALLBACK_EN = (
    "{name}'s indicative valuation ranges between {low} and {high}, with a "
    "central value of {central}. Once the Valuation Engine ships via REQ-004 "
    "we will apply sector comparables and adjustments for growth, net debt "
    "and intangibles."
)


def _wsid() -> str:
    return "wsp_" + uuid.uuid4().hex[:12]


def _bid(prefix: str) -> str:
    return f"blk_{prefix}_{uuid.uuid4().hex[:8]}"


def _fmt_eur(value: float | None) -> str:
    if value is None:
        return "—"
    if value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M €"
    if value >= 1_000:
        return f"{value / 1_000:.0f}k €"
    return f"{value:.0f} €"


def _empty_workspace(title: str, description: str, suggestions: list[str]) -> Workspace:
    return Workspace(
        workspace_id=_wsid(),
        intent="value",
        blocks=[
            EmptyStateBlock(
                id=_bid("empty"),
                props=EmptyStateBlockProps(
                    title=title, description=description, suggestions=suggestions
                ),
            )
        ],
    )


async def _generate_narrative(
    llm: LLMProvider,
    *,
    locale: str,
    name: str,
    central: float,
    low: float,
    high: float,
) -> str:
    """Tries the LLM with a constrained prompt; falls back to a deterministic
    template if Claude is unavailable. Always returns a non-empty string."""
    fallback_tpl = NARRATIVE_FALLBACK_ES if locale != "en" else NARRATIVE_FALLBACK_EN
    fallback = fallback_tpl.format(
        name=name,
        low=_fmt_eur(low),
        high=_fmt_eur(high),
        central=_fmt_eur(central),
    )
    sys = (
        "Eres un analista de M&A. Recibes el nombre de una empresa española y "
        "una valoración indicativa con valor central y rango. Devuelves "
        "EXACTAMENTE 2-3 frases en español neutro de negocio explicando que "
        "(1) es una valoración indicativa, (2) cuando esté disponible el "
        "Valuation Engine REQ-004 se aplicarán comparables sectoriales y "
        "ajustes por crecimiento e intangibles. Frases cortas. Sin markdown, "
        "sin emojis, sin listas."
        if locale != "en"
        else
        "You are an M&A analyst. You receive a company name and an indicative "
        "valuation with central value and range. Reply with EXACTLY 2-3 short "
        "sentences explaining (1) this is an indicative valuation; (2) once "
        "the Valuation Engine REQ-004 ships, sector comparables and "
        "adjustments for growth and intangibles will be applied. No markdown."
    )
    user = (
        f"Empresa: {name}. Valor central: {_fmt_eur(central)}. "
        f"Rango: {_fmt_eur(low)} – {_fmt_eur(high)}."
        if locale != "en"
        else
        f"Company: {name}. Central value: {_fmt_eur(central)}. "
        f"Range: {_fmt_eur(low)} – {_fmt_eur(high)}."
    )
    try:
        out = await llm.complete(
            [{"role": "user", "content": user}],
            system=sys,
            response_format="text",
        )
    except (LLMInvalidJSONError, LLMTimeoutError, LLMUpstreamError) as exc:
        log.warning("[LLM] value narrative fallback", err=str(exc))
        return fallback
    if not isinstance(out, str) or not out.strip():
        return fallback
    return out.strip()[:600]


async def execute_value(
    request: ValueSkillRequest,
    *,
    adapter: EnrichCompanyAdapter | None = None,
    llm: LLMProvider | None = None,
) -> ValueSkillResponse:
    adapter = adapter or get_enrich_company_adapter()
    llm = llm or get_llm_provider()
    locale = request.context.locale

    candidate, matches = await resolve_company(request.query, adapter=adapter, limit=3)
    log.info(
        "[MOCK] copilot.value",
        query=request.query,
        candidate=candidate,
        matches=len(matches),
    )

    if not candidate or not matches:
        return ValueSkillResponse(
            workspace=_empty_workspace(
                title=(
                    f"No encuentro la empresa «{candidate}»"
                    if candidate
                    else "Necesito un nombre de empresa para valorar"
                ) if locale != "en" else (
                    f'I could not find "{candidate}"'
                    if candidate
                    else "I need a company name to value"
                ),
                description=(
                    "Prueba con: valora Kitchen Studio, cuánto vale Grupo Olmedo."
                    if locale != "en"
                    else "Try: value Kitchen Studio, value Grupo Olmedo."
                ),
                suggestions=[
                    "Valora Kitchen Studio",
                    "Valora Grupo Olmedo Hoteles",
                    "Valora Forjas del Duero",
                ],
            ),
            source=ADAPTER_MODE,
            query=request.query,
        )

    company: EnrichedCompany = matches[0]
    revenue = (company.financials.revenue if company.financials else None) or 0.0
    if revenue <= 0:
        # No revenue → can't compute. EmptyState with a clear message.
        return ValueSkillResponse(
            workspace=_empty_workspace(
                title=(
                    f"Sin datos de ingresos para {company.legal_name}"
                    if locale != "en"
                    else f"No revenue data for {company.legal_name}"
                ),
                description=(
                    "Sin ingresos no podemos calcular la valoración indicativa. "
                    "Completa la ficha desde admin o intenta con otra empresa."
                    if locale != "en"
                    else "Without revenue we cannot compute the indicative valuation."
                ),
                suggestions=["Valora Kitchen Studio", "Valora Grupo Olmedo Hoteles"],
            ),
            source=ADAPTER_MODE,
            query=request.query,
        )

    central = revenue * REVENUE_FACTOR
    low = central * LOW_BAND
    high = central * HIGH_BAND

    hero = HeroBlock(
        id=_bid("hero"),
        props=HeroBlockProps(
            eyebrow="Valoración indicativa" if locale != "en" else "Indicative valuation",
            title=company.legal_name,
            subtitle=" · ".join(
                s for s in [company.sector, company.region, company.cif] if s
            ) or None,
            tone="info",
        ),
    )

    valuation = ValuationBlock(
        id=_bid("val"),
        props=ValuationBlockProps(
            company_name=company.legal_name,
            sector=company.sector,
            method="revenue_multiple",
            multiple_label=(
                f"{REVENUE_FACTOR}× ingresos"
                if locale != "en"
                else f"{REVENUE_FACTOR}× revenue"
            ),
            multiple_value=REVENUE_FACTOR,
            central_value=round(central, 2),
            low_value=round(low, 2),
            high_value=round(high, 2),
            currency="EUR",
            inputs=[
                MetricItem(
                    label="Ingresos" if locale != "en" else "Revenue",
                    value=_fmt_eur(revenue),
                ),
                MetricItem(
                    label="Factor" if locale != "en" else "Factor",
                    value=f"{REVENUE_FACTOR}×",
                ),
                MetricItem(
                    label="Banda inferior" if locale != "en" else "Low band",
                    value=f"{int(LOW_BAND * 100)}%",
                ),
                MetricItem(
                    label="Banda superior" if locale != "en" else "High band",
                    value=f"{int(HIGH_BAND * 100)}%",
                ),
            ],
            disclaimer=DISCLAIMER_ES if locale != "en" else DISCLAIMER_EN,
        ),
    )

    narrative_text = await _generate_narrative(
        llm,
        locale=locale,
        name=company.legal_name,
        central=central,
        low=low,
        high=high,
    )
    narrative = NarrativeBlock(
        id=_bid("narrative"),
        props=NarrativeBlockProps(
            title="Lectura del analista" if locale != "en" else "Analyst takeaway",
            summary=narrative_text,
            key_points=[],
            risks=[],
            opportunities=[],
            citations=[],
        ),
    )

    blocks: list[BlockSpec] = [hero, valuation, narrative]
    return ValueSkillResponse(
        workspace=Workspace(workspace_id=_wsid(), intent="value", blocks=blocks),
        source=ADAPTER_MODE,
        query=request.query,
    )
