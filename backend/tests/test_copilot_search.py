"""Tests for the Copilot Search Skill.

Covers:
- Happy path (≥3 results matched, scoring + ordering).
- Empty state (0 matches → EmptyStateBlock with contextual suggestions).
- Validation errors (422 on empty query, extra fields, oversized payload).
- Locale-aware copy (es vs en for the empty state title).
- X-Source response header is `mock`.
- Public endpoint — works without auth cookie.

The endpoint is `POST /api/copilot/skills/search` with body
`{"query": "...", "context": {...}}`.

HARDENING-REQ001b (2026-08-14): estos tests validan el PATH MOCK. Fuerzan
`agency_tool_mode=mock` vía fixture autouse porque el pod puede tener la
variable en `real` (Intel S2S) y el path real interceptaría antes de llegar
al mock. Mismo patrón que `test_platform_stats.py`.
"""
import pytest

pytestmark = pytest.mark.anyio


@pytest.fixture(autouse=True)
def _force_mock_mode(monkeypatch):
    """HARDENING-REQ001b · fuerza modo mock para que estos tests siempre
    ejecuten el path determinista del mock (independiente de `AGENCY_TOOL_MODE`
    del pod)."""
    from src.modules.intelligence_layer import config as _il_config
    _il_config.get_intelligence_settings.cache_clear()
    monkeypatch.setenv("AGENCY_TOOL_MODE", "mock")
    _il_config.get_intelligence_settings.cache_clear()
    yield
    _il_config.get_intelligence_settings.cache_clear()


SEED_COMPANIES = [
    {
        "master_company_id": "mc_kitchen",
        "legal_name": "Kitchen Studio, S.L.",
        "cif": "B-86 540 112",
        "sector": "Tecnología y software",
        "region": "Madrid",
    },
    {
        "master_company_id": "mc_olmedo",
        "legal_name": "Grupo Olmedo Hoteles, S.L.",
        "cif": "B-47 594 478",
        "sector": "Hoteles y turismo termal",
        "region": "Valladolid",
    },
    {
        "master_company_id": "mc_quickads",
        "legal_name": "Quickads Technologies, S.L.",
        "cif": "B-67 220 945",
        "sector": "Tecnología y software",
        "region": "Barcelona",
    },
    {
        "master_company_id": "mc_munoz",
        "legal_name": "Muñoz Comunicación, S.L.",
        "cif": "B-85 412 003",
        "sector": "Marketing y publicidad",
        "region": "Madrid",
    },
]


async def _seed(admin_client) -> None:
    for c in SEED_COMPANIES:
        r = await admin_client.post(
            "/api/admin/agency-tool/master-companies-mock", json=c
        )
        assert r.status_code in (201, 409), r.text


async def test_search_happy_path_returns_results_block(admin_client, client):
    await _seed(admin_client)
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "software", "context": {"locale": "es", "pathname": "/"}},
    )
    assert r.status_code == 200, r.text
    assert r.headers.get("X-Source") == "mock"
    body = r.json()
    assert body["source"] == "mock"
    assert body["query"] == "software"
    ws = body["workspace"]
    assert ws["intent"] == "search"
    assert len(ws["blocks"]) == 1
    block = ws["blocks"][0]
    assert block["type"] == "search_results"
    assert block["props"]["query"] == "software"
    assert block["props"]["total"] >= 2
    names = [r["name"] for r in block["props"]["results"]]
    assert any("Kitchen" in n or "Quickads" in n for n in names)
    # All items have score in [0,1]
    for item in block["props"]["results"]:
        assert 0.0 <= item["score"] <= 1.0


async def test_search_matches_by_cif_with_separators(admin_client, client):
    """A CIF with separators normalises to a clean CIF and resolves directly
    to the entity page (E1.5-REWORK: CIF queries always resolve)."""
    await _seed(admin_client)
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "B-47 594 478", "context": {"locale": "es", "pathname": "/"}},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["workspace"] is None
    assert body["entity_type"] == "company"
    assert body["navigate_to"] == "/empresa-f01/B47594478"


async def test_search_accent_insensitive(admin_client, client):
    """A 1-word concrete query (≥4 chars) that matches exactly one strong
    candidate after NFD normalisation resolves to the entity page
    (E1.5-REWORK)."""
    await _seed(admin_client)
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "munoz", "context": {"locale": "es", "pathname": "/"}},
    )
    assert r.status_code == 200
    body = r.json()
    # Muñoz Comunicación is the only strong match → resolve.
    assert body["navigate_to"] == "/empresa-f01/B85412003"
    assert body["workspace"] is None


async def test_search_empty_state_with_contextual_suggestions(client):
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "zzzzz_nope", "context": {"locale": "es", "pathname": "/analizar"}},
    )
    assert r.status_code == 200
    block = r.json()["workspace"]["blocks"][0]
    assert block["type"] == "empty_state"
    assert "zzzzz_nope" in block["props"]["title"]
    suggestions = block["props"]["suggestions"]
    assert isinstance(suggestions, list) and len(suggestions) >= 1


async def test_search_locale_en_returns_english_copy(client):
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "zzzzz_nope", "context": {"locale": "en", "pathname": "/"}},
    )
    block = r.json()["workspace"]["blocks"][0]
    assert block["type"] == "empty_state"
    assert "No matches" in block["props"]["title"]


async def test_search_invalid_empty_query(client):
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "", "context": {"locale": "es"}},
    )
    assert r.status_code == 422


async def test_search_invalid_extra_field(client):
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "test", "wat": "lol"},
    )
    assert r.status_code == 422


async def test_search_invalid_oversized_query(client):
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "x" * 500, "context": {"locale": "es"}},
    )
    assert r.status_code == 422


async def test_search_public_no_auth_required(client):
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "kitchen", "context": {"locale": "es"}},
    )
    # 200 even without any cookie set (public endpoint)
    assert r.status_code == 200


async def test_search_context_with_user_and_org_accepted(client):
    r = await client.post(
        "/api/copilot/skills/search",
        json={
            "query": "kitchen",
            "context": {
                "locale": "es",
                "pathname": "/organizaciones",
                "user_id": "user_x",
                "org_id": "org_y",
            },
        },
    )
    assert r.status_code == 200
