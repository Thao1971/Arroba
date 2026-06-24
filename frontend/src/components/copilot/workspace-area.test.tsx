/**
 * Tests for the WorkspaceArea renderer. Verifies that each BlockSpec.type
 * picks the right primitive component (switch correctness).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkspaceArea } from './WorkspaceArea';
import type { Workspace } from '@/lib/orchestrator';

// Mock the Copilot context — only `send` is needed by retry/suggestion buttons.
vi.mock('./CopilotProvider', async () => {
  const actual: typeof import('./CopilotProvider') = await vi.importActual('./CopilotProvider');
  return {
    ...actual,
    useCopilot: () => ({ send: vi.fn(), open: false, history: [], workspace: null, loading: false }),
  };
});

function ws(blocks: Workspace['blocks']): Workspace {
  return { workspace_id: 'wsp_t', intent: 'search', blocks };
}

describe('<WorkspaceArea>', () => {
  it('renders SearchResultsBlock for type=search_results', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'search_results',
            id: 'b1',
            props: {
              query: 'kitchen',
              total: 2,
              results: [
                { master_company_id: 'mc1', name: 'Kitchen Studio', sector: 'Tech', cif: 'B1', score: 0.9 },
                { master_company_id: 'mc2', name: 'Quickads', sector: 'Tech', cif: 'B2', score: 0.7 },
              ],
            },
          },
        ])}
      />
    );
    expect(screen.getByTestId('block-search-results')).toBeInTheDocument();
    expect(screen.getByText(/2 resultados para «kitchen»/i)).toBeInTheDocument();
    expect(screen.getByTestId('block-search-results-row-mc1')).toBeInTheDocument();
    expect(screen.getByTestId('block-search-results-row-mc2')).toBeInTheDocument();
  });

  it('renders empty state for type=empty_state and exposes suggestions', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'empty_state',
            id: 'b1',
            props: {
              title: 'Sin resultados',
              description: 'Prueba otro término',
              suggestions: ['Madrid', 'Barcelona'],
            },
          },
        ])}
      />
    );
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByText('Prueba otro término')).toBeInTheDocument();
    expect(screen.getByTestId('copilot-workspace-empty-suggestion-0')).toHaveTextContent('Madrid');
    expect(screen.getByTestId('copilot-workspace-empty-suggestion-1')).toHaveTextContent('Barcelona');
  });

  it('renders ErrorBlock for type=error', () => {
    render(
      <WorkspaceArea
        workspace={ws([
          {
            type: 'error',
            id: 'b1',
            props: {
              title: 'Falló',
              message: 'Algo salió mal',
              retry_intent: 'search',
            },
          },
        ])}
      />
    );
    expect(screen.getByTestId('block-error')).toBeInTheDocument();
    expect(screen.getByText('Falló')).toBeInTheDocument();
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('renders LoadingBlock for type=loading', () => {
    render(
      <WorkspaceArea
        workspace={ws([{ type: 'loading', id: 'b1', props: {} }])}
      />
    );
    expect(screen.getByTestId('block-loading')).toBeInTheDocument();
  });
});
