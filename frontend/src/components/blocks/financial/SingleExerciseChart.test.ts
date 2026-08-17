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
});
