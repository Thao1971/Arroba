"""AgencyToolSemanticProvider — llamada a `semantic-intelligence` con X-API-Key (R12).

Endpoints públicos consumidos:
  * POST /api/v1/semantic-intelligence/profile
  * POST /api/v1/semantic-intelligence/similar
  * POST /api/v1/semantic-intelligence/search
  * GET  /api/v1/semantic-intelligence/profile/schema
  * GET  /api/v1/semantic-intelligence/catalog

`engine_version` del proveedor (`semantic-intelligence-v1`) se traduce en el DTO
interno a `arroba-semantic-v1` (R5: contrato interno decoupled).

R4: NUNCA calculamos similarity ni derivamos keywords en arroba.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from src.core.logging import get_logger
from src.modules.intelligence_layer.interfaces.semantic import (
    SemanticCatalog,
    SemanticNotFoundError,
    SemanticProfile,
    SemanticProvider,
    SemanticProviderError,
    SemanticSchema,
    SemanticSearchResponse,
    SemanticSearchResult,
    SimilarCompanies,
    SimilarCompany,
    SimilarMatchedDimension,
)
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolClient,
    AgencyToolHTTPError,
    get_agency_tool_client,
)

log = get_logger("intelligence_layer.provider.agency_tool.semantic")

SEMANTIC_PROFILE_PATH = "/api/v1/semantic-intelligence/profile"
SEMANTIC_SIMILAR_PATH = "/api/v1/semantic-intelligence/similar"
SEMANTIC_SEARCH_PATH = "/api/v1/semantic-intelligence/search"
SEMANTIC_SCHEMA_PATH = "/api/v1/semantic-intelligence/profile/schema"
SEMANTIC_CATALOG_PATH = "/api/v1/semantic-intelligence/catalog"

# `engine_version` que arroba emite al frontend (R5).
INTERNAL_ENGINE_VERSION = "arroba-semantic-v1"


class AgencyToolSemanticProvider(SemanticProvider):
    provider_name = "agency_tool"

    def __init__(self, client: AgencyToolClient | None = None) -> None:
        self._client = client or get_agency_tool_client()

    # ---------- profile ----------
    async def profile(self, cif: str) -> SemanticProfile:
        cif_norm = cif.upper().strip()
        data = await self._post(SEMANTIC_PROFILE_PATH, {"identifier": cif_norm}, allow_404=True)
        if data is None:
            raise SemanticNotFoundError(f"cif={cif_norm}")
        return SemanticProfile(
            master_id=data.get("master_id"),
            cif_normalized=data.get("cif_normalized") or cif_norm,
            activities=data.get("activities") or [],
            products_services=data.get("products_services") or data.get("products") or [],
            markets=data.get("markets") or [],
            keywords=data.get("keywords") or [],
            value_proposition=data.get("value_proposition"),
            business_model=data.get("business_model"),
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )

    # ---------- similar ----------
    async def similar(self, cif: str, limit: int = 10) -> SimilarCompanies:
        cif_norm = cif.upper().strip()
        payload = {"identifier": cif_norm, "limit": limit, "same_section": True}
        data = await self._post(SEMANTIC_SIMILAR_PATH, payload, allow_404=True)
        if data is None:
            raise SemanticNotFoundError(f"cif={cif_norm}")

        # El pack §6.5 devuelve `results[]` con {master_id, similarity_score, matched_dimensions[]}.
        items_raw = data.get("results") or data.get("items") or []
        items = [self._map_similar_item(item) for item in items_raw]
        return SimilarCompanies(
            master_id=data.get("master_id") or data.get("subject", {}).get("master_id"),
            cif_normalized=data.get("cif_normalized") or cif_norm,
            items=items,
            count=data.get("count", len(items)),
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )

    # ---------- search ----------
    async def search(
        self, query: str, limit: int = 10, cnae_section: str | None = None
    ) -> SemanticSearchResponse:
        payload: dict[str, Any] = {"query": query, "limit": limit}
        if cnae_section:
            payload["cnae_section"] = cnae_section
        data = await self._post(SEMANTIC_SEARCH_PATH, payload, allow_404=False)
        results_raw = data.get("results") or []
        return SemanticSearchResponse(
            query=query,
            count=data.get("count", len(results_raw)),
            results=[self._map_search_result(r) for r in results_raw],
            backend=data.get("backend"),
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )

    # ---------- schema (GET) ----------
    async def schema(self) -> SemanticSchema:
        data = await self._get(SEMANTIC_SCHEMA_PATH)
        return SemanticSchema(
            fields=data.get("fields") or data.get("schema") or {},
            version=data.get("version"),
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )

    # ---------- catalog (GET) ----------
    async def catalog(self) -> SemanticCatalog:
        data = await self._get(SEMANTIC_CATALOG_PATH)
        return SemanticCatalog(
            activities=data.get("activities") or [],
            products=data.get("products") or data.get("products_services") or [],
            markets=data.get("markets") or [],
            business_models=data.get("business_models") or [],
            version=data.get("version"),
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )

    # ---------- helpers HTTP ----------
    async def _post(
        self, path: str, payload: dict, *, allow_404: bool
    ) -> dict | None:
        try:
            resp = await self._client.request("POST", path, json=payload)
        except AgencyToolHTTPError as exc:
            raise SemanticProviderError(str(exc), error_class=exc.error_class) from exc
        return self._handle_response(resp, allow_404=allow_404)

    async def _get(self, path: str) -> dict:
        try:
            resp = await self._client.request("GET", path)
        except AgencyToolHTTPError as exc:
            raise SemanticProviderError(str(exc), error_class=exc.error_class) from exc
        data = self._handle_response(resp, allow_404=False)
        assert data is not None
        return data

    def _handle_response(self, resp, *, allow_404: bool) -> dict | None:
        if resp.status_code == 404:
            if allow_404:
                return None
            raise SemanticProviderError("not_found", error_class="client_4xx")
        if resp.status_code in (401, 403):
            raise SemanticProviderError(
                f"unauthorized {resp.status_code}", error_class="unauthorized"
            )
        if resp.status_code >= 500:
            raise SemanticProviderError(
                f"upstream {resp.status_code}", error_class="server_5xx"
            )
        if resp.status_code != 200:
            raise SemanticProviderError(
                f"unexpected {resp.status_code}", error_class="client_4xx"
            )
        try:
            return resp.json()
        except ValueError as exc:
            raise SemanticProviderError(
                f"invalid JSON: {exc}", error_class="server_5xx"
            ) from exc

    # ---------- mapping ----------
    def _map_similar_item(self, item: dict) -> SimilarCompany:
        dims_raw = item.get("matched_dimensions") or []
        dims: list[SimilarMatchedDimension] = []
        for d in dims_raw:
            if isinstance(d, dict):
                dims.append(
                    SimilarMatchedDimension(
                        dimension=d.get("dimension") or d.get("name") or "unknown",
                        score=d.get("score"),
                    )
                )
            elif isinstance(d, str):
                dims.append(SimilarMatchedDimension(dimension=d))
        return SimilarCompany(
            master_id=item.get("master_id"),
            cif_normalized=item.get("cif_normalized"),
            name=item.get("name") or item.get("legal_name"),
            similarity_score=item.get("similarity_score") or item.get("score"),
            matched_dimensions=dims,
            cnae_section=item.get("cnae_section"),
            provincia=item.get("provincia"),
        )

    def _map_search_result(self, item: dict) -> SemanticSearchResult:
        return SemanticSearchResult(
            master_id=item.get("master_id"),
            cif_normalized=item.get("cif_normalized"),
            name=item.get("name") or item.get("legal_name"),
            legal_name=item.get("legal_name"),
            similarity_score=item.get("similarity_score") or item.get("score"),
            cnae_section=item.get("cnae_section"),
            provincia=item.get("provincia"),
        )


__all__ = [
    "AgencyToolSemanticProvider",
    "INTERNAL_ENGINE_VERSION",
    "SEMANTIC_PROFILE_PATH",
    "SEMANTIC_SIMILAR_PATH",
    "SEMANTIC_SEARCH_PATH",
    "SEMANTIC_SCHEMA_PATH",
    "SEMANTIC_CATALOG_PATH",
]
