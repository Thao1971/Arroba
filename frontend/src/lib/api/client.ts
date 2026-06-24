/**
 * Thin typed HTTP client over the FastAPI backend. Same-origin requests; the
 * Next.js dev rewrite or the platform ingress route /api/* to :8001.
 * Cookies (httpOnly arroba_session) are sent automatically via `credentials: 'include'`.
 */
import type {
  AuthResponse,
  CreateOrgPayload,
  CreateOrgResponse,
  LoginPayload,
  MeResponse,
  OrgWithMembership,
  RegisterPayload,
  SessionExchangePayload,
} from './types';

export class ApiError extends Error {
  status: number;
  code: string;
  detail: string;
  errors?: unknown;
  constructor(status: number, body: { detail?: string; code?: string; errors?: unknown }) {
    super(body.detail || `http_${status}`);
    this.status = status;
    this.code = body.code || `http_${status}`;
    this.detail = body.detail || `http_${status}`;
    this.errors = body.errors;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });
  const text = await res.text();
  const body = text ? safeJSON(text) : null;
  if (!res.ok) {
    const obj = (body && typeof body === 'object' ? body : { detail: String(body) }) as Record<
      string,
      unknown
    >;
    throw new ApiError(res.status, {
      detail: typeof obj.detail === 'string' ? obj.detail : `http_${res.status}`,
      code: typeof obj.code === 'string' ? obj.code : `http_${res.status}`,
      errors: obj.errors,
    });
  }
  return body as T;
}

function safeJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const apiClient = {
  auth: {
    register: (payload: RegisterPayload) =>
      request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    login: (payload: LoginPayload) =>
      request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    exchangeSession: (payload: SessionExchangePayload) =>
      request<AuthResponse>('/api/auth/session', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    me: () => request<MeResponse>('/api/auth/me'),
    logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  },
  organizations: {
    create: (payload: CreateOrgPayload) =>
      request<CreateOrgResponse>('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    mine: () => request<OrgWithMembership[]>('/api/organizations/mine'),
  },
};

// SWR-friendly fetcher
export const swrFetcher = <T>(path: string): Promise<T> => request<T>(path);
