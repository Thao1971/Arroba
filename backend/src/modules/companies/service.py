"""Companies service layer.

Owns:
  - company fetch (delegates to agency_tool_adapter; honours anonymous gating);
  - section materialisation (identity, financials, score, comparables,
    valuation, narrative);
  - conversation persistence (CRUD over company_conversations +
    company_conversation_messages);
  - watchlist + share toggles;
  - rate-limited analysis refresh (atomic findOneAndUpdate against
    company_analysis_refreshes).

No router/controller logic here. Only data + business rules.
"""
from __future__ import annotations

import re
import unicodedata
from datetime import UTC, datetime, timedelta
from typing import Any

from src.core.database import get_db
from src.core.exceptions import (
    BadRequestError,
    ForbiddenError,
    NotFoundError,
)
from src.core.logging import get_logger
from src.modules.agency_tool_adapter.enrich_company import (
    EnrichCompanyAdapter,
    get_enrich_company_adapter,
)
from src.modules.agency_tool_adapter.models import EnrichedCompany
from src.modules.companies.advisor import (
    AdvisorResponse,
    invoke_company_advisor,
)
from src.modules.companies.models import (
    ANONYMOUS_LOCKED_FLAGS,
    ActivityItem,
    ActivitySection,
    CompanyConversation,
    CompanyConversationMessage,
    CompanyDetailResponse,
    CompanyHeaderInfo,
    CompanyIdentity,
    CompanySections,
    CompanyWatchlistEntry,
    DocumentsSection,
    GetConversationResponse,
    NextBestAction,
    SendMessageResponse,
    SignalsSection,
    WatchlistVisibility,
    new_block_id,
    new_conversation_id,
    now_utc,
)
from src.modules.copilot.llm import LLMProvider, get_llm_provider
from src.modules.copilot.models import (
    CompanyCardsGridBlock,
    CompanyCardsGridItem,
    CompanyCardsGridProps,
    HeroBlock,
    HeroBlockProps,
    MetricItem,
    MetricsBlock,
    MetricsBlockProps,
    NarrativeBlock,
    NarrativeBlockProps,
    ValuationBlock,
    ValuationBlockProps,
)
from src.modules.copilot.skills.recommend import _sector_with_adjacent

log = get_logger("companies.service")

ADAPTER_MODE = "mock"
ANALYSIS_REFRESH_COOLDOWN_S = 60

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _normalize(s: str) -> str:
    text = unicodedata.normalize("NFD", s or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text.lower().strip())


def _initials(name: str) -> str:
    parts = [p for p in re.split(r"\s+", (name or "").strip()) if p]
    if not parts:
        return "??"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[1][0]).upper()


def _fmt_eur(value: float | None) -> str:
    if value is None:
        return "—"
    if value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M €"
    if value >= 1_000:
        return f"{value / 1_000:.0f}k €"
    return f"{value:.0f} €"


def _is_valid_cif(cif: str) -> bool:
    return bool(re.match(r"^[A-Z]\d{8}$", (cif or "").strip().upper()))


# ---------------------------------------------------------------------------
# Lookup — by CIF or by master_company_id
# ---------------------------------------------------------------------------
async def _doc_by_cif(cif: str) -> dict[str, Any] | None:
    db = get_db()
    return await db.master_companies_mock.find_one({"cif": cif.upper()}, {"_id": 0})


async def _doc_by_master_id(mc_id: str) -> dict[str, Any] | None:
    db = get_db()
    return await db.master_companies_mock.find_one(
        {"master_company_id": mc_id}, {"_id": 0}
    )


async def get_enriched_by_cif(
    cif: str, *, adapter: EnrichCompanyAdapter | None = None
) -> EnrichedCompany:
    """Resolve CIF → EnrichedCompany (via the Agency Tool adapter boundary)."""
    if not cif:
        raise BadRequestError("invalid_cif", code="invalid_cif")
    doc = await _doc_by_cif(cif)
    if not doc:
        raise NotFoundError("company_not_found", code="company_not_found")
    adapter = adapter or get_enrich_company_adapter()
    return await adapter.enrich(doc["master_company_id"], profile="full")


async def get_canonical_cif_for_master_id(mc_id: str) -> str:
    """For the redirect endpoint: master_company_id → canonical CIF."""
    doc = await _doc_by_master_id(mc_id)
    if not doc:
        raise NotFoundError("company_not_found", code="company_not_found")
    cif = (doc.get("cif") or "").strip()
    if not cif:
        raise BadRequestError("company_has_no_cif", code="company_has_no_cif")
    return cif


# ---------------------------------------------------------------------------
# Section builders (deterministic)
# ---------------------------------------------------------------------------
def build_hero(company: EnrichedCompany) -> HeroBlock:
    subtitle = " · ".join(
        s for s in [company.sector, company.region, company.cif] if s
    ) or None
    return HeroBlock(
        id=new_block_id("hero"),
        props=HeroBlockProps(
            eyebrow="Análisis de empresa",
            title=company.legal_name,
            subtitle=subtitle,
            tone="info",
        ),
    )


def build_kpi_metrics(company: EnrichedCompany) -> MetricsBlock:
    """Section 1 KPI strip — public-safe (4 totals, no break-down)."""
    f = company.financials
    items: list[MetricItem] = []
    if f and f.revenue is not None:
        items.append(MetricItem(label="Ingresos", value=_fmt_eur(f.revenue)))
    if f and f.ebitda is not None:
        items.append(MetricItem(label="EBITDA", value=_fmt_eur(f.ebitda)))
    if f and f.revenue and f.ebitda:
        items.append(
            MetricItem(label="Margen EBITDA", value=f"{(f.ebitda / f.revenue) * 100:.1f}%")
        )
    if f and f.employees is not None:
        items.append(MetricItem(label="Empleados", value=str(f.employees)))
    if not items:
        items.append(
            MetricItem(label="Confianza", value=f"{int((company.confidence or 0) * 100)}%")
        )
    return MetricsBlock(
        id=new_block_id("kpi"),
        props=MetricsBlockProps(title="Resumen", items=items),
    )


def build_financials_metrics(company: EnrichedCompany) -> MetricsBlock:
    """Section 3 financials strip — locks for anon only at UI layer."""
    f = company.financials
    items: list[MetricItem] = []
    if f and f.revenue is not None:
        items.append(MetricItem(label="Ingresos", value=_fmt_eur(f.revenue)))
    if f and f.ebitda is not None:
        items.append(MetricItem(label="EBITDA", value=_fmt_eur(f.ebitda)))
    if f and f.revenue and f.ebitda:
        items.append(
            MetricItem(label="Margen EBITDA", value=f"{(f.ebitda / f.revenue) * 100:.1f}%")
        )
    if f and f.employees is not None:
        items.append(MetricItem(label="Empleados", value=str(f.employees)))
    if f and f.fiscal_year is not None:
        items.append(MetricItem(label="Año fiscal", value=str(f.fiscal_year)))
    if not items:
        items.append(MetricItem(label="Datos", value="—"))
    return MetricsBlock(
        id=new_block_id("fin"),
        props=MetricsBlockProps(title="Indicadores financieros", items=items),
    )


def build_score_placeholder(company: EnrichedCompany) -> HeroBlock:
    """Section 4 — placeholder until REQ-007 ships."""
    return HeroBlock(
        id=new_block_id("score"),
        props=HeroBlockProps(
            eyebrow="Score y señales",
            title="Disponible cuando REQ-007 entregue señales reales",
            subtitle=(
                "Hoy mostramos un score básico de confianza del dato "
                f"({int((company.confidence or 0) * 100)}%). Las señales "
                "BORME, contratación pública y cambios societarios llegan "
                "con la integración del Agency Tool."
            ),
            tone="info",
        ),
    )


async def build_comparables(
    company: EnrichedCompany, *, limit: int = 5
) -> CompanyCardsGridBlock:
    """Section 5 — comparables via the same adjacent-sector fallback used by
    the Recommend skill. Reuses recommend._sector_with_adjacent so the
    behaviour stays consistent."""
    strict, adjacent = await _sector_with_adjacent(
        company.sector or "", min_total=3, limit=limit + 1
    )
    items: list[CompanyCardsGridItem] = []
    for idx, c in enumerate(strict):
        if c.master_company_id == company.master_company_id:
            continue
        items.append(
            CompanyCardsGridItem(
                master_company_id=c.master_company_id,
                name=c.legal_name,
                sector=c.sector,
                region=c.region,
                score=round(min(0.92 - (idx * 0.06), 1.0), 3),
                reason=f"Mismo sector ({c.sector})",
            )
        )
        if len(items) >= limit:
            break
    for idx, c in enumerate(adjacent):
        if len(items) >= limit:
            break
        if c.master_company_id == company.master_company_id:
            continue
        items.append(
            CompanyCardsGridItem(
                master_company_id=c.master_company_id,
                name=c.legal_name,
                sector=c.sector,
                region=c.region,
                score=round(min(0.62 - (idx * 0.04), 1.0), 3),
                reason=(
                    f"Sector próximo ({c.sector}) · cobertura limitada en "
                    f"«{company.sector}»"
                ),
            )
        )
    return CompanyCardsGridBlock(
        id=new_block_id("comparables"),
        props=CompanyCardsGridProps(
            title=None, subtype="similar_to_company", items=items[:limit]
        ),
    )


def build_valuation(company: EnrichedCompany) -> ValuationBlock:
    """Section 6 — indicative valuation. Reuses the simplified formula from
    the value Skill so anchor/refresh paths stay aligned."""
    revenue = (company.financials.revenue if company.financials else None) or 0.0
    factor = 1.5
    low_band, high_band = 0.75, 1.30
    central = max(revenue * factor, 0.0)
    return ValuationBlock(
        id=new_block_id("val"),
        props=ValuationBlockProps(
            company_name=company.legal_name,
            sector=company.sector,
            method="revenue_multiple",
            multiple_label=f"{factor}× ingresos",
            multiple_value=factor,
            central_value=round(central, 2),
            low_value=round(central * low_band, 2),
            high_value=round(central * high_band, 2),
            currency="EUR",
            inputs=[
                MetricItem(label="Ingresos", value=_fmt_eur(revenue or None)),
                MetricItem(label="Factor", value=f"{factor}×"),
                MetricItem(label="Banda inferior", value=f"{int(low_band * 100)}%"),
                MetricItem(label="Banda superior", value=f"{int(high_band * 100)}%"),
            ],
            disclaimer=(
                "Valoración indicativa. No constituye recomendación profesional "
                "ni asesoramiento financiero."
            ),
        ),
    )


def _build_narrative_placeholder(
    company: EnrichedCompany, *, locale: str = "es"
) -> NarrativeBlock:
    """Snappy deterministic placeholder shown on the initial GET. The user
    refreshes it on demand via `POST /skills/analyze` so the LLM call never
    blocks the page load."""
    if locale == "en":
        summary = (
            f"The Copilot has not generated an analysis for {company.legal_name} "
            "yet. Click '↺ Refresh analysis' or ask the Company Advisor in the "
            "dock to produce one based on the ficha."
        )
    else:
        summary = (
            f"El Copilot todavía no ha generado un análisis de {company.legal_name}. "
            "Pulsa «↺ Refrescar análisis» o pregúntale al Company Advisor en el "
            "dock para que produzca uno con los datos de la ficha."
        )
    return NarrativeBlock(
        id=new_block_id("narrative"),
        props=NarrativeBlockProps(
            title="Lectura del analista",
            summary=summary,
            key_points=[],
            risks=[],
            opportunities=[],
            citations=[],
        ),
    )


async def build_narrative(
    company: EnrichedCompany,
    *,
    llm: LLMProvider | None = None,
    locale: str = "es",
) -> NarrativeBlock:
    """Section 7 — analyst takeaway. Uses the LLM (Claude via Emergent) but
    degrades to a deterministic placeholder when the LLM is unavailable so
    the section always renders something."""
    # Reuse analyze's narrative builder by simulating an empty advisor turn.
    # We call the advisor directly with an empty history and an "analyse"
    # implicit query so it returns a section_update for `narrative`.
    if llm is None:
        llm = get_llm_provider()
    try:
        adv = await invoke_company_advisor(
            llm=llm,
            company=company,
            history=[],
            query=(
                "Genera el análisis inicial de la empresa con resumen, "
                "key points, riesgos y oportunidades."
                if locale != "en"
                else "Generate the initial analysis with summary, key points, "
                "risks and opportunities."
            ),
            locale=locale,
        )
    except Exception as exc:  # pragma: no cover
        log.error("companies.narrative.advisor_failed", err=str(exc))
        adv = AdvisorResponse(
            response_text="(degraded)", section_updates=[], suggested_actions=[]
        )
    for upd in adv.section_updates:
        if upd.section == "narrative" and upd.block.type == "narrative":
            # Reissue with a fresh block_id so identity tests don't collide.
            block = upd.block.model_copy(update={"id": new_block_id("narrative")})
            return block  # type: ignore[return-value]
    # Deterministic fallback — never leave the section blank.
    return NarrativeBlock(
        id=new_block_id("narrative"),
        props=NarrativeBlockProps(
            title="Lectura del analista",
            summary=(
                "El análisis automático no está disponible ahora mismo. "
                f"Los indicadores básicos de {company.legal_name} están en "
                "las secciones superiores."
                if locale != "en"
                else f"Automated analysis is unavailable right now. The basic "
                f"indicators for {company.legal_name} are in the sections above."
            ),
            key_points=[],
            risks=[],
            opportunities=[],
            citations=[],
        ),
    )


def build_identity(company: EnrichedCompany, doc: dict[str, Any] | None) -> CompanyIdentity:
    return CompanyIdentity(
        master_company_id=company.master_company_id,
        cif=company.cif,
        legal_name=company.legal_name,
        sector=company.sector,
        region=company.region,
        country=company.country,
        founded_year=(doc or {}).get("founded_year"),
        employees=company.financials.employees if company.financials else None,
    )


def build_header(company: EnrichedCompany) -> CompanyHeaderInfo:
    return CompanyHeaderInfo(
        name=company.legal_name,
        cif=company.cif,
        sector=company.sector,
        region=company.region,
        country=company.country,
        initials=_initials(company.legal_name),
        score=int((company.confidence or 0) * 100) if company.confidence else None,
    )


# ---------------------------------------------------------------------------
# Public read — full ficha
# ---------------------------------------------------------------------------
def build_next_best_actions(*, authenticated: bool) -> list[NextBestAction]:
    """4 acciones canónicas de la sección §3.12 del ENTITY_FRAMEWORK.

    Autenticados ven las 4 habilitadas. Anónimos las ven pero deshabilitadas;
    el frontend renderiza LockedSectionBlur sobre la sección completa.
    """
    disabled = not authenticated
    return [
        NextBestAction(
            id="value_company",
            title="Valorar",
            description="Estimación indicativa por múltiplos y sensibilidades.",
            icon="trending-up",
            disabled=disabled,
        ),
        NextBestAction(
            id="find_buyers",
            title="Buscar compradores",
            description="Compradores estratégicos y fondos con encaje.",
            icon="handshake",
            disabled=disabled,
        ),
        NextBestAction(
            id="activate_opportunity",
            title="Activar oportunidad",
            description="Abre un caso buy-side o sell-side sobre esta empresa.",
            icon="target",
            disabled=disabled,
        ),
        NextBestAction(
            id="compare_with_other",
            title="Comparar con otra",
            description="Análisis comparado con una empresa del sector.",
            icon="layers",
            disabled=disabled,
        ),
    ]


def _as_aware(dt: Any) -> datetime:
    """Normaliza cualquier `datetime` (naive o aware) a offset-aware UTC.

    MongoDB devuelve mezclas naive/aware según de dónde venga el dato
    (documentos serializados desde Python con `datetime.utcnow()` legacy vs
    `datetime.now(UTC)`). Al ordenar timelines mixtos Python falla con
    `TypeError: can't compare offset-naive and offset-aware datetimes`.
    Esta función es la normalización estándar para todos los sort de
    timeline de companies.
    """
    if not isinstance(dt, datetime):
        return datetime.min.replace(tzinfo=UTC)
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


async def _build_activity_for_user(
    *, user_id: str, master_company_id: str, limit: int = 20
) -> list[ActivityItem]:
    """Ensambla el timeline de Actividad §3.11 desde 3 fuentes canónicas:

    - `company_watchlists` (toggle add/remove)
    - `company_analysis_refreshes` (refresh de Análisis / Valoración /
      Comparables — hoy comparten la misma colección con un discriminador)
    - `company_conversations` messages (turnos assistant recientes)

    Cada fuente aporta a lo sumo `limit/3` eventos; agregación final se
    ordena por `at` desc y se recorta a `limit`.
    """
    db = get_db()
    items: list[ActivityItem] = []
    # Watchlist entry (a lo sumo 1).
    wl = await db.company_watchlists.find_one(
        {"master_company_id": master_company_id, "saved_by": user_id},
        {"_id": 0},
    )
    if wl and wl.get("saved_at"):
        items.append(
            ActivityItem(
                event_id=wl.get("watchlist_id", "wl_current"),
                kind="watchlist_added",
                at=wl["saved_at"],
                actor_label="Tú",
                summary="Guardada en tu watchlist.",
            )
        )
    # Analysis refresh (a lo sumo 1).
    refresh = await db.company_analysis_refreshes.find_one(
        {"master_company_id": master_company_id, "user_id": user_id},
        {"_id": 0},
    )
    if refresh and refresh.get("last_refresh_at"):
        items.append(
            ActivityItem(
                event_id=f"ar_{master_company_id}_{user_id}",
                kind="analysis_refreshed",
                at=refresh["last_refresh_at"],
                actor_label="Arroba Copilot",
                summary="Análisis del Copilot refrescado.",
            )
        )
    # Últimos mensajes assistant (hasta 3).
    conv = await db.company_conversations.find_one(
        {"master_company_id": master_company_id, "user_id": user_id},
        {"_id": 0},
    )
    if conv:
        cursor = db.company_conversation_messages.find(
            {"conversation_id": conv["conversation_id"], "role": "assistant"},
            {"_id": 0},
        ).sort("created_at", -1).limit(3)
        async for msg in cursor:
            items.append(
                ActivityItem(
                    event_id=msg.get("message_id", "msg"),
                    kind="conversation_message",
                    at=msg["created_at"],
                    actor_label="Arroba Copilot",
                    summary=(msg.get("content") or "")[:120],
                )
            )
    items.sort(key=lambda i: _as_aware(i.at), reverse=True)
    return items[:limit]


async def get_company_detail(
    cif: str,
    *,
    user_id: str | None,
    org_id: str | None,
    adapter: EnrichCompanyAdapter | None = None,
    llm: LLMProvider | None = None,
    locale: str = "es",
) -> CompanyDetailResponse:
    """Materialise the entire ficha. When `user_id` is None we render the
    public subset only (sections 1-3 visible; 4-8 omitted; locked_sections
    tells the frontend what to blur)."""
    cif_norm = cif.strip().upper()
    if not _is_valid_cif(cif_norm):
        raise BadRequestError("invalid_cif", code="invalid_cif")

    company = await get_enriched_by_cif(cif_norm, adapter=adapter)
    raw_doc = await _doc_by_cif(cif_norm)

    hero = build_hero(company)
    kpi = build_kpi_metrics(company)
    identity = build_identity(company, raw_doc)
    financials = build_financials_metrics(company)

    if user_id is None:
        # Anonymous: omit locked sections; report them under locked_sections.
        sections = CompanySections(
            hero=hero,
            kpi_metrics=kpi,
            identity=identity,
            financials_metrics=financials,
            score_block=None,
            comparables=None,
            valuation=None,
            narrative=None,
            signals=SignalsSection(),  # unavailable=True por default (REQ-008)
            documents=DocumentsSection(items=[]),
            activity=ActivitySection(items=[]),
            next_best_actions=build_next_best_actions(authenticated=False),
        )
        log.info(
            "[MOCK] companies.detail (anon)",
            cif=cif_norm, master_company_id=company.master_company_id,
        )
        return CompanyDetailResponse(
            header=build_header(company),
            sections=sections,
            locked_sections=list(ANONYMOUS_LOCKED_FLAGS),
            in_watchlist=False,
            watchlist_visibility=None,
            conversation_id=None,
            source=ADAPTER_MODE,
        )

    # Authenticated: full ficha. The narrative section is intentionally a
    # placeholder on the initial fetch so the GET stays snappy — the LLM call
    # only happens when the user clicks "↺ Refrescar análisis" or sends a
    # message in the dock (both of which go through `refresh_analysis` or
    # the Company Advisor `/messages` endpoint).
    score = build_score_placeholder(company)
    comparables = await build_comparables(company)
    valuation = build_valuation(company)
    narrative = _build_narrative_placeholder(company, locale=locale)

    sections = CompanySections(
        hero=hero,
        kpi_metrics=kpi,
        identity=identity,
        financials_metrics=financials,
        score_block=score,
        comparables=comparables,
        valuation=valuation,
        narrative=narrative,
        signals=SignalsSection(),  # REQ-008 pendiente
        documents=DocumentsSection(items=[]),  # sin upload en Sprint 1
        activity=ActivitySection(
            items=await _build_activity_for_user(
                user_id=user_id, master_company_id=company.master_company_id
            )
        ),
        next_best_actions=build_next_best_actions(authenticated=True),
    )

    # Conversation hydrate (lazy-create row).
    conv = await get_or_create_conversation(
        user_id=user_id, company=company,
    )

    # Watchlist state for this org.
    in_watchlist = False
    visibility: WatchlistVisibility | None = None
    if org_id:
        entry = await _get_watchlist_entry(org_id=org_id, master_id=company.master_company_id)
        if entry:
            in_watchlist = True
            visibility = entry.get("visibility", "private")

    log.info(
        "[MOCK] companies.detail (auth)",
        cif=cif_norm, master_company_id=company.master_company_id,
        user_id=user_id, org_id=org_id,
    )
    return CompanyDetailResponse(
        header=build_header(company),
        sections=sections,
        locked_sections=[],
        in_watchlist=in_watchlist,
        watchlist_visibility=visibility,
        conversation_id=conv.conversation_id,
        source=ADAPTER_MODE,
    )


# ---------------------------------------------------------------------------
# Conversation (memory)
# ---------------------------------------------------------------------------
async def get_or_create_conversation(
    *, user_id: str, company: EnrichedCompany
) -> CompanyConversation:
    db = get_db()
    doc = await db.company_conversations.find_one(
        {"user_id": user_id, "master_company_id": company.master_company_id},
        {"_id": 0},
    )
    if doc:
        return CompanyConversation.model_validate(doc)
    record = CompanyConversation(
        conversation_id=new_conversation_id(),
        user_id=user_id,
        master_company_id=company.master_company_id,
        cif=company.cif,
        legal_name=company.legal_name,
        message_count=0,
    )
    await db.company_conversations.insert_one(record.model_dump(mode="json"))
    return record


async def list_messages(conversation_id: str) -> list[CompanyConversationMessage]:
    db = get_db()
    cursor = db.company_conversation_messages.find(
        {"conversation_id": conversation_id}, {"_id": 0}
    ).sort("created_at", 1)
    out: list[CompanyConversationMessage] = []
    async for d in cursor:
        try:
            out.append(CompanyConversationMessage.model_validate(d))
        except Exception:
            continue
    return out


async def get_conversation(
    *, user_id: str, cif: str, adapter: EnrichCompanyAdapter | None = None
) -> GetConversationResponse:
    company = await get_enriched_by_cif(cif, adapter=adapter)
    conv = await get_or_create_conversation(user_id=user_id, company=company)
    msgs = await list_messages(conv.conversation_id)
    return GetConversationResponse(
        conversation_id=conv.conversation_id,
        master_company_id=company.master_company_id,
        messages=msgs,
    )


async def _persist_message(msg: CompanyConversationMessage) -> None:
    db = get_db()
    await db.company_conversation_messages.insert_one(msg.model_dump(mode="json"))
    await db.company_conversations.update_one(
        {"conversation_id": msg.conversation_id},
        {"$set": {"updated_at": now_utc()}, "$inc": {"message_count": 1}},
    )


async def send_message(
    *,
    user_id: str,
    cif: str,
    query: str,
    locale: str = "es",
    adapter: EnrichCompanyAdapter | None = None,
    llm: LLMProvider | None = None,
) -> SendMessageResponse:
    """Append a user message, invoke the Company Advisor, persist its reply,
    return the delta the frontend needs."""
    company = await get_enriched_by_cif(cif, adapter=adapter)
    conv = await get_or_create_conversation(user_id=user_id, company=company)

    user_msg = CompanyConversationMessage(
        conversation_id=conv.conversation_id,
        role="user",
        content=query,
        intent="entity_chat",
    )
    await _persist_message(user_msg)

    history = await list_messages(conv.conversation_id)
    # History above already includes the new user message.
    history_dicts = [m.model_dump(mode="json") for m in history]

    advisor_llm = llm or get_llm_provider()
    advisor_resp = await invoke_company_advisor(
        llm=advisor_llm,
        company=company,
        history=history_dicts[:-1],  # advisor sees the history WITHOUT the new turn (passed separately).
        query=query,
        locale=locale,
    )

    assistant_msg = CompanyConversationMessage(
        conversation_id=conv.conversation_id,
        role="assistant",
        content=advisor_resp.response_text,
        intent="entity_chat",
        section_updates=[s.model_dump(mode="json") for s in advisor_resp.section_updates],
        suggested_actions=list(advisor_resp.suggested_actions),
    )
    await _persist_message(assistant_msg)

    return SendMessageResponse(
        message_user=user_msg,
        message_assistant=assistant_msg,
        section_updates=advisor_resp.section_updates,
        suggested_actions=list(advisor_resp.suggested_actions),
    )


# ---------------------------------------------------------------------------
# Skill refresh endpoints
# ---------------------------------------------------------------------------
class RateLimitedError(Exception):
    """Raised by refresh_analysis when the user is within the cooldown."""
    def __init__(self, retry_after_s: int):
        self.retry_after_s = retry_after_s
        super().__init__(f"rate_limited; retry in {retry_after_s}s")


async def refresh_analysis(
    *,
    user_id: str,
    cif: str,
    locale: str = "es",
    adapter: EnrichCompanyAdapter | None = None,
    llm: LLMProvider | None = None,
) -> NarrativeBlock:
    """Refresh the narrative section. Atomic rate-limit via findOneAndUpdate
    with a `last_refresh_at` condition. Concurrent calls in the same window
    are guaranteed to get 429.
    """
    from pymongo.errors import DuplicateKeyError

    company = await get_enriched_by_cif(cif, adapter=adapter)
    db = get_db()
    now = now_utc()
    cutoff = now - timedelta(seconds=ANALYSIS_REFRESH_COOLDOWN_S)

    # `find_one_and_update` with upsert=True + a `$or` condition behaves like:
    #   - if a doc matches the condition (cooldown elapsed or missing): update;
    #   - otherwise it tries to INSERT, which triggers DuplicateKeyError on
    #     the unique (user_id, master_company_id) index. We catch that as the
    #     "still cooling down" signal and translate to 429.
    try:
        res = await db.company_analysis_refreshes.find_one_and_update(
            {
                "user_id": user_id,
                "master_company_id": company.master_company_id,
                "$or": [
                    {"last_refresh_at": {"$lt": cutoff}},
                    {"last_refresh_at": {"$exists": False}},
                ],
            },
            {
                "$set": {
                    "user_id": user_id,
                    "master_company_id": company.master_company_id,
                    "last_refresh_at": now,
                }
            },
            upsert=True,
            return_document=True,
        )
    except DuplicateKeyError:
        existing = await db.company_analysis_refreshes.find_one(
            {"user_id": user_id, "master_company_id": company.master_company_id},
            {"_id": 0},
        )
        retry = ANALYSIS_REFRESH_COOLDOWN_S
        if existing:
            last = existing.get("last_refresh_at")
            if isinstance(last, datetime):
                if last.tzinfo is None:
                    last = last.replace(tzinfo=UTC)
                elapsed = (now - last).total_seconds()
                retry = max(1, int(ANALYSIS_REFRESH_COOLDOWN_S - elapsed))
        raise RateLimitedError(retry_after_s=retry)
    if not res:
        # Defensive: shouldn't happen with upsert=True + return_document=True,
        # but if it does, treat as cooling down.
        raise RateLimitedError(retry_after_s=ANALYSIS_REFRESH_COOLDOWN_S)

    return await build_narrative(company, llm=llm, locale=locale)


async def refresh_valuation(
    *, user_id: str, cif: str,
    adapter: EnrichCompanyAdapter | None = None,
) -> ValuationBlock:
    company = await get_enriched_by_cif(cif, adapter=adapter)
    log.info("companies.refresh_valuation", user_id=user_id, cif=cif)
    return build_valuation(company)


async def refresh_comparables(
    *, user_id: str, cif: str,
    adapter: EnrichCompanyAdapter | None = None,
) -> CompanyCardsGridBlock:
    company = await get_enriched_by_cif(cif, adapter=adapter)
    log.info("companies.refresh_comparables", user_id=user_id, cif=cif)
    return await build_comparables(company)


# ---------------------------------------------------------------------------
# Watchlist + Share
# ---------------------------------------------------------------------------
async def _get_watchlist_entry(
    *, org_id: str, master_id: str
) -> dict[str, Any] | None:
    db = get_db()
    return await db.company_watchlists.find_one(
        {"org_id": org_id, "master_company_id": master_id}, {"_id": 0}
    )


async def list_user_watchlist(
    *, user_id: str, org_id: str | None
) -> list[dict[str, Any]]:
    """Lista las empresas guardadas por el user en su org activa.

    Devuelve items en el shape genérico `EntityLookupResult`-compatible:
        { type: "company", id: cif, display_name, secondary_label, icon,
          added_at }

    El wrapper de router construirá el objeto final; aquí solo devolvemos
    los datos crudos ordenados por `saved_at` descendente.
    """
    if not org_id:
        return []
    db = get_db()
    cursor = db.company_watchlists.find(
        {"org_id": org_id, "saved_by": user_id},
        {"_id": 0},
    ).sort("saved_at", -1)
    entries = await cursor.to_list(length=200)
    # Enriquecer con sector/region tomándolo del master_companies_mock.
    out: list[dict[str, Any]] = []
    for entry in entries:
        secondary_parts: list[str] = []
        doc = await _doc_by_master_id(entry["master_company_id"])
        if doc:
            if doc.get("sector"):
                secondary_parts.append(doc["sector"])
            if doc.get("region"):
                secondary_parts.append(doc["region"])
        out.append(
            {
                "type": "company",
                "id": entry.get("cif") or entry["master_company_id"],
                "display_name": entry.get("legal_name") or "(Sin nombre)",
                "secondary_label": " · ".join(secondary_parts) or None,
                "icon": "building",
                "added_at": entry.get("saved_at"),
                "visibility": entry.get("visibility", "private"),
            }
        )
    return out


async def toggle_watchlist(
    *, user_id: str, org_id: str | None, cif: str,
    adapter: EnrichCompanyAdapter | None = None,
) -> tuple[bool, WatchlistVisibility | None]:
    if not org_id:
        raise BadRequestError("organization_required", code="organization_required")
    company = await get_enriched_by_cif(cif, adapter=adapter)
    db = get_db()
    existing = await _get_watchlist_entry(
        org_id=org_id, master_id=company.master_company_id
    )
    if existing:
        await db.company_watchlists.delete_one(
            {
                "org_id": org_id,
                "master_company_id": company.master_company_id,
            }
        )
        log.info(
            "companies.watchlist.removed",
            user_id=user_id, org_id=org_id, master_id=company.master_company_id,
        )
        return (False, None)
    record = CompanyWatchlistEntry(
        org_id=org_id,
        master_company_id=company.master_company_id,
        cif=company.cif,
        legal_name=company.legal_name,
        saved_by=user_id,
        visibility="private",
    )
    await db.company_watchlists.insert_one(record.model_dump(mode="json"))
    log.info(
        "companies.watchlist.saved",
        user_id=user_id, org_id=org_id, master_id=company.master_company_id,
    )
    return (True, "private")


async def toggle_share(
    *, user_id: str, org_id: str | None, cif: str,
    adapter: EnrichCompanyAdapter | None = None,
) -> WatchlistVisibility:
    if not org_id:
        raise BadRequestError("organization_required", code="organization_required")
    company = await get_enriched_by_cif(cif, adapter=adapter)
    db = get_db()
    existing = await _get_watchlist_entry(
        org_id=org_id, master_id=company.master_company_id
    )
    if not existing:
        raise NotFoundError("watchlist_entry_not_found", code="watchlist_entry_not_found")
    if existing.get("saved_by") != user_id:
        raise ForbiddenError("only_owner_can_share", code="only_owner_can_share")
    new_visibility: WatchlistVisibility = (
        "team" if existing.get("visibility") != "team" else "private"
    )
    await db.company_watchlists.update_one(
        {"org_id": org_id, "master_company_id": company.master_company_id},
        {"$set": {"visibility": new_visibility}},
    )
    log.info(
        "companies.watchlist.shared",
        user_id=user_id, org_id=org_id, master_id=company.master_company_id,
        visibility=new_visibility,
    )
    return new_visibility


__all__ = [
    "ADAPTER_MODE",
    "ANALYSIS_REFRESH_COOLDOWN_S",
    "RateLimitedError",
    "build_comparables",
    "build_financials_metrics",
    "build_hero",
    "build_identity",
    "build_kpi_metrics",
    "build_narrative",
    "build_score_placeholder",
    "build_valuation",
    "get_canonical_cif_for_master_id",
    "get_company_detail",
    "get_conversation",
    "get_enriched_by_cif",
    "get_or_create_conversation",
    "list_user_watchlist",
    "refresh_analysis",
    "refresh_comparables",
    "refresh_valuation",
    "send_message",
    "toggle_share",
    "toggle_watchlist",
]
