/**
 * Formato es-ES estricto.
 * Reglas (CLAUDE.md):
 *   miles con punto, decimales con coma, fechas DD/MM/AAAA.
 */
const NBSP = '\u00A0';

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString('es-ES', {
    maximumFractionDigits: 0,
    useGrouping: 'always',
  } as Intl.NumberFormatOptions);
}

export function formatDecimal(
  n: number | null | undefined,
  decimals = 1
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: 'always',
  } as Intl.NumberFormatOptions);
}

export interface CurrencyOptions {
  /** force suffix M€ / K€ instead of exact euros */
  compact?: boolean;
  decimals?: number;
}

export function formatCurrency(
  n: number | null | undefined,
  opts: CurrencyOptions = {}
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const compact = opts.compact ?? true;
  const decimals = opts.decimals ?? 1;
  const abs = Math.abs(n);
  if (compact && abs >= 1_000_000) {
    return `${formatDecimal(n / 1_000_000, decimals)}M€`;
  }
  if (compact && abs >= 1_000) {
    return `${formatDecimal(n / 1_000, decimals)}K€`;
  }
  return `${formatNumber(n)}${NBSP}€`;
}

export function formatPercent(
  n: number | null | undefined,
  decimals = 1
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${formatDecimal(n, decimals)}%`;
}

function toDate(d: Date | string | number): Date {
  if (d instanceof Date) return d;
  return new Date(d);
}

export function formatDate(d: Date | string | number): string {
  const date = toDate(d);
  if (Number.isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const MONTHS_ES_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
] as const;

export interface ShortDateOptions {
  month?: boolean;
}

export function formatDateShort(
  d: Date | string | number,
  opts: ShortDateOptions = {}
): string {
  const date = toDate(d);
  if (Number.isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  if (opts.month) {
    const m = MONTHS_ES_SHORT[date.getMonth()];
    return `${dd}${NBSP}${m ?? ''}`;
  }
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}
