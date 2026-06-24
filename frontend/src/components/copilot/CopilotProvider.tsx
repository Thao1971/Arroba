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
import { usePathname } from 'next/navigation';
import { dispatch as orchestratorDispatch, type Workspace } from '@/lib/orchestrator';
import { useAuth } from '@/contexts/auth-context';

/**
 * Centralised state for the Copilot dock. Mounted once near the root of the
 * (public) and (authenticated) layouts. Persists `open` + `history` to
 * localStorage so the UX feels stable across navigations.
 */

export type MessageRole = 'user' | 'assistant';

export interface CopilotMessage {
  id: string;
  role: MessageRole;
  text: string;
  workspace?: Workspace | null;
  ts: number;
}

interface CopilotState {
  open: boolean;
  loading: boolean;
  history: CopilotMessage[];
  workspace: Workspace | null;
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
  | { type: 'hydrate'; state: Partial<CopilotState> };

const INITIAL: CopilotState = {
  open: false,
  loading: false,
  history: [],
  workspace: null,
};

const STORAGE_KEY = 'arroba.copilot.session.v1';

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
        history: [
          ...state.history,
          { id: msgId(), role: 'user', text: action.text, ts: Date.now() },
        ],
      };
    case 'resolve':
      if (action.cleared) {
        return { ...state, loading: false, history: [], workspace: null };
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
      return { ...state, history: [], workspace: null };
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
  clear: () => void;
  dispatch: Dispatch<Action>;
}

const CopilotContext = createContext<CopilotContextValue | undefined>(undefined);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const pathname = usePathname() ?? '/';
  const { isAuthenticated, user, memberships } = useAuth();
  const hydrated = useRef(false);

  // Hydrate from localStorage once on mount.
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
          },
        });
      }
    } catch {
      // ignore corrupted state
    }
  }, []);

  // Persist on change (debounced via microtask).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          open: state.open,
          history: state.history.slice(-30),
          workspace: state.workspace,
        })
      );
    } catch {
      // quota / private mode → ignore silently
    }
  }, [state.open, state.history, state.workspace]);

  const send = useCallback<CopilotContextValue['send']>(
    async (rawText) => {
      const text = rawText.trim();
      if (!text) return;
      dispatch({ type: 'submit', text });
      const result = await orchestratorDispatch(text, {
        locale: 'es',
        pathname,
        user_id: user?.user_id,
        org_id: memberships?.[0]?.org_id,
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
      dispatch({
        type: 'resolve',
        assistant: result.assistantMessage,
        workspace: result.workspace,
      });
    },
    [pathname, user?.user_id, memberships]
  );

  const value = useMemo<CopilotContextValue>(
    () => ({
      ...state,
      toggle: () => dispatch({ type: 'toggle' }),
      openDock: () => dispatch({ type: 'open' }),
      closeDock: () => dispatch({ type: 'close' }),
      send,
      clear: () => dispatch({ type: 'clear' }),
      dispatch,
    }),
    [state, send]
  );

  // Avoid leaking the explicit `isAuthenticated` consumer warning in tests
  void isAuthenticated;

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
}

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error('useCopilot must be used within <CopilotProvider>');
  return ctx;
}
