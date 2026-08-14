/**
 * HARDENING-026 · End-to-end-ish test para el Copilot reskinneado (barra
 * inferior anclada + panel de thread colapsable).
 *
 * Cambios respecto al test anterior:
 *   - No hay FAB. La barra con el Composer está siempre visible para el
 *     usuario autenticado. Anterior: `copilot-dock-fab` → obsoleto.
 *   - `data-testid="composer"` sigue siendo el contrato raíz Sprint 1.
 *   - `data-open` refleja si el panel del thread está expandido (semántica
 *     ampliada, contrato preservado).
 *   - El panel + botón "Limpiar" sólo son visibles cuando hay history
 *     (auto-open al hacer submit gracias a `CopilotProvider.submit`).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopilotProvider, CopilotDock } from './index';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { user_id: 'u_test', email: 'buyer@arroba.com' },
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
  ACTIVE_ORG_EVENT: 'arroba:active-org-changed',
  ACTIVE_ORG_STORAGE_KEY: 'arroba.active_org_id',
}));

function mockSearchOnce(results: number) {
  global.fetch = vi.fn().mockImplementation(async (url: string) => {
    const path = typeof url === 'string' ? url : String(url);
    if (path.includes('/copilot/skills/search')) {
      return new Response(
        JSON.stringify({
          workspace: {
            workspace_id: 'wsp_x',
            intent: 'search',
            blocks: [
              {
                type: 'search_results',
                id: 'blk_x',
                props: {
                  query: 'kitchen',
                  total: results,
                  results: Array.from({ length: results }).map((_, i) => ({
                    master_company_id: `mc_${i}`,
                    name: `Company ${i}`,
                    sector: 'Tech',
                    cif: `B${i}`,
                    score: 0.8,
                  })),
                },
              },
            ],
          },
          provenance: 'demo',
          query: 'kitchen',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({ items: [], total: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }) as unknown as typeof fetch;
}

describe('CopilotDock reskinneado + Composer (E2E · HARDENING-026)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetAllMocks();
  });

  it('emite data-testid="composer" persistente + barra siempre visible sin FAB', () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [], total: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;
    const { container } = render(
      <CopilotProvider>
        <CopilotDock />
      </CopilotProvider>,
    );
    const composer = container.querySelector('[data-testid="composer"]');
    expect(composer).not.toBeNull();
    // HARDENING-026 · sin FAB: la barra Composer está siempre montada.
    expect(composer?.getAttribute('data-open')).toBe('false');
    expect(composer?.querySelector('[data-testid="copilot-dock-bar"]')).not.toBeNull();
    expect(composer?.querySelector('[data-testid="copilot-composer-textarea"]')).not.toBeNull();
    // Panel del thread NO visible con history vacío.
    expect(composer?.querySelector('[data-testid="copilot-dock-panel"]')).toBeNull();
    // Y el FAB legacy DEBE haber desaparecido del DOM.
    expect(composer?.querySelector('[data-testid="copilot-dock-fab"]')).toBeNull();
  });

  it('envío auto-expande el panel del thread + renderiza SearchResultsBlock', async () => {
    const user = userEvent.setup();
    mockSearchOnce(3);
    const { container } = render(
      <CopilotProvider>
        <CopilotDock />
      </CopilotProvider>
    );
    // Composer visible directamente, sin FAB previo.
    await user.type(screen.getByTestId('copilot-composer-textarea'), 'kitchen{enter}');
    await waitFor(() =>
      expect(screen.getByTestId('block-search-results')).toBeInTheDocument(),
    );
    // Panel del thread ahora sí existe (auto-open on submit).
    expect(container.querySelector('[data-testid="copilot-dock-panel"]')).not.toBeNull();
    expect(screen.getByTestId('copilot-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('block-search-results-row-mc_0')).toBeInTheDocument();
    expect(screen.getByTestId('block-search-results-row-mc_1')).toBeInTheDocument();
    expect(screen.getByTestId('block-search-results-row-mc_2')).toBeInTheDocument();
  });

  it('Limpiar button (dentro del panel abierto) vacía la history', async () => {
    const user = userEvent.setup();
    mockSearchOnce(2);
    render(
      <CopilotProvider>
        <CopilotDock />
      </CopilotProvider>
    );
    await user.type(screen.getByTestId('copilot-composer-textarea'), 'kitchen{enter}');
    await waitFor(() => expect(screen.getByTestId('block-search-results')).toBeInTheDocument());
    // El botón Limpiar sólo existe cuando el panel del thread está visible.
    await user.click(screen.getByTestId('copilot-dock-clear'));
    expect(screen.queryByTestId('block-search-results')).not.toBeInTheDocument();
  });

  it('renders chips en la barra al inicio y submit del chip envía la query', async () => {
    const user = userEvent.setup();
    mockSearchOnce(1);
    render(
      <CopilotProvider>
        <CopilotDock />
      </CopilotProvider>
    );
    // Chips visibles en la barra cuando history === 0 (no requiere abrir FAB).
    expect(screen.getByTestId('copilot-composer-chips')).toBeInTheDocument();
    await user.click(screen.getByTestId('copilot-composer-chip-0'));
    await waitFor(() => {
      expect(screen.getByTestId('block-search-results')).toBeInTheDocument();
    });
  });
});
