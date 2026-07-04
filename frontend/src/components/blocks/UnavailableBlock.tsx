'use client';
/**
 * UnavailableBlock — placeholder canónico para secciones cuyos datos
 * dependen de un REQ-XXX externo (proveedor de datos real, señales, etc.).
 *
 * Distinto de:
 *   - LockedSectionBlur: el dato existe pero requiere registro.
 *   - EmptyStateBlock: el dato no existe aún en este contexto (vacío).
 *   - ErrorBlock: hubo un fallo de runtime.
 *
 * UnavailableBlock representa: "este módulo depende de un proveedor externo
 * que aún no entrega el dato; sabemos qué necesitamos y por qué". Hace
 * explícito el `req` que lo bloquea.
 */
import { Construction } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface UnavailableBlockProps {
  /** Nombre humano de la capacidad (ej. "Señales BORME"). */
  title: string;
  /** Microcopy explicando qué se entregará cuando el REQ se cumpla. */
  description?: string;
  /** Identificador del requerimiento bloqueante (ej. "REQ-008"). */
  req?: string;
  /** ETA aproximada (ej. "E1.8" o "Q2 2026"). */
  eta?: string;
  /** Acción opcional al pie (ver feature request, contactar…). */
  cta?: { label: string; href: string };
  className?: string;
  testId?: string;
}

export function UnavailableBlock({
  title,
  description,
  req,
  eta,
  cta,
  className,
  testId = 'block-unavailable',
}: UnavailableBlockProps) {
  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-2xl border border-dashed border-border-default bg-surface-muted/60',
        'p-6 md:p-8 flex flex-col gap-3 items-start',
        'transition-colors duration-normal',
        className,
      )}
    >
      <div
        className="rounded-lg p-2 bg-warning-subtle text-warning"
        aria-hidden
      >
        <Construction size={18} strokeWidth={1.8} />
      </div>
      <div className="space-y-1">
        <h3 className="text-h4 font-display font-semibold text-text-primary leading-h4">
          {title}
        </h3>
        {description && (
          <p className="text-body-sm text-text-secondary leading-body max-w-prose">
            {description}
          </p>
        )}
      </div>
      {(req || eta) && (
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-caption text-text-muted">
          {req && (
            <div className="flex gap-1">
              <dt className="uppercase tracking-caption">Pendiente:</dt>
              <dd className="font-mono" data-testid={`${testId}-req`}>{req}</dd>
            </div>
          )}
          {eta && (
            <div className="flex gap-1">
              <dt className="uppercase tracking-caption">ETA:</dt>
              <dd className="font-mono" data-testid={`${testId}-eta`}>{eta}</dd>
            </div>
          )}
        </dl>
      )}
      {cta && (
        <a
          href={cta.href}
          data-testid={`${testId}-cta`}
          className={cn(
            'mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2',
            'text-body-sm font-semibold border border-border-default',
            'text-text-primary bg-surface-elevated',
            'hover:bg-surface-muted transition-colors duration-fast',
            'focus-visible:shadow-focus',
          )}
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}
