/**
 * Tests for the OpenWorkspaceButton.
 *
 * Behaviour matrix:
 *  - Hidden when no user message exists.
 *  - Hidden when no assistant message exists.
 *  - Hidden when currentWorkspaceId is set (anchored mode).
 *  - Visible otherwise. Click flows:
 *    - authenticated + 201 → router.push to LOCALE-LESS `/w/{id}` URL.
 *    - authenticated + 422 → shows the backend detail as error, no push.
 *    - authenticated + 500 → shows generic error, no push.
 *    - anonymous → router.push to LOCALE-LESS `/login?next=…`.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiError } from '@/lib/api/client';
import { OpenWorkspaceButton } from './OpenWorkspaceButton';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  usePathname: () => '/',
}));

type CopilotState = {
  open: boolean;
  history: Array<{ id: string; role: 'user' | 'assistant'; text: string; ts: number }>;
  workspace: unknown;
  loading: boolean;
  currentWorkspaceId: string | null;
  lastQuery: string | null;
};

const baseHistory: CopilotState['history'] = [
  { id: 'u1', role: 'user', text: 'analiza Kitchen Studio', ts: Date.now() },
  { id: 'a1', role: 'assistant', text: 'Listo.', ts: Date.now() },
];
const baseCopilot: CopilotState = {
  open: false,
  history: baseHistory,
  workspace: null,
  loading: false,
  currentWorkspaceId: null,
  lastQuery: null,
};

const authState = { isAuthenticated: true };

const promoteMock = vi.fn(async () => ({ workspaceId: 'wsp_x', url: '/w/wsp_x' }));

vi.mock('./CopilotProvider', async () => ({
  useCopilot: () => ({
    ...baseCopilot,
    promoteToWorkspace: promoteMock,
    send: vi.fn(),
    retry: vi.fn(),
    clear: vi.fn(),
    openDock: vi.fn(),
    closeDock: vi.fn(),
    toggle: vi.fn(),
    hydratePersistent: vi.fn(),
    dispatch: vi.fn(),
  }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => authState,
}));

beforeEach(() => {
  pushMock.mockClear();
  promoteMock.mockClear();
  promoteMock.mockImplementation(async () => ({ workspaceId: 'wsp_x', url: '/w/wsp_x' }));
  baseCopilot.currentWorkspaceId = null;
  baseCopilot.history = baseHistory;
  authState.isAuthenticated = true;
});

describe('<OpenWorkspaceButton>', () => {
  it('renders when there is at least one user+assistant pair', () => {
    render(<OpenWorkspaceButton />);
    expect(screen.getByTestId('copilot-open-workspace')).toBeInTheDocument();
  });

  it('hides when currentWorkspaceId is set (anchored mode)', () => {
    baseCopilot.currentWorkspaceId = 'wsp_anchor';
    const { container } = render(<OpenWorkspaceButton />);
    expect(container.firstChild).toBeNull();
  });

  it('hides when there is no user message', () => {
    baseCopilot.history = [];
    const { container } = render(<OpenWorkspaceButton />);
    expect(container.firstChild).toBeNull();
  });

  it('navigates to locale-less /w/{id} when authenticated + 201', async () => {
    render(<OpenWorkspaceButton />);
    fireEvent.click(screen.getByTestId('copilot-open-workspace'));
    await waitFor(() => expect(promoteMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/w/wsp_x'));
    // Critical: the URL passed to router.push DOES NOT include `/es/` because
    // next-intl is configured with `localePrefix: 'never'`.
    const target = String(pushMock.mock.calls[0]?.[0] ?? '');
    expect(target).not.toMatch(/^\/(es|en)\//);
  });

  it('redirects to locale-less /login when anonymous', async () => {
    authState.isAuthenticated = false;
    render(<OpenWorkspaceButton />);
    fireEvent.click(screen.getByTestId('copilot-open-workspace'));
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    const target = String(pushMock.mock.calls[0]?.[0] ?? '');
    expect(target).toContain('/login?next=');
    expect(target).not.toMatch(/^\/(es|en)\//);
    expect(promoteMock).not.toHaveBeenCalled();
  });

  it('shows the backend detail message when API returns 422', async () => {
    promoteMock.mockImplementationOnce(async () => {
      throw new ApiError(422, { detail: 'blocks_invalid', code: 'invalid_payload' });
    });
    render(<OpenWorkspaceButton />);
    fireEvent.click(screen.getByTestId('copilot-open-workspace'));
    await waitFor(() =>
      expect(screen.getByTestId('copilot-open-workspace-error')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('copilot-open-workspace-error').textContent).toContain('422');
    expect(screen.getByTestId('copilot-open-workspace-error').textContent).toContain(
      'blocks_invalid',
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('shows a generic error message when API returns 500', async () => {
    promoteMock.mockImplementationOnce(async () => {
      throw new Error('boom');
    });
    render(<OpenWorkspaceButton />);
    fireEvent.click(screen.getByTestId('copilot-open-workspace'));
    await waitFor(() =>
      expect(screen.getByTestId('copilot-open-workspace-error')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('copilot-open-workspace-error').textContent).toMatch(
      /Hubo un problema|inténtalo/i,
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
