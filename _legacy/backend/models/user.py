from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timezone
import uuid

# Role types
RoleType = Literal["buyer", "seller", "advisor", "admin"]
BuyerType = Literal["strategic", "financial_pe", "financial_fo", "financial_vc", "financial_holding", "other"]
OperationType = Literal["full_sale", "partial_sale", "merger"]
ControlPreference = Literal["control", "minority", "flexible"]
Urgency = Literal["low", "medium", "high"]

def generate_user_id():
    return f"user_{uuid.uuid4().hex[:12]}"

class BuyerProfile(BaseModel):
    type: Optional[BuyerType] = None
    company_name: Optional[str] = None
    company_tax_id: Optional[str] = None
    job_title: Optional[str] = None
    acquisition_thesis: Optional[str] = None
    qualitative_criteria: List[str] = []
    operation_types: List[OperationType] = []
    ticket_min: Optional[float] = None
    ticket_max: Optional[float] = None
    revenue_range_min: Optional[float] = None
    revenue_range_max: Optional[float] = None
    ebitda_margin_min_pct: Optional[float] = None
    ebitda_range_min: Optional[float] = None
    ebitda_range_max: Optional[float] = None
    sectors: List[str] = []
    taxonomy_categories: List[str] = []
    geography_country: str = "España"
    geography_provinces: List[str] = []
    geographies: List[str] = []
    urgency: Urgency = "medium"
    control_preference: ControlPreference = "flexible"
    company_verification_level: str = "not_started"
    company_verification_status: str = "not_started"
    company_tax_id_validation_status: str = "not_started"
    company_tax_id_validated_at: Optional[str] = None
    company_tax_id_validation_source: Optional[str] = None
    buyer_category: Optional[str] = None
    buyer_financial_subtype: Optional[str] = None
    profile_privacy_mode: str = "public"
    profile_complete: bool = False

class SellerProfile(BaseModel):
    company_id: Optional[str] = None

class AdvisorProfile(BaseModel):
    firm_name: Optional[str] = None
    mandate_ids: List[str] = []

class DealManager(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    assigned_at: Optional[datetime] = None

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: RoleType = "buyer"

class UserCreate(UserBase):
    password: Optional[str] = None

class UserInDB(UserBase):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str = Field(default_factory=generate_user_id)
    password_hash: Optional[str] = None
    google_id: Optional[str] = None
    buyer_profile: Optional[BuyerProfile] = None
    seller_profile: Optional[SellerProfile] = None
    advisor_profile: Optional[AdvisorProfile] = None
    deal_manager: Optional[DealManager] = None
    subscription_id: Optional[str] = None
    email_verified: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: RoleType
    buyer_profile: Optional[BuyerProfile] = None
    seller_profile: Optional[SellerProfile] = None
    advisor_profile: Optional[AdvisorProfile] = None
    deal_manager: Optional[DealManager] = None
    subscription_id: Optional[str] = None
    email_verified: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UpdateBuyerProfile(BaseModel):
    type: Optional[BuyerType] = None
    company_name: Optional[str] = None
    company_tax_id: Optional[str] = None
    job_title: Optional[str] = None
    acquisition_thesis: Optional[str] = None
    qualitative_criteria: Optional[List[str]] = None
    operation_types: Optional[List[OperationType]] = None
    ticket_min: Optional[float] = None
    ticket_max: Optional[float] = None
    revenue_range_min: Optional[float] = None
    revenue_range_max: Optional[float] = None
    ebitda_margin_min_pct: Optional[float] = None
    ebitda_range_min: Optional[float] = None
    ebitda_range_max: Optional[float] = None
    sectors: Optional[List[str]] = None
    taxonomy_categories: Optional[List[str]] = None
    geography_country: Optional[str] = None
    geography_provinces: Optional[List[str]] = None
    geographies: Optional[List[str]] = None
    urgency: Optional[Urgency] = None
    control_preference: Optional[ControlPreference] = None
    company_verification_level: Optional[str] = None
    company_tax_id_validation_status: Optional[str] = None
    company_tax_id_validated_at: Optional[str] = None
    company_tax_id_validation_source: Optional[str] = None
    buyer_category: Optional[str] = None
    buyer_financial_subtype: Optional[str] = None
    profile_privacy_mode: Optional[str] = None

class UpdateUserProfile(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[RoleType] = None
