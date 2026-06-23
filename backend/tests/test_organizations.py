async def _register(client, email, pw="Secret123!", full_name=None):
    return await client.post(
        "/api/auth/register",
        json={"email": email, "password": pw, "full_name": full_name},
    )


async def test_create_org_and_owner_membership(alice):
    r = await alice.post(
        "/api/organizations",
        json={"legal_name": "Acme Digital", "tax_id": "B12345678"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["org"]["legal_name"] == "Acme Digital"
    assert body["membership"]["role_in_org"] == "owner"
    assert body["membership"]["status"] == "active"

    mine = await alice.get("/api/organizations/mine")
    assert mine.status_code == 200
    items = mine.json()
    assert len(items) == 1
    assert items[0]["org"]["legal_name"] == "Acme Digital"


async def test_invite_and_accept_flow_creates_two_members(client):
    # Owner creates org
    await _register(client, "owner@example.com")
    r = await client.post(
        "/api/organizations", json={"legal_name": "Studio44"}
    )
    org_id = r.json()["org"]["org_id"]

    # Owner invites newhire
    r = await client.post(
        f"/api/organizations/{org_id}/invitations",
        json={"email": "newhire@example.com", "role_in_org": "operator"},
    )
    assert r.status_code == 201, r.text
    token = r.json()["token"]

    # Owner logs out
    await client.post("/api/auth/logout")
    client.cookies.clear()

    # Newhire registers (cookie attached) and accepts invitation
    await _register(client, "newhire@example.com")
    r = await client.post(f"/api/invitations/{token}/accept")
    assert r.status_code == 201, r.text
    assert r.json()["role_in_org"] == "operator"
    assert r.json()["status"] == "active"

    # Newhire sees the org in /mine
    mine = await client.get("/api/organizations/mine")
    assert mine.status_code == 200
    assert len(mine.json()) == 1

    # Newhire lists members → should see owner + self
    members = await client.get(f"/api/organizations/{org_id}/members")
    assert members.status_code == 200
    assert len(members.json()) == 2


async def test_accept_invite_wrong_email_returns_403(client):
    await _register(client, "owner2@example.com")
    r = await client.post("/api/organizations", json={"legal_name": "Wrong-Email Co"})
    org_id = r.json()["org"]["org_id"]
    r = await client.post(
        f"/api/organizations/{org_id}/invitations",
        json={"email": "intended@example.com", "role_in_org": "operator"},
    )
    token = r.json()["token"]
    await client.post("/api/auth/logout")
    client.cookies.clear()

    # Register a DIFFERENT user and try to accept — must fail with 403
    await _register(client, "someone-else@example.com")
    r = await client.post(f"/api/invitations/{token}/accept")
    assert r.status_code == 403
    assert r.json()["code"] == "invitation_email_mismatch"


async def test_non_member_cannot_read_org(client):
    await _register(client, "a@example.com")
    r = await client.post("/api/organizations", json={"legal_name": "Solo"})
    org_id = r.json()["org"]["org_id"]
    await client.post("/api/auth/logout")
    client.cookies.clear()

    await _register(client, "b@example.com")
    r = await client.get(f"/api/organizations/{org_id}")
    assert r.status_code == 403
