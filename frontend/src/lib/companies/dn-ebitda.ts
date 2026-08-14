/**
 * HARDENING-023 (2026-08-13) · HARDENING-025 Item 4 (2026-08-14) · Cascada
 * canónica de estados del KPI DN/EBITDA. Función pura testeable extraída
 * desde `CompanyFichaLayoutV2.tsx` para permitir cobertura unitaria.
 *
 * Fuente CANONICAL (spec usuario): `kpis.net_debt` + `kpis.ebitda` del payload
 * `/ficha`. Fallback tolerante a `balance_sheet.net_debt` cuando Intel lo pone
 * en el balance en vez de en kpis.
 *
 * ESTADOS (orden estricto de resolución):
 *   1. Falta dato base           → { kind: 'empty' }        → "— · Sin dato"
 *   2. net_debt <= 0             → { kind: 'no_debt' }      → "— · Sin deuda neta"
 *   3. ebitda   <= 0 (con deuda) → { kind: 'ebitda_neg' }   → "— · EBITDA negativo"
 *   4. Ambos positivos           → { kind: 'ratio', value } → "N,N×"
 *
 * R15: NO derivamos `net_debt` local desde `financial_debt - cash` si Intel no
 * lo emite. Cuando falta el dato base → estado 1 (Empty honesto).
 */

export type DnEbitdaState =
  | { kind: 'empty' }
  | { kind: 'no_debt' }
  | { kind: 'ebitda_neg' }
  | { kind: 'ratio'; value: number };

function readNum(source: Record<string, unknown> | null | undefined, key: string): number | null {
  const v = source?.[key];
  return (typeof v === 'number' && isFinite(v)) ? v : null;
}

/**
 * Calcula el estado del KPI DN/EBITDA a partir de los sub-bloques de
 * `FinancialAnalysis`.
 *
 * @param kpis            `financialAnalysis.kpis` — canonical.
 * @param balanceSheet    `financialAnalysis.balance_sheet` — fallback para `net_debt`.
 */
export function computeDnEbitdaState(
  kpis: Record<string, unknown> | null | undefined,
  balanceSheet: Record<string, unknown> | null | undefined,
): DnEbitdaState {
  const netDebt: number | null = readNum(kpis, 'net_debt') ?? readNum(balanceSheet, 'net_debt');
  const ebitda: number | null = readNum(kpis, 'ebitda');
  if (netDebt == null || ebitda == null) return { kind: 'empty' };
  if (netDebt <= 0) return { kind: 'no_debt' };
  if (ebitda <= 0) return { kind: 'ebitda_neg' };
  return { kind: 'ratio', value: netDebt / ebitda };
}
