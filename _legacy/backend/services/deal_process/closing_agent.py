"""
ClosingAgent — Cierre básico trazable del deal.
Solo ARROBA/admin gestiona estados de cierre. Seller y buyer solo lectura.
"""
from database import db
from datetime import datetime, timezone
import uuid


async def init_closing(deal_id: str, buyer_id: str, payload: dict) -> dict:
    """Initialize closing record after DD completion."""
    now = datetime.now(timezone.utc).isoformat()
    closing_id = f"cls_{uuid.uuid4().hex[:12]}"

    # Get LOI data for final terms
    loi = await db.formal_lois.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_id, "status": "accepted"},
        {"_id": 0}
    )

    doc = {
        "closing_id": closing_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "status": "preparado",
        "final_price": payload.get("final_price") or (loi or {}).get("enterprise_value"),
        "final_structure": payload.get("final_structure") or {
            "cash": (loi or {}).get("cash_at_closing"),
            "deferred": (loi or {}).get("deferred_payment"),
            "earnout": (loi or {}).get("earnout"),
        },
        "buyer_name": payload.get("buyer_name"),
        "exclusivity_status": "activa" if (loi or {}).get("exclusivity_requested") else "no_solicitada",
        "dd_status": "completada",
        "closing_checklist": [
            {"id": "doc_legal", "label": "Documentación legal final", "status": "pendiente"},
            {"id": "val_economica", "label": "Validación económica final", "status": "pendiente"},
            {"id": "firma_docs", "label": "Firma de documentos", "status": "pendiente"},
            {"id": "condiciones_previas", "label": "Condiciones precedentes", "status": "pendiente"},
            {"id": "confirmacion_cierre", "label": "Confirmación de cierre", "status": "pendiente"},
        ],
        "target_close_date": payload.get("target_close_date"),
        "signed_at": None,
        "closed_at": None,
        "close_notes": "",
        "created_at": now,
        "updated_at": now,
    }
    await db.closing_records.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


async def get_closing(deal_id: str) -> dict:
    """Get closing record."""
    doc = await db.closing_records.find_one({"deal_id": deal_id}, {"_id": 0})
    return doc


async def update_closing(closing_id: str, payload: dict) -> dict:
    """Update closing status or checklist item. Only ARROBA/admin."""
    doc = await db.closing_records.find_one({"closing_id": closing_id}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")

    if action == "update_checklist":
        item_id = payload.get("item_id")
        new_status = payload.get("status")
        for item in doc.get("closing_checklist", []):
            if item["id"] == item_id:
                item["status"] = new_status
                break
        await db.closing_records.update_one(
            {"closing_id": closing_id},
            {"$set": {"closing_checklist": doc["closing_checklist"], "updated_at": now}}
        )

    elif action == "update_status":
        new_status = payload.get("status")
        update = {"status": new_status, "updated_at": now}
        if new_status == "cerrado_exito":
            update["closed_at"] = now
            # Update deal status
            await db.deals.update_one({"deal_id": doc["deal_id"]}, {"$set": {"status": "closed", "closed_at": now}})
        elif new_status == "cerrado_caido":
            update["closed_at"] = now
            await db.deals.update_one({"deal_id": doc["deal_id"]}, {"$set": {"status": "dropped", "dropped_at": now}})
        if payload.get("notes"):
            update["close_notes"] = payload["notes"]
        await db.closing_records.update_one({"closing_id": closing_id}, {"$set": update})

    return {"closing_id": closing_id, "status": payload.get("status", doc["status"]), "updated": True}
