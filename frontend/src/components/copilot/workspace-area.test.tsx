/**
 * Tests for the WorkspaceArea renderer. Verifies that each BlockSpec.type
 * picks the right primitive component (switch correctness).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkspaceArea } from './WorkspaceArea';
import type { Workspace } from '@/lib/orchestrator';

// Mock the Copilot context — only `send`, `retry` and `lastQuery` are needed.
vi.mock('./CopilotProvider', async () => {
  const actual: typeof import('./CopilotProvider') = await vi.importActual('./CopilotProvider');
  return {
    ...actual,
    useCopilot: () => ({
      send: vi.fn(),
      retry: vi.fn(),
      lastQuery: 'kitchen',
      open: false,
      history: [],
      workspace: null,
      loading: false,
    }),
  };
});

function ws(blocks: Workspace['blocks']): Workspace {
  return { workspace_id: 'wsp_t', intent: 'search', blocks };
}

describe('<WorkspaceArea>', () => {
  it('renders SearchResultsBlock for type=search_results', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'search_results',
            id: 'b1',
            props: {
              query: 'kitchen',
              total: 2,
              results: [
                { master_company_id: 'mc1', name: 'Kitchen Studio', sector: 'Tech', cif: 'B1', score: 0.9 },
                { master_company_id: 'mc2', name: 'Quickads', sector: 'Tech', cif: 'B2', score: 0.7 },
              ],
            },
          },
        ])}
      />
    );
    expect(screen.getByTestId('block-search-results')).toBeInTheDocument();
    expect(screen.getByText(/2 resultados para «kitchen»/i)).toBeInTheDocument();
    expect(screen.getByTestId('block-search-results-row-mc1')).toBeInTheDocument();
    expect(screen.getByTestId('block-search-results-row-mc2')).toBeInTheDocument();
  });

  it('renders empty state for type=empty_state and exposes suggestions', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'empty_state',
            id: 'b1',
            props: {
              title: 'Sin resultados',
              description: 'Prueba otro término',
              suggestions: ['Madrid', 'Barcelona'],
            },
          },
        ])}
      />
    );
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByText('Prueba otro término')).toBeInTheDocument();
    expect(screen.getByTestId('copilot-workspace-empty-suggestion-0')).toHaveTextContent('Madrid');
    expect(screen.getByTestId('copilot-workspace-empty-suggestion-1')).toHaveTextContent('Barcelona');
  });

  it('renders ErrorBlock for type=error', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'error',
            id: 'b1',
            props: {
              title: 'Falló',
              message: 'Algo salió mal',
              retry_intent: 'search',
            },
          },
        ])}
      />
    );
    expect(screen.getByTestId('block-error')).toBeInTheDocument();
    expect(screen.getByText('Falló')).toBeInTheDocument();
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('renders LoadingBlock for type=loading', () => {
    render(
      <WorkspaceArea
        workspace={ws([{ type: 'loading', id: 'b1', props: {} }])}
      />
    );
    expect(screen.getByTestId('block-loading')).toBeInTheDocument();
  });

describe('<WorkspaceArea> — E1.4 blocks', () => {
  it('renders HeroBlock for type=hero', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'hero',
            id: 'h1',
            props: {
              eyebrow: 'Análisis',
              title: 'Kitchen Studio, S.L.',
              subtitle: 'Software · Madrid',
              tone: 'info',
            },
          },
        ])}
      />,
    );
    expect(screen.getByTestId('block-hero-h1')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Studio, S.L.')).toBeInTheDocument();
    expect(screen.getByText('Software · Madrid')).toBeInTheDocument();
  });

  it('renders MetricsBlock for type=metrics', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'metrics',
            id: 'm1',
            props: {
              title: 'KPIs',
              items: [
                { label: 'Ingresos', value: '5.4M €' },
                { label: 'EBITDA', value: '1.1M €' },
              ],
            },
          },
        ])}
      />,
    );
    expect(screen.getByTestId('block-metrics-m1')).toBeInTheDocument();
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('5.4M €')).toBeInTheDocument();
  });

  it('renders CompanyCardBlock for type=company_card', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'company_card',
            id: 'c1',
            props: {
              master_company_id: 'mc_kitchen',
              name: 'Kitchen Studio',
              legal_name: 'Kitchen Studio, S.L.',
              cif: 'B86540112',
              sector: 'Software',
              region: 'Madrid',
              country: 'ES',
              revenue: 5_400_000,
              ebitda: 1_100_000,
              employees: 32,
              fiscal_year: 2024,
              confidence: 0.9,
            },
          },
        ])}
      />,
    );
    expect(screen.getByTestId('block-company-card')).toBeInTheDocument();
    expect(screen.getByTestId('block-company-card-name')).toHaveTextContent(
      'Kitchen Studio, S.L.',
    );
    expect(screen.getByTestId('block-company-card-revenue')).toHaveTextContent('5.4M €');
  });

  it('renders ValuationBlock for type=valuation', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'valuation',
            id: 'v1',
            props: {
              company_name: 'Kitchen Studio, S.L.',
              sector: 'Software',
              method: 'revenue_multiple',
              multiple_label: '1.5× ingresos',
              multiple_value: 1.5,
              central_value: 8_100_000,
              low_value: 6_075_000,
              high_value: 10_530_000,
              currency: 'EUR',
              inputs: [
                { label: 'Ingresos', value: '5.4M €' },
                { label: 'Factor', value: '1.5×' },
              ],
              disclaimer:
                'Valoración indicativa. No constituye recomendación profesional.',
            },
          },
        ])}
      />,
    );
    expect(screen.getByTestId('block-valuation')).toBeInTheDocument();
    expect(screen.getByTestId('block-valuation-company')).toHaveTextContent(
      'Kitchen Studio, S.L.',
    );
    expect(screen.getByTestId('block-valuation-central')).toHaveTextContent('8.1 M €');
    expect(screen.getByTestId('block-valuation-disclaimer')).toHaveTextContent(
      'indicativa',
    );
  });

  it('renders CompanyCardsGridBlock for type=company_cards_grid', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'company_cards_grid',
            id: 'g1',
            props: {
              title: null,
              subtype: 'similar_to_company',
              items: [
                {
                  master_company_id: 'mc_quickads',
                  name: 'Quickads Technologies',
                  sector: 'Software',
                  region: 'Barcelona',
                  score: 0.88,
                  reason: 'Mismo sector (Software)',
                },
                {
                  master_company_id: 'mc_novaledger',
                  name: 'NovaLedger SaaS',
                  sector: 'Software',
                  region: 'Madrid',
                  score: 0.82,
                  reason: 'Mismo sector (Software)',
                },
              ],
            },
          },
        ])}
      />,
    );
    expect(screen.getByTestId('block-company-cards-grid')).toBeInTheDocument();
    expect(
      screen.getByTestId('block-company-cards-grid-item-mc_quickads'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('block-company-cards-grid-item-mc_novaledger'),
    ).toBeInTheDocument();
  });

  it('renders NarrativeBlock for type=narrative', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'narrative',
            id: 'n1',
            props: {
              title: 'Lectura del analista',
              summary: 'Empresa sólida con margen alto.',
              key_points: ['Margen 20%', 'Plantilla 32'],
              risks: ['Concentración geográfica'],
              opportunities: ['Internacionalización'],
              citations: [],
            },
          },
        ])}
      />,
    );
    expect(screen.getByTestId('block-narrative')).toBeInTheDocument();
    expect(screen.getByTestId('block-narrative-summary')).toHaveTextContent(
      'margen alto',
    );
    expect(screen.getByTestId('block-narrative-key-points')).toBeInTheDocument();
    expect(screen.getByTestId('block-narrative-risks')).toBeInTheDocument();
    expect(screen.getByTestId('block-narrative-opportunities')).toBeInTheDocument();
  });

  it('ErrorBlock onRetry uses lastQuery from the provider', async () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'error',
            id: 'e1',
            props: {
              title: 'Fallo',
              message: 'msg',
              retry_intent: 'search',
            },
          },
        ])}
      />,
    );
    // The mocked provider exposes lastQuery='kitchen', so the retry button must render.
    expect(screen.getByTestId('block-error-retry')).toBeInTheDocument();
  });
});

});
