"""Config del módulo `mandates`.

Beta no persiste mandatos ni candidatas propias — es un proxy de lectura/escritura
fino hacia Intel (`buyer_mandates.py`). Todo el dato y la lógica de negocio viven
en Intel; Beta solo reenvía la petición autenticada y traduce el DTO.

Nota de auth: `buyer_mandates.py` en Intel usa `get_current_user`, que acepta
un `Authorization: Bearer <token>` donde `<token>` es un JWT propio de Intel
*o* una API key de Intel (tabla `db.api_keys`, no la misma tabla que valida
`X-API-Key` en `require_service_key`). Es una auth DISTINTA de la que usa
`intelligence_layer` (X-API-Key contra `AgencyToolClient`). Como esa clave de
servicio representa a Beta como aplicación (una sola identidad de Intel), cada
llamada envía además `beta_user_id` en el payload/query — Intel ya sabe
distinguir mandatos por ese campo (ver `routes/buyer_mandates.py`).

`intel_mandates_bearer_token` debe ser una API key de Intel provisionada
específicamente para este módulo (mapeada a un usuario de servicio en
`Intel-140826/backend/db.api_keys`). Mientras esa clave no exista, cualquier
llamada de este módulo falla con 401 de forma explícita (fail-fast, sin mock
de respaldo) — ver `client.py`.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent


class MandatesSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Reutiliza el mismo host que intelligence_layer (mismo Intel), pero con
    # auth Bearer propia — no el X-API-Key de AgencyToolClient.
    # agencias.wearebudadvisors.com quedó obsoleto (2026-08-20, Daniel): la URL
    # vigente de Intel es intel.arroba.com.
    intel_base_url: str = "https://intel.arroba.com"
    intel_mandates_bearer_token: str = ""
    intel_mandates_timeout_ms: int = 15_000


@lru_cache
def get_mandates_settings() -> MandatesSettings:
    return MandatesSettings()


def reset_mandates_settings_cache() -> None:
    get_mandates_settings.cache_clear()


__all__ = ["MandatesSettings", "get_mandates_settings", "reset_mandates_settings_cache"]
