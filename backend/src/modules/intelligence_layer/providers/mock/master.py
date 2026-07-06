"""MockMasterProvider — lee master_companies_mock y devuelve MasterRecord §6.1.

Traducción determinística de los 10 campos actuales al schema del pack §6.1:

  master_companies_mock                 →  MasterRecord (§6.1)
  ─────────────────────────────────────    ─────────────────────────────────
  master_company_id                     →  master_id
  cif                                   →  cif_normalized · identity.cif
  legal_name                            →  identity.legal_name
  sector                                →  classification.cnae_description
  region                                →  location.provincia
  country                               →  identity.country · location.pais
  financials.revenue                    →  financials.latest.revenue
  financials.ebitda                     →  financials.latest.ebitda
  financials.employees                  →  size.employees_total
  financials.fiscal_year                →  financials.latest.year
  confidence / lineage / valid_until    →  descartados (no forman parte del §6.1)
  created_at / updated_at               →  created_at / updated_at
  ─────────────────────────────────────    ─────────────────────────────────

Todo lo demás (aliases, cnae_code, ownership, provenance...) queda en `null`/`[]`.
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

        return MasterRecord(
            master_id=doc["master_company_id"],
            cif_normalized=cif,
            status="active",
            identity=Identity(
                legal_name=doc.get("legal_name"),
                commercial_name=None,
                aliases=[],
                cif=cif,
                country=country,
            ),
            classification=Classification(
                cnae_code=None,
                cnae_description=doc.get("sector"),
                cnae_division=None,
                cnae_section=None,
            ),
            location=Location(
                provincia=doc.get("region"),
                municipio=None,
                codigo_postal=None,
                pais=country,
            ),
            contact=Contact(web=None, domain=None),
            name_key=None,
            size=Size(
                employees_total=fin.get("employees"),
                capital_social=None,
            ),
            financials=Financials(latest=latest, history=[]),
            ownership=Ownership(),
            officers_count=None,
            objeto_social=None,
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
        )


__all__ = ["MockMasterProvider", "ENGINE_VERSION_MOCK"]
