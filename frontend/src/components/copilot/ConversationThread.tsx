'use client';
import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { useCopilot } from './CopilotProvider';
import { WorkspaceArea } from './WorkspaceArea';
import { OpenWorkspaceButton } from './OpenWorkspaceButton';
import type { CopilotMessage } from './CopilotProvider';

/**
 * Conversation thread. User bubbles (right) + assistant bubbles (left) +
 * an inline `WorkspaceArea` rendered after the LAST assistant message that
 * carries a workspace. We don't render every workspace inline because:
 *   1. The UX expects one "live" workspace (most recent) → others stay as
 *      historical text only.
 *   2. Stacking 5 workspaces vertically makes the dock unusable.
 */
export function ConversationThread() {
  const { history, loading, workspace } = useCopilot();
  const scroller = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on any change.
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [history, loading, workspace]);

  // Render an empty welcome when there are no messages yet.
  if (history.length === 0 && !loading) {
    return (
      <div
        ref={scroller}
        data-testid="copilot-thread"
        className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col items-center justify-center text-center"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
             style={{ background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)' }}>
          <Sparkles size={20} strokeWidth={1.5} className="text-primary" />
        </div>
        <p className="font-display font-semibold text-text mb-1">Arroba Copilot</p>
        <p className="text-sm text-text-muted max-w-sm leading-relaxed">
          Escribe una empresa, un sector o una ubicación. Te muestro lo que tengo.
        </p>
      </div>
    );
  }

  // Find index of the last assistant message that carries a workspace — we'll
  // render the live workspace right after it.
  const lastWsIdx = (() => {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]?.role === 'assistant' && history[i]?.workspace) return i;
    }
    return -1;
  })();

  return (
    <div
      ref={scroller}
      data-testid="copilot-thread"
      className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4"
    >
      {history.map((m, idx) => (
        <Message key={m.id} m={m} />
      )).reduce<React.ReactNode[]>((acc, node, idx) => {
        acc.push(node);
        if (idx === lastWsIdx && workspace) {
          acc.push(
            <div key={`ws-${workspace.workspace_id}`} className="pl-9">
              <WorkspaceArea workspace={workspace} />
              <OpenWorkspaceButton />
            </div>
          );
        }
        return acc;
      }, [])}
      {loading && <Typing />}
    </div>
  );
}

function Message({ m }: { m: CopilotMessage }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end" data-testid="copilot-message-user">
        <div className="max-w-[78%] bg-primary text-white text-sm font-medium px-4 py-2 rounded-[15px_15px_5px_15px]">
          {m.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 items-start" data-testid="copilot-message-assistant">
      <div
        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)' }}
        aria-hidden
      >
        <Sparkles size={14} strokeWidth={1.5} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0 text-sm text-text leading-relaxed">{m.text}</div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex gap-3 items-center" data-testid="copilot-typing">
      <div
        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)' }}
        aria-hidden
      >
        <Sparkles size={14} strokeWidth={1.5} className="text-primary" />
      </div>
      <div className="flex gap-1 px-1 py-2.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 150}ms` }}
            className="block w-1.5 h-1.5 rounded-full bg-text-subtle animate-[journeyBounce_1s_infinite_ease-in-out]"
          />
        ))}
      </div>
    </div>
  );
}
