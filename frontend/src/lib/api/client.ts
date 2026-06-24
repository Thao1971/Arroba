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
  PlatformStats,
  RegisterPayload,
  SessionExchangePayload,
} from './types';

import type {
  AnalyzeSkillRequest,
  AnalyzeSkillResponse,
  RecommendSkillRequest,
  RecommendSkillResponse,
  SearchSkillRequest,
  SearchSkillResponse,
  ValueSkillRequest,
  ValueSkillResponse,
} from '@/lib/orchestrator/types';

import type {
  WorkspaceCreatePayload,
  WorkspaceCreateResponse,
  WorkspaceDetail,
  WorkspaceDoc,
  WorkspaceExtendPayload,
  WorkspaceExtendResponse,
  WorkspaceList,
} from '@/lib/workspaces/types';

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
    ...init,
    // headers MUST come AFTER `...init` so that the spread of caller-supplied
    // `init.headers` does NOT clobber our `Content-Type` / `Accept` defaults.
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
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
  agencyTool: {
    /** Public — unauthenticated home page consumer. Throws ApiError(404) when
     *  the singleton is not seeded yet. */
    platformStats: () => request<PlatformStats>('/api/agency-tool/platform-stats'),
  },
  copilot: {
    /** Public — works with or without auth. Returns a Workspace spec. */
    search: (payload: SearchSkillRequest) =>
      request<SearchSkillResponse>('/api/copilot/skills/search', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    analyze: (payload: AnalyzeSkillRequest) =>
      request<AnalyzeSkillResponse>('/api/copilot/skills/analyze', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    value: (payload: ValueSkillRequest) =>
      request<ValueSkillResponse>('/api/copilot/skills/value', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    recommend: (payload: RecommendSkillRequest) =>
      request<RecommendSkillResponse>('/api/copilot/skills/recommend', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  workspaces: {
    create: (payload: WorkspaceCreatePayload, activeOrg?: string | null) =>
      request<WorkspaceCreateResponse>('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
    list: (
      params: { type?: string; state?: 'active' | 'archived'; limit?: number; offset?: number },
      activeOrg?: string | null,
    ) => {
      const qs = new URLSearchParams();
      if (params.type) qs.set('type', params.type);
      if (params.state) qs.set('state', params.state);
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      const path = `/api/workspaces${qs.toString() ? `?${qs.toString()}` : ''}`;
      return request<WorkspaceList>(path, {
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      });
    },
    detail: (workspaceId: string) =>
      request<WorkspaceDetail>(`/api/workspaces/${workspaceId}`),
    extend: (workspaceId: string, payload: WorkspaceExtendPayload) =>
      request<WorkspaceExtendResponse>(`/api/workspaces/${workspaceId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    share: (workspaceId: string, payload: { visibility: 'private' | 'team' }) =>
      request<WorkspaceDoc>(`/api/workspaces/${workspaceId}/share`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    patchTitle: (workspaceId: string, title: string) =>
      request<WorkspaceDoc>(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    archive: (workspaceId: string) =>
      request<{ workspace_id: string; state: 'archived' }>(
        `/api/workspaces/${workspaceId}`,
        { method: 'DELETE' },
      ),
  },
};

// SWR-friendly fetcher
export const swrFetcher = <T>(path: string): Promise<T> => request<T>(path);
