async def test_patch_me_updates_full_name(alice):
    r = await alice.patch("/api/users/me", json={"full_name": "Alice Wonderland"})
    assert r.status_code == 200
    assert r.json()["full_name"] == "Alice Wonderland"

    r2 = await alice.get("/api/users/me")
    assert r2.status_code == 200
    assert r2.json()["full_name"] == "Alice Wonderland"


async def test_get_me_without_auth_returns_401(client):
    r = await client.get("/api/users/me")
    assert r.status_code == 401
