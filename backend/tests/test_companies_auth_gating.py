"""Tests para el DTO extendido de /api/companies/{cif} en Sprint 1.

Verifica:
  - Auth gating (viewer anónimo vs autenticado).
  - Presencia de los 4 campos aditivos (signals, documents, activity,
    next_best_actions) en el DTO.
  - `signals.unavailable=True` con REQ-008 en Sprint 1.
  - `next_best_actions` tiene exactamente 4 items canónicos.
  - Regla 5 / C16: el DTO NO expone las palabras "agency" ni "adapter"
    fuera del campo canónico `source` (que es un flag informativo permitido).
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


@pytest.mark.asyncio
async def test_anonymous_receives_public_sections_only(client: AsyncClient, mock_db) -> None:
    await mock_db.master_companies_mock.insert_one(_OLMEDO)

    r = await client.get("/api/companies/B47820150")
    assert r.status_code == 200, r.text
    body = r.json()

    sections = body["sections"]
    # Secciones 1-3 públicas presentes.
    assert sections["hero"] is not None
    assert sections["kpi_metrics"] is not None
    assert sections["identity"] is not None
    assert sections["financials_metrics"] is not None
    # Secciones 4-7 auth-gated son None para anon.
    assert sections["score_block"] is None
    assert sections["comparables"] is None
    assert sections["valuation"] is None
    assert sections["narrative"] is None
    # locked_sections reporta los flags para el frontend.
    assert set(body["locked_sections"]) >= {"score", "comparables", "valuation", "narrative", "actions"}


@pytest.mark.asyncio
async def test_authenticated_receives_full_sections(client: AsyncClient, mock_db, alice) -> None:
    await mock_db.master_companies_mock.insert_one(_OLMEDO)

    r = await alice.get("/api/companies/B47820150")
    assert r.status_code == 200, r.text
    body = r.json()

    sections = body["sections"]
    # Todas las secciones canónicas presentes.
    assert sections["score_block"] is not None
    assert sections["comparables"] is not None
    assert sections["valuation"] is not None
    assert sections["narrative"] is not None
    # Auth: locked_sections vacío.
    assert body["locked_sections"] == []


@pytest.mark.asyncio
async def test_dto_includes_new_sprint1_modules(client: AsyncClient, mock_db, alice) -> None:
    """Los 4 campos aditivos: signals, documents, activity, next_best_actions."""
    await mock_db.master_companies_mock.insert_one(_OLMEDO)

    r = await alice.get("/api/companies/B47820150")
    assert r.status_code == 200
    body = r.json()

    sections = body["sections"]
    # signals: unavailable=True + REQ-008 en Sprint 1.
    assert sections["signals"] is not None
    assert sections["signals"]["unavailable"] is True
    assert sections["signals"]["req"] == "REQ-008"
    # documents: presente aunque vacío.
    assert isinstance(sections["documents"], dict)
    assert isinstance(sections["documents"]["items"], list)
    # activity: presente.
    assert isinstance(sections["activity"], dict)
    assert isinstance(sections["activity"]["items"], list)
    # next_best_actions: 4 items canónicos.
    nba = sections["next_best_actions"]
    assert len(nba) == 4
    action_ids = {a["id"] for a in nba}
    assert action_ids == {"value_company", "find_buyers", "activate_opportunity", "compare_with_other"}
    # Autenticado: enabled=True (no disabled).
    for a in nba:
        assert a["disabled"] is False


@pytest.mark.asyncio
async def test_anonymous_next_best_actions_are_disabled(client: AsyncClient, mock_db) -> None:
    """C7: viewer anónimo ve NBA pero deshabilitadas."""
    await mock_db.master_companies_mock.insert_one(_OLMEDO)

    r = await client.get("/api/companies/B47820150")
    assert r.status_code == 200
    nba = r.json()["sections"]["next_best_actions"]
    assert len(nba) == 4
    for a in nba:
        assert a["disabled"] is True


@pytest.mark.asyncio
async def test_dto_purity_no_agency_or_adapter_leak(client: AsyncClient, mock_db, alice) -> None:
    """C16 desde backend: la response NO expone tipos internos del adapter."""
    await mock_db.master_companies_mock.insert_one(_OLMEDO)

    r = await alice.get("/api/companies/B47820150")
    assert r.status_code == 200
    body_text = r.text.lower()
    # `agency_tool` no debe aparecer como clave.
    assert "agency_tool" not in body_text
    assert "enrichedcompany" not in body_text
    # `adapter` no debe aparecer.
    assert "adapter" not in body_text
    # `mock` puede aparecer solo dentro del campo canónico `source`, no
    # como clave de tipo interno.
    body = r.json()
    assert body.get("source") in {"mock", "real"}  # flag informativo permitido
