"""Config del intelligence_layer. Lee env vars, aplica overrides por motor.

Todas las variables tienen defaults sensatos SALVO los secretos (API keys),
que se omiten si no están presentes (fail-fast en modo `real`).
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent

Engine = Literal[
    "master", "financial", "signal", "semantic",
    "recommendation", "strategy", "transaction",
]


class IntelligenceSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---------- Feature flag temporal (retirada en B.6.j · Regla R2) ----------
    agency_tool_mode: Literal["mock", "real"] = "mock"

    # ---------- Sprint F0.1 · Company Intelligence V2 (identidad canónica pública) ----------
    # Cuando True, el router en modo `real` usa `AgencyToolCompanyIntelligenceV2Provider`
    # (POST /api/v2/company-intelligence/identity). Si el V2 falla → fallback al
    # `AgencyToolIdentityResolver` clásico (Financial→Semantic). En modo `mock`
    # es irrelevante (el mock ya expone los campos V2 opcionales).
    intelligence_company_v2_enabled: bool = False

    # ---------- Proveedor Agency Tool ----------
    agency_tool_base_url: str = "https://agencias.wearebudadvisors.com"
    agency_tool_timeout_ms: int = 30_000
    agency_tool_connect_timeout_ms: int = 5_000
    agency_tool_retry_max: int = 3
    agency_tool_max_concurrent: int = 20  # semáforo por motor
    # Límite GLOBAL de peticiones simultáneas al origin intel (todos los motores).
    # intel.arroba.com es sensible a ráfagas (>3 req/<1s → 520). Serializa el
    # fan-out paralelo del SWR de la ficha para no tumbar el origin.
    agency_tool_global_max_concurrent: int = 3

    # ---------- API Key slots (rotación sin downtime · [pack §7.1]) ----------
    arroba_service_api_key_primary: str = ""
    arroba_service_api_key_secondary: str = ""

    # ---------- Circuit Breaker (Decisión 0.1.1) ----------
    agency_tool_breaker_threshold: int = 5
    agency_tool_breaker_timeout_s: int = 60

    # ---------- Caché — TTL global + overrides por motor (Decisión 0.1.2) ----------
    intelligence_cache_ttl_seconds: int = 900  # 15 min default
    intelligence_cache_error_ttl_seconds: int = 30
    intelligence_cache_memory_maxsize: int = 1024

    intelligence_cache_ttl_master_seconds: int | None = 24 * 60 * 60  # 24h · R12 (identidad estable)
    intelligence_cache_ttl_financial_seconds: int | None = None
    intelligence_cache_ttl_signal_seconds: int | None = None
    intelligence_cache_ttl_semantic_seconds: int | None = None
    intelligence_cache_ttl_recommendation_seconds: int | None = None
    intelligence_cache_ttl_strategy_seconds: int | None = None
    intelligence_cache_ttl_transaction_seconds: int | None = 0  # event-driven

    # ---------- Observabilidad (Decisión 0.1.3) ----------
    internal_metrics_token: str = ""  # vacío = endpoint abierto

    # ---------- Admin ops (HARDENING-004) ----------
    # Token requerido para POST /api/admin/cache/purge. Fail-safe: si vacío,
    # el endpoint responde 503 (nunca puede ejecutarse sin token configurado).
    arroba_admin_token: str = ""

    def ttl_for(self, engine: Engine) -> int:
        """Devuelve TTL efectivo para el motor. Override por motor > global."""
        attr = f"intelligence_cache_ttl_{engine}_seconds"
        specific = getattr(self, attr, None)
        if specific is not None:
            return specific
        return self.intelligence_cache_ttl_seconds

    @property
    def timeout_s(self) -> float:
        return self.agency_tool_timeout_ms / 1000.0

    @property
    def connect_timeout_s(self) -> float:
        return self.agency_tool_connect_timeout_ms / 1000.0


@lru_cache
def get_intelligence_settings() -> IntelligenceSettings:
    return IntelligenceSettings()


def reset_intelligence_settings_cache() -> None:
    """Solo para tests que necesitan releer .env / monkeypatch."""
    get_intelligence_settings.cache_clear()
