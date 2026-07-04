/**
 * Orchestrator types — Workspace = ordered list of Blocks materialised by a
 * Skill. Discriminated union by `type` mirrors the backend shape.
 */
import type { SearchResultItem } from '@/components/blocks';

export interface SearchResultsBlockSpec {
  type: 'search_results';
  id: string;
  props: {
    query: string;
    total: number;
    results: SearchResultItem[];
  };
}

export interface EmptyStateBlockSpec {
  type: 'empty_state';
  id: string;
  props: {
    title: string;
    description?: string | null;
    suggestions?: string[];
  };
}

export interface ErrorBlockSpec {
  type: 'error';
  id: string;
  props: {
    title: string;
    message?: string | null;
    code?: string | null;
    retry_intent?: string | null;
  };
}

export interface LoadingBlockSpec {
  type: 'loading';
  id: string;
  props: Record<string, never>;
}

// --- E1.4 blocks ---------------------------------------------------------
export interface HeroBlockSpec {
  type: 'hero';
  id: string;
  props: {
    eyebrow?: string | null;
    title: string;
    subtitle?: string | null;
    tone?: 'neutral' | 'success' | 'warning' | 'info';
  };
}

export interface MetricsBlockSpec {
  type: 'metrics';
  id: string;
  props: {
    title?: string | null;
    items: Array<{
      label: string;
      value: string;
      hint?: string | null;
      trend?: 'up' | 'down' | 'flat' | null;
    }>;
  };
}

export interface CompanyCardBlockSpec {
  type: 'company_card';
  id: string;
  props: {
    master_company_id: string;
    name: string;
    legal_name?: string | null;
    cif?: string | null;
    sector?: string | null;
    region?: string | null;
    country?: string | null;
    revenue?: number | null;
    ebitda?: number | null;
    employees?: number | null;
    fiscal_year?: number | null;
    confidence?: number | null;
  };
}

export interface CompanyCardsGridItemSpec {
  master_company_id: string;
  name: string;
  sector?: string | null;
  region?: string | null;
  score: number;
  reason?: string | null;
}

export interface CompanyCardsGridBlockSpec {
  type: 'company_cards_grid';
  id: string;
  props: {
    title?: string | null;
    subtype:
      | 'similar_to_company'
      | 'opportunities_by_sector'
      | 'list_by_sector'
      | 'generic';
    items: CompanyCardsGridItemSpec[];
  };
}

export interface ValuationBlockSpec {
  type: 'valuation';
  id: string;
  props: {
    company_name: string;
    sector?: string | null;
    method: 'ebitda_multiple' | 'revenue_multiple';
    multiple_label: string;
    multiple_value: number;
    central_value: number;
    low_value: number;
    high_value: number;
    currency: 'EUR';
    inputs: Array<{ label: string; value: string; hint?: string | null }>;
    disclaimer: string;
  };
}

export interface NarrativeBlockSpec {
  type: 'narrative';
  id: string;
  props: {
    title?: string | null;
    summary?: string | null;
    key_points: string[];
    risks: string[];
    opportunities: string[];
    citations: string[];
  };
}

export type BlockSpec =
  | SearchResultsBlockSpec
  | EmptyStateBlockSpec
  | ErrorBlockSpec
  | LoadingBlockSpec
  | HeroBlockSpec
  | MetricsBlockSpec
  | CompanyCardBlockSpec
  | CompanyCardsGridBlockSpec
  | ValuationBlockSpec
  | NarrativeBlockSpec;

export interface Workspace {
  workspace_id: string;
  intent: string;
  blocks: BlockSpec[];
}

export interface SkillContext {
  locale: 'es' | 'en';
  pathname: string;
  user_id?: string;
  org_id?: string;
}

export interface SearchSkillRequest {
  query: string;
  context: SkillContext;
}

export interface DisambiguationItem {
  master_company_id: string;
  cif: string | null;
  name: string;
  sector: string | null;
  region: string | null;
}

export interface SearchSkillResponse {
  /** Filled with a `SearchResultsBlock` or `EmptyStateBlock` workspace
   *  on the legacy/exploratory path. Null when the response is an
   *  entity-resolution (navigate_to) or disambiguation. */
  workspace: Workspace | null;
  provenance: 'demo' | 'live';
  query: string;
  /** E1.5-REWORK: when present, the client should `router.push(navigate_to)`
   *  to land on the entity page. */
  navigate_to?: string | null;
  entity_type?: 'company' | 'sector' | 'territory' | null;
  /** E1.5-REWORK: when present (length 1-5), render a compact disambiguation
   *  dropdown inside the dock. */
  disambiguation?: DisambiguationItem[] | null;
}

export interface AnalyzeSkillRequest {
  query: string;
  context: SkillContext;
}
export interface AnalyzeSkillResponse {
  workspace: Workspace;
  provenance: 'demo' | 'live';
  query: string;
}

export interface ValueSkillRequest {
  query: string;
  context: SkillContext;
}
export interface ValueSkillResponse {
  workspace: Workspace;
  provenance: 'demo' | 'live';
  query: string;
}

export interface RecommendSkillRequest {
  query: string;
  context: SkillContext;
}
export interface RecommendSkillResponse {
  workspace: Workspace;
  provenance: 'demo' | 'live';
  query: string;
}

/** Intent surfaced by the orchestrator. E1.4 adds analyze/value/recommend. */
export type Intent =
  | { kind: 'search'; query: string }
  | { kind: 'analyze'; query: string }
  | { kind: 'value'; query: string }
  | { kind: 'recommend'; query: string }
  | { kind: 'help' }
  | { kind: 'clear' };

export type SkillIntentKind = 'search' | 'analyze' | 'value' | 'recommend';
