"""Tests for Copilot Recommend Skill.

Three subtypes:
  - similar_to_company       ("compañías similares a Kitchen Studio")
  - opportunities_by_sector  ("oportunidades en software")
  - list_by_sector           ("empresas en alimentación")

The LLM classifier is mocked. We also assert the heuristic fallback works
when the LLM is unavailable.
"""
import pytest

from src.modules.copilot.llm.factory import set_override as set_llm_override
from src.modules.copilot.llm.mock_provider import MockLLMProvider

pytestmark = pytest.mark.anyio


SEED = [
    {
        "master_company_id": "mc_kitchen",
        "legal_name": "Kitchen Studio, S.L.",
        "cif": "B86540112",
        "sector": "Tecnología y software",
        "region": "Madrid",
    },
    {
        "master_company_id": "mc_quickads",
        "legal_name": "Quickads Technologies, S.L.",
        "cif": "B67220945",
        "sector": "Tecnología y software",
        "region": "Barcelona",
    },
    {
        "master_company_id": "mc_novaledger",
        "legal_name": "NovaLedger SaaS, S.L.",
        "cif": "B12340001",
        "sector": "Tecnología y software",
        "region": "Madrid",
    },
    {
        "master_company_id": "mc_olmedo",
        "legal_name": "Grupo Olmedo Hoteles, S.L.",
        "cif": "B47594478",
        "sector": "Hoteles y turismo",
        "region": "Valladolid",
    },
    {
        "master_company_id": "mc_conservas",
        "legal_name": "Conservas del Cantábrico, S.L.",
        "cif": "B12340002",
        "sector": "Alimentación",
        "region": "Cantabria",
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


async def test_recommend_similar_to_company(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        {
            "subtype": "similar_to_company",
            "company_name": "Kitchen Studio",
            "sector": None,
        }
    )
    r = await client.post(
        "/api/copilot/skills/recommend",
        json={
            "query": "empresas similares a Kitchen Studio",
            "context": {"locale": "es"},
        },
    )
    assert r.status_code == 200, r.text
    ws = r.json()["workspace"]
    types = [b["type"] for b in ws["blocks"]]
    assert types == ["hero", "company_cards_grid", "narrative"]
    grid = ws["blocks"][1]["props"]
    assert grid["subtype"] == "similar_to_company"
    ids = [it["master_company_id"] for it in grid["items"]]
    assert "mc_kitchen" not in ids  # exclude the reference itself
    assert "mc_quickads" in ids
    assert "mc_novaledger" in ids


async def test_recommend_opportunities_by_sector(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        {
            "subtype": "opportunities_by_sector",
            "company_name": None,
            "sector": "Tecnología y software",
        }
    )
    r = await client.post(
        "/api/copilot/skills/recommend",
        json={"query": "oportunidades en software", "context": {"locale": "es"}},
    )
    assert r.status_code == 200
    ws = r.json()["workspace"]
    grid = ws["blocks"][1]["props"]
    assert grid["subtype"] == "opportunities_by_sector"
    assert len(grid["items"]) >= 2


async def test_recommend_list_by_sector(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        {
            "subtype": "list_by_sector",
            "company_name": None,
            "sector": "Alimentación",
        }
    )
    r = await client.post(
        "/api/copilot/skills/recommend",
        json={"query": "empresas en alimentación", "context": {"locale": "es"}},
    )
    assert r.status_code == 200
    grid = r.json()["workspace"]["blocks"][1]["props"]
    assert grid["subtype"] == "list_by_sector"
    ids = [it["master_company_id"] for it in grid["items"]]
    assert "mc_conservas" in ids


async def test_recommend_unknown_company_returns_empty(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        {
            "subtype": "similar_to_company",
            "company_name": "ZorgInexistente",
            "sector": None,
        }
    )
    r = await client.post(
        "/api/copilot/skills/recommend",
        json={
            "query": "similares a ZorgInexistente",
            "context": {"locale": "es"},
        },
    )
    assert r.status_code == 200
    blocks = r.json()["workspace"]["blocks"]
    assert blocks[0]["type"] == "empty_state"


async def test_recommend_falls_back_to_heuristic_when_llm_fails(mock_db, client, mock_llm):
    await _seed(mock_db)
    from src.modules.copilot.llm.provider import LLMTimeoutError

    def handler(_msgs, _sys, _fmt):
        raise LLMTimeoutError("simulated")

    mock_llm.register(handler)
    r = await client.post(
        "/api/copilot/skills/recommend",
        json={
            "query": "empresas similares a Kitchen Studio",
            "context": {"locale": "es"},
        },
    )
    assert r.status_code == 200
    ws = r.json()["workspace"]
    # Heuristic detects "similares a" → similar_to_company subtype.
    grid = ws["blocks"][1]["props"]
    assert grid["subtype"] == "similar_to_company"


async def test_recommend_heuristic_intent_directly():
    """Sanity check on the heuristic resolver (no DB / LLM needed)."""
    from src.modules.copilot.skills.recommend import _heuristic_intent

    h = _heuristic_intent("empresas similares a Kitchen Studio")
    assert h["subtype"] == "similar_to_company"
    assert "kitchen studio" in (h["company_name"] or "").lower()

    h = _heuristic_intent("oportunidades en software")
    assert h["subtype"] == "opportunities_by_sector"
    assert "software" in (h["sector"] or "").lower()

    h = _heuristic_intent("empresas en alimentación")
    assert h["subtype"] == "list_by_sector"
    assert "alimentaci" in (h["sector"] or "").lower()


async def test_recommend_empty_query_returns_422(client, mock_llm):
    r = await client.post(
        "/api/copilot/skills/recommend",
        json={"query": "", "context": {"locale": "es"}},
    )
    assert r.status_code == 422


async def test_recommend_x_source_mock_header(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        {"subtype": "list_by_sector", "company_name": None, "sector": "software"}
    )
    r = await client.post(
        "/api/copilot/skills/recommend",
        json={"query": "empresas software", "context": {"locale": "es"}},
    )
    assert r.headers.get("X-Source") == "mock"
