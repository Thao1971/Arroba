/**
 * Types mirroring `/app/backend/src/modules/companies/models.py`.
 *
 * Source of truth is the OpenAPI schema served at `/api/openapi.json`. These
 * types are hand-maintained because we don't yet codegen TS from the
 * FastAPI schema; keep them in sync when the backend models change.
 */
import type { BlockSpec } from '@/lib/orchestrator/types';

export type WatchlistVisibility = 'private' | 'team';

export type SectionId =
  | 'identity'
  | 'financials'
  | 'score'
  | 'comparables'
  | 'valuation'
  | 'narrative'
  | 'metrics'
  | 'signals';

export const ANONYMOUS_LOCKED_FLAGS: readonly string[] = [
  'score',
  'comparables',
  'valuation',
  'narrative',
  'actions',
];

export interface SectionUpdate {
  section: SectionId;
  block: BlockSpec;
}

export type SuggestedAction =
  | 'activate_opportunity'
  | 'request_valuation'
  | 'view_finances'
  | 'save_to_watchlist'
  | 'share_with_team'
  | 'download_mercantile_memory'
  | 'claim_company'
  | 'refresh_analysis';

export interface CompanyIdentity {
  master_company_id: string;
  cif: string | null;
  legal_name: string;
  sector: string | null;
  region: string | null;
  country: string;
  founded_year: number | null;
  employees: number | null;
}

export interface CompanyHeaderInfo {
  name: string;
  cif: string | null;
  sector: string | null;
  region: string | null;
  country: string | null;
  initials: string;
  score: number | null;
}

/** All 8 sections of the company page. `score_block`, `comparables`,
 *  `valuation` and `narrative` are null for anonymous visitors. */
export interface CompanySections {
  hero: BlockSpec;
  kpi_metrics: BlockSpec;
  identity: CompanyIdentity;
  financials_metrics: BlockSpec;
  score_block: BlockSpec | null;
  comparables: BlockSpec | null;
  valuation: BlockSpec | null;
  narrative: BlockSpec | null;
}

export interface CompanyDetailResponse {
  header: CompanyHeaderInfo;
  sections: CompanySections;
  /** Names of sections (and the special "actions" flag) the anonymous user
   *  cannot access. Use `LockedSectionBlur` to render them as teasers. */
  locked_sections: string[];
  in_watchlist: boolean;
  watchlist_visibility: WatchlistVisibility | null;
  conversation_id: string | null;
  /** Origen del dato: `demo` (dataset de demostración local) o `live`
   *  (proveedor real en producción). El backend puede seguir emitiendo
   *  el campo legacy `source`; el cliente lo mapea a `provenance`. */
  provenance: 'demo' | 'live';
}

export interface CompanyConversationMessage {
  message_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent: string | null;
  section_updates: SectionUpdate[];
  suggested_actions: string[];
  created_at: string;
}

export interface GetConversationResponse {
  conversation_id: string;
  master_company_id: string;
  messages: CompanyConversationMessage[];
}

export interface SendMessageRequest {
  query: string;
  context?: { locale?: 'es' | 'en'; pathname?: string };
}

export interface SendMessageResponse {
  message_user: CompanyConversationMessage;
  message_assistant: CompanyConversationMessage;
  section_updates: SectionUpdate[];
  suggested_actions: string[];
}

export interface RefreshAnalysisResponse {
  block: BlockSpec;
}

export interface RefreshValuationResponse {
  block: BlockSpec;
}

export interface RefreshComparablesResponse {
  block: BlockSpec;
}

export interface WatchlistToggleResponse {
  saved: boolean;
  visibility: WatchlistVisibility | null;
}

export interface ShareToggleResponse {
  visibility: WatchlistVisibility;
}

/**
 * Shape de `GET /api/companies/{cif}/resolve` (Sprint F0.2,
 * `PublicResolveResult` en el backend). Resolución ligera y cacheada,
 * más rápida que el agregador completo de ficha (`/ficha`) — se usa para
 * poder mostrar el nombre real de la empresa mientras la ficha completa
 * todavía está cargando (loading screen, 2026-09-07).
 *
 * F0.2-OP3: NO expone `master_id` (identificador interno protegido).
 */
export interface CompanyResolveResponse {
  cif: string;
  resolved: boolean;
  canonical_name: string | null;
  match_type: string;
  score: number;
  engine_version: string;
}

/** Disambiguation row (also re-exported here for convenience because the
 *  search response uses it when a query matches multiple known entities). */
export interface DisambiguationItem {
  master_company_id: string;
  cif: string | null;
  name: string;
  sector: string | null;
  region: string | null;
}

/** BUGFIX-2026-09-09 · Daniel (Punto 3): item devuelto por
 *  `GET /api/companies/suggest` (proxy fino a Intel). Contrato canónico
 *  de Intel confirmado por curl 09:20 UTC tras deploy upstream:
 *    { results: [{ master_company_id, name, cif, sector, name_parts }] }
 *  Fix contrato Suggest (post-diagnóstico 2026-09-09): frontend adapta al
 *  shape Intel — no invertimos. R15: campos ausentes ⇒ el dropdown pinta
 *  solo lo que hay, `name_parts` puede llegar como null. */
export interface SuggestItem {
  cif: string;
  name: string;
  master_company_id?: string | null;
  sector?: string | null;
  /** Partición del `name` en before/match/after emitida por Intel para
   *  resaltar el fragmento que coincide con lo tecleado. Beta NO recalcula
   *  índices propios (R15: consume, no calcula). Si `name_parts` no llega,
   *  el componente cae al `name` plano sin resaltado. */
  name_parts?: { before: string; match: string; after: string } | null;
}
