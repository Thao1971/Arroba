"""
Subagente 4: Agente de CTA y Estado
Decide cual es la accion principal visible en cada momento.
"""


def compute_cta(visibility_state: str, buyer_tier: str, contact_state: str | None) -> dict:
    """Compute the primary CTA based on current state."""

    cta_map = {
        # Free flow
        ("free", "LOCKED_CONTACT_REQUIRED"): {
            "action": "contact_request",
            "label": "Contactar para ampliar informacion",
            "style": "primary",
            "description": "Solicita acceso al vendedor para ver el teaser anonimizado.",
        },
        ("free", "CONTACT_REQUESTED"): {
            "action": "wait",
            "label": "Solicitud enviada",
            "style": "disabled",
            "description": "El vendedor esta revisando tu solicitud de contacto.",
        },
        ("free", "TEASER_UNLOCKED"): {
            "action": "view_teaser",
            "label": "Ver teaser",
            "style": "primary",
            "description": "Accede al resumen anonimizado de esta oportunidad.",
        },
        # Pro flow
        ("pro", "LOCKED_CONTACT_REQUIRED"): {
            "action": "contact_request",
            "label": "Contactar",
            "style": "primary",
            "description": "Inicia el proceso de contacto con el vendedor.",
        },
        ("pro", "CONTACT_REQUESTED"): {
            "action": "wait",
            "label": "Solicitud enviada",
            "style": "disabled",
            "description": "El vendedor esta revisando tu solicitud.",
        },
        ("pro", "CONTACT_ACCEPTED"): {
            "action": "contact_request",
            "label": "Contactar",
            "style": "primary",
            "description": "Contacto aceptado. Solicita acceso al proceso.",
        },
        ("pro", "NDA_AVAILABLE"): {
            "action": "sign_nda",
            "label": "Firmar NDA",
            "style": "primary",
            "description": "Firma el acuerdo de confidencialidad para acceder a la documentacion completa.",
        },
        ("pro", "NDA_SIGNED"): {
            "action": "view_infomemo",
            "label": "Ver infomemo",
            "style": "primary",
            "description": "Accede al memorando informativo completo.",
        },
        ("pro", "OPERATIVE_ACCESS"): {
            "action": "view_infomemo",
            "label": "Acceder al proceso",
            "style": "primary",
            "description": "Tienes acceso operativo completo a esta oportunidad.",
        },
        # Pro+ flow (same as Pro with premium additions)
        ("pro+", "LOCKED_CONTACT_REQUIRED"): {
            "action": "contact_request",
            "label": "Contactar con prioridad",
            "style": "primary_premium",
            "description": "Tu solicitud tiene prioridad como buyer Pro+.",
        },
        ("pro+", "CONTACT_REQUESTED"): {
            "action": "wait",
            "label": "Solicitud prioritaria enviada",
            "style": "disabled",
            "description": "El vendedor esta revisando tu solicitud prioritaria.",
        },
        ("pro+", "NDA_AVAILABLE"): {
            "action": "sign_nda",
            "label": "Firmar NDA",
            "style": "primary_premium",
            "description": "Firma el NDA para acceso completo con analisis premium.",
        },
        ("pro+", "NDA_SIGNED"): {
            "action": "view_infomemo",
            "label": "Ver infomemo + analisis premium",
            "style": "primary_premium",
            "description": "Accede al memorando y al analisis IA exclusivo Pro+.",
        },
        ("pro+", "OPERATIVE_ACCESS"): {
            "action": "view_infomemo",
            "label": "Acceder al proceso",
            "style": "primary_premium",
            "description": "Acceso operativo completo con inteligencia premium.",
        },
    }

    key = (buyer_tier, visibility_state)
    cta = cta_map.get(key)

    if not cta:
        # Fallback
        if visibility_state in ("NDA_SIGNED", "OPERATIVE_ACCESS"):
            cta = {
                "action": "view_infomemo",
                "label": "Acceder al proceso",
                "style": "primary",
                "description": "Tienes acceso operativo.",
            }
        elif visibility_state == "NDA_AVAILABLE":
            cta = {
                "action": "sign_nda",
                "label": "Firmar NDA",
                "style": "primary",
                "description": "Firma el acuerdo de confidencialidad.",
            }
        else:
            cta = {
                "action": "contact_request",
                "label": "Contactar",
                "style": "primary",
                "description": "Solicita acceso.",
            }

    # Secondary CTA
    secondary = None
    if visibility_state in ("LOCKED_CONTACT_REQUIRED", "CONTACT_REQUESTED"):
        secondary = {
            "action": "save_deal",
            "label": "Guardar oportunidad",
            "style": "secondary",
        }
    elif visibility_state in ("NDA_SIGNED", "OPERATIVE_ACCESS"):
        secondary = {
            "action": "submit_questions",
            "label": "Hacer preguntas",
            "style": "secondary",
        }

    return {
        "primary_cta": cta,
        "secondary_cta": secondary,
    }
