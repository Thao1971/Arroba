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

export type BlockSpec =
  | SearchResultsBlockSpec
  | EmptyStateBlockSpec
  | ErrorBlockSpec
  | LoadingBlockSpec;

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

export interface SearchSkillResponse {
  workspace: Workspace;
  source: 'mock' | 'real';
  query: string;
}

/** Intent surfaced by the orchestrator. Today we only support `search`. */
export type Intent =
  | { kind: 'search'; query: string }
  | { kind: 'help' }
  | { kind: 'clear' };
