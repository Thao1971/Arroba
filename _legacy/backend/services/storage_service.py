"""Object Storage service — wraps Emergent Object Storage API"""
import os
import logging
import uuid
import requests

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "arroba"

storage_key = None


def init_storage():
    """Initialize storage — call once at startup."""
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(
        f"{STORAGE_URL}/init",
        json={"emergent_key": EMERGENT_KEY},
        timeout=30
    )
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    logger.info("Object Storage initialized")
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to storage."""
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple:
    """Download file from storage. Returns (bytes, content_type)."""
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def generate_storage_path(deal_id: str, folder: str, filename: str) -> str:
    """Generate a storage path for a document."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    unique_name = f"{uuid.uuid4().hex[:12]}.{ext}"
    return f"{APP_NAME}/dataroom/{deal_id}/{folder}/{unique_name}"



def upload_bytes(data: bytes, path: str, content_type: str) -> str:
    """Upload raw bytes and return the download URL."""
    full_path = f"{APP_NAME}/{path}"
    result = put_object(full_path, data, content_type)
    return result.get("url", result.get("download_url", f"/api/storage/{full_path}"))
