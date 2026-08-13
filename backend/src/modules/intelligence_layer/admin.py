"""HARDENING-004 · Endpoint admin de purga de caché Intelligence.

Reemplaza el workflow manual `mongosh deleteMany({_id: /:financial:ficha:/})`
para invalidar entradas de `intelligence_cache` (Mongo capa 2) + memoria LRU
(capa 1) sin acceso directo a la BD.

Contrato:
    POST /api/admin/cache/purge
    Header: X-Admin-Token (env ARROBA_ADMIN_TOKEN)
    Body (exclusivo — exactamente una llave):
        {"cif": "B28184687"}   → regex sobre _id de intelligence_cache
        {"engine": "ficha"}    → regex sobre _id de intelligence_cache
        {"force": true}        → borrado total (requiere flag explícito)

Fail-safe:
    - Si ARROBA_ADMIN_TOKEN vacío → 503 (endpoint bloqueado)
    - Token inválido/ausente → 401 fail-closed
    - Body inválido (más/menos de 1 llave, keys desconocidas) → 400

Audit: cada purga exitosa loguea INFO; intentos fallidos de auth loguean WARNING.

Nota: los responses de error usan `JSONResponse` directo para respetar el
shape literal de la spec (`{"error": "..."}`), bypassing el handler global
que normaliza `HTTPException.detail` no-string a `"http_error"`.
"""
from __future__ import annotations

import re
import time
from typing import Any

from fastapi import APIRouter, Header, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError, model_validator

from src.core.database import get_db
from src.core.logging import get_logger
from src.modules.intelligence_layer.cache import get_cache
from src.modules.intelligence_layer.config import get_intelligence_settings

log = get_logger("intelligence_layer.admin")

admin_router = APIRouter(prefix="/api/admin", tags=["admin"])


class PurgeRequest(BaseModel):
    """Body exclusivo. Exactamente una llave debe estar presente."""

    cif: str | None = Field(default=None, description="Filtra por CIF (regex sobre _id)")
    engine: str | None = Field(default=None, description="Filtra por engine (regex sobre _id)")
    force: bool | None = Field(default=None, description="Purga total; debe ser explícitamente true")

    @model_validator(mode="after")
    def _exactly_one_mode(self) -> "PurgeRequest":
        provided = [k for k, v in [("cif", self.cif), ("engine", self.engine), ("force", self.force)] if v is not None]
        if len(provided) != 1:
            raise ValueError(
                f"Body must contain exactly one of: cif, engine, force. Received: {provided or 'none'}"
            )
        if self.force is not None and self.force is not True:
            raise ValueError("`force` must be explicitly true when provided")
        if self.cif is not None and not self.cif.strip():
            raise ValueError("`cif` must be a non-empty string")
        if self.engine is not None and not self.engine.strip():
            raise ValueError("`engine` must be a non-empty string")
        return self


class PurgeResponse(BaseModel):
    ok: bool
    mode: str
    filter: str | None
    before: int
    deleted: int
    after: int
    duration_ms: int


def _caller_ip(request: Request) -> str:
    """Obtiene la IP del caller. Soporta X-Forwarded-For (proxy Kubernetes)."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@admin_router.post(
    "/cache/purge",
    summary="Purga selectiva de intelligence_cache (Mongo + memoria)",
    responses={
        200: {"description": "Purga completada", "model": PurgeResponse},
        400: {"description": "Body inválido (modo exclusivo o formato)"},
        401: {"description": "Token admin ausente o inválido"},
        500: {"description": "Error de Mongo"},
        503: {"description": "ARROBA_ADMIN_TOKEN no configurado en el servidor"},
    },
)
async def purge_cache(
    request: Request,
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
) -> JSONResponse:
    """Invalida entradas de `intelligence_cache` según modo.

    Modo `cif`: regex `:{cif}:` sobre `_id` (borra todas las entries del CIF).
    Modo `engine`: regex `^[^:]+:{engine}:` sobre `_id` (borra entries del motor).
    Modo `force`: borra la colección entera (usar con precaución).

    En todos los casos también se limpia la capa 1 (memoria LRU) para el pod actual.
    """
    settings = get_intelligence_settings()
    caller_ip = _caller_ip(request)

    # Fail-safe: sin token configurado, endpoint bloqueado.
    if not settings.arroba_admin_token:
        log.warning("admin.cache_purge.no_token_configured", caller_ip=caller_ip)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Admin token not configured"},
        )

    # Fail-closed: token ausente o inválido.
    if not x_admin_token or x_admin_token != settings.arroba_admin_token:
        log.warning(
            "admin.cache_purge.unauthorized",
            caller_ip=caller_ip,
            had_header=bool(x_admin_token),
        )
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "invalid admin token"},
        )

    # Parse body manualmente para poder devolver 400 con shape custom.
    try:
        raw_body = await request.json()
    except Exception:  # noqa: BLE001
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Invalid JSON body"},
        )

    try:
        body = PurgeRequest(**(raw_body if isinstance(raw_body, dict) else {}))
    except ValidationError as exc:
        msgs = "; ".join(err.get("msg", "") for err in exc.errors())
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": msgs or "Invalid body"},
        )

    # Resolver modo + filtro Mongo.
    if body.cif is not None:
        mode = "cif"
        filter_value: str | None = body.cif.strip().upper()
        # `_id` canónico: provider:engine:method:master_id:payload_hash
        # master_id = CIF en la mayoría de motores; usamos regex tolerante.
        mongo_filter: dict[str, Any] = {
            "_id": {"$regex": f":{re.escape(filter_value)}:", "$options": "i"}
        }
    elif body.engine is not None:
        mode = "engine"
        filter_value = body.engine.strip().lower()
        # `_id` canónico: provider:engine:method:master_id:payload_hash
        # Restringe al 2º segmento (engine) para no matchear coincidencias
        # accidentales en master_id.
        mongo_filter = {
            "_id": {"$regex": f"^[^:]+:{re.escape(filter_value)}:", "$options": "i"}
        }
    else:
        # body.force == True (garantizado por el validador)
        mode = "force"
        filter_value = None
        mongo_filter = {}

    # Ejecución.
    started = time.perf_counter()
    try:
        collection = get_db()["intelligence_cache"]
        before = await collection.count_documents(mongo_filter)
        result = await collection.delete_many(mongo_filter)
        deleted = result.deleted_count
        after = await collection.count_documents({}) if mode == "force" else (before - deleted)

        # Capa 1: memoria LRU del pod actual. Para `force` limpiamos todo; para
        # filtros selectivos hacemos scan del store interno.
        cache = get_cache()
        if mode == "force":
            await cache.memory.clear()
            memory_dropped: int | str = "all"
        else:
            regex = re.compile(mongo_filter["_id"]["$regex"], re.IGNORECASE)
            async with cache.memory._lock:  # noqa: SLF001 · scan requiere el lock interno
                keys_to_drop = [k for k in cache.memory._store.keys() if regex.search(k)]  # noqa: SLF001
                for k in keys_to_drop:
                    cache.memory._store.pop(k, None)  # noqa: SLF001
            memory_dropped = len(keys_to_drop)
    except Exception as exc:  # noqa: BLE001
        log.error(
            "admin.cache_purge.mongo_error",
            caller_ip=caller_ip,
            mode=mode,
            filter=filter_value,
            error=str(exc),
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(exc)},
        )

    duration_ms = int((time.perf_counter() - started) * 1000)

    log.info(
        "admin.cache_purge.ok",
        mode=mode,
        filter=filter_value,
        before=before,
        deleted=deleted,
        after=after,
        memory_dropped=memory_dropped,
        duration_ms=duration_ms,
        caller_ip=caller_ip,
    )

    payload = PurgeResponse(
        ok=True,
        mode=mode,
        filter=filter_value,
        before=before,
        deleted=deleted,
        after=after,
        duration_ms=duration_ms,
    )
    return JSONResponse(status_code=200, content=payload.model_dump())


__all__ = ["admin_router"]
