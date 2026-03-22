"""Email service — Abstract interface with SendGrid scaffolding.
IMPORTANT: No actual email sending until SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are configured.
All events are tracked regardless of email sending capability."""
import os
import logging

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.environ.get("SENDGRID_FROM_EMAIL")

# Email templates (Spanish)
TEMPLATES = {
    "NDA_SIGNED": {
        "subject": "NDA firmado — {buyer_name} ha firmado el acuerdo",
        "body": """Hola {seller_name},

{buyer_name} ha firmado el NDA para tu deal "{deal_title}".

Ya puede acceder al infomemo y al Data Room.

Revisa tu panel de gestión para ver la actividad:
{deal_url}

— Arroba""",
    },
    "INTEREST_SUBMITTED": {
        "subject": "Nuevo interés recibido — {buyer_name}",
        "body": """Hola {seller_name},

{buyer_name} ha expresado interés en tu deal "{deal_title}".

Tipo de operación: {operation_type}
Rango de valoración: {valuation_range}

Revisa y compara en tu panel:
{deal_url}

— Arroba""",
    },
    "LOI_SUBMITTED": {
        "subject": "LOI recibida — {buyer_name} ha enviado una oferta",
        "body": """Hola {seller_name},

{buyer_name} ha enviado una Carta de Intención (LOI) para tu deal "{deal_title}".

Valoración ofertada: {valuation_offer}€
Estructura: {structure}

Revisa los detalles en tu panel:
{deal_url}

— Arroba""",
    },
    "DATA_ROOM_ACCESSED": {
        "subject": "Primer acceso al Data Room — {buyer_name}",
        "body": """Hola {seller_name},

{buyer_name} ha accedido por primera vez al Data Room de tu deal "{deal_title}".

Esto indica interés activo. Monitoriza su actividad en:
{deal_url}

— Arroba""",
    },
    "DOCUMENT_DOWNLOADED": {
        "subject": "Documento descargado — {buyer_name}",
        "body": """Hola {seller_name},

{buyer_name} ha descargado "{document_name}" de la carpeta {folder} en tu deal "{deal_title}".

Revisa toda la actividad:
{deal_url}

— Arroba""",
    },
}


async def send_email(to_email: str, template_key: str, context: dict):
    """Send an email using the specified template.
    If SendGrid is not configured, logs the event instead."""

    template = TEMPLATES.get(template_key)
    if not template:
        logger.warning(f"Email template not found: {template_key}")
        return False

    subject = template["subject"].format(**{k: context.get(k, "") for k in _extract_placeholders(template["subject"])})
    body = template["body"].format(**{k: context.get(k, "") for k in _extract_placeholders(template["body"])})

    if not SENDGRID_API_KEY or not SENDGRID_FROM_EMAIL:
        logger.info(f"[EMAIL PLACEHOLDER] To: {to_email} | Subject: {subject}")
        return False

    # SendGrid integration (activated when keys are provided)
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            plain_text_content=body,
        )
        sg.send(message)
        logger.info(f"[EMAIL SENT] To: {to_email} | Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL ERROR] {e}")
        return False


def _extract_placeholders(template_str: str) -> list:
    """Extract {placeholder} names from a template string."""
    import re
    return re.findall(r'\{(\w+)\}', template_str)
