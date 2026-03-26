"""
Orchestration service for valuation module.
Connects schemas, engine, config, repositories, and email.
"""
import logging
from typing import Dict
from datetime import datetime, timezone

from .engine import calculate_estimate
from .config_service import get_active_settings, get_multiples_map, get_public_config
from .repositories import (
    create_lead, get_lead, update_lead, create_run,
    create_premium_request, mark_email_sent,
)
from services.taxonomy import get_category_by_id, get_subcategory_by_id

logger = logging.getLogger(__name__)


async def run_estimate(db, user_id: str, email: str, payload: Dict) -> Dict:
    """
    Full estimation flow:
    1. Resolve taxonomy names
    2. Load config & multiples
    3. Run engine
    4. Persist lead + audit run
    5. Return result
    """
    # Resolve taxonomy
    category = get_category_by_id(payload["category_id"])
    category_name = category["name"] if category else payload["category_id"]
    subcategory_name = None
    if payload.get("subcategory_id"):
        sub = get_subcategory_by_id(payload["subcategory_id"])
        subcategory_name = sub["name"] if sub else None

    # Load config
    settings = await get_active_settings(db)
    multiples_map = await get_multiples_map(db)

    weights = settings.get("weights")
    thresholds = settings.get("thresholds")

    # Run engine
    result = calculate_estimate(
        revenue=payload["revenue"],
        ebitda=payload["ebitda"],
        growth_12m_pct=payload.get("growth_12m_pct"),
        employee_count=payload.get("employee_count"),
        recurring_revenue_pct=payload.get("recurring_revenue_pct"),
        category_id=payload["category_id"],
        subcategory_id=payload.get("subcategory_id"),
        multiples_map=multiples_map,
        weights=weights,
        thresholds=thresholds,
    )

    # Build legal snapshot
    legal_snapshot = {
        "confirm_accuracy": payload.get("legal_confirm_accuracy", False),
        "accept_communications": payload.get("legal_accept_communications", False),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "disclaimer_version": settings.get("settings_version", "1.0.0"),
    }

    # Persist lead
    lead_data = {
        "user_id": user_id,
        "email": email,
        "name": payload["name"],
        "job_title": payload["job_title"],
        "company_name": payload["company_name"],
        "revenue": payload["revenue"],
        "ebitda": payload["ebitda"],
        "growth_12m_pct": payload.get("growth_12m_pct"),
        "employee_count": payload.get("employee_count"),
        "recurring_revenue_pct": payload.get("recurring_revenue_pct"),
        "category_id": payload["category_id"],
        "category_name": category_name,
        "subcategory_id": payload.get("subcategory_id"),
        "subcategory_name": subcategory_name,
        "sale_intent": payload["sale_intent"],
        "quality_score": result["quality_score"],
        "quality_factor": result["quality_factor"],
        "multiple_source": result["multiple_source"],
        "multiple_min": result["multiple_min"],
        "multiple_mid": result["multiple_mid"],
        "multiple_max": result["multiple_max"],
        "valuation_low": result["valuation_low"],
        "valuation_mid": result["valuation_mid"],
        "valuation_high": result["valuation_high"],
        "confidence_level": result["confidence_level"],
        "legal_acceptance_snapshot": legal_snapshot,
    }

    lead_id = await create_lead(db, lead_data)

    # Create audit run
    input_snapshot = {
        "revenue": payload["revenue"],
        "ebitda": payload["ebitda"],
        "growth_12m_pct": payload.get("growth_12m_pct"),
        "employee_count": payload.get("employee_count"),
        "recurring_revenue_pct": payload.get("recurring_revenue_pct"),
        "category_id": payload["category_id"],
        "subcategory_id": payload.get("subcategory_id"),
    }
    config_snapshot = {
        "settings_version": settings.get("settings_version"),
        "weights": weights,
        "thresholds": thresholds,
        "multiples_used": {
            "min": result["multiple_min"],
            "mid": result["multiple_mid"],
            "max": result["multiple_max"],
            "source": result["multiple_source"],
        },
    }
    await create_run(db, lead_id, input_snapshot, config_snapshot, result)

    # Build response
    disclaimer = settings.get("disclaimer_full", "")
    return {
        "lead_id": lead_id,
        "valuation_low": result["valuation_low"],
        "valuation_mid": result["valuation_mid"],
        "valuation_high": result["valuation_high"],
        "confidence_level": result["confidence_level"],
        "quality_score": result["quality_score"],
        "quality_factor": result["quality_factor"],
        "drivers": result["drivers"],
        "multiple_min": result["multiple_min"],
        "multiple_mid": result["multiple_mid"],
        "multiple_max": result["multiple_max"],
        "multiple_source": result["multiple_source"],
        "category_name": category_name,
        "subcategory_name": subcategory_name,
        "disclaimer": disclaimer,
    }


async def request_premium(db, user_id: str, lead_id: str, phone: str | None, notes: str | None) -> Dict:
    """Handle premium valuation request."""
    lead = await get_lead(db, lead_id)
    if not lead:
        return None
    if lead["user_id"] != user_id:
        return None

    request_id = await create_premium_request(db, lead_id, user_id, phone, notes)
    logger.info(f"Premium valuation requested: {request_id} for lead {lead_id}")

    return {
        "request_id": request_id,
        "status": "pending",
        "message": "Tu solicitud de valoracion experta ha sido registrada. Nos pondremos en contacto contigo en las proximas 24-48 horas.",
    }


async def send_result_email(db, user_id: str, lead_id: str) -> bool:
    """Send result email (placeholder until SendGrid is active)."""
    lead = await get_lead(db, lead_id)
    if not lead or lead["user_id"] != user_id:
        return False

    settings = await get_active_settings(db)
    subject = settings.get("email_subject", "Tu estimacion inicial de valor en ARROBA")

    # Build email content
    val_low = lead["valuation_low"]
    val_mid = lead["valuation_mid"]
    val_high = lead["valuation_high"]

    email_body = f"""Hola {lead['name']},

Gracias por utilizar la herramienta de valoracion de ARROBA.

Compania: {lead['company_name']}

Estimacion de valor:
  Rango: {val_low/1e6:.1f}M EUR - {val_high/1e6:.1f}M EUR
  Valor orientativo: {val_mid/1e6:.1f}M EUR
  Nivel de confianza: {lead['confidence_level'].upper()}

Esta es una estimacion inicial basada en criterios automaticos.
No sustituye una valoracion experta ni una opinion independiente.

Proximos pasos:
- Da de alta tu agencia en ARROBA para acceder a compradores verificados
- Solicita una valoracion experta por {settings.get('premium_price', '1.950')} EUR

Equipo ARROBA / BUD Advisors"""

    # Try sending via email service
    try:
        from services.email_service import send_email
        sent = await send_email(lead["email"], "VALUATION_RESULT", {
            "name": lead["name"],
            "company_name": lead["company_name"],
            "valuation_range": f"{val_low/1e6:.1f}M - {val_high/1e6:.1f}M EUR",
            "valuation_mid": f"{val_mid/1e6:.1f}M EUR",
            "confidence": lead["confidence_level"],
            "subject": subject,
        })
    except Exception:
        sent = False
        logger.info(f"[VALUATION EMAIL PLACEHOLDER] To: {lead['email']} | Subject: {subject}")

    # Always mark as sent (tracks the attempt)
    await mark_email_sent(db, lead_id)
    return True
