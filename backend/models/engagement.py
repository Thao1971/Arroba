"""Engagement model — unified Interest + LOI for deal negotiations"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timezone
import uuid

EngagementType = Literal["INTEREST", "LOI"]
EngagementStage = Literal["SUBMITTED", "VIEWED", "SHORTLISTED", "REJECTED", "EXCLUSIVITY"]
OperationType = Literal["full_sale", "partial_sale", "merger"]
BuyerType = Literal["strategic", "financial", "other"]


def generate_engagement_id():
    return f"eng_{uuid.uuid4().hex[:12]}"


class EngagementCreate(BaseModel):
    """Create an Interest engagement"""
    deal_id: str
    valuation_range_min: Optional[float] = None
    valuation_range_max: Optional[float] = None
    operation_type: OperationType = "full_sale"
    message: Optional[str] = None
    legal_accepted: bool = False


class LoiUpgrade(BaseModel):
    """Upgrade an Interest to LOI"""
    valuation_offer: float
    structure: Optional[str] = None  # "cash", "earn_out", "mixed"
    acquisition_percentage: float = 100.0
    conditions: Optional[str] = None
    is_binding: bool = False


class EngagementInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")

    engagement_id: str = Field(default_factory=generate_engagement_id)
    deal_id: str
    buyer_id: str
    type: EngagementType = "INTEREST"
    stage: EngagementStage = "SUBMITTED"

    # Interest fields
    valuation_range_min: Optional[float] = None
    valuation_range_max: Optional[float] = None
    operation_type: OperationType = "full_sale"
    message: Optional[str] = None

    # LOI fields (populated on upgrade)
    valuation_offer: Optional[float] = None
    structure: Optional[str] = None
    acquisition_percentage: Optional[float] = None
    conditions: Optional[str] = None
    is_binding: bool = False

    # Legal
    legal_accepted: bool = False
    ip: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    viewed_at: Optional[datetime] = None
    upgraded_to_loi_at: Optional[datetime] = None

    # Buyer meta (denormalized for seller comparator)
    buyer_name: Optional[str] = None
    buyer_type: Optional[BuyerType] = None


class EngagementResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    engagement_id: str
    deal_id: str
    buyer_id: str
    type: str
    stage: str
    valuation_range_min: Optional[float] = None
    valuation_range_max: Optional[float] = None
    operation_type: str = "full_sale"
    message: Optional[str] = None
    valuation_offer: Optional[float] = None
    structure: Optional[str] = None
    acquisition_percentage: Optional[float] = None
    conditions: Optional[str] = None
    is_binding: bool = False
    buyer_name: Optional[str] = None
    buyer_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    viewed_at: Optional[datetime] = None
    upgraded_to_loi_at: Optional[datetime] = None
