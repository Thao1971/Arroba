"""AgencyToolSignalProvider — motor `signal-intelligence` (X-API-Key).

Endpoint público consumido (R12: NUNCA `/master/*`):
  * POST /api/v1/signal-intelligence/analyze  {"identifier": cif}

Salida del motor (arroba.v2 · SignalAnalyzeResponse):
  { master_id, cif_normalized, identity{}, signals[], score{signal_score,...},
    counts_by_category{}, engine_version, ... }

Se traduce `engine_version` interno a `arroba-signal-v1` (R5).
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from src.core.logging import get_logger
from src.modules.intelligence_layer.interfaces.signal import (
    SignalAnalysis,
    SignalItem,
    SignalNotFoundError,
    SignalProvider,
    SignalProviderError,
    SignalScore,
)
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolClient,
    AgencyToolHTTPError,
    get_agency_tool_client,
)

log = get_logger("intelligence_layer.provider.agency_tool.signal")

SIGNAL_ANALYZE_PATH = "/api/v1/signal-intelligence/analyze"
INTERNAL_ENGINE_VERSION = "arroba-signal-v1"


class AgencyToolSignalProvider(SignalProvider):
    provider_name = "agency_tool"

    def __init__(self, client: AgencyToolClient | None = None) -> None:
        self._client = client or get_agency_tool_client()

    async def analyze(self, cif: str) -> SignalAnalysis:
        cif_norm = cif.upper().strip()
        try:
            resp = await self._client.request(
                "POST", SIGNAL_ANALYZE_PATH, json={"identifier": cif_norm}
            )
        except AgencyToolHTTPError as exc:
            raise SignalProviderError(str(exc), error_class=exc.error_class) from exc

        if resp.status_code == 404:
            raise SignalNotFoundError(f"cif={cif_norm}")
        if resp.status_code in (401, 403):
            raise SignalProviderError(
                f"unauthorized {resp.status_code}", error_class="unauthorized"
            )
        if resp.status_code >= 500:
            raise SignalProviderError(
                f"upstream {resp.status_code}", error_class="server_5xx"
            )
        if resp.status_code != 200:
            raise SignalProviderError(
                f"unexpected {resp.status_code}", error_class="client_4xx"
            )
        try:
            data = resp.json()
        except ValueError as exc:
            raise SignalProviderError(
                f"invalid JSON: {exc}", error_class="server_5xx"
            ) from exc

        return self._map(cif_norm, data)

    def _map(self, cif_norm: str, doc: dict[str, Any]) -> SignalAnalysis:
        signals_raw = doc.get("signals") or []
        items: list[SignalItem] = []
        for s in signals_raw:
            if not isinstance(s, dict):
                continue
            dims = s.get("dimensions") if isinstance(s.get("dimensions"), dict) else {}
            items.append(
                SignalItem(
                    signal_id=str(s.get("signal_id") or s.get("signal_type") or ""),
                    signal_type=s.get("signal_type"),
                    category=s.get("category"),
                    severity=s.get("severity"),
                    polarity=s.get("polarity"),
                    title=s.get("title") or s.get("signal_type"),
                    confidence=s.get("confidence") or (dims.get("confidence") if dims else None),
                    detected_at=s.get("detected_at"),
                    recommended_actions=list(s.get("recommended_actions") or []),
                    # HARDENING-007 · passthrough aditivo
                    explanation=s.get("explanation") if isinstance(s.get("explanation"), str) else None,
                    evidence=s.get("evidence") if isinstance(s.get("evidence"), dict) else None,
                    dimensions=dims if dims else None,
                    rule=s.get("rule") if isinstance(s.get("rule"), dict) else None,
                )
            )
        score_raw = doc.get("score") if isinstance(doc.get("score"), dict) else {}
        return SignalAnalysis(
            master_id=doc.get("master_id"),
            cif_normalized=doc.get("cif_normalized") or cif_norm,
            signals=items,
            score=SignalScore(
                signal_score=score_raw.get("signal_score"),
                method=score_raw.get("method"),
            )
            if score_raw
            else None,
            counts_by_category=doc.get("counts_by_category") or {},
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )


__all__ = ["AgencyToolSignalProvider", "INTERNAL_ENGINE_VERSION", "SIGNAL_ANALYZE_PATH"]
