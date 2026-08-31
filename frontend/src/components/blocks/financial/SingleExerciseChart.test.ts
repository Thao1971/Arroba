/**
 * @componentId COMP-B-0331
 * @vitest-environment node
 *
 * Cobertura mínima del helper de cascada `resolveSingleExerciseCascade`
 * introducido en HARDENING-030c. Blinda los 3 escenarios que motivaron el
 * hotfix del gráfico de UN ejercicio:
 *   (a) legacy con datos → prioridad para legacy (contrato pre-existente).
 *   (b) legacy vacía + agregador con 1 punto → fallback al agregador.
 *   (c) ambos vacíos → null (el layout renderiza <Pending/> · R15).
 */

import { describe, it, expect } from 'vitest';
import { resolveSingleExerciseCascade } from './SingleExerciseChart';

describe('resolveSingleExerciseCascade · HARDENING-030c', () => {
  it('(a) legacy con datos → prioridad legacy · ebitdaMargin=null', () => {
    const legacy = { year: 2023, revenue: 12_500_000, ebitda: 2_100_000 };
    const evoPoints = [
      { year: 2024, revenue: 99, ebitda: 88, ebitda_margin: 0.5 },
    ];
    const out = resolveSingleExerciseCascade(legacy, evoPoints);
    expect(out).toEqual({
      year: 2023,
      revenue: 12_500_000,
      ebitda: 2_100_000,
      ebitdaMargin: null,
    });
  });

  it('(b) legacy vacía + agregador con 1 punto → fallback agregador con margen', () => {
    const evoPoints = [
      { year: 2024, revenue: 21_900_000, ebitda: 1_200_000, ebitda_margin: 0.0548 },
    ];
    const out = resolveSingleExerciseCascade(null, evoPoints);
    expect(out).toEqual({
      year: 2024,
      revenue: 21_900_000,
      ebitda: 1_200_000,
      ebitdaMargin: 0.0548,
    });
  });

  it('(c) ambos vacíos → null (layout renderiza Pending · R15)', () => {
    expect(resolveSingleExerciseCascade(null, [])).toBeNull();
    expect(resolveSingleExerciseCascade(null, null)).toBeNull();
    expect(resolveSingleExerciseCascade(null, undefined)).toBeNull();
  });

  it('agregador con ≥2 puntos → null (no es "un ejercicio", va al chart tendencia)', () => {
    const evoPoints = [
      { year: 2023, revenue: 10, ebitda: 1, ebitda_margin: 0.1 },
      { year: 2024, revenue: 20, ebitda: 2, ebitda_margin: 0.1 },
    ];
    expect(resolveSingleExerciseCascade(null, evoPoints)).toBeNull();
  });

  it('agregador con year no numérico o ausente → null (sin síntesis)', () => {
    expect(
      resolveSingleExerciseCascade(null, [{ revenue: 100, ebitda: 10 }]),
    ).toBeNull();
    expect(
      resolveSingleExerciseCascade(null, [{ year: null, revenue: 100 }]),
    ).toBeNull();
    expect(
      resolveSingleExerciseCascade(null, [{ year: 'abc', revenue: 100 }]),
    ).toBeNull();
  });

  it('agregador con campos no numéricos → los coerciona a null (no rompe)', () => {
    const evoPoints = [
      {
        year: 2024,
        revenue: null,
        ebitda: 'N/A',
        ebitda_margin: undefined,
      },
    ];
    expect(resolveSingleExerciseCascade(null, evoPoints)).toEqual({
      year: 2024,
      revenue: null,
      ebitda: null,
      ebitdaMargin: null,
    });
  });

  it('legacy con year=null y agregador válido → usa agregador (fallback estricto)', () => {
    const legacy = { year: null as never, revenue: 100, ebitda: 10 };
    const evoPoints = [
      { year: 2024, revenue: 500, ebitda: 50, ebitda_margin: 0.1 },
    ];
    const out = resolveSingleExerciseCascade(legacy, evoPoints);
    expect(out?.year).toBe(2024);
    expect(out?.revenue).toBe(500);
    expect(out?.ebitdaMargin).toBe(0.1);
  });

  // BUGFIX-2026-08-30 (P3) · fallback profit_loss cuando revenue/ebitda faltan.
  it('(P3) legacy con year pero revenue/ebitda null + profit_loss del mismo año → completa desde profit_loss', () => {
    const legacy = { year: 2024, revenue: null, ebitda: null };
    const profitLoss = {
      years: [2024],
      rows: [
        { key: 'revenue', values: [{ value: 7_500_000 }] },
        { key: 'ebitda', values: [{ value: 900_000 }] },
      ],
    };
    const out = resolveSingleExerciseCascade(legacy, null, profitLoss);
    expect(out).toEqual({
      year: 2024,
      revenue: 7_500_000,
      ebitda: 900_000,
      ebitdaMargin: null,
    });
  });

  it('(P3) profit_loss no tiene el año pedido → no completa, mantiene punto legacy con nulls', () => {
    // Preserva HARDENING-030c: cuando el año viene de legacy/evoPoints, se
    // respeta como punto aunque revenue/ebitda queden a null (el gráfico
    // pinta «—» explícito). Solo la rama (3a) profit_loss-primaria aplica
    // el R15 final de "sin dato útil → null".
    const legacy = { year: 2024, revenue: null, ebitda: null };
    const profitLoss = {
      years: [2022, 2023],
      rows: [
        { key: 'revenue', values: [{ value: 1 }, { value: 2 }] },
        { key: 'ebitda', values: [{ value: 3 }, { value: 4 }] },
      ],
    };
    expect(resolveSingleExerciseCascade(legacy, null, profitLoss)).toEqual({
      year: 2024,
      revenue: null,
      ebitda: null,
      ebitdaMargin: null,
    });
  });

  // BUGFIX-2026-08-30 (hotfix P3) · Caso REAL PRM Internacional A08698060.
  // Repro: legacy=null (financial.evolution es null en /financial-section),
  // evoPoints=[] (financialAnalysis.evolution.points vacío porque no hay
  // histórico), pero profit_loss trae {years:[2024], rows con revenue/ebitda
  // pobladas}. Antes del hotfix el helper devolvía null porque (3) solo
  // completaba KPIs faltantes cuando ya había `out` de otra fuente. Ahora
  // profit_loss también entra como fuente PRIMARIA cuando trae exactamente
  // 1 año y las otras dos fuentes están vacías.
  it('(P3-hotfix) profit_loss como fuente PRIMARIA cuando legacy=null y evoPoints=[] (repro A08698060)', () => {
    const profitLoss = {
      years: [2024],
      rows: [
        {
          key: 'revenue',
          values: [{ value: 1_861_978.24 }],
        },
        {
          key: 'supplies',
          values: [{ value: -220_000 }],
        },
        {
          key: 'personnel_costs',
          values: [{ value: -830_000 }],
        },
        {
          key: 'ebitda',
          values: [{ value: 770_599.86 }],
        },
        {
          key: 'ebit',
          values: [{ value: 767_959.71 }],
        },
        {
          key: 'net_income',
          values: [{ value: 619_676.81 }],
        },
      ],
    };
    const out = resolveSingleExerciseCascade(null, [], profitLoss);
    expect(out).not.toBeNull();
    expect(out).toEqual({
      year: 2024,
      revenue: 1_861_978.24,
      ebitda: 770_599.86,
      ebitdaMargin: null,
    });
  });

  it('(P3-hotfix) legacy=null, evoPoints=[], profit_loss.years=[] → null (sin fuente)', () => {
    // Guarda: profit_loss existe pero no tiene ningún año → sigue null.
    const profitLoss = { years: [], rows: [] };
    expect(resolveSingleExerciseCascade(null, [], profitLoss)).toBeNull();
  });

  it('(P3-hotfix) profit_loss.years=[2024] pero rows sin revenue ni ebitda útiles → null (R15)', () => {
    // Repro defensivo: profit_loss trae el año pero sus rows no tienen ni
    // revenue ni ebitda con valor numérico. R15: sin dato útil, null.
    const profitLoss = {
      years: [2024],
      rows: [
        { key: 'depreciation', values: [{ value: 100 }] },
        { key: 'net_income', values: [{ value: 50 }] },
      ],
    };
    expect(resolveSingleExerciseCascade(null, [], profitLoss)).toBeNull();
  });
});
