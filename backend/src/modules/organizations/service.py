"""Organizations service — owns db.organizations, db.memberships, db.org_invitations.
Reads from db.users go through auth.service.get_user_public (Boundary First)."""
from datetime import UTC, datetime, timedelta

from src.core.database import get_db
from src.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from src.core.logging import get_logger
from src.core.security import new_random_token
from src.modules.auth.service import get_user_public
from src.modules.organizations.models import (
    CreateOrgPayload,
    CreateOrgResponse,
    InvitationInDB,
    InvitationPublic,
    InvitePayload,
    MembershipInDB,
    MembershipPublic,
    OrgInDB,
    OrgPublic,
    OrgWithMembership,
)
from src.shared.types import InvitationStatus, MembershipStatus, OrgRole

log = get_logger("organizations")


async def create_org(payload: CreateOrgPayload, created_by: str) -> CreateOrgResponse:
    db = get_db()
    org = OrgInDB(**payload.model_dump(), created_by=created_by)
    await db.organizations.insert_one(org.model_dump(mode="json"))
    membership = MembershipInDB(
        user_id=created_by,
        org_id=org.org_id,
        role_in_org=OrgRole.owner,
        accepted_at=datetime.now(UTC),
        status=MembershipStatus.active,
    )
    await db.memberships.insert_one(membership.model_dump(mode="json"))
    log.info("orgs.created", org_id=org.org_id, created_by=created_by)
    return CreateOrgResponse(
        org=OrgPublic(**org.model_dump(mode="json")),
        membership=MembershipPublic(**membership.model_dump(mode="json")),
    )


async def list_my_orgs(user_id: str) -> list[OrgWithMembership]:
    db = get_db()
    out: list[OrgWithMembership] = []
    cursor = db.memberships.find(
        {"user_id": user_id, "status": MembershipStatus.active.value}, {"_id": 0}
    )
    async for m in cursor:
        org = await db.organizations.find_one({"org_id": m["org_id"]}, {"_id": 0})
        if org:
            out.append(
                OrgWithMembership(
                    org=OrgPublic(**org),
                    membership=MembershipPublic(**m),
                )
            )
    return out


async def get_org(org_id: str, requesting_user_id: str) -> OrgPublic:
    db = get_db()
    await _require_active_member(requesting_user_id, org_id)
    doc = await db.organizations.find_one({"org_id": org_id}, {"_id": 0})
    if not doc:
        raise NotFoundError("org_not_found")
    return OrgPublic(**doc)


async def list_memberships_for_user(user_id: str) -> list[MembershipPublic]:
    """Cross-module accessor used by auth /me."""
    db = get_db()
    docs = db.memberships.find(
        {"user_id": user_id, "status": MembershipStatus.active.value}, {"_id": 0}
    )
    return [MembershipPublic(**d) async for d in docs]


async def list_members(org_id: str, requesting_user_id: str) -> list[MembershipPublic]:
    await _require_active_member(requesting_user_id, org_id)
    db = get_db()
    docs = db.memberships.find(
        {"org_id": org_id, "status": MembershipStatus.active.value}, {"_id": 0}
    )
    return [MembershipPublic(**d) async for d in docs]


async def create_invitation(
    org_id: str, payload: InvitePayload, invited_by: str
) -> InvitationPublic:
    await _require_role(invited_by, org_id, {OrgRole.owner, OrgRole.admin})
    db = get_db()
    token = new_random_token()
    expires = datetime.now(UTC) + timedelta(days=14)
    invite = InvitationInDB(
        org_id=org_id,
        email=payload.email.lower(),
        role_in_org=payload.role_in_org,
        invited_by=invited_by,
        token=token,
        expires_at=expires,
    )
    await db.org_invitations.insert_one(invite.model_dump(mode="json"))
    log.info("orgs.invite_created", org_id=org_id, email=invite.email)
    return InvitationPublic(**invite.model_dump(mode="json"))


async def accept_invitation(token: str, accepting_user_id: str) -> MembershipPublic:
    db = get_db()
    inv = await db.org_invitations.find_one({"token": token}, {"_id": 0})
    if not inv:
        raise NotFoundError("invitation_not_found")
    if inv["status"] != InvitationStatus.pending.value:
        raise ConflictError("invitation_already_used", code="invitation_already_used")
    exp = inv["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=UTC)
    if exp < datetime.now(UTC):
        await db.org_invitations.update_one(
            {"token": token}, {"$set": {"status": InvitationStatus.expired.value}}
        )
        raise ConflictError("invitation_expired", code="invitation_expired")

    user = await get_user_public(accepting_user_id)
    if not user or user.email.lower() != inv["email"].lower():
        raise ForbiddenError("invitation_email_mismatch", code="invitation_email_mismatch")

    existing = await db.memberships.find_one(
        {"user_id": accepting_user_id, "org_id": inv["org_id"]}, {"_id": 0}
    )
    now = datetime.now(UTC)
    if existing:
        await db.memberships.update_one(
            {"membership_id": existing["membership_id"]},
            {"$set": {"status": MembershipStatus.active.value, "accepted_at": now}},
        )
        membership_doc = await db.memberships.find_one(
            {"membership_id": existing["membership_id"]}, {"_id": 0}
        )
    else:
        m = MembershipInDB(
            user_id=accepting_user_id,
            org_id=inv["org_id"],
            role_in_org=OrgRole(inv["role_in_org"]),
            invited_by=inv["invited_by"],
            accepted_at=now,
            status=MembershipStatus.active,
        )
        await db.memberships.insert_one(m.model_dump(mode="json"))
        membership_doc = m.model_dump(mode="json")

    await db.org_invitations.update_one(
        {"token": token},
        {"$set": {"status": InvitationStatus.accepted.value, "accepted_at": now}},
    )
    log.info("orgs.invite_accepted", org_id=inv["org_id"], user_id=accepting_user_id)
    return MembershipPublic(**membership_doc)


async def _require_active_member(user_id: str, org_id: str) -> MembershipInDB:
    db = get_db()
    doc = await db.memberships.find_one(
        {"user_id": user_id, "org_id": org_id, "status": MembershipStatus.active.value},
        {"_id": 0},
    )
    if not doc:
        raise ForbiddenError("not_an_active_member", code="not_an_active_member")
    return MembershipInDB(**doc)


async def _require_role(
    user_id: str, org_id: str, allowed: set[OrgRole]
) -> MembershipInDB:
    m = await _require_active_member(user_id, org_id)
    if m.role_in_org not in allowed:
        raise ForbiddenError("insufficient_org_role", code="insufficient_org_role")
    return m
