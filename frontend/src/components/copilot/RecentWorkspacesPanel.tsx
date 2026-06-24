'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Clock, ChevronDown, ArrowRight } from 'lucide-react';
import useSWR from 'swr';
import { apiClient } from '@/lib/api/client';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { cn } from '@/lib/cn';
import type { WorkspaceList } from '@/lib/workspaces/types';

/**
 * RecentWorkspacesPanel — dropdown of the user's 10 most recent workspaces
 * for the active org. Used inside the Copilot dock header.
 *
 * Click on a row → navigates to /es/w/{id} (closes the dock implicitly via
 * route change).
 */

function relativeTime(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return 'hace segundos';
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `hace ${days} d`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months === 1 ? '' : 'es'}`;
}

const TYPE_LABEL: Record<string, string> = {
  analyze: 'Análisis',
  value: 'Valoración',
  recommend: 'Recomendaciones',
  search: 'Búsqueda',
  mixed: 'Mixto',
};

export function RecentWorkspacesPanel() {
  const { activeOrgId } = useActiveOrg();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const swrKey = activeOrgId ? ['ws-recent', activeOrgId] : null;
  const { data, isLoading } = useSWR<WorkspaceList>(swrKey, () =>
    apiClient.workspaces.list({ limit: 10 }, activeOrgId),
  );

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
    return undefined;
  }, [open]);

  const items = data?.items ?? [];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="copilot-dock-recent-button"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 h-8 px-2 rounded-md text-text-muted hover:text-text hover:bg-surface-2 text-xs font-medium"
      >
        <Clock size={13} strokeWidth={1.6} />
        Recientes
        <ChevronDown size={11} strokeWidth={1.6} />
      </button>
      {open && (
        <div
          role="menu"
          data-testid="copilot-dock-recent-menu"
          className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-surface shadow-lg overflow-hidden z-40"
        >
          <div className="px-3 py-2 border-b border-border text-[11px] uppercase tracking-wider text-text-subtle">
            Workspaces recientes
          </div>
          {!activeOrgId && (
            <p className="px-3 py-4 text-xs text-text-muted">
              Selecciona una organización para ver tus workspaces.
            </p>
          )}
          {activeOrgId && isLoading && (
            <p
              className="px-3 py-4 text-xs text-text-muted"
              data-testid="copilot-dock-recent-loading"
            >
              Cargando…
            </p>
          )}
          {activeOrgId && !isLoading && items.length === 0 && (
            <p
              className="px-3 py-4 text-xs text-text-muted"
              data-testid="copilot-dock-recent-empty"
            >
              Aún no tienes workspaces. Cuando guardes una conversación, aparecerá aquí.
            </p>
          )}
          {items.length > 0 && (
            <ul className="max-h-72 overflow-y-auto">
              {items.map((w) => (
                <li key={w.workspace_id}>
                  <Link
                    href={`/es/w/${w.workspace_id}`}
                    onClick={() => setOpen(false)}
                    data-testid={`copilot-dock-recent-item-${w.workspace_id}`}
                    className="flex items-start gap-2 px-3 py-2.5 text-sm hover:bg-surface-2 transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-display font-semibold text-text text-sm truncate leading-tight">
                        {w.title}
                      </span>
                      <span className="block text-[11px] text-text-subtle mt-0.5">
                        <span
                          className={cn(
                            'inline-block px-1.5 h-4 rounded-full font-mono text-[10px] mr-1',
                            'bg-surface-2 text-text-muted',
                          )}
                        >
                          {TYPE_LABEL[w.workspace_type] ?? w.workspace_type}
                        </span>
                        {relativeTime(w.updated_at)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/es/historial"
            onClick={() => setOpen(false)}
            data-testid="copilot-dock-recent-all"
            className="border-t border-border flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-surface-2"
          >
            Ver todo el historial
            <ArrowRight size={11} strokeWidth={1.8} />
          </Link>
        </div>
      )}
    </div>
  );
}
