/**
 * HARDENING-032 · Unit tests para el filtro de `signal_badge` client-side.
 *
 * Pins la lógica pura del filtro (predicados + combinación AND) contra los
 * `signal_badge` reales que emite Intel hoy (snake_case ES). El token-map
 * defensivo cubre variantes EN por si Intel migra vocabulario en el futuro.
 *
 * Estos tests son la red de regresión de la lógica cliente hasta que Intel
 * emita `filter_by_signal_badge` server-side (BACKLOG INTEL).
 */
import { describe, expect, it } from 'vitest';

import {
  applySignalFilter,
  isGrowthBadge,
  isRiskBadge,
} from './_signal-filter';

type Row = { id: string; summary?: { signal_badge?: string | null } | null };

const rows: Row[] = [
  { id: 'a', summary: { signal_badge: 'alto_crecimiento' } },
  { id: 'b', summary: { signal_badge: 'riesgo' } },
  { id: 'c', summary: { signal_badge: 'estable' } },
  { id: 'd', summary: { signal_badge: 'comprando' } },
  { id: 'e', summary: { signal_badge: null } },
  { id: 'f', summary: null },
  { id: 'g' }, // no summary key
  { id: 'h', summary: { signal_badge: 'ALTO_CRECIMIENTO' } }, // case-insensitive
  { id: 'i', summary: { signal_badge: 'Growth' } }, // EN token defensivo
];

describe('HARDENING-032 · predicados de signal_badge', () => {
  it('isGrowthBadge acepta snake_case ES y token EN defensivo, case-insensitive', () => {
    expect(isGrowthBadge('alto_crecimiento')).toBe(true);
    expect(isGrowthBadge('ALTO_CRECIMIENTO')).toBe(true);
    expect(isGrowthBadge('alto crecimiento')).toBe(true);
    expect(isGrowthBadge('growth')).toBe(true);
    expect(isGrowthBadge('high_growth')).toBe(true);
    expect(isGrowthBadge('estable')).toBe(false);
    expect(isGrowthBadge('riesgo')).toBe(false);
    expect(isGrowthBadge(null)).toBe(false);
    expect(isGrowthBadge(undefined)).toBe(false);
    expect(isGrowthBadge('')).toBe(false);
  });

  it('isRiskBadge acepta snake_case ES y token EN defensivo, case-insensitive', () => {
    expect(isRiskBadge('riesgo')).toBe(true);
    expect(isRiskBadge('RIESGO')).toBe(true);
    expect(isRiskBadge('risk')).toBe(true);
    expect(isRiskBadge('at_risk')).toBe(true);
    expect(isRiskBadge('alto_crecimiento')).toBe(false);
    expect(isRiskBadge('estable')).toBe(false);
    expect(isRiskBadge(null)).toBe(false);
    expect(isRiskBadge('')).toBe(false);
  });
});

describe('HARDENING-032 · applySignalFilter', () => {
  it('devuelve la lista intacta cuando ambos toggles están OFF', () => {
    const out = applySignalFilter(rows, { onlyGrowth: false, excludeRisk: false });
    expect(out).toBe(rows); // referencia idéntica: sin trabajo innecesario
    expect(out).toHaveLength(rows.length);
  });

  it('onlyGrowth ON deja SÓLO items cuyo badge es growth (ES o EN)', () => {
    const out = applySignalFilter(rows, { onlyGrowth: true, excludeRisk: false });
    expect(out.map((r) => r.id).sort()).toEqual(['a', 'h', 'i']);
  });

  it('excludeRisk ON quita items con badge riesgo/risk pero preserva el resto (incluyendo badges nulos)', () => {
    const out = applySignalFilter(rows, { onlyGrowth: false, excludeRisk: true });
    // Se elimina 'b' (riesgo). El resto (incluidos badges nulos/vacíos) permanece.
    expect(out.map((r) => r.id).sort()).toEqual(['a', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
  });

  it('ambos toggles ON combinan como AND: sólo growth (que por definición no son riesgo)', () => {
    const out = applySignalFilter(rows, { onlyGrowth: true, excludeRisk: true });
    expect(out.map((r) => r.id).sort()).toEqual(['a', 'h', 'i']);
  });

  it('lista vacía → devuelve lista vacía sin explotar', () => {
    expect(applySignalFilter([], { onlyGrowth: true, excludeRisk: true })).toEqual([]);
  });

  it('items con summary null/undefined nunca se cuentan como growth cuando onlyGrowth=ON', () => {
    const only = applySignalFilter(rows, { onlyGrowth: true, excludeRisk: false });
    expect(only.some((r) => r.summary == null)).toBe(false);
    expect(only.some((r) => r.summary?.signal_badge == null)).toBe(false);
  });
});
