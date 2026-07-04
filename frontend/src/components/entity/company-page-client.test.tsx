/**
 * CompanyPageClient — regresión del refactor F6 (SPRINT 1).
 *
 * Ancla los contratos post-Entity Framework v1.0:
 *   - Anonymous: hero/kpis/insights ready + analisis/senales/relaciones/
 *     oportunidades/acciones locked + documentacion/actividad unavailable.
 *   - Authenticated: los 10 módulos canónicos del flujo se renderizan
 *     (algunos ready, `senales/documentacion/actividad` unavailable en
 *     Sprint 1). Sin `LockedSectionBlur`.
 *   - `CustomEvent("arroba:company-section-update")` con `narrative`
 *     refresca SOLO la sección `analisis` in-place.
 *   - Refresh 429 → cooldown visible en el botón.
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

// Copilot mock: el componente publica EntityContext y pide hidratar la
// conversación pero no depende del provider real en tests unitarios.
vi.mock('../copilot/CopilotProvider', async () => {
  const actual = await vi.importActual<
    typeof import('../copilot/CopilotProvider')
  >('../copilot/CopilotProvider');
  const publish = vi.fn();
  return {
    ...actual,
    useCopilot: () => ({
      open: false,
      loading: false,
      history: [],
      workspace: null,
      lastQuery: null,
      currentWorkspaceId: null,
      currentEntity: {
        entity_type: 'company',
        entity_id: 'B86540112',
        entity_name: 'Kitchen Studio, S.L.',
      },
      toggle: vi.fn(),
      openDock: vi.fn(),
      closeDock: vi.fn(),
      send: vi.fn(),
      retry: vi.fn(),
      clear: vi.fn(),
      promoteToWorkspace: vi.fn(),
      hydratePersistent: vi.fn(),
      hydrateEntityConversation: vi.fn(),
      setEntityContext: publish,
      clearEntityContext: vi.fn(),
      dispatch: vi.fn(),
    }),
    useEntityContext: () => ({
      context: {
        entity_type: 'company',
        entity_id: 'B86540112',
        entity_name: 'Kitchen Studio, S.L.',
      },
      publish,
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
      score_block: null,
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
    provenance: 'demo',
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

describe('CompanyPageClient — anonymous (F6 declarative)', () => {
  it('renderiza los 12 módulos canónicos: 5 públicos (header/hero/kpis/insights/advisor) + 5 locked + 2 unavailable', () => {
    render(
      withIntl(
        <CompanyPageClient
          cif="B86540112"
          initial={anonymousFixture()}
          authenticated={false}
        />,
      ),
    );

    // Módulos siempre presentes (ready) — header, hero, kpis, insights, advisor
    expect(screen.getByTestId('entity-section-header')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-hero')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-kpis')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-insights')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-advisor')).toBeInTheDocument();
    expect(screen.getByTestId('company-identity-card')).toBeInTheDocument();

    // Módulos locked — analisis, senales, relaciones, oportunidades, acciones
    expect(screen.getByTestId('entity-section-analisis-locked')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-senales-locked')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-relaciones-locked')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-oportunidades-locked')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-acciones-locked')).toBeInTheDocument();

    // Módulos unavailable — documentacion, actividad
    expect(screen.getByTestId('entity-section-documentacion')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-actividad')).toBeInTheDocument();

    // Refresh button ausente
    expect(screen.queryByTestId('company-refresh-analysis')).not.toBeInTheDocument();
  });
});

describe('CompanyPageClient — authenticated (F6 declarative)', () => {
  it('renderiza los 12 módulos: 9 ready + 3 unavailable (senales/documentacion/actividad)', () => {
    render(
      withIntl(
        <CompanyPageClient
          cif="B86540112"
          initial={authedFixture()}
          authenticated={true}
        />,
      ),
    );

    // Ready modules
    expect(screen.getByTestId('entity-section-header')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-hero')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-kpis')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-insights')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-analisis')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-relaciones')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-oportunidades')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-acciones')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-advisor')).toBeInTheDocument();

    // Unavailable modules — senales/documentacion/actividad
    expect(screen.getByTestId('entity-section-senales')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-documentacion')).toBeInTheDocument();
    expect(screen.getByTestId('entity-section-actividad')).toBeInTheDocument();

    // No locks para autenticados
    expect(screen.queryByTestId('entity-section-analisis-locked')).not.toBeInTheDocument();
    expect(screen.queryByTestId('entity-section-acciones-locked')).not.toBeInTheDocument();

    // Refresh button y acciones presentes
    expect(screen.getByTestId('company-refresh-analysis')).toBeInTheDocument();
    expect(screen.getByTestId('entity-actions')).toBeInTheDocument();
  });

  it('emite REQ canónicos declarativos (REQ-006/007/008 · Sprint 2) sin depender del CIF', () => {
    // Regla 3 · Sprint 1: los REQ/ETA de los módulos unavailable vienen del
    // registry `MODULE_DEFAULTS` (base/types.ts), no del payload por empresa.
    render(
      withIntl(
        <CompanyPageClient
          cif="B86540112"
          initial={authedFixture()}
          authenticated={true}
        />,
      ),
    );

    // senales → REQ-006
    const senalesReq = screen.getByTestId('entity-section-senales').querySelector('[data-testid="block-unavailable-req"]');
    const senalesEta = screen.getByTestId('entity-section-senales').querySelector('[data-testid="block-unavailable-eta"]');
    expect(senalesReq?.textContent).toBe('REQ-006');
    expect(senalesEta?.textContent).toBe('Sprint 2');

    // documentacion → REQ-007
    const docsReq = screen.getByTestId('entity-section-documentacion').querySelector('[data-testid="block-unavailable-req"]');
    const docsEta = screen.getByTestId('entity-section-documentacion').querySelector('[data-testid="block-unavailable-eta"]');
    expect(docsReq?.textContent).toBe('REQ-007');
    expect(docsEta?.textContent).toBe('Sprint 2');

    // actividad → REQ-008
    const actReq = screen.getByTestId('entity-section-actividad').querySelector('[data-testid="block-unavailable-req"]');
    const actEta = screen.getByTestId('entity-section-actividad').querySelector('[data-testid="block-unavailable-eta"]');
    expect(actReq?.textContent).toBe('REQ-008');
    expect(actEta?.textContent).toBe('Sprint 2');
  });

  it('actualiza la sección analisis in-place al recibir CustomEvent', async () => {
    render(
      withIntl(
        <CompanyPageClient
          cif="B86540112"
          initial={authedFixture()}
          authenticated={true}
        />,
      ),
    );

    // Estado inicial de la narrativa.
    expect(
      screen.getByText('Resumen inicial de la empresa.'),
    ).toBeInTheDocument();

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
    // El resto de la ficha permanece intacto.
    expect(screen.getByTestId('company-header-name')).toHaveTextContent(
      'Kitchen Studio, S.L.',
    );
    expect(screen.getAllByText(/2,4M €/).length).toBeGreaterThan(0);
  });

  it('ignora CustomEvents dirigidos a otro CIF', async () => {
    render(
      withIntl(
        <CompanyPageClient
          cif="B86540112"
          initial={authedFixture()}
          authenticated={true}
        />,
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

  it('429 en refresh muestra countdown en el botón', async () => {
    const user = userEvent.setup();
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
        <CompanyPageClient
          cif="B86540112"
          initial={authedFixture()}
          authenticated={true}
        />,
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

  it('refresh 200 bloquea el botón 60s (cooldown optimista) y actualiza narrativa', async () => {
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
            provenance: 'live',
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
        <CompanyPageClient
          cif="B86540112"
          initial={authedFixture()}
          authenticated={true}
        />,
      ),
    );
    const btn = screen.getByTestId('company-refresh-analysis');
    await user.click(btn);
    await waitFor(
      () => {
        expect(btn).toHaveTextContent(/Espera 60s/);
      },
      { timeout: 3000 },
    );
    expect(btn).toBeDisabled();
    expect(
      screen.getByText('Nueva narrativa refrescada.'),
    ).toBeInTheDocument();
  });
});
