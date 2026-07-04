/**
 * End-to-end-ish test for the Copilot dock + composer.
 *
 *   1. Mount the provider + dock.
 *   2. Mock global.fetch so the orchestrator returns a deterministic Workspace.
 *   3. Click the FAB → dock opens.
 *   4. Type into the composer + press Enter → assistant message + workspace.
 *   5. Click "Limpiar" → history cleared.
 *
 * Pathname is mocked via next/navigation.
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
    // Cualquier otro fetch (RecentWorkspacesPanel → /api/workspaces, etc.)
    // resuelve como lista vacía para no polucionar SWR.
    return new Response(
      JSON.stringify({ items: [], total: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }) as unknown as typeof fetch;
}

describe('CopilotDock + Composer (E2E)', () => {
  beforeEach(() => {
    // Provider hydrates from localStorage — start clean.
    window.localStorage.clear();
    vi.resetAllMocks();
  });

  it('opens via FAB, sends a query and renders the SearchResultsBlock', async () => {
    const user = userEvent.setup();
    mockSearchOnce(3);
    render(
      <CopilotProvider>
        <CopilotDock />
      </CopilotProvider>
    );
    await user.click(screen.getByTestId('copilot-dock-fab'));
    await user.type(screen.getByTestId('copilot-composer-textarea'), 'kitchen{enter}');
    await waitFor(() =>
      expect(screen.getByTestId('block-search-results')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('copilot-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('block-search-results-row-mc_0')).toBeInTheDocument();
    expect(screen.getByTestId('block-search-results-row-mc_1')).toBeInTheDocument();
    expect(screen.getByTestId('block-search-results-row-mc_2')).toBeInTheDocument();
  });

  it('Limpiar button wipes the history', async () => {
    const user = userEvent.setup();
    mockSearchOnce(2);
    render(
      <CopilotProvider>
        <CopilotDock />
      </CopilotProvider>
    );
    await user.click(screen.getByTestId('copilot-dock-fab'));
    await user.type(screen.getByTestId('copilot-composer-textarea'), 'kitchen{enter}');
    await waitFor(() => expect(screen.getByTestId('block-search-results')).toBeInTheDocument());
    await user.click(screen.getByTestId('copilot-dock-clear'));
    expect(screen.queryByTestId('block-search-results')).not.toBeInTheDocument();
  });

  it('renders chips on first open and submits the chip query on click', async () => {
    const user = userEvent.setup();
    mockSearchOnce(1);
    render(
      <CopilotProvider>
        <CopilotDock />
      </CopilotProvider>
    );
    await user.click(screen.getByTestId('copilot-dock-fab'));
    // Chips visible when history is empty
    expect(screen.getByTestId('copilot-composer-chips')).toBeInTheDocument();
    await user.click(screen.getByTestId('copilot-composer-chip-0'));
    await waitFor(() => {
      expect(screen.getByTestId('block-search-results')).toBeInTheDocument();
    });
  });
});
