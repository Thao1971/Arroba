/**
 * CompanyPageClient — E1.5-REWORK regression tests.
 *
 * Pins the philosophy v3.0 §12 invariants:
 *   - Anonymous: 3 public sections (resumen/identidad/financieros) + 5
 *     LockedSectionBlur teasers (score/comparables/valuation/narrative/actions).
 *   - Authenticated: all 8 sections rendered; no LockedSectionBlur.
 *   - When `CustomEvent("arroba:company-section-update")` fires with a
 *     `narrative` update, ONLY the narrative section re-renders.
 *   - Refresh button surfaces 429 cooldown.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';

import { COMPANY_SECTION_UPDATE_EVENT } from '../copilot/CopilotProvider';
import { CompanyPageClient } from './CompanyPageClient';
import type { CompanyDetailResponse } from '@/lib/companies/types';

vi.mock('next/navigation', () => ({
  usePathname: () => '/empresa/B86540112',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ cif: 'B86540112' }),
}));
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { user_id: 'u_1', email: 'buyer@arroba.com' },
    memberships: [{ org_id: 'org_demo' }],
    isAuthenticated: true,
    isLoading: false,
  }),
}));
vi.mock('@/lib/workspaces/useActiveOrg', () => ({
  useActiveOrg: () => ({
    activeOrgId: 'org_demo',
    setActiveOrgId: vi.fn(),
    availableOrgs: [{ org_id: 'org_demo' }],
  }),
}));

// Wraps the component inside the CopilotProvider since CompanyPageClient
// calls useCopilot() — but here we only need the consumer behaviour.
vi.mock('../copilot/CopilotProvider', async () => {
  const actual = await vi.importActual<
    typeof import('../copilot/CopilotProvider')
  >('../copilot/CopilotProvider');
  return {
    ...actual,
    useCopilot: () => ({
      open: false,
      loading: false,
      history: [],
      workspace: null,
      lastQuery: null,
      currentWorkspaceId: null,
      currentEntity: { type: 'company', cif: 'B86540112', name: 'Kitchen Studio' },
      toggle: vi.fn(),
      openDock: vi.fn(),
      closeDock: vi.fn(),
      send: vi.fn(),
      retry: vi.fn(),
      clear: vi.fn(),
      promoteToWorkspace: vi.fn(),
      hydratePersistent: vi.fn(),
      hydrateEntityConversation: vi.fn(),
      dispatch: vi.fn(),
    }),
    COMPANY_SECTION_UPDATE_EVENT: 'arroba:company-section-update',
  };
});

const messages = {
  entity: {
    lock: {
      title: 'Disponible al crear cuenta',
      description: 'Crea tu cuenta para acceder.',
      register: 'Crear cuenta',
      login: 'Iniciar sesión',
    },
  },
  nav: {
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
  },
};

function withIntl(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

function makeNarrativeBlock(summary: string) {
  return {
    id: 'blk_narr_' + Math.random().toString(36).slice(2, 8),
    type: 'narrative' as const,
    props: {
      title: 'Lectura del analista',
      summary,
      key_points: [],
      risks: [],
      opportunities: [],
      citations: [],
    },
  };
}

function authedFixture(): CompanyDetailResponse {
  return {
    header: {
      name: 'Kitchen Studio, S.L.',
      cif: 'B86540112',
      sector: 'Software',
      region: 'Madrid',
      country: 'ES',
      initials: 'KS',
      score: 92,
    },
    sections: {
      hero: {
        id: 'blk_hero',
        type: 'hero',
        props: { eyebrow: 'Análisis', title: 'Kitchen Studio, S.L.', tone: 'info' },
      },
      kpi_metrics: {
        id: 'blk_kpi',
        type: 'metrics',
        props: { title: 'Resumen', items: [{ label: 'Ingresos', value: '2,4M €' }] },
      },
      identity: {
        master_company_id: 'mc_kitchen',
        cif: 'B86540112',
        legal_name: 'Kitchen Studio, S.L.',
        sector: 'Software',
        region: 'Madrid',
        country: 'ES',
        founded_year: 2019,
        employees: 32,
      },
      financials_metrics: {
        id: 'blk_fin',
        type: 'metrics',
        props: { title: 'Financieros', items: [{ label: 'EBITDA', value: '480k €' }] },
      },
      score_block: {
        id: 'blk_score',
        type: 'hero',
        props: { eyebrow: 'Score', title: 'Score 92', tone: 'info' },
      },
      comparables: {
        id: 'blk_comp',
        type: 'company_cards_grid',
        props: {
          title: null,
          subtype: 'similar_to_company',
          items: [
            {
              master_company_id: 'mc_x',
              name: 'NovaLedger SaaS',
              sector: 'Software',
              region: 'Barcelona',
              score: 0.82,
              reason: 'Mismo sector',
            },
          ],
        },
      },
      valuation: {
        id: 'blk_val',
        type: 'valuation',
        props: {
          company_name: 'Kitchen Studio, S.L.',
          sector: 'Software',
          method: 'revenue_multiple',
          multiple_label: '1.5× ingresos',
          multiple_value: 1.5,
          central_value: 3_600_000,
          low_value: 2_700_000,
          high_value: 4_680_000,
          currency: 'EUR',
          inputs: [{ label: 'Ingresos', value: '2,4M €' }],
          disclaimer: 'Valoración indicativa.',
        },
      },
      narrative: makeNarrativeBlock('Resumen inicial de la empresa.'),
    },
    locked_sections: [],
    in_watchlist: false,
    watchlist_visibility: null,
    conversation_id: 'conv_1',
    source: 'mock',
  };
}

function anonymousFixture(): CompanyDetailResponse {
  const authed = authedFixture();
  return {
    ...authed,
    sections: {
      ...authed.sections,
      score_block: null,
      comparables: null,
      valuation: null,
      narrative: null,
    },
    locked_sections: ['score', 'comparables', 'valuation', 'narrative', 'actions'],
    conversation_id: null,
  };
}

beforeEach(() => {
  global.fetch = vi.fn();
});

describe('CompanyPageClient — anonymous', () => {
  it('renders the 3 public sections and 5 LockedSectionBlur teasers', () => {
    render(
      withIntl(
        <CompanyPageClient cif="B86540112" initial={anonymousFixture()} authenticated={false} />,
      ),
    );
    // Public sections present
    expect(screen.getByTestId('entity-section-resumen')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-identidad')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-financieros')).toBeInTheDocument();
    // 5 locked teasers (score, comparables, valuation, narrative, actions)
    expect(screen.getByTestId('company-score-locked')).toBeInTheDocument();
    expect(screen.getByTestId('company-comparables-locked')).toBeInTheDocument();
    expect(screen.getByTestId('company-valuation-locked')).toBeInTheDocument();
    expect(screen.getByTestId('company-narrative-locked')).toBeInTheDocument();
    expect(screen.getByTestId('company-actions-locked')).toBeInTheDocument();
    // Refresh button absent for anonymous
    expect(screen.queryByTestId('company-refresh-analysis')).not.toBeInTheDocument();
  });
});

describe('CompanyPageClient — authenticated', () => {
  it('renders all 8 sections with no LockedSectionBlur', () => {
    render(
      withIntl(
        <CompanyPageClient cif="B86540112" initial={authedFixture()} authenticated={true} />,
      ),
    );
    expect(screen.getByTestId('entity-section-resumen')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-identidad')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-financieros')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-score')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-comparables')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-valoracion')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-analisis')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-acciones')).toBeInTheDocument();
    expect(screen.queryByTestId('company-narrative-locked')).not.toBeInTheDocument();
    expect(screen.getByTestId('company-refresh-analysis')).toBeInTheDocument();
    expect(screen.getByTestId('company-next-best-actions')).toBeInTheDocument();
  });

  it('updates the narrative section in-place when CustomEvent fires', async () => {
    render(
      withIntl(
        <CompanyPageClient cif="B86540112" initial={authedFixture()} authenticated={true} />,
      ),
    );

    // Initial narrative shows the initial summary.
    expect(
      screen.getByText('Resumen inicial de la empresa.'),
    ).toBeInTheDocument();

    // Dispatch the CustomEvent the CopilotProvider would emit.
    const newBlock = makeNarrativeBlock(
      'Riesgos: dependencia de talento clave; concentración geográfica en Madrid.',
    );
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(COMPANY_SECTION_UPDATE_EVENT, {
          detail: {
            cif: 'B86540112',
            section_updates: [{ section: 'narrative', block: newBlock }],
          },
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          /Riesgos: dependencia de talento clave; concentración geográfica/,
        ),
      ).toBeInTheDocument();
    });
    // Other sections should NOT be affected (header still shows the name).
    expect(screen.getByTestId('company-header-name')).toHaveTextContent(
      'Kitchen Studio, S.L.',
    );
    expect(screen.getAllByText(/2,4M €/).length).toBeGreaterThan(0);
  });

  it('ignores CustomEvents for a different cif', async () => {
    render(
      withIntl(
        <CompanyPageClient cif="B86540112" initial={authedFixture()} authenticated={true} />,
      ),
    );
    const block = makeNarrativeBlock('SHOULD_NOT_RENDER');
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(COMPANY_SECTION_UPDATE_EVENT, {
          detail: {
            cif: 'B99999999',
            section_updates: [{ section: 'narrative', block }],
          },
        }),
      );
    });
    expect(screen.queryByText('SHOULD_NOT_RENDER')).not.toBeInTheDocument();
    expect(
      screen.getByText('Resumen inicial de la empresa.'),
    ).toBeInTheDocument();
  });

  it('refresh analysis 429 — shows cooldown countdown in the button label', async () => {
    const user = userEvent.setup();
    // fetch mock returns 429 with a Retry-After detail. We need
    // mockImplementation (not mockResolvedValue) so the FIRST call
    // (hydrateEntityConversation's GET /conversation) gets a benign empty
    // response and the SECOND call (refreshAnalysis POST) gets the 429.
    let call = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      call += 1;
      if (typeof url === 'string' && url.includes('/skills/analyze')) {
        return new Response(
          JSON.stringify({
            detail: 'rate_limited; retry in 42s',
            code: 'rate_limited',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } },
        );
      }
      // Fallback: empty conversation.
      return new Response(
        JSON.stringify({
          conversation_id: 'conv_1',
          master_company_id: 'mc_kitchen',
          messages: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    render(
      withIntl(
        <CompanyPageClient cif="B86540112" initial={authedFixture()} authenticated={true} />,
      ),
    );
    const btn = screen.getByTestId('company-refresh-analysis');
    await user.click(btn);
    await waitFor(
      () => {
        expect(btn).toHaveTextContent(/Espera 42s/);
      },
      { timeout: 3000 },
    );
    expect(btn).toBeDisabled();
    expect(call).toBeGreaterThan(0);
  });

  it('refresh analysis success — locks button client-side for 60s (optimistic cooldown)', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.includes('/skills/analyze')) {
        return new Response(
          JSON.stringify({
            block: {
              id: 'blk_new_narr',
              type: 'narrative',
              props: {
                title: 'Lectura del analista',
                summary: 'Nueva narrativa refrescada.',
                key_points: [],
                risks: [],
                opportunities: [],
                citations: [],
              },
            },
            generated_at: new Date().toISOString(),
            source: 'real',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          conversation_id: 'conv_1',
          master_company_id: 'mc_kitchen',
          messages: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    render(
      withIntl(
        <CompanyPageClient cif="B86540112" initial={authedFixture()} authenticated={true} />,
      ),
    );
    const btn = screen.getByTestId('company-refresh-analysis');
    await user.click(btn);
    // After a successful refresh, the button must lock for 60s.
    await waitFor(
      () => {
        expect(btn).toHaveTextContent(/Espera 60s/);
      },
      { timeout: 3000 },
    );
    expect(btn).toBeDisabled();
    // And the narrative content updated.
    expect(
      screen.getByText('Nueva narrativa refrescada.'),
    ).toBeInTheDocument();
  });
});
