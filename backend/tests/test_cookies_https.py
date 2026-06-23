"""Cookie security tests — verifies HTTPS-aware Secure flag (E0.4 Bloque A)."""


def _set_cookie_header(response) -> str:
    """Return the raw Set-Cookie header for `arroba_session`."""
    # httpx parses Set-Cookie into response.cookies but loses attributes; use raw.
    for k, v in response.headers.items():
        if k.lower() == "set-cookie" and v.startswith("arroba_session="):
            return v
    return ""


async def test_register_without_x_forwarded_proto_omits_secure(client):
    r = await client.post(
        "/api/auth/register",
        json={"email": "plain_http@arrobatest.com", "password": "Secret123!"},
    )
    assert r.status_code == 201
    raw = _set_cookie_header(r)
    assert raw, "no Set-Cookie header for arroba_session"
    assert "Secure" not in raw, f"Secure flag should be absent on HTTP: {raw}"
    assert "HttpOnly" in raw


async def test_register_with_x_forwarded_proto_https_sets_secure(client):
    r = await client.post(
        "/api/auth/register",
        json={"email": "behind_https@arrobatest.com", "password": "Secret123!"},
        headers={"X-Forwarded-Proto": "https"},
    )
    assert r.status_code == 201
    raw = _set_cookie_header(r)
    assert raw, "no Set-Cookie header for arroba_session"
    assert "Secure" in raw, f"Secure flag should be present behind HTTPS: {raw}"
    assert "HttpOnly" in raw


async def test_login_respects_x_forwarded_proto_https(client):
    # register first (HTTP)
    await client.post(
        "/api/auth/register",
        json={"email": "login_https@arrobatest.com", "password": "Secret123!"},
    )
    await client.post("/api/auth/logout")
    client.cookies.clear()
    # login behind HTTPS proxy
    r = await client.post(
        "/api/auth/login",
        json={"email": "login_https@arrobatest.com", "password": "Secret123!"},
        headers={"X-Forwarded-Proto": "https"},
    )
    assert r.status_code == 200
    raw = _set_cookie_header(r)
    assert "Secure" in raw
