'use client';
/**
 * ActivityTimeline — módulo canónico Actividad (ENTITY_FRAMEWORK §3.11).
 *
 * Timeline de eventos recientes: watchlist toggle, refresh de análisis,
 * mensajes recientes del Copilot en la conversación de la empresa.
 *
 * Estados canónicos:
 *   - data: lista cronológica con icono, actor, resumen y fecha.
 *   - empty: EmptyStateBlock.
 *   - error: ErrorBlock.
 *   - loading: LoadingBlock (delegado al padre).
 */
import {
  Bookmark, BookmarkX, Sparkles, TrendingUp, GitCompareArrows, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { EmptyStateBlock } from './EmptyStateBlock';
import { ErrorBlock } from './ErrorBlock';

export interface ActivityItem {
  event_id: string;
  kind:
    | 'watchlist_added'
    | 'watchlist_removed'
    | 'analysis_refreshed'
    | 'valuation_refreshed'
    | 'comparables_refreshed'
    | 'conversation_message';
  at: string;
  actor_label: string | null;
  summary: string | null;
}

export interface ActivityTimelineProps {
  items: ActivityItem[];
  error?: { message: string } | null;
  className?: string;
  testId?: string;
}

const KIND_META: Record<
  ActivityItem['kind'],
  { icon: typeof Bookmark; label: string; tone: string }
> = {
  watchlist_added: {
    icon: Bookmark,
    label: 'Guardada en tu watchlist',
    tone: 'bg-surface-muted text-text-secondary',
  },
  watchlist_removed: {
    icon: BookmarkX,
    label: 'Retirada de tu watchlist',
    tone: 'bg-surface-muted text-text-secondary',
  },
  analysis_refreshed: {
    icon: Sparkles,
    label: 'Análisis del Copilot refrescado',
    tone: 'bg-accent-subtle text-accent',
  },
  valuation_refreshed: {
    icon: TrendingUp,
    label: 'Valoración refrescada',
    tone: 'bg-info-subtle text-info',
  },
  comparables_refreshed: {
    icon: GitCompareArrows,
    label: 'Comparables actualizados',
    tone: 'bg-info-subtle text-info',
  },
  conversation_message: {
    icon: MessageSquare,
    label: 'Mensaje del Copilot',
    tone: 'bg-accent-subtle text-accent',
  },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

export function ActivityTimeline({
  items,
  error,
  className,
  testId = 'activity-timeline',
}: ActivityTimelineProps) {
  if (error) {
    return (
      <ErrorBlock
        testId={`${testId}-error`}
        title="No se pudo cargar la actividad"
        message={error.message}
      />
    );
  }

  if (!items.length) {
    return (
      <EmptyStateBlock
        testId={`${testId}-empty`}
        title="Sin actividad reciente"
        description="Cuando guardes esta empresa, refresques su análisis o abras una conversación, verás la actividad aquí."
      />
    );
  }

  return (
    <ol
      data-testid={testId}
      className={cn('space-y-3', className)}
    >
      {items.map((item) => {
        const meta = KIND_META[item.kind];
        const Icon = meta.icon;
        return (
          <li
            key={item.event_id}
            data-testid={`${testId}-item-${item.event_id}`}
            className={cn(
              'flex items-start gap-3 rounded-xl border border-border-default bg-surface p-3',
            )}
          >
            <div className={cn('rounded-lg p-2 shrink-0', meta.tone)} aria-hidden>
              <Icon size={16} strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-body-sm font-medium text-text-primary">
                {meta.label}
              </p>
              {item.summary && (
                <p className="text-caption text-text-secondary line-clamp-2">
                  {item.summary}
                </p>
              )}
              <p className="text-caption text-text-muted">
                {item.actor_label ? `${item.actor_label} · ` : ''}
                {formatDateTime(item.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
