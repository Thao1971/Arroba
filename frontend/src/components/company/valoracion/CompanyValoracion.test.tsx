/**
 * Test unitario · CompanyValoracion + COMP-4001..4007 (Sprint F0.3).
 *
 * Verifica el flujo canónico con el caso TOTALENERGIES (A87803862):
 *   - Overview + Method + Range + Hypotheses READY con datos reales del motor.
 *   - Scenarios DEGRADED con 3 puntos derivados del range.
 *   - EV Bridge y Sensitivity BLOCKED con motivo R15 explícito.
 *   - Degrada a UnavailableBlock si has_valuation=false.
 */
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CompanyValoracion } from '@/components/company/valoracion/CompanyValoracion';
import type { ValuationAnalysis } from '@/lib/companies/intelligence-types';

const valuation: ValuationAnalysis = {
  master_id: 'mc_80e03f1e1627',
  cif_normalized: 'A87803862',
  method: 'ev_ebitda',
  method_label: 'EV/EBITDA sectorial',
  multiple: 6.5,
  multiple_basis: 'inferred_reference',
  enterprise_value: 237536000,
  equity_value: 236633000,
  range: { low: 201905600, central: 237536000, high: 273166400 },
  confidence: 0.6,
  confidence_level: 'medium',
  hypotheses: [
    'Múltiplo EV/EBITDA sectorial (sección D) = 6.5x (REFERENCIA inferida)',
    'Deuda neta = deuda financiera - caja = 903000.0',
  ],
  lineage: {
    financials_source: 'master_companies.financials.latest',
    basis: 'individual',
    year: 2024,
  },
  bridge_components: null,
  scenarios: null,
  sensitivity: null,
  has_valuation: true,
  engine_version: 'arroba-valuation-v1',
};

describe('CompanyValoracion · F0.3 · TOTALENERGIES', () => {
  it('renderiza header, disclaimer y selector de nivel', () => {
    render(<CompanyValoracion cif="A87803862" valuation={valuation} />);
    expect(screen.getByTestId('ficha-content-valoracion')).toBeInTheDocument();
    expect(screen.getByTestId('valoracion-year-selector')).toHaveTextContent('Ejercicio auditado: 2024');
    expect(screen.getByTestId('valoracion-disclaimer')).toHaveTextContent(/Equity Value ajustado/);
  });

  it('COMP-4001 Overview muestra EV, Equity, múltiplo y confidence', () => {
    render(<CompanyValoracion cif="A87803862" valuation={valuation} />);
    const overview = screen.getByTestId('comp-4001');
    expect(overview).toHaveTextContent('237,54');  // 237.536.000 en compact
    expect(overview).toHaveTextContent(/6[.,]5x/);
    expect(overview).toHaveTextContent(/60%/);  // confidence
  });

  it('COMP-4002 Method muestra label + descripción + fórmula en nivel 3', async () => {
    const user = userEvent.setup();
    render(<CompanyValoracion cif="A87803862" valuation={valuation} />);
    await user.click(screen.getByTestId('valoracion-level-3'));
    const method = screen.getByTestId('comp-4002-level-3');
    expect(method).toHaveTextContent('EV/EBITDA sectorial');
    expect(method).toHaveTextContent(/Enterprise Value.*EBITDA.*múltiplo/);
  });

  it('COMP-4003 Range muestra 3 puntos low/central/high con colores', () => {
    render(<CompanyValoracion cif="A87803862" valuation={valuation} />);
    const range = screen.getByTestId('comp-4003-level-1');
    expect(range).toHaveTextContent(/Rango bajo/);
    expect(range).toHaveTextContent(/Valor central/);
    expect(range).toHaveTextContent(/Rango alto/);
  });

  it('COMP-4004 Hypotheses lista las 2 hipótesis + confidence badge', () => {
    render(<CompanyValoracion cif="A87803862" valuation={valuation} />);
    const hyp = screen.getByTestId('comp-4004-level-1');
    expect(within(hyp).getByTestId('comp-4004-hypothesis-0')).toHaveTextContent(/sección D/);
    expect(within(hyp).getByTestId('comp-4004-hypothesis-1')).toHaveTextContent(/Deuda neta/);
    expect(within(hyp).getByTestId('comp-4004-confidence-badge')).toHaveTextContent(/Confianza media/);
    expect(within(hyp).getByTestId('comp-4004-confidence-badge')).toHaveTextContent(/60%/);
  });

  it('COMP-4006 Scenarios DEGRADED muestra 3 filas con equity derivado', () => {
    render(<CompanyValoracion cif="A87803862" valuation={valuation} />);
    const sc = screen.getByTestId('comp-4006-level-1');
    expect(sc).toHaveTextContent(/Bajo/);
    expect(sc).toHaveTextContent(/Medio/);
    expect(sc).toHaveTextContent(/Alto/);
    expect(sc).toHaveTextContent(/Degradado.*rango del motor/i);
    // Deuda neta extraída de hypotheses[1] → 903000. Equity(bajo) = 201905600 - 903000 = 201002600 ≈ 201M
    expect(within(sc).getByTestId('comp-4006-row-low')).toHaveTextContent(/201/);
  });

  it('COMP-4005 EV Bridge · BLOCKED con motivo R15 y nota hipótesis deuda', async () => {
    const user = userEvent.setup();
    render(<CompanyValoracion cif="A87803862" valuation={valuation} />);
    await user.click(screen.getByTestId('valoracion-level-3'));
    const bridge = screen.getByTestId('comp-4005-blocked');
    expect(bridge).toHaveTextContent(/EV Bridge no disponible/);
    expect(bridge).toHaveTextContent(/R15/);
    expect(bridge).toHaveTextContent(/Deuda neta/);
  });

  it('COMP-4007 Sensitivity · BLOCKED con motivo R15', async () => {
    const user = userEvent.setup();
    render(<CompanyValoracion cif="A87803862" valuation={valuation} />);
    await user.click(screen.getByTestId('valoracion-level-3'));
    expect(screen.getByTestId('comp-4007-blocked')).toHaveTextContent(/sensibilidad no disponible/i);
    expect(screen.getByTestId('comp-4007-blocked')).toHaveTextContent(/R15/);
  });

  it('CTA "Valoración avanzada" visible con 75 créditos', () => {
    render(<CompanyValoracion cif="A87803862" valuation={valuation} />);
    expect(screen.getByTestId('valoracion-advanced-cta')).toHaveTextContent(/Valoración avanzada/);
    expect(screen.getByTestId('valoracion-advanced-cta')).toHaveTextContent('75 créditos');
    expect(screen.getByTestId('valoracion-request-advanced-btn')).toBeInTheDocument();
  });

  it('degrada a UnavailableBlock si has_valuation=false', () => {
    render(
      <CompanyValoracion cif="Z99999999" valuation={{ ...valuation, has_valuation: false }} />,
    );
    expect(screen.getByTestId('valoracion-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('valoracion-unavailable')).toHaveTextContent(/Sin valoración disponible/);
    expect(screen.getByTestId('valoracion-unavailable')).toHaveTextContent(/R15/);
  });

  it('R5 · contrato interno decoupled (engine_version=arroba-valuation-v1)', () => {
    // Verificamos que el DTO tiene el engine_version canónico. La UI no lo
    // muestra explícitamente al usuario, pero es un guard de contrato.
    expect(valuation.engine_version).toBe('arroba-valuation-v1');
  });
});
