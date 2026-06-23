import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.shared.types import InvitationStatus, MembershipStatus, OrgRole, OrgStatus


def new_org_id() -> str:
    return f"org_{uuid.uuid4().hex[:12]}"


def new_membership_id() -> str:
    return f"mem_{uuid.uuid4().hex[:12]}"


def new_invitation_id() -> str:
    return f"inv_{uuid.uuid4().hex[:12]}"


class CreateOrgPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    legal_name: str = Field(min_length=2, max_length=200)
    tax_id: str | None = None
    country: str = "ES"


class InvitePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    role_in_org: OrgRole = OrgRole.operator


class OrgInDB(BaseModel):
    org_id: str = Field(default_factory=new_org_id)
    legal_name: str
    tax_id: str | None = None
    country: str = "ES"
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    plan_type: str | None = None
    status: OrgStatus = OrgStatus.active


class OrgPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    org_id: str
    legal_name: str
    tax_id: str | None = None
    country: str
    created_by: str
    created_at: datetime
    plan_type: str | None = None
    status: OrgStatus


class MembershipInDB(BaseModel):
    membership_id: str = Field(default_factory=new_membership_id)
    user_id: str
    org_id: str
    role_in_org: OrgRole
    invited_by: str | None = None
    accepted_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    status: MembershipStatus = MembershipStatus.active


class MembershipPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    membership_id: str
    user_id: str
    org_id: str
    role_in_org: OrgRole
    status: MembershipStatus
    created_at: datetime
    accepted_at: datetime | None = None


class InvitationInDB(BaseModel):
    invitation_id: str = Field(default_factory=new_invitation_id)
    org_id: str
    email: EmailStr
    role_in_org: OrgRole
    invited_by: str
    token: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: datetime
    accepted_at: datetime | None = None
    status: InvitationStatus = InvitationStatus.pending


class InvitationPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    invitation_id: str
    org_id: str
    email: str
    role_in_org: OrgRole
    token: str
    expires_at: datetime
    status: InvitationStatus


class CreateOrgResponse(BaseModel):
    org: OrgPublic
    membership: MembershipPublic


class OrgWithMembership(BaseModel):
    org: OrgPublic
    membership: MembershipPublic
