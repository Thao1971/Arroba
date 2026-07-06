"""Tests de regresión permanente para la Regla Canónica R12.

R12: arroba NUNCA consume `/api/v1/master/*` (auth JWT admin, fuera del snapshot público).

Estos tests DEBEN mantenerse verdes indefinidamente. Cualquier PR que introduzca:
  * strings `/api/v1/master/`
  * `Authorization: Bearer`
  * cliente HTTP contra Master admin

...romperá `test_r12_no_master_endpoint_references_in_providers` y bloqueará el merge.
"""
from __future__ import annotations

from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolClient,
    AgencyToolHTTPError,
)
from src.modules.intelligence_layer.providers.agency_tool.identity import (
    ENGINE_VERSION,
    FINANCIAL_ANALYZE_PATH,
    SEMANTIC_SEARCH_PATH,
    AgencyToolIdentityResolver,
)

PROVIDERS_DIR = Path(__file__).resolve().parent.parent.parent / "src" / "modules" / "intelligence_layer"


# ============================================================
# Regresión estática: grep del código fuente de intelligence_layer
# ============================================================


# Archivos permitidos para mencionar la ruta prohibida — son declarativos
# (docstrings de contrato, guards runtime que bloquean, mensajes de error).
# Un fichero nuevo que contenga la ruta prohibida hará fallar el test.
R12_ALLOWLIST = {
    # Guard runtime — bloquea la ruta activamente.
    "providers/agency_tool/client.py",
    # Documentación del contrato interno §6.1 (define la restricción).
    "interfaces/master.py",
    # Documentación de por qué existe este resolver alternativo.
    "providers/agency_tool/identity.py",
    # Router — mención en docstring (R12 se aplica desde aquí).
    "router.py",
    # Endpoints — mención en docstring de contrato.
    "endpoints.py",
}


def _iter_python_files(root: Path):
    for p in root.rglob("*.py"):
        # Ignoramos archivos que documentan la regla (tienen prefijo "test_r12_" o menciones legítimas).
        if p.name == "test_r12_regression.py":
            continue
        yield p


def test_r12_no_master_admin_paths_in_source():
    """Ningún archivo NUEVO bajo `intelligence_layer/` puede introducir referencias
    a `/api/v1/master/*`. La allowlist enumera los archivos donde la mención es
    puramente documental o defensiva (guards, docstrings, tests).
    """
    forbidden_substring = "/api/v1/master/"
    offenders: list[tuple[str, int, str]] = []
    for path in _iter_python_files(PROVIDERS_DIR):
        rel_key = str(path.relative_to(PROVIDERS_DIR))
        if rel_key in R12_ALLOWLIST or rel_key.replace("\\", "/") in R12_ALLOWLIST:
            continue
        for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            if forbidden_substring in line:
                offenders.append((str(path), i, line))
    assert not offenders, (
        "R12 VIOLATION: fichero NUEVO menciona `/api/v1/master/`. "
        "Si es documental/defensivo legítimo, añádelo a R12_ALLOWLIST y explica por qué.\n"
        + "\n".join(f"  {p}:{i}: {ln}" for p, i, ln in offenders)
    )


def test_r12_no_authorization_bearer_in_providers():
    """Ningún archivo bajo `providers/agency_tool/` debe usar `Authorization: Bearer`."""
    forbidden = "Authorization"
    offenders: list[tuple[str, int, str]] = []
    for path in _iter_python_files(PROVIDERS_DIR / "providers" / "agency_tool"):
        for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            if forbidden in line and "Bearer" in line:
                offenders.append((str(path), i, line))
    assert not offenders, (
        "R12 VIOLATION: uso de Authorization: Bearer encontrado en providers:\n"
        + "\n".join(f"  {p}:{i}: {ln}" for p, i, ln in offenders)
    )


# ============================================================
# Regresión runtime: guard del cliente HTTP
# ============================================================


@pytest.mark.asyncio
async def test_client_blocks_master_admin_paths_at_source():
    """`AgencyToolClient.request` debe rechazar cualquier ruta `/api/v1/master/*`."""
    from src.modules.intelligence_layer.config import IntelligenceSettings

    client = AgencyToolClient(
        IntelligenceSettings(agency_tool_mode="real", arroba_service_api_key_primary="k")
    )
    for path in [
        "/api/v1/master/stats",
        "/api/v1/master/mc_test",
        "/api/v1/master",
        "/api/v1/master/resolve",
    ]:
        with pytest.raises(AgencyToolHTTPError) as exc_info:
            await client.request("GET", path)
        assert "R12" in str(exc_info.value)


# ============================================================
# Identity Resolver — patrón §0.2.3 (Financial → Semantic → 404)
# ============================================================


def _mk_http_response(status_code: int, body: dict | None = None) -> httpx.Response:
    return httpx.Response(status_code, json=body or {})


def _mk_client_with_responses(*responses: httpx.Response) -> AgencyToolClient:
    """Crea un AgencyToolClient cuyo `.request(...)` devuelve responses en orden."""
    from src.modules.intelligence_layer.config import IntelligenceSettings

    client = AgencyToolClient(
        IntelligenceSettings(agency_tool_mode="real", arroba_service_api_key_primary="k")
    )
    client.request = AsyncMock(side_effect=list(responses))  # type: ignore[method-assign]
    return client


@pytest.mark.asyncio
async def test_identity_resolver_uses_financial_analyze_first():
    """Cuando Financial responde 200, NO se llama a Semantic."""
    financial_body = {
        "master_id": "mc_xyz",
        "cif_normalized": "B47820150",
        "identity": {"legal_name": "Acme SL", "cif": "B47820150", "country": "ES"},
        "classification": {"cnae_description": "Consultoría"},
        "location": {"provincia": "Madrid"},
        "kpis": {"revenue": 1_000_000, "ebitda": 200_000, "year": 2024},
    }
    client = _mk_client_with_responses(_mk_http_response(200, financial_body))
    resolver = AgencyToolIdentityResolver(client=client)

    record = await resolver.get_by_cif("B47820150")

    # 1 sola llamada (a Financial), NUNCA a Semantic.
    assert client.request.await_count == 1
    args, kwargs = client.request.await_args
    assert args[0] == "POST"
    assert args[1] == FINANCIAL_ANALYZE_PATH
    assert kwargs["json"] == {"identifier": "B47820150"}

    assert record.master_id == "mc_xyz"
    assert record.identity.legal_name == "Acme SL"
    assert record.financials.latest.revenue == 1_000_000
    assert record.engine_version == ENGINE_VERSION


@pytest.mark.asyncio
async def test_identity_resolver_falls_back_to_semantic_search():
    """Cuando Financial devuelve 404, se intenta Semantic."""
    semantic_body = {
        "query": "B47820150",
        "count": 1,
        "results": [
            {
                "master_id": "mc_from_semantic",
                "cif_normalized": "B47820150",
                "name": "Empresa Semantic SL",
                "score": 0.95,
                "provincia": "Madrid",
            }
        ],
        "backend": "local-topk-v1",
        "engine_version": "semantic-intelligence-v1",
    }
    client = _mk_client_with_responses(
        _mk_http_response(404, {"detail": "company not found in Master Layer"}),
        _mk_http_response(200, semantic_body),
    )
    resolver = AgencyToolIdentityResolver(client=client)

    record = await resolver.get_by_cif("B47820150")

    assert client.request.await_count == 2
    _, kwargs2 = client.request.await_args_list[1]
    assert client.request.await_args_list[1].args[1] == SEMANTIC_SEARCH_PATH
    assert kwargs2["json"] == {"query": "B47820150", "limit": 1}

    assert record.master_id == "mc_from_semantic"
    assert record.identity.legal_name == "Empresa Semantic SL"
    # Sin datos financieros por vía semantic → latest queda vacío.
    assert record.financials.latest is None or record.financials.latest.revenue is None


@pytest.mark.asyncio
async def test_identity_resolver_returns_unavailable_when_both_engines_404():
    """Financial 404 + Semantic count=0 → MasterNotFoundError."""
    from src.modules.intelligence_layer.interfaces.master import MasterNotFoundError

    client = _mk_client_with_responses(
        _mk_http_response(404, {"detail": "company not found in Master Layer"}),
        _mk_http_response(200, {"query": "B99999999", "count": 0, "results": []}),
    )
    resolver = AgencyToolIdentityResolver(client=client)

    with pytest.raises(MasterNotFoundError):
        await resolver.get_by_cif("B99999999")

    assert client.request.await_count == 2


@pytest.mark.asyncio
async def test_identity_resolver_returns_unavailable_when_semantic_also_404():
    """Financial 404 + Semantic 404 → MasterNotFoundError."""
    from src.modules.intelligence_layer.interfaces.master import MasterNotFoundError

    client = _mk_client_with_responses(
        _mk_http_response(404),
        _mk_http_response(404),
    )
    resolver = AgencyToolIdentityResolver(client=client)

    with pytest.raises(MasterNotFoundError):
        await resolver.get_by_cif("B99999999")


@pytest.mark.asyncio
async def test_identity_resolver_never_calls_master_admin():
    """Con 20 requests distintas, el mock del cliente NUNCA recibe path `/master/*`."""
    client = _mk_client_with_responses(
        *[_mk_http_response(404) for _ in range(40)]
    )
    resolver = AgencyToolIdentityResolver(client=client)

    from src.modules.intelligence_layer.interfaces.master import MasterNotFoundError

    for i in range(20):
        with pytest.raises(MasterNotFoundError):
            await resolver.get_by_cif(f"B{i:08d}")

    # Verificamos TODOS los paths llamados
    called_paths = [call.args[1] for call in client.request.await_args_list]
    for p in called_paths:
        assert "/master/" not in p, f"R12 VIOLATION: se llamó a {p}"
    # Los paths permitidos son exactamente estos dos.
    assert set(called_paths).issubset({FINANCIAL_ANALYZE_PATH, SEMANTIC_SEARCH_PATH})


@pytest.mark.asyncio
async def test_identity_resolver_get_by_id_raises_by_r12():
    """`get_by_id` está deshabilitado por R12."""
    from src.modules.intelligence_layer.interfaces.master import MasterProviderError

    resolver = AgencyToolIdentityResolver(client=MagicMock())
    with pytest.raises(MasterProviderError) as exc_info:
        await resolver.get_by_id("mc_test")
    assert "R12" in str(exc_info.value)


# ============================================================
# Caché del mapping cif ↔ master_id (TTL 24h por R12 §0.2.3)
# ============================================================


@pytest.mark.asyncio
async def test_cif_to_master_id_mapping_cached_24h(mock_db):
    """El router debe cachear la respuesta de identidad con TTL 24h por defecto."""
    from src.modules.intelligence_layer.config import IntelligenceSettings
    from src.modules.intelligence_layer.router import IDENTITY_MAPPING_TTL_SECONDS

    settings = IntelligenceSettings()
    assert settings.ttl_for("master") == IDENTITY_MAPPING_TTL_SECONDS == 86_400
