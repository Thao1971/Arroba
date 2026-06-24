'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowRight, BoxIcon, FilterIcon, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { cn } from '@/lib/cn';
import type { WorkspaceList } from '@/lib/workspaces/types';

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'analyze', label: 'Análisis' },
  { value: 'value', label: 'Valoraciones' },
  { value: 'recommend', label: 'Recomendaciones' },
  { value: 'search', label: 'Búsquedas' },
  { value: 'mixed', label: 'Mixto' },
] as const;

const STATE_OPTIONS = [
  { value: 'active', label: 'Activos' },
  { value: 'archived', label: 'Archivados' },
] as const;

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

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
  return `hace ${Math.floor(days / 30)} mes${days < 60 ? '' : 'es'}`;
}

export default function HistoryPage() {
  const { activeOrgId } = useActiveOrg();
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]['value']>('all');
  const [state, setState] = useState<(typeof STATE_OPTIONS)[number]['value']>('active');

  const swrKey = activeOrgId ? ['ws-history', activeOrgId, type, state] : null;
  const { data, isLoading } = useSWR<WorkspaceList>(swrKey, () =>
    apiClient.workspaces.list(
      {
        type: type === 'all' ? undefined : type,
        state,
        limit: 50,
      },
      activeOrgId,
    ),
  );

  const items = data?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10" data-testid="history-page">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-text">Tu historial</h1>
        <p className="text-text-muted text-sm mt-1">
          Workspaces guardados de tu organización activa.
        </p>
      </header>

      <div
        className="flex flex-wrap items-center gap-3 mb-6"
        data-testid="history-filters"
      >
        <FilterIcon size={14} strokeWidth={1.6} className="text-text-subtle" />
        <FilterGroup
          label="Tipo"
          value={type}
          onChange={(v) => setType(v as typeof type)}
          options={TYPE_OPTIONS as unknown as Array<{ value: string; label: string }>}
          testIdPrefix="history-filter-type"
        />
        <FilterGroup
          label="Estado"
          value={state}
          onChange={(v) => setState(v as typeof state)}
          options={STATE_OPTIONS as unknown as Array<{ value: string; label: string }>}
          testIdPrefix="history-filter-state"
        />
      </div>

      {!activeOrgId && (
        <Empty title="Necesitas una organización activa para ver tus workspaces." />
      )}
      {activeOrgId && isLoading && (
        <p
          className="text-text-muted text-sm flex items-center gap-2"
          data-testid="history-loading"
        >
          <Loader2 size={14} className="animate-spin" /> Cargando…
        </p>
      )}
      {activeOrgId && !isLoading && items.length === 0 && (
        <Empty
          title={
            state === 'archived'
              ? 'No tienes workspaces archivados.'
              : 'Aún no tienes workspaces.'
          }
          description={
            state === 'active'
              ? 'Crea tu primer workspace desde el Copilot. Pregunta una empresa, una valoración o una recomendación y guarda la conversación.'
              : 'Cuando archives un workspace, lo verás aquí.'
          }
        />
      )}
      {items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="history-list">
          {items.map((w) => (
            <li key={w.workspace_id}>
              <Link
                href={`/es/w/${w.workspace_id}`}
                data-testid={`history-card-${w.workspace_id}`}
                className="group block h-full rounded-xl border border-border bg-surface p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 h-5 rounded-full text-[10px] font-mono font-semibold',
                      'bg-surface-2 text-text-muted',
                    )}
                  >
                    {TYPE_LABEL[w.workspace_type] ?? w.workspace_type}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 h-5 rounded-full text-[10px] font-mono font-semibold',
                      w.visibility === 'private'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-success/10 text-success',
                    )}
                    data-testid={`history-card-${w.workspace_id}-visibility`}
                  >
                    {w.visibility === 'private' ? 'Privado' : 'Equipo'}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-base text-text leading-tight mb-2">
                  {w.title}
                </h3>
                <p className="text-[11px] text-text-subtle mb-3">{relativeTime(w.updated_at)}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                  Abrir <ArrowRight size={11} strokeWidth={1.8} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
  testIdPrefix,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
  testIdPrefix: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wider text-text-subtle">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              data-testid={`${testIdPrefix}-${o.value}`}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center px-2.5 h-7 rounded-full border text-xs font-medium transition-colors',
                active
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-border text-text-muted hover:text-text hover:border-text-muted',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Empty({ title, description }: { title: string; description?: string }) {
  return (
    <div
      data-testid="history-empty"
      className="rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center"
    >
      <BoxIcon size={20} className="mx-auto text-text-subtle mb-2" strokeWidth={1.4} />
      <h3 className="font-display font-semibold text-text">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
