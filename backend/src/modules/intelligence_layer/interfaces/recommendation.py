"""Contrato `RecommendationProvider` + DTOs para `recommendation-intelligence` §6.6.

Transporte tipado (R4/R12): arroba NO calcula recomendaciones; mapea la salida
del motor `recommendation-intelligence/buyers` a DTOs. `engine_version` interno
→ `arroba-recommendation-v1` (R5). El frontend nunca ve el nombre del motor.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BuyerItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    name: str | None = None
    sector: str | None = None
    recommendation_type: str | None = None
    score: float | None = None
    fit_dimensions: dict = Field(default_factory=dict)  # {dimensión: peso/score}
    reason: str | None = None
    recommended_actions: list[str] = Field(default_factory=list)


class RecommendationSet(BaseModel):
    """Contrato interno frozen para `/api/companies/{cif}/buyers`."""

    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    recommendation_type: str | None = None
    count: int = 0
    recommendations: list[BuyerItem] = Field(default_factory=list)
    engine_version: str | None = None
    generated_at: datetime | None = None


class RecommendationProvider(ABC):
    provider_name: str  # "mock" | "agency_tool"

    @abstractmethod
    async def buyers(self, cif: str, limit: int = 10) -> RecommendationSet:
        """`POST /recommendation-intelligence/buyers {"identifier": cif}` (§6.6)."""
        ...

    @abstractmethod
    async def opportunities(self, cif: str, limit: int = 10) -> RecommendationSet:
        """`POST /recommendation-intelligence/opportunities {"identifier": cif}` (§6.6)."""
        ...


class RecommendationNotFoundError(LookupError):
    """El proveedor devolvió 404 (empresa no encontrada en Master Layer)."""


class RecommendationProviderError(RuntimeError):
    """Fallo transitorio del proveedor (5xx, timeout, network, unauthorized)."""

    def __init__(self, message: str, *, error_class: str = "server_5xx") -> None:
        super().__init__(message)
        self.error_class = error_class


__all__ = [
    "BuyerItem",
    "RecommendationSet",
    "RecommendationProvider",
    "RecommendationNotFoundError",
    "RecommendationProviderError",
]
