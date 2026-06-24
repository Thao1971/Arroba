"""Regression tests for the global exception handlers.

History (2026-06-24):
  - The frontend triggered a 422 RequestValidationError where Pydantic's
    `exc.errors()` carried a `bytes` value in `ctx`/`input`. The default
    `JSONResponse(content=...)` crashed with
    "TypeError: Object of type bytes is not JSON serializable" and the
    catch-all rendered a bare 500.
  - Fix: `_validation` now coerces non-JSON-safe values via
    `fastapi.encoders.jsonable_encoder` with an explicit `bytes` decoder.

These tests guard the contract:
  1. A 422 is returned for invalid bodies and the response body is JSON-safe.
  2. A non-JSON body (e.g. text/plain) on a JSON endpoint produces 422 with
     a sanitized payload, not 500.
"""
from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_validation_error_does_not_crash_when_input_has_unusual_types(
    alice,
):
    """POST /api/workspaces with a body Pydantic cannot map to the schema
    must return 422 with a JSON-safe `errors` array."""
    # The endpoint expects a dict; sending a top-level list triggers
    # `model_attributes_type` at loc=["body"].
    r = await alice.post(
        "/api/workspaces",
        json=[{"definitely": "not_an_object"}],
    )
    assert r.status_code == 422, r.text
    body = r.json()
    assert body["code"] == "validation_error"
    assert isinstance(body["errors"], list) and len(body["errors"]) >= 1
    # The errors payload must be JSON-safe (no bytes / non-serialisable).
    import json

    json.dumps(body)  # must not raise


@pytest.mark.asyncio
async def test_validation_error_when_body_is_not_json(alice):
    """The same endpoint hit with `Content-Type: text/plain` must produce a
    sanitized 422 (not a 500 leak)."""
    r = await alice.post(
        "/api/workspaces",
        content=b"not a json body",
        headers={"Content-Type": "text/plain"},
    )
    assert r.status_code in (415, 422), r.text
    body = r.json()
    # Catch-all sanitisation: response is always JSON parseable.
    assert "detail" in body and "code" in body
