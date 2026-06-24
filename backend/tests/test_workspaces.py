"""Tests for the Workspaces module (E1.5).

Covered:
  - POST /api/workspaces autenticado crea workspace + persiste messages + blocks.
  - POST sin sesión → 401.
  - GET /api/workspaces filtra por org activa y oculta archived por defecto.
  - GET /{id}: created_by accede; otro user con visibility=team de la misma org
    accede; otro user con visibility=private NO accede (403).
  - POST /{id}/messages extiende el mismo workspace (no crea otro) y dispatcha
    la skill correcta según el verbo de la query.
  - POST /{id}/share toggle private ↔ team; solo created_by puede llamarlo.
  - DELETE /{id} → state=archived; ya no aparece en GET / con defaults.
  - PATCH /{id} actualiza title.
  - Cross-org: workspace creado en org A no aparece en GET / cuando user pasa
    `X-Active-Org` de la org B.
"""
import pytest
import pytest_asyncio

from src.modules.copilot.llm.factory import set_override as set_llm_override
from src.modules.copilot.llm.mock_provider import MockLLMProvider

pytestmark = pytest.mark.anyio


# A non-trivial mock so analyze returns a full workspace (Hero + Metrics + Card + Narrative).
_ANALYZE_RESPONSE = {
    "summary": "Empresa de software con margen sólido.",
    "key_points": ["Margen 20%", "Plantilla 32"],
    "risks": ["Concentración geográfica"],
    "opportunities": ["Internacionalización"],
}

SEED_COMPANY = {
    "master_company_id": "mc_kitchen",
    "legal_name": "Kitchen Studio, S.L.",
    "cif": "B86540112",
    "sector": "Software",
    "region": "Madrid",
    "country": "ES",
    "financials": {
        "revenue": 5_400_000,
        "ebitda": 1_080_000,
        "employees": 32,
        "fiscal_year": 2024,
    },
    "confidence": 0.9,
    "lineage": "normalized",
}


@pytest_asyncio.fixture
async def mock_llm():
    mp = MockLLMProvider()
    set_llm_override(mp)
    yield mp
    set_llm_override(None)


@pytest_asyncio.fixture
async def alice_in_org(client, mock_db):
    """Alice: registered user with one active membership in org_alpha."""
    r = await client.post(
        "/api/auth/register",
        json={"email": "alice-ws@arrobatest.com", "password": "Secret123!", "full_name": "Alice"},
    )
    assert r.status_code == 201, r.text
    me = (await client.get("/api/auth/me")).json()
    user_id = me["user"]["user_id"]
    org = (
        await client.post(
            "/api/organizations",
            json={"legal_name": "Org Alpha", "tax_id": "B11000001"},
        )
    ).json()
    return {"user_id": user_id, "org_id": org["org"]["org_id"], "client": client}


async def _login_as(client, email: str, password: str) -> dict:
    r = await client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": email.split("@")[0]},
    )
    if r.status_code == 409:
        r = await client.post(
            "/api/auth/login", json={"email": email, "password": password}
        )
    assert r.status_code in (200, 201), r.text
    me = (await client.get("/api/auth/me")).json()
    return {"user_id": me["user"]["user_id"]}


async def _make_user_and_join_org(
    client, mock_db, email: str, org_id: str
) -> dict:
    """Create a fresh user and write a membership row directly (bypasses the
    invitation flow which would require email matching)."""
    from datetime import UTC, datetime

    r = await client.post(
        "/api/auth/register",
        json={"email": email, "password": "Secret123!", "full_name": email.split("@")[0]},
    )
    assert r.status_code == 201, r.text
    me = (await client.get("/api/auth/me")).json()
    user_id = me["user"]["user_id"]
    membership_doc = {
        "membership_id": f"mem_{user_id}_{org_id}",
        "user_id": user_id,
        "org_id": org_id,
        "role_in_org": "operator",
        "status": "active",
        "accepted_at": datetime.now(UTC),
        "created_at": datetime.now(UTC),
    }
    await mock_db.memberships.insert_one(membership_doc)
    return {"user_id": user_id}


def _ephemeral_state_basic():
    return {
        "ephemeral_state": {
            "messages": [
                {"role": "user", "content": "analiza Kitchen Studio", "intent": "analyze"},
                {"role": "assistant", "content": "He preparado el análisis.", "intent": "analyze"},
            ],
            "blocks": [
                {"id": "blk_h1", "type": "hero", "props": {"title": "Kitchen Studio, S.L.", "tone": "info"}},
                {"id": "blk_m1", "type": "metrics", "props": {"items": [{"label": "Ingresos", "value": "5.4M €"}]}},
            ],
        },
        "workspace_type": "analyze",
    }


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------
async def test_create_workspace_requires_auth(client):
    r = await client.post("/api/workspaces", json=_ephemeral_state_basic())
    assert r.status_code == 401


async def test_create_workspace_persists_messages_and_blocks(alice_in_org):
    c = alice_in_org["client"]
    r = await c.post("/api/workspaces", json=_ephemeral_state_basic())
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["workspace_id"].startswith("wsp_")
    assert body["url"].endswith(body["workspace_id"])
    assert body["url"].startswith("/es/w/")
    assert body["visibility"] == "private"
    assert body["workspace_type"] == "analyze"
    # Title was auto-derived from "analiza Kitchen Studio" → "Kitchen Studio".
    assert "Kitchen Studio" in body["title"]


async def test_create_workspace_uses_x_active_org_header(alice_in_org, client, mock_db):
    """Without X-Active-Org we default to the first membership; with it we
    must validate membership before persisting."""
    c = alice_in_org["client"]
    # Create a second org for Alice.
    r = await c.post(
        "/api/organizations", json={"legal_name": "Org Beta", "tax_id": "B22000002"}
    )
    org_beta = r.json()["org"]["org_id"]
    r = await c.post(
        "/api/workspaces",
        json=_ephemeral_state_basic(),
        headers={"X-Active-Org": org_beta},
    )
    assert r.status_code == 201, r.text
    wsid = r.json()["workspace_id"]
    # Persisted under the Beta org → not visible from Alpha context.
    detail = await c.get(f"/api/workspaces/{wsid}")
    assert detail.status_code == 200
    assert detail.json()["workspace"]["organization_id"] == org_beta


# ---------------------------------------------------------------------------
# LIST
# ---------------------------------------------------------------------------
async def test_list_workspaces_filters_by_active_org(alice_in_org, mock_db):
    c = alice_in_org["client"]
    r = await c.post(
        "/api/organizations", json={"legal_name": "Org Beta List", "tax_id": "B22000099"}
    )
    org_beta = r.json()["org"]["org_id"]
    # 1 workspace en alpha, 1 en beta.
    await c.post("/api/workspaces", json=_ephemeral_state_basic())
    await c.post(
        "/api/workspaces",
        json=_ephemeral_state_basic(),
        headers={"X-Active-Org": org_beta},
    )
    listing = (await c.get("/api/workspaces")).json()
    assert listing["total"] == 1, listing  # default = alpha (first membership)
    listing_beta = (
        await c.get("/api/workspaces", headers={"X-Active-Org": org_beta})
    ).json()
    assert listing_beta["total"] == 1
    # The two are not the same workspace.
    assert listing["items"][0]["workspace_id"] != listing_beta["items"][0]["workspace_id"]


async def test_archived_workspaces_hidden_by_default(alice_in_org):
    c = alice_in_org["client"]
    r = await c.post("/api/workspaces", json=_ephemeral_state_basic())
    wsid = r.json()["workspace_id"]
    await c.delete(f"/api/workspaces/{wsid}")
    listing = (await c.get("/api/workspaces")).json()
    assert listing["total"] == 0
    listing_arch = (await c.get("/api/workspaces?state=archived")).json()
    assert listing_arch["total"] == 1


# ---------------------------------------------------------------------------
# READ (visibility)
# ---------------------------------------------------------------------------
async def test_owner_reads_private_workspace(alice_in_org):
    c = alice_in_org["client"]
    r = await c.post("/api/workspaces", json=_ephemeral_state_basic())
    wsid = r.json()["workspace_id"]
    detail = await c.get(f"/api/workspaces/{wsid}")
    assert detail.status_code == 200
    body = detail.json()
    assert body["workspace"]["workspace_id"] == wsid
    assert len(body["messages"]) == 2
    assert len(body["blocks"]) == 2


async def test_other_member_blocked_when_private(alice_in_org, mock_db, client):
    # Alice creates a private workspace.
    c_alice = alice_in_org["client"]
    org_id = alice_in_org["org_id"]
    wsid = (await c_alice.post("/api/workspaces", json=_ephemeral_state_basic())).json()["workspace_id"]
    # Bob joins the same org via direct membership insert (test helper).
    # Bob needs a separate cookie jar — we get a fresh AsyncClient via the conftest factory.
    # mongomock-motor is shared so the membership row will be there.
    from httpx import ASGITransport, AsyncClient

    from src.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as bob_client:
        await _make_user_and_join_org(bob_client, mock_db, "bob-ws@arrobatest.com", org_id)
        r = await bob_client.get(f"/api/workspaces/{wsid}")
        assert r.status_code == 403


async def test_other_member_can_read_when_visibility_team(alice_in_org, mock_db):
    c_alice = alice_in_org["client"]
    org_id = alice_in_org["org_id"]
    wsid = (await c_alice.post("/api/workspaces", json=_ephemeral_state_basic())).json()["workspace_id"]
    # Alice shares it with the team.
    r = await c_alice.post(
        f"/api/workspaces/{wsid}/share", json={"visibility": "team"}
    )
    assert r.status_code == 200, r.text
    assert r.json()["visibility"] == "team"
    # Bob joins the org and now should see it.
    from httpx import ASGITransport, AsyncClient

    from src.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as bob_client:
        await _make_user_and_join_org(bob_client, mock_db, "bob2-ws@arrobatest.com", org_id)
        # GET detail
        r = await bob_client.get(f"/api/workspaces/{wsid}")
        assert r.status_code == 200, r.text
        # And it appears in his GET /workspaces.
        listing = (
            await bob_client.get("/api/workspaces", headers={"X-Active-Org": org_id})
        ).json()
        assert any(
            w["workspace_id"] == wsid for w in listing["items"]
        ), listing


# ---------------------------------------------------------------------------
# EXTEND
# ---------------------------------------------------------------------------
async def test_extend_workspace_appends_messages_and_blocks(alice_in_org, mock_db, mock_llm):
    c = alice_in_org["client"]
    await mock_db.master_companies_mock.insert_one(dict(SEED_COMPANY))
    mock_llm.set_default(_ANALYZE_RESPONSE)
    wsid = (await c.post("/api/workspaces", json=_ephemeral_state_basic())).json()["workspace_id"]
    r = await c.post(
        f"/api/workspaces/{wsid}/messages",
        json={"query": "analiza Kitchen Studio", "context": {"locale": "es"}},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["workspace_id"] == wsid
    assert body["intent"] == "analyze"
    assert body["message_user"]["role"] == "user"
    assert body["message_assistant"]["role"] == "assistant"
    assert len(body["blocks_added"]) >= 1
    # And it didn't create a new workspace.
    detail = (await c.get(f"/api/workspaces/{wsid}")).json()
    assert detail["workspace"]["workspace_id"] == wsid
    assert len(detail["messages"]) >= 4  # 2 initial + 2 new
    assert len(detail["blocks"]) >= len(body["blocks_added"]) + 2


async def test_extend_routes_search_for_plain_query(alice_in_org, mock_db, mock_llm):
    c = alice_in_org["client"]
    await mock_db.master_companies_mock.insert_one(dict(SEED_COMPANY))
    wsid = (await c.post("/api/workspaces", json=_ephemeral_state_basic())).json()["workspace_id"]
    r = await c.post(
        f"/api/workspaces/{wsid}/messages",
        json={"query": "software", "context": {"locale": "es"}},
    )
    assert r.status_code == 200
    assert r.json()["intent"] == "search"


async def test_extend_forbidden_for_non_owner(alice_in_org, mock_db, mock_llm):
    c_alice = alice_in_org["client"]
    org_id = alice_in_org["org_id"]
    wsid = (await c_alice.post("/api/workspaces", json=_ephemeral_state_basic())).json()["workspace_id"]
    await c_alice.post(f"/api/workspaces/{wsid}/share", json={"visibility": "team"})

    from httpx import ASGITransport, AsyncClient

    from src.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as bob_client:
        await _make_user_and_join_org(bob_client, mock_db, "bob3-ws@arrobatest.com", org_id)
        r = await bob_client.post(
            f"/api/workspaces/{wsid}/messages",
            json={"query": "software", "context": {"locale": "es"}},
        )
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# SHARE
# ---------------------------------------------------------------------------
async def test_share_toggle_private_team(alice_in_org):
    c = alice_in_org["client"]
    wsid = (await c.post("/api/workspaces", json=_ephemeral_state_basic())).json()["workspace_id"]
    r = await c.post(f"/api/workspaces/{wsid}/share", json={"visibility": "team"})
    assert r.status_code == 200
    assert r.json()["visibility"] == "team"
    r = await c.post(f"/api/workspaces/{wsid}/share", json={"visibility": "private"})
    assert r.status_code == 200
    assert r.json()["visibility"] == "private"


async def test_share_rejects_unsupported_visibility(alice_in_org):
    c = alice_in_org["client"]
    wsid = (await c.post("/api/workspaces", json=_ephemeral_state_basic())).json()["workspace_id"]
    r = await c.post(
        f"/api/workspaces/{wsid}/share", json={"visibility": "public"}
    )
    assert r.status_code == 422  # schema rejects "public" via Literal


# ---------------------------------------------------------------------------
# PATCH + ARCHIVE
# ---------------------------------------------------------------------------
async def test_patch_title(alice_in_org):
    c = alice_in_org["client"]
    wsid = (await c.post("/api/workspaces", json=_ephemeral_state_basic())).json()["workspace_id"]
    r = await c.patch(
        f"/api/workspaces/{wsid}", json={"title": "Mi análisis editado"}
    )
    assert r.status_code == 200
    assert r.json()["title"] == "Mi análisis editado"


async def test_archive_hides_from_default_listing(alice_in_org):
    c = alice_in_org["client"]
    wsid = (await c.post("/api/workspaces", json=_ephemeral_state_basic())).json()["workspace_id"]
    r = await c.delete(f"/api/workspaces/{wsid}")
    assert r.status_code == 200
    assert r.json()["state"] == "archived"
    listing = (await c.get("/api/workspaces")).json()
    assert listing["total"] == 0


# ---------------------------------------------------------------------------
# OPENAPI
# ---------------------------------------------------------------------------
async def test_openapi_exposes_workspace_endpoints(client):
    r = await client.get("/api/openapi.json")
    paths = r.json()["paths"]
    assert "/api/workspaces" in paths
    assert "post" in paths["/api/workspaces"]
    assert "get" in paths["/api/workspaces"]
    assert "/api/workspaces/{workspace_id}" in paths
    assert "/api/workspaces/{workspace_id}/messages" in paths
    assert "/api/workspaces/{workspace_id}/share" in paths
