import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.shared.types import Role


def new_user_id() -> str:
    return f"user_{uuid.uuid4().hex[:12]}"


class RegisterPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)
    full_name: str | None = None


class LoginPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str


class SessionExchangePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    session_id: str


class UserInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=new_user_id)
    email: EmailStr
    hashed_password: str | None = None
    google_id: str | None = None
    full_name: str | None = None
    role: Role = Role.subscriber
    email_verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_login: datetime | None = None


class UserPublic(BaseModel):
    """Shape returned to the frontend. Never includes password hash."""
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    full_name: str | None = None
    role: Role
    email_verified: bool
    created_at: datetime
    last_login: datetime | None = None


class AuthResponse(BaseModel):
    user: UserPublic
    session_expires_at: datetime
