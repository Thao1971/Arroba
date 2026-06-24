"""Tests for the platform_stats mock surface.

Covers:
- Public GET /api/agency-tool/platform-stats:
  * 200 + X-Source=mock when seeded
  * 404 when collection is empty
  * Accessible WITHOUT authentication
- Admin CRUD over /api/admin/agency-tool/platform-stats-mock:
  * upsert (POST) + get (GET) + update (PUT) + delete (DELETE)
  * Non-admin: 403
- Status endpoint lists the platform_stats adapter in mock mode.
"""
import pytest

pytestmark = pytest.mark.anyio


VALID_PAYLOAD = {
    "companies_with_intelligence": 5189,
    "companies_with_financials": 5227,
    "economic_metrics_total": 4197,
    "corporate_movements": 39436,
    "investors_and_funds": 2075,
    "sectors_analyzed": 87,
    "companies_with_public_contracts": 61264,
    "cross_sectors": 88,
    "confidence": 1.0,
    "lineage": "raw",
}


async def test_platform_stats_public_no_seed_returns_404(client):
    r = await client.get("/api/agency-tool/platform-stats")
    assert r.status_code == 404, r.text
    assert r.json()["code"] == "platform_stats_not_seeded"


async def test_admin_upsert_then_public_read_with_x_source(admin_client, client):
    r = await admin_client.post(
        "/api/admin/agency-tool/platform-stats-mock", json=VALID_PAYLOAD
    )
    assert r.status_code == 201, r.text
    # Public read (no auth)
    r2 = await client.get("/api/agency-tool/platform-stats")
    assert r2.status_code == 200, r2.text
    body = r2.json()
    assert body["companies_with_intelligence"] == 5189
    assert body["source"] == "mock"
    assert r2.headers.get("X-Source") == "mock"
    # lineage round-trip
    assert body["lineage"] == "raw"


async def test_admin_upsert_overwrites_and_reads_back(admin_client):
    payload = {**VALID_PAYLOAD, "companies_with_intelligence": 9999}
    r = await admin_client.post(
        "/api/admin/agency-tool/platform-stats-mock", json=payload
    )
    assert r.status_code == 201
    r = await admin_client.get("/api/admin/agency-tool/platform-stats-mock")
    assert r.status_code == 200
    assert r.json()["companies_with_intelligence"] == 9999


async def test_admin_partial_update_only_touched_fields(admin_client, client):
    await admin_client.post(
        "/api/admin/agency-tool/platform-stats-mock", json=VALID_PAYLOAD
    )
    r = await admin_client.put(
        "/api/admin/agency-tool/platform-stats-mock",
        json={"sectors_analyzed": 100},
    )
    assert r.status_code == 200, r.text
    body = (await client.get("/api/agency-tool/platform-stats")).json()
    assert body["sectors_analyzed"] == 100
    # Other fields untouched
    assert body["companies_with_intelligence"] == VALID_PAYLOAD["companies_with_intelligence"]


async def test_admin_delete_then_public_404(admin_client, client):
    await admin_client.post(
        "/api/admin/agency-tool/platform-stats-mock", json=VALID_PAYLOAD
    )
    r = await admin_client.delete("/api/admin/agency-tool/platform-stats-mock")
    assert r.status_code == 200, r.text
    r = await client.get("/api/agency-tool/platform-stats")
    assert r.status_code == 404


async def test_non_admin_cannot_crud_platform_stats(alice):
    r = await alice.post(
        "/api/admin/agency-tool/platform-stats-mock", json=VALID_PAYLOAD
    )
    assert r.status_code == 403
    r = await alice.get("/api/admin/agency-tool/platform-stats-mock")
    assert r.status_code == 403
    r = await alice.put(
        "/api/admin/agency-tool/platform-stats-mock", json={"sectors_analyzed": 1}
    )
    assert r.status_code == 403
    r = await alice.delete("/api/admin/agency-tool/platform-stats-mock")
    assert r.status_code == 403


async def test_status_endpoint_lists_platform_stats_adapter(client):
    """Status is now public (no auth needed)."""
    r = await client.get("/api/agency-tool/status")
    assert r.status_code == 200
    names = [a["name"] for a in r.json()["adapters"]]
    assert "platform_stats" in names
    ps = next(a for a in r.json()["adapters"] if a["name"] == "platform_stats")
    assert ps["mode"] == "mock"
    assert "endpoint_when_real" in ps


async def test_payload_extra_field_is_rejected(admin_client):
    bad = {**VALID_PAYLOAD, "foo": "bar"}
    r = await admin_client.post(
        "/api/admin/agency-tool/platform-stats-mock", json=bad
    )
    assert r.status_code == 422


async def test_payload_negative_int_is_rejected(admin_client):
    bad = {**VALID_PAYLOAD, "sectors_analyzed": -1}
    r = await admin_client.post(
        "/api/admin/agency-tool/platform-stats-mock", json=bad
    )
    assert r.status_code == 422
