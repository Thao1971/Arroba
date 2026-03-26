from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ValuationEstimateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    job_title: str = Field(..., min_length=1)
    company_name: str = Field(..., min_length=1)
    revenue: float = Field(..., gt=0)
    ebitda: float
    growth_12m_pct: Optional[float] = None
    employee_count: Optional[int] = None
    recurring_revenue_pct: Optional[float] = None
    category_id: str = Field(..., min_length=1)
    subcategory_id: Optional[str] = None
    sale_intent: str = Field(..., min_length=1)
    legal_confirm_accuracy: bool = Field(..., description="User confirmed data accuracy")
    legal_accept_communications: bool = Field(default=False)


class ValuationDriver(BaseModel):
    factor: str
    impact: str
    description: str


class ValuationEstimateResponse(BaseModel):
    lead_id: str
    valuation_low: float
    valuation_mid: float
    valuation_high: float
    confidence_level: str
    quality_score: float
    quality_factor: float
    drivers: List[ValuationDriver]
    multiple_min: float
    multiple_mid: float
    multiple_max: float
    multiple_source: str
    category_name: str
    subcategory_name: Optional[str] = None
    disclaimer: str


class PremiumRequestPayload(BaseModel):
    lead_id: str
    contact_phone: Optional[str] = None
    additional_notes: Optional[str] = None


class PremiumRequestResponse(BaseModel):
    request_id: str
    status: str
    message: str


class SendResultEmailRequest(BaseModel):
    lead_id: str


class PublicConfigResponse(BaseModel):
    disclaimer_short: str
    disclaimer_full: str
    premium_price: str
    premium_description: str


class TaxonomyCategoryResponse(BaseModel):
    id: str
    name: str
    subcategories: List[Dict[str, str]]


class ValuationMultipleAdmin(BaseModel):
    scope_type: str
    scope_id: str
    scope_name: str
    multiple_min: float
    multiple_mid: float
    multiple_max: float
    source: str = "manual_override"
    is_active: bool = True
    effective_from: Optional[str] = None
