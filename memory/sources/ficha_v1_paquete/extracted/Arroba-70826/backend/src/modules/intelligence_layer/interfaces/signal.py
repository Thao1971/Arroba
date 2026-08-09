"""Contrato `SignalProvider` + DTOs para `signal-intelligence` §6.4.

Transporte tipado (R4/R12): arroba NO calcula señales; mapea 1:1 la salida del
motor `signal-intelligence/analyze` a DTOs. El `engine_version` del proveedor
(`signal-intelligence-v1`) se traduce a `arroba-signal-v1` (R5 contrato interno
decoupled). El frontend nunca ve el nombre interno del motor.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SignalItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    signal_id: str
    signal_type: str | None = None
    category: str | None = None
    severity: str | None = None
    polarity: str | None = None
    title: str | None = None
    confidence: float | None = None
    detected_at: str | None = None
    recommended_actions: list[str] = Field(default_factory=list)


class SignalScore(BaseModel):
    model_config = ConfigDict(extra="ignore")
    signal_score: float | None = None
    method: str | None = None


class SignalAnalysis(BaseModel):
    """Contrato interno frozen para `/api/companies/{cif}/signals`."""

    model_config = ConfigDict(extra="ignore")
    master_id: str | None = None
    cif_normalized: str | None = None
    signals: list[SignalItem] = Field(default_factory=list)
    score: SignalScore | None = None
    counts_by_category: dict[str, int] = Field(default_factory=dict)
    engine_version: str | None = None
    generated_at: datetime | None = None


class SignalProvider(ABC):
    provider_name: str  # "mock" | "agency_tool"

    @abstractmethod
    async def analyze(self, cif: str) -> SignalAnalysis:
        """`POST /signal-intelligence/analyze {"identifier": cif}` (§6.4)."""
        ...


class SignalNotFoundError(LookupError):
    """El proveedor devolvió 404 (empresa no encontrada en Master Layer)."""


class SignalProviderError(RuntimeError):
    """Fallo transitorio del proveedor (5xx, timeout, network, unauthorized)."""

    def __init__(self, message: str, *, error_class: str = "server_5xx") -> None:
        super().__init__(message)
        self.error_class = error_class


__all__ = [
    "SignalItem",
    "SignalScore",
    "SignalAnalysis",
    "SignalProvider",
    "SignalNotFoundError",
    "SignalProviderError",
]
