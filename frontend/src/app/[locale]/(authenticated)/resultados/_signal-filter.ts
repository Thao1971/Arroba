/**
 * HARDENING-032 · Utilidades puras del filtro por `signal_badge` client-side.
 *
 * Vive fuera de `page.tsx` porque Next.js App Router prohíbe exports
 * arbitrarios (sólo `default`, `metadata`, `generateMetadata`, etc.) desde
 * un módulo de página. Estas utilidades son consumidas por `page.tsx` y por
 * el test unitario hermano.
 *
 * Intel emite hoy los `signal_badge` en snake_case ES (`alto_crecimiento`,
 * `riesgo`, `estable`, `comprando`, `buscando_financiacion`). El token-map
 * añade variantes EN por si Intel migra el vocabulario en el futuro; el
 * matching es literal case-insensitive, sin fuzzy: si Intel emite un valor
 * fuera del catálogo, el filtro simplemente no lo captura (fail-open del
 * lado del usuario: no perdemos filas por interpretaciones erróneas).
 *
 * Sin persistencia: HARDENING-031 aborda checkbox/URL persistence aparte.
 */

const GROWTH_TOKENS = [
  'alto_crecimiento',
  'alto crecimiento',
  'growth',
  'high_growth',
];
const RISK_TOKENS = ['riesgo', 'risk', 'at_risk'];

function normalizeBadge(badge: string | null | undefined): string {
  return (badge ?? '').toLowerCase().trim();
}

export function isGrowthBadge(badge: string | null | undefined): boolean {
  const n = normalizeBadge(badge);
  return !!n && GROWTH_TOKENS.some((t) => n === t);
}

export function isRiskBadge(badge: string | null | undefined): boolean {
  const n = normalizeBadge(badge);
  return !!n && RISK_TOKENS.some((t) => n === t);
}

export function applySignalFilter<
  T extends { summary?: { signal_badge?: string | null } | null },
>(items: T[], opts: { onlyGrowth: boolean; excludeRisk: boolean }): T[] {
  if (!opts.onlyGrowth && !opts.excludeRisk) return items;
  return items.filter((r) => {
    const b = r.summary?.signal_badge;
    if (opts.onlyGrowth && !isGrowthBadge(b)) return false;
    if (opts.excludeRisk && isRiskBadge(b)) return false;
    return true;
  });
}
