"""Tests for Copilot Analyze Skill.

CRITICAL: never hits Claude. We inject a MockLLMProvider via the factory
override so the assertions are deterministic and consume zero tokens.
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
        "master_company_id": "mc_munoz",
        "legal_name": "Muñoz Comunicación, S.L.",
        "cif": "B85412003",
        "sector": "Marketing y publicidad",
        "region": "Madrid",
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


async def test_analyze_happy_path_returns_full_workspace(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        {
            "summary": "Empresa tecnológica con margen sólido y plantilla compacta.",
            "key_points": ["Margen EBITDA 20%", "Sede en Madrid", "Plantilla 32"],
            "risks": ["Concentración geográfica", "Dependencia de clientes clave"],
            "opportunities": ["Internacionalización", "Cross-selling"],
        }
    )
    r = await client.post(
        "/api/copilot/skills/analyze",
        json={"query": "analiza Kitchen Studio", "context": {"locale": "es"}},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert r.headers.get("X-Source") == "mock"
    assert body["source"] == "mock"
    ws = body["workspace"]
    assert ws["intent"] == "analyze"
    types = [b["type"] for b in ws["blocks"]]
    assert types == ["hero", "metrics", "company_card", "narrative"]
    # Hero
    hero = ws["blocks"][0]["props"]
    assert hero["title"] == "Kitchen Studio, S.L."
    # Metrics
    metrics = ws["blocks"][1]["props"]
    labels = [it["label"] for it in metrics["items"]]
    assert "Ingresos" in labels
    assert "EBITDA" in labels
    # CompanyCard
    card = ws["blocks"][2]["props"]
    assert card["master_company_id"] == "mc_kitchen"
    assert card["revenue"] == 5_400_000
    # Narrative
    narr = ws["blocks"][3]["props"]
    assert "tecnológica" in narr["summary"]
    assert len(narr["key_points"]) >= 1
    assert len(narr["risks"]) >= 1
    assert len(narr["opportunities"]) >= 1


async def test_analyze_empty_query_returns_422(client, mock_llm):
    r = await client.post(
        "/api/copilot/skills/analyze",
        json={"query": "", "context": {"locale": "es"}},
    )
    assert r.status_code == 422


async def test_analyze_company_not_found_returns_empty_state(mock_db, client, mock_llm):
    r = await client.post(
        "/api/copilot/skills/analyze",
        json={"query": "analiza Zorglubina XYZ", "context": {"locale": "es"}},
    )
    assert r.status_code == 200
    blocks = r.json()["workspace"]["blocks"]
    assert blocks[0]["type"] == "empty_state"
    assert "Zorglubina" in blocks[0]["props"]["title"]


async def test_analyze_strips_verb_prefix(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        {"summary": "x", "key_points": ["a"], "risks": ["b"], "opportunities": ["c"]}
    )
    # Different verb forms
    for query in ["analiza Kitchen Studio", "analizar Kitchen Studio", "ficha de Kitchen Studio"]:
        r = await client.post(
            "/api/copilot/skills/analyze",
            json={"query": query, "context": {"locale": "es"}},
        )
        assert r.status_code == 200, r.text
        body = r.json()["workspace"]["blocks"]
        if body[0]["type"] == "empty_state":
            pytest.fail(f"query '{query}' did not resolve to Kitchen Studio")
        assert body[0]["props"]["title"] == "Kitchen Studio, S.L."


async def test_analyze_accent_insensitive_match(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        {"summary": "x", "key_points": ["a"], "risks": ["b"], "opportunities": ["c"]}
    )
    r = await client.post(
        "/api/copilot/skills/analyze",
        json={"query": "analiza munoz", "context": {"locale": "es"}},
    )
    assert r.status_code == 200
    ws = r.json()["workspace"]
    assert ws["blocks"][0]["type"] == "hero"
    assert ws["blocks"][0]["props"]["title"] == "Muñoz Comunicación, S.L."


async def test_analyze_llm_failure_returns_fallback_narrative(mock_db, client, mock_llm):
    await _seed(mock_db)

    # Set the mock to always raise an LLMTimeoutError.
    from src.modules.copilot.llm.provider import LLMTimeoutError

    def handler(_msgs, _sys, _fmt):
        raise LLMTimeoutError("simulated")

    mock_llm.register(handler)

    r = await client.post(
        "/api/copilot/skills/analyze",
        json={"query": "analiza Kitchen Studio", "context": {"locale": "es"}},
    )
    assert r.status_code == 200, r.text
    ws = r.json()["workspace"]
    # Still emits a full workspace, just with the fallback narrative.
    types = [b["type"] for b in ws["blocks"]]
    assert types == ["hero", "metrics", "company_card", "narrative"]
    narr = ws["blocks"][-1]["props"]
    assert narr["summary"]  # not empty


async def test_analyze_llm_retries_on_invalid_json(mock_db, client, mock_llm):
    await _seed(mock_db)
    from src.modules.copilot.llm.provider import LLMInvalidJSONError

    calls = {"n": 0}

    def handler(_msgs, _sys, fmt):
        calls["n"] += 1
        if calls["n"] == 1:
            raise LLMInvalidJSONError("garbage first time")
        return {
            "summary": "recuperado en el segundo intento",
            "key_points": ["ok"],
            "risks": ["r"],
            "opportunities": ["o"],
        }

    mock_llm.register(handler)
    r = await client.post(
        "/api/copilot/skills/analyze",
        json={"query": "analiza Kitchen Studio", "context": {"locale": "es"}},
    )
    assert r.status_code == 200
    body = r.json()["workspace"]["blocks"][-1]["props"]
    assert "segundo intento" in body["summary"]
    assert calls["n"] == 2


async def test_analyze_locale_en_returns_english_copy(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        {"summary": "Tech company.", "key_points": ["x"], "risks": ["y"], "opportunities": ["z"]}
    )
    r = await client.post(
        "/api/copilot/skills/analyze",
        json={"query": "analyze Kitchen Studio", "context": {"locale": "en"}},
    )
    assert r.status_code == 200
    hero = r.json()["workspace"]["blocks"][0]["props"]
    assert hero["eyebrow"] == "Company analysis"


async def test_analyze_returns_x_source_mock_header(mock_db, client, mock_llm):
    await _seed(mock_db)
    mock_llm.set_default(
        {"summary": "x", "key_points": ["a"], "risks": ["b"], "opportunities": ["c"]}
    )
    r = await client.post(
        "/api/copilot/skills/analyze",
        json={"query": "analiza Kitchen Studio", "context": {"locale": "es"}},
    )
    assert r.headers.get("X-Source") == "mock"
