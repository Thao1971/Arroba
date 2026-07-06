"""AgencyToolClient — httpx.AsyncClient con timeouts, reintentos y fallback de API keys.

Implementa la lógica de rotación primary/secondary (Decisión 0.1.4):
  1) Intenta con `_PRIMARY`.
  2) Si devuelve 401/403 → 1 único reintento con `_SECONDARY` (si está configurada).
  3) Cualquier otra respuesta se propaga tal cual (reintentos exponenciales aplican para 429/5xx).

Redacción de API key en logs: la key NUNCA se loguea. La función `redact_key`
puede usarse para redactar valores en excepciones que pudieran contenerla.
"""
from __future__ import annotations

import asyncio
from typing import Any

import httpx

from src.core.logging import get_logger
from src.modules.intelligence_layer.config import (
    IntelligenceSettings,
    get_intelligence_settings,
)

log = get_logger("intelligence_layer.provider.agency_tool.client")


def redact_key(value: str, key: str) -> str:
    """Redacta cualquier ocurrencia de `key` en `value` como `as_***`."""
    if not key or not value:
        return value
    prefix = key[:3]
    return value.replace(key, f"{prefix}_***")


class AgencyToolHTTPError(RuntimeError):
    """Wrapper de httpx.HTTPStatusError con clase de error normalizada."""

    def __init__(
        self,
        *,
        status_code: int,
        error_class: str,
        message: str,
        body: Any = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_class = error_class
        self.body = body


def classify_status(status_code: int) -> str:
    """Clasifica códigos HTTP en la taxonomía canónica (Decisión 0.1.3)."""
    if status_code in (401, 403):
        return "unauthorized"
    if 400 <= status_code < 500:
        return "client_4xx"
    if 500 <= status_code < 600:
        return "server_5xx"
    return "unknown"


class AgencyToolClient:
    """Cliente HTTP asíncrono contra Agency Tool.

    Se instancia lazy y se reutiliza (una única `httpx.AsyncClient` por proceso).
    """

    def __init__(self, settings: IntelligenceSettings | None = None) -> None:
        self.settings = settings or get_intelligence_settings()
        self._client: httpx.AsyncClient | None = None
        self._lock = asyncio.Lock()

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            async with self._lock:
                if self._client is None:
                    self._client = httpx.AsyncClient(
                        base_url=self.settings.agency_tool_base_url,
                        timeout=httpx.Timeout(
                            self.settings.timeout_s,
                            connect=self.settings.connect_timeout_s,
                        ),
                    )
        return self._client

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def request(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> httpx.Response:
        """Realiza la petición con fallback primary→secondary + reintentos exponenciales.

        Reintentos: 429 y 5xx hasta `agency_tool_retry_max` con backoff 1s→2s→4s.
        """
        primary = self.settings.arroba_service_api_key_primary
        secondary = self.settings.arroba_service_api_key_secondary
        if not primary:
            raise AgencyToolHTTPError(
                status_code=0,
                error_class="unauthorized",
                message="ARROBA_SERVICE_API_KEY_PRIMARY vacío — modo real no autorizado",
            )

        client = await self._get_client()

        for key_idx, key in enumerate([primary, secondary]):
            if not key:
                continue
            resp = await self._call_with_retries(client, method, path, key, json=json, params=params)
            klass = classify_status(resp.status_code)
            if klass == "unauthorized" and key_idx == 0 and secondary:
                log.warning(
                    "agency_tool.primary_unauthorized_fallback_secondary",
                    path=path,
                    status_code=resp.status_code,
                )
                continue  # fallback a secondary
            return resp

        raise AgencyToolHTTPError(
            status_code=401,
            error_class="unauthorized",
            message="ambas API keys (primary y secondary) fallaron",
        )

    async def _call_with_retries(
        self,
        client: httpx.AsyncClient,
        method: str,
        path: str,
        api_key: str,
        *,
        json: dict | None,
        params: dict | None,
    ) -> httpx.Response:
        last_exc: Exception | None = None
        for attempt in range(self.settings.agency_tool_retry_max + 1):
            try:
                resp = await client.request(
                    method,
                    path,
                    headers={"X-API-Key": api_key},
                    json=json,
                    params=params,
                )
            except httpx.TimeoutException as exc:
                last_exc = exc
                if attempt >= self.settings.agency_tool_retry_max:
                    raise AgencyToolHTTPError(
                        status_code=0, error_class="timeout", message="timeout"
                    ) from exc
            except httpx.NetworkError as exc:
                last_exc = exc
                if attempt >= self.settings.agency_tool_retry_max:
                    raise AgencyToolHTTPError(
                        status_code=0, error_class="network", message="network error"
                    ) from exc
            else:
                # Reintentar solo 429 y 5xx.
                if resp.status_code == 429 or 500 <= resp.status_code < 600:
                    if attempt >= self.settings.agency_tool_retry_max:
                        return resp
                    retry_after = int(resp.headers.get("Retry-After", "0"))
                    delay = max(retry_after, 2**attempt)
                    log.warning(
                        "agency_tool.retry",
                        path=path,
                        status_code=resp.status_code,
                        attempt=attempt + 1,
                        delay_s=delay,
                    )
                    await asyncio.sleep(delay)
                    continue
                return resp
            await asyncio.sleep(2**attempt)
        assert last_exc is not None
        raise AgencyToolHTTPError(
            status_code=0, error_class="network", message="retries exhausted"
        ) from last_exc


# Singleton
_client: AgencyToolClient | None = None


def get_agency_tool_client() -> AgencyToolClient:
    global _client
    if _client is None:
        _client = AgencyToolClient()
    return _client


def reset_agency_tool_client_for_tests() -> None:
    global _client
    _client = None


__all__ = [
    "AgencyToolClient",
    "AgencyToolHTTPError",
    "classify_status",
    "redact_key",
    "get_agency_tool_client",
    "reset_agency_tool_client_for_tests",
]
