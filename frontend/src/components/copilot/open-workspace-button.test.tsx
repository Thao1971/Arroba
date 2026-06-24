/**
 * Tests for the OpenWorkspaceButton.
 *
 * Behaviour matrix:
 *  - Hidden when no user message exists.
 *  - Hidden when no assistant message exists.
 *  - Hidden when currentWorkspaceId is set (anchored mode).
 *  - Visible otherwise. Click flows:
 *    - authenticated → calls promoteToWorkspace then router.push(url).
 *    - anonymous     → router.push(/es/login?next=…).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OpenWorkspaceButton } from './OpenWorkspaceButton';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  usePathname: () => '/es',
}));

const baseCopilot = {
  open: false,
  history: [
    { id: 'u1', role: 'user' as const, text: 'analiza Kitchen Studio', ts: Date.now() },
    { id: 'a1', role: 'assistant' as const, text: 'Listo.', ts: Date.now() },
  ],
  workspace: null,
  loading: false,
  currentWorkspaceId: null as string | null,
  lastQuery: null,
};

const authState = {
  isAuthenticated: true,
};

const promoteMock = vi.fn(async () => ({ workspaceId: 'wsp_x', url: '/es/w/wsp_x' }));

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
  baseCopilot.currentWorkspaceId = null;
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
    const userMsgs = baseCopilot.history;
    baseCopilot.history = [];
    const { container } = render(<OpenWorkspaceButton />);
    expect(container.firstChild).toBeNull();
    baseCopilot.history = userMsgs;
  });

  it('redirects to /es/login when anonymous', async () => {
    authState.isAuthenticated = false;
    render(<OpenWorkspaceButton />);
    fireEvent.click(screen.getByTestId('copilot-open-workspace'));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(
        expect.stringContaining('/es/login?next=%2Fes%2Fhistorial'),
      ),
    );
    expect(promoteMock).not.toHaveBeenCalled();
  });

  it('promotes + navigates when authenticated', async () => {
    render(<OpenWorkspaceButton />);
    fireEvent.click(screen.getByTestId('copilot-open-workspace'));
    await waitFor(() => expect(promoteMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/es/w/wsp_x'));
  });
});
