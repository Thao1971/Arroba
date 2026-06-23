from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timezone
import uuid

# LOI Models
LoiType = Literal["indicative", "binding", "preliminary_offer"]
LoiStatus = Literal["submitted", "under_review", "accepted", "rejected", "expired", "superseded"]

def generate_loi_id():
    return f"loi_{uuid.uuid4().hex[:12]}"

class LoiResponse(BaseModel):
    responded_at: Optional[datetime] = None
    responded_by: Optional[str] = None
    notes: Optional[str] = None

class LoiBase(BaseModel):
    deal_id: str
    type: LoiType = "indicative"
    offered_price: float
    price_structure: Optional[str] = None
    conditions: List[str] = []
    validity_days: int = 30

class LoiCreate(LoiBase):
    pass

class LoiInDB(LoiBase):
    model_config = ConfigDict(extra="ignore")
    
    loi_id: str = Field(default_factory=generate_loi_id)
    buyer_id: str
    document_id: Optional[str] = None
    status: LoiStatus = "submitted"
    response: Optional[LoiResponse] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoiResponseModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    loi_id: str
    deal_id: str
    buyer_id: str
    type: LoiType
    offered_price: float
    price_structure: Optional[str] = None
    conditions: List[str]
    validity_days: int
    status: LoiStatus
    response: Optional[LoiResponse] = None
    submitted_at: datetime
    expires_at: Optional[datetime] = None

# NDA Models
def generate_nda_id():
    return f"nda_{uuid.uuid4().hex[:12]}"

class NdaBase(BaseModel):
    deal_id: str

class NdaCreate(NdaBase):
    pass

class NdaInDB(NdaBase):
    model_config = ConfigDict(extra="ignore")
    
    nda_id: str = Field(default_factory=generate_nda_id)
    buyer_id: str
    template_version: str = "1.0"
    signed_document_id: Optional[str] = None
    signed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ip_address: Optional[str] = None
    valid_until: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NdaResponseModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    nda_id: str
    deal_id: str
    buyer_id: str
    signed_at: datetime
    valid_until: Optional[datetime] = None

# Mandate Models (for Advisors)
MandateStatus = Literal["active", "expired", "terminated"]

def generate_mandate_id():
    return f"mand_{uuid.uuid4().hex[:12]}"

class MandateDocument(BaseModel):
    file_id: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    validated: bool = False

class MandateBase(BaseModel):
    company_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    exclusive: bool = False

class MandateCreate(MandateBase):
    pass

class MandateInDB(MandateBase):
    model_config = ConfigDict(extra="ignore")
    
    mandate_id: str = Field(default_factory=generate_mandate_id)
    advisor_id: str
    mandate_document: Optional[MandateDocument] = None
    status: MandateStatus = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MandateResponseModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    mandate_id: str
    advisor_id: str
    company_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    exclusive: bool
    status: MandateStatus
    mandate_document: Optional[MandateDocument] = None
    created_at: datetime

# Match Models
AffinityLevel = Literal["high", "medium", "low"]

class MatchBreakdown(BaseModel):
    financial_fit: float = 0
    strategic_fit: float = 0
    operation_type_fit: float = 0
    deal_quality: float = 0
    buyer_behavior: float = 0

class MatchInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    buyer_id: str
    deal_id: str
    total_score: float = 0
    breakdown: MatchBreakdown = Field(default_factory=MatchBreakdown)
    hard_filters_passed: bool = True
    failed_filters: List[str] = []
    affinity_level: AffinityLevel = "low"
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MatchResponseModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    buyer_id: str
    deal_id: str
    total_score: float
    affinity_level: AffinityLevel
    breakdown: MatchBreakdown

# Notification Models
def generate_notification_id():
    return f"notif_{uuid.uuid4().hex[:12]}"

NotificationType = Literal[
    "user_registered", "subscription_started", "deal_created", "deal_published",
    "access_requested", "access_approved", "nda_signed", "loi_submitted",
    "loi_response", "shortlist_created", "exclusivity_granted", "dd_access_granted",
    "deal_closed", "deal_dropped", "payment_success", "payment_failed"
]
ReferenceType = Literal["deal", "loi", "user", "subscription", "company"]

class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str
    reference_type: Optional[ReferenceType] = None
    reference_id: Optional[str] = None

class NotificationInDB(NotificationBase):
    model_config = ConfigDict(extra="ignore")
    
    notification_id: str = Field(default_factory=generate_notification_id)
    user_id: str
    read: bool = False
    read_at: Optional[datetime] = None
    email_sent: bool = False
    email_sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationResponseModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    notification_id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    reference_type: Optional[ReferenceType] = None
    reference_id: Optional[str] = None
    read: bool
    created_at: datetime

# Subscription Models
SubscriptionPlanType = Literal["buyer_monthly", "seller_active", "advisor_monthly"]
SubscriptionStatus = Literal["active", "cancelled", "past_due", "trialing", "pending"]

def generate_subscription_id():
    return f"sub_{uuid.uuid4().hex[:12]}"

class PaymentRecord(BaseModel):
    stripe_payment_id: Optional[str] = None
    amount: float
    status: str
    paid_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    subscription_id: str = Field(default_factory=generate_subscription_id)
    user_id: str
    plan_type: SubscriptionPlanType
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    status: SubscriptionStatus = "pending"
    price_amount: float
    currency: str = "eur"
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    payments: List[PaymentRecord] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionResponseModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    subscription_id: str
    user_id: str
    plan_type: SubscriptionPlanType
    status: SubscriptionStatus
    price_amount: float
    currency: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
