async def test_health_endpoint(client):
    r = await client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["mongo"] == "connected"
    assert body["version"] == "0.0.1"
    assert body["environment"]
    assert body["emergent_auth"] in {"env-ok", "env-missing"}
    assert body["stripe"] in {"env-ok", "env-missing"}


async def test_openapi_lists_all_routers(client):
    r = await client.get("/api/openapi.json")
    assert r.status_code == 200
    schema = r.json()
    tags = {t["name"] for t in schema.get("tags", [])}
    assert {"health", "auth", "users", "organizations", "billing"}.issubset(tags)
    paths = schema.get("paths", {})
    for required in [
        "/api/health",
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/session",
        "/api/auth/me",
        "/api/auth/logout",
        "/api/users/me",
        "/api/organizations",
        "/api/organizations/mine",
        "/api/organizations/{org_id}",
        "/api/organizations/{org_id}/members",
        "/api/organizations/{org_id}/invitations",
        "/api/invitations/{token}/accept",
        "/api/billing/health",
    ]:
        assert required in paths, f"missing OpenAPI path: {required}"


async def test_billing_health(client):
    r = await client.get("/api/billing/health")
    assert r.status_code == 200
    body = r.json()
    assert body["stripe_sdk_installed"] is True
    assert isinstance(body["stripe_api_key_present"], bool)
    assert isinstance(body["stripe_webhook_secret_present"], bool)
