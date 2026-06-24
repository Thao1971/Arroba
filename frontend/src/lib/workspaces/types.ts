/**
 * Workspaces — TS types mirroring the backend Pydantic models.
 *
 * The block shapes live in `lib/orchestrator/types.ts`. Workspaces add a thin
 * metadata + ordering layer on top.
 */
import type { BlockSpec } from '@/lib/orchestrator/types';

export type WorkspaceType = 'analyze' | 'value' | 'recommend' | 'search' | 'mixed';
export type WorkspaceState = 'active' | 'archived';
export type WorkspaceVisibility = 'private' | 'team' | 'organization' | 'public';
export type WorkspaceMessageRole = 'user' | 'assistant' | 'system';

export interface WorkspaceDoc {
  workspace_id: string;
  workspace_type: WorkspaceType;
  title: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  state: WorkspaceState;
  visibility: WorkspaceVisibility;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceMessage {
  message_id: string;
  workspace_id: string;
  role: WorkspaceMessageRole;
  content: string;
  intent?: string | null;
  created_at: string;
}

export interface WorkspaceBlock {
  block_id: string;
  workspace_id: string;
  message_id?: string | null;
  type: BlockSpec['type'];
  props: Record<string, unknown>;
  order: number;
  created_at: string;
}

export interface WorkspaceDetail {
  workspace: WorkspaceDoc;
  messages: WorkspaceMessage[];
  blocks: WorkspaceBlock[];
}

export interface WorkspaceSummary {
  workspace_id: string;
  workspace_type: WorkspaceType;
  title: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  state: WorkspaceState;
  visibility: WorkspaceVisibility;
}

export interface WorkspaceList {
  items: WorkspaceSummary[];
  total: number;
  has_more: boolean;
}

export interface EphemeralBlockSnapshot {
  id: string;
  type: BlockSpec['type'];
  props: Record<string, unknown>;
}

export interface EphemeralMessageSnapshot {
  role: WorkspaceMessageRole;
  content: string;
  intent?: string | null;
}

export interface EphemeralStateSnapshot {
  messages: EphemeralMessageSnapshot[];
  blocks: EphemeralBlockSnapshot[];
}

export interface WorkspaceCreatePayload {
  ephemeral_state: EphemeralStateSnapshot;
  workspace_type: WorkspaceType;
  title?: string | null;
  organization_id?: string | null;
}

export interface WorkspaceCreateResponse {
  workspace_id: string;
  url: string;
  workspace_type: WorkspaceType;
  title: string;
  visibility: WorkspaceVisibility;
}

export interface WorkspaceExtendPayload {
  query: string;
  context: { locale: 'es' | 'en'; pathname?: string };
}

export interface WorkspaceExtendResponse {
  workspace_id: string;
  message_user: WorkspaceMessage;
  message_assistant: WorkspaceMessage;
  blocks_added: WorkspaceBlock[];
  intent: string;
}
