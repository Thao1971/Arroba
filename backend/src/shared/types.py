"""Cross-module shared enums and types. NO module-specific logic here."""
from enum import Enum


class Role(str, Enum):
    anonymous = "anonymous"
    subscriber = "subscriber"
    corporate = "corporate"
    investor = "investor"
    advisor = "advisor"
    admin = "admin"


class OrgRole(str, Enum):
    owner = "owner"
    admin = "admin"
    operator = "operator"


class OrgStatus(str, Enum):
    active = "active"
    suspended = "suspended"
    archived = "archived"


class MembershipStatus(str, Enum):
    pending = "pending"
    active = "active"
    removed = "removed"


class InvitationStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    expired = "expired"
    cancelled = "cancelled"
