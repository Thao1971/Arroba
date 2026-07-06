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

import type {
  CompanyDetailResponse,
  GetConversationResponse,
  RefreshAnalysisResponse,
  RefreshComparablesResponse,
  RefreshValuationResponse,
  SendMessageRequest,
  SendMessageResponse,
  ShareToggleResponse,
  WatchlistToggleResponse,
} from '@/lib/companies/types';

/**
 * EntityLookupType — catálogo canónico multi-tipo (Regla 2 · Sprint 1).
 * En este sprint solo `company` retorna resultados; los demás son stubs
 * silenciosos.
 */
export type EntityLookupType =
  | 'company'
  | 'sector'
  | 'territory'
  | 'person'
  | 'advisor'
  | 'mandate'
  | 'match'
  | 'operation'
  | 'valuation'
  | 'document'
  | 'opportunity';

export interface EntityLookupResult {
  type: EntityLookupType;
  id: string;
  display_name: string;
  secondary_label: string | null;
  icon: string;
}

export interface EntityLookupResponse {
  query: string;
  results: EntityLookupResult[];
}

/**
 * Response canónica de `GET /api/users/me/watchlist`. Contract genérico
 * (`type: 'company'` desde ya) para que Sprints futuros puedan añadir
 * `sector | opportunity | ...` sin cambiar el shape.
 */
export interface WatchlistItem {
  type: 'company';
  id: string;
  display_name: string;
  secondary_label: string | null;
  icon: 'building';
  added_at: string | null;
  visibility: 'private' | 'team';
}

export interface WatchlistListResponse {
  items: WatchlistItem[];
  total: number;
}

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

/**
 * Helper de request tipado exportable · usado por sub-clientes (ej.
 * `intelligence-client.ts` para B.6.f) para reutilizar el mismo pipeline
 * (cookies, headers canónicos, ApiError shape) sin duplicar código.
 */
export const apiRequest = request;

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
  platform: {
    /** Público — home page anónima. Devuelve `provenance: 'demo' | 'live'`
     *  en cuerpo y header `X-Provenance`. Lanza `ApiError(404)` cuando el
     *  singleton no está aún seedeado. */
    stats: () => request<PlatformStats>('/api/platform/stats'),
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
  companies: {
    /** Mixed-access. Anonymous gets sections 1-3 + locked_sections; authed
     *  gets the full ficha (sections 1-8). */
    get: (cif: string, activeOrg?: string | null) =>
      request<CompanyDetailResponse>(`/api/companies/${cif.toUpperCase()}`, {
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
    getByMasterId: (masterId: string) =>
      request<CompanyDetailResponse>(`/api/companies/by-id/${masterId}`),
    getConversation: (cif: string) =>
      request<GetConversationResponse>(
        `/api/companies/${cif.toUpperCase()}/conversation`,
      ),
    sendMessage: (cif: string, payload: SendMessageRequest) =>
      request<SendMessageResponse>(
        `/api/companies/${cif.toUpperCase()}/messages`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      ),
    refreshAnalysis: (cif: string) =>
      request<RefreshAnalysisResponse>(
        `/api/companies/${cif.toUpperCase()}/skills/analyze`,
        { method: 'POST' },
      ),
    refreshValuation: (cif: string) =>
      request<RefreshValuationResponse>(
        `/api/companies/${cif.toUpperCase()}/skills/value`,
        { method: 'POST' },
      ),
    refreshComparables: (cif: string) =>
      request<RefreshComparablesResponse>(
        `/api/companies/${cif.toUpperCase()}/skills/comparables`,
        { method: 'POST' },
      ),
    toggleWatchlist: (cif: string, activeOrg: string) =>
      request<WatchlistToggleResponse>(
        `/api/companies/${cif.toUpperCase()}/watchlist`,
        {
          method: 'POST',
          headers: { 'X-Active-Org': activeOrg },
        },
      ),
    toggleShare: (cif: string, activeOrg: string) =>
      request<ShareToggleResponse>(
        `/api/companies/${cif.toUpperCase()}/share`,
        {
          method: 'POST',
          headers: { 'X-Active-Org': activeOrg },
        },
      ),
  },
  entities: {
    /**
     * Resolución genérica multi-tipo (Sprint 1). En este sprint solo
     * `company` está poblado; los demás tipos devuelven [] sin fallar.
     */
    lookup: (params: {
      q: string;
      types?: readonly EntityLookupType[];
      limit?: number;
    }) => {
      const qp = new URLSearchParams({ q: params.q });
      if (params.types && params.types.length > 0) {
        qp.set('types', params.types.join(','));
      }
      if (typeof params.limit === 'number') {
        qp.set('limit', String(params.limit));
      }
      return request<EntityLookupResponse>(
        `/api/entities/lookup?${qp.toString()}`,
      );
    },
  },
  users: {
    getMe: () => request<MeResponse>('/api/auth/me'),
    getMyWatchlist: (activeOrg?: string | null) =>
      request<WatchlistListResponse>('/api/users/me/watchlist', {
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
  },
};

// SWR-friendly fetcher
export const swrFetcher = <T>(path: string): Promise<T> => request<T>(path);
