"""Tests para los resolvers `sector`/`territory` de `entities/service.py`.

Contexto (2026-08-24): activados en el dispatcher de `/api/entities/lookup`
(antes eran `_resolve_stub` → []). Intel no tiene motor de búsqueda por
texto para sectores/territorios — son catálogos fijos y pequeños (CNAE,
CCAA/provincias) que se traen completos (cacheados) y se filtran aquí por
substring. Estos tests parchean `_get_cnae_catalog`/`_get_geo_catalog`
directamente con un catálogo de muestra, para testear el filtrado/formato
sin red y sin depender del modo mock/real de `AGENCY_TOOL_MODE`.

El gate de modo (mock → siempre []) se cubre aparte, sin parchear nada,
apoyándonos en que el entorno de test por defecto NO está en modo real
(ver `test_entities_lookup.py::test_lookup_accepts_multi_type_without_failing`,
que ya verifica esto contra el endpoint completo).
"""
from __future__ import annotations

import pytest

from src.modules.entities import service

SAMPLE_CNAE_CATALOG = [
    {
        "code": "J",
        "label": "Información y comunicaciones",
        "level": "section",
        "divisions": [
            {
                "code": "73",
                "label": "Publicidad y estudios de mercado",
                "level": "division",
                "groups": [
                    {"code": "7311", "label": "Agencias de publicidad", "level": "group"},
                    {"code": "7320", "label": "Estudios de mercado y encuestas de opinión pública", "level": "group"},
                ],
            },
        ],
    },
    {
        "code": "I",
        "label": "Hostelería",
        "level": "section",
        "divisions": [
            {"code": "55", "label": "Servicios de alojamiento", "level": "division", "groups": []},
        ],
    },
]

SAMPLE_GEO_CATALOG = [
    {
        "code": "07",
        "label": "Castilla y León",
        "level": "ccaa",
        "provinces": [
            {"code": "47", "label": "Valladolid", "level": "province"},
            {"code": "37", "label": "Salamanca", "level": "province"},
        ],
    },
    {
        "code": "09",
        "label": "Cataluña",
        "level": "ccaa",
        "provinces": [{"code": "08", "label": "Barcelona", "level": "province"}],
    },
]


@pytest.mark.asyncio
async def test_resolve_sector_matches_group_level(monkeypatch):
    monkeypatch.setattr(service, "_get_cnae_catalog", _fake(SAMPLE_CNAE_CATALOG))
    results = await service._resolve_sector("agencias de publicidad", limit=10)
    assert len(results) == 1
    assert results[0].type == "sector"
    assert results[0].id == "cnae:7311"
    assert results[0].display_name == "Agencias de publicidad"
    assert results[0].secondary_label == "Publicidad y estudios de mercado"
    assert results[0].icon == "grid"


@pytest.mark.asyncio
async def test_resolve_sector_is_accent_and_case_insensitive(monkeypatch):
    monkeypatch.setattr(service, "_get_cnae_catalog", _fake(SAMPLE_CNAE_CATALOG))
    results = await service._resolve_sector("PUBLICIDAD", limit=10)
    ids = {r.id for r in results}
    assert "cnae:73" in ids  # división "Publicidad y estudios de mercado"
    assert "cnae:7311" in ids  # grupo "Agencias de publicidad"


@pytest.mark.asyncio
async def test_resolve_sector_matches_section_label(monkeypatch):
    monkeypatch.setattr(service, "_get_cnae_catalog", _fake(SAMPLE_CNAE_CATALOG))
    results = await service._resolve_sector("hosteleria", limit=10)
    assert len(results) == 1
    assert results[0].id == "cnae:I"
    assert results[0].secondary_label == "Sección CNAE"


@pytest.mark.asyncio
async def test_resolve_sector_respects_limit(monkeypatch):
    monkeypatch.setattr(service, "_get_cnae_catalog", _fake(SAMPLE_CNAE_CATALOG))
    results = await service._resolve_sector("a", limit=1)
    assert len(results) == 1


@pytest.mark.asyncio
async def test_resolve_sector_no_match_returns_empty(monkeypatch):
    monkeypatch.setattr(service, "_get_cnae_catalog", _fake(SAMPLE_CNAE_CATALOG))
    results = await service._resolve_sector("inexistente_xyz", limit=10)
    assert results == []


@pytest.mark.asyncio
async def test_resolve_sector_empty_query_returns_empty(monkeypatch):
    monkeypatch.setattr(service, "_get_cnae_catalog", _fake(SAMPLE_CNAE_CATALOG))
    assert await service._resolve_sector("", limit=10) == []


@pytest.mark.asyncio
async def test_resolve_sector_catalog_unavailable_returns_empty(monkeypatch):
    """Si Intel falla / gate mock, `_get_cnae_catalog` devuelve None → []
    (nunca un error, nunca datos inventados)."""
    monkeypatch.setattr(service, "_get_cnae_catalog", _fake(None))
    assert await service._resolve_sector("publicidad", limit=10) == []


@pytest.mark.asyncio
async def test_resolve_territory_matches_ccaa(monkeypatch):
    monkeypatch.setattr(service, "_get_geo_catalog", _fake(SAMPLE_GEO_CATALOG))
    results = await service._resolve_territory("castilla y leon", limit=10)
    assert len(results) == 1
    assert results[0].type == "territory"
    assert results[0].id == "ccaa:07"
    assert results[0].secondary_label == "Comunidad autónoma"
    assert results[0].icon == "map"


@pytest.mark.asyncio
async def test_resolve_territory_matches_province_also_returns_parent_ccaa(monkeypatch):
    """FIX 2026-09-06 · Daniel: buscar una provincia (p.ej. "Valladolid")
    debe devolver TAMBIÉN su comunidad autónoma como chip independiente
    (antes solo aparecía como `secondary_label` de contexto, no navegable
    por su cuenta) — orden: CCAA primero, luego la provincia."""
    monkeypatch.setattr(service, "_get_geo_catalog", _fake(SAMPLE_GEO_CATALOG))
    results = await service._resolve_territory("Valladolid", limit=10)
    assert len(results) == 2
    assert results[0].id == "ccaa:07"
    assert results[0].display_name == "Castilla y León"
    assert results[0].secondary_label == "Comunidad autónoma"
    assert results[1].id == "province:47"
    assert results[1].display_name == "Valladolid"
    assert results[1].secondary_label == "Castilla y León"


@pytest.mark.asyncio
async def test_resolve_territory_does_not_duplicate_ccaa_for_multiple_provinces(monkeypatch):
    """Si dos provincias de la misma CCAA matchean la query (caso raro pero
    posible con substrings cortos), la CCAA aparece una sola vez."""
    catalog = [
        {
            "code": "09",
            "label": "Cataluña",
            "level": "ccaa",
            "provinces": [
                {"code": "08", "label": "Barcelona", "level": "province"},
                {"code": "43", "label": "Tarragona", "level": "province"},
            ],
        },
    ]
    monkeypatch.setattr(service, "_get_geo_catalog", _fake(catalog))
    results = await service._resolve_territory("a", limit=10)
    ccaa_ids = [r.id for r in results if r.id.startswith("ccaa:")]
    assert ccaa_ids == ["ccaa:09"]


@pytest.mark.asyncio
async def test_resolve_territory_ccaa_direct_match_not_duplicated_by_province_loop(monkeypatch):
    """Buscar la CCAA por nombre no debe duplicarla aunque el bucle de
    provincias también la intente añadir."""
    monkeypatch.setattr(service, "_get_geo_catalog", _fake(SAMPLE_GEO_CATALOG))
    results = await service._resolve_territory("Castilla y Leon", limit=10)
    assert len(results) == 1
    assert results[0].id == "ccaa:07"


@pytest.mark.asyncio
async def test_resolve_territory_no_match_returns_empty(monkeypatch):
    monkeypatch.setattr(service, "_get_geo_catalog", _fake(SAMPLE_GEO_CATALOG))
    assert await service._resolve_territory("Andalucia", limit=10) == []


def _fake(value):
    async def _inner(*_args, **_kwargs):
        return value
    return _inner
