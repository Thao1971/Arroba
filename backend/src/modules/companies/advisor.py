"""Company Advisor — Copilot variant scoped to ONE company.

The advisor is invoked by `POST /api/companies/{cif}/messages`. It receives:
  - the company's enriched data (the ficha is the source of truth);
  - the conversation history (last N user/assistant turns);
  - the new user query.

It returns STRICT JSON with this shape (decoded into `AdvisorResponse`):

    {
      "response_text":   "<= 150 words conversational reply",
      "section_updates": [{"section": "narrative" | "valuation" | ...,
                           "block":   <BlockSpec object>}],
      "suggested_actions": ["activate_opportunity", ...]
    }

Rules:
  - The chat NEVER produces stand-alone blocks. Only `section_updates` that
    refresh the ficha. The dock just shows `response_text`.
  - Timeout 12s. 1 retry on invalid JSON. On second failure, return a
    degraded advisor response with a deterministic apology and no updates,
    so the page never goes blank.
  - In tests we inject `MockLLMProvider`. Zero real tokens by default.

Philosophy v3.0 §12 — "La ficha es la verdad":
  Whenever the user asks about risks, opportunities, summary, analysis,
  comparables or valuation of the company, the advisor MUST update the
  relevant section of the ficha. If the LLM forgets, the deterministic
  fallback below synthesises a `narrative` section_update from the
  `response_text` so the UI always reflects the new state.
"""
from __future__ import annotations

import json
import re
import unicodedata
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from src.core.logging import get_logger
from src.modules.agency_tool_adapter.models import EnrichedCompany
from src.modules.companies.models import (
    SectionId,
    SectionUpdate,
    SuggestedAction,
    new_block_id,
)
from src.modules.copilot.llm import LLMProvider
from src.modules.copilot.llm.provider import (
    LLMInvalidJSONError,
    LLMTimeoutError,
    LLMUpstreamError,
)
from src.modules.copilot.models import (
    BlockSpec,
    NarrativeBlock,
    NarrativeBlockProps,
)

log = get_logger("companies.advisor")

MAX_HISTORY_TURNS = 6  # last 6 messages (3 turns) passed to the LLM.
MAX_RESPONSE_WORDS = 150


# ---------------------------------------------------------------------------
# LLM response contract (Pydantic validates the JSON the LLM returns).
# ---------------------------------------------------------------------------
class AdvisorResponse(BaseModel):
    """The shape the LLM MUST return. Anything else → invalid JSON retry."""
    model_config = ConfigDict(extra="ignore")
    response_text: str = Field(min_length=1, max_length=2000)
    section_updates: list[SectionUpdate] = Field(default_factory=list)
    suggested_actions: list[str] = Field(default_factory=list, max_length=8)


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------
def _system_prompt_es(company: EnrichedCompany) -> str:
    f = company.financials
    data = {
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
    }
    data_json = json.dumps(data, ensure_ascii=False)
    return (
        f"Eres \"Company Advisor\", el agente de Arroba especializado EXCLUSIVAMENTE en {company.legal_name}.\n\n"
        f"Datos de la ficha (úsalos ÚNICAMENTE como fuente de verdad):\n{data_json}\n\n"
        "REGLA FUNDAMENTAL (filosofía v3.0 §12 «La ficha es la verdad»):\n"
        "- La conversación es una INTERFAZ. La ENTIDAD es el producto.\n"
        "- TÚ NUNCA generas bloques sueltos para el chat. SIEMPRE actualizas SECCIONES de la ficha.\n"
        "- Si el usuario pregunta sobre RIESGOS, OPORTUNIDADES, RESUMEN, ANÁLISIS, lectura del analista, "
        "fortalezas, debilidades, perspectiva, key points o cualquier valoración cualitativa de la "
        "empresa → DEBES emitir section_updates con section=\"narrative\" y un bloque tipo narrative "
        "completo (summary + key_points + risks + opportunities + citations).\n"
        "- Si el usuario pregunta «cuánto vale», «valor», «valoración», «múltiplo» → emite section_updates "
        "con section=\"valuation\".\n"
        "- Si el usuario pide «comparables», «similares», «parecidas», «competidores» → emite "
        "section_updates con section=\"comparables\".\n"
        "- Si la pregunta es puramente trivial (saludo, agradecimiento, off-topic) → section_updates=[].\n\n"
        "Reglas adicionales:\n"
        "- Si algo no está en la ficha, di explícitamente \"no disponible en la ficha\".\n"
        "- NO inventes datos. Cita las secciones que utilizas.\n"
        "- response_text es la RESPUESTA CONVERSACIONAL al dock (<= 150 palabras). Resume lo que "
        "acabas de actualizar en la ficha (\"He actualizado la sección Análisis con los riesgos...\").\n\n"
        "Estructura EXACTA del bloque narrative cuando emites section=\"narrative\":\n"
        "{\n"
        "  \"id\": \"blk_xxx\",  (opcional, lo generamos si no viene)\n"
        "  \"type\": \"narrative\",\n"
        "  \"props\": {\n"
        "    \"title\": \"Lectura del analista\",\n"
        "    \"summary\": \"<resumen 2-3 frases>\",\n"
        "    \"key_points\": [\"...\", \"...\"],\n"
        "    \"risks\": [\"...\", \"...\"],\n"
        "    \"opportunities\": [\"...\", \"...\"],\n"
        "    \"citations\": [\"ficha::financieros\", \"ficha::identidad\"]\n"
        "  }\n"
        "}\n\n"
        "Devuelve SIEMPRE JSON ESTRICTO con esta estructura:\n"
        "{\n"
        f"  \"response_text\": \"respuesta conversacional al usuario, <= {MAX_RESPONSE_WORDS} palabras\",\n"
        "  \"section_updates\": [\n"
        "    {\"section\": \"narrative\" | \"valuation\" | \"comparables\" | \"metrics\" | \"signals\" | \"identity\",\n"
        "     \"block\": <bloque con la estructura mostrada arriba>}\n"
        "  ],\n"
        "  \"suggested_actions\": [\"activate_opportunity\", \"request_valuation\", \"view_finances\", \"save_to_watchlist\", \"share_with_team\"]\n"
        "}\n\n"
        "NO devuelvas texto fuera del JSON. NO uses backticks ni markdown.\n"
    )


def _system_prompt_en(company: EnrichedCompany) -> str:
    # Mirror the ES prompt with English wording. The JSON contract is the same.
    f = company.financials
    data = {
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
    }
    data_json = json.dumps(data, ensure_ascii=False)
    return (
        f"You are \"Company Advisor\", Arroba's agent specialised EXCLUSIVELY in {company.legal_name}.\n\n"
        f"Ficha data (use ONLY as source of truth):\n{data_json}\n\n"
        "FUNDAMENTAL RULE (philosophy v3.0 §12 \"The ficha is the truth\"):\n"
        "- The conversation is an INTERFACE. The ENTITY is the product.\n"
        "- You NEVER generate stand-alone blocks for the chat. You ALWAYS update SECTIONS of the ficha.\n"
        "- If the user asks about RISKS, OPPORTUNITIES, SUMMARY, ANALYSIS, strengths, weaknesses, "
        "key points, outlook, qualitative read → you MUST emit section_updates with section=\"narrative\" "
        "and a complete narrative block (summary + key_points + risks + opportunities + citations).\n"
        "- If the user asks \"how much is it worth\", valuation, multiple → emit section=\"valuation\".\n"
        "- If the user asks for comparables, similar companies, competitors → emit section=\"comparables\".\n"
        "- If the question is trivial (greeting, thanks, off-topic) → section_updates=[].\n\n"
        "Additional rules: if something is not in the ficha, say \"not available in the ficha\". "
        "Do NOT invent data. response_text is the CONVERSATIONAL reply (<= 150 words).\n\n"
        "Return STRICT JSON:\n"
        "{\n"
        "  \"response_text\": \"<= 150 words conversational reply\",\n"
        "  \"section_updates\": [{\"section\": \"narrative\"|\"valuation\"|\"comparables\"|...,\n"
        "                        \"block\": {\"type\":\"narrative\",\"props\":{...}}}],\n"
        "  \"suggested_actions\": [\"...\"]\n"
        "}\n\n"
        "No backticks, no markdown."
    )


def _system_prompt(company: EnrichedCompany, locale: str) -> str:
    return _system_prompt_es(company) if locale != "en" else _system_prompt_en(company)


# ---------------------------------------------------------------------------
# Conversation transcript → LLM message list
# ---------------------------------------------------------------------------
def _build_messages(history: list[dict], query: str) -> list[dict]:
    """Last MAX_HISTORY_TURNS user/assistant messages + the new user query.

    `history` is the list of dicts coming from Mongo (CompanyConversationMessage
    serialised). System messages are excluded.
    """
    out: list[dict] = []
    for m in history[-MAX_HISTORY_TURNS:]:
        role = str(m.get("role") or "")
        content = str(m.get("content") or "")
        if role in ("user", "assistant") and content:
            out.append({"role": role, "content": content[:4000]})
    out.append({"role": "user", "content": query[:4000]})
    return out


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
async def invoke_company_advisor(
    *,
    llm: LLMProvider,
    company: EnrichedCompany,
    history: list[dict],
    query: str,
    locale: str = "es",
) -> AdvisorResponse:
    """Call the Company Advisor. Returns an AdvisorResponse (never raises on
    LLM error: degraded reply with no updates is returned instead).

    Post-processing (philosophy v3.0 §12):
      If the user's query clearly targets a section of the ficha (risks,
      opportunities, analysis, summary, …) but the LLM forgot to emit a
      `section_updates` entry, we synthesize one deterministically from
      `response_text` so the UI always reflects the new state.
    """
    sys = _system_prompt(company, locale)
    messages = _build_messages(history, query)

    raw: Any
    try:
        raw = await llm.complete(messages, system=sys, response_format="json")
    except LLMInvalidJSONError:
        log.warning("[LLM] advisor invalid JSON; retrying once",
                    company=company.master_company_id)
        try:
            raw = await llm.complete(messages, system=sys, response_format="json")
        except (LLMInvalidJSONError, LLMTimeoutError, LLMUpstreamError) as exc:
            log.error("[LLM] advisor retry failed", err=str(exc))
            return _degraded(company, locale)
    except (LLMTimeoutError, LLMUpstreamError) as exc:
        log.error("[LLM] advisor failed", err=str(exc))
        return _degraded(company, locale)

    # `raw` should already be a dict (LLMProvider.complete with response_format=json
    # returns the parsed payload). Validate it strictly.
    if not isinstance(raw, dict):
        log.warning("[LLM] advisor returned non-dict; degrading",
                    type=type(raw).__name__)
        return _degraded(company, locale)
    try:
        adv = AdvisorResponse.model_validate(raw)
    except ValidationError as exc:
        log.warning("[LLM] advisor response failed validation",
                    errors=str(exc)[:500], raw=str(raw)[:500])
        # Last resort: take whatever text we got and degrade gracefully.
        text = raw.get("response_text") if isinstance(raw.get("response_text"), str) else None
        adv = _degraded(company, locale, text=text)

    # Deterministic safety net — see _ensure_section_update_when_needed.
    adv = _ensure_section_update_when_needed(adv, query=query, company=company)
    return adv


def _degraded(
    company: EnrichedCompany, locale: str, *, text: str | None = None
) -> AdvisorResponse:
    """Deterministic degraded reply so the chat never goes blank."""
    if text and text.strip():
        return AdvisorResponse(
            response_text=text.strip()[:1500],
            section_updates=[],
            suggested_actions=[],
        )
    if locale == "en":
        msg = (
            f"I couldn't generate a full answer for {company.legal_name} just now. "
            "The data shown on the ficha is what we have. Please try again."
        )
    else:
        msg = (
            f"No he podido elaborar una respuesta completa sobre {company.legal_name} ahora. "
            "Los datos visibles en la ficha son los disponibles. Inténtalo de nuevo."
        )
    return AdvisorResponse(response_text=msg, section_updates=[], suggested_actions=[])


# Re-export so tests can target the model directly.
__all__ = [
    "AdvisorResponse",
    "invoke_company_advisor",
    "MAX_HISTORY_TURNS",
    "_ensure_section_update_when_needed",
    "_detect_section_intent",
]


# ---------------------------------------------------------------------------
# Deterministic safety net — philosophy v3.0 §12 ("La ficha es la verdad")
# ---------------------------------------------------------------------------
# Keywords (normalised, accent-stripped, lowercase) that map a user query to
# the section it MUST update. Order matters: we evaluate `comparables` and
# `valuation` BEFORE `narrative` because the latter is the broadest bucket
# and would otherwise swallow everything.
_KEYWORDS_BY_SECTION: dict[str, tuple[str, ...]] = {
    "comparables": (
        "comparable", "comparala", "comparalas", "comparar",
        "similar", "similares", "parecida", "parecidas",
        "competidor", "competidores", "competencia",
        "posicion de mercado",
    ),
    "valuation": (
        "valoracion", "valorala", "valorala", "vale ", "cuanto vale",
        "cuanto valdria", "valor de la empresa", "multiplo", "multiplos",
        "ebitda multiplo", "precio empresa",
    ),
    "narrative": (
        "riesgo", "riesgos",
        "oportunidad", "oportunidades",
        "resumen", "resumeme", "resume la",
        "analisis", "analiza", "analizala", "analizame",
        "lectura", "lectura del analista",
        "fortaleza", "fortalezas",
        "debilidad", "debilidades",
        "perspectiva", "outlook",
        "key point", "punto clave", "puntos clave",
        "que piensas", "que opinas", "que ves",
        "como esta", "como va", "como la ves",
        "habla", "hablame", "cuentame",
    ),
}


def _normalize_query(q: str) -> str:
    """Lowercase + strip diacritics + collapse whitespace."""
    text = unicodedata.normalize("NFD", q or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text.lower().strip())


def _detect_section_intent(query: str) -> SectionId | None:
    """Heuristic detector: which section MUST this query update, if any?

    Returns None for trivial/off-topic queries (greetings, thanks). Returns
    the most specific match otherwise.
    """
    q = _normalize_query(query)
    if not q:
        return None
    for section in ("comparables", "valuation", "narrative"):
        for kw in _KEYWORDS_BY_SECTION[section]:
            if kw in q:
                return section  # type: ignore[return-value]
    return None


def _synthesize_narrative_from_text(
    *, company: EnrichedCompany, response_text: str, query: str
) -> NarrativeBlock:
    """Build a NarrativeBlock from the LLM's free-form `response_text`.

    Heuristics:
      - if the text already has Markdown bullets (`- ` or `* `), use them
        as key_points;
      - if the user asked about risks → put bullets into `risks`;
      - if the user asked about opportunities → put bullets into `opportunities`;
      - otherwise put them into `key_points`.
    """
    text = response_text.strip()
    bullets = _extract_bullets(text)
    summary = _strip_bullets(text) or text[:500]
    qn = _normalize_query(query)
    risks: list[str] = []
    opps: list[str] = []
    key_points: list[str] = []
    if any(k in qn for k in ("riesgo", "riesgos")):
        risks = bullets
    elif any(k in qn for k in ("oportunidad", "oportunidades")):
        opps = bullets
    else:
        key_points = bullets
    return NarrativeBlock(
        id=new_block_id("narrative"),
        props=NarrativeBlockProps(
            title="Lectura del analista",
            summary=summary[:800] or f"Análisis de {company.legal_name} solicitado por el usuario.",
            key_points=key_points[:6],
            risks=risks[:6],
            opportunities=opps[:6],
            citations=["ficha::resumen", "ficha::financieros", "ficha::identidad"],
        ),
    )


def _extract_bullets(text: str) -> list[str]:
    """Pull `- foo` / `* foo` / `1. foo` bullets out of free-form text."""
    out: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        m = re.match(r"^(?:[-*•]|\d+\.)\s+(.+?)\s*$", line)
        if m:
            out.append(m.group(1).strip())
    return out


def _strip_bullets(text: str) -> str:
    lines = []
    for raw in text.splitlines():
        line = raw.strip()
        if re.match(r"^(?:[-*•]|\d+\.)\s+", line):
            continue
        if line:
            lines.append(line)
    return " ".join(lines).strip()


def _ensure_section_update_when_needed(
    adv: AdvisorResponse, *, query: str, company: EnrichedCompany
) -> AdvisorResponse:
    """If the user's query clearly targets a section (heuristic) AND the LLM
    didn't emit a corresponding section_update, synthesize one for the
    `narrative` section from `response_text`.

    We ONLY synthesize for `narrative` because:
      - it's the safest fallback (text-only block);
      - `comparables` and `valuation` have dedicated user-facing refresh
        buttons + skill endpoints, so missing those updates is recoverable;
      - the UI's `RefreshAnalysisButton` is rate-limited; the chat path is
        the natural way to keep `narrative` live.
    """
    intent = _detect_section_intent(query)
    if intent is None:
        return adv
    already = any(u.section == intent for u in adv.section_updates)
    if already:
        return adv
    if intent != "narrative":
        # Other sections require structured data the LLM should have produced.
        # Don't fake comparables/valuation cards from free text.
        log.info(
            "advisor.section_intent_unfulfilled",
            section=intent, master_id=company.master_company_id,
        )
        return adv
    block = _synthesize_narrative_from_text(
        company=company, response_text=adv.response_text, query=query
    )
    log.info(
        "advisor.section_update_synthesized",
        section="narrative", master_id=company.master_company_id,
    )
    return adv.model_copy(
        update={
            "section_updates": [
                *adv.section_updates,
                SectionUpdate(section="narrative", block=block),
            ]
        }
    )


def _silence_unused(*_args: Any) -> None:  # pragma: no cover
    _ = (BlockSpec, SectionId, SectionUpdate, SuggestedAction)
