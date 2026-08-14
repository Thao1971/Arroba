/**
 * HARDENING-025 · Item 4 · Tests unitarios de `computeDnEbitdaState`.
 *
 * Cubre los 4 estados canónicos + edge cases + regresión histórica
 * (HARDENING-023): el orden de la cascada garantiza que "EBITDA negativo"
 * SÓLO aparece cuando hay deuda neta positiva (netDebt > 0).
 *
 * Regresión clave del report del usuario en HARDENING-025 Item 4: si
 * `netDebt > 0` y `ebitda <= 0`, el estado DEBE ser `ebitda_neg`, no
 * `no_debt`.
 */
import { describe, expect, it } from 'vitest';
import { computeDnEbitdaState } from './dn-ebitda';

describe('computeDnEbitdaState · HARDENING-023 · HARDENING-025 Item 4', () => {
  it('estado 1 · empty · net_debt ausente y ebitda ausente', () => {
    expect(computeDnEbitdaState(null, null)).toEqual({ kind: 'empty' });
  });

  it('estado 1 · empty · net_debt null pero ebitda presente (Servier B28184687)', () => {
    // Regresión real observada en dev pod: Servier emite ebitda pero NO net_debt.
    expect(computeDnEbitdaState({ ebitda: 18_511_020 }, null)).toEqual({ kind: 'empty' });
  });

  it('estado 1 · empty · net_debt presente pero ebitda ausente', () => {
    expect(computeDnEbitdaState({ net_debt: 100_000 }, null)).toEqual({ kind: 'empty' });
  });

  it('estado 1 · empty · ebitda negativo pero net_debt ausente (INNOVATIVE A28354132)', () => {
    // Caso real observado: nd=null, eb=-7134 → empty (no ebitda_neg porque
    // falta el dato base de net_debt).
    expect(computeDnEbitdaState({ ebitda: -7134 }, null)).toEqual({ kind: 'empty' });
  });

  it('estado 2 · no_debt · net_debt = 0 y ebitda positivo', () => {
    expect(computeDnEbitdaState({ net_debt: 0, ebitda: 100_000 }, null))
      .toEqual({ kind: 'no_debt' });
  });

  it('estado 2 · no_debt · net_debt negativo (caja neta positiva) y ebitda positivo', () => {
    expect(computeDnEbitdaState({ net_debt: -50_000, ebitda: 100_000 }, null))
      .toEqual({ kind: 'no_debt' });
  });

  it('estado 2 · no_debt · precedencia sobre ebitda_neg (netDebt<=0 gana aunque ebitda<0)', () => {
    // Regla canónica: si NO hay deuda neta, se muestra "Sin deuda neta"
    // INDEPENDIENTEMENTE del signo del EBITDA. Es una verdad del balance,
    // no del income statement.
    expect(computeDnEbitdaState({ net_debt: -1000, ebitda: -500 }, null))
      .toEqual({ kind: 'no_debt' });
  });

  it('estado 3 · ebitda_neg · net_debt > 0 y ebitda = 0', () => {
    expect(computeDnEbitdaState({ net_debt: 1_000_000, ebitda: 0 }, null))
      .toEqual({ kind: 'ebitda_neg' });
  });

  it('estado 3 · ebitda_neg · net_debt > 0 y ebitda < 0 · CASO CRÍTICO HARDENING-025', () => {
    // Este es EXACTAMENTE el escenario que el usuario reportaba mal
    // resuelto ("veo Sin deuda neta cuando debería ver EBITDA negativo").
    // La cascada actual lo resuelve correctamente.
    expect(computeDnEbitdaState({ net_debt: 500_000, ebitda: -100_000 }, null))
      .toEqual({ kind: 'ebitda_neg' });
  });

  it('estado 4 · ratio · ambos positivos', () => {
    const result = computeDnEbitdaState({ net_debt: 3_000_000, ebitda: 1_000_000 }, null);
    expect(result).toEqual({ kind: 'ratio', value: 3 });
  });

  it('fallback · lee net_debt del balance_sheet cuando kpis no lo emite', () => {
    // Escenario Intel: net_debt llega en balance_sheet, ebitda en kpis.
    const result = computeDnEbitdaState(
      { ebitda: 500_000 },
      { net_debt: 2_000_000 },
    );
    expect(result).toEqual({ kind: 'ratio', value: 4 });
  });

  it('kpis.net_debt tiene precedencia sobre balance_sheet.net_debt', () => {
    const result = computeDnEbitdaState(
      { net_debt: 1_000_000, ebitda: 500_000 },
      { net_debt: 999_999_999 },
    );
    expect(result).toEqual({ kind: 'ratio', value: 2 });
  });

  it('tolerante a valores no numéricos (string, NaN, Infinity) · degrada a empty', () => {
    expect(computeDnEbitdaState({ net_debt: 'oops' as unknown as number, ebitda: 100 }, null))
      .toEqual({ kind: 'empty' });
    expect(computeDnEbitdaState({ net_debt: NaN, ebitda: 100 }, null))
      .toEqual({ kind: 'empty' });
    expect(computeDnEbitdaState({ net_debt: 100, ebitda: Infinity }, null))
      .toEqual({ kind: 'empty' });
  });
});
