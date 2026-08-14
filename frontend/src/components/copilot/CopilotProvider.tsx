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

export type EntityType =
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

/**
 * Normalised entity context published by any Entity Page and read by the
 * permanent Composer to adapt its identity + prompt (Regla 1 del brief
 * SPRINT 1). Multi-tipo desde el primer día: en Sprint 1 solo `company`
 * es emitido pero el shape acepta los 11 tipos canónicos.
 */
export interface EntityContext {
  entity_type: EntityType;
  entity_id: string;
  entity_name: string | null;
  /** Solo para Match Workspace / Deal Workspace en sprints futuros. */
  workspace_id?: string;
}

interface CopilotState {
  open: boolean;
  loading: boolean;
  history: CopilotMessage[];
  workspace: Workspace | null;
  lastQuery: string | null;
  currentWorkspaceId: string | null;
  currentEntity: EntityContext | null;
  /**
   * HARDENING-025 · Item 3 · Prefill del Composer desde entidades externas.
   * Cuando un chip de oportunidad (u otro origen) inyecta texto al composer,
   * se guarda aquí y el Composer lo consume (setDraft + focus + limpia). NULL
   * cuando no hay prefill pendiente. Evita props drilling.
   */
  pendingComposerText: string | null;
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
  | { type: 'hydrate'; state: Partial<CopilotState> }
  | { type: 'set_pending_composer'; text: string | null };

const INITIAL: CopilotState = {
  open: false,
  loading: false,
  history: [],
  workspace: null,
  lastQuery: null,
  currentWorkspaceId: null,
  currentEntity: null,
  pendingComposerText: null,
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
        // HARDENING-026 · auto-expand del panel del thread al enviar. El dock
        // rediseñado como barra inferior deja el panel de conversación
        // colapsable; al enviar queremos que aparezca automáticamente para que
        // el usuario vea la respuesta cuando llegue.
        open: true,
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
      if (state.currentEntity?.entity_id === action.entity?.entity_id) {
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
    case 'set_pending_composer':
      // HARDENING-025 · Item 3 · prefill Composer. El Composer consume el
      // valor (setDraft + focus) y a continuación limpia con text=null.
      return { ...state, pendingComposerText: action.text };
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
  /** Publica un contexto de entidad genérico (Regla 1 · Sprint 1). Cualquier
   *  Entity Page llama a este método al montar; el Composer se adapta. */
  setEntityContext: (entity: EntityContext | null) => void;
  /** Alias explícito para limpiar el contexto en el unmount de la página. */
  clearEntityContext: () => void;
  /**
   * HARDENING-025 · Item 3 · Precarga el composer con `text`, abre el dock
   * si estaba cerrado y deja el foco en el textarea. Uso canónico:
   * chips de `opportunity.chips[]` que dispatchan un prompt al Copilot.
   * Fallback graceful: aunque el backend Copilot no responda, el composer
   * queda precargado (requisito explícito HARDENING-025).
   */
  prefillComposer: (text: string) => void;
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

  // Track which entity we're contextualised on. The URL extraction is only
  // a fallback: the canonical way (Regla 1) is that each Entity Page calls
  // `setEntityContext()` on mount. When the page unmounts or navigates
  // elsewhere, the URL regex kicks back in and produces `null` for
  // non-entity routes.
  const entityCif = useMemo(() => extractEntityCifFromPath(pathname), [pathname]);
  useEffect(() => {
    dispatch({
      type: 'set_entity_context',
      entity: entityCif
        ? { entity_type: 'company', entity_id: entityCif, entity_name: null }
        : null,
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
      if (state.currentEntity?.entity_type === 'company') {
        try {
          const cif = state.currentEntity.entity_id;
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

      // Ephemeral mode: shortcut CIF puro → naveación directa a la ficha.
      // Regla 1 · Sprint 1 · F4.4: si el usuario tipea "B47820150" en el
      // Composer, saltamos el orquestador cliente y navegamos a la ficha
      // directamente. No consume tokens LLM ni endpoint copilot.
      const cifMatch = text.trim().match(/^([A-Za-z][0-9]{7}[0-9A-Ja-j])$/);
      if (cifMatch) {
        const cif = cifMatch[1]!.toUpperCase();
        dispatch({
          type: 'resolve',
          assistant: `Te llevo a la empresa ${cif}.`,
          workspace: null,
        });
        router.push(`/empresa/${cif}`);
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
          entity: {
            entity_type: 'company',
            entity_id: entityCif,
            entity_name: name,
          },
        });
      }
    },
    [entityCif],
  );

  /**
   * Publish/clear an entity context from a page. This is the canonical way
   * for any Entity Page (Sprint 1: Company; Sprint 2+: Sector, Territory,
   * Operation, Match, …) to bind the permanent Composer to its scope.
   */
  const setEntityContext = useCallback((entity: EntityContext | null) => {
    dispatch({ type: 'set_entity_context', entity });
  }, []);

  const clearEntityContext = useCallback(() => {
    dispatch({ type: 'set_entity_context', entity: null });
  }, []);

  const prefillComposer = useCallback<CopilotContextValue['prefillComposer']>((text) => {
    // HARDENING-025 · Item 3. Abre el dock + inyecta texto pendiente. El
    // Composer sincroniza su `draft` con `pendingComposerText` vía effect y
    // reset a null cuando termina de consumirlo.
    dispatch({ type: 'open' });
    dispatch({ type: 'set_pending_composer', text });
  }, []);

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
      setEntityContext,
      clearEntityContext,
      prefillComposer,
      dispatch,
    }),
    [
      state,
      send,
      retry,
      promoteToWorkspace,
      hydratePersistent,
      hydrateEntityConversation,
      setEntityContext,
      clearEntityContext,
      prefillComposer,
    ],
  );

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
}

/**
 * useEntityContext — hook canónico para páginas de entidad.
 *
 * Uso típico dentro de una Entity Page:
 *
 *     const { publish } = useEntityContext();
 *     useEffect(() => {
 *       publish({ entity_type: 'company', entity_id: cif, entity_name: name });
 *       return () => publish(null);
 *     }, [cif, name]);
 */
export function useEntityContext(): {
  context: EntityContext | null;
  publish: (ctx: EntityContext | null) => void;
} {
  const { currentEntity, setEntityContext } = useCopilot();
  return { context: currentEntity, publish: setEntityContext };
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
