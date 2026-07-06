"""Tests end-to-end del endpoint /api/companies/{cif}/identity (modo mock).

También verifica:
  * Schema §6.1 completo devuelto por el proxy.
  * /api/internal/metrics expone Prometheus text/plain 0.0.4.
  * La API key NUNCA aparece en /metrics ni en /openapi.json.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from src.modules.intelligence_layer.cache import reset_cache_for_tests
from src.modules.intelligence_layer.config import reset_intelligence_settings_cache
from src.modules.intelligence_layer.router import reset_intelligence_router_for_tests

# Solo verificamos el prefijo `as_` de las keys del proveedor; nunca guardamos
# el valor real de la key en un fichero versionado.
KEY_PREFIX_SIGNATURE = "as_"


@pytest.fixture(autouse=True)
def _reset_intel_state():
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()
    yield
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()


async def _seed_master(mock_db, cif: str = "B47820150", **overrides) -> dict:
    from datetime import UTC, datetime

    from src.modules.intelligence_layer.providers.mock.master import ENGINE_VERSION_MOCK  # noqa: F401
    doc = {
        "master_company_id": "mc_test001",
        "cif": cif,
        "legal_name": "Castilla Termal SL",
        "sector": "Servicios turísticos",
        "region": "Valladolid",
        "country": "ES",
        "financials": {
            "revenue": 12_500_000,
            "ebitda": 3_200_000,
            "employees": 45,
            "fiscal_year": 2024,
        },
        "confidence": 0.9,
        "lineage": "normalized",
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    doc.update(overrides)
    await mock_db.master_companies_mock.insert_one(doc)
    return doc


@pytest.mark.asyncio
async def test_identity_requires_auth(client: AsyncClient, mock_db):
    """Endpoint no anon — devuelve 401 sin sesión."""
    await _seed_master(mock_db)
    r = await client.get("/api/companies/B47820150/identity")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_identity_returns_master_record_schema_6_1(alice: AsyncClient, mock_db):
    """Verifica que el payload cumple el schema §6.1 completo."""
    await _seed_master(mock_db)
    r = await alice.get("/api/companies/B47820150/identity")
    assert r.status_code == 200, r.text
    body = r.json()

    # ---- Campos raíz ----
    assert body["master_id"] == "mc_test001"
    assert body["cif_normalized"] == "B47820150"
    assert body["status"] == "active"

    # ---- Sub-objetos §6.1 (Identity, Classification, Location, Contact, Size, Financials, Ownership) ----
    assert body["identity"]["legal_name"] == "Castilla Termal SL"
    assert body["identity"]["cif"] == "B47820150"
    assert body["identity"]["aliases"] == []
    assert body["classification"]["cnae_description"] == "Servicios turísticos"
    assert body["classification"]["cnae_code"] is None
    assert body["location"]["provincia"] == "Valladolid"
    assert body["location"]["pais"] == "ES"
    assert body["contact"]["web"] is None
    assert body["size"]["employees_total"] == 45
    assert body["financials"]["latest"]["revenue"] == 12_500_000
    assert body["financials"]["latest"]["ebitda"] == 3_200_000
    assert body["financials"]["latest"]["year"] == 2024
    assert body["financials"]["history"] == []
    assert body["ownership"]["shareholders"] == []
    assert body["ownership"]["ultimate_parent"] is None

    # ---- Metadatos del engine ----
    assert body["engine_version"] == "mock-1.0.0"
    assert body["generated_at"] is not None

    # ---- Cabeceras de trazabilidad (no leakea key) ----
    assert r.headers.get("X-Intelligence-Mode") == "mock"
    assert r.headers.get("X-Provider") == "mock"


@pytest.mark.asyncio
async def test_identity_returns_404_when_cif_unknown(alice: AsyncClient, mock_db):
    r = await alice.get("/api/companies/B99999999/identity")
    assert r.status_code == 404
    assert r.json()["code"] == "master_not_found"


@pytest.mark.asyncio
async def test_internal_metrics_exposes_prometheus_text(alice: AsyncClient, mock_db):
    """3 requests → métricas visibles en /api/internal/metrics."""
    await _seed_master(mock_db)
    for _ in range(3):
        await alice.get("/api/companies/B47820150/identity")

    r = await alice.get("/api/internal/metrics")
    assert r.status_code == 200
    assert "text/plain" in r.headers["content-type"]
    body = r.text
    assert "intelligence_layer_requests_total" in body
    assert "intelligence_layer_request_duration_seconds" in body
    assert "intelligence_layer_cache_hits_total" in body
    assert "intelligence_layer_circuit_breaker_state" in body
    # 3 llamadas: 1 miss + 2 hits
    assert 'engine="master"' in body


@pytest.mark.asyncio
async def test_api_key_never_leaks_via_metrics(alice: AsyncClient, mock_db):
    """La API key primary NUNCA aparece en el endpoint de métricas.

    Estrategia: leemos la key REAL desde IntelligenceSettings (env) y comprobamos
    que no aparece literal en el output. También rechazamos el prefijo `as_`
    (indicador canónico de credenciales del proveedor) apareciendo asociado a
    labels de Prometheus.
    """
    from src.modules.intelligence_layer.config import get_intelligence_settings

    await _seed_master(mock_db)
    await alice.get("/api/companies/B47820150/identity")
    r = await alice.get("/api/internal/metrics")

    real_key = get_intelligence_settings().arroba_service_api_key_primary
    if real_key:
        assert real_key not in r.text
    # El prefijo canónico `as_` no debe aparecer como etiqueta de Prometheus.
    # Se permite en HELP/TYPE lines pero no en `label="as_..."`.
    import re
    assert re.search(rf'="{KEY_PREFIX_SIGNATURE}[A-Za-z0-9_-]{{6,}}"', r.text) is None


@pytest.mark.asyncio
async def test_api_key_never_leaks_via_openapi(alice: AsyncClient):
    """La API key primary NUNCA aparece en /api/openapi.json."""
    from src.modules.intelligence_layer.config import get_intelligence_settings

    r = await alice.get("/api/openapi.json")
    assert r.status_code == 200
    real_key = get_intelligence_settings().arroba_service_api_key_primary
    if real_key:
        assert real_key not in r.text


@pytest.mark.asyncio
async def test_internal_metrics_token_protection(alice: AsyncClient, mock_db, monkeypatch):
    """Si INTERNAL_METRICS_TOKEN está seteado, /metrics exige el header."""
    from src.modules.intelligence_layer import config as cfg_mod
    from src.modules.intelligence_layer import endpoints as ep_mod

    reset_intelligence_settings_cache()
    fake_settings = cfg_mod.IntelligenceSettings(
        agency_tool_mode="mock", internal_metrics_token="secret-t"
    )
    monkeypatch.setattr(ep_mod, "get_intelligence_settings", lambda: fake_settings)
    # Sin token → 401
    r = await alice.get("/api/internal/metrics")
    assert r.status_code == 401
    # Con token válido → 200
    r = await alice.get("/api/internal/metrics", headers={"X-Metrics-Token": "secret-t"})
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_cache_hit_second_request(alice: AsyncClient, mock_db):
    """Segunda llamada al mismo CIF debe venir de caché (verificado con métricas)."""
    await _seed_master(mock_db)
    await alice.get("/api/companies/B47820150/identity")
    await alice.get("/api/companies/B47820150/identity")

    r = await alice.get("/api/internal/metrics")
    body = r.text
    # Prometheus expone counters como floats (1.0). Buscamos el prefijo + validamos
    # que al menos 1 hit en la capa memory se ha registrado.
    import re
    m = re.search(
        r'intelligence_layer_cache_hits_total\{engine="master",layer="memory"\}\s+(\d+(?:\.\d+)?)',
        body,
    )
    assert m is not None, f"métrica no encontrada:\n{body}"
    assert float(m.group(1)) >= 1.0
