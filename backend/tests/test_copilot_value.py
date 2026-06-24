"""Tests for Copilot Value Skill.

Scope SIMPLIFIED (E1.4): central = revenue * 1.5, range = [0.75x, 1.30x],
workspace = HeroBlock + ValuationBlock + NarrativeBlock.
"""
import pytest

from src.modules.copilot.llm.factory import set_override as set_llm_override
from src.modules.copilot.llm.mock_provider import MockLLMProvider

pytestmark = pytest.mark.anyio


SEED = [
    {
        "master_company_id": "mc_kitchen",
        "legal_name": "Kitchen Studio, S.L.",
        "cif": "B-86 540 112",
        "sector": "Tecnología y software",
        "region": "Madrid",
        "country": "ES",
        "financials": {
            "revenue": 5_400_000,
            "ebitda": 1_100_000,
            "employees": 32,
            "fiscal_year": 2024,
        },
        "confidence": 0.9,
        "lineage": "normalized",
    },
    {
        "master_company_id": "mc_empty",
        "legal_name": "Empresa Sin Ingresos, S.L.",
        "cif": "B12345678",
        "sector": "Servicios profesionales",
    },
]


@pytest.fixture
def mock_llm():
    mp = MockLLMProvider()
    set_llm_override(mp)
    yield mp
    set_llm_override(None)


async def _seed(mock_db) -> None:
    await mock_db.master_companies_mock.insert_many([dict(c) for c in SEED])


async def test_value_happy_path_returns_three_blocks(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        "La valoración indicativa de Kitchen Studio se sitúa en un rango razonable. "
        "Cuando REQ-004 esté disponible se aplicarán comparables sectoriales."
    )
    r = await client.post(
        "/api/copilot/skills/value",
        json={"query": "valora Kitchen Studio", "context": {"locale": "es"}},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert r.headers.get("X-Source") == "mock"
    ws = body["workspace"]
    assert ws["intent"] == "value"
    types = [b["type"] for b in ws["blocks"]]
    assert types == ["hero", "valuation", "narrative"]

    # Valuation arithmetic check.
    val = ws["blocks"][1]["props"]
    assert val["company_name"] == "Kitchen Studio, S.L."
    assert val["method"] == "revenue_multiple"
    assert val["multiple_value"] == 1.5
    assert val["central_value"] == round(5_400_000 * 1.5, 2)
    assert val["low_value"] == round(5_400_000 * 1.5 * 0.75, 2)
    assert val["high_value"] == round(5_400_000 * 1.5 * 1.30, 2)
    assert val["currency"] == "EUR"
    # Disclaimer present and Spanish.
    assert "indicativa" in val["disclaimer"].lower()

    # Narrative non-empty.
    narr = ws["blocks"][2]["props"]
    assert narr["summary"]


async def test_value_company_without_revenue_returns_empty_state(mock_db, client, mock_llm):
    await _seed(mock_db)
    r = await client.post(
        "/api/copilot/skills/value",
        json={"query": "valora Empresa Sin Ingresos", "context": {"locale": "es"}},
    )
    assert r.status_code == 200
    blocks = r.json()["workspace"]["blocks"]
    assert blocks[0]["type"] == "empty_state"
    assert "ingresos" in blocks[0]["props"]["title"].lower()


async def test_value_company_not_found_returns_empty_state(mock_db, client, mock_llm):
    r = await client.post(
        "/api/copilot/skills/value",
        json={"query": "valora ZorgInexistente", "context": {"locale": "es"}},
    )
    assert r.status_code == 200
    blocks = r.json()["workspace"]["blocks"]
    assert blocks[0]["type"] == "empty_state"


async def test_value_empty_query_returns_422(client, mock_llm):
    r = await client.post(
        "/api/copilot/skills/value",
        json={"query": "", "context": {"locale": "es"}},
    )
    assert r.status_code == 422


async def test_value_strips_cuanto_vale_prefix(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default("Texto narrativo de prueba.")
    r = await client.post(
        "/api/copilot/skills/value",
        json={"query": "cuanto vale Kitchen Studio", "context": {"locale": "es"}},
    )
    assert r.status_code == 200
    ws = r.json()["workspace"]
    types = [b["type"] for b in ws["blocks"]]
    assert types == ["hero", "valuation", "narrative"]


async def test_value_llm_failure_falls_back_to_template_narrative(mock_db, client, mock_llm):
    await _seed(mock_db)
    from src.modules.copilot.llm.provider import LLMUpstreamError

    def handler(_msgs, _sys, _fmt):
        raise LLMUpstreamError("simulated")

    mock_llm.register(handler)
    r = await client.post(
        "/api/copilot/skills/value",
        json={"query": "valora Kitchen Studio", "context": {"locale": "es"}},
    )
    assert r.status_code == 200
    narr = r.json()["workspace"]["blocks"][2]["props"]
    # Fallback template mentions REQ-004 explicitly.
    assert "REQ-004" in narr["summary"]


async def test_value_returns_x_source_mock_header(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default("ok")
    r = await client.post(
        "/api/copilot/skills/value",
        json={"query": "valora Kitchen Studio", "context": {"locale": "es"}},
    )
    assert r.headers.get("X-Source") == "mock"
