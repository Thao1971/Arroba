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
import { RecentWorkspacesPanel } from './RecentWorkspacesPanel';

/**
 * HARDENING-026 · Reskin del `CopilotDock` (2026-08-14).
 *
 * ANTES (Sprint 1 · e1_tester): FAB flotante 52×52 en la esquina inferior
 * derecha; al pulsar se expandía a un panel modal 420×620 anclado en la
 * esquina con thread + composer dentro.
 *
 * AHORA: **barra inferior centrada** a lo ancho del contenido, tipo Claude
 * / GPT ficha. La barra está SIEMPRE visible para usuarios autenticados.
 * El `ConversationThread` aparece como panel colapsable ENCIMA de la barra
 * (auto-expand al enviar; cierre con la X del header). Reutiliza los tokens
 * del canon `.afk` (radius, shadow, red-500 send button).
 *
 * INTACTO POR DENTRO (Regla crítica del ticket):
 *   - `CopilotProvider.send` → `/api/companies/{cif}/messages` (entity_context)
 *   - `ConversationThread` (superficie única de respuestas textuales)
 *   - `section_updates[]` → refresh in-place de la ficha vía CustomEvent
 *   - `nextBestActions` (chips contextuales)
 *   - `RecentWorkspacesPanel`
 *   - `data-testid="composer"` (contrato con e1_tester)
 *   - Gate anónimo (`!isAuthenticated → null`)
 *   - `prefillComposer` / `pendingComposerText` (HARDENING-025 Item 3)
 *
 * Ver `ARROBA_PHILOSOPHY.md` §12 "La ficha es la verdad": la respuesta
 * canónica del Copilot cuando el usuario está en `/empresa-f01/{cif}` es la
 * actualización de las secciones de la ficha; el thread textual encima de
 * la barra es la conversación complementaria.
 *
 * Keyboard shortcuts (preservados):
 *   - Cmd/Ctrl+K → foco al composer + abre panel del thread si tenía history.
 *   - ESC        → cierra el panel del thread (barra permanece visible).
 *
 * Persistence: `open` + `history` restaurados de localStorage por el provider.
 *
 * Accessibility:
 *   - `role="dialog" aria-modal="false"` en el panel (no modal — page usable).
 *   - `aria-label` en la barra y el panel.
 *   - Autofocus al composer al montar en la ficha (via prefill) o Cmd/K.
 */
export function CopilotDock() {
  const {
    open,
    openDock,
    closeDock,
    clear,
    loading,
    workspace,
    history,
    currentEntity,
  } = useCopilot();
  const pathname = usePathname() ?? '/';
  const { isAuthenticated } = useAuth();
  const composerRef = useRef<ComposerHandle | null>(null);

  const chips = useMemo(
    () => nextBestActions({ pathname, isAuthenticated }),
    [pathname, isAuthenticated]
  );

  // Global hotkeys. Cmd/Ctrl+K abre el panel + enfoca el composer. ESC cierra
  // el panel del thread (la barra sigue ahí).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isToggle) {
        e.preventDefault();
        openDock();
        setTimeout(() => composerRef.current?.focus(), 60);
        return;
      }
      if (e.key === 'Escape' && open) {
        closeDock();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, openDock, closeDock]);

  // Autofocus composer al abrir el panel (equivalente al comportamiento previo
  // del FAB → panel).
  useEffect(() => {
    if (open) {
      setTimeout(() => composerRef.current?.focus(), 60);
    }
  }, [open]);

  // Suggestion chips visibles cuando la conversación aún no ha empezado.
  const showChips = history.length === 0;

  // Panel del thread visible cuando el usuario ha interactuado (`open` +
  // history no vacío). No mostramos panel vacío: si abren con Cmd/K y no hay
  // history, sólo se enfoca el composer.
  const panelVisible = open && (history.length > 0 || loading);

  // ---- gate visual: sin barra Copilot para usuarios anónimos ----
  if (!isAuthenticated) {
    return null;
  }

  // ---- raíz persistente del Composer (contrato con e1_tester) ----
  // Regla 1 · Sprint 1: el Composer permanente vive en el layout raíz y
  // expone `data-testid="composer"`. La barra es el estado por defecto
  // (siempre visible autenticado); `data-open` refleja si el panel del
  // thread está expandido (contract preservado, semántica ampliada).
  return (
    <div
      data-testid="composer"
      data-open={open ? 'true' : 'false'}
      data-entity-mode={currentEntity ? 'true' : 'false'}
      className="fixed inset-x-0 bottom-0 z-[1100] flex justify-center px-5 pb-5 pointer-events-none"
      aria-label="Arroba Copilot"
    >
      {/* Gradient scrim para que la barra flote sobre contenido claro sin
          taparlo bruscamente. Reutiliza el patrón del `.cop-wrap::before`
          canónico del mockup. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[150px]"
        style={{
          background: 'linear-gradient(to top, var(--color-surface, #FAFAF9) 36%, transparent)',
        }}
      />
      <div className="relative w-full max-w-[680px] pointer-events-auto">
        {panelVisible && (
          <div
            role="dialog"
            aria-modal="false"
            aria-label="Conversación con Arroba Copilot"
            data-testid="copilot-dock-panel"
            className={cn(
              'mb-2 flex flex-col rounded-2xl bg-surface border border-border overflow-hidden shadow-xl animate-fade-in-up'
            )}
            style={{ maxHeight: 'min(56vh, 460px)' }}
          >
            <Header
              onClose={closeDock}
              onClear={clear}
              clearDisabled={loading || history.length === 0}
              entityName={currentEntity?.entity_name ?? null}
            />
            <ConversationThread />
          </div>
        )}
        <div data-testid="copilot-dock-bar">
          <Composer ref={composerRef} chips={chips} showChips={showChips} />
        </div>
        <SrAnnouncer loading={loading} workspaceId={workspace?.workspace_id ?? null} />
      </div>
    </div>
  );
}

function Header({
  onClose,
  onClear,
  clearDisabled,
  entityName,
}: {
  onClose: () => void;
  onClear: () => void;
  clearDisabled: boolean;
  entityName: string | null;
}) {
  // When the dock is contextualised on an entity (e.g. /empresa-f01/{cif}), the
  // header reflects the specialised advisor identity per
  // ARROBA_PHILOSOPHY.md §12 "Company Advisor".
  const title = entityName ? `✦ Company Advisor de ${entityName}` : 'Arroba Copilot';
  const subtitle = entityName
    ? 'Conversación específica para esta empresa · /clear · /help'
    : 'Pregunta lo que quieras · /clear · /help';
  return (
    <header
      className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface"
      data-testid="copilot-dock-header"
      data-entity-mode={entityName ? 'true' : 'false'}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--gradient-brand-dark)' }}
        aria-hidden
      >
        <Sparkles size={16} strokeWidth={1.5} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-display font-semibold text-sm text-text leading-tight truncate"
          data-testid="copilot-dock-title"
        >
          {title}
        </p>
        <p className="text-[11px] text-text-subtle leading-tight truncate">
          {subtitle}
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
      <RecentWorkspacesPanel />
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar panel de conversación"
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
