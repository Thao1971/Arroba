"""Data Room router — document upload, download, folder management, access control, tracking"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Response
from datetime import datetime, timezone
from typing import Optional
import uuid

from database import db
from models.user import UserResponse
from routers.auth import get_current_user
from services.events_service import track_event
from services.storage_service import put_object, get_object, generate_storage_path

router = APIRouter(prefix="/dataroom", tags=["DataRoom"])

documents_collection = db.dataroom_documents
access_log_collection = db.dataroom_access_log
permissions_collection = db.dataroom_permissions

# Default folder structure
DEFAULT_FOLDERS = [
    {"id": "financiero", "name": "Financiero", "subcategories": ["P&L", "Balance", "Cash Flow", "KPIs"]},
    {"id": "legal", "name": "Legal", "subcategories": ["Estatutos", "Contratos relevantes", "Cap table"]},
    {"id": "fiscal", "name": "Fiscal", "subcategories": ["Impuestos", "Declaraciones"]},
    {"id": "comercial", "name": "Comercial", "subcategories": ["Clientes", "Pipeline", "Contratos comerciales"]},
    {"id": "operaciones", "name": "Operaciones", "subcategories": ["Procesos", "Proveedores"]},
    {"id": "equipo", "name": "Equipo (RRHH)", "subcategories": ["Organigrama", "Contratos clave"]},
    {"id": "otros", "name": "Otros", "subcategories": []},
]

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


# ==========================================
# FOLDER STRUCTURE
# ==========================================

@router.get("/folders")
async def get_folder_structure():
    """Get default folder structure for data room"""
    return DEFAULT_FOLDERS


# ==========================================
# SELLER: UPLOAD & MANAGE
# ==========================================

@router.post("/deals/{deal_id}/upload")
async def upload_document(
    deal_id: str,
    file: UploadFile = File(...),
    folder: str = Form("otros"),
    subcategory: str = Form(""),
    current_user: UserResponse = Depends(get_current_user)
):
    """Seller uploads a document to the data room"""
    from database import deals_collection
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal no encontrado")
    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    # Read file
    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máximo 50MB)")

    # Upload to storage
    storage_path = generate_storage_path(deal_id, folder, file.filename)
    result = put_object(storage_path, data, file.content_type or "application/octet-stream")

    # Store reference in DB
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    doc = {
        "document_id": doc_id,
        "deal_id": deal_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type or "application/octet-stream",
        "size": result.get("size", len(data)),
        "folder": folder,
        "subcategory": subcategory or "",
        "uploaded_by": current_user.user_id,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await documents_collection.insert_one(doc)

    await track_event("DOCUMENT_UPLOADED", deal_id=deal_id, user_id=current_user.user_id,
                       metadata={"document_id": doc_id, "folder": folder, "filename": file.filename})

    return {
        "document_id": doc_id,
        "filename": file.filename,
        "folder": folder,
        "subcategory": subcategory,
        "size": doc["size"],
        "created_at": doc["created_at"],
    }


@router.get("/deals/{deal_id}/documents")
async def list_documents(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """List all documents in a deal's data room (seller or buyer with access)"""
    from database import deals_collection
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal no encontrado")

    is_owner = deal["owner_id"] == current_user.user_id or current_user.role == "admin"

    if not is_owner:
        # Buyer: check NDA
        has_nda = any(nda["buyer_id"] == current_user.user_id for nda in deal.get("ndas_signed", []))
        if not has_nda:
            raise HTTPException(status_code=403, detail="Debes firmar el NDA para acceder al Data Room")

        # Get buyer's folder permissions
        allowed_folders = await _get_buyer_allowed_folders(deal_id, current_user.user_id)

        # Track access
        await _log_access(current_user.user_id, deal_id, None, "DATA_ROOM_ACCESSED")

    cursor = documents_collection.find(
        {"deal_id": deal_id, "is_deleted": False},
        {"_id": 0}
    ).sort("created_at", -1)
    docs = await cursor.to_list(500)

    # Filter by folder permissions for buyer
    if not is_owner:
        if allowed_folders is not None:
            docs = [d for d in docs if d["folder"] in allowed_folders]

    # Group by folder
    folders_map = {}
    for d in docs:
        f = d["folder"]
        if f not in folders_map:
            folders_map[f] = []
        folders_map[f].append({
            "document_id": d["document_id"],
            "filename": d["original_filename"],
            "content_type": d["content_type"],
            "size": d["size"],
            "folder": d["folder"],
            "subcategory": d.get("subcategory", ""),
            "created_at": d["created_at"],
        })

    return {
        "deal_id": deal_id,
        "is_owner": is_owner,
        "folders": folders_map,
        "total_documents": len(docs),
    }


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Soft-delete a document (seller only)"""
    doc = await documents_collection.find_one({"document_id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    from database import deals_collection
    deal = await deals_collection.find_one({"deal_id": doc["deal_id"]}, {"_id": 0})
    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    await documents_collection.update_one(
        {"document_id": document_id},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"deleted": True}


# ==========================================
# DOWNLOAD
# ==========================================

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Download a document (with access check + tracking)"""
    doc = await documents_collection.find_one(
        {"document_id": document_id, "is_deleted": False}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    from database import deals_collection
    deal = await deals_collection.find_one({"deal_id": doc["deal_id"]}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal no encontrado")

    is_owner = deal["owner_id"] == current_user.user_id or current_user.role == "admin"

    if not is_owner:
        # Buyer access check
        has_nda = any(nda["buyer_id"] == current_user.user_id for nda in deal.get("ndas_signed", []))
        if not has_nda:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        allowed_folders = await _get_buyer_allowed_folders(doc["deal_id"], current_user.user_id)
        if allowed_folders is not None and doc["folder"] not in allowed_folders:
            raise HTTPException(status_code=403, detail="No tienes acceso a esta carpeta")

        # Track download
        await _log_access(current_user.user_id, doc["deal_id"], document_id, "DOWNLOAD")
        await track_event("DOCUMENT_DOWNLOADED", deal_id=doc["deal_id"], user_id=current_user.user_id,
                           metadata={"document_id": document_id, "folder": doc["folder"]})

    # Get file from storage
    data, content_type = get_object(doc["storage_path"])

    return Response(
        content=data,
        media_type=doc.get("content_type", content_type),
        headers={
            "Content-Disposition": f'attachment; filename="{doc["original_filename"]}"'
        }
    )


@router.get("/documents/{document_id}/view")
async def view_document(
    document_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """View/preview a document (track VIEW event)"""
    doc = await documents_collection.find_one(
        {"document_id": document_id, "is_deleted": False}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    from database import deals_collection
    deal = await deals_collection.find_one({"deal_id": doc["deal_id"]}, {"_id": 0})
    is_owner = deal["owner_id"] == current_user.user_id or current_user.role == "admin"

    if not is_owner:
        has_nda = any(nda["buyer_id"] == current_user.user_id for nda in deal.get("ndas_signed", []))
        if not has_nda:
            raise HTTPException(status_code=403, detail="Acceso denegado")
        allowed_folders = await _get_buyer_allowed_folders(doc["deal_id"], current_user.user_id)
        if allowed_folders is not None and doc["folder"] not in allowed_folders:
            raise HTTPException(status_code=403, detail="No tienes acceso a esta carpeta")

        await _log_access(current_user.user_id, doc["deal_id"], document_id, "VIEW")
        await track_event("DOCUMENT_VIEWED", deal_id=doc["deal_id"], user_id=current_user.user_id,
                           metadata={"document_id": document_id, "folder": doc["folder"]})

    data, content_type = get_object(doc["storage_path"])
    return Response(content=data, media_type=doc.get("content_type", content_type))


# ==========================================
# ACCESS CONTROL (SELLER MANAGES)
# ==========================================

@router.get("/deals/{deal_id}/permissions")
async def get_permissions(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get folder permissions for all buyers (seller view)"""
    from database import deals_collection
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal no encontrado")
    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    cursor = permissions_collection.find({"deal_id": deal_id}, {"_id": 0})
    perms = await cursor.to_list(100)

    # Enrich with buyer info
    from database import users_collection
    result = []
    for p in perms:
        buyer = await users_collection.find_one({"user_id": p["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "email": 1})
        result.append({
            "buyer_id": p["buyer_id"],
            "buyer_name": f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() if buyer else "Desconocido",
            "buyer_email": buyer.get("email", "") if buyer else "",
            "allowed_folders": p.get("allowed_folders"),  # None = full access
            "updated_at": p.get("updated_at"),
        })

    return {"deal_id": deal_id, "permissions": result}


@router.put("/deals/{deal_id}/permissions/{buyer_id}")
async def set_buyer_permissions(
    deal_id: str,
    buyer_id: str,
    body: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Set folder-level permissions for a buyer. allowed_folders=null means full access."""
    from database import deals_collection
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal no encontrado")
    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    allowed_folders = body.get("allowed_folders")  # list or null

    await permissions_collection.update_one(
        {"deal_id": deal_id, "buyer_id": buyer_id},
        {"$set": {
            "deal_id": deal_id,
            "buyer_id": buyer_id,
            "allowed_folders": allowed_folders,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True
    )
    return {"updated": True, "buyer_id": buyer_id, "allowed_folders": allowed_folders}


# ==========================================
# TRACKING (SELLER VIEW)
# ==========================================

@router.get("/deals/{deal_id}/access-log")
async def get_access_log(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get document access log for a deal (seller view)"""
    from database import deals_collection
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal no encontrado")
    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    cursor = access_log_collection.find(
        {"deal_id": deal_id}, {"_id": 0}
    ).sort("timestamp", -1).limit(200)
    logs = await cursor.to_list(200)

    # Enrich with buyer + doc names
    from database import users_collection
    enriched = []
    for log in logs:
        buyer = await users_collection.find_one({"user_id": log["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "email": 1})
        doc_name = None
        if log.get("document_id"):
            doc = await documents_collection.find_one({"document_id": log["document_id"]}, {"_id": 0, "original_filename": 1, "folder": 1})
            doc_name = doc.get("original_filename") if doc else None

        enriched.append({
            "buyer_id": log["buyer_id"],
            "buyer_name": f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() if buyer else "Desconocido",
            "buyer_email": buyer.get("email", "") if buyer else "",
            "action": log["action"],
            "document_id": log.get("document_id"),
            "document_name": doc_name,
            "folder": log.get("folder"),
            "timestamp": log["timestamp"],
        })

    return {"deal_id": deal_id, "logs": enriched, "total": len(enriched)}


# ==========================================
# HELPERS
# ==========================================

async def _get_buyer_allowed_folders(deal_id: str, buyer_id: str) -> Optional[list]:
    """Get allowed folders for a buyer. Returns None if full access."""
    perm = await permissions_collection.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0}
    )
    if not perm:
        # Default: all folders accessible (NDA already checked)
        return None
    return perm.get("allowed_folders")  # None = full, list = restricted


async def _log_access(buyer_id: str, deal_id: str, document_id: Optional[str], action: str):
    """Log a data room access event."""
    folder = None
    if document_id:
        doc = await documents_collection.find_one({"document_id": document_id}, {"_id": 0, "folder": 1})
        folder = doc.get("folder") if doc else None

    await access_log_collection.insert_one({
        "buyer_id": buyer_id,
        "deal_id": deal_id,
        "document_id": document_id,
        "action": action,
        "folder": folder,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
