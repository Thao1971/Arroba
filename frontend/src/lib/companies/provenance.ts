/**
 * HARDENING-021 · Fase 2 (2026-08-13) · Helper de procedencia por métrica.
 *
 * Consume los dicts `finances.provenance` y `market.provenance` emitidos por Intel:
 *   finances.provenance = {block: {metric_key: "verified" | "calculated" | "inferred"}}
 *   market.provenance   = {block: {metric_key: "verified" | "calculated" | "inferred"}}
 *
 * Vocabulario controlado exactamente 3 valores (Anexo canon Fase 2 · REQ P2).
 *
 * REGLA R15 CRÍTICA: si `provenanceFor()` devuelve `null`, el consumidor NO PINTA
 * el `.srcdot`. La ausencia de entrada es información válida — nunca se debe
 * asumir "calculated" o "verified" por defecto.
 */

export type ProvenanceValue = 'verified' | 'calculated' | 'inferred';

export type ProvenanceBlock = Record<string, ProvenanceValue>;
export type ProvenanceDict = Record<string, ProvenanceBlock>;

/**
 * Consulta la procedencia de una métrica dentro de un bloque específico.
 * @param provenanceDict `finances.provenance` o `market.provenance` (dict abierto).
 * @param block ejemplo: `"kpis"`, `"ratios"`, `"cashflow"`, `"sector"`, `"concentration"`.
 * @param metricKey clave literal emitida por Intel (verificar con curl · no inventar).
 * @returns tipo de procedencia o `null` si no hay entrada.
 */
export function provenanceFor(
  provenanceDict: unknown,
  block: string,
  metricKey: string,
): ProvenanceValue | null {
  if (!provenanceDict || typeof provenanceDict !== 'object') return null;
  const dict = provenanceDict as Record<string, unknown>;
  const blockDict = dict[block];
  if (!blockDict || typeof blockDict !== 'object') return null;
  const v = (blockDict as Record<string, unknown>)[metricKey];
  if (v === 'verified' || v === 'calculated' || v === 'inferred') return v;
  return null;
}
