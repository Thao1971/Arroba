"""Shared pytest fixtures — in-memory mongomock-motor + httpx ASGI client."""
import asyncio
from collections.abc import AsyncIterator
from datetime import UTC, datetime

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from src.core import database as db_module
from src.core.database import init_indexes
from src.main import app


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def mock_db() -> AsyncIterator:
    client = AsyncMongoMockClient()
    db = client["arroba_test"]
    db_module.override_db(db)
    try:
        await init_indexes()
    except Exception:
        # mongomock supports most index ops; if TTL fails, ignore.
        pass
    yield db
    for col in await db.list_collection_names():
        await db[col].drop()
    db_module.override_db(None)


@pytest_asyncio.fixture
async def client(mock_db) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


@pytest_asyncio.fixture
async def alice(client: AsyncClient) -> AsyncClient:
    """A logged-in client carrying Alice's session cookie."""
    r = await client.post(
        "/api/auth/register",
        json={"email": "alice@arrobatest.com", "password": "Secret123!", "full_name": "Alice"},
    )
    assert r.status_code == 201, r.text
    return client


@pytest_asyncio.fixture
async def admin_client(mock_db, client: AsyncClient) -> AsyncClient:
    """A logged-in client whose role has been promoted to admin.

    NOTE: E0.4 does NOT expose a public endpoint to promote users to admin.
    The only way to create an admin is via `scripts/seed_admin.py` against
    real Mongo, or — in tests — by writing role='admin' directly to the
    collection bypassing the public flow. Documented in /app/memory/test_credentials.md.
    """
    # Register a normal user first (gives us session cookie + valid user_id)
    r = await client.post(
        "/api/auth/register",
        json={
            "email": "admin@arrobatest.com",
            "password": "Admin1234!",
            "full_name": "Test Admin",
        },
    )
    assert r.status_code == 201, r.text
    # Promote directly in the mock DB — Boundary First exception only valid in tests.
    await mock_db.users.update_one(
        {"email": "admin@arrobatest.com"},
        {"$set": {"role": "admin", "updated_at": datetime.now(UTC)}},
    )
    return client
