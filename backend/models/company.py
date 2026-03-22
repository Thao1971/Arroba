from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timezone
import uuid

CompanyType = Literal["digital_agency", "creative_agency", "media_agency", "tech_studio", "consultancy"]
FounderDependency = Literal["low", "medium", "high"]
RecurringRevenueType = Literal["retainer", "project", "mixed"]
DataSource = Literal["CIS", "IBERINFORM", "MANUAL", "MIXED"]

def generate_company_id():
    return f"comp_{uuid.uuid4().hex[:12]}"

class FinancialField(BaseModel):
    value: Optional[float] = None
    source: DataSource = "MANUAL"
    last_updated: Optional[str] = None

class Financial(BaseModel):
    year: int
    revenue: float
    ebitda: float
    ebitda_margin: Optional[float] = None
    net_income: Optional[float] = None
    recurring_revenue_pct: Optional[float] = None
    client_concentration_top5: Optional[float] = None
    growth_rate: Optional[float] = None
    data_source: DataSource = "MANUAL"
    source_details: Optional[dict] = None

class ValuationInputs(BaseModel):
    founder_dependency: FounderDependency = "medium"
    recurring_revenue_type: RecurringRevenueType = "mixed"
    main_clients: Optional[int] = None
    client_retention_rate: Optional[float] = None
    tech_assets: bool = False
    proprietary_ip: bool = False

class Valuation(BaseModel):
    calculated_at: Optional[datetime] = None
    ebitda_normalized: Optional[float] = None
    multiple_min: Optional[float] = None
    multiple_max: Optional[float] = None
    valuation_min: Optional[float] = None
    valuation_max: Optional[float] = None
    drivers: List[str] = []

class CompanyDocument(BaseModel):
    type: Literal["profile", "financial", "credentials"]
    name: str
    file_id: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyBase(BaseModel):
    legal_name: str
    trade_name: Optional[str] = None
    cif: Optional[str] = None
    acronym: Optional[str] = None
    country: str = "España"
    region: Optional[str] = None
    city: Optional[str] = None
    company_type: CompanyType = "digital_agency"
    sectors: List[str] = []
    specializations: List[str] = []
    founded_year: Optional[int] = None
    employees_count: Optional[int] = None
    description: Optional[str] = None
    highlights: List[str] = []
    website: Optional[str] = None
    linkedin: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyInDB(CompanyBase):
    model_config = ConfigDict(extra="ignore")
    
    company_id: str = Field(default_factory=generate_company_id)
    owner_id: str
    owner_type: Literal["seller", "advisor"] = "seller"
    mandate_id: Optional[str] = None
    financials: List[Financial] = []
    valuation_inputs: Optional[ValuationInputs] = None
    valuation: Optional[Valuation] = None
    documents: List[CompanyDocument] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    imported_from_api: bool = False
    api_import_date: Optional[datetime] = None

class CompanyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    company_id: str
    owner_id: str
    owner_type: str
    legal_name: str
    trade_name: Optional[str] = None
    cif: Optional[str] = None
    acronym: Optional[str] = None
    country: str
    region: Optional[str] = None
    city: Optional[str] = None
    company_type: CompanyType
    sectors: List[str] = []
    specializations: List[str] = []
    founded_year: Optional[int] = None
    employees_count: Optional[int] = None
    financials: List[Financial] = []
    valuation_inputs: Optional[ValuationInputs] = None
    valuation: Optional[Valuation] = None
    description: Optional[str] = None
    highlights: List[str] = []
    website: Optional[str] = None
    linkedin: Optional[str] = None
    documents: List[CompanyDocument] = []
    created_at: datetime
    updated_at: datetime

class CompanyUpdate(BaseModel):
    legal_name: Optional[str] = None
    trade_name: Optional[str] = None
    cif: Optional[str] = None
    acronym: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    company_type: Optional[CompanyType] = None
    sectors: Optional[List[str]] = None
    specializations: Optional[List[str]] = None
    founded_year: Optional[int] = None
    employees_count: Optional[int] = None
    description: Optional[str] = None
    highlights: Optional[List[str]] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None

class FinancialsUpdate(BaseModel):
    financials: List[Financial]
    valuation_inputs: Optional[ValuationInputs] = None
