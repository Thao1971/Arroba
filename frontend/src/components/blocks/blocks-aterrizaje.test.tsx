/**
 * HARDENING-BETA-para-emergent · smoke tests de los 4 componentes aterrizados.
 *
 * Verifica que los 4 blocks compilan, montan sin errores y emiten sus
 * testids canónicos + al menos un texto/estructura característico. NO
 * cubre lógica de negocio (los blocks son presentacionales; el motor
 * Intel viene en HARDENING-038 como proxies canónicos).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  InvestmentCommitteeBlock,
  type CommitteeLens,
  type CommitteeResult,
} from './committee/InvestmentCommitteeBlock';
import { SingleExerciseChart } from './financial/SingleExerciseChart';
import {
  MarketReadingBlock,
  type MarketContextView,
} from './market/MarketReadingBlock';
import {
  OpportunityThesisBlock,
  type OpportunityThesisView,
} from './opportunity/OpportunityThesisBlock';

describe('HARDENING-BETA-para-emergent · Blocks aterrizaje aislado', () => {
  it('SingleExerciseChart · monta y muestra el año del ejercicio', () => {
    render(
      <SingleExerciseChart
        year={2024}
        revenue={12_450_000}
        ebitda={1_890_000}
        ebitdaMargin={0.152}
      />,
    );
    // El componente debe renderizar el año como parte del contenido.
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('MarketReadingBlock · monta y muestra la sección reading cuando hay prosa IA', () => {
    const mock: MarketContextView = {
      reading: 'Sector maduro con consolidación selectiva en los últimos 12 meses.',
      position: {
        headline: 'Líder territorial en su categoría',
        percentile: 78,
        sectorRank: '#5 de 62',
        territoryRank: '#1 de 12',
      },
      sector: { label: 'Agencias marketing', verdict: 'Sector maduro', dynamism: 54 },
      territory: { label: 'Bilbao', verdict: 'Plaza de primer nivel', dynamism: 72 },
      concentration: { label: 'Moderadamente concentrado', actors: 62, hhi: 1820 },
    };
    render(<MarketReadingBlock data={mock} />);
    expect(screen.getByTestId('market-reading')).toBeInTheDocument();
    expect(
      screen.getByText(/Sector maduro con consolidación selectiva/),
    ).toBeInTheDocument();
  });

  it('InvestmentCommitteeBlock · monta en idle y ofrece el switcher de lens + botón deliberar', () => {
    const stubRun = vi.fn<(cif: string, lens: CommitteeLens) => Promise<CommitteeResult>>();
    render(
      <InvestmentCommitteeBlock
        cif="B28184687"
        runCommittee={stubRun}
      />,
    );
    // Estado inicial: idle con el CTA y los switchers de lens visibles.
    expect(screen.getByTestId('committee-idle')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Ver deliberación del comité/i }),
    ).toBeInTheDocument();
    // La lente `neutral` (defaultLens) está renderizada como opción.
    expect(
      screen.getByRole('button', { name: /Diagnóstico neutral/i }),
    ).toBeInTheDocument();
    // El stub aún NO ha sido invocado (idle, ningún click).
    expect(stubRun).not.toHaveBeenCalled();
  });

  it('OpportunityThesisBlock · monta y muestra la tesis + el bloque cuando hay data', () => {
    const mock: OpportunityThesisView = {
      thesis: 'Perfil de operación mixto con señales de sucesión y potencial roll-up.',
      detected: [{ label: 'Sucesión probable en 24-36 meses', strength: 'alta' }],
      sell: { successionScore: 74, note: 'Fundadora >60', attractiveness: 'Alta' },
      buy: {
        viable: true,
        note: '4 targets identificados',
        targets: [{ name: 'AGENCIA NORTE', fit: 82 }],
      },
    };
    render(<OpportunityThesisBlock data={mock} />);
    expect(
      screen.getByText(/Perfil de operación mixto/),
    ).toBeInTheDocument();
  });

  it('OpportunityThesisBlock · monta el empty state cuando `data` no trae información', () => {
    render(<OpportunityThesisBlock data={{}} />);
    expect(screen.getByTestId('opportunity-thesis-empty')).toBeInTheDocument();
  });
});
