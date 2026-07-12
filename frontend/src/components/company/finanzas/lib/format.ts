/**
 * Helpers de formateo numérico Finanzas (F0.2).
 *
 * R15: sin interpolar valores. Si un dato es `null`/`undefined`, se devuelve
 * el placeholder canónico (`—`) para señalar ausencia — nunca se calcula ni
 * se estima.
 */

export const UNAVAILABLE_DASH = '—';

const NBSP = '\u00A0';

/**
 * Formatea un importe en euros con separador de miles (locale es-ES).
 * Valores > 1M se abrevian a `1,23M€` para vistas ejecutivas.
 */
export function formatEuros(
  value: number | null | undefined,
  opts: { compact?: boolean; sign?: boolean } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return UNAVAILABLE_DASH;
  }
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : opts.sign && value > 0 ? '+' : '';
  if (opts.compact) {
    if (abs >= 1_000_000_000) {
      return `${sign}${(abs / 1_000_000_000).toLocaleString('es-ES', { maximumFractionDigits: 2 })}${NBSP}B€`;
    }
    if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 2 })}${NBSP}M€`;
    }
    if (abs >= 1_000) {
      return `${sign}${(abs / 1_000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}${NBSP}k€`;
    }
  }
  return `${sign}${abs.toLocaleString('es-ES', { maximumFractionDigits: 0 })}${NBSP}€`;
}

/**
 * Formatea un porcentaje. Espera valores decimales (0.256 → "25,6%").
 */
export function formatPercent(
  value: number | null | undefined,
  opts: { digits?: number; sign?: boolean } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return UNAVAILABLE_DASH;
  }
  const digits = opts.digits ?? 1;
  const percent = value * 100;
  const sign = percent < 0 ? '' : opts.sign && percent > 0 ? '+' : '';
  return `${sign}${percent.toLocaleString('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}${NBSP}%`;
}

/**
 * Formatea un ratio "puro" (1,17x, 3,02x). Espera un decimal (no fracción).
 */
export function formatRatio(
  value: number | null | undefined,
  opts: { digits?: number } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return UNAVAILABLE_DASH;
  }
  const digits = opts.digits ?? 2;
  return `${value.toLocaleString('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}x`;
}

/**
 * Router de format según `format` del contrato (`FinancialTableCell`,
 * `FinancialRatioItem`, `FinancialSeries`).
 */
export function formatByType(
  value: number | null | undefined,
  format: 'currency' | 'percent' | 'ratio' | 'number' | 'multiple' | string,
  opts: { compact?: boolean; sign?: boolean; digits?: number } = {},
): string {
  switch (format) {
    case 'currency':
      return formatEuros(value, { compact: opts.compact, sign: opts.sign });
    case 'percent':
      return formatPercent(value, { digits: opts.digits ?? 2, sign: opts.sign });
    case 'ratio':
    case 'multiple':
      return formatRatio(value, { digits: opts.digits ?? 2 });
    case 'number':
    default:
      if (value === null || value === undefined || Number.isNaN(value)) return UNAVAILABLE_DASH;
      return value.toLocaleString('es-ES', {
        maximumFractionDigits: opts.digits ?? 0,
      });
  }
}

/**
 * Ordena una lista de años ascendente (R15 · siempre orden cronológico natural).
 */
export function sortYearsAsc(years: number[] | null | undefined): number[] {
  if (!years || years.length === 0) return [];
  return [...new Set(years)].sort((a, b) => a - b);
}
