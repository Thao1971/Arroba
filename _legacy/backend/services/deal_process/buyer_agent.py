"""
BuyerAgent — Valida permisos, perfil minimo y plan gating antes de cada accion.
"""
from database import db

PROFILE_REQUIREMENTS = {
    "sign_nda": ["email", "first_name"],
    "show_interest": ["email", "first_name"],
    "request_meeting": ["email", "first_name"],
    "request_dataroom": ["email", "first_name"],
    "request_document": ["email", "first_name"],
    "request_exclusivity": ["email", "first_name"],
    "submit_offer": ["email", "first_name", "last_name"],
    "submit_loi": ["email", "first_name", "last_name"],
}

PLAN_GATING = {
    "show_interest": ["buyer_pro", "buyer_proplus"],
    "request_meeting": ["buyer_pro", "buyer_proplus"],
    "request_dataroom": ["buyer_pro", "buyer_proplus"],
    "request_document": ["buyer_pro", "buyer_proplus"],
    "request_exclusivity": ["buyer_pro", "buyer_proplus"],
    "submit_offer": ["buyer_pro", "buyer_proplus"],
    "submit_loi": ["buyer_pro", "buyer_proplus"],
}


async def validate_buyer_action(buyer_id: str, action: str) -> dict:
    """Validate that buyer can perform this action. Returns {ok, reason, missing_fields}."""
    user = await db.users.find_one({"user_id": buyer_id}, {"_id": 0})
    if not user:
        return {"ok": False, "reason": "Usuario no encontrado"}

    # Plan gating
    sub = user.get("subscription") or {}
    plan = sub.get("plan_type", "free") if isinstance(sub, dict) else "free"
    allowed_plans = PLAN_GATING.get(action)
    if allowed_plans and plan not in allowed_plans:
        return {"ok": False, "reason": "plan_required", "required_plan": allowed_plans[0],
                "message": f"Esta accion requiere plan {allowed_plans[0].replace('buyer_', '').replace('plus', '+').upper()}."}

    # Profile completeness
    required_fields = PROFILE_REQUIREMENTS.get(action, [])
    bp = user.get("buyer_profile") or {}
    missing = []
    for f in required_fields:
        val = user.get(f) or bp.get(f)
        if not val:
            missing.append(f)

    if missing:
        return {"ok": False, "reason": "incomplete_profile", "missing_fields": missing,
                "message": "Tu perfil necesita mas datos para esta accion."}

    return {"ok": True}


def build_buyer_snapshot(user: dict) -> dict:
    """Build the static buyer profile visible to seller."""
    bp = user.get("buyer_profile") or {}
    return {
        "entity_name": bp.get("company_name") or user.get("company_name") or f"{user.get('first_name','')} {user.get('last_name','')}".strip(),
        "buyer_type": bp.get("buyer_type") or bp.get("type"),
        "contact_person": f"{user.get('first_name','')} {user.get('last_name','')}".strip(),
        "contact_role": bp.get("position") or bp.get("role_title"),
        "investment_ticket": bp.get("investment_ticket") or bp.get("ticket_range"),
        "sectors_of_interest": bp.get("sectors_of_interest") or bp.get("sectors") or [],
        "geography": bp.get("geography") or bp.get("target_geography"),
        "investment_thesis": bp.get("investment_thesis") or bp.get("thesis"),
        "certification_level": bp.get("certification_level") or "basico",
        "website": bp.get("website") or bp.get("company_url"),
    }
