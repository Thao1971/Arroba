'use client';
/**
 * SignalsTimeline — módulo canónico Señales (ENTITY_FRAMEWORK §3.7).
 *
 * En Sprint 1 este módulo renderiza SIEMPRE UnavailableBlock con REQ-008
 * (fuente externa BORME pendiente). Cuando REQ-008 esté entregado el
 * componente cambiará a renderizar los `items` reales sin cambio de
 * contract.
 *
 * Estados canónicos:
 *   - data: lista cronológica de señales.
 *   - empty: EmptyStateBlock.
 *   - unavailable: UnavailableBlock con REQ + ETA.
 *   - error: ErrorBlock.
 *   - loading: LoadingBlock (delegado al padre).
 */
import { AlertTriangle, Info, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { EmptyStateBlock } from './EmptyStateBlock';
import { ErrorBlock } from './ErrorBlock';
import { UnavailableBlock } from './UnavailableBlock';

export interface SignalItem {
  kind: string;
  dated_at: string | null;
  headline: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface SignalsTimelineProps {
  items: SignalItem[];
  unavailable?: boolean;
  req?: string | null;
  eta?: string | null;
  error?: { message: string } | null;
  className?: string;
  testId?: string;
}

const SEVERITY_ICON = {
  info: Info,
  warning: AlertTriangle,
  critical: Zap,
} as const;

const SEVERITY_STYLE = {
  info: 'bg-surface-muted text-text-secondary',
  warning: 'bg-warning-subtle text-warning',
  critical: 'bg-critical-subtle text-critical',
} as const;

export function SignalsTimeline({
  items,
  unavailable = false,
  req,
  eta,
  error,
  className,
  testId = 'signals-timeline',
}: SignalsTimelineProps) {
  if (error) {
    return (
      <ErrorBlock
        testId={`${testId}-error`}
        title="No se pudieron cargar las señales"
        message={error.message}
      />
    );
  }
  if (unavailable) {
    return (
      <UnavailableBlock
        testId={`${testId}-unavailable`}
        title="Señales pendientes de conexión con fuentes externas"
        description="Aún no publicamos las señales BORME, contratación pública y prensa. Llegarán en cuanto se entregue la conexión."
        req={req ?? undefined}
        eta={eta ?? undefined}
      />
    );
  }
  if (!items.length) {
    return (
      <EmptyStateBlock
        testId={`${testId}-empty`}
        title="Aún no hay señales relevantes"
        description="No hemos detectado eventos externos que afecten a esta empresa en los últimos meses."
      />
    );
  }
  return (
    <ol
      data-testid={testId}
      className={cn('space-y-4', className)}
    >
      {items.map((s, idx) => {
        const Icon = SEVERITY_ICON[s.severity] ?? Info;
        return (
          <li
            key={`${s.kind}-${idx}`}
            className="flex items-start gap-4 rounded-2xl border border-border-default bg-surface p-4"
          >
            <div className={cn('rounded-lg p-2 shrink-0', SEVERITY_STYLE[s.severity])} aria-hidden>
              <Icon size={18} strokeWidth={1.6} />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-body text-text-primary leading-body">
                {s.headline}
              </p>
              <p className="text-caption text-text-muted">
                {s.kind.toUpperCase()}
                {s.dated_at ? ` · ${formatDate(s.dated_at)}` : ''}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
