"""AgencyToolRecommendationProvider — motor `recommendation-intelligence` (X-API-Key).

Endpoint público consumido (R12: NUNCA `/master/*`):
  * POST /api/v1/recommendation-intelligence/buyers  {"identifier": cif, "limit": n}

Salida (arroba.v2 · RecommendationSetResponse):
  { target, recommendation_type, count, recommendations:[RecommendationItem], ... }
  RecommendationItem: { candidate{}, score, fit_dimensions{}, explanation, ... }
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from src.core.logging import get_logger
from src.modules.intelligence_layer.interfaces.recommendation import (
    BuyerItem,
    RecommendationNotFoundError,
    RecommendationProvider,
    RecommendationProviderError,
    RecommendationSet,
)
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolClient,
    AgencyToolHTTPError,
    get_agency_tool_client,
)

log = get_logger("intelligence_layer.provider.agency_tool.recommendation")

BUYERS_PATH = "/api/v1/recommendation-intelligence/buyers"
OPPORTUNITIES_PATH = "/api/v1/recommendation-intelligence/opportunities"
INTERNAL_ENGINE_VERSION = "arroba-recommendation-v1"


def _as_text(explanation: Any) -> str | None:
    if explanation is None:
        return None
    if isinstance(explanation, str):
        return explanation
    if isinstance(explanation, dict):
        return explanation.get("summary") or explanation.get("reason") or None
    return None


class AgencyToolRecommendationProvider(RecommendationProvider):
    provider_name = "agency_tool"

    def __init__(self, client: AgencyToolClient | None = None) -> None:
        self._client = client or get_agency_tool_client()

    async def buyers(self, cif: str, limit: int = 10) -> RecommendationSet:
        return await self._call(BUYERS_PATH, cif, limit)

    async def opportunities(self, cif: str, limit: int = 10) -> RecommendationSet:
        return await self._call(OPPORTUNITIES_PATH, cif, limit)

    async def _call(self, path: str, cif: str, limit: int) -> RecommendationSet:
        cif_norm = cif.upper().strip()
        try:
            resp = await self._client.request(
                "POST", path, json={"identifier": cif_norm, "limit": limit}
            )
        except AgencyToolHTTPError as exc:
            raise RecommendationProviderError(str(exc), error_class=exc.error_class) from exc

        if resp.status_code == 404:
            raise RecommendationNotFoundError(f"cif={cif_norm}")
        if resp.status_code in (401, 403):
            raise RecommendationProviderError(
                f"unauthorized {resp.status_code}", error_class="unauthorized"
            )
        if resp.status_code >= 500:
            raise RecommendationProviderError(
                f"upstream {resp.status_code}", error_class="server_5xx"
            )
        if resp.status_code != 200:
            raise RecommendationProviderError(
                f"unexpected {resp.status_code}", error_class="client_4xx"
            )
        try:
            data = resp.json()
        except ValueError as exc:
            raise RecommendationProviderError(
                f"invalid JSON: {exc}", error_class="server_5xx"
            ) from exc

        return self._map(cif_norm, data)

    def _map(self, cif_norm: str, doc: dict[str, Any]) -> RecommendationSet:
        recs_raw = doc.get("recommendations") or []
        items: list[BuyerItem] = []
        for r in recs_raw:
            if not isinstance(r, dict):
                continue
            cand = r.get("candidate") if isinstance(r.get("candidate"), dict) else {}
            items.append(
                BuyerItem(
                    master_id=cand.get("master_id") or cand.get("id"),
                    name=cand.get("name") or cand.get("legal_name"),
                    sector=cand.get("sector") or cand.get("cnae_section"),
                    recommendation_type=r.get("recommendation_type") or r.get("recommendation_role"),
                    score=r.get("score"),
                    fit_dimensions=r.get("fit_dimensions") if isinstance(r.get("fit_dimensions"), dict) else {},
                    reason=_as_text(r.get("explanation")),
                    recommended_actions=list(r.get("recommended_actions") or []),
                )
            )
        target = doc.get("target") if isinstance(doc.get("target"), dict) else {}
        return RecommendationSet(
            master_id=target.get("master_id"),
            cif_normalized=target.get("cif_normalized") or cif_norm,
            recommendation_type=doc.get("recommendation_type"),
            count=doc.get("count") if isinstance(doc.get("count"), int) else len(items),
            recommendations=items,
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )


__all__ = ["AgencyToolRecommendationProvider", "INTERNAL_ENGINE_VERSION", "BUYERS_PATH"]
