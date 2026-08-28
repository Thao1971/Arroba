"""Cliente HTTP hacia `Intel-140826` `/api/v1/buyer-mandates/*`.

Deliberadamente separado de `intelligence_layer.providers.agency_tool.client`
porque usa un esquema de auth distinto (`Authorization: Bearer`, no
`X-API-Key`) — ver nota en `config.py`. Reutiliza el mismo estilo de manejo
de errores (clases normalizadas) para que el resto del código de Beta sea
coherente, sin duplicar la lógica de reintentos/circuit-breaker del cliente
de intelligence_layer (fuera de alcance para este primer corte — ver
DIAGNOSTICO_PAGINA_OPORTUNIDADES.md, "orden de construcción").
"""
from __future__ import annotations

import httpx

from src.core.logging import get_logger
from src.modules.mandates.config import MandatesSettings, get_mandates_settings

log = get_logger("mandates.client")


class MandatesHTTPError(RuntimeError):
    def __init__(self, *, status_code: int, error_class: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_class = error_class


def _classify(status_code: int) -> str:
    if status_code in (401, 403):
        return "unauthorized"
    if status_code == 404:
        return "not_found"
    if 400 <= status_code < 500:
        return "client_4xx"
    if 500 <= status_code < 600:
        return "server_5xx"
    return "unknown"


class MandatesClient:
    def __init__(self, settings: MandatesSettings | None = None) -> None:
        self.settings = settings or get_mandates_settings()
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.settings.intel_base_url,
                timeout=httpx.Timeout(self.settings.intel_mandates_timeout_ms / 1000.0),
            )
        return self._client

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def request(
        self, method: str, path: str, *, json: dict | None = None, params: dict | None = None
    ) -> httpx.Response:
        token = self.settings.intel_mandates_bearer_token
        if not token:
            raise MandatesHTTPError(
                status_code=0,
                error_class="unauthorized",
                message="INTEL_MANDATES_BEARER_TOKEN vacío — modo real no autorizado",
            )
        client = await self._get_client()
        try:
            resp = await client.request(
                method,
                path,
                headers={"Authorization": f"Bearer {token}"},
                json=json,
                params=params,
            )
        except httpx.TimeoutException as exc:
            raise MandatesHTTPError(status_code=0, error_class="timeout", message="timeout") from exc
        except httpx.NetworkError as exc:
            raise MandatesHTTPError(status_code=0, error_class="network", message=str(exc)) from exc
        return resp


_client: MandatesClient | None = None


def get_mandates_client() -> MandatesClient:
    global _client
    if _client is None:
        _client = MandatesClient()
    return _client


def reset_mandates_client_for_tests() -> None:
    global _client
    _client = None


__all__ = [
    "MandatesClient",
    "MandatesHTTPError",
    "get_mandates_client",
    "reset_mandates_client_for_tests",
]
