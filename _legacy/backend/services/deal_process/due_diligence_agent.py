"""
DueDiligenceAgent — Checklist compartida por áreas con bloqueos, progreso y gobernanza.
Seller/ARROBA gestionan estados. Buyer solo comenta.
"""
from database import db
from datetime import datetime, timezone
import uuid

DD_SECTIONS = [
    {"id": "financiera", "name": "Financiera", "items": [
        "Cuentas anuales últimos 3 ejercicios", "Informe de auditoría", "Balances mensuales último año",
        "Detalle de deuda bancaria", "Previsiones y presupuestos", "Contratos de financiación",
    ]},
    {"id": "legal", "name": "Legal", "items": [
        "Escrituras de constitución", "Poderes y representación", "Litigios activos o potenciales",
        "Contratos con clientes principales", "Contratos con proveedores clave", "Propiedad intelectual y marcas",
    ]},
    {"id": "fiscal", "name": "Fiscal", "items": [
        "Declaraciones fiscales últimos 3 años", "Actas de inspección", "Contingencias fiscales",
        "IVA e impuestos indirectos", "Retenciones y obligaciones sociales",
    ]},
    {"id": "comercial", "name": "Comercial", "items": [
        "Cartera de clientes activa", "Concentración de clientes top 10", "Pipeline comercial",
        "Contratos recurrentes", "Tasa de retención / churn",
    ]},
    {"id": "operaciones", "name": "Operaciones", "items": [
        "Procesos operativos clave", "Herramientas y plataformas", "Dependencias de terceros",
        "SLAs y calidad de servicio", "Capacidad operativa",
    ]},
    {"id": "laboral", "name": "Laboral / Equipo", "items": [
        "Organigrama actualizado", "Contratos laborales clave", "Convenio colectivo",
        "Rotación de personal", "Dependencia de personas clave", "Planes de incentivos",
    ]},
    {"id": "tecnologia", "name": "Tecnología / Sistemas", "items": [
        "Stack tecnológico", "Propiedad del código", "Infraestructura y hosting",
        "Seguridad y compliance", "Licencias de software", "Deuda técnica identificada",
    ]},
]


async def start_dd(process_id: str, deal_id: str, buyer_id: str) -> dict:
    """Initialize DD checklist for a deal process."""
    now = datetime.now(timezone.utc).isoformat()
    checklist_id = f"dd_{uuid.uuid4().hex[:12]}"

    sections = []
    for sec in DD_SECTIONS:
        items = []
        for item_label in sec["items"]:
            items.append({
                "item_id": f"ddi_{uuid.uuid4().hex[:8]}",
                "label": item_label,
                "status": "pendiente",
                "blocked_reason": None,
                "blocked_action": None,
                "comments": [],
                "updated_by": None,
                "updated_at": None,
            })
        sections.append({
            "block_id": sec["id"],
            "name": sec["name"],
            "status": "pendiente",
            "items": items,
        })

    doc = {
        "checklist_id": checklist_id,
        "process_id": process_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "status": "en_curso",
        "sections": sections,
        "blockers": [],
        "completion_pct": 0,
        "created_at": now,
        "updated_at": now,
    }
    await db.dd_checklists.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


async def get_dd_dashboard(deal_id: str, buyer_id: str = None) -> dict:
    """Get DD dashboard with progress and blockers."""
    query = {"deal_id": deal_id}
    if buyer_id:
        query["buyer_id"] = buyer_id
    doc = await db.dd_checklists.find_one(query, {"_id": 0})
    if not doc:
        return None

    # Compute progress
    total_items = 0
    resolved_items = 0
    blocked_count = 0
    section_progress = []

    for sec in doc.get("sections", []):
        items = sec.get("items", [])
        sec_total = len(items)
        sec_resolved = sum(1 for i in items if i["status"] == "resuelto")
        sec_blocked = sum(1 for i in items if i["status"] == "bloqueado")
        total_items += sec_total
        resolved_items += sec_resolved
        blocked_count += sec_blocked

        sec_pct = round(sec_resolved / max(sec_total, 1) * 100)
        # Auto-complete section
        if sec_resolved == sec_total and sec_total > 0:
            sec["status"] = "completado"
        elif sec_blocked > 0:
            sec["status"] = "bloqueado"
        elif sec_resolved > 0:
            sec["status"] = "en_curso"

        section_progress.append({
            "block_id": sec["block_id"],
            "name": sec["name"],
            "status": sec["status"],
            "total": sec_total,
            "resolved": sec_resolved,
            "blocked": sec_blocked,
            "completion_pct": sec_pct,
        })

    completion_pct = round(resolved_items / max(total_items, 1) * 100)

    # Check if DD is complete
    all_complete = all(sp["completion_pct"] == 100 for sp in section_progress)
    dd_status = "completada" if all_complete else "bloqueada" if blocked_count > 0 else "en_curso"

    # Update stored values
    await db.dd_checklists.update_one(
        {"checklist_id": doc["checklist_id"]},
        {"$set": {"completion_pct": completion_pct, "status": dd_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    return {
        "checklist_id": doc["checklist_id"],
        "deal_id": deal_id,
        "status": dd_status,
        "completion_pct": completion_pct,
        "total_items": total_items,
        "resolved_items": resolved_items,
        "blocked_count": blocked_count,
        "section_progress": section_progress,
        "sections": doc["sections"],
        "blockers": [b for sec in doc["sections"] for i in sec["items"] if i["status"] == "bloqueado" for b in [{"item_id": i["item_id"], "label": i["label"], "section": sec["name"], "reason": i["blocked_reason"], "action": i["blocked_action"]}]],
    }


async def update_item(checklist_id: str, item_id: str, actor_id: str, actor_role: str, payload: dict) -> dict:
    """Update a DD checklist item. Seller/ARROBA change status. Buyer only comments."""
    doc = await db.dd_checklists.find_one({"checklist_id": checklist_id}, {"_id": 0})
    if not doc:
        return None

    now = datetime.now(timezone.utc).isoformat()
    action = payload.get("action")  # update_status, comment, mark_blocked, resolve_blocked

    for sec in doc["sections"]:
        for item in sec["items"]:
            if item["item_id"] == item_id:
                if action == "comment":
                    item["comments"].append({
                        "author_id": actor_id, "role": actor_role,
                        "text": payload.get("text", ""), "at": now,
                        "internal": payload.get("internal", False),
                    })
                elif action == "update_status" and actor_role in ("seller", "admin"):
                    item["status"] = payload.get("status", item["status"])
                    item["updated_by"] = actor_id
                    item["updated_at"] = now
                elif action == "mark_blocked" and actor_role in ("seller", "admin"):
                    item["status"] = "bloqueado"
                    item["blocked_reason"] = payload.get("reason", "")
                    item["blocked_action"] = payload.get("action_required", "")
                    item["updated_by"] = actor_id
                    item["updated_at"] = now
                elif action == "resolve_blocked" and actor_role in ("seller", "admin"):
                    item["status"] = "resuelto"
                    item["blocked_reason"] = None
                    item["blocked_action"] = None
                    item["updated_by"] = actor_id
                    item["updated_at"] = now

                await db.dd_checklists.update_one(
                    {"checklist_id": checklist_id},
                    {"$set": {"sections": doc["sections"], "updated_at": now}}
                )
                return {"item_id": item_id, "status": item["status"], "updated": True}

    return None
