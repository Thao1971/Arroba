
from src.modules.agency_tool_adapter.models import Lineage


async def _seed_one(admin_client, **overrides):
    payload = {
        "legal_name": "Acme Agency",
        "cif": "B11111111",
        "sector": "Performance",
        "region": "Madrid",
        "country": "ES",
        "financials": {"revenue": 2_400_000, "ebitda": 720_000, "employees": 14, "fiscal_year": 2025},
        "confidence": 0.78,
        "lineage": Lineage.normalized.value,
    }
    payload.update(overrides)
    r = await admin_client.post("/api/admin/agency-tool/master-companies-mock", json=payload)
    return r


async def test_create_master_company_mock_requires_admin(alice):
    """A non-admin user receives 403 on the admin POST."""
    r = await alice.post(
        "/api/admin/agency-tool/master-companies-mock",
        json={"legal_name": "Should Fail"},
    )
    assert r.status_code == 403
    assert r.json()["code"] == "admin_required"


async def test_create_master_company_mock_as_admin(admin_client):
    r = await _seed_one(admin_client)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["legal_name"] == "Acme Agency"
    assert body["cif"] == "B11111111"
    assert body["master_company_id"].startswith("mc_")
    assert "created_at" in body
    assert "created_by" in body


async def test_get_company_returns_mock_with_x_source_header(admin_client):
    r = await _seed_one(admin_client)
    mc_id = r.json()["master_company_id"]
    r = await admin_client.get(f"/api/agency-tool/companies/{mc_id}")
    assert r.status_code == 200
    assert r.headers.get("X-Source") == "mock"
    body = r.json()
    assert body["master_company_id"] == mc_id
    assert body["legal_name"] == "Acme Agency"
    assert body["signals"] == []
    assert body["scores"] == {}
    assert body["recommendations"] == []
    assert body["source"] == "mock"


async def test_get_company_returns_404_when_not_exists(alice):
    r = await alice.get("/api/agency-tool/companies/mc_doesnotexist")
    assert r.status_code == 404
    assert r.json()["code"] == "master_company_not_found"


async def test_get_company_requires_session(client):
    r = await client.get("/api/agency-tool/companies/mc_any")
    assert r.status_code == 401


async def test_status_endpoint_lists_adapter_in_mock_mode(alice):
    r = await alice.get("/api/agency-tool/status")
    assert r.status_code == 200
    body = r.json()
    assert "adapters" in body
    names = [a["name"] for a in body["adapters"]]
    assert "enrich_company" in names
    enrich = next(a for a in body["adapters"] if a["name"] == "enrich_company")
    assert enrich["mode"] == "mock"
    assert "endpoint_when_real" in enrich


async def test_admin_list_master_companies_mock_paginated(admin_client):
    # Seed 3 entries with different CIFs
    for i in range(3):
        r = await _seed_one(
            admin_client,
            legal_name=f"Agency #{i}",
            cif=f"B2222222{i}",
        )
        assert r.status_code == 201
    # Default list
    r = await admin_client.get("/api/admin/agency-tool/master-companies-mock")
    assert r.status_code == 200
    assert len(r.json()) == 3
    # limit/offset
    r = await admin_client.get(
        "/api/admin/agency-tool/master-companies-mock?limit=2&offset=1"
    )
    assert r.status_code == 200
    assert len(r.json()) == 2


async def test_admin_update_master_company_mock(admin_client):
    r = await _seed_one(admin_client)
    mc_id = r.json()["master_company_id"]
    r = await admin_client.put(
        f"/api/admin/agency-tool/master-companies-mock/{mc_id}",
        json={"sector": "Data & Analytics", "confidence": 0.92},
    )
    assert r.status_code == 200
    assert r.json()["sector"] == "Data & Analytics"
    assert r.json()["confidence"] == 0.92
    # Verify via public read
    r = await admin_client.get(f"/api/agency-tool/companies/{mc_id}")
    assert r.json()["sector"] == "Data & Analytics"
    assert r.json()["confidence"] == 0.92


async def test_admin_delete_master_company_mock(admin_client):
    r = await _seed_one(admin_client)
    mc_id = r.json()["master_company_id"]
    r = await admin_client.delete(
        f"/api/admin/agency-tool/master-companies-mock/{mc_id}"
    )
    assert r.status_code == 200
    assert r.json()["deleted"] == mc_id
    # Subsequent GET returns 404
    r = await admin_client.get(f"/api/agency-tool/companies/{mc_id}")
    assert r.status_code == 404


async def test_create_without_cif_no_collision(admin_client):
    """Create 3 entries WITHOUT cif — same anti-bug pattern as E0.3.1 google_id.
    With sparse-True this would collide; with partialFilterExpression it doesn't."""
    for i in range(3):
        r = await _seed_one(
            admin_client,
            legal_name=f"NoCIF Agency #{i}",
            cif=None,
        )
        assert r.status_code == 201, f"#{i} failed: {r.text}"
