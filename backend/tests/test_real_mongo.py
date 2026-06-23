"""Integration tests against the REAL MongoDB (no mongomock).

Run only with:
    pytest -m real_mongo

The default invocation `pytest -q` skips these via addopts in pyproject.toml.

Justification for these tests:
    mongomock-motor does NOT faithfully reproduce server-side uniqueness
    semantics for sparse / partialFilterExpression indexes. The E0.3.1 bug
    (sparse-null collision on `users.google_id`) was hidden by mongomock-motor
    but reproducible against a real Mongo. These tests act as a regression
    guard against re-introducing that class of bug.
"""
import os
import uuid
from datetime import UTC

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from src.core import database as db_module
from src.core.database import init_indexes
from src.main import app

pytestmark = pytest.mark.real_mongo


@pytest_asyncio.fixture
async def real_db():
    """Connects to the real MongoDB at MONGO_URL using a per-run isolated db
    name; drops it at teardown so test runs never interfere with prod data."""
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = f"arroba_real_test_{uuid.uuid4().hex[:8]}"
    client = AsyncIOMotorClient(mongo_url, uuidRepresentation="standard")
    db = client[db_name]
    db_module.override_db(db)
    await init_indexes()
    try:
        yield db
    finally:
        await client.drop_database(db_name)
        db_module.override_db(None)
        client.close()


@pytest_asyncio.fixture
async def real_client(real_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


async def test_register_three_users_against_real_mongo(real_client, real_db):
    """The fix's primary regression test. Pre-fix this failed at user #2 with
    duplicate-key on `google_id_1`. Post-fix all 3 succeed and the resulting
    documents do not contain `google_id` at all (exclude_none=True)."""
    for i in range(3):
        r = await real_client.post(
            "/api/auth/register",
            json={
                "email": f"real_multi_{i}@arrobatest.com",
                "password": "Secret123!",
                "full_name": f"Real User {i}",
            },
        )
        assert r.status_code == 201, (
            f"User #{i} failed: {r.status_code} :: {r.text}"
        )
        await real_client.post("/api/auth/logout")
        real_client.cookies.clear()

    # Verify all 3 docs exist and none of them carries the google_id field at all.
    # Mongo quirk: {field: null} matches both null AND absent. To distinguish:
    #   - $exists:true  → field present (any value, including null)
    #   - $type:"null"  → field present AND explicitly null
    count = await real_db.users.count_documents({})
    assert count == 3
    has_explicit_null = await real_db.users.count_documents({"google_id": {"$type": "null"}})
    has_field_present = await real_db.users.count_documents({"google_id": {"$exists": True}})
    sample = await real_db.users.find_one({}, {"_id": 0})
    sample_keys = list(sample.keys()) if sample else None
    assert has_explicit_null == 0, (
        f"exclude_none should prevent explicit null google_id writes; sample keys={sample_keys}"
    )
    assert has_field_present == 0, (
        f"no email/password user should carry google_id at all; sample keys={sample_keys}"
    )


async def test_google_id_partial_filter_index_present(real_db):
    """Index audit: confirm the new partial-filter index exists and the legacy
    auto-named sparse index has been dropped (if it ever existed in this DB)."""
    info = await real_db.users.index_information()
    assert "google_id_partial_string" in info
    meta = info["google_id_partial_string"]
    assert "partialFilterExpression" in meta
    assert meta["partialFilterExpression"] == {"google_id": {"$type": "string"}}
    assert meta.get("unique") is True
    # Legacy auto-named index must not exist alongside (would cause confusion)
    assert "google_id_1" not in info


async def test_tax_id_partial_filter_index_present(real_db):
    """Same audit for organizations.tax_id (sparse → partial filter)."""
    info = await real_db.organizations.index_information()
    assert "tax_id_partial_string" in info
    meta = info["tax_id_partial_string"]
    assert "partialFilterExpression" in meta
    assert meta["partialFilterExpression"] == {"tax_id": {"$type": "string"}}
    assert "tax_id_1" not in info


async def test_oauth_register_then_three_password_users_coexist(real_client, real_db):
    """Mixed scenario: 1 OAuth-like user (with real google_id) + 3 email/password
    users (no google_id) — none of them must collide.
    We can't hit the actual Emergent OAuth endpoint here, so we insert the OAuth
    user directly via the collection to simulate the real shape."""
    await real_db.users.insert_one(
        {
            "user_id": "user_oauth_seed",
            "email": "oauth.seed@arrobatest.com",
            "google_id": "google-sub-123",
            "full_name": "OAuth Seed",
            "role": "subscriber",
            "email_verified": True,
        }
    )
    for i in range(3):
        r = await real_client.post(
            "/api/auth/register",
            json={
                "email": f"coexist_{i}@arrobatest.com",
                "password": "Secret123!",
            },
        )
        assert r.status_code == 201, r.text
        await real_client.post("/api/auth/logout")
        real_client.cookies.clear()

    # Now try to insert a SECOND OAuth user with the SAME google_id → must fail
    from pymongo.errors import DuplicateKeyError

    with pytest.raises(DuplicateKeyError):
        await real_db.users.insert_one(
            {
                "user_id": "user_oauth_dup",
                "email": "oauth.dup@arrobatest.com",
                "google_id": "google-sub-123",  # collides with seeded
                "role": "subscriber",
                "email_verified": True,
            }
        )


async def test_master_companies_mock_cif_partial_filter(real_client, real_db):
    """E0.4 audit: master_companies_mock.cif index is partialFilter (NOT sparse).
    3 entries without cif must coexist without collision."""
    # Promote test admin
    from datetime import datetime
    r = await real_client.post(
        "/api/auth/register",
        json={"email": "real_admin@arrobatest.com", "password": "Admin1234!"},
    )
    assert r.status_code == 201
    await real_db.users.update_one(
        {"email": "real_admin@arrobatest.com"},
        {"$set": {"role": "admin", "updated_at": datetime.now(UTC)}},
    )
    # Create 3 entries with NO cif
    for i in range(3):
        r = await real_client.post(
            "/api/admin/agency-tool/master-companies-mock",
            json={"legal_name": f"NoCif Real #{i}"},
        )
        assert r.status_code == 201, r.text
    # Verify index metadata
    info = await real_db.master_companies_mock.index_information()
    assert "cif_partial_string" in info
    meta = info["cif_partial_string"]
    assert meta.get("unique") is True
    assert meta["partialFilterExpression"] == {"cif": {"$type": "string"}}
    # Confirm 3 docs persisted without cif field
    count = await real_db.master_companies_mock.count_documents({})
    assert count == 3
    has_cif = await real_db.master_companies_mock.count_documents({"cif": {"$exists": True}})
    assert has_cif == 0


async def test_master_companies_mock_cif_uniqueness_enforced(real_client, real_db):
    """When cif IS present, uniqueness still applies (the partial filter only
    skips the index entry when the value isn't a string)."""
    from datetime import datetime
    await real_client.post(
        "/api/auth/register",
        json={"email": "real_admin2@arrobatest.com", "password": "Admin1234!"},
    )
    await real_db.users.update_one(
        {"email": "real_admin2@arrobatest.com"},
        {"$set": {"role": "admin", "updated_at": datetime.now(UTC)}},
    )
    r1 = await real_client.post(
        "/api/admin/agency-tool/master-companies-mock",
        json={"legal_name": "First", "cif": "B99999999"},
    )
    assert r1.status_code == 201, r1.text
    # Second with same CIF should be rejected by the DB unique index
    r2 = await real_client.post(
        "/api/admin/agency-tool/master-companies-mock",
        json={"legal_name": "Second", "cif": "B99999999"},
    )
    # Service catches DuplicateKeyError and returns 409.
    assert r2.status_code == 409, r2.text
    assert r2.json()["code"] == "master_company_duplicate_unique_field"
