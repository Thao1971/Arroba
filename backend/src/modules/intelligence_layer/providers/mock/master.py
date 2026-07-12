"""MockMasterProvider — lee master_companies_mock y devuelve MasterRecord §6.1.

Sprint F0.1 (2026-07-06): además de la traducción determinística §6.1
existente, este mock puebla los **campos V2 opcionales** (`activity`,
`sectors`, `mercantile_status`, `legal_form`, `incorporation_date`,
`data_coverage`, …) usando literales conservadores derivables del propio
documento mock. Los campos no derivables quedan `None` (Regla R4 · no
inventar). Esto permite renderizar los COMP-1001..1005 del Header en modo
mock sin requerir el proveedor V2 real.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from src.core.database import get_db
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
    MasterRecord,
    Ownership,
    Size,
)

log = get_logger("intelligence_layer.provider.mock.master")

ENGINE_VERSION_MOCK = "mock-1.0.0"


class MockMasterProvider(MasterProvider):
    provider_name = "mock"

    async def get_by_id(self, master_id: str) -> MasterRecord:
        doc = await get_db().master_companies_mock.find_one(
            {"master_company_id": master_id}, {"_id": 0}
        )
        if not doc:
            raise MasterNotFoundError(f"master_id={master_id}")
        return self._to_master_record(doc)

    async def get_by_cif(self, cif: str) -> MasterRecord:
        doc = await get_db().master_companies_mock.find_one(
            {"cif": cif.upper()}, {"_id": 0}
        )
        if not doc:
            raise MasterNotFoundError(f"cif={cif}")
        return self._to_master_record(doc)

    # ---------- Traducción ----------
    def _to_master_record(self, doc: dict[str, Any]) -> MasterRecord:
        fin = doc.get("financials") or {}
        cif = doc.get("cif")
        country = doc.get("country") or "ES"

        latest = FinancialsLatest(
            year=fin.get("fiscal_year"),
            basis=None,
            revenue=fin.get("revenue"),
            ebitda=fin.get("ebitda"),
            ebitda_margin=None,
            equity=None,
            total_assets=None,
            net_income=None,
            operating_income=None,
        )

        # Campos V2 mock: se pueblan sólo los que el propio documento mock trae
        # (via extensiones opcionales). Los no presentes → None. R4 aplica.
        v2 = doc.get("v2_identity") or {}
        legal_form = v2.get("legal_form")
        sectors = list(v2.get("sectors") or [])
        activity = v2.get("activity") or doc.get("sector")
        activity_status = v2.get("activity_status")
        mercantile_status = v2.get("mercantile_status")
        record_status = v2.get("record_status")
        is_listed = v2.get("is_listed")
        listed_market = v2.get("listed_market")
        incorporation_date = v2.get("incorporation_date")
        address = v2.get("address")
        autonomous_community = v2.get("autonomous_community")
        description = v2.get("description")
        commercial_name = v2.get("commercial_name")

        # data_coverage: mapa {field: True/False} basado en presencia real
        data_coverage: dict[str, bool] = {
            "legal_name": bool(doc.get("legal_name")),
            "cif": bool(cif),
            "activity": bool(activity),
            "sectors": bool(sectors),
            "employees_total": fin.get("employees") is not None,
            "revenue": fin.get("revenue") is not None,
            "mercantile_status": bool(mercantile_status),
            "legal_form": bool(legal_form),
            "incorporation_date": bool(incorporation_date),
            "address": bool(address),
            "description": bool(description),
        }

        return MasterRecord(
            master_id=doc["master_company_id"],
            cif_normalized=cif,
            status="active",
            identity=Identity(
                legal_name=doc.get("legal_name"),
                commercial_name=commercial_name,
                aliases=[],
                cif=cif,
                country=country,
            ),
            classification=Classification(
                cnae_code=v2.get("cnae_code"),
                cnae_description=doc.get("sector"),
                cnae_division=None,
                cnae_section=None,
            ),
            location=Location(
                provincia=doc.get("region"),
                municipio=v2.get("locality"),
                codigo_postal=v2.get("postal_code"),
                pais=country,
            ),
            contact=Contact(
                web=v2.get("website"),
                domain=v2.get("domain"),
            ),
            name_key=None,
            size=Size(
                employees_total=fin.get("employees"),
                capital_social=v2.get("capital_social"),
            ),
            financials=Financials(latest=latest, history=[]),
            ownership=Ownership(),
            officers_count=None,
            objeto_social=v2.get("corporate_purpose"),
            provenance={},
            sources=[],
            pipeline_version=None,
            source_hash=None,
            dirty=False,
            created_at=doc.get("created_at"),
            updated_at=doc.get("updated_at"),
            built_at=None,
            engine_version=ENGINE_VERSION_MOCK,
            generated_at=datetime.now(UTC),
            # F0.1 · campos V2 opcionales
            activity=activity,
            activity_status=activity_status,
            mercantile_status=mercantile_status,
            record_status=record_status,
            legal_form=legal_form,
            incorporation_date=incorporation_date,
            is_listed=is_listed,
            listed_market=listed_market,
            sectors=sectors,
            description=description,
            address=address,
            autonomous_community=autonomous_community,
            data_coverage=data_coverage,
        )


__all__ = ["MockMasterProvider", "ENGINE_VERSION_MOCK"]
