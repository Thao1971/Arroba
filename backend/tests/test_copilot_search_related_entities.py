"""Tests para `related_entities` en la respuesta del skill de búsqueda.

Contexto (2026-08-24): "Sectores relacionados" — chips de sector/territory/
investor sobre la tabla de `/resultados` y en el Composer, pedidas por
Daniel tras confirmar que el buscador real y `/api/entities/lookup` vivían
desconectados. `execute_search()` ahora envuelve `_execute_search_impl()`
(sin cambios) y añade `related_entities` solo cuando la respuesta trae un
`workspace` con contenido real.

Estos tests mockean `entities_service.lookup` directamente (no dependen de
que sector/territory/investor funcionen de verdad — eso ya está cubierto en
`test_entities_sector_territory.py` / `test_entities_investor.py`). Lo que
se testea aquí es el WIRING: cuándo se llama, cuándo no, y que un fallo ahí
nunca tumba la búsqueda principal.

FIX 2026-09-06 · Daniel: el gate pasó de "solo si `workspace is not None`"
a "siempre salvo `navigate_to`" — Empresas/Territorios/Mercados son tres
respuestas independientes sobre la misma query, no ramas excluyentes. Ver
`test_related_entities_present_when_disambiguation_wins` más abajo.

Fuerzan `agency_tool_mode=mock` (mismo patrón que `test_copilot_search.py`)
para ejercitar el path determinista — el mock de `entities_service.lookup`
sustituye lo que haría la llamada real a Intel.
"""
from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

pytestmark = pytest.mark.anyio


@pytest.fixture(autouse=True)
def _force_mock_mode(monkeypatch):
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
        "master_company_id": "mc_quickads",
        "legal_name": "Quickads Technologies, S.L.",
        "cif": "B-67 220 945",
        "sector": "Tecnología y software",
        "region": "Barcelona",
    },
]


async def _seed(admin_client) -> None:
    for c in SEED_COMPANIES:
        r = await admin_client.post(
            "/api/admin/agency-tool/master-companies-mock", json=c
        )
        assert r.status_code in (201, 409), r.text


def _fake_entity_result(kind: str, name: str) -> dict:
    icons = {"sector": "grid", "territory": "map", "investor": "briefcase"}
    return {
        "type": kind,
        "id": f"{kind}:{name}",
        "display_name": name,
        "secondary_label": None,
        "icon": icons[kind],
    }


async def test_related_entities_present_when_workspace_has_results(admin_client, client, monkeypatch):
    from src.modules.copilot import service as copilot_service
    from src.modules.entities.models import EntityLookupResult

    fake = [EntityLookupResult(**_fake_entity_result("sector", "Software"))]
    mock_lookup = AsyncMock(return_value=fake)
    monkeypatch.setattr(copilot_service.entities_service, "lookup", mock_lookup)

    await _seed(admin_client)
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "software", "context": {"locale": "es", "pathname": "/"}},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["workspace"] is not None
    assert body["related_entities"] == [_fake_entity_result("sector", "Software")]
    mock_lookup.assert_awaited_once()
    _, kwargs = mock_lookup.call_args
    assert kwargs["query"] == "software"
    assert set(kwargs["types"]) == {"sector", "territory", "investor"}


async def test_related_entities_null_when_no_matches(admin_client, client, monkeypatch):
    from src.modules.copilot import service as copilot_service

    monkeypatch.setattr(copilot_service.entities_service, "lookup", AsyncMock(return_value=[]))
    await _seed(admin_client)
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "software", "context": {"locale": "es", "pathname": "/"}},
    )
    assert r.status_code == 200, r.text
    assert r.json()["related_entities"] is None


async def test_related_entities_present_when_disambiguation_wins(admin_client, client, monkeypatch):
    """FIX 2026-09-06 · Daniel: una query como "Sevilla" que coincide con
    razón social de empresas cae en `disambiguation` (`workspace is None`),
    pero eso no debe impedir que se resuelvan territorio/sector para la
    misma query — antes el gate `workspace is not None` dejaba
    `related_entities` en None siempre en este caso, aunque el catálogo
    geo tuviese datos."""
    from src.modules.copilot import service as copilot_service
    from src.modules.entities.models import EntityLookupResult

    fake = [
        EntityLookupResult(**_fake_entity_result("territory", "Andalucía")),
        EntityLookupResult(**_fake_entity_result("territory", "Sevilla")),
    ]
    mock_lookup = AsyncMock(return_value=fake)
    monkeypatch.setattr(copilot_service.entities_service, "lookup", mock_lookup)

    await _seed(admin_client)
    r = await client.post(
        "/api/copilot/skills/search",
        # "studio" es substring de "Kitchen Studio, S.L." pero no prefijo →
        # score 0.7 (< 0.85), así que NO dispara el branch de navigate_to de
        # 1-match-fuerte; 1 candidato con score>0 → disambiguation (no CIF,
        # no exploratorio sin resultados de empresa).
        json={"query": "studio", "context": {"locale": "es", "pathname": "/resultados"}},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["workspace"] is None
    assert body["disambiguation"] is not None
    assert body["navigate_to"] is None
    assert body["related_entities"] == [
        _fake_entity_result("territory", "Andalucía"),
        _fake_entity_result("territory", "Sevilla"),
    ]
    mock_lookup.assert_awaited_once()


async def test_related_entities_not_fetched_for_direct_cif_navigation(admin_client, client, monkeypatch):
    """CIF exacto de una empresa sembrada → navigate_to directo, `workspace`
    es None. No debe llamar a entities_service.lookup en absoluto (no hay
    tabla, no hay chips). (Un CIF con forma válida pero desconocido NO
    cuenta: cae a `_empty_response`, que sí trae workspace — cubierto por
    el otro test de "sin coincidencias".)"""
    from src.modules.copilot import service as copilot_service

    mock_lookup = AsyncMock(return_value=[])
    monkeypatch.setattr(copilot_service.entities_service, "lookup", mock_lookup)

    await _seed(admin_client)
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "B86540112", "context": {"locale": "es", "pathname": "/"}},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["navigate_to"] == "/empresa-f01/B86540112"
    assert body["workspace"] is None
    assert body["related_entities"] is None
    mock_lookup.assert_not_awaited()


async def test_related_entities_failure_does_not_break_main_search(admin_client, client, monkeypatch):
    """Si entities_service.lookup revienta, la búsqueda principal sigue
    devolviendo 200 con los resultados de empresas — solo se pierden los chips."""
    from src.modules.copilot import service as copilot_service

    async def _boom(**_kwargs):
        raise RuntimeError("Intel caído")

    monkeypatch.setattr(copilot_service.entities_service, "lookup", _boom)
    await _seed(admin_client)
    r = await client.post(
        "/api/copilot/skills/search",
        json={"query": "software", "context": {"locale": "es", "pathname": "/"}},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["workspace"] is not None
    assert body["related_entities"] is None
