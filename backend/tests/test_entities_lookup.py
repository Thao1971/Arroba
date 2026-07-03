"""Tests para el endpoint GET /api/entities/lookup (Sprint 1).

Verifica:
  - Resolución por nombre (fuzzy) devuelve la empresa correcta.
  - Resolución por CIF exacto devuelve la empresa.
  - Contract multi-tipo: `types=company,sector,territory` no falla.
  - Tipo desconocido se ignora silenciosamente.
  - Response shape estable: type, id, display_name, secondary_label, icon.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

# Sembramos 3 empresas antes de cada test para no depender del seed real.
SEED_COMPANIES = [
    {
        "master_company_id": "mc_olmedo",
        "legal_name": "Grupo Olmedo Hoteles, S.L.",
        "cif": "B47820150",
        "sector": "Hoteles",
        "region": "Castilla y León",
        "country": "ES",
        "financials": {"revenue": 6_410_000, "ebitda": 1_858_900, "employees": 82, "fiscal_year": 2024},
        "confidence": 0.89,
        "lineage": "normalized",
    },
    {
        "master_company_id": "mc_kitchen",
        "legal_name": "Kitchen Studio, S.L.",
        "cif": "B86540112",
        "sector": "Software",
        "region": "Madrid",
        "country": "ES",
        "financials": {"revenue": 5_400_000, "ebitda": 1_080_000, "employees": 32, "fiscal_year": 2024},
        "confidence": 0.92,
        "lineage": "normalized",
    },
]


@pytest.mark.asyncio
async def test_lookup_by_partial_name_returns_company(client: AsyncClient, mock_db) -> None:
    await mock_db.master_companies_mock.insert_many(SEED_COMPANIES)

    r = await client.get("/api/entities/lookup", params={"q": "Olmedo"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["query"] == "Olmedo"
    assert len(body["results"]) == 1
    result = body["results"][0]
    assert result["type"] == "company"
    assert result["id"] == "B47820150"
    assert result["display_name"] == "Grupo Olmedo Hoteles, S.L."
    assert result["icon"] == "building"
    assert "Hoteles" in (result.get("secondary_label") or "")


@pytest.mark.asyncio
async def test_lookup_by_exact_cif(client: AsyncClient, mock_db) -> None:
    await mock_db.master_companies_mock.insert_many(SEED_COMPANIES)

    r = await client.get("/api/entities/lookup", params={"q": "B86540112"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert len(body["results"]) == 1
    assert body["results"][0]["id"] == "B86540112"
    assert body["results"][0]["display_name"] == "Kitchen Studio, S.L."


@pytest.mark.asyncio
async def test_lookup_accepts_multi_type_without_failing(client: AsyncClient, mock_db) -> None:
    """Regla 2: contract multi-tipo desde el día 1. Sector/Territory/etc.
    aún no tienen resolver pero la API no falla."""
    await mock_db.master_companies_mock.insert_many(SEED_COMPANIES)

    r = await client.get(
        "/api/entities/lookup",
        params={"q": "Olmedo", "types": "company,sector,territory,opportunity"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    # Sólo company está poblado → devuelve solo el company match.
    assert len(body["results"]) == 1
    assert body["results"][0]["type"] == "company"


@pytest.mark.asyncio
async def test_lookup_ignores_unknown_types(client: AsyncClient, mock_db) -> None:
    """Tipos no reconocidos no deben romper el request."""
    await mock_db.master_companies_mock.insert_many(SEED_COMPANIES)

    r = await client.get(
        "/api/entities/lookup",
        params={"q": "Kitchen", "types": "company,nonsense,unknown_type"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert len(body["results"]) == 1
    assert body["results"][0]["display_name"] == "Kitchen Studio, S.L."


@pytest.mark.asyncio
async def test_lookup_empty_query_returns_422(client: AsyncClient) -> None:
    """La API declara q obligatorio (min_length=1)."""
    r = await client.get("/api/entities/lookup", params={"q": ""})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_lookup_default_type_is_company(client: AsyncClient, mock_db) -> None:
    """Sin `types` en query string debe usar `company` por default."""
    await mock_db.master_companies_mock.insert_many(SEED_COMPANIES)

    r = await client.get("/api/entities/lookup", params={"q": "Kitchen"})
    assert r.status_code == 200
    body = r.json()
    assert len(body["results"]) == 1
    assert body["results"][0]["type"] == "company"


@pytest.mark.asyncio
async def test_lookup_response_shape_is_strict(client: AsyncClient, mock_db) -> None:
    """Cada result debe tener exactamente {type,id,display_name,secondary_label,icon}."""
    await mock_db.master_companies_mock.insert_many(SEED_COMPANIES)

    r = await client.get("/api/entities/lookup", params={"q": "Olmedo"})
    assert r.status_code == 200
    result = r.json()["results"][0]
    assert set(result.keys()) == {"type", "id", "display_name", "secondary_label", "icon"}
