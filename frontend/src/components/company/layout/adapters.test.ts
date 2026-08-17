import { describe, it, expect } from 'vitest';
import { opportunityToThesisView, marketBlockToContextView } from './adapters';

const opp = {
  thesis: { narrative: 'Tesis de operación X.' },
  chips: [{ enum: 'succession_risk', label_es: 'Riesgo de sucesión' }],
};

describe('opportunityToThesisView · HARDENING-038b', () => {
  it('solo opportunity → thesis + detected, sell/buy undefined', () => {
    const v = opportunityToThesisView(opp);
    expect(v.thesis).toBe('Tesis de operación X.');
    expect(v.detected?.[0]?.label).toBe('Riesgo de sucesión');
    expect(v.sell).toBeUndefined();
    expect(v.buy).toBeUndefined();
  });

  it('+succession → sell poblado desde score/summary/attractiveness', () => {
    const v = opportunityToThesisView(opp, {
      score: 72,
      summary: 'Fundador >65, sin plan de relevo.',
      attractiveness: 'Alta',
    });
    expect(v.sell?.successionScore).toBe(72);
    expect(v.sell?.note).toContain('relevo');
    expect(v.sell?.attractiveness).toBe('Alta');
  });

  it('+rollup → buy.viable + targets solo con fit numérico', () => {
    const v = opportunityToThesisView(opp, null, {
      narrative: 'Sector fragmentado, plataforma viable.',
      targets: [
        { name: 'Target A', fit_score: 0.88 },
        { name: 'Sin fit' }, // se descarta (sin fit_score) — R15
      ],
    });
    expect(v.buy?.viable).toBe(true);
    expect(v.buy?.targets?.length).toBe(1);
    expect(v.buy?.targets?.[0]).toEqual({ name: 'Target A', fit: 0.88 });
  });

  it('degradación honesta: succession/rollup null → sell/buy undefined', () => {
    const v = opportunityToThesisView(opp, null, null);
    expect(v.sell).toBeUndefined();
    expect(v.buy).toBeUndefined();
  });

  it('rollup.viable explícito respeta el valor del motor', () => {
    const v = opportunityToThesisView(opp, null, { viable: false, targets: [] });
    expect(v.buy?.viable).toBe(false);
  });
});

describe('marketBlockToContextView · reading merge', () => {
  it('inyecta la lectura de mercado en prosa cuando se provee', () => {
    const v = marketBlockToContextView(null, 'Mercado en expansión moderada.');
    expect(v.reading).toBe('Mercado en expansión moderada.');
  });
  it('sin reading → undefined (R15, no fabricamos)', () => {
    const v = marketBlockToContextView(null);
    expect(v.reading).toBeUndefined();
  });
});
