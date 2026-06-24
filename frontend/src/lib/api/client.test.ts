/**
 * Regression tests for the `request` helper exposed by `apiClient`.
 *
 * Historical bug (fixed 2026-06-24):
 *   - `request()` previously spread `...init` AFTER the `headers` block:
 *
 *       fetch(path, {
 *         credentials: 'include',
 *         headers: { 'Content-Type': 'application/json', ... },
 *         ...init,                       // ← clobbered headers
 *       })
 *
 *   - When a caller passed `headers: { 'X-Active-Org': '...' }` (as
 *     `workspaces.create` and `workspaces.list` do), the spread replaced the
 *     ENTIRE `headers` object with just `X-Active-Org`, dropping
 *     `Content-Type: application/json`. FastAPI then treated the body as
 *     plain text, Pydantic complained with `Input should be a valid
 *     dictionary or object`, and the browser saw a 422 surfaced as
 *     "internal_server_error (HTTP 500)" depending on the error handler.
 *
 * These tests pin the merge order so the regression cannot return.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('apiClient.request — header merge', () => {
  it('sets Content-Type and Accept by default on auth.login', async () => {
    await apiClient.auth.login({ email: 'a@b.com', password: 'x' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
  });

  it('preserves Content-Type when caller passes extra headers (workspaces.create)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          workspace_id: 'wsp_x',
          url: '/w/wsp_x',
          workspace_type: 'analyze',
          title: 't',
          visibility: 'private',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    );
    await apiClient.workspaces.create(
      {
        ephemeral_state: { messages: [], blocks: [] },
        workspace_type: 'analyze',
        title: null,
        organization_id: 'org_a720ff5087aa',
      },
      'org_a720ff5087aa'
    );
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init.headers as Record<string, string>;
    // CRITICAL: defaults survive AND caller header is also present.
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
    expect(headers['X-Active-Org']).toBe('org_a720ff5087aa');
  });

  it('preserves Content-Type when caller passes extra headers (workspaces.list)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [], total: 0, has_more: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    await apiClient.workspaces.list({}, 'org_a720ff5087aa');
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Active-Org']).toBe('org_a720ff5087aa');
  });
});
