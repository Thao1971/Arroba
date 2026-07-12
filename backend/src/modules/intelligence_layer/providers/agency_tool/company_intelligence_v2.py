"""AgencyToolCompanyIntelligenceV2Provider — Sprint F0.1 (2026-07-06).

Cliente para el nuevo endpoint canónico V2 de identidad:

    POST /api/v2/company-intelligence/identity   { "identifier": "<cif>" }

Devuelve un `MasterRecord` con los campos V2 opcionales poblados
(`activity`, `sectors`, `mercantile_status`, `legal_form`, …). Cumple
R12 (nunca llama a rutas administrativas Master) y P3 (Zero Coupling:
mapea el `CompanyIdentityResponse` externo al contrato interno
`MasterRecord`).

Se cablea desde `router.py` sólo cuando el flag
`intelligence_v2_enabled=True` está activo. En caso de fallo del V2 el
router hace fallback al `AgencyToolIdentityResolver` clásico (Financial→
Semantic → 404) para mantener B.6.b/B.6.c operativos.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from src.core.logging import get_logger
from src.modules.intelligence_layer.interfaces.master import (
    Classification,
    Contact,
    Financials,
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

log = get_logger("intelligence_layer.provider.agency_tool.company_intelligence_v2")

COMPANY_INTELLIGENCE_V2_IDENTITY_PATH = "/api/v2/company-intelligence/identity"

ENGINE_VERSION = "arroba-identity-v2-adapter"


class AgencyToolCompanyIntelligenceV2Provider(MasterProvider):
    """Proveedor identidad canónica pública V2 (Sprint F0.1).

    R12/P3: nunca toca rutas administrativas Master. Mapea
    `CompanyIdentityResponse` V2 al `MasterRecord` interno. El adaptador
    `to_identity_section` propaga los nuevos campos al frontend vía
    `arroba-identity-v1`.
    """

    provider_name = "agency_tool"

    def __init__(self, client: AgencyToolClient | None = None) -> None:
        self._client = client or get_agency_tool_client()

    async def get_by_id(self, master_id: str) -> MasterRecord:
        # `CompanyIdentityRequest.identifier` acepta `master_id` o `cif_normalized`.
        return await self._resolve(master_id)

    async def get_by_cif(self, cif: str) -> MasterRecord:
        return await self._resolve(cif.upper().strip())

    async def _resolve(self, identifier: str) -> MasterRecord:
        try:
            resp = await self._client.request(
                "POST",
                COMPANY_INTELLIGENCE_V2_IDENTITY_PATH,
                json={"identifier": identifier},
            )
        except AgencyToolHTTPError as exc:
            raise MasterProviderError(str(exc), error_class=exc.error_class) from exc

        if resp.status_code == 404:
            raise MasterNotFoundError(f"identifier={identifier}")
        if resp.status_code in (401, 403):
            raise MasterProviderError(
                f"company-intelligence-v2 unauthorized {resp.status_code}",
                error_class="unauthorized",
            )
        if resp.status_code >= 500:
            raise MasterProviderError(
                f"company-intelligence-v2 upstream {resp.status_code}",
                error_class="server_5xx",
            )
        if resp.status_code != 200:
            raise MasterProviderError(
                f"company-intelligence-v2 unexpected status {resp.status_code}",
                error_class="client_4xx",
            )
        try:
            data = resp.json()
        except ValueError as exc:
            raise MasterProviderError(
                f"invalid JSON de company-intelligence-v2: {exc}",
                error_class="server_5xx",
            ) from exc

        log.info(
            "company_intelligence_v2.hit",
            identifier=identifier,
            master_id=data.get("master_id"),
        )
        return _map_v2_to_master_record(identifier, data)


def _map_v2_to_master_record(
    identifier: str, doc: dict[str, Any]
) -> MasterRecord:
    """Traducción canónica V2 → §6.1 + campos F0.1.

    Los campos raw de V2 con estructura anidada (`cnae_primary`,
    `cnae_secondary`) se aplanan a los campos §6.1 (`classification.*`) y
    los enums opcionales (`is_listed`, `mercantile_status`, …) van a los
    nuevos campos opcionales del `MasterRecord`.

    No inventa datos: campo ausente/`None` en la respuesta → `None`.
    """
    cif_norm = doc.get("cif") or identifier.upper().strip()
    country = doc.get("country") or "ES"

    cnae_primary = doc.get("cnae_primary") or {}
    sectors_list = doc.get("sectors") or []
    if not isinstance(sectors_list, list):
        sectors_list = []
    aliases_list = doc.get("aliases") or []
    if not isinstance(aliases_list, list):
        aliases_list = []
    data_coverage_raw = doc.get("data_coverage") or {}
    data_coverage = (
        {str(k): bool(v) for k, v in data_coverage_raw.items()}
        if isinstance(data_coverage_raw, dict)
        else {}
    )

    return MasterRecord(
        master_id=doc.get("master_id"),
        cif_normalized=cif_norm,
        status="active",
        identity=Identity(
            legal_name=doc.get("legal_name"),
            commercial_name=doc.get("commercial_name"),
            aliases=[str(a) for a in aliases_list if isinstance(a, str)],
            cif=cif_norm,
            country=country,
        ),
        classification=Classification(
            cnae_code=cnae_primary.get("code") if isinstance(cnae_primary, dict) else None,
            cnae_description=cnae_primary.get("description")
            if isinstance(cnae_primary, dict)
            else None,
            cnae_division=cnae_primary.get("division")
            if isinstance(cnae_primary, dict)
            else None,
            cnae_section=cnae_primary.get("section")
            if isinstance(cnae_primary, dict)
            else None,
        ),
        location=Location(
            provincia=doc.get("province"),
            municipio=doc.get("locality"),
            codigo_postal=doc.get("postal_code"),
            pais=country,
        ),
        contact=Contact(
            web=doc.get("website"),
            domain=doc.get("domain"),
        ),
        size=Size(
            employees_total=doc.get("employees_total"),
            capital_social=doc.get("capital_social"),
        ),
        financials=Financials(latest=FinancialsLatest(), history=[]),
        ownership=Ownership(),
        officers_count=None,
        objeto_social=doc.get("corporate_purpose"),
        provenance={},
        sources=list(doc.get("sources") or []),
        engine_version=ENGINE_VERSION,
        generated_at=datetime.now(UTC),
        updated_at=doc.get("updated_at"),
        # F0.1 · superficie ampliada V2
        activity=doc.get("activity"),
        activity_status=doc.get("activity_status"),
        mercantile_status=doc.get("mercantile_status"),
        record_status=doc.get("record_status"),
        legal_form=doc.get("legal_form"),
        incorporation_date=doc.get("incorporation_date"),
        is_listed=doc.get("is_listed"),
        listed_market=doc.get("listed_market"),
        sectors=[str(s) for s in sectors_list if isinstance(s, str)],
        description=doc.get("description"),
        address=doc.get("address"),
        autonomous_community=doc.get("autonomous_community"),
        data_coverage=data_coverage,
    )


__all__ = [
    "AgencyToolCompanyIntelligenceV2Provider",
    "COMPANY_INTELLIGENCE_V2_IDENTITY_PATH",
    "ENGINE_VERSION",
]
