'use client';
import { useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/contexts/auth-context';
import { nextBestActions } from '@/lib/orchestrator';
import { useCopilot } from './CopilotProvider';
import { Composer, type ComposerHandle } from './Composer';
import { ConversationThread } from './ConversationThread';

/**
 * Floating Copilot dock. Two states:
 *   1. Minimised: FAB pinned bottom-right (52×52 round).
 *   2. Expanded: 420×min(560,80vh) panel anchored bottom-right, with header,
 *      thread + workspace, and composer.
 *
 * Keyboard shortcuts:
 *   - Cmd/Ctrl+K → toggle dock
 *   - ESC        → close dock if expanded
 *
 * Persistence: open + history are restored from localStorage by the provider.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal="false" (not modal — page is still usable)
 *   - aria-label
 *   - autofocus on composer when opening
 *   - returns focus to FAB when closing
 */
export function CopilotDock() {
  const { open, toggle, closeDock, clear, loading, workspace, history } = useCopilot();
  const pathname = usePathname() ?? '/';
  const { isAuthenticated } = useAuth();
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const composerRef = useRef<ComposerHandle | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const chips = useMemo(
    () => nextBestActions({ pathname, isAuthenticated }),
    [pathname, isAuthenticated]
  );

  // Global hotkeys
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isToggle) {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === 'Escape' && open) {
        closeDock();
        // Move focus back to the FAB so screen readers don't get lost.
        setTimeout(() => fabRef.current?.focus(), 50);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, toggle, closeDock]);

  // Autofocus composer when opening.
  useEffect(() => {
    if (open) {
      setTimeout(() => composerRef.current?.focus(), 60);
    }
  }, [open]);

  // Whether to show suggestion chips: only when the conversation hasn't
  // really started.
  const showChips = history.length === 0;

  // ---- minimised FAB ----
  if (!open) {
    return (
      <button
        ref={fabRef}
        type="button"
        onClick={() => toggle()}
        aria-label="Abrir Arroba Copilot (Cmd/Ctrl + K)"
        data-testid="copilot-dock-fab"
        className={cn(
          'fixed bottom-6 right-6 z-[1100]',
          'w-13 h-13 rounded-full flex items-center justify-center',
          'shadow-[0_10px_30px_rgba(12,12,14,0.35)]',
          'transition-transform duration-150 hover:-translate-y-0.5'
        )}
        style={{
          width: 52,
          height: 52,
          background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)',
        }}
      >
        <Sparkles size={22} strokeWidth={1.5} className="text-primary" />
      </button>
    );
  }

  // ---- expanded panel ----
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Arroba Copilot"
      data-testid="copilot-dock-panel"
      className={cn(
        'fixed bottom-6 right-6 z-[1100]',
        'flex flex-col',
        'rounded-2xl bg-surface border border-border overflow-hidden',
        'shadow-[0_20px_60px_rgba(12,12,14,0.35)]',
        'animate-[journeyIn_.22s_ease_both]'
      )}
      style={{
        width: 'min(420px, calc(100vw - 32px))',
        height: 'min(620px, calc(100vh - 32px))',
      }}
    >
      <Header onClose={closeDock} onClear={clear} clearDisabled={loading || history.length === 0} />
      <ConversationThread />
      <footer className="border-t border-border bg-surface-2 px-4 py-3" data-testid="copilot-dock-footer">
        <Composer ref={composerRef} chips={chips} showChips={showChips} />
      </footer>
      <SrAnnouncer loading={loading} workspaceId={workspace?.workspace_id ?? null} />
    </div>
  );
}

function Header({
  onClose,
  onClear,
  clearDisabled,
}: {
  onClose: () => void;
  onClear: () => void;
  clearDisabled: boolean;
}) {
  return (
    <header
      className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface"
      data-testid="copilot-dock-header"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)' }}
        aria-hidden
      >
        <Sparkles size={16} strokeWidth={1.5} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm text-text leading-tight">
          Arroba Copilot
        </p>
        <p className="text-[11px] text-text-subtle leading-tight">
          Pregunta lo que quieras · /clear · /help
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        disabled={clearDisabled}
        aria-label="Limpiar conversación"
        data-testid="copilot-dock-clear"
        className="text-xs font-semibold text-text-muted hover:text-text px-2 py-1 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Limpiar
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Minimizar Copilot"
        data-testid="copilot-dock-minimize"
        className="w-8 h-8 rounded-md border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text flex items-center justify-center"
      >
        <X size={14} strokeWidth={1.6} />
      </button>
    </header>
  );
}

function SrAnnouncer({
  loading,
  workspaceId,
}: {
  loading: boolean;
  workspaceId: string | null;
}) {
  return (
    <span
      className="sr-only"
      role="status"
      aria-live="polite"
      data-testid="copilot-sr-announcer"
    >
      {loading
        ? 'Cargando respuesta del Copilot…'
        : workspaceId
          ? 'Resultados actualizados'
          : ''}
    </span>
  );
}
