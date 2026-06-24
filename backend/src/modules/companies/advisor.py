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
"""
from __future__ import annotations

import json
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from src.core.logging import get_logger
from src.modules.agency_tool_adapter.models import EnrichedCompany
from src.modules.companies.models import (
    SectionId,
    SectionUpdate,
    SuggestedAction,
)
from src.modules.copilot.llm import LLMProvider
from src.modules.copilot.llm.provider import (
    LLMInvalidJSONError,
    LLMTimeoutError,
    LLMUpstreamError,
)
from src.modules.copilot.models import BlockSpec

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
        "Reglas:\n"
        "- Si algo no está en la ficha, di explícitamente \"no disponible en la ficha\".\n"
        "- Cita los módulos/fuentes de la ficha que utilizas.\n"
        "- NO inventes datos.\n"
        "- El chat NO genera bloques sueltos. Solo refresca secciones existentes.\n\n"
        "Devuelve SIEMPRE JSON ESTRICTO con esta estructura:\n"
        "{\n"
        f"  \"response_text\": \"respuesta conversacional al usuario, <= {MAX_RESPONSE_WORDS} palabras\",\n"
        "  \"section_updates\": [\n"
        "    {\"section\": \"narrative\" | \"valuation\" | \"comparables\" | \"metrics\" | \"signals\" | \"identity\",\n"
        "     \"block\": <block object con la estructura existente del block correspondiente>}\n"
        "  ],\n"
        "  \"suggested_actions\": [\"activate_opportunity\", \"request_valuation\", \"view_finances\", \"save_to_watchlist\", \"share_with_team\"]\n"
        "}\n\n"
        "NO devuelvas texto fuera del JSON. NO uses backticks ni markdown.\n"
        "Si la pregunta no requiere refrescar una sección, devuelve section_updates = []."
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
        "Rules: if something is not in the ficha, say \"not available in the ficha\". "
        "Do NOT invent data. The chat does NOT produce stand-alone blocks; it only "
        "refreshes existing sections.\n\n"
        "Return STRICT JSON:\n"
        "{\n"
        "  \"response_text\": \"<= 150 words conversational reply\",\n"
        "  \"section_updates\": [{\"section\": \"...\", \"block\": <block object>}],\n"
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
    LLM error: degraded reply with no updates is returned instead)."""
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
        return AdvisorResponse.model_validate(raw)
    except ValidationError as exc:
        log.warning("[LLM] advisor response failed validation",
                    errors=str(exc)[:500], raw=str(raw)[:500])
        # Last resort: take whatever text we got and degrade gracefully.
        text = raw.get("response_text") if isinstance(raw.get("response_text"), str) else None
        return _degraded(company, locale, text=text)


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
__all__ = ["AdvisorResponse", "invoke_company_advisor", "MAX_HISTORY_TURNS"]


def _silence_unused(*_args: Any) -> None:  # pragma: no cover
    _ = (BlockSpec, SectionId, SectionUpdate, SuggestedAction)
