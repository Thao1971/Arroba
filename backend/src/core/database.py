"""Mongo (Motor) async client + index init + test-override hook.
Every module accesses the database via `get_db()` only. Tests inject a
mongomock-motor instance through `override_db()`.

==================== AUDIT DE ÍNDICES SPARSE (E0.3.1) ====================
Los índices `sparse=True` SOLO saltan documentos donde el campo está AUSENTE,
NO donde su valor es `null`. Como `pydantic.model_dump(mode="json")` serializa
campos `None` a JSON `null`, los inserts producían `{google_id: null}` (y
`{tax_id: null}`) que terminaban TODOS en el mismo slot del índice unique
sparse, provocando duplicate-key en el segundo registro.

Defensa en profundidad aplicada:
  (a) Reemplazo `sparse=True` por `partialFilterExpression` que solo indexa
      cuando el campo es de tipo string (excluye explícitamente null/absent).
  (b) Todos los inserts en /modules/*/service.py usan model_dump(exclude_none=True)
      para no escribir null en el documento.

Índices auditados:
  - users.user_id          : unique          (no nullable, OK)
  - users.email            : unique          (no nullable, OK)
  - users.google_id        : unique + partialFilter (FIXED — antes sparse)
  - organizations.org_id   : unique          (no nullable, OK)
  - organizations.tax_id   : partialFilter   (FIXED — antes sparse, aunque sin unique)
  - memberships.*          : todos sobre campos no-null, OK
  - user_sessions.*        : todos sobre campos no-null + TTL en expires_at, OK
  - org_invitations.*      : todos sobre campos no-null, OK
  - master_companies_mock.master_company_id : unique (no nullable, OK)
  - master_companies_mock.cif               : unique + partialFilter (E0.4 — patrón E0.3.1)

Migración de índices viejos: en init_indexes() se hace drop explícito de los
índices auto-nombrados antiguos (google_id_1, tax_id_1) si todavía existen
con opciones antiguas, antes de crear los nuevos con nombre explícito.
=========================================================================
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.core.config import get_settings
from src.core.logging import get_logger

log = get_logger("database")

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(settings.mongo_url, uuidRepresentation="standard")
    return _client


def get_db() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        settings = get_settings()
        _db = get_client()[settings.db_name]
    return _db


def override_db(db: AsyncIOMotorDatabase | None) -> None:
    """Used exclusively by tests."""
    global _db
    _db = db


async def _drop_legacy_sparse_indexes() -> None:
    """Idempotent migration: drop pre-E0.3.1 sparse indexes whose options
    can't be mutated in-place. Only drops if the existing index does NOT
    already carry partialFilterExpression."""
    db = get_db()
    for collection, legacy_name in [
        ("users", "google_id_1"),
        ("organizations", "tax_id_1"),
    ]:
        try:
            info = await db[collection].index_information()
        except Exception:
            continue
        meta = info.get(legacy_name)
        if meta and "partialFilterExpression" not in meta:
            try:
                await db[collection].drop_index(legacy_name)
                log.info("indexes.legacy_dropped", collection=collection, name=legacy_name)
            except Exception as e:  # pragma: no cover
                log.warning("indexes.legacy_drop_failed", collection=collection, error=str(e))


async def init_indexes() -> None:
    """Idempotent index creation for every collection owned by a module."""
    db = get_db()

    # === Migration of legacy sparse indexes (E0.3.1) ===
    await _drop_legacy_sparse_indexes()

    # === users ===
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.users.create_index(
        "google_id",
        unique=True,
        partialFilterExpression={"google_id": {"$type": "string"}},
        name="google_id_partial_string",
    )

    # === organizations ===
    await db.organizations.create_index("org_id", unique=True)
    await db.organizations.create_index(
        "tax_id",
        partialFilterExpression={"tax_id": {"$type": "string"}},
        name="tax_id_partial_string",
    )

    # === memberships ===
    await db.memberships.create_index("membership_id", unique=True)
    await db.memberships.create_index([("user_id", 1), ("org_id", 1)], unique=True)
    await db.memberships.create_index("user_id")
    await db.memberships.create_index("org_id")

    # === user_sessions (TTL on expires_at) ===
    await db.user_sessions.create_index("session_id", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)

    # === org_invitations ===
    await db.org_invitations.create_index("invitation_id", unique=True)
    await db.org_invitations.create_index("token", unique=True)
    await db.org_invitations.create_index("email")
    await db.org_invitations.create_index("org_id")

    # === master_companies_mock (Agency Tool adapter, E0.4) ===
    # Same E0.3.1 pattern: partialFilterExpression instead of sparse so that
    # null/absent cif values don't collide on the unique index.
    await db.master_companies_mock.create_index("master_company_id", unique=True)
    await db.master_companies_mock.create_index(
        "cif",
        unique=True,
        partialFilterExpression={"cif": {"$type": "string"}},
        name="cif_partial_string",
    )
    await db.master_companies_mock.create_index("created_at")

    # === workspaces (E1.5) ===
    await db.workspaces.create_index("workspace_id", unique=True)
    await db.workspaces.create_index([("organization_id", 1), ("state", 1), ("updated_at", -1)])
    await db.workspaces.create_index([("created_by", 1), ("updated_at", -1)])

    # === workspace_messages (E1.5) ===
    await db.workspace_messages.create_index("message_id", unique=True)
    await db.workspace_messages.create_index([("workspace_id", 1), ("created_at", 1)])

    # === workspace_blocks (E1.5) ===
    # Uniqueness is enforced per workspace (the client may legitimately reuse
    # short ids like "blk_h1" across different workspaces). A global unique
    # index on block_id would surface as E11000 BulkWriteError on the second
    # promotion of the same ephemeral state into a new workspace.
    await db.workspace_blocks.create_index(
        [("workspace_id", 1), ("block_id", 1)], unique=True
    )
    await db.workspace_blocks.create_index([("workspace_id", 1), ("order", 1)])

    # === companies module (E1.5-REWORK) ===
    # company_conversations: ONE conversation per (user_id, master_company_id).
    # Memory of chat is owned by the (user, entity) tuple — distinct users in
    # the same org keep separate threads, by design.
    await db.company_conversations.create_index(
        [("user_id", 1), ("master_company_id", 1)], unique=True
    )

    # company_watchlists: ONE saved entry per (org_id, master_company_id) so
    # an org sees a single canonical record per company; saved_by tells who
    # added it, visibility ("private"|"team") controls visibility to other
    # org members.
    await db.company_watchlists.create_index(
        [("org_id", 1), ("master_company_id", 1)], unique=True
    )
    await db.company_watchlists.create_index("saved_by")
    await db.company_watchlists.create_index("visibility")

    # company_analysis_refreshes: rate-limit ledger. TTL on last_refresh_at
    # gives us automatic cleanup so the collection cannot grow unbounded.
    await db.company_analysis_refreshes.create_index(
        [("user_id", 1), ("master_company_id", 1)], unique=True
    )
    await db.company_analysis_refreshes.create_index(
        "last_refresh_at", expireAfterSeconds=60 * 60 * 24 * 90
    )

    # === intelligence_cache (B.6.a — caché 2 capas del intelligence_layer) ===
    # Documento: {_id: <cache_key>, value, expires_at (epoch seconds), is_error}
    # `expires_at` no es datetime → no usamos TTL nativo de Mongo. Los reads
    # comprueban expiración a runtime (cache.py::MongoCache.get).
    await db.intelligence_cache.create_index("expires_at")


async def close_client() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None
