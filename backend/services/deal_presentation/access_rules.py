"""
Subagente 2: Agente de Acceso y Reglas por Plan
Decide qué puede ver y hacer el buyer según plan, contacto, NDA y proceso.
"""

# Visibility states (ordered progression)
STATES = [
    "LOCKED_CONTACT_REQUIRED",
    "CONTACT_REQUESTED",
    "CONTACT_ACCEPTED",
    "TEASER_UNLOCKED",
    "NDA_AVAILABLE",
    "NDA_SIGNED",
    "OPERATIVE_ACCESS",
]


def compute_access(
    buyer_plan: str,
    contact_state: str | None,
    has_nda: bool,
    engagement_stage: str | None,
) -> dict:
    """Compute visibility state and allowed/locked actions for a buyer."""

    plan = buyer_plan.lower().replace(" ", "")
    if "pro+" in plan or "proplus" in plan:
        tier = "pro+"
    elif "pro" in plan:
        tier = "pro"
    else:
        tier = "free"

    # --- Determine visibility_state ---
    # Free tier caps: never gets past TEASER_UNLOCKED
    if tier == "free":
        if contact_state == "accepted":
            visibility_state = "TEASER_UNLOCKED"
        elif contact_state == "pending":
            visibility_state = "CONTACT_REQUESTED"
        else:
            visibility_state = "LOCKED_CONTACT_REQUIRED"
    else:
        # Pro / Pro+ progression
        if has_nda:
            visibility_state = "OPERATIVE_ACCESS"
        elif contact_state == "accepted":
            visibility_state = "NDA_AVAILABLE"
        elif contact_state == "pending":
            visibility_state = "CONTACT_REQUESTED"
        else:
            visibility_state = "LOCKED_CONTACT_REQUIRED"

    # --- Allowed actions per state × tier ---
    allowed = []
    locked = []
    upgrade_prompts = []

    if visibility_state == "LOCKED_CONTACT_REQUIRED":
        allowed.append("contact_request")
        allowed.append("save_deal")
        locked.append("view_teaser")
        locked.append("sign_nda")
        locked.append("view_infomemo")
        locked.append("view_dataroom")
        if tier == "free":
            locked.append("view_teaser_detail")

    elif visibility_state == "CONTACT_REQUESTED":
        allowed.append("save_deal")
        locked.append("view_teaser")
        locked.append("sign_nda")
        locked.append("view_infomemo")

    elif visibility_state == "TEASER_UNLOCKED":
        allowed.append("view_teaser")
        allowed.append("save_deal")
        if tier == "free":
            locked.append("sign_nda")
            locked.append("view_infomemo")
            locked.append("view_dataroom")
            upgrade_prompts.append({
                "action": "sign_nda",
                "message": "Mejora a Pro para firmar NDA y acceder a documentación completa.",
                "target_plan": "pro",
            })
        else:
            allowed.append("sign_nda")

    elif visibility_state == "NDA_AVAILABLE":
        allowed.append("view_teaser")
        allowed.append("sign_nda")
        allowed.append("save_deal")
        locked.append("view_infomemo")
        locked.append("view_dataroom")

    elif visibility_state in ("NDA_SIGNED", "OPERATIVE_ACCESS"):
        allowed.append("view_teaser")
        allowed.append("view_infomemo")
        allowed.append("view_dataroom")
        allowed.append("submit_questions")
        allowed.append("save_deal")
        if tier == "pro+" or tier == "pro":
            allowed.append("submit_loi")
        if tier == "pro+":
            allowed.append("view_premium_analysis")
        else:
            locked.append("view_premium_analysis")
            if tier != "pro+":
                upgrade_prompts.append({
                    "action": "view_premium_analysis",
                    "message": "Accede al Anlisis Premium con Pro+: fortalezas, riesgos y encaje con tu tesis.",
                    "target_plan": "pro+",
                })

    # --- Teaser visibility by tier ---
    teaser_visible = tier in ("pro", "pro+") or contact_state == "accepted" or (has_nda and tier != "free")
    card_only = tier == "free" and contact_state != "accepted"

    return {
        "visibility_state": visibility_state,
        "buyer_tier": tier,
        "teaser_visible": teaser_visible,
        "card_only": card_only,
        "allowed_actions": allowed,
        "locked_actions": locked,
        "upgrade_prompts": upgrade_prompts,
    }
