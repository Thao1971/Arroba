"""Tests para /api/lists — listas guardadas / oportunidades manuales.

Mismo patrón que test_users_watchlist.py. Cubre: crear lista vacía, crear
lista con CIFs iniciales (== "Crear oportunidad desde selección" con
kind="opportunity"), listar, detalle, añadir/quitar items, renombrar, borrar,
CIF desconocido ignorado en vez de abortar, y que dos listas distintas
pueden contener la misma empresa a la vez (a diferencia de la watchlist).
"""
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

_ARTICA = {
    "master_company_id": "mc_artica",
    "legal_name": "Agencia SEO & Contenidos Ártica, S.L.",
    "cif": "B32132132",
    "sector": "Servicios B2B",
    "region": "Cataluña",
    "country": "ES",
    "financials": {"revenue": 980_000, "ebitda": 230_000, "employees": 12, "fiscal_year": 2024},
    "confidence": 0.9,
    "lineage": "normalized",
}


async def _create_org_and_membership(mock_db, user_id: str) -> str:
    from datetime import UTC, datetime

    now = datetime.now(UTC)
    org_id = "org_test_lists"
    await mock_db.organizations.insert_one(
        {"org_id": org_id, "legal_name": "Test Org", "tax_id": "B99000002",
         "country": "ES", "created_at": now, "updated_at": now}
    )
    await mock_db.memberships.insert_one(
        {"membership_id": f"mem_{user_id}_{org_id}", "user_id": user_id, "org_id": org_id,
         "role_in_org": "operator", "status": "active", "created_at": now, "accepted_at": now}
    )
    return org_id


@pytest.mark.asyncio
async def test_create_empty_list(client: AsyncClient, mock_db, alice) -> None:
    me = (await alice.get("/api/auth/me")).json()
    org_id = await _create_org_and_membership(mock_db, me["user"]["user_id"])

    r = await alice.post(
        "/api/lists", json={"name": "Objetivos Q1"}, headers={"X-Active-Org": org_id}
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["name"] == "Objetivos Q1"
    assert body["kind"] == "list"
    assert body["items"] == []


@pytest.mark.asyncio
async def test_create_opportunity_from_selection(client: AsyncClient, mock_db, alice) -> None:
    """'Crear oportunidad desde selección' = POST /api/lists con kind=opportunity
    y los CIFs seleccionados — mismo endpoint que guardar lista."""
    await mock_db.master_companies_mock.insert_one(_OLMEDO)
    await mock_db.master_companies_mock.insert_one(_ARTICA)
    me = (await alice.get("/api/auth/me")).json()
    org_id = await _create_org_and_membership(mock_db, me["user"]["user_id"])

    r = await alice.post(
        "/api/lists",
        json={"name": "Roll-up hoteles", "kind": "opportunity", "cifs": ["B47820150", "B32132132"]},
        headers={"X-Active-Org": org_id},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["kind"] == "opportunity"
    assert len(body["items"]) == 2
    cifs = {it["cif"] for it in body["items"]}
    assert cifs == {"B47820150", "B32132132"}


@pytest.mark.asyncio
async def test_unknown_cif_ignored_not_aborted(client: AsyncClient, mock_db, alice) -> None:
    await mock_db.master_companies_mock.insert_one(_OLMEDO)
    me = (await alice.get("/api/auth/me")).json()
    org_id = await _create_org_and_membership(mock_db, me["user"]["user_id"])

    r = await alice.post(
        "/api/lists",
        json={"name": "Mixta", "cifs": ["B47820150", "B00000000"]},
        headers={"X-Active-Org": org_id},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["cif"] == "B47820150"


@pytest.mark.asyncio
async def test_list_and_detail(client: AsyncClient, mock_db, alice) -> None:
    await mock_db.master_companies_mock.insert_one(_OLMEDO)
    me = (await alice.get("/api/auth/me")).json()
    org_id = await _create_org_and_membership(mock_db, me["user"]["user_id"])

    created = (await alice.post(
        "/api/lists", json={"name": "A", "cifs": ["B47820150"]}, headers={"X-Active-Org": org_id}
    )).json()

    r = await alice.get("/api/lists", headers={"X-Active-Org": org_id})
    assert r.status_code == 200
    summaries = r.json()["lists"]
    assert len(summaries) == 1
    assert summaries[0]["item_count"] == 1
    assert summaries[0]["list_id"] == created["list_id"]

    r = await alice.get(f"/api/lists/{created['list_id']}", headers={"X-Active-Org": org_id})
    assert r.status_code == 200
    assert r.json()["items"][0]["legal_name"] == "Grupo Olmedo Hoteles, S.L."


@pytest.mark.asyncio
async def test_add_and_remove_items(client: AsyncClient, mock_db, alice) -> None:
    await mock_db.master_companies_mock.insert_one(_OLMEDO)
    await mock_db.master_companies_mock.insert_one(_ARTICA)
    me = (await alice.get("/api/auth/me")).json()
    org_id = await _create_org_and_membership(mock_db, me["user"]["user_id"])

    created = (await alice.post(
        "/api/lists", json={"name": "A", "cifs": ["B47820150"]}, headers={"X-Active-Org": org_id}
    )).json()
    list_id = created["list_id"]

    r = await alice.post(
        f"/api/lists/{list_id}/items", json={"cifs": ["B32132132"]}, headers={"X-Active-Org": org_id}
    )
    assert r.status_code == 200
    assert len(r.json()["items"]) == 2

    r = await alice.delete(f"/api/lists/{list_id}/items/B47820150", headers={"X-Active-Org": org_id})
    assert r.status_code == 204

    r = await alice.get(f"/api/lists/{list_id}", headers={"X-Active-Org": org_id})
    assert len(r.json()["items"]) == 1
    assert r.json()["items"][0]["cif"] == "B32132132"


@pytest.mark.asyncio
async def test_rename_and_delete_list(client: AsyncClient, mock_db, alice) -> None:
    me = (await alice.get("/api/auth/me")).json()
    org_id = await _create_org_and_membership(mock_db, me["user"]["user_id"])

    created = (await alice.post(
        "/api/lists", json={"name": "Antes"}, headers={"X-Active-Org": org_id}
    )).json()
    list_id = created["list_id"]

    r = await alice.patch(
        f"/api/lists/{list_id}", json={"name": "Después"}, headers={"X-Active-Org": org_id}
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Después"

    r = await alice.delete(f"/api/lists/{list_id}", headers={"X-Active-Org": org_id})
    assert r.status_code == 204

    r = await alice.get(f"/api/lists/{list_id}", headers={"X-Active-Org": org_id})
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_same_company_in_two_lists_at_once(client: AsyncClient, mock_db, alice) -> None:
    """A diferencia de company_watchlists (única por org+empresa), una empresa
    SÍ puede vivir en varias listas guardadas a la vez."""
    await mock_db.master_companies_mock.insert_one(_OLMEDO)
    me = (await alice.get("/api/auth/me")).json()
    org_id = await _create_org_and_membership(mock_db, me["user"]["user_id"])

    r1 = await alice.post(
        "/api/lists", json={"name": "Lista 1", "cifs": ["B47820150"]}, headers={"X-Active-Org": org_id}
    )
    r2 = await alice.post(
        "/api/lists", json={"name": "Lista 2", "cifs": ["B47820150"]}, headers={"X-Active-Org": org_id}
    )
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert len(r1.json()["items"]) == 1
    assert len(r2.json()["items"]) == 1


@pytest.mark.asyncio
async def test_lists_require_auth(client: AsyncClient) -> None:
    r = await client.get("/api/lists")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_lists_require_active_org(alice: AsyncClient) -> None:
    r = await alice.post("/api/lists", json={"name": "Sin org"})
    assert r.status_code == 400
