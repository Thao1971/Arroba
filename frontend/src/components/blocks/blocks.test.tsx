/**
 * Tests for the v0 Block Library blocks. The goal is not visual perfection
 * (Vitest/jsdom can't render real CSS) but contract integrity:
 *   - blocks render the right text/structure
 *   - data-testid hooks are present so e1_tester can drive flows
 *   - MetricsBlock in 'data' mode supports loading / unavailable (404) /
 *     error / success states through SWR + a mocked fetch.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import {
  HeroBlock,
  CTABlock,
  FeatureCardBlock,
  EmptyStateBlock,
  MetricsBlock,
  type Metric,
} from './index';
import { LineChart } from 'lucide-react';

// Wrap rendered tree in a no-cache SWR provider so each test starts fresh.
function renderWithSWR(ui: React.ReactNode) {
  return render(<SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>);
}

describe('HeroBlock', () => {
  it('renders default variant with title and actions', () => {
    render(<HeroBlock title="Hello" actions={<a href="/x">Go</a>} testId="b-hero" />);
    expect(screen.getByTestId('b-hero')).toHaveAttribute('data-variant', 'default');
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
  });

  it('renders banner variant with eyebrow and dark tone', () => {
    render(
      <HeroBlock variant="banner" tone="dark" eyebrow="EYE" title="T" testId="b-hero" />
    );
    const el = screen.getByTestId('b-hero');
    expect(el).toHaveAttribute('data-variant', 'banner');
    expect(screen.getByText('EYE')).toBeInTheDocument();
  });
});

describe('CTABlock', () => {
  it('renders title, body and primary + secondary actions with testIds', () => {
    render(
      <CTABlock
        title="Convert"
        body="Now"
        actions={[
          { label: 'Primary', href: '/p', variant: 'primary', testId: 'cta-prim' },
          { label: 'Secondary', href: '/s', variant: 'secondary', testId: 'cta-sec' },
        ]}
        testId="b-cta"
      />
    );
    expect(screen.getByTestId('b-cta')).toBeInTheDocument();
    expect(screen.getByTestId('cta-prim')).toHaveAttribute('href', '/p');
    expect(screen.getByTestId('cta-sec')).toHaveAttribute('href', '/s');
  });
});

describe('FeatureCardBlock', () => {
  it('renders rank, title, description and bullets', () => {
    render(
      <FeatureCardBlock
        rank="01"
        icon={LineChart}
        title="Analizar"
        description="Cruza capas"
        bullets={['B1', 'B2']}
        testId="b-fc"
      />
    );
    const card = screen.getByTestId('b-fc');
    expect(card).toHaveAttribute('data-tone', 'default');
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('Analizar')).toBeInTheDocument();
    expect(screen.getByText('Cruza capas')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText('B2')).toBeInTheDocument();
  });
});

describe('EmptyStateBlock', () => {
  it('renders the icon, title and description', () => {
    render(
      <EmptyStateBlock
        title="Sin datos"
        description="Próximamente"
        testId="b-empty"
      />
    );
    expect(screen.getByTestId('b-empty')).toBeInTheDocument();
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });
});

describe('MetricsBlock — configurable mode', () => {
  it('renders all the metric tiles passed via props', () => {
    const metrics: Metric[] = [
      { id: 'a', label: 'A', value: '1' },
      { id: 'b', label: 'B', value: '2' },
    ];
    render(<MetricsBlock mode="configurable" metrics={metrics} testId="b-m" />);
    expect(screen.getByTestId('block-metrics-tile-a')).toBeInTheDocument();
    expect(screen.getByTestId('block-metrics-tile-b')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders an empty state when no metrics are passed', () => {
    render(<MetricsBlock mode="configurable" metrics={[]} testId="b-m" />);
    expect(screen.getByTestId('b-m-empty')).toBeInTheDocument();
  });
});

describe('MetricsBlock — data mode (SWR)', () => {
  const realFetch = global.fetch;
  beforeEach(() => {
    global.fetch = realFetch;
  });

  it('shows skeleton loading then renders fetched stats', async () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(
                  JSON.stringify({
                    companies_analyzed: 24992,
                    active_opportunities: 672190,
                    market_movements: 28458,
                    signals_detected: 6159,
                    last_updated: '2026-06-24T09:00:00Z',
                    confidence: 1.0,
                    lineage: 'raw',
                    valid_until: null,
                    source: 'mock',
                    provenance: 'demo',
                  }),
                  { status: 200, headers: { 'Content-Type': 'application/json' } }
                )
              ),
            10
          )
        )
    ) as unknown as typeof fetch;

    renderWithSWR(<MetricsBlock mode="data" testId="b-m" />);
    expect(screen.getByTestId('b-m-loading')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('block-metrics-tile-companies-analyzed')).toBeInTheDocument();
    });
  });

  it('shows the unavailable state on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'not seeded', code: 'platform_stats_not_seeded' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    ) as unknown as typeof fetch;
    renderWithSWR(<MetricsBlock mode="data" testId="b-m" />);
    await waitFor(() => {
      expect(screen.getByTestId('b-m-unavailable')).toBeInTheDocument();
    });
  });

  it('shows the error state with retry on 500', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'oh no', code: 'http_500' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    ) as unknown as typeof fetch;
    renderWithSWR(<MetricsBlock mode="data" testId="b-m" />);
    await waitFor(() => {
      expect(screen.getByTestId('b-m-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('b-m-retry')).toBeInTheDocument();
  });
});


// ---------------------------------------------------------------------------
// E1.4 — Intelligence Skills blocks
// ---------------------------------------------------------------------------
import {
  ValuationBlock,
  NarrativeBlock,
  CompanyCardBlock,
  CompanyCardsGridBlock,
} from './index';

describe('ValuationBlock', () => {
  it('renders central value, range chips and disclaimer', () => {
    render(
      <ValuationBlock
        companyName="Kitchen Studio, S.L."
        sector="Software"
        method="revenue_multiple"
        multipleLabel="1.5× ingresos"
        multipleValue={1.5}
        centralValue={8_100_000}
        lowValue={6_075_000}
        highValue={10_530_000}
        currency="EUR"
        inputs={[
          { label: 'Ingresos', value: '5.4M €' },
          { label: 'Factor', value: '1.5×' },
        ]}
        disclaimer="Valoración indicativa. No constituye recomendación profesional."
      />,
    );
    expect(screen.getByTestId('block-valuation')).toBeInTheDocument();
    expect(screen.getByTestId('block-valuation-multiple')).toHaveTextContent(
      '1.5× ingresos',
    );
    expect(screen.getByTestId('block-valuation-central')).toHaveTextContent('8.1 M €');
    expect(screen.getByTestId('block-valuation-low')).toHaveTextContent('6.1 M €');
    expect(screen.getByTestId('block-valuation-high')).toHaveTextContent('10.5 M €');
    expect(screen.getByTestId('block-valuation-disclaimer')).toHaveTextContent(
      'indicativa',
    );
  });
});

describe('NarrativeBlock', () => {
  it('renders only the populated sections', () => {
    render(
      <NarrativeBlock
        summary="Empresa sólida."
        keyPoints={['Margen 20%']}
        risks={[]}
        opportunities={['Cross-selling']}
        citations={[]}
      />,
    );
    expect(screen.getByTestId('block-narrative-summary')).toBeInTheDocument();
    expect(screen.getByTestId('block-narrative-key-points')).toBeInTheDocument();
    expect(screen.queryByTestId('block-narrative-risks')).not.toBeInTheDocument();
    expect(screen.getByTestId('block-narrative-opportunities')).toBeInTheDocument();
    expect(screen.queryByTestId('block-narrative-citations')).not.toBeInTheDocument();
  });
});

describe('CompanyCardBlock', () => {
  it('renders all canonical fields when provided', () => {
    render(
      <CompanyCardBlock
        masterCompanyId="mc_kitchen"
        name="Kitchen Studio"
        legalName="Kitchen Studio, S.L."
        cif="B86540112"
        sector="Software"
        region="Madrid"
        country="ES"
        revenue={5_400_000}
        ebitda={1_100_000}
        employees={32}
        fiscalYear={2024}
        confidence={0.9}
      />,
    );
    expect(screen.getByTestId('block-company-card')).toBeInTheDocument();
    expect(screen.getByTestId('block-company-card-name')).toHaveTextContent(
      'Kitchen Studio, S.L.',
    );
    expect(screen.getByTestId('block-company-card-revenue')).toHaveTextContent('5.4M €');
    expect(screen.getByTestId('block-company-card-ebitda')).toHaveTextContent('1.1M €');
    expect(screen.getByTestId('block-company-card-employees')).toHaveTextContent('32');
    expect(screen.getByTestId('block-company-card-fiscal')).toHaveTextContent('2024');
    expect(screen.getByTestId('block-company-card-confidence')).toHaveTextContent('90%');
  });

  it('handles missing fields gracefully', () => {
    render(<CompanyCardBlock masterCompanyId="mc_x" name="Empty Co" />);
    expect(screen.getByTestId('block-company-card-revenue')).toHaveTextContent('—');
    expect(screen.getByTestId('block-company-card-employees')).toHaveTextContent('—');
  });
});

describe('CompanyCardsGridBlock', () => {
  it('renders one card per item with the correct subtype eyebrow', () => {
    render(
      <CompanyCardsGridBlock
        subtype="opportunities_by_sector"
        items={[
          {
            masterCompanyId: 'mc_a',
            name: 'Company A',
            sector: 'Software',
            region: 'Madrid',
            score: 0.9,
            reason: 'r-a',
          },
          {
            masterCompanyId: 'mc_b',
            name: 'Company B',
            sector: 'Software',
            region: 'BCN',
            score: 0.65,
            reason: 'r-b',
          },
        ]}
      />,
    );
    expect(screen.getByTestId('block-company-cards-grid')).toHaveAttribute(
      'data-subtype',
      'opportunities_by_sector',
    );
    expect(screen.getByTestId('block-company-cards-grid-item-mc_a')).toBeInTheDocument();
    expect(screen.getByTestId('block-company-cards-grid-item-mc_b')).toBeInTheDocument();
    expect(screen.getByText('Oportunidades en el sector')).toBeInTheDocument();
  });
});
