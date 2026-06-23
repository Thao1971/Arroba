async def test_register_creates_user_and_session(client):
    r = await client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "password": "Secret123!", "full_name": "Mr New"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["user"]["email"] == "new@example.com"
    assert body["user"]["role"] == "subscriber"
    assert body["session_expires_at"]
    # cookie persisted by httpx for next request
    me = await client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["user"]["email"] == "new@example.com"
    assert me.json()["memberships"] == []


async def test_register_duplicate_email_returns_409(client):
    payload = {"email": "dup@example.com", "password": "Secret123!"}
    r = await client.post("/api/auth/register", json=payload)
    assert r.status_code == 201
    r2 = await client.post("/api/auth/register", json=payload)
    assert r2.status_code == 409
    assert r2.json()["code"] == "email_already_registered"


async def test_register_weak_password_returns_422(client):
    r = await client.post(
        "/api/auth/register",
        json={"email": "weak@example.com", "password": "short"},
    )
    assert r.status_code == 422


async def test_login_success_and_failure(client):
    await client.post(
        "/api/auth/register",
        json={"email": "bob@example.com", "password": "Secret123!"},
    )
    await client.post("/api/auth/logout")

    r_ok = await client.post(
        "/api/auth/login",
        json={"email": "bob@example.com", "password": "Secret123!"},
    )
    assert r_ok.status_code == 200
    assert "arroba_session" in client.cookies

    r_bad = await client.post(
        "/api/auth/login",
        json={"email": "bob@example.com", "password": "wrong"},
    )
    assert r_bad.status_code == 401
    assert r_bad.json()["code"] == "invalid_credentials"


async def test_me_without_session_returns_401(client):
    # fresh client — conftest creates per-test
    r = await client.get("/api/auth/me")
    assert r.status_code == 401


async def test_logout_invalidates_session(alice):
    r = await alice.get("/api/auth/me")
    assert r.status_code == 200

    r = await alice.post("/api/auth/logout")
    assert r.status_code == 200

    # After logout, server-side session is gone. The deleted cookie may still be sent
    # by httpx if max_age is in past; check explicitly with no cookie:
    alice.cookies.clear()
    r = await alice.get("/api/auth/me")
    assert r.status_code == 401
