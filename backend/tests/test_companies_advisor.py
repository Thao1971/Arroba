"""Tests for the Company Advisor — keyword router, deterministic fallback
and JSON contract validation.

These pin the philosophy v3.0 §12 invariants:
  - "Riesgos" / "Oportunidades" / "Análisis" → MUST emit a `narrative`
    section_update, even if the LLM forgets.
  - Trivial queries ("Hola") → 0 section_updates.
  - Comparables / valuation intents do NOT trigger synthesis (those have
    structured refresh endpoints).
"""
from __future__ import annotations

import pytest

from src.modules.agency_tool_adapter.models import (
    EnrichedCompany,
    Financials,
    Lineage,
)
from src.modules.companies.advisor import (
    AdvisorResponse,
    _detect_section_intent,
    _ensure_section_update_when_needed,
    invoke_company_advisor,
)
from src.modules.companies.models import SectionUpdate
from src.modules.copilot.llm.mock_provider import MockLLMProvider
from src.modules.copilot.models import NarrativeBlock, NarrativeBlockProps


def _make_company(name: str = "Kitchen Studio, S.L.") -> EnrichedCompany:
    return EnrichedCompany(
        master_company_id="mc_kitchen",
        legal_name=name,
        cif="B86540112",
        sector="Software",
        region="Madrid",
        country="ES",
        financials=Financials(
            revenue=2_400_000,
            ebitda=480_000,
            employees=32,
            fiscal_year=2024,
        ),
        confidence=0.92,
        lineage=Lineage.raw,
        source="mock",
    )


# ---------------------------------------------------------------------------
# _detect_section_intent
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "query,expected",
    [
        # narrative
        ("Háblame de los riesgos", "narrative"),
        ("¿Cuáles son las oportunidades?", "narrative"),
        ("Dame un resumen", "narrative"),
        ("Analiza la empresa", "narrative"),
        ("Cuéntame sus fortalezas y debilidades", "narrative"),
        ("Lectura del analista por favor", "narrative"),
        # comparables
        ("Compárala con NovaLedger", "comparables"),
        ("Empresas similares", "comparables"),
        ("¿Quiénes son sus competidores?", "comparables"),
        # valuation
        ("¿Cuánto vale?", "valuation"),
        ("Dame su valoración", "valuation"),
        ("Qué múltiplo aplica", "valuation"),
        # trivial
        ("Hola", None),
        ("Gracias", None),
        ("", None),
        # accent-insensitive
        ("habla de los analisis", "narrative"),
        ("HABLAME DE LOS RIESGOS", "narrative"),
    ],
)
def test_detect_section_intent(query: str, expected: str | None) -> None:
    assert _detect_section_intent(query) == expected


# ---------------------------------------------------------------------------
# _ensure_section_update_when_needed
# ---------------------------------------------------------------------------
def test_synthesizes_narrative_when_llm_omits_it() -> None:
    """User asks about risks but LLM didn't emit section_updates → we synthesize."""
    company = _make_company()
    adv = AdvisorResponse(
        response_text=(
            "Los principales riesgos de Kitchen Studio son:\n"
            "- Dependencia de talento clave por plantilla reducida.\n"
            "- Concentración geográfica en Madrid.\n"
            "- Volatilidad del sector software."
        ),
        section_updates=[],
        suggested_actions=[],
    )
    out = _ensure_section_update_when_needed(
        adv, query="Háblame de los riesgos", company=company
    )
    assert len(out.section_updates) == 1
    upd = out.section_updates[0]
    assert upd.section == "narrative"
    assert upd.block.type == "narrative"
    props = upd.block.props
    # Risks were extracted from bullets:
    assert len(props.risks) == 3
    assert any("talento" in r.lower() for r in props.risks)
    # Title is the canonical one:
    assert props.title == "Lectura del analista"


def test_synthesizes_opportunities_when_query_asks_for_them() -> None:
    company = _make_company()
    adv = AdvisorResponse(
        response_text=(
            "Oportunidades destacadas:\n"
            "- Expansión a Barcelona y Valencia.\n"
            "- Lanzamiento de módulo SaaS B2B."
        ),
        section_updates=[],
    )
    out = _ensure_section_update_when_needed(
        adv, query="¿Qué oportunidades ves?", company=company
    )
    assert len(out.section_updates) == 1
    props = out.section_updates[0].block.props
    assert len(props.opportunities) == 2
    assert props.risks == []
    assert props.key_points == []


def test_does_not_synthesize_for_trivial_query() -> None:
    company = _make_company()
    adv = AdvisorResponse(response_text="¡Hola! ¿En qué te ayudo?", section_updates=[])
    out = _ensure_section_update_when_needed(adv, query="Hola", company=company)
    assert out.section_updates == []


def test_does_not_synthesize_when_llm_already_emitted_section() -> None:
    """If the LLM ALREADY emitted a narrative update, we don't add a second one."""
    company = _make_company()
    existing_block = NarrativeBlock(
        id="blk_existing",
        props=NarrativeBlockProps(
            title="Lectura del analista",
            summary="LLM-generated.",
            key_points=["a", "b"],
            risks=[],
            opportunities=[],
            citations=[],
        ),
    )
    adv = AdvisorResponse(
        response_text="Risk summary.",
        section_updates=[SectionUpdate(section="narrative", block=existing_block)],
    )
    out = _ensure_section_update_when_needed(
        adv, query="Háblame de los riesgos", company=company
    )
    assert len(out.section_updates) == 1
    assert out.section_updates[0].block.id == "blk_existing"


def test_does_not_synthesize_for_comparables_or_valuation_intents() -> None:
    """For sections that need structured data (comparables/valuation), we
    don't fake them from free text — the UI has dedicated refresh buttons."""
    company = _make_company()
    adv = AdvisorResponse(
        response_text="Sus comparables son NovaLedger y otras.", section_updates=[]
    )
    out = _ensure_section_update_when_needed(
        adv, query="Compárala con NovaLedger", company=company
    )
    assert out.section_updates == []


# ---------------------------------------------------------------------------
# invoke_company_advisor with MockLLMProvider — full path
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_invoke_advisor_returns_section_update_on_mock_llm_emit() -> None:
    company = _make_company()
    payload = {
        "response_text": "Aquí están los riesgos.",
        "section_updates": [
            {
                "section": "narrative",
                "block": {
                    "id": "blk_mock_narr",
                    "type": "narrative",
                    "props": {
                        "title": "Lectura del analista",
                        "summary": "Mocked.",
                        "key_points": [],
                        "risks": ["risk1", "risk2"],
                        "opportunities": [],
                        "citations": ["ficha::financieros"],
                    },
                },
            }
        ],
        "suggested_actions": ["save_to_watchlist"],
    }
    llm = MockLLMProvider()
    llm.set_default(payload)
    adv = await invoke_company_advisor(
        llm=llm, company=company, history=[], query="Riesgos por favor"
    )
    assert len(adv.section_updates) == 1
    assert adv.section_updates[0].block.props.risks == ["risk1", "risk2"]
    assert adv.suggested_actions == ["save_to_watchlist"]


@pytest.mark.asyncio
async def test_invoke_advisor_synthesizes_when_mock_returns_empty() -> None:
    company = _make_company()
    llm = MockLLMProvider()
    llm.set_default({
        "response_text": "Riesgos:\n- Talento\n- Concentración",
        "section_updates": [],
        "suggested_actions": [],
    })
    adv = await invoke_company_advisor(
        llm=llm, company=company, history=[], query="Háblame de los riesgos"
    )
    assert len(adv.section_updates) == 1
    assert adv.section_updates[0].section == "narrative"
    assert len(adv.section_updates[0].block.props.risks) == 2
