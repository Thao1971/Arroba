"""Tests del SemanticProvider · Fase B.6.c.

Cubre:
  * `profile` 200/404, mapping, engine_version arroba-semantic-v1
  * `similar` 200/404 + matched_dimensions (dict o string)
  * `search` 200 count=0 · 200 con results · cnae_section opcional
  * `schema` GET / mapping
  * `catalog` GET / mapping
  * R12 permanente: never calls /master/*
  * Single-flight en `search` (2 requests concurrentes → 1 llamada real)
  * Cache hit/miss
  * Zero leak del `semantic-intelligence-v1` externo al frontend
"""
from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock

import httpx
import pytest

from src.modules.intelligence_layer.cache import (
    IntelligenceCache,
    MemoryCache,
    MongoCache,
    reset_cache_for_tests,
)
from src.modules.intelligence_layer.config import (
    IntelligenceSettings,
    reset_intelligence_settings_cache,
)
from src.modules.intelligence_layer.interfaces.semantic import (
    SemanticNotFoundError,
    SemanticProfile,
    SemanticProviderError,
    SemanticProvider,
)
from src.modules.intelligence_layer.providers.agency_tool.client import AgencyToolClient
from src.modules.intelligence_layer.providers.agency_tool.semantic import (
    INTERNAL_ENGINE_VERSION,
    SEMANTIC_CATALOG_PATH,
    SEMANTIC_PROFILE_PATH,
    SEMANTIC_SCHEMA_PATH,
    SEMANTIC_SEARCH_PATH,
    SEMANTIC_SIMILAR_PATH,
    AgencyToolSemanticProvider,
)
from src.modules.intelligence_layer.router import (
    IntelligenceRouter,
    reset_intelligence_router_for_tests,
)


def _mk_response(status: int, body: dict | None = None) -> httpx.Response:
    return httpx.Response(status, json=body or {})


def _mk_client_with(*responses: httpx.Response) -> AgencyToolClient:
    client = AgencyToolClient(
        IntelligenceSettings(agency_tool_mode="real", arroba_service_api_key_primary="k")
    )
    client.request = AsyncMock(side_effect=list(responses))  # type: ignore[method-assign]
    return client


@pytest.fixture(autouse=True)
def _reset_all():
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()
    yield
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()


# ---------- profile ----------


@pytest.mark.asyncio
async def test_profile_maps_full_payload():
    body = {
        "master_id": "mc_abc",
        "cif_normalized": "B47820150",
        "activities": ["Consultoría estratégica", "Análisis financiero"],
        "products_services": ["Reports", "Advisory"],
        "markets": ["Iberia", "LatAm"],
        "keywords": ["M&A", "buy-side"],
        "value_proposition": "Asesoramiento M&A a mid-market.",
        "business_model": "B2B consulting",
        "engine_version": "semantic-intelligence-v1",
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolSemanticProvider(client=client)

    result = await provider.profile("B47820150")

    args, kwargs = client.request.await_args
    assert args[0] == "POST" and args[1] == SEMANTIC_PROFILE_PATH
    assert kwargs["json"] == {"identifier": "B47820150"}

    assert result.master_id == "mc_abc"
    assert result.activities == ["Consultoría estratégica", "Análisis financiero"]
    assert result.products_services == ["Reports", "Advisory"]
    assert result.value_proposition.startswith("Asesoramiento")
    # ---- R5: contrato interno decoupled ----
    assert result.engine_version == INTERNAL_ENGINE_VERSION == "arroba-semantic-v1"
    assert result.engine_version != "semantic-intelligence-v1"


@pytest.mark.asyncio
async def test_profile_raises_not_found_on_404():
    client = _mk_client_with(_mk_response(404, {"detail": "not found"}))
    provider = AgencyToolSemanticProvider(client=client)
    with pytest.raises(SemanticNotFoundError):
        await provider.profile("B99999999")


@pytest.mark.asyncio
async def test_profile_raises_unauthorized_on_401():
    client = _mk_client_with(_mk_response(401))
    provider = AgencyToolSemanticProvider(client=client)
    with pytest.raises(SemanticProviderError) as exc_info:
        await provider.profile("B47820150")
    assert exc_info.value.error_class == "unauthorized"


# ---------- similar ----------


@pytest.mark.asyncio
async def test_similar_maps_results_with_matched_dimensions():
    body = {
        "master_id": "mc_abc",
        "cif_normalized": "B47820150",
        "results": [
            {
                "master_id": "mc_peer1",
                "name": "Peer Uno",
                "similarity_score": 0.92,
                "matched_dimensions": [
                    {"dimension": "activities", "score": 0.95},
                    {"dimension": "markets", "score": 0.88},
                ],
                "cnae_section": "M",
            },
            {
                "master_id": "mc_peer2",
                "name": "Peer Dos",
                "similarity_score": 0.81,
                "matched_dimensions": ["products_services"],  # string legacy
            },
        ],
        "count": 2,
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolSemanticProvider(client=client)

    sim = await provider.similar("B47820150", limit=5)

    args, kwargs = client.request.await_args
    assert args[1] == SEMANTIC_SIMILAR_PATH
    assert kwargs["json"] == {"identifier": "B47820150", "limit": 5, "same_section": True}

    assert sim.count == 2
    assert len(sim.items) == 2
    assert sim.items[0].similarity_score == 0.92
    assert sim.items[0].matched_dimensions[0].dimension == "activities"
    assert sim.items[0].matched_dimensions[0].score == 0.95
    # Segundo peer usa formato string legacy
    assert sim.items[1].matched_dimensions[0].dimension == "products_services"
    assert sim.engine_version == INTERNAL_ENGINE_VERSION


@pytest.mark.asyncio
async def test_similar_raises_not_found_on_404():
    client = _mk_client_with(_mk_response(404))
    provider = AgencyToolSemanticProvider(client=client)
    with pytest.raises(SemanticNotFoundError):
        await provider.similar("B99999999")


# ---------- search ----------


@pytest.mark.asyncio
async def test_search_returns_empty_when_count_zero():
    body = {
        "query": "hotel",
        "backend": "local-topk-v1",
        "count": 0,
        "results": [],
        "engine_version": "semantic-intelligence-v1",
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolSemanticProvider(client=client)

    res = await provider.search("hotel", limit=5)

    args, kwargs = client.request.await_args
    assert args[1] == SEMANTIC_SEARCH_PATH
    assert kwargs["json"] == {"query": "hotel", "limit": 5}

    assert res.count == 0
    assert res.results == []
    assert res.backend == "local-topk-v1"
    assert res.engine_version == INTERNAL_ENGINE_VERSION


@pytest.mark.asyncio
async def test_search_with_cnae_section_forwarded():
    body = {"query": "consultoria", "count": 1, "results": [
        {"master_id": "mc_1", "name": "Uno", "similarity_score": 0.7, "cnae_section": "M"}
    ]}
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolSemanticProvider(client=client)

    res = await provider.search("consultoria", limit=3, cnae_section="M")

    _, kwargs = client.request.await_args
    assert kwargs["json"] == {"query": "consultoria", "limit": 3, "cnae_section": "M"}
    assert res.count == 1
    assert res.results[0].master_id == "mc_1"
    assert res.results[0].cnae_section == "M"


# ---------- schema / catalog ----------


@pytest.mark.asyncio
async def test_schema_maps_response():
    body = {
        "fields": {
            "activities": {"type": "array", "items": "string"},
            "value_proposition": {"type": "string"},
        },
        "version": "profile-schema-v1",
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolSemanticProvider(client=client)
    s = await provider.schema()
    args, _ = client.request.await_args
    assert args[0] == "GET" and args[1] == SEMANTIC_SCHEMA_PATH
    assert s.version == "profile-schema-v1"
    assert "activities" in s.fields
    assert s.engine_version == INTERNAL_ENGINE_VERSION


@pytest.mark.asyncio
async def test_catalog_maps_response():
    body = {
        "activities": ["A1", "A2"],
        "products": ["P1"],
        "markets": ["Iberia"],
        "business_models": ["B2B"],
        "version": "cat-v1",
    }
    client = _mk_client_with(_mk_response(200, body))
    provider = AgencyToolSemanticProvider(client=client)
    c = await provider.catalog()
    args, _ = client.request.await_args
    assert args[1] == SEMANTIC_CATALOG_PATH
    assert c.activities == ["A1", "A2"]
    assert c.products == ["P1"]
    assert c.business_models == ["B2B"]
    assert c.engine_version == INTERNAL_ENGINE_VERSION


# ---------- R12 permanente en Semantic ----------


@pytest.mark.asyncio
async def test_semantic_provider_never_calls_master_admin():
    """20 requests mezclados → 0 llamadas a `/api/v1/master/*`."""
    responses = [
        _mk_response(200, {"master_id": f"mc_{i}", "activities": [], "engine_version": "v1"})
        for i in range(30)
    ]
    client = _mk_client_with(*responses)
    provider = AgencyToolSemanticProvider(client=client)

    for i in range(5):
        await provider.profile(f"B{i:08d}")
    for i in range(5):
        await provider.similar(f"B{i:08d}", limit=3)
    for i in range(5):
        await provider.search(f"query-{i}", limit=3)
    await provider.schema()
    await provider.catalog()

    all_paths = [call.args[1] for call in client.request.await_args_list]
    for p in all_paths:
        assert "/master/" not in p, f"R12 VIOLATION: Semantic llamó a {p}"
    assert set(all_paths).issubset(
        {
            SEMANTIC_PROFILE_PATH,
            SEMANTIC_SIMILAR_PATH,
            SEMANTIC_SEARCH_PATH,
            SEMANTIC_SCHEMA_PATH,
            SEMANTIC_CATALOG_PATH,
        }
    )


# ---------- Router integration: cache + single-flight ----------


@pytest.mark.asyncio
async def test_router_caches_semantic_profile(mock_db):
    """Segunda llamada al mismo CIF debe venir de cache."""

    class _FakeSem(SemanticProvider):
        provider_name = "agency_tool"

        async def profile(self, cif):
            return SemanticProfile(
                master_id="mc1", cif_normalized=cif, activities=["A"],
                engine_version="arroba-semantic-v1",
            )

        async def similar(self, cif, limit=10):
            raise NotImplementedError

        async def search(self, query, limit=10, cnae_section=None):
            raise NotImplementedError

        async def schema(self):
            raise NotImplementedError

        async def catalog(self):
            raise NotImplementedError

    fake = _FakeSem()
    fake.profile = AsyncMock(  # type: ignore[method-assign]
        return_value=SemanticProfile(
            master_id="mc1", cif_normalized="B47820150",
            activities=["A"], engine_version="arroba-semantic-v1",
        )
    )

    settings = IntelligenceSettings(agency_tool_mode="real",
                                    arroba_service_api_key_primary="k")
    router = IntelligenceRouter(
        settings=settings,
        cache=IntelligenceCache(memory=MemoryCache(), mongo=MongoCache()),
    )
    router._semantic_provider = fake

    await router.get_semantic_profile("B47820150")
    await router.get_semantic_profile("B47820150")
    assert fake.profile.await_count == 1  # cache hit en 2ª


@pytest.mark.asyncio
async def test_router_search_dedupes_concurrent_calls(mock_db):
    """2 requests concurrentes con la misma query → 1 sola llamada real (single-flight)."""

    calls = 0
    release = asyncio.Event()

    class _FakeSem(SemanticProvider):
        provider_name = "agency_tool"

        async def profile(self, cif):
            raise NotImplementedError

        async def similar(self, cif, limit=10):
            raise NotImplementedError

        async def search(self, query, limit=10, cnae_section=None):
            nonlocal calls
            calls += 1
            await release.wait()
            from src.modules.intelligence_layer.interfaces.semantic import (
                SemanticSearchResponse,
            )
            return SemanticSearchResponse(
                query=query, count=1,
                results=[], backend="mock", engine_version="arroba-semantic-v1",
            )

        async def schema(self):
            raise NotImplementedError

        async def catalog(self):
            raise NotImplementedError

    settings = IntelligenceSettings(agency_tool_mode="real",
                                    arroba_service_api_key_primary="k")
    router = IntelligenceRouter(
        settings=settings,
        cache=IntelligenceCache(memory=MemoryCache(), mongo=MongoCache()),
    )
    router._semantic_provider = _FakeSem()

    async def caller():
        return await router.semantic_search("hotel", limit=5)

    tasks = [asyncio.create_task(caller()) for _ in range(3)]
    await asyncio.sleep(0.05)
    release.set()
    results = await asyncio.gather(*tasks)
    assert calls == 1  # single-flight
    assert all(r.count == 1 for r in results)
