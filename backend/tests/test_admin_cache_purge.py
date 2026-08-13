"""HARDENING-004b · smoke pytest para POST /api/admin/cache/purge.

Cobertura de la matriz del endpoint (8 escenarios: 6 spec + 2 extras):

    1. Sin ARROBA_ADMIN_TOKEN en env       → 503
    2. Token no proporcionado              → 401
    3. Token incorrecto                    → 401
    4. Modo {cif} con token correcto       → 200 + deleted > 0
    5. Modo {engine} con token correcto    → 200 + deleted matches engine
    6. Modo {force: true} con token        → 200 + after == 0
    7. (bonus) Body vacío {}               → 400 exclusive mode
    8. (bonus) Body con 2 llaves {cif,fo}  → 400 exclusive mode

Usa el conftest global (`mock_db` + `client` con mongomock-motor). No requiere
Mongo real. La única variable de entorno mockeada es `ARROBA_ADMIN_TOKEN` via
`monkeypatch.setenv` + `get_intelligence_settings.cache_clear()` para que
Pydantic Settings re-lea el env limpio en cada escenario.
"""
from __future__ import annotations

import pytest

from src.modules.intelligence_layer.cache import get_cache
from src.modules.intelligence_layer.config import get_intelligence_settings

pytestmark = [pytest.mark.asyncio, pytest.mark.smoke]

ADMIN_TOKEN = "test-admin-token-1234567890abcdef1234567890abcdef"


def _reset_settings_cache() -> None:
    """Fuerza re-lectura del env por Pydantic Settings tras cambios de monkeypatch."""
    get_intelligence_settings.cache_clear()


@pytest.fixture
async def seeded_cache(mock_db):  # noqa: ARG001 · fixture ordering
    """Siembra 5 docs en `intelligence_cache` con distintos engines/CIFs.

    Formato canónico del `_id`: `provider:engine:method:master_id:payload_hash`
    """
    coll = mock_db["intelligence_cache"]
    seeds = [
        {"_id": "agency_tool:ficha:aggregate:B28184687:h1", "payload": {"a": 1}},
        {"_id": "agency_tool:ficha:aggregate:B59022921:h2", "payload": {"a": 2}},
        {"_id": "agency_tool:valuation:analyze_valuation:B28184687:h3", "payload": {"a": 3}},
        {"_id": "agency_tool:ranking:sector:B28184687:h4", "payload": {"a": 4}},
        {"_id": "agency_tool:market:sector:B59022921:h5", "payload": {"a": 5}},
    ]
    await coll.insert_many(seeds)
    yield coll
    # Cleanup memoria LRU del pod para no filtrar estado entre tests
    cache = get_cache()
    await cache.memory.clear()


# ═══════════════════════════════ ESCENARIOS ═══════════════════════════════════


async def test_purge_503_when_token_not_configured(client, monkeypatch, seeded_cache):  # noqa: ARG001
    """[1] Sin ARROBA_ADMIN_TOKEN en env → 503 fail-safe."""
    monkeypatch.setenv("ARROBA_ADMIN_TOKEN", "")
    _reset_settings_cache()
    r = await client.post("/api/admin/cache/purge", json={"cif": "B28184687"})
    assert r.status_code == 503, r.text
    assert r.json() == {"error": "Admin token not configured"}


async def test_purge_401_without_header(client, monkeypatch, seeded_cache):  # noqa: ARG001
    """[2] Token configurado pero header ausente → 401 fail-closed."""
    monkeypatch.setenv("ARROBA_ADMIN_TOKEN", ADMIN_TOKEN)
    _reset_settings_cache()
    r = await client.post("/api/admin/cache/purge", json={"cif": "B28184687"})
    assert r.status_code == 401, r.text
    assert r.json() == {"error": "invalid admin token"}


async def test_purge_401_with_wrong_token(client, monkeypatch, seeded_cache):  # noqa: ARG001
    """[3] Token incorrecto → 401 fail-closed."""
    monkeypatch.setenv("ARROBA_ADMIN_TOKEN", ADMIN_TOKEN)
    _reset_settings_cache()
    r = await client.post(
        "/api/admin/cache/purge",
        headers={"X-Admin-Token": "wrong-token-xxxxx"},
        json={"cif": "B28184687"},
    )
    assert r.status_code == 401, r.text
    assert r.json() == {"error": "invalid admin token"}


async def test_purge_cif_mode(client, monkeypatch, seeded_cache):
    """[4] Modo {cif: 'B28184687'} → 200 + deleted matches CIF entries."""
    monkeypatch.setenv("ARROBA_ADMIN_TOKEN", ADMIN_TOKEN)
    _reset_settings_cache()

    r = await client.post(
        "/api/admin/cache/purge",
        headers={"X-Admin-Token": ADMIN_TOKEN},
        json={"cif": "B28184687"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["mode"] == "cif"
    assert body["filter"] == "B28184687"
    # Seeds tienen 3 docs con CIF B28184687 (ficha, valuation, ranking)
    assert body["before"] == 3
    assert body["deleted"] == 3
    assert body["after"] == 0
    # Verificar directamente en la colección
    remaining = await seeded_cache.count_documents({})
    assert remaining == 2  # los 2 docs de B59022921


async def test_purge_engine_mode(client, monkeypatch, seeded_cache):
    """[5] Modo {engine: 'ficha'} → 200 + deleted matches engine entries."""
    monkeypatch.setenv("ARROBA_ADMIN_TOKEN", ADMIN_TOKEN)
    _reset_settings_cache()

    r = await client.post(
        "/api/admin/cache/purge",
        headers={"X-Admin-Token": ADMIN_TOKEN},
        json={"engine": "ficha"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["mode"] == "engine"
    assert body["filter"] == "ficha"
    # Seeds tienen 2 docs con engine `ficha` (ambos CIFs)
    assert body["before"] == 2
    assert body["deleted"] == 2
    assert body["after"] == 0
    remaining = await seeded_cache.count_documents({})
    assert remaining == 3  # valuation + ranking + market


async def test_purge_force_mode(client, monkeypatch, seeded_cache):
    """[6] Modo {force: true} → 200 + colección vaciada."""
    monkeypatch.setenv("ARROBA_ADMIN_TOKEN", ADMIN_TOKEN)
    _reset_settings_cache()

    r = await client.post(
        "/api/admin/cache/purge",
        headers={"X-Admin-Token": ADMIN_TOKEN},
        json={"force": True},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["mode"] == "force"
    assert body["filter"] is None
    assert body["before"] == 5
    assert body["deleted"] == 5
    assert body["after"] == 0
    remaining = await seeded_cache.count_documents({})
    assert remaining == 0


async def test_purge_400_empty_body(client, monkeypatch, seeded_cache):  # noqa: ARG001
    """[7 bonus] Body vacío {} → 400 exclusive-mode."""
    monkeypatch.setenv("ARROBA_ADMIN_TOKEN", ADMIN_TOKEN)
    _reset_settings_cache()

    r = await client.post(
        "/api/admin/cache/purge",
        headers={"X-Admin-Token": ADMIN_TOKEN},
        json={},
    )
    assert r.status_code == 400, r.text
    body = r.json()
    assert "error" in body
    # Mensaje debe mencionar el modo exclusivo
    assert "exactly one of" in body["error"].lower() or "cif" in body["error"].lower()


async def test_purge_400_two_keys(client, monkeypatch, seeded_cache):  # noqa: ARG001
    """[8 bonus] Body con dos llaves {cif, force} → 400 exclusive-mode."""
    monkeypatch.setenv("ARROBA_ADMIN_TOKEN", ADMIN_TOKEN)
    _reset_settings_cache()

    r = await client.post(
        "/api/admin/cache/purge",
        headers={"X-Admin-Token": ADMIN_TOKEN},
        json={"cif": "B28184687", "force": True},
    )
    assert r.status_code == 400, r.text
    body = r.json()
    assert "error" in body
