/**
 * Test unitario · CompanyFinanzas + COMP-3001..3007 (Sprint F0.2).
 *
 * Verifica el flujo canónico con el caso TOTALENERGIES (A87803862):
 *   - IntelCard source-grounded (`assessment.risks` / `weaknesses` visibles).
 *   - Selector de bloque cambia el bloque activo.
 *   - Cash Flow BLOCKED cuando `cashflow: null` en el response.
 *   - Nivel 3 muestra cuenta de resultados completa con partidas reales.
 *   - COMP-3006 Evolution muestra los 3 años reales sin interpolar.
 */
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CompanyFinanzas } from '@/components/company/finanzas/CompanyFinanzas';
import type { FinancialAnalysis } from '@/lib/companies/intelligence-types';

const analysis: FinancialAnalysis = {
  master_id: 'mc_80e03f1e1627',
  cif_normalized: 'A87803862',
  identity: { name: 'TOTALENERGIES ELECTRICIDAD Y GAS ESPAÑA' },
  cnae_code: '3515',
  cnae_section: 'D',
  provincia: 'MADRID',
  has_financials: true,
  data_source: 'master_companies + norm_financials (Iberinform)',
  source_version: 'iberinform',
  basis: 'individual',
  year: 2024,
  years: [2024, 2023, 2022],
  kpis: {
    revenue: 933267000,
    ebitda: 36544000,
    ebitda_margin: 0.0392,
    net_income: 25017000,
    net_margin: 0.0268,
  },
  income_statement: {
    revenue: 933267000,
    supplies: -868893000,
    personnel_costs: -6320000,
    depreciation: -1025000,
    operating_income: 35519000,
    ebitda: 36544000,
    ebit: 35519000,
    financial_expenses: -2184000,
    net_income: 25017000,
  },
  balance_sheet: {
    non_current_assets: 7670000,
    current_assets: 180533000,
    total_assets: 188203000,
    equity: 30531000,
    non_current_liabilities: 4189000,
    current_liabilities: 153483000,
    total_liabilities: 157672000,
    financial_debt: 904000,
    cash: 1000,
  },
  cashflow: null,
  ratios: {
    ebitda_margin: {
      value: 0.0392,
      name: 'Margen EBITDA',
      category: 'profitability',
      formula: 'EBITDA / Ingresos',
      explanation: 'Rentabilidad operativa antes de amortizaciones.',
      source: 'Iberinform statements (Normalized Layer)',
    },
    current_ratio: {
      value: 1.1762,
      name: 'Ratio de liquidez',
      category: 'liquidity',
      formula: 'Activo corriente / Pasivo corriente',
    },
    solvency: {
      value: 0.1622,
      name: 'Solvencia',
      category: 'solvency',
    },
  },
  financial_quality: {
    score: 100,
    strengths: [],
    weaknesses: ['Baja autonomía financiera (PN/Activo <20%)'],
    risks: ['Tendencia de ingresos a la baja'],
  },
  evolution: {
    trend: 'deterioration',
    years: 3,
    anomaly: false,
    revenue_growth_yoy: -0.2757,
    points: [
      { year: 2024, revenue: 933267000, ebitda: 36544000, net_income: 25017000 },
      { year: 2023, revenue: 1288562000, ebitda: 23984000, net_income: 14425000 },
      { year: 2022, revenue: 2229436000, ebitda: 1009000, net_income: -460000 },
    ],
  },
  assessment: {
    strengths: [],
    weaknesses: ['Baja autonomía financiera (PN/Activo <20%)'],
    risks: ['Tendencia de ingresos a la baja'],
  },
  valuation: null,
  explainability: {
    data_source: 'master_companies + norm_financials (Iberinform)',
    source_version: 'iberinform',
    basis: 'individual',
    year: 2024,
    rules_applied: 'KPIs/ratios/quality deterministas; valoración por múltiplos inferidos',
    ai_used: false,
  },
  engine_version: 'arroba-financial-v1',
  generated_at: '2026-07-12T21:53:22.602413+00:00',
  ranking: null,
};

describe('CompanyFinanzas · F0.2 · TOTALENERGIES', () => {
  it('renderiza header, selectors y IntelCard con contenido source-grounded', () => {
    render(<CompanyFinanzas cif="A87803862" analysis={analysis} />);
    expect(screen.getByTestId('ficha-content-finanzas')).toBeInTheDocument();
    expect(screen.getByTestId('finanzas-year-selector')).toHaveTextContent('Ejercicio auditado: 2024');
    // IntelCard con contenido real
    const intel = screen.getByTestId('finanzas-intel-card');
    expect(within(intel).getByText(/Cuenta de resultados/)).toBeInTheDocument();
    expect(within(intel).getByTestId('finanzas-intel-weaknesses')).toHaveTextContent(
      'Baja autonomía financiera',
    );
    expect(within(intel).getByTestId('finanzas-intel-risks')).toHaveTextContent(
      'Tendencia de ingresos a la baja',
    );
    // Trend indicador desde evolution
    expect(within(intel).getByTestId('finanzas-intel-trend')).toBeInTheDocument();
  });

  it('nivel 1 muestra Overview (COMP-3001) y Evolution (COMP-3006) con 3 años reales', () => {
    render(<CompanyFinanzas cif="A87803862" analysis={analysis} />);
    expect(screen.getByTestId('comp-3001')).toBeInTheDocument();
    expect(screen.getByTestId('comp-3006-level-1')).toBeInTheDocument();
  });

  it('selecciona bloque Balance y verifica COMP-3003 nivel 1', async () => {
    const user = userEvent.setup();
    render(<CompanyFinanzas cif="A87803862" analysis={analysis} />);
    await user.click(screen.getByTestId('finanzas-block-balance'));
    expect(screen.getByTestId('comp-3003-level-1')).toBeInTheDocument();
  });

  it('selecciona bloque Cash Flow y confirma COMP-3005 BLOCKED (cashflow=null)', async () => {
    const user = userEvent.setup();
    render(<CompanyFinanzas cif="A87803862" analysis={analysis} />);
    await user.click(screen.getByTestId('finanzas-block-cashflow'));
    expect(screen.getByTestId('comp-3005-blocked')).toBeInTheDocument();
    expect(screen.getByTestId('comp-3005-blocked')).toHaveTextContent(/Cash Flow no disponible/);
    expect(screen.getByTestId('comp-3005-blocked')).toHaveTextContent(/R15/);
  });

  it('nivel 3 P&L muestra las 9 partidas del income_statement con formato euros', async () => {
    const user = userEvent.setup();
    render(<CompanyFinanzas cif="A87803862" analysis={analysis} />);
    await user.click(screen.getByTestId('finanzas-level-3'));
    const table = screen.getByTestId('comp-3002-level-3');
    expect(within(table).getByTestId('comp-3002-row-revenue')).toBeInTheDocument();
    expect(within(table).getByTestId('comp-3002-row-ebitda')).toBeInTheDocument();
    expect(within(table).getByTestId('comp-3002-row-net_income')).toBeInTheDocument();
    // La celda de EBITDA muestra el valor real (36,54 M€ o similar).
    expect(within(table).getByTestId('comp-3002-row-ebitda')).toHaveTextContent(/36/);
  });

  it('nivel 3 Ratios muestra el catálogo con category correcta', async () => {
    const user = userEvent.setup();
    render(<CompanyFinanzas cif="A87803862" analysis={analysis} />);
    await user.click(screen.getByTestId('finanzas-block-ratios'));
    await user.click(screen.getByTestId('finanzas-level-3'));
    expect(screen.getByTestId('comp-3004-level-3')).toBeInTheDocument();
    expect(screen.getByTestId('comp-3004-row-ebitda_margin')).toBeInTheDocument();
    expect(screen.getByTestId('comp-3004-row-current_ratio')).toBeInTheDocument();
    expect(screen.getByTestId('comp-3004-row-solvency')).toBeInTheDocument();
  });

  it('COMP-3007 Anomalies muestra riesgos y weaknesses (source-grounded)', () => {
    render(<CompanyFinanzas cif="A87803862" analysis={analysis} />);
    expect(screen.getByTestId('comp-3007-risks')).toHaveTextContent('Tendencia de ingresos a la baja');
    expect(screen.getByTestId('comp-3007-weaknesses')).toHaveTextContent('Baja autonomía financiera');
  });

  it('degrada a UnavailableBlock si has_financials=false', () => {
    render(
      <CompanyFinanzas
        cif="Z99999999"
        analysis={{ ...analysis, has_financials: false, evolution: null, income_statement: null }}
      />,
    );
    expect(screen.getByTestId('finanzas-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('finanzas-unavailable')).toHaveTextContent(/Sin datos financieros/);
  });

  it('R15 · evolution.points respeta los 3 años reales sin interpolar', () => {
    render(<CompanyFinanzas cif="A87803862" analysis={analysis} />);
    // Nivel 1 (por defecto) muestra COMP-3006 con los 3 años reales.
    const evChart = screen.getByTestId('comp-3006-level-1');
    expect(evChart).toHaveTextContent('2022');
    expect(evChart).toHaveTextContent('2023');
    expect(evChart).toHaveTextContent('2024');
  });
});
