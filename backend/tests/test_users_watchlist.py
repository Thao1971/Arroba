"""Tests para GET /api/users/me/watchlist (Sprint 1)."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

_OLMEDO = {
    "master_company_id": "mc_olmedo",
    "legal_name": "Grupo Olmedo Hoteles, S.L.",
    "cif": "B47820150",
    "sector": "Hoteles",
    "region": "Castilla y León",
    "country": "ES",
    "financials": {"revenue": 6_410_000, "ebitda": 1_858_900, "employees": 82, "fiscal_year": 2024},
    "confidence": 0.89,
    "lineage": "normalized",
}


async def _create_org_and_membership(mock_db, user_id: str) -> str:
    """Helper: crea una org y una membership activa para el user."""
    from datetime import UTC, datetime

    now = datetime.now(UTC)
    org_id = "org_test_watchlist"
    await mock_db.organizations.insert_one(
        {
            "org_id": org_id,
            "legal_name": "Test Org",
            "tax_id": "B99000001",
            "country": "ES",
            "created_at": now,
            "updated_at": now,
        }
    )
    await mock_db.memberships.insert_one(
        {
            "membership_id": f"mem_{user_id}_{org_id}",
            "user_id": user_id,
            "org_id": org_id,
            "role_in_org": "operator",
            "status": "active",
            "created_at": now,
            "accepted_at": now,
        }
    )
    return org_id


@pytest.mark.asyncio
async def test_watchlist_empty_by_default(client: AsyncClient, mock_db, alice) -> None:
    me = (await alice.get("/api/auth/me")).json()
    org_id = await _create_org_and_membership(mock_db, me["user"]["user_id"])

    r = await alice.get("/api/users/me/watchlist", headers={"X-Active-Org": org_id})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body == {"items": [], "total": 0}


@pytest.mark.asyncio
async def test_watchlist_returns_items_after_toggle(client: AsyncClient, mock_db, alice) -> None:
    await mock_db.master_companies_mock.insert_one(_OLMEDO)
    me = (await alice.get("/api/auth/me")).json()
    org_id = await _create_org_and_membership(mock_db, me["user"]["user_id"])

    # Toggle add
    r = await alice.post(
        "/api/companies/B47820150/watchlist",
        headers={"X-Active-Org": org_id},
    )
    assert r.status_code == 200, r.text
    assert r.json()["saved"] is True

    # Verificar watchlist
    r = await alice.get("/api/users/me/watchlist", headers={"X-Active-Org": org_id})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    item = body["items"][0]
    assert item["type"] == "company"
    assert item["id"] == "B47820150"
    assert item["display_name"] == "Grupo Olmedo Hoteles, S.L."
    assert item["icon"] == "building"
    assert "Hoteles" in (item["secondary_label"] or "")
    assert item["visibility"] == "private"


@pytest.mark.asyncio
async def test_watchlist_without_active_org_returns_empty(alice: AsyncClient) -> None:
    """Sin X-Active-Org el listado es vacío (no error)."""
    r = await alice.get("/api/users/me/watchlist")
    assert r.status_code == 200
    assert r.json() == {"items": [], "total": 0}


@pytest.mark.asyncio
async def test_watchlist_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/api/users/me/watchlist")
    assert r.status_code == 401
