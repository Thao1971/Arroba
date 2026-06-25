'use client';
/**
 * RefreshButton — botón canónico para refrescar una sección de la ficha.
 *
 * Extraído del CompanyPageClient para que sea reutilizable por futuras
 * entidades (Sector, Territorio, etc.) y por el Living Design System.
 *
 * Variantes (controladas por el caller, no internas):
 *   - idle:     "↺ {label}", clickable.
 *   - loading:  "{loadingLabel}", spinner, disabled.
 *   - cooldown: "Espera Ns", disabled, sin spinner.
 *   - disabled: explícito (ej. usuario anónimo o sin permisos).
 *
 * El componente NO arranca su propio countdown — eso es responsabilidad del
 * caller (porque el cooldown a menudo depende del backend Retry-After).
 */
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface RefreshButtonProps {
  /** Label en estado idle. Ej. "Refrescar análisis". */
  label: string;
  /** Label mientras está cargando. Default: "Refrescando…". */
  loadingLabel?: string;
  /** Segundos restantes de cooldown. Si > 0 → muestra "Espera Ns". */
  cooldownSeconds?: number | null;
  /** True mientras la operación está en vuelo. */
  loading?: boolean;
  /** Disabled explícito (independiente de loading/cooldown). */
  disabled?: boolean;
  onClick: () => void;
  testId?: string;
  className?: string;
}

export function RefreshButton({
  label,
  loadingLabel = 'Refrescando…',
  cooldownSeconds = null,
  loading = false,
  disabled = false,
  onClick,
  testId = 'refresh-button',
  className,
}: RefreshButtonProps) {
  const inCooldown = cooldownSeconds !== null && cooldownSeconds > 0;
  const isDisabled = loading || inCooldown || disabled;
  const text = loading
    ? loadingLabel
    : inCooldown
    ? `Espera ${cooldownSeconds}s`
    : `↺ ${label}`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      data-testid={testId}
      data-state={
        loading ? 'loading' : inCooldown ? 'cooldown' : disabled ? 'disabled' : 'idle'
      }
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2',
        'text-body-sm font-semibold border transition-colors duration-fast',
        'bg-surface-elevated text-text-primary border-border-default',
        'hover:bg-surface-muted',
        'focus-visible:shadow-focus',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      {loading ? (
        <Loader2 size={14} strokeWidth={1.8} className="animate-spin" aria-hidden />
      ) : (
        <RefreshCw
          size={14}
          strokeWidth={1.8}
          aria-hidden
          className={inCooldown ? 'opacity-60' : undefined}
        />
      )}
      <span>{text}</span>
    </button>
  );
}
