"""MockSemanticProvider — devuelve `unavailable` conforme (no inventa datos).

R4/R10: NUNCA derivamos keywords ni calculamos similarity en arroba. Este mock
existe solo para cobertura de tests independiente del modo real y para dev/local.

Devuelve:
  * `profile(cif)` → `SemanticNotFoundError`
  * `similar(cif)` → `SemanticNotFoundError`
  * `search(query)` → payload vacío `count=0` (no error — el buscador debe seguir vivo)
  * `schema()` → schema vacío estable
  * `catalog()` → catálogo vacío estable
"""
from __future__ import annotations

from datetime import UTC, datetime

from src.modules.intelligence_layer.interfaces.semantic import (
    SemanticCatalog,
    SemanticNotFoundError,
    SemanticProfile,
    SemanticProvider,
    SemanticSchema,
    SemanticSearchResponse,
    SimilarCompanies,
)

ENGINE_VERSION_MOCK = "mock-semantic-v1"


class MockSemanticProvider(SemanticProvider):
    provider_name = "mock"

    async def profile(self, cif: str) -> SemanticProfile:
        raise SemanticNotFoundError(f"cif={cif.upper()} (mock: sin profile semántico)")

    async def similar(self, cif: str, limit: int = 10) -> SimilarCompanies:
        raise SemanticNotFoundError(f"cif={cif.upper()} (mock: sin similares)")

    async def search(
        self, query: str, limit: int = 10, cnae_section: str | None = None
    ) -> SemanticSearchResponse:
        # El buscador siempre responde 200 (aunque sea vacío). El frontend renderiza
        # "sin resultados" — no es un error.
        return SemanticSearchResponse(
            query=query,
            count=0,
            results=[],
            backend="mock-empty",
            engine_version=ENGINE_VERSION_MOCK,
            generated_at=datetime.now(UTC),
        )

    async def schema(self) -> SemanticSchema:
        return SemanticSchema(
            fields={
                "activities": {"type": "array", "items": "string"},
                "products_services": {"type": "array", "items": "string"},
                "markets": {"type": "array", "items": "string"},
                "keywords": {"type": "array", "items": "string"},
                "value_proposition": {"type": "string"},
                "business_model": {"type": "string"},
            },
            version="mock-1",
            engine_version=ENGINE_VERSION_MOCK,
            generated_at=datetime.now(UTC),
        )

    async def catalog(self) -> SemanticCatalog:
        return SemanticCatalog(
            activities=[],
            products=[],
            markets=[],
            business_models=[],
            version="mock-1",
            engine_version=ENGINE_VERSION_MOCK,
            generated_at=datetime.now(UTC),
        )


__all__ = ["MockSemanticProvider", "ENGINE_VERSION_MOCK"]
