/**
 * apiClient.companies — SDK contract tests.
 *
 * Pins the shape of the requests against the FastAPI endpoints:
 *   - URLs always use uppercase CIF (DB invariant).
 *   - `Content-Type: application/json` is set even when callers pass their
 *     own headers — this protects against the spread-headers regression
 *     that bit us before (Headers were clobbered, 500 from the backend).
 *   - `credentials: include` so the httpOnly session cookie is sent.
 *   - `X-Active-Org` is propagated only when explicitly provided.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiClient } from './client';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  ) as unknown as typeof fetch;
});

function getCall(idx = 0): [string, RequestInit] {
  const m = global.fetch as unknown as ReturnType<typeof vi.fn>;
  const [url, init] = m.mock.calls[idx]!;
  return [String(url), init as RequestInit];
}

describe('apiClient.companies — URL + method + headers', () => {
  it('GET /api/companies/{CIF} uppercases the cif and propagates X-Active-Org when given', async () => {
    await apiClient.companies.get('b86540112', 'org_demo');
    const [url, init] = getCall();
    expect(url).toBe('/api/companies/B86540112');
    expect(init.method ?? 'GET').toBe('GET');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Active-Org']).toBe('org_demo');
    expect(headers['Content-Type']).toBe('application/json');
    expect(init.credentials).toBe('include');
  });

  it('GET company without org omits X-Active-Org', async () => {
    await apiClient.companies.get('B86540112');
    const [, init] = getCall();
    const headers = (init.headers || {}) as Record<string, string>;
    expect(headers['X-Active-Org']).toBeUndefined();
  });

  it('POST /messages — JSON body + Content-Type preserved (regression P0)', async () => {
    await apiClient.companies.sendMessage('B86540112', {
      query: 'Riesgos',
      context: { locale: 'es', pathname: '/empresa/B86540112' },
    });
    const [url, init] = getCall();
    expect(url).toBe('/api/companies/B86540112/messages');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      query: 'Riesgos',
      context: { locale: 'es', pathname: '/empresa/B86540112' },
    });
  });

  it('POST /skills/analyze — minimal POST without body', async () => {
    await apiClient.companies.refreshAnalysis('B86540112');
    const [url, init] = getCall();
    expect(url).toBe('/api/companies/B86540112/skills/analyze');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('POST /watchlist — propagates X-Active-Org and keeps Content-Type', async () => {
    await apiClient.companies.toggleWatchlist('B86540112', 'org_demo');
    const [url, init] = getCall();
    expect(url).toBe('/api/companies/B86540112/watchlist');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Active-Org']).toBe('org_demo');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('POST /share — same wiring as watchlist', async () => {
    await apiClient.companies.toggleShare('B86540112', 'org_demo');
    const [url, init] = getCall();
    expect(url).toBe('/api/companies/B86540112/share');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Active-Org']).toBe('org_demo');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('GET /conversation — auth-only, no body, uppercases CIF', async () => {
    await apiClient.companies.getConversation('b86540112');
    const [url, init] = getCall();
    expect(url).toBe('/api/companies/B86540112/conversation');
    expect(init.method ?? 'GET').toBe('GET');
  });
});
