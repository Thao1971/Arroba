"""
Subagente 4: CTA y Estado del Proceso
Devuelve: primary_cta, secondary_cta, process_timeline, actions_panel (recommended/available/blocked)
"""


def compute_cta_and_actions(visibility_state: str, buyer_tier: str, contact_state: str | None, has_nda: bool, engagement: dict | None) -> dict:
    """Compute primary CTA, actions panel, and process timeline."""

    # --- Primary CTA ---
    primary = _get_primary_cta(visibility_state, buyer_tier)

    # --- Secondary CTA ---
    secondary = None
    if visibility_state in ("LOCKED_CONTACT_REQUIRED", "CONTACT_REQUESTED", "TEASER_UNLOCKED"):
        secondary = {"action": "save_deal", "label": "Guardar oportunidad", "style": "secondary"}
    elif visibility_state in ("NDA_AVAILABLE",):
        secondary = {"action": "save_deal", "label": "Guardar oportunidad", "style": "secondary"}
    elif visibility_state == "OPERATIVE_ACCESS":
        secondary = {"action": "submit_questions", "label": "Hacer preguntas al vendedor", "style": "secondary"}

    # --- Process timeline ---
    timeline = _build_timeline(contact_state, has_nda, engagement)

    # --- Actions panel (recommended / available / blocked) ---
    actions = _build_actions_panel(visibility_state, buyer_tier, contact_state, has_nda, engagement)

    return {
        "primary_cta": primary,
        "secondary_cta": secondary,
        "process_timeline": timeline,
        "actions_panel": actions,
    }


def _get_primary_cta(visibility_state: str, tier: str) -> dict:
    premium = tier == "pro+"

    ctas = {
        "LOCKED_CONTACT_REQUIRED": {
            "action": "contact_request",
            "label": "Contactar con prioridad" if premium else "Contactar para ampliar informacion",
            "style": "primary_premium" if premium else "primary",
            "description": "Tu solicitud tiene prioridad como buyer Pro+." if premium else "Solicita acceso al vendedor para ver el teaser anonimizado.",
        },
        "CONTACT_REQUESTED": {
            "action": "wait",
            "label": "Solicitud prioritaria enviada" if premium else "Solicitud enviada",
            "style": "disabled",
            "description": "El vendedor esta revisando tu solicitud.",
        },
        "TEASER_UNLOCKED": {
            "action": "view_teaser",
            "label": "Ver teaser completo",
            "style": "primary",
            "description": "Accede al resumen anonimizado de esta oportunidad.",
        },
        "NDA_AVAILABLE": {
            "action": "sign_nda",
            "label": "Firmar NDA",
            "style": "primary_premium" if premium else "primary",
            "description": "Firma el acuerdo de confidencialidad para acceso completo.",
        },
        "OPERATIVE_ACCESS": {
            "action": "view_process",
            "label": "Acceder al proceso" + (" + analisis premium" if premium else ""),
            "style": "primary_premium" if premium else "primary",
            "description": "Tienes acceso operativo completo a esta oportunidad.",
        },
    }
    return ctas.get(visibility_state, ctas["LOCKED_CONTACT_REQUIRED"])


def _build_timeline(contact_state: str | None, has_nda: bool, engagement: dict | None) -> list:
    steps = []

    # Contact
    if contact_state == "accepted":
        steps.append({"step": "contact", "label": "Contacto", "status": "completed"})
    elif contact_state == "pending":
        steps.append({"step": "contact", "label": "Contacto", "status": "pending"})
    else:
        steps.append({"step": "contact", "label": "Contacto", "status": "available"})

    # NDA
    if has_nda:
        steps.append({"step": "nda", "label": "NDA", "status": "completed"})
    elif contact_state == "accepted":
        steps.append({"step": "nda", "label": "NDA", "status": "available"})
    else:
        steps.append({"step": "nda", "label": "NDA", "status": "locked"})

    # Interest / LOI
    eng_type = (engagement or {}).get("type")
    eng_stage = (engagement or {}).get("stage")
    if eng_type == "LOI":
        steps.append({"step": "interest", "label": "Interes", "status": "completed"})
        steps.append({"step": "loi", "label": "LOI", "status": "completed"})
    elif eng_type == "INTEREST" and eng_stage in ("ACCEPTED", "SHORTLISTED"):
        steps.append({"step": "interest", "label": "Interes", "status": "completed"})
        steps.append({"step": "loi", "label": "LOI", "status": "available"})
    elif eng_type == "INTEREST":
        steps.append({"step": "interest", "label": "Interes", "status": "pending"})
        steps.append({"step": "loi", "label": "LOI", "status": "locked"})
    elif has_nda:
        steps.append({"step": "interest", "label": "Interes", "status": "available"})
        steps.append({"step": "loi", "label": "LOI", "status": "locked"})
    else:
        steps.append({"step": "interest", "label": "Interes", "status": "locked"})
        steps.append({"step": "loi", "label": "LOI", "status": "locked"})

    return steps


def _build_actions_panel(visibility_state: str, tier: str, contact_state: str | None, has_nda: bool, engagement: dict | None) -> dict:
    recommended = []
    available = []
    blocked = []

    if visibility_state == "LOCKED_CONTACT_REQUIRED":
        recommended.append({"key": "contact_request", "label": "Solicitar contacto"})
        available.append({"key": "save_deal", "label": "Guardar oportunidad"})
        blocked.append({"key": "sign_nda", "reason": "contact_required", "label": "Firmar NDA"})
        blocked.append({"key": "view_infomemo", "reason": "contact_required", "label": "Ver infomemo"})
        blocked.append({"key": "dataroom", "reason": "contact_required", "label": "Data Room"})
        blocked.append({"key": "send_interest", "reason": "contact_required", "label": "Enviar interes"})

    elif visibility_state == "CONTACT_REQUESTED":
        available.append({"key": "save_deal", "label": "Guardar oportunidad"})
        blocked.append({"key": "sign_nda", "reason": "contact_pending", "label": "Firmar NDA"})
        blocked.append({"key": "view_infomemo", "reason": "contact_pending", "label": "Ver infomemo"})

    elif visibility_state == "TEASER_UNLOCKED":
        available.append({"key": "view_teaser", "label": "Ver teaser"})
        available.append({"key": "save_deal", "label": "Guardar oportunidad"})
        if tier == "free":
            blocked.append({"key": "sign_nda", "reason": "plan_required", "label": "Firmar NDA", "upgrade": "pro"})
            blocked.append({"key": "view_infomemo", "reason": "plan_required", "label": "Ver infomemo", "upgrade": "pro"})
            blocked.append({"key": "dataroom", "reason": "plan_required", "label": "Data Room", "upgrade": "pro"})

    elif visibility_state == "NDA_AVAILABLE":
        recommended.append({"key": "sign_nda", "label": "Firmar NDA"})
        available.append({"key": "view_teaser", "label": "Ver teaser"})
        available.append({"key": "save_deal", "label": "Guardar oportunidad"})
        blocked.append({"key": "view_infomemo", "reason": "nda_required", "label": "Ver infomemo"})
        blocked.append({"key": "dataroom", "reason": "nda_required", "label": "Data Room"})

    elif visibility_state == "OPERATIVE_ACCESS":
        available.append({"key": "view_infomemo", "label": "Ver infomemo"})
        available.append({"key": "dataroom", "label": "Acceder al Data Room"})
        available.append({"key": "submit_questions", "label": "Hacer preguntas"})
        available.append({"key": "save_deal", "label": "Guardar oportunidad"})

        eng_type = (engagement or {}).get("type")
        if eng_type != "LOI" and eng_type != "INTEREST":
            recommended.append({"key": "send_interest", "label": "Enviar interes"})
        elif eng_type == "INTEREST":
            recommended.append({"key": "send_loi", "label": "Enviar LOI"})

        if tier != "pro+":
            blocked.append({"key": "premium_analysis", "reason": "plan_required", "label": "Analisis premium", "upgrade": "pro+"})

    return {"recommended": recommended, "available": available, "blocked": blocked}
