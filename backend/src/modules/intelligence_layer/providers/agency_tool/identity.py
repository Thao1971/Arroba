"""AgencyToolIdentityResolver — R12 compliant.

Compone `financial-intelligence/analyze` + `semantic-intelligence/search` para
reconstruir el schema §6.1 desde engines públicos con `X-API-Key`.

**JAMÁS llama a `/api/v1/master/*`.** Test de regresión permanente incluido en
`tests/intelligence_layer/test_r12_regression.py`.

Patrón de resolución (spec §0.2.3 del plan de consumo):

    resolve_by_cif(cif):
        1) POST /financial-intelligence/analyze {"identifier": cif}
             200 → extrae master_id + identity + classification + location + financials
             404 → paso 2
        2) POST /semantic-intelligence/search {"query": cif, "limit": 1}
             200 con results → extrae master_id + identity básica
             200 count=0 / 404 → paso 3
        3) raise MasterNotFoundError → arroba serve 404 canónico

Caché del mapping `cif ↔ master_id` (TTL 24h · identidad estable) lo gestiona
el router vía `IntelligenceCache`, no este resolver directamente.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from src.core.logging import get_logger
from src.modules.intelligence_layer.interfaces.master import (
    Classification,
    Contact,
    Financials,
    FinancialsHistoryItem,
    FinancialsLatest,
    Identity,
    Location,
    MasterNotFoundError,
    MasterProvider,
    MasterProviderError,
    MasterRecord,
    Ownership,
    Size,
)
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolClient,
    AgencyToolHTTPError,
    get_agency_tool_client,
)

log = get_logger("intelligence_layer.provider.agency_tool.identity")

# Endpoints públicos consumidos (R12 los limita estrictamente a estos).
FINANCIAL_ANALYZE_PATH = "/api/v1/financial-intelligence/analyze"
SEMANTIC_SEARCH_PATH = "/api/v1/semantic-intelligence/search"

# 🚫 R12 GUARD: cualquier request a rutas que empiecen por este prefijo debe fallar
# antes de salir por HTTP. Ver `AgencyToolClient` para el check runtime.
FORBIDDEN_PREFIXES = ("/api/v1/master/", "/api/v1/master")

ENGINE_VERSION = "arroba-identity-resolver-v1"


class AgencyToolIdentityResolver(MasterProvider):
    """Implementación real del contrato interno §6.1 sin tocar `/master/*` (R12)."""

    provider_name = "agency_tool"

    def __init__(self, client: AgencyToolClient | None = None) -> None:
        self._client = client or get_agency_tool_client()

    async def get_by_id(self, master_id: str) -> MasterRecord:
        """R12: arroba usa el CIF como identificador canónico, no `master_id`.

        Este método existe para cumplir el contrato `MasterProvider` pero no
        tiene un endpoint público que permita resolver directamente por `master_id`
        sin pasar por Master admin. Marcamos como no soportado — el `router.py`
        del intelligence_layer llama exclusivamente a `get_by_cif`.
        """
        raise MasterProviderError(
            "get_by_id no soportado por R12: arroba resuelve identidad por CIF "
            "(nunca por master_id directamente contra /master/*).",
            error_class="client_4xx",
        )

    async def get_by_cif(self, cif: str) -> MasterRecord:
        cif_norm = cif.upper().strip()

        # ---------- Paso 1: financial-intelligence/analyze ----------
        try:
            resp = await self._client.request(
                "POST", FINANCIAL_ANALYZE_PATH, json={"identifier": cif_norm}
            )
        except AgencyToolHTTPError as exc:
            raise MasterProviderError(str(exc), error_class=exc.error_class) from exc

        if resp.status_code == 200:
            try:
                data = resp.json()
            except ValueError as exc:
                raise MasterProviderError(
                    f"invalid JSON de financial: {exc}", error_class="server_5xx"
                ) from exc
            log.info(
                "identity_resolver.hit_financial",
                cif=cif_norm,
                master_id=data.get("master_id"),
            )
            return self._map_financial(cif_norm, data)

        if resp.status_code >= 500:
            raise MasterProviderError(
                f"financial upstream {resp.status_code}", error_class="server_5xx"
            )
        if resp.status_code in (401, 403):
            raise MasterProviderError(
                f"financial unauthorized {resp.status_code}", error_class="unauthorized"
            )
        if resp.status_code != 404:
            raise MasterProviderError(
                f"financial unexpected status {resp.status_code}",
                error_class="client_4xx",
            )

        # ---------- Paso 2: semantic-intelligence/search (fallback) ----------
        try:
            resp2 = await self._client.request(
                "POST", SEMANTIC_SEARCH_PATH, json={"query": cif_norm, "limit": 1}
            )
        except AgencyToolHTTPError as exc:
            raise MasterProviderError(str(exc), error_class=exc.error_class) from exc

        if resp2.status_code == 200:
            try:
                data2 = resp2.json()
            except ValueError as exc:
                raise MasterProviderError(
                    f"invalid JSON de semantic: {exc}", error_class="server_5xx"
                ) from exc
            results = data2.get("results") or []
            if results:
                log.info(
                    "identity_resolver.hit_semantic_fallback",
                    cif=cif_norm,
                    count=data2.get("count"),
                )
                return self._map_semantic(cif_norm, results[0])
            # 200 count=0 → paso 3
        elif resp2.status_code >= 500:
            raise MasterProviderError(
                f"semantic upstream {resp2.status_code}", error_class="server_5xx"
            )
        elif resp2.status_code in (401, 403):
            raise MasterProviderError(
                f"semantic unauthorized {resp2.status_code}", error_class="unauthorized"
            )

        # ---------- Paso 3: no encontrado ----------
        log.info("identity_resolver.not_found", cif=cif_norm)
        raise MasterNotFoundError(f"cif={cif_norm}")

    # ---------- Mapeo `financial-intelligence/analyze` → §6.1 ----------
    def _map_financial(self, cif_norm: str, doc: dict[str, Any]) -> MasterRecord:
        """El payload de Financial embebe `identity`, `classification`, `location`,
        `master_id`, `cif_normalized`, más los datos financieros. Los mapeamos al
        schema §6.1; los campos huérfanos (`ownership`, `provenance`, etc.) van a
        `null`/`[]` (R4 · no inventar).
        """
        identity_raw = doc.get("identity") or {}
        classification_raw = doc.get("classification") or {}
        location_raw = doc.get("location") or {}
        contact_raw = doc.get("contact") or {}
        size_raw = doc.get("size") or {}
        kpis = doc.get("kpis") or {}
        income = doc.get("income_statement") or {}

        # `latest` se compone de: kpis (revenue/ebitda/margins) + income (net_income/operating_income)
        latest = FinancialsLatest(
            year=doc.get("fiscal_year") or kpis.get("year"),
            basis=doc.get("basis"),
            revenue=kpis.get("revenue"),
            ebitda=kpis.get("ebitda"),
            ebitda_margin=kpis.get("ebitda_margin"),
            equity=kpis.get("equity"),
            total_assets=kpis.get("total_assets"),
            net_income=income.get("net_income") or kpis.get("net_income"),
            operating_income=income.get("operating_income") or kpis.get("operating_income"),
        )

        history_raw = doc.get("history") or []
        history = [
            FinancialsHistoryItem(
                year=h.get("year"),
                basis=h.get("basis"),
                revenue=h.get("revenue"),
                ebitda=h.get("ebitda"),
                net_income=h.get("net_income"),
            )
            for h in history_raw
            if isinstance(h, dict)
        ]

        return MasterRecord(
            master_id=doc.get("master_id"),
            cif_normalized=doc.get("cif_normalized") or cif_norm,
            status="active",
            identity=Identity(
                legal_name=identity_raw.get("legal_name") or doc.get("legal_name"),
                commercial_name=identity_raw.get("commercial_name"),
                aliases=identity_raw.get("aliases") or [],
                cif=identity_raw.get("cif") or cif_norm,
                country=identity_raw.get("country") or "ES",
            ),
            classification=Classification(
                cnae_code=classification_raw.get("cnae_code") or doc.get("cnae_code"),
                cnae_description=classification_raw.get("cnae_description"),
                cnae_division=classification_raw.get("cnae_division"),
                cnae_section=classification_raw.get("cnae_section") or doc.get("cnae_section"),
            ),
            location=Location(
                provincia=location_raw.get("provincia") or doc.get("provincia"),
                municipio=location_raw.get("municipio"),
                codigo_postal=location_raw.get("codigo_postal"),
                pais=location_raw.get("pais") or "ES",
            ),
            contact=Contact(
                web=contact_raw.get("web"),
                domain=contact_raw.get("domain"),
            ),
            size=Size(
                employees_total=size_raw.get("employees_total") or kpis.get("employees"),
                capital_social=size_raw.get("capital_social"),
            ),
            financials=Financials(latest=latest, history=history),
            ownership=Ownership(),  # huérfano — REQ contra Agency Tool
            officers_count=None,
            objeto_social=None,
            provenance={},
            sources=[],
            pipeline_version=None,
            source_hash=None,
            dirty=False,
            created_at=None,
            updated_at=None,
            built_at=None,
            engine_version=ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )

    # ---------- Mapeo `semantic-intelligence/search` → §6.1 (fallback pobre) ----------
    def _map_semantic(self, cif_norm: str, hit: dict[str, Any]) -> MasterRecord:
        """El search devuelve un match con `master_id`, `cif_normalized`, `name`,
        `score` mínimamente. NO devuelve financials — quedan a `null`.
        """
        return MasterRecord(
            master_id=hit.get("master_id"),
            cif_normalized=hit.get("cif_normalized") or cif_norm,
            status="active",
            identity=Identity(
                legal_name=hit.get("legal_name") or hit.get("name"),
                cif=hit.get("cif_normalized") or cif_norm,
                country="ES",
            ),
            classification=Classification(
                cnae_description=hit.get("cnae_description"),
                cnae_section=hit.get("cnae_section"),
            ),
            location=Location(
                provincia=hit.get("provincia"),
                pais="ES",
            ),
            contact=Contact(),
            size=Size(),
            financials=Financials(),  # sin datos financieros por vía semantic
            ownership=Ownership(),
            engine_version=ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )


__all__ = [
    "AgencyToolIdentityResolver",
    "ENGINE_VERSION",
    "FINANCIAL_ANALYZE_PATH",
    "SEMANTIC_SEARCH_PATH",
    "FORBIDDEN_PREFIXES",
]
