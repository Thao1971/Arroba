/**
 * CompanyHeader — actions row tests (watchlist, share, coming-soon toasts).
 *
 * Pins these invariants:
 *   - Anonymous: no actions row, no buttons rendered.
 *   - Authenticated + initialInWatchlist=false: "Guardar en cartera" visible
 *     and clicking it hits `POST /api/companies/{cif}/watchlist` then flips
 *     state to "En tu cartera".
 *   - "Compartir con equipo" is disabled until the company is in the
 *     watchlist (otherwise → info toast).
 *   - "Solicitar valoración avanzada" → emits an `arroba-toast-info` toast
 *     with the "Próximamente: E1.8" label (mirrors the canonical phase
 *     plan).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CompanyHeader } from './CompanyHeader';
import type { CompanyHeaderInfo } from '@/lib/companies/types';

vi.mock('@/lib/workspaces/useActiveOrg', () => ({
  useActiveOrg: () => ({
    activeOrgId: 'org_demo',
    setActiveOrgId: vi.fn(),
    availableOrgs: [{ org_id: 'org_demo' }],
  }),
}));

const baseInfo: CompanyHeaderInfo = {
  name: 'Kitchen Studio, S.L.',
  cif: 'B86540112',
  sector: 'Software',
  region: 'Madrid',
  country: 'ES',
  initials: 'KS',
  score: 92,
};

beforeEach(() => {
  global.fetch = vi.fn();
  // Clean toasts host between tests.
  const host = document.getElementById('arroba-toast-host');
  if (host) host.remove();
});

describe('CompanyHeader — anonymous', () => {
  it('does not render the actions row when anonymous', () => {
    render(
      <CompanyHeader
        cif="B86540112"
        info={baseInfo}
        authenticated={false}
        initialInWatchlist={false}
        initialVisibility={null}
      />,
    );
    expect(screen.getByTestId('company-header-name')).toHaveTextContent(
      'Kitchen Studio, S.L.',
    );
    expect(screen.queryByTestId('company-header-actions')).not.toBeInTheDocument();
  });
});

describe('CompanyHeader — authenticated', () => {
  it('renders the 6 typed action buttons + more', () => {
    render(
      <CompanyHeader
        cif="B86540112"
        info={baseInfo}
        authenticated={true}
        initialInWatchlist={false}
        initialVisibility={null}
      />,
    );
    expect(screen.getByTestId('company-action-watchlist')).toBeInTheDocument();
    expect(screen.getByTestId('company-action-share')).toBeInTheDocument();
    expect(
      screen.getByTestId('company-action-request-valuation'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('company-action-activate-opportunity'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('company-action-download-memory')).toBeInTheDocument();
    expect(screen.getByTestId('company-action-claim')).toBeInTheDocument();
    expect(screen.getByTestId('company-action-more')).toBeInTheDocument();
  });

  it('toggles watchlist: hits /api/companies/{cif}/watchlist and flips label', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ saved: true, visibility: 'private' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    render(
      <CompanyHeader
        cif="B86540112"
        info={baseInfo}
        authenticated={true}
        initialInWatchlist={false}
        initialVisibility={null}
      />,
    );

    const watchBtn = screen.getByTestId('company-action-watchlist');
    expect(watchBtn).toHaveTextContent('Guardar en cartera');
    await user.click(watchBtn);

    await waitFor(() => {
      expect(watchBtn).toHaveTextContent('En tu cartera');
    });

    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/companies/B86540112/watchlist');
    expect((init as RequestInit).method).toBe('POST');
  });

  it('share button is disabled until the company is in the watchlist', () => {
    render(
      <CompanyHeader
        cif="B86540112"
        info={baseInfo}
        authenticated={true}
        initialInWatchlist={false}
        initialVisibility={null}
      />,
    );
    expect(screen.getByTestId('company-action-share')).toBeDisabled();
  });

  it('share button is enabled when the company is already in the watchlist', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ visibility: 'team' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;
    render(
      <CompanyHeader
        cif="B86540112"
        info={baseInfo}
        authenticated={true}
        initialInWatchlist={true}
        initialVisibility="private"
      />,
    );
    const shareBtn = screen.getByTestId('company-action-share');
    expect(shareBtn).not.toBeDisabled();
    await user.click(shareBtn);
    await waitFor(() => {
      expect(shareBtn).toHaveTextContent('Compartida con equipo');
    });
  });

  it('Solicitar valoración avanzada → emits an info toast with E1.8 phase label', async () => {
    const user = userEvent.setup();
    render(
      <CompanyHeader
        cif="B86540112"
        info={baseInfo}
        authenticated={true}
        initialInWatchlist={false}
        initialVisibility={null}
      />,
    );
    await user.click(screen.getByTestId('company-action-request-valuation'));
    await waitFor(() => {
      const toast = document.querySelector('[data-testid="arroba-toast-info"]');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toMatch(/Próximamente: E1\.8/);
    });
  });

  it('Activar oportunidad → emits an info toast with E1.9 phase label', async () => {
    const user = userEvent.setup();
    render(
      <CompanyHeader
        cif="B86540112"
        info={baseInfo}
        authenticated={true}
        initialInWatchlist={false}
        initialVisibility={null}
      />,
    );
    await user.click(screen.getByTestId('company-action-activate-opportunity'));
    await waitFor(() => {
      const toast = document.querySelector('[data-testid="arroba-toast-info"]');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toMatch(/Próximamente: E1\.9/);
    });
  });
});
