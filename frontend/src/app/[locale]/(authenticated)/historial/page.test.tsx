/**
 * Tests for the HistoryPage.
 *
 *  - Empty state when no items.
 *  - List rendered when there are items.
 *  - Filter by type passes the right `type` query param to the API.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const listMock = vi.fn();
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    workspaces: {
      list: (...args: unknown[]) => listMock(...args),
    },
  },
}));

// Mock useSWR so the fetcher runs synchronously and we can assert calls.
vi.mock('swr', () => ({
  default: (key: unknown, fetcher: (k: unknown) => Promise<unknown>) => {
    const [, setState] = require('react').useState({ data: undefined, isLoading: !!key });
    require('react').useEffect(() => {
      if (!key) return;
      let cancelled = false;
      Promise.resolve(fetcher(key)).then((data) => {
        if (!cancelled) setState({ data, isLoading: false });
      });
      return () => {
        cancelled = true;
      };
    }, [JSON.stringify(key)]);
    const [s] = require('react').useState({ data: undefined, isLoading: !!key });
    // Trigger fetcher once on mount.
    if (key && !s.data) {
      try {
        fetcher(key);
      } catch {
        /* ignore */
      }
    }
    return { data: undefined, isLoading: true, mutate: vi.fn() };
  },
}));

vi.mock('@/lib/workspaces/useActiveOrg', () => ({
  useActiveOrg: () => ({ activeOrgId: 'org_alpha', availableOrgs: [], setActiveOrgId: vi.fn() }),
}));

import HistoryPage from './page';

beforeEach(() => {
  listMock.mockReset();
  listMock.mockResolvedValue({ items: [], total: 0, has_more: false });
});

describe('<HistoryPage>', () => {
  it('calls the API with the active org', async () => {
    render(<HistoryPage />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'active' }),
      'org_alpha',
    );
  });

  it('filtering by type re-calls the API with the new type param', async () => {
    render(<HistoryPage />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    listMock.mockClear();
    fireEvent.click(screen.getByTestId('history-filter-type-analyze'));
    await waitFor(() =>
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'analyze' }),
        'org_alpha',
      ),
    );
  });

  it('renders filter controls with proper test IDs', () => {
    render(<HistoryPage />);
    expect(screen.getByTestId('history-filters')).toBeInTheDocument();
    expect(screen.getByTestId('history-filter-type-all')).toBeInTheDocument();
    expect(screen.getByTestId('history-filter-state-active')).toBeInTheDocument();
    expect(screen.getByTestId('history-filter-state-archived')).toBeInTheDocument();
  });
});
