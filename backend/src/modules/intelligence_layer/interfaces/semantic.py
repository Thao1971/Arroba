"""Contrato `SemanticProvider` + DTOs para `semantic-intelligence` §6.5.

Schema replica el pack §6.5 del contrato público `arroba-integration-contract-v1`,
con **renombre del `engine_version` interno** a `arroba-semantic-v1`.
El frontend NUNCA ve `semantic-intelligence-v1`.

Congelado. R4: NUNCA se calcula `similarity_score` ni se derivan `keywords` en
arroba — es responsabilidad del engine. Este módulo es transporte tipado.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# ---------- SemanticProfile (§6.5 profile) ----------


class SemanticProfile(BaseModel):
    """Contrato interno frozen para `/api/companies/{cif}/profile`."""

    model_config = ConfigDict(extra="ignore")

    master_id: str | None = None
    cif_normalized: str | None = None
    # Sub-dimensiones semánticas (arrays de strings)
    activities: list[str] = Field(default_factory=list)
    products_services: list[str] = Field(default_factory=list)
    markets: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    # Narrativa
    value_proposition: str | None = None
    business_model: str | None = None
    # Metadatos del engine
    engine_version: str | None = None
    generated_at: datetime | None = None


# ---------- SimilarCompany ----------


class SimilarMatchedDimension(BaseModel):
    model_config = ConfigDict(extra="ignore")
    dimension: str
    score: float | None = None


class SimilarCompany(BaseModel):
    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    name: str | None = None
    similarity_score: float | None = None
    matched_dimensions: list[SimilarMatchedDimension] = Field(default_factory=list)
    cnae_section: str | None = None
    provincia: str | None = None


class SimilarCompanies(BaseModel):
    """Contrato interno frozen para `/api/companies/{cif}/similar`."""

    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    items: list[SimilarCompany] = Field(default_factory=list)
    count: int = 0
    engine_version: str | None = None
    generated_at: datetime | None = None


# ---------- SemanticSearch ----------


class SemanticSearchResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    name: str | None = None
    legal_name: str | None = None
    similarity_score: float | None = None
    cnae_section: str | None = None
    provincia: str | None = None


class SemanticSearchResponse(BaseModel):
    """Contrato interno frozen para `POST /api/entities/semantic-search`."""

    model_config = ConfigDict(extra="ignore")
    query: str
    count: int = 0
    results: list[SemanticSearchResult] = Field(default_factory=list)
    backend: str | None = None
    engine_version: str | None = None
    generated_at: datetime | None = None


# ---------- SemanticSchema / Catalog ----------


class SemanticSchema(BaseModel):
    """Schema del profile expuesto por el proveedor."""

    model_config = ConfigDict(extra="ignore")
    fields: dict = Field(default_factory=dict)
    version: str | None = None
    engine_version: str | None = None
    generated_at: datetime | None = None


class SemanticCatalog(BaseModel):
    """Taxonomías semánticas expuestas por el proveedor."""

    model_config = ConfigDict(extra="ignore")
    activities: list[str] = Field(default_factory=list)
    products: list[str] = Field(default_factory=list)
    markets: list[str] = Field(default_factory=list)
    business_models: list[str] = Field(default_factory=list)
    version: str | None = None
    engine_version: str | None = None
    generated_at: datetime | None = None


# ---------- Interfaz del proveedor ----------


class SemanticProvider(ABC):
    """Contrato que cualquier proveedor Semantic debe cumplir."""

    provider_name: str  # "mock" | "agency_tool"

    @abstractmethod
    async def profile(self, cif: str) -> SemanticProfile:
        """`POST /semantic-intelligence/profile {"identifier": cif}` (§6.5)."""
        ...

    @abstractmethod
    async def similar(self, cif: str, limit: int = 10) -> SimilarCompanies:
        """`POST /semantic-intelligence/similar {"identifier": cif, "limit": limit}` (§6.5)."""
        ...

    @abstractmethod
    async def search(
        self, query: str, limit: int = 10, cnae_section: str | None = None
    ) -> SemanticSearchResponse:
        """`POST /semantic-intelligence/search {"query": ..., "limit": ..., "cnae_section?"}` (§6.5)."""
        ...

    @abstractmethod
    async def schema(self) -> SemanticSchema:
        """`GET /semantic-intelligence/profile/schema` (§6.5, cacheado 24h)."""
        ...

    @abstractmethod
    async def catalog(self) -> SemanticCatalog:
        """`GET /semantic-intelligence/catalog` (§6.5, cacheado 24h)."""
        ...


class SemanticNotFoundError(LookupError):
    """El proveedor devolvió 404 (empresa no encontrada)."""


class SemanticProviderError(RuntimeError):
    """Fallo transitorio del proveedor Semantic."""

    def __init__(self, message: str, *, error_class: str = "server_5xx") -> None:
        super().__init__(message)
        self.error_class = error_class


__all__ = [
    "SemanticProfile",
    "SimilarCompany",
    "SimilarCompanies",
    "SimilarMatchedDimension",
    "SemanticSearchResult",
    "SemanticSearchResponse",
    "SemanticSchema",
    "SemanticCatalog",
    "SemanticProvider",
    "SemanticNotFoundError",
    "SemanticProviderError",
]
