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
 *
 * HARDENING-REQ002 · Búsqueda exploratoria / NL ya no pinta `search_results`
 * en el dock — el orchestrator emite `navigate_to: /resultados?q=...` y el
 * `CopilotProvider.send` hace `router.push`. En el dock queda sólo el mensaje
 * del assistant ("Te muestro los resultados para «…»").
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopilotProvider, CopilotDock } from './index';

// HARDENING-REQ002 · router.push mock accesible en asserts (verificamos que
// el orchestrator emitió `navigate_to` y `CopilotProvider.send` lo consumió).
const routerPushMock = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: routerPushMock, replace: vi.fn() }),
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
    routerPushMock.mockClear();
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

  it('envío exploratorio muestra assistant msg + navega a /resultados (REQ002)', async () => {
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
      expect(screen.getByText(/Te muestro los resultados/)).toBeInTheDocument(),
    );
    // Panel del thread ahora sí existe (auto-open on submit).
    expect(container.querySelector('[data-testid="copilot-dock-panel"]')).not.toBeNull();
    // REQ002 · El orchestrator emitió `navigate_to: /resultados?q=kitchen` y
    // `CopilotProvider.send` lo consumió con `router.push`. Los resultados NO
    // se pintan dentro del dock (viven en la página `/resultados`).
    await waitFor(() => {
      expect(routerPushMock).toHaveBeenCalledWith('/resultados?q=kitchen');
    });
    expect(screen.queryByTestId('block-search-results')).not.toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByText(/Te muestro los resultados/)).toBeInTheDocument());
    // El botón Limpiar sólo existe cuando el panel del thread está visible.
    await user.click(screen.getByTestId('copilot-dock-clear'));
    expect(screen.queryByText(/Te muestro los resultados/)).not.toBeInTheDocument();
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
      expect(screen.getByText(/Te muestro los resultados/)).toBeInTheDocument();
    });
  });
});
