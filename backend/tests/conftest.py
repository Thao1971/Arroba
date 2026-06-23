"""Shared pytest fixtures — in-memory mongomock-motor + httpx ASGI client."""
import asyncio
from collections.abc import AsyncIterator

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
