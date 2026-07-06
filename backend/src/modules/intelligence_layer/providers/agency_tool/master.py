"""AgencyToolMasterProvider — implementa MasterProvider llamando a Agency Tool.

Endpoint contrato §6.1:  `GET /api/v1/master/{master_id}`

En Fase B.6.a este proveedor NO se instancia salvo que `AGENCY_TOOL_MODE=real`.
El scaffolding queda listo para el smoke test controlado del orquestador.
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
    OwnershipParty,
    Size,
)
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolClient,
    AgencyToolHTTPError,
    get_agency_tool_client,
)

log = get_logger("intelligence_layer.provider.agency_tool.master")


class AgencyToolMasterProvider(MasterProvider):
    provider_name = "agency_tool"

    def __init__(self, client: AgencyToolClient | None = None) -> None:
        self._client = client or get_agency_tool_client()

    async def get_by_id(self, master_id: str) -> MasterRecord:
        return await self._fetch(f"/api/v1/master/{master_id}", master_id=master_id)

    async def get_by_cif(self, cif: str) -> MasterRecord:
        # El contrato canónico usa `master_id`. Cuando el frontend consulta por CIF
        # (arroba internamente ya resuelve `cif → master_id` vía `cif_normalized`
        # de la respuesta anterior). En B.6.a el mock hace lookup directo por CIF;
        # el proveedor real requiere resolver primero (semantic search) o mantener
        # un mapping local. Marcador para B.6.d.
        raise MasterProviderError(
            "get_by_cif no implementado para agency_tool en B.6.a (requiere semantic-search)",
            error_class="client_4xx",
        )

    # ---------- Interno ----------
    async def _fetch(self, path: str, *, master_id: str) -> MasterRecord:
        try:
            resp = await self._client.request("GET", path)
        except AgencyToolHTTPError as exc:
            raise MasterProviderError(str(exc), error_class=exc.error_class) from exc

        if resp.status_code == 404:
            raise MasterNotFoundError(master_id)
        if resp.status_code == 401 or resp.status_code == 403:
            raise MasterProviderError(
                f"unauthorized {resp.status_code}", error_class="unauthorized"
            )
        if resp.status_code >= 400:
            raise MasterProviderError(
                f"upstream status {resp.status_code}",
                error_class="server_5xx" if resp.status_code >= 500 else "client_4xx",
            )

        try:
            data = resp.json()
        except ValueError as exc:
            raise MasterProviderError(f"invalid JSON: {exc}", error_class="server_5xx") from exc

        return self._to_master_record(data)

    def _to_master_record(self, doc: dict[str, Any]) -> MasterRecord:
        """Mapea el payload del contrato §6.1 al DTO MasterRecord.

        Es un mapeo 1:1 sobre el mismo schema, pero pasamos por Pydantic para
        validar formato y descartar campos extra que Agency Tool pueda añadir.
        """
        identity = Identity(**(doc.get("identity") or {}))
        classification = Classification(**(doc.get("classification") or {}))
        location = Location(**(doc.get("location") or {}))
        contact = Contact(**(doc.get("contact") or {}))
        size = Size(**(doc.get("size") or {}))

        fin_raw = doc.get("financials") or {}
        latest_raw = fin_raw.get("latest")
        latest = FinancialsLatest(**latest_raw) if latest_raw else None
        history = [FinancialsHistoryItem(**h) for h in (fin_raw.get("history") or [])]
        financials = Financials(latest=latest, history=history)

        own_raw = doc.get("ownership") or {}
        ultimate = own_raw.get("ultimate_parent")
        ownership = Ownership(
            shareholders=[OwnershipParty(**p) for p in (own_raw.get("shareholders") or [])],
            parents=[OwnershipParty(**p) for p in (own_raw.get("parents") or [])],
            ultimate_parent=OwnershipParty(**ultimate) if ultimate else None,
            investees=[OwnershipParty(**p) for p in (own_raw.get("investees") or [])],
            group_id=own_raw.get("group_id"),
        )

        return MasterRecord(
            master_id=doc["master_id"],
            cif_normalized=doc.get("cif_normalized"),
            status=doc.get("status", "active"),
            identity=identity,
            classification=classification,
            location=location,
            contact=contact,
            name_key=doc.get("name_key"),
            size=size,
            financials=financials,
            ownership=ownership,
            officers_count=doc.get("officers_count"),
            objeto_social=doc.get("objeto_social"),
            provenance=doc.get("provenance") or {},
            sources=doc.get("sources") or [],
            pipeline_version=doc.get("pipeline_version"),
            source_hash=doc.get("source_hash"),
            dirty=bool(doc.get("dirty", False)),
            created_at=_parse_dt(doc.get("created_at")),
            updated_at=_parse_dt(doc.get("updated_at")),
            built_at=_parse_dt(doc.get("built_at")),
            engine_version=doc.get("engine_version"),
            generated_at=_parse_dt(doc.get("generated_at")) or datetime.now(UTC),
        )


def _parse_dt(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


__all__ = ["AgencyToolMasterProvider"]
