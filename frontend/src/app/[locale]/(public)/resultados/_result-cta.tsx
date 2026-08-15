'use client';
/**
 * HARDENING-033 · CTA contextual sobre `/resultados` filtrado.
 *
 * Detecta intención transaccional: cuando el usuario aplica al menos un chip
 * de filtro por `signal_badge` (HARDENING-032), le proponemos el próximo paso
 * natural del journey:
 *   - Autenticado → guardar la búsqueda como watchlist.
 *   - Anónimo     → crear cuenta con `?next=<URL>` para volver aquí.
 *
 * Cero visual nuevo: banda discreta con los mismos tokens de la action bar.
 * No renderiza cuando ambos toggles están OFF (no compite con la lectura sin
 * filtro).
 *
 * Destino auth: `/{locale}/me/watchlists/new?q=…&signals=…` (stub Fase 2).
 * Destino anon: `/{locale}/registro?next=<encoded>`. El param `next` es
 * futuro-proof; hoy `/registro` no lo consume — cuando lo haga, este link
 * ya está listo.
 */
import Link from 'next/link';
import { Bookmark, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export interface ResultCTAProps {
  /** Query del usuario (`q`). Se propaga al destino para restaurar contexto. */
  query: string;
  /** Toggle "sólo alto crecimiento" activo. */
  onlyGrowth: boolean;
  /** Toggle "excluir riesgo" activo. */
  excludeRisk: boolean;
  /** Locale actual — necesario para prefijar la ruta destino. */
  locale: string;
  /** Path actual (sin querystring). Sirve como `next=` para anon. */
  pathname: string;
  /** N.º de filas visibles en la página tras el filtro. Se pinta en el copy. */
  visibleCount: number;
}

function buildSignalsParam(onlyGrowth: boolean, excludeRisk: boolean): string {
  const parts: string[] = [];
  if (onlyGrowth) parts.push('growth');
  if (excludeRisk) parts.push('no-risk');
  return parts.join(',');
}

function buildAuthHref(locale: string, query: string, signals: string): string {
  const qs = new URLSearchParams();
  if (query) qs.set('q', query);
  if (signals) qs.set('signals', signals);
  return `/${locale}/me/watchlists/new?${qs.toString()}`;
}

function buildAnonHref(
  locale: string,
  pathname: string,
  query: string,
  signals: string,
): string {
  const currentQs = new URLSearchParams();
  if (query) currentQs.set('q', query);
  if (signals) currentQs.set('signals', signals);
  const next = currentQs.toString()
    ? `${pathname}?${currentQs.toString()}`
    : pathname;
  const qs = new URLSearchParams({ next });
  return `/${locale}/registro?${qs.toString()}`;
}

export function ResultCTA({
  query,
  onlyGrowth,
  excludeRisk,
  locale,
  pathname,
  visibleCount,
}: ResultCTAProps) {
  const { isAuthenticated } = useAuth();
  const anyFilterOn = onlyGrowth || excludeRisk;
  if (!anyFilterOn) return null;

  const signals = buildSignalsParam(onlyGrowth, excludeRisk);
  const countLabel =
    visibleCount === 1 ? '1 candidato filtrado' : `${visibleCount} candidatos filtrados`;

  if (isAuthenticated) {
    return (
      <div
        data-testid="resultados-cta-watchlist"
        data-variant="auth"
        className="flex items-center justify-between gap-4 px-4 py-3 mb-2 rounded-xl border border-border bg-surface-2/40 text-sm"
      >
        <span className="text-text-muted">
          <span className="font-semibold text-text">{countLabel}.</span>{' '}
          ¿Guardar esta búsqueda como watchlist?
        </span>
        <Link
          href={buildAuthHref(locale, query, signals)}
          data-testid="resultados-cta-watchlist-link"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shrink-0"
        >
          <Bookmark size={13} strokeWidth={1.8} />
          Guardar búsqueda
          <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>
    );
  }

  return (
    <div
      data-testid="resultados-cta-watchlist"
      data-variant="anon"
      className="flex items-center justify-between gap-4 px-4 py-3 mb-2 rounded-xl border border-border bg-surface-2/40 text-sm"
    >
      <span className="text-text-muted">
        <span className="font-semibold text-text">{countLabel} hoy.</span>{' '}
        Crea una cuenta para hacer seguimiento diario.
      </span>
      <Link
        href={buildAnonHref(locale, pathname, query, signals)}
        data-testid="resultados-cta-watchlist-link"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shrink-0"
      >
        <UserPlus size={13} strokeWidth={1.8} />
        Crear cuenta
        <ArrowRight size={12} strokeWidth={2} />
      </Link>
    </div>
  );
}
