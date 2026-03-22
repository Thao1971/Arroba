from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timezone
import uuid

DealStatus = Literal[
    "draft", "published", "nda", "evaluation", "intent", 
    "shortlist", "exclusivity", "due_diligence", "closed", "dropped", "reopened"
]
OperationTypeAllowed = Literal["full_sale", "partial_sale", "merger"]
DocumentAccessLevel = Literal["nda", "intent", "dd"]
AccessRequestStatus = Literal["pending", "approved", "rejected"]

def generate_deal_id():
    return f"deal_{uuid.uuid4().hex[:12]}"

class StatusHistory(BaseModel):
    status: DealStatus
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    changed_by: Optional[str] = None
    notes: Optional[str] = None

class Teaser(BaseModel):
    headline: Optional[str] = None
    description: Optional[str] = None
    highlights: List[str] = []
    revenue_display: Optional[str] = None
    ebitda_display: Optional[str] = None
    sector_display: Optional[str] = None
    geography_display: Optional[str] = None
    year_founded: Optional[int] = None

class Infomemo(BaseModel):
    generated_at: Optional[datetime] = None
    content: Optional[str] = None
    version: int = 1
    file_id: Optional[str] = None

class DataRoomDocument(BaseModel):
    name: str
    file_id: str
    access_level: DocumentAccessLevel = "dd"
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DataRoomFolder(BaseModel):
    name: str
    documents: List[DataRoomDocument] = []

class DataRoom(BaseModel):
    folders: List[DataRoomFolder] = []

class AccessRequest(BaseModel):
    buyer_id: str
    requested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: AccessRequestStatus = "pending"

class NdaSigned(BaseModel):
    buyer_id: str
    signed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    document_id: Optional[str] = None

class LoiReference(BaseModel):
    loi_id: str

class Shortlist(BaseModel):
    buyers: List[str] = []
    created_at: Optional[datetime] = None
    created_by: Optional[str] = None

class Exclusivity(BaseModel):
    buyer_id: Optional[str] = None
    granted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    terms: Optional[str] = None

class DealMetrics(BaseModel):
    views: int = 0
    teaser_views: int = 0
    access_requests_count: int = 0
    ndas_signed_count: int = 0
    lois_received_count: int = 0

class MatchingScore(BaseModel):
    buyer_id: str
    score: float
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReadinessItem(BaseModel):
    item: str
    completed: bool = False

class DealManager(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    assigned_at: Optional[datetime] = None

class Closing(BaseModel):
    closed_at: Optional[datetime] = None
    final_price: Optional[float] = None
    buyer_id: Optional[str] = None
    notes: Optional[str] = None
    evidence_documents: List[str] = []

class DealBase(BaseModel):
    operation_types_allowed: List[OperationTypeAllowed] = ["full_sale"]
    asking_price: Optional[float] = None
    price_negotiable: bool = True

class DealCreate(DealBase):
    company_id: str

class DealInDB(DealBase):
    model_config = ConfigDict(extra="ignore")
    
    deal_id: str = Field(default_factory=generate_deal_id)
    company_id: str
    owner_id: str
    status: DealStatus = "draft"
    status_history: List[StatusHistory] = []
    price_vs_valuation_flag: bool = False
    teaser: Teaser = Field(default_factory=Teaser)
    infomemo: Optional[Infomemo] = None
    dataroom: DataRoom = Field(default_factory=DataRoom)
    access_requests: List[AccessRequest] = []
    ndas_signed: List[NdaSigned] = []
    lois: List[LoiReference] = []
    shortlist: Optional[Shortlist] = None
    exclusivity: Optional[Exclusivity] = None
    metrics: DealMetrics = Field(default_factory=DealMetrics)
    matching_scores: List[MatchingScore] = []
    readiness_score: float = 0
    readiness_checklist: List[ReadinessItem] = []
    deal_manager: Optional[DealManager] = None
    closing: Optional[Closing] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    activated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

class DealResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    deal_id: str
    company_id: str
    owner_id: str
    status: DealStatus
    operation_types_allowed: List[OperationTypeAllowed]
    asking_price: Optional[float] = None
    price_negotiable: bool
    price_vs_valuation_flag: bool
    teaser: Teaser
    teaser_full: Optional[dict] = None
    infomemo: Optional[Infomemo] = None
    metrics: DealMetrics
    readiness_score: float
    readiness_checklist: List[ReadinessItem]
    deal_manager: Optional[DealManager] = None
    access_requests: List[AccessRequest] = []
    ndas_signed: List[NdaSigned] = []
    lois: List[LoiReference] = []
    created_at: datetime
    updated_at: datetime
    activated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

class DealPublicResponse(BaseModel):
    """Public teaser view for marketplace"""
    model_config = ConfigDict(extra="ignore")
    
    deal_id: str
    teaser: Teaser
    teaser_full: Optional[dict] = None
    operation_types_allowed: List[OperationTypeAllowed]
    status: DealStatus
    created_at: datetime

class DealUpdate(BaseModel):
    operation_types_allowed: Optional[List[OperationTypeAllowed]] = None
    asking_price: Optional[float] = None
    price_negotiable: Optional[bool] = None
    teaser: Optional[Teaser] = None
