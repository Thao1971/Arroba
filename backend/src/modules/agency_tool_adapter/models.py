import uuid
from datetime import UTC, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Lineage(str, Enum):
    raw = "raw"
    normalized = "normalized"
    inferred = "inferred"
    ai_generated = "ai_generated"


Profile = Literal["full", "summary"]


def new_master_company_id() -> str:
    return f"mc_{uuid.uuid4().hex[:12]}"


class Financials(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revenue: float | None = None
    ebitda: float | None = None
    employees: int | None = None
    fiscal_year: int | None = None


class EnrichedCompany(BaseModel):
    """Single canonical shape consumed by arroba.com. The real Agency Tool MUST
    return this exact contract (see /app/_requirements_for_agency_tool/README.md
    REQ-001)."""
    model_config = ConfigDict(extra="forbid")
    master_company_id: str
    cif: str | None = None
    legal_name: str
    sector: str | None = None
    region: str | None = None
    country: str = "ES"
    financials: Financials | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    lineage: Lineage
    valid_until: datetime | None = None
    # Reserved — will be populated by the real Agency Tool (E2+).
    signals: list[dict] = Field(default_factory=list)
    scores: dict = Field(default_factory=dict)
    recommendations: list[dict] = Field(default_factory=list)
    # Provenance marker. The adapter is the ONLY component that sets this.
    source: str = "mock"


class CreateMasterCompanyMockPayload(BaseModel):
    """Admin payload to seed master_companies_mock. We do NOT accept
    source/signals/scores/recommendations from the admin — those belong to the
    Agency Tool boundary and the adapter is the only writer."""
    model_config = ConfigDict(extra="forbid")
    master_company_id: str | None = None  # generated if missing
    cif: str | None = None
    legal_name: str = Field(min_length=2, max_length=200)
    sector: str | None = None
    region: str | None = None
    country: str = "ES"
    financials: Financials | None = None
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    lineage: Lineage = Lineage.normalized
    valid_until: datetime | None = None


class UpdateMasterCompanyMockPayload(BaseModel):
    """All fields optional; partial update. Same boundaries as Create."""
    model_config = ConfigDict(extra="forbid")
    cif: str | None = None
    legal_name: str | None = None
    sector: str | None = None
    region: str | None = None
    country: str | None = None
    financials: Financials | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    lineage: Lineage | None = None
    valid_until: datetime | None = None


class MasterCompanyMockInDB(BaseModel):
    """Internal DB shape. Includes audit fields the public contract hides."""
    model_config = ConfigDict(extra="ignore")
    master_company_id: str = Field(default_factory=new_master_company_id)
    cif: str | None = None
    legal_name: str
    sector: str | None = None
    region: str | None = None
    country: str = "ES"
    financials: Financials | None = None
    confidence: float = 0.85
    lineage: Lineage = Lineage.normalized
    valid_until: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    created_by: str | None = None


class AdapterStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    mode: Literal["mock", "real"]
    since: str
    endpoint_when_real: str
    note: str


class StatusResponse(BaseModel):
    adapters: list[AdapterStatus]
