import { describe, it, expect } from 'vitest';
import { opportunityToThesisView, marketBlockToContextView } from './adapters';

const opp = {
  thesis: { narrative: 'Tesis de operación X.' },
  chips: [{ enum: 'succession_risk', label_es: 'Riesgo de sucesión' }],
};

describe('opportunityToThesisView · HARDENING-038b (shapes reales Intel)', () => {
  it('solo opportunity → thesis + detected, sell/buy undefined', () => {
    const v = opportunityToThesisView(opp);
    expect(v.thesis).toBe('Tesis de operación X.');
    expect(v.detected?.[0]?.label).toBe('Riesgo de sucesión');
    expect(v.sell).toBeUndefined();
    expect(v.buy).toBeUndefined();
  });

  it('+succession (shape real: {profile:{succession_risk_score, reasons}}) → sell', () => {
    const v = opportunityToThesisView(opp, {
      master_id: 'mc_x',
      profile: {
        succession_risk_score: 72,
        reasons: ['administrador con 20 años de antigüedad', 'administrador único'],
      },
    });
    expect(v.sell?.successionScore).toBe(72);
    expect(v.sell?.note).toContain('antigüedad');
  });

  it('+rollup (shape real: rollup_viable + addon_targets_ranked[addon_score]) → buy', () => {
    const v = opportunityToThesisView(opp, null, {
      rollup_viable: true,
      viability_reasons: ['HHI=1200 (fragmentado)', '8 targets standalone'],
      addon_targets_ranked: [
        { name: 'Target A', addon_score: 0.88 },
        { addon_score: 0.5 }, // sin name → descartado (R15)
      ],
    });
    expect(v.buy?.viable).toBe(true);
    expect(v.buy?.note).toContain('HHI');
    expect(v.buy?.targets?.length).toBe(1);
    expect(v.buy?.targets?.[0]).toEqual({ name: 'Target A', fit: 0.88 });
  });

  it('rollup no viable explícito → buy.viable false', () => {
    const v = opportunityToThesisView(opp, null, {
      rollup_viable: false,
      viability_reasons: ['HHI alto: sector ya consolidado'],
      addon_targets_ranked: [],
    });
    expect(v.buy?.viable).toBe(false);
  });

  it('degradación honesta: succession/rollup null → sell/buy undefined', () => {
    const v = opportunityToThesisView(opp, null, null);
    expect(v.sell).toBeUndefined();
    expect(v.buy).toBeUndefined();
  });
});

describe('marketBlockToContextView · reading merge', () => {
  it('inyecta la lectura de mercado en prosa cuando se provee', () => {
    const v = marketBlockToContextView(null, 'Mercado en expansión moderada.');
    expect(v.reading).toBe('Mercado en expansión moderada.');
  });
  it('sin reading → undefined (R15)', () => {
    const v = marketBlockToContextView(null);
    expect(v.reading).toBeUndefined();
  });
});
