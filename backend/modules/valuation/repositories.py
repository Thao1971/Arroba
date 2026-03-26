"""
Repository layer for valuation module — MongoDB operations.
"""
from datetime import datetime, timezone
from typing import Dict, Optional
import uuid


async def create_lead(db, data: Dict) -> str:
    """Insert a new valuation lead and return its lead_id."""
    lead_id = f"vlead_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "lead_id": lead_id,
        **data,
        "email_sent": False,
        "email_sent_at": None,
        "email_template_version": None,
        "premium_requested": False,
        "premium_requested_at": None,
        "result_version": "1.0",
        "created_at": now,
        "updated_at": now,
    }
    await db.valuation_leads.insert_one(doc)
    return lead_id


async def get_lead(db, lead_id: str) -> Optional[Dict]:
    """Fetch a valuation lead by lead_id."""
    return await db.valuation_leads.find_one(
        {"lead_id": lead_id}, {"_id": 0}
    )


async def get_leads_by_user(db, user_id: str) -> list:
    """Fetch all leads for a user."""
    cursor = db.valuation_leads.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1)
    return await cursor.to_list(length=50)


async def update_lead(db, lead_id: str, updates: Dict):
    """Update specific fields on a lead."""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.valuation_leads.update_one(
        {"lead_id": lead_id}, {"$set": updates}
    )


async def create_run(db, lead_id: str, input_snapshot: Dict, config_snapshot: Dict, output_snapshot: Dict) -> str:
    """Create an audit trail entry for a valuation calculation."""
    run_id = f"vrun_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "run_id": run_id,
        "lead_id": lead_id,
        "input_snapshot": input_snapshot,
        "config_snapshot": config_snapshot,
        "output_snapshot": output_snapshot,
        "created_at": now,
    }
    await db.valuation_runs.insert_one(doc)
    return run_id


async def create_premium_request(db, lead_id: str, user_id: str, contact_phone: Optional[str], notes: Optional[str]) -> str:
    """Create a premium valuation request."""
    request_id = f"vprem_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "request_id": request_id,
        "lead_id": lead_id,
        "user_id": user_id,
        "contact_phone": contact_phone,
        "additional_notes": notes,
        "status": "pending",
        "created_at": now,
    }
    await db.valuation_premium_requests.insert_one(doc)
    # Mark lead
    await update_lead(db, lead_id, {
        "premium_requested": True,
        "premium_requested_at": now,
    })
    return request_id


async def mark_email_sent(db, lead_id: str, template_version: str = "1.0"):
    """Mark that the result email was sent."""
    now = datetime.now(timezone.utc).isoformat()
    await update_lead(db, lead_id, {
        "email_sent": True,
        "email_sent_at": now,
        "email_template_version": template_version,
    })
