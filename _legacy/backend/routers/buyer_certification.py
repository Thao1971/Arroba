"""
Buyer Certification & Plan Enforcement service.
Computes certification status, plan limits, and interaction tracking.
"""
from fastapi import APIRouter, Depends
from database import db, users_collection
from routers.auth import get_current_user
from models.user import UserResponse
from datetime import datetime, timezone

router = APIRouter(prefix="/buyer", tags=["Buyer"])


CERTIFICATION_CRITERIA = [
    # Completitud del perfil
    {"id": "email_verified", "label": "Email verificado", "weight": 1, "category": "completitud"},
    {"id": "profile_complete", "label": "Perfil de comprador completo", "weight": 2, "category": "completitud"},
    {"id": "job_title_declared", "label": "Cargo declarado", "weight": 1, "category": "completitud"},
    {"id": "investment_thesis", "label": "Tesis de inversión definida", "weight": 2, "category": "completitud"},
    # Confianza real
    {"id": "company_declared", "label": "Empresa declarada", "weight": 2, "category": "confianza"},
    {"id": "company_tax_id", "label": "CIF declarado", "weight": 1, "category": "confianza"},
    {"id": "corporate_email", "label": "Email corporativo", "weight": 1, "category": "confianza"},
    {"id": "nda_signed", "label": "Al menos un NDA firmado", "weight": 1, "category": "confianza"},
]

PLAN_CONFIG = {
    "free": {
        "label": "Free",
        "monthly_interaction_limit": 0,
        "can_view_full_detail": False,
        "can_manage_interactions": False,
        "can_access_dataroom": False,
        "priority_access": False,
        "features_summary": "Exploración básica y guardado de oportunidades.",
        "upgrade_message": "Mejora a Pro para gestionar interacciones, firmar NDAs y acceder a documentación.",
        "next_plan": "pro",
    },
    "pro": {
        "label": "Pro",
        "monthly_interaction_limit": 5,
        "can_view_full_detail": True,
        "can_manage_interactions": True,
        "can_access_dataroom": True,
        "priority_access": False,
        "features_summary": "Acceso operativo con hasta 5 interacciones al mes.",
        "upgrade_message": "Mejora a Pro+ para interacciones ilimitadas y acceso prioritario.",
        "next_plan": "pro+",
    },
    "pro+": {
        "label": "Pro+",
        "monthly_interaction_limit": -1,
        "can_view_full_detail": True,
        "can_manage_interactions": True,
        "can_access_dataroom": True,
        "priority_access": True,
        "features_summary": "Acceso completo, prioritario e interacciones ilimitadas.",
        "upgrade_message": None,
        "next_plan": None,
    },
}


def _is_corporate_email(email: str) -> bool:
    """Check if email looks corporate (not free provider)."""
    free_providers = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'live.com', 'icloud.com', 'protonmail.com']
    domain = email.split('@')[-1].lower() if '@' in email else ''
    return domain not in free_providers and '.' in domain


def _get_plan_tier(user: UserResponse) -> str:
    sub = getattr(user, 'subscription', None)
    if sub:
        pt = getattr(sub, 'plan_type', '') or ''
        if 'proplus' in pt or 'pro+' in pt:
            return 'pro+'
        if 'pro' in pt:
            return 'pro'
    return 'free'


async def _compute_certification(user: UserResponse) -> dict:
    """Compute certification status for a buyer."""
    bp = user.buyer_profile or {}
    if hasattr(bp, 'model_dump'):
        bp = bp.model_dump()

    nda_count = await db.nda_signatures.count_documents({"buyer_user_id": user.user_id})

    checks = {
        "email_verified": bool(user.email),
        "profile_complete": bool(bp.get("profile_complete")),
        "company_declared": bool(bp.get("company_name")),
        "company_tax_id": bool(bp.get("company_tax_id")),
        "job_title_declared": bool(bp.get("job_title")),
        "investment_thesis": bool(bp.get("acquisition_thesis")),
        "nda_signed": nda_count > 0,
        "corporate_email": _is_corporate_email(user.email or ""),
    }

    total_weight = sum(c["weight"] for c in CERTIFICATION_CRITERIA)
    earned_weight = sum(
        c["weight"] for c in CERTIFICATION_CRITERIA if checks.get(c["id"])
    )
    score = round((earned_weight / total_weight) * 100) if total_weight > 0 else 0

    if score >= 80:
        level = "certified"
        level_label = "Comprador Certificado"
        seller_trust_text = "Comprador con verificación completa. Perfil, empresa e identidad validados."
    elif score >= 50:
        level = "verified"
        level_label = "Comprador Verificado"
        seller_trust_text = "Comprador con perfil verificado y actividad demostrada en la plataforma."
    else:
        level = "basic"
        level_label = "Comprador Básico"
        seller_trust_text = "Comprador registrado. Aún no ha completado la verificación."

    criteria_detail = []
    for c in CERTIFICATION_CRITERIA:
        criteria_detail.append({
            "id": c["id"],
            "label": c["label"],
            "completed": checks.get(c["id"], False),
            "weight": c["weight"],
            "category": c["category"],
        })

    return {
        "level": level,
        "level_label": level_label,
        "seller_trust_text": seller_trust_text,
        "score": score,
        "criteria": criteria_detail,
        "nda_count": nda_count,
        "completed_count": sum(1 for v in checks.values() if v),
        "total_count": len(checks),
    }


@router.get("/certification")
async def get_buyer_certification(user: UserResponse = Depends(get_current_user)):
    """Get buyer certification status, plan info, and interaction limits."""
    if user.role != "buyer":
        return {"error": "Solo disponible para buyers"}

    cert = await _compute_certification(user)
    plan_tier = _get_plan_tier(user)
    plan_info = PLAN_CONFIG.get(plan_tier, PLAN_CONFIG["free"])

    # Interaction tracking
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    interactions_used = await db.buyer_interactions.count_documents({
        "user_id": user.user_id,
        "created_at": {"$gte": month_start.isoformat()},
    })

    limit = plan_info["monthly_interaction_limit"]
    interactions_remaining = max(0, limit - interactions_used) if limit >= 0 else -1

    return {
        "certification": cert,
        "plan": {
            "tier": plan_tier,
            "label": plan_info["label"],
            "monthly_interaction_limit": limit,
            "interactions_used": interactions_used,
            "interactions_remaining": interactions_remaining,
            "can_view_full_detail": plan_info["can_view_full_detail"],
            "can_manage_interactions": plan_info["can_manage_interactions"],
            "can_access_dataroom": plan_info["can_access_dataroom"],
            "priority_access": plan_info["priority_access"],
            "features_summary": plan_info["features_summary"],
            "upgrade_message": plan_info["upgrade_message"],
            "next_plan": plan_info["next_plan"],
        },
    }
