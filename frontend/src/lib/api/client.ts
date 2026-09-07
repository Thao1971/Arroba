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
  CompanyResolveResponse,
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
 * `company` implementado desde el día 1. `sector`/`territory` conectados
 * 2026-08-24 (catálogos CNAE/geo de Intel, filtrados en Beta). `investor`
 * añadido 2026-08-24 pero bloqueado por un mismatch de auth con Intel — ver
 * ENTITY_MODEL.md junto a la fila `investor` — devuelve [] hasta resolverlo.
 * El resto son stubs silenciosos.
 */
export type EntityLookupType =
  | 'company'
  | 'sector'
  | 'territory'
  | 'person'
  | 'advisor'
  | 'investor'
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

/**
 * Mandato de compra — proxy Beta → Intel `buyer-mandates` (ver
 * DIAGNOSTICO_PAGINA_OPORTUNIDADES.md). Campos 1:1 con `MandateCreate` en
 * `backend/src/modules/mandates/models.py`.
 */
export interface MandateCreatePayload {
  name: string;
  mandate_type?: 'strategic' | 'financial' | 'roll_up';
  target_cnae_sections?: string[] | null;
  target_cnae_codes?: string[] | null;
  target_provincias?: string[] | null;
  revenue_min?: number | null;
  revenue_max?: number | null;
  ownership_preference?: 'any' | 'standalone_only';
  exclude_master_ids?: string[];
  notes?: string | null;
}

export interface Mandate extends MandateCreatePayload {
  id: string;
  status: 'active' | 'paused' | 'closed';
  created_at: string | null;
  updated_at: string | null;
}

export interface FitDimension {
  value: number | string | null;
  score: number | null;
  sources: string[];
}

export interface MandateTarget {
  master_id: string;
  name: string | null;
  score: number | null;
  fit_dimensions: Record<string, FitDimension>;
  score_method: string | null;
  explanation: string | null;
  // Tipo de oportunidad real (recommendation-intelligence en Intel, o su
  // equivalente de demo en modo mock): "roll_up_candidate" |
  // "divestment_candidate" | "acquisition_target". role_label ya viene en ES.
  role?: string | null;
  role_label?: string | null;
  cif?: string | null;
  sector?: string | null;
  location?: string | null;
}

export interface MandateTargetsResponse {
  mandate_id: string;
  mandate_name: string | null;
  candidates_scanned: number;
  count: number;
  targets: MandateTarget[];
  source: 'mock' | 'real';
}

/**
 * Listas guardadas / oportunidades manuales — proxy Beta → `/api/lists`
 * (backend/src/modules/companies/lists_router.py). Recurso aditivo, no
 * relacionado con `WatchlistItem` (la cartera única sin nombre) ni con
 * `Mandate` (criterios de compra, matching automático). `kind` distingue
 * "lista guardada" de "oportunidad creada desde selección" — mismo dato,
 * misma llamada de creación, solo cambia `kind`.
 */
export type ListKind = 'list' | 'opportunity';

export interface SavedListCreatePayload {
  name: string;
  kind?: ListKind;
  cifs?: string[];
}

export interface SavedListItemOut {
  cif: string | null;
  master_company_id: string;
  legal_name: string | null;
  secondary_label: string | null;
  added_at: string;
}

export interface SavedListDetail {
  list_id: string;
  name: string;
  kind: ListKind;
  created_at: string;
  updated_at: string;
  items: SavedListItemOut[];
}

export interface SavedListSummary {
  list_id: string;
  name: string;
  kind: ListKind;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface SavedListsResponse {
  lists: SavedListSummary[];
}

/**
 * Mapa Empresarial — tipos de los proxies publicos hacia geo-intelligence /
 * sector-intelligence-v2 / cross-intelligence / business-demography de
 * Intel (2026-08-28). Todo es lectura publica, sin `activeOrg`.
 */
export interface MarketMapKpi {
  value: number | null;
  change_pct: number | null;
  trend: string | null;
}

export interface MarketMapNationalOverview {
  active_companies: MarketMapKpi;
  new_companies: MarketMapKpi;
  closed_companies: MarketMapKpi;
  net_balance: { value: number | null };
  period: string | null;
}

export interface MarketMapNationalHistory {
  months: string[];
  created: number[];
  closed: number[];
  active: (number | null)[];
}

export interface MarketMapNationalResponse {
  kpis: MarketMapNationalOverview | null;
  evolution: MarketMapNationalHistory | null;
  months: number;
}

export type MarketMapGeoLevel = 'ccaa' | 'province';
export type MarketMapSectorLevel = 'section' | 'division' | 'group';
export type MarketMapMetric = 'dynamism' | 'size' | 'growth' | 'activity';

export interface MarketMapTerritoryCard {
  geo_id: string;
  geo_level: MarketMapGeoLevel;
  geo_name: string;
  active_companies: number;
  new_companies: number;
  closed_companies: number;
  net_company_creation: number;
  public_contracts_count: number;
  borme_activity_count: number;
  size_score: number;
  growth_score: number;
  activity_score: number;
  dynamism_score: number;
  trend_direction: string | null;
  signal: string | null;
  primary_driver: string | null;
  partial_data: boolean;
  parent_ccaa?: string;
  source_attribution?: string;
}

export interface MarketMapTerritoriesResponse {
  level: MarketMapGeoLevel;
  metric: MarketMapMetric;
  territories: MarketMapTerritoryCard[];
  count: number;
}

export interface MarketMapTerritoryDetailResponse {
  level: MarketMapGeoLevel;
  code: string;
  territory: MarketMapTerritoryCard | null;
  provinces: MarketMapTerritoryCard[] | null;
}

export interface MarketMapSectorCard {
  cnae_code: string;
  cnae_level: MarketMapSectorLevel;
  cnae_label: string;
  size_score: number;
  growth_score: number;
  activity_score: number;
  dynamism_score: number;
  trend_direction: string | null;
  signal: string | null;
  primary_driver: string | null;
  active_companies: number;
  procurement_contracts: number;
  procurement_amount: number;
  partial_data: boolean;
}

export interface MarketMapSectorsResponse {
  level: MarketMapSectorLevel;
  metric: MarketMapMetric;
  sectors: MarketMapSectorCard[];
  count: number;
}

export interface MarketMapEmergingResponse {
  level: MarketMapSectorLevel;
  sectors: MarketMapSectorCard[];
  count: number;
}

export interface MarketMapCrossSector {
  cnae_section: string;
  cnae_label: string;
  estimated_companies: number;
  borme_events: number;
  iberinform_companies: number;
  concentration_index: number;
  activity_score: number;
}

export interface MarketMapCrossSectorsInResponse {
  geo_level: MarketMapGeoLevel;
  geo_code: string;
  geo_name?: string;
  sectors: MarketMapCrossSector[];
  count: number;
}

export interface MarketMapCrossTerritory {
  geo_id: string;
  geo_name: string;
  geo_level: MarketMapGeoLevel;
  estimated_companies: number;
  borme_events: number;
  iberinform_companies: number;
  concentration_index: number;
  activity_score: number;
}

export interface MarketMapCrossTerritoryForResponse {
  cnae_section: string;
  cnae_label?: string;
  geo_level: MarketMapGeoLevel;
  territories: MarketMapCrossTerritory[];
  count: number;
}

// Ficha sectorial — drill-down de un CNAE concreto (2026-08-29). El objeto
// `sector` trae TODOS los campos crudos de sector_intelligence_v2.py (no solo
// la tarjeta compacta de `MarketMapSectorCard`): breakdown real de actividad,
// estimaciones de demografia/crecimiento marcadas como tal, y `partial_data`.
export interface MarketMapSectorDetail {
  cnae_code: string;
  cnae_level: MarketMapSectorLevel;
  cnae_label: string;
  taxonomy_type: string;
  size_score: number;
  growth_score: number;
  activity_score: number;
  dynamism_score: number;
  trend_direction: string | null;
  signal: string | null;
  primary_driver: string | null;
  active_companies: number;
  market_share: number;
  new_companies_estimate: number;
  dissolved_estimate: number;
  net_balance: number;
  national_yoy_pct: number;
  procurement_contracts: number;
  procurement_amount: number;
  borme_events: number;
  iberinform_companies: number;
  activity_sub_scores: Record<string, number>;
  sources_available: string[];
  source_attribution: string;
  partial_data: boolean;
  parent_section?: string;
  parent_division?: string;
  generated_at: string;
}

export interface MarketMapSectorCompanyPreview {
  companies: MarketMapSectorCompany[];
  pagination: { total_in_arroba_universe: number; limit: number; offset: number; returned: number };
  data_caveat: string;
}

export interface MarketMapSectorDetailResponse {
  cnae_code: string;
  sector: MarketMapSectorDetail | null;
  children: MarketMapSectorCard[];
  children_count?: number;
  companies_preview: MarketMapSectorCompanyPreview | null;
}

export interface MarketMapSectorCompany {
  master_id: string;
  legal_name: string | null;
  cnae_code: string | null;
  provincia: string | null;
  revenue: number | null;
  ebitda: number | null;
  active_signals_count: number;
  top_signal: { signal_type: string; category: string } | null;
}

export interface MarketMapSectorCompaniesResponse {
  cnae_code: string;
  companies: MarketMapSectorCompany[];
  pagination: { total_in_arroba_universe: number; limit: number; offset: number; returned: number } | null;
  data_caveat: string | null;
}

export interface MarketMapSectorSignalOpportunity {
  master_id: string;
  name: string;
  signal_type: string;
  dimensions: { impact?: number; confidence?: number; urgency?: number; persistence?: number };
}

export interface MarketMapSectorSignalsResponse {
  cnae_code: string;
  level: MarketMapSectorLevel;
  companies_analyzed: number;
  counts_by_category: Record<string, number>;
  counts_by_type: Record<string, number>;
  top_opportunities: MarketMapSectorSignalOpportunity[];
  engine_version?: string;
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
    // ─── HARDENING-038 · Proxies JWT hacia Intel para la ficha extendida ───
    // La service-key S2S vive solo en el backend; estos métodos son la única
    // vía por la que el navegador accede a los motores Committee / Succession /
    // Roll-up / Market-Reading. Los responses son `dict` pass-through de Intel
    // — se tipan como `unknown` a propósito porque los componentes
    // (`InvestmentCommitteeBlock`, `OpportunityThesisBlock`) tienen sus propios
    // tipos internos y adaptan al recibir.
    committee: (cif: string, lens: 'neutral' | 'buyer' | 'investor' = 'neutral') =>
      request<unknown>(
        `/api/companies/${cif.toUpperCase()}/committee?lens=${lens}`,
        { method: 'POST' },
      ),
    committeeExport: (
      cif: string,
      decisionId: string,
      fmt: 'pdf' | 'json' = 'pdf',
    ) =>
      request<unknown>(
        `/api/companies/${cif.toUpperCase()}/committee/export/${encodeURIComponent(decisionId)}?fmt=${fmt}`,
      ),
    succession: (cif: string) =>
      request<unknown>(`/api/companies/${cif.toUpperCase()}/succession`),
    rollup: (cif: string, cnae?: string) =>
      request<unknown>(
        `/api/companies/${cif.toUpperCase()}/rollup${cnae ? `?cnae=${encodeURIComponent(cnae)}` : ''}`,
      ),
    marketReading: (cif: string) =>
      request<{ reading: string | null }>(
        `/api/companies/${cif.toUpperCase()}/market-reading`,
      ),
    // 2026-09-07 · Daniel (loading screen, punto 9c): resolución ligera y
    // cacheada del nombre real de la empresa, más rápida que `/ficha`
    // (agregador completo) — pensada para mostrarse mientras la ficha
    // completa sigue cargando. Requiere auth (el endpoint exige sesión);
    // el caller debe hacer `.catch(() => null)` como el resto de llamadas
    // "best effort" de este objeto.
    resolve: (cif: string) =>
      request<CompanyResolveResponse>(
        `/api/companies/${cif.toUpperCase()}/resolve`,
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
  mandates: {
    create: (payload: MandateCreatePayload, activeOrg?: string | null) =>
      request<Mandate>('/api/mandates', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
    listMine: (activeOrg?: string | null, status?: string) =>
      request<Mandate[]>(
        `/api/mandates/mine${status ? `?status=${encodeURIComponent(status)}` : ''}`,
        { headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined }
      ),
    get: (mandateId: string) => request<Mandate>(`/api/mandates/${mandateId}`),
    update: (mandateId: string, payload: Partial<MandateCreatePayload> & { status?: string }) =>
      request<Mandate>(`/api/mandates/${mandateId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    targets: (mandateId: string, limit = 20) =>
      request<MandateTargetsResponse>(`/api/mandates/${mandateId}/targets?limit=${limit}`),
  },
  // Listas guardadas / "Crear oportunidad desde selección" (kind: 'opportunity').
  lists: {
    create: (payload: SavedListCreatePayload, activeOrg?: string | null) =>
      request<SavedListDetail>('/api/lists', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
    mine: (activeOrg?: string | null) =>
      request<SavedListsResponse>('/api/lists', {
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
    get: (listId: string, activeOrg?: string | null) =>
      request<SavedListDetail>(`/api/lists/${listId}`, {
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
    addItems: (listId: string, cifs: string[], activeOrg?: string | null) =>
      request<SavedListDetail>(`/api/lists/${listId}/items`, {
        method: 'POST',
        body: JSON.stringify({ cifs }),
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
    removeItem: (listId: string, cif: string, activeOrg?: string | null) =>
      request<void>(`/api/lists/${listId}/items/${cif}`, {
        method: 'DELETE',
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
    rename: (listId: string, name: string, activeOrg?: string | null) =>
      request<SavedListDetail>(`/api/lists/${listId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
    remove: (listId: string, activeOrg?: string | null) =>
      request<void>(`/api/lists/${listId}`, {
        method: 'DELETE',
        headers: activeOrg ? { 'X-Active-Org': activeOrg } : undefined,
      }),
  },
  // Mapa Empresarial — proxies publicos (sin auth) hacia geo/sector/cross
  // intelligence de Intel (2026-08-28). Ver market_map/service.py en el backend.
  marketMap: {
    national: (months = 12) =>
      request<MarketMapNationalResponse>(`/api/market-map/national?months=${months}`),
    territories: (params: { level?: MarketMapGeoLevel; metric?: MarketMapMetric; limit?: number } = {}) => {
      const qp = new URLSearchParams();
      if (params.level) qp.set('level', params.level);
      if (params.metric) qp.set('metric', params.metric);
      if (typeof params.limit === 'number') qp.set('limit', String(params.limit));
      return request<MarketMapTerritoriesResponse>(`/api/market-map/territories?${qp.toString()}`);
    },
    territory: (level: MarketMapGeoLevel, code: string) =>
      request<MarketMapTerritoryDetailResponse>(`/api/market-map/territory/${level}/${code}`),
    sectors: (params: { level?: MarketMapSectorLevel; metric?: MarketMapMetric; limit?: number } = {}) => {
      const qp = new URLSearchParams();
      if (params.level) qp.set('level', params.level);
      if (params.metric) qp.set('metric', params.metric);
      if (typeof params.limit === 'number') qp.set('limit', String(params.limit));
      return request<MarketMapSectorsResponse>(`/api/market-map/sectors?${qp.toString()}`);
    },
    sectorsEmerging: (level: MarketMapSectorLevel = 'section') =>
      request<MarketMapEmergingResponse>(`/api/market-map/sectors/emerging?level=${level}`),
    crossSectorsIn: (geoLevel: MarketMapGeoLevel, geoCode: string, limit = 21) =>
      request<MarketMapCrossSectorsInResponse>(
        `/api/market-map/cross/sectors-in/${geoLevel}/${geoCode}?limit=${limit}`,
      ),
    crossTerritoryFor: (cnaeSection: string, geoLevel: MarketMapGeoLevel = 'province', limit = 20) =>
      request<MarketMapCrossTerritoryForResponse>(
        `/api/market-map/cross/territory-for/${cnaeSection}?geo_level=${geoLevel}&limit=${limit}`,
      ),
    sectorDetail: (cnaeCode: string) =>
      request<MarketMapSectorDetailResponse>(`/api/market-map/sector/${cnaeCode}`),
    sectorCompanies: (cnaeCode: string, limit = 20, offset = 0) =>
      request<MarketMapSectorCompaniesResponse>(
        `/api/market-map/sector/${cnaeCode}/companies?limit=${limit}&offset=${offset}`,
      ),
    sectorSignals: (cnaeCode: string, level: MarketMapSectorLevel = 'section', limit = 20) =>
      request<MarketMapSectorSignalsResponse>(
        `/api/market-map/sector/${cnaeCode}/signals?level=${level}&limit=${limit}`,
      ),
  },
};

// SWR-friendly fetcher
export const swrFetcher = <T>(path: string): Promise<T> => request<T>(path);
