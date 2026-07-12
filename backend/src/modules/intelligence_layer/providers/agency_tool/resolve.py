"""AgencyToolResolveProvider — Sprint F0.2 (2026-07-12).

Cliente Zero Coupling para el endpoint canónico V2 de resolución:

    POST /api/v2/company-intelligence/resolve   { "cif": "<CIF>" }

Notas de contrato:
- El proveedor externo espera `{"cif": ...}` o `{"name": ...}` (schema propio · 422
  con `{"identifier": ...}`).  El proxy arroba absorbe esta divergencia hacia el
  contrato interno `arroba-resolve-v1`.
- El proveedor devuelve `count=0` con HTTP 200 cuando no hay match; arroba lo
  traduce a `ResolveNotFoundError` (canónico 404 en el endpoint público).
- Regla R12/P3 aplicada: sólo se consumen rutas públicas con `X-API-Key`.
- Cuando la resolución vale para múltiples matches (aplicable únicamente a
  `name`, no expuesto en F0.2), el proveedor devuelve todos los matches con
  score. El uso actual (`resolve_by_cif`) espera 1 sólo match (`cif_exact`).
"""
from __future__ import annotations

from typing import Any

from src.core.logging import get_logger
from src.modules.intelligence_layer.interfaces.resolve import (
    ResolveNotFoundError,
    ResolveProvider,
    ResolveProviderError,
    ResolveResult,
)
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolClient,
    AgencyToolHTTPError,
    get_agency_tool_client,
)

log = get_logger("intelligence_layer.provider.agency_tool.resolve")

COMPANY_INTELLIGENCE_V2_RESOLVE_PATH = "/api/v2/company-intelligence/resolve"


class AgencyToolResolveProvider(ResolveProvider):
    """Proveedor real de resolución CIF → master_id.

    R12/P3: nunca toca rutas administrativas. Mapea el shape externo
    (`ResolveResponse` con `matches[]`) al contrato interno `ResolveResult`.
    """

    provider_name = "agency_tool"

    def __init__(self, client: AgencyToolClient | None = None) -> None:
        self._client = client or get_agency_tool_client()

    async def resolve_by_cif(self, cif: str) -> ResolveResult:
        cif_norm = cif.upper().strip()
        try:
            resp = await self._client.request(
                "POST",
                COMPANY_INTELLIGENCE_V2_RESOLVE_PATH,
                json={"cif": cif_norm},
            )
        except AgencyToolHTTPError as exc:
            raise ResolveProviderError(str(exc), error_class=exc.error_class) from exc

        if resp.status_code in (401, 403):
            raise ResolveProviderError(
                f"company-intelligence-v2/resolve unauthorized {resp.status_code}",
                error_class="unauthorized",
            )
        if resp.status_code >= 500:
            raise ResolveProviderError(
                f"company-intelligence-v2/resolve upstream {resp.status_code}",
                error_class="server_5xx",
            )
        if resp.status_code == 404:
            raise ResolveNotFoundError(f"cif={cif_norm}")
        if resp.status_code != 200:
            raise ResolveProviderError(
                f"company-intelligence-v2/resolve unexpected status {resp.status_code}",
                error_class="client_4xx",
            )
        try:
            data: dict[str, Any] = resp.json()
        except ValueError as exc:
            raise ResolveProviderError(
                f"invalid JSON de company-intelligence-v2/resolve: {exc}",
                error_class="server_5xx",
            ) from exc

        count = data.get("count") or 0
        matches = data.get("matches") or []
        if count == 0 or not matches:
            log.info("resolve.not_found", cif=cif_norm)
            raise ResolveNotFoundError(f"cif={cif_norm}")

        best = matches[0]
        master_id = best.get("master_id")
        if not master_id:
            raise ResolveProviderError(
                "company-intelligence-v2/resolve missing master_id in first match",
                error_class="server_5xx",
            )

        match_type = str(best.get("match_type") or "unknown")
        score = float(best.get("score") or 0.0)
        if match_type == "cif_exact" and score < 1.0:
            # Warning (no bloqueante): comportamiento inesperado del proveedor.
            log.warning(
                "resolve.cif_exact_score_below_1",
                cif=cif_norm,
                master_id=master_id,
                score=score,
            )

        log.info(
            "resolve.hit",
            cif=cif_norm,
            master_id=master_id,
            match_type=match_type,
            score=score,
        )
        return ResolveResult(
            cif=cif_norm,
            master_id=str(master_id),
            canonical_name=best.get("legal_name"),
            match_type=match_type,
            score=score,
        )


__all__ = [
    "AgencyToolResolveProvider",
    "COMPANY_INTELLIGENCE_V2_RESOLVE_PATH",
]
