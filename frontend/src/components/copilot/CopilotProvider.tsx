'use client';
import {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { dispatch as orchestratorDispatch, type Workspace, type BlockSpec } from '@/lib/orchestrator';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api/client';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import type {
  EphemeralBlockSnapshot,
  EphemeralMessageSnapshot,
  WorkspaceExtendResponse,
} from '@/lib/workspaces/types';

/**
 * Copilot session state.
 *
 *  Three modes, transparently switched by `currentWorkspaceId` /
 *  `currentEntity`:
 *  - **ephemeral**: `send()` hits the Copilot skill endpoints directly.
 *    The workspace lives only in memory + localStorage.
 *  - **anchored**:  `send()` hits `POST /api/workspaces/{id}/messages` so
 *    the new blocks are persisted. The provider appends the delta to the
 *    local state (without recharging the workspace).
 *  - **entity_context** (E1.5-REWORK): when the user is on
 *    `/empresa/{cif}`, `send()` hits `POST /api/companies/{cif}/messages`
 *    so the Company Advisor returns `section_updates[]` that refresh the
 *    ficha sections (NOT free-standing blocks). The provider broadcasts
 *    those via `CustomEvent("arroba:company-section-update")`; the
 *    `CompanyPageClient` listens and re-renders only the affected sections.
 */

export type MessageRole = 'user' | 'assistant';

export interface CopilotMessage {
  id: string;
  role: MessageRole;
  text: string;
  workspace?: Workspace | null;
  ts: number;
}

export interface EntityContext {
  type: 'company';
  cif: string;
  name: string | null;
}

interface CopilotState {
  open: boolean;
  loading: boolean;
  history: CopilotMessage[];
  workspace: Workspace | null;
  lastQuery: string | null;
  currentWorkspaceId: string | null;
  currentEntity: EntityContext | null;
}

type Action =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'toggle' }
  | { type: 'submit'; text: string }
  | {
      type: 'resolve';
      assistant: string | null;
      workspace: Workspace | null;
      cleared?: boolean;
    }
  | { type: 'fail'; assistant: string }
  | { type: 'clear' }
  | { type: 'set_workspace_anchored'; workspaceId: string | null }
  | { type: 'set_entity_context'; entity: EntityContext | null }
  | {
      type: 'hydrate_persistent';
      messages: CopilotMessage[];
      workspace: Workspace | null;
    }
  | {
      type: 'hydrate_entity_conversation';
      messages: CopilotMessage[];
    }
  | { type: 'hydrate'; state: Partial<CopilotState> };

const INITIAL: CopilotState = {
  open: false,
  loading: false,
  history: [],
  workspace: null,
  lastQuery: null,
  currentWorkspaceId: null,
  currentEntity: null,
};

const STORAGE_KEY = 'arroba.copilot.session.v1';

/** Custom event emitted by the provider after a Company Advisor reply that
 *  carries section_updates. The CompanyPageClient listens for this and
 *  refreshes only the affected sections in-place. */
export const COMPANY_SECTION_UPDATE_EVENT = 'arroba:company-section-update';

function reducer(state: CopilotState, action: Action): CopilotState {
  switch (action.type) {
    case 'open':
      return { ...state, open: true };
    case 'close':
      return { ...state, open: false };
    case 'toggle':
      return { ...state, open: !state.open };
    case 'submit':
      return {
        ...state,
        loading: true,
        lastQuery: action.text,
        history: [
          ...state.history,
          { id: msgId(), role: 'user', text: action.text, ts: Date.now() },
        ],
      };
    case 'resolve':
      if (action.cleared) {
        return {
          ...state,
          loading: false,
          history: [],
          workspace: null,
          lastQuery: null,
        };
      }
      return {
        ...state,
        loading: false,
        workspace: action.workspace,
        history: action.assistant
          ? [
              ...state.history,
              {
                id: msgId(),
                role: 'assistant',
                text: action.assistant,
                workspace: action.workspace,
                ts: Date.now(),
              },
            ]
          : state.history,
      };
    case 'fail':
      return {
        ...state,
        loading: false,
        history: [
          ...state.history,
          { id: msgId(), role: 'assistant', text: action.assistant, ts: Date.now() },
        ],
      };
    case 'clear':
      return { ...state, history: [], workspace: null, lastQuery: null };
    case 'set_workspace_anchored':
      // When entering anchored mode we DO NOT auto-load the workspace; the
      // workspace page hydrates the provider explicitly via
      // `hydrate_persistent` once it fetched the detail. When leaving (id=null),
      // we keep the ephemeral state intact.
      return { ...state, currentWorkspaceId: action.workspaceId };
    case 'set_entity_context':
      // When entering /empresa/{cif} we wipe the dock history so it shows
      // the Company Advisor scoped to THIS entity (the hydration call adds
      // the persistent thread right after). When leaving, history is wiped
      // too so the dock returns to the ephemeral session.
      if (state.currentEntity?.cif === action.entity?.cif) {
        // Same entity (only name might have changed) → just update meta.
        return { ...state, currentEntity: action.entity };
      }
      return {
        ...state,
        currentEntity: action.entity,
        history: action.entity ? [] : state.history,
        workspace: action.entity ? null : state.workspace,
        lastQuery: null,
      };
    case 'hydrate_entity_conversation':
      return { ...state, history: action.messages };
    case 'hydrate_persistent': {
      const lastUserMsg = [...action.messages].reverse().find((m) => m.role === 'user');
      return {
        ...state,
        history: action.messages,
        workspace: action.workspace,
        lastQuery: lastUserMsg?.text ?? null,
      };
    }
    case 'hydrate':
      return { ...state, ...action.state };
    default:
      return state;
  }
}

function msgId(): string {
  return 'msg_' + Math.random().toString(36).slice(2, 10);
}

interface CopilotContextValue extends CopilotState {
  toggle: () => void;
  openDock: () => void;
  closeDock: () => void;
  send: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  clear: () => void;
  /** Promote ephemeral state to a persistent workspace. Returns the new URL
   *  (e.g. /es/w/wsp_xxxx) on success. Throws if the user is anonymous (the
   *  caller is expected to redirect to /login). */
  promoteToWorkspace: (options?: {
    workspaceType?: 'analyze' | 'value' | 'recommend' | 'search' | 'mixed';
    title?: string;
  }) => Promise<{ workspaceId: string; url: string }>;
  /** Used by /w/[id]/page.tsx to load the persisted workspace into the dock. */
  hydratePersistent: (messages: CopilotMessage[], workspace: Workspace | null) => void;
  /** Used by /empresa/[cif]/page.tsx to load the prior conversation thread
   *  into the dock and to attach the company's display name. */
  hydrateEntityConversation: (messages: CopilotMessage[], name: string) => void;
  dispatch: Dispatch<Action>;
}

const CopilotContext = createContext<CopilotContextValue | undefined>(undefined);

const ANCHORED_RE = /^\/(?:[a-z]{2}\/)?w\/([\w-]+)(?:\/.*)?$/;
const ENTITY_COMPANY_RE = /^\/(?:[a-z]{2}\/)?empresa\/([A-Za-z]\d{8})(?:\/.*)?$/;

function extractWorkspaceIdFromPath(pathname: string): string | null {
  const m = pathname.match(ANCHORED_RE);
  return m && m[1] ? m[1] : null;
}

function extractEntityCifFromPath(pathname: string): string | null {
  const m = pathname.match(ENTITY_COMPANY_RE);
  return m && m[1] ? m[1].toUpperCase() : null;
}

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { activeOrgId } = useActiveOrg();
  const hydrated = useRef(false);

  // Track which workspace we're anchored to (if any).
  const anchoredId = useMemo(() => extractWorkspaceIdFromPath(pathname), [pathname]);
  useEffect(() => {
    dispatch({ type: 'set_workspace_anchored', workspaceId: anchoredId });
  }, [anchoredId]);

  // Track which entity we're contextualised on (E1.5-REWORK).
  const entityCif = useMemo(() => extractEntityCifFromPath(pathname), [pathname]);
  useEffect(() => {
    dispatch({
      type: 'set_entity_context',
      entity: entityCif ? { type: 'company', cif: entityCif, name: null } : null,
    });
  }, [entityCif]);

  // Hydrate from localStorage once on mount (ephemeral state only — never the
  // anchored workspace, which has its own server source of truth).
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<CopilotState>;
        dispatch({
          type: 'hydrate',
          state: {
            open: Boolean(saved.open),
            history: Array.isArray(saved.history) ? saved.history.slice(-30) : [],
            workspace: saved.workspace ?? null,
            lastQuery: typeof saved.lastQuery === 'string' ? saved.lastQuery : null,
          },
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist ephemeral state (NOT anchored — that lives in DB).
  useEffect(() => {
    if (!hydrated.current) return;
    if (state.currentWorkspaceId) return; // don't pollute LS with persisted state
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          open: state.open,
          history: state.history.slice(-30),
          workspace: state.workspace,
          lastQuery: state.lastQuery,
        }),
      );
    } catch {
      // ignore
    }
  }, [state.open, state.history, state.workspace, state.lastQuery, state.currentWorkspaceId]);

  const send = useCallback<CopilotContextValue['send']>(
    async (rawText) => {
      const text = rawText.trim();
      if (!text) return;
      dispatch({ type: 'submit', text });

      // Entity-context mode (E1.5-REWORK): hit /companies/{cif}/messages.
      // The reply carries `section_updates[]` that the host page consumes via
      // a CustomEvent — the dock thread only shows the textual response.
      if (state.currentEntity?.type === 'company') {
        try {
          const cif = state.currentEntity.cif;
          const res = await apiClient.companies.sendMessage(cif, {
            query: text,
            context: { locale: 'es', pathname },
          });
          // Broadcast section_updates so CompanyPageClient can refresh in-
          // place. We do NOT push them into the dock as free-standing blocks.
          if (typeof window !== 'undefined' && res.section_updates.length) {
            window.dispatchEvent(
              new CustomEvent(COMPANY_SECTION_UPDATE_EVENT, {
                detail: { cif, section_updates: res.section_updates },
              }),
            );
          }
          dispatch({
            type: 'resolve',
            assistant: res.message_assistant.content,
            workspace: null,
          });
        } catch {
          dispatch({
            type: 'fail',
            assistant:
              'No he podido procesar tu mensaje. Inténtalo de nuevo en unos segundos.',
          });
        }
        return;
      }

      // Anchored mode: hit /workspaces/{id}/messages and merge the delta.
      if (state.currentWorkspaceId) {
        try {
          const res: WorkspaceExtendResponse = await apiClient.workspaces.extend(
            state.currentWorkspaceId,
            { query: text, context: { locale: 'es', pathname } },
          );
          const delta: Workspace = {
            workspace_id: state.currentWorkspaceId,
            intent: res.intent,
            blocks: res.blocks_added.map((b) => ({
              type: b.type,
              id: b.block_id,
              props: b.props,
            })) as BlockSpec[],
          };
          // Concatenate with whatever workspace is currently rendered so the
          // user sees the full history.
          const merged: Workspace = state.workspace
            ? {
                ...state.workspace,
                intent: res.intent,
                blocks: [...state.workspace.blocks, ...delta.blocks],
              }
            : delta;
          dispatch({
            type: 'resolve',
            assistant: res.message_assistant.content,
            workspace: merged,
          });
        } catch {
          dispatch({
            type: 'resolve',
            assistant: 'No he podido procesar la petición. Inténtalo de nuevo.',
            workspace: null,
          });
        }
        return;
      }

      // Ephemeral mode: orchestrator on the client decides which skill.
      const result = await orchestratorDispatch(text, {
        locale: 'es',
        pathname,
        user_id: user?.user_id,
        org_id: activeOrgId ?? undefined,
      });
      if (result.intent.kind === 'clear') {
        dispatch({
          type: 'resolve',
          assistant: result.assistantMessage,
          workspace: null,
          cleared: true,
        });
        return;
      }
      // E1.5-REWORK: entity-resolution → router.push to the ficha.
      if (result.navigate_to) {
        dispatch({
          type: 'resolve',
          assistant: result.assistantMessage,
          workspace: null,
        });
        router.push(result.navigate_to);
        return;
      }
      dispatch({
        type: 'resolve',
        assistant: result.assistantMessage,
        workspace: result.workspace,
      });
    },
    [
      pathname,
      router,
      user?.user_id,
      activeOrgId,
      state.currentEntity,
      state.currentWorkspaceId,
      state.workspace,
    ],
  );

  const retry = useCallback<CopilotContextValue['retry']>(async () => {
    if (!state.lastQuery) return;
    await send(state.lastQuery);
  }, [send, state.lastQuery]);

  const promoteToWorkspace = useCallback(
    async (options?: { workspaceType?: 'analyze' | 'value' | 'recommend' | 'search' | 'mixed'; title?: string }) => {
      if (!isAuthenticated) {
        throw new Error('promote_requires_auth');
      }
      // Snapshot the ephemeral state for persistence.
      const messages: EphemeralMessageSnapshot[] = state.history.map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const blocks: EphemeralBlockSnapshot[] = state.workspace
        ? state.workspace.blocks.map((b) => ({
            id: b.id,
            type: b.type,
            props: b.props as Record<string, unknown>,
          }))
        : [];
      const inferredType = inferWorkspaceTypeFromWorkspace(state.workspace);
      const res = await apiClient.workspaces.create(
        {
          ephemeral_state: { messages, blocks },
          workspace_type: options?.workspaceType ?? inferredType,
          title: options?.title ?? null,
          organization_id: activeOrgId,
        },
        activeOrgId,
      );
      return { workspaceId: res.workspace_id, url: res.url };
    },
    [activeOrgId, isAuthenticated, state.history, state.workspace],
  );

  const hydratePersistent = useCallback<CopilotContextValue['hydratePersistent']>(
    (messages, workspace) => {
      dispatch({ type: 'hydrate_persistent', messages, workspace });
    },
    [],
  );

  const hydrateEntityConversation = useCallback<
    CopilotContextValue['hydrateEntityConversation']
  >(
    (messages, name) => {
      dispatch({ type: 'hydrate_entity_conversation', messages });
      // Also attach the human name to the existing entity context so the
      // dock can render "✦ Company Advisor de {name}".
      if (entityCif) {
        dispatch({
          type: 'set_entity_context',
          entity: { type: 'company', cif: entityCif, name },
        });
      }
    },
    [entityCif],
  );

  const value = useMemo<CopilotContextValue>(
    () => ({
      ...state,
      toggle: () => dispatch({ type: 'toggle' }),
      openDock: () => dispatch({ type: 'open' }),
      closeDock: () => dispatch({ type: 'close' }),
      send,
      retry,
      clear: () => dispatch({ type: 'clear' }),
      promoteToWorkspace,
      hydratePersistent,
      hydrateEntityConversation,
      dispatch,
    }),
    [
      state,
      send,
      retry,
      promoteToWorkspace,
      hydratePersistent,
      hydrateEntityConversation,
    ],
  );

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
}

function inferWorkspaceTypeFromWorkspace(
  workspace: Workspace | null,
): 'analyze' | 'value' | 'recommend' | 'search' | 'mixed' {
  if (!workspace) return 'mixed';
  if (workspace.intent === 'analyze' || workspace.intent === 'value' || workspace.intent === 'recommend' || workspace.intent === 'search') {
    return workspace.intent;
  }
  return 'mixed';
}

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error('useCopilot must be used within <CopilotProvider>');
  return ctx;
}
