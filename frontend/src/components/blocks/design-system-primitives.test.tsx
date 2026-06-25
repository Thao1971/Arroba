/**
 * Design System v1.0.0 — primitive component tests.
 *
 * Pins the canonical surface of:
 *   - UnavailableBlock (REQ-XXX placeholder, distinct from Empty/Error/Locked).
 *   - RefreshButton (idle / loading / cooldown / disabled states).
 *   - MetricsGrid (1/2/3/4 columns + trend rendering).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MetricsGrid, RefreshButton, UnavailableBlock } from './index';

/* ============================================================
 * UnavailableBlock
 * ============================================================ */
describe('UnavailableBlock', () => {
  it('renders title + description with the Construction icon and aria-live polite', () => {
    render(
      <UnavailableBlock
        title="Señales BORME"
        description="Datos de BORME disponibles cuando REQ-008 entregue."
      />,
    );
    const block = screen.getByTestId('block-unavailable');
    expect(block).toBeInTheDocument();
    expect(block).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Señales BORME')).toBeInTheDocument();
    expect(
      screen.getByText(/Datos de BORME disponibles/),
    ).toBeInTheDocument();
  });

  it('exposes the blocking REQ and ETA when provided', () => {
    render(
      <UnavailableBlock
        title="Comparables sectoriales"
        req="REQ-007"
        eta="E1.6"
      />,
    );
    expect(screen.getByTestId('block-unavailable-req')).toHaveTextContent(
      'REQ-007',
    );
    expect(screen.getByTestId('block-unavailable-eta')).toHaveTextContent(
      'E1.6',
    );
  });

  it('renders an optional CTA link', () => {
    render(
      <UnavailableBlock
        title="Algo"
        cta={{ label: 'Ver requerimiento', href: '/internal/reqs/REQ-007' }}
      />,
    );
    const link = screen.getByTestId('block-unavailable-cta');
    expect(link).toHaveAttribute('href', '/internal/reqs/REQ-007');
    expect(link).toHaveTextContent('Ver requerimiento');
  });
});

/* ============================================================
 * RefreshButton
 * ============================================================ */
describe('RefreshButton', () => {
  it('idle state — label with arrow prefix + clickable', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<RefreshButton label="Refrescar análisis" onClick={onClick} />);
    const btn = screen.getByTestId('refresh-button');
    expect(btn).toHaveAttribute('data-state', 'idle');
    expect(btn).toHaveTextContent('↺ Refrescar análisis');
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('loading state — disabled, aria-busy true, spinner, custom loading label', () => {
    render(
      <RefreshButton
        label="Refrescar análisis"
        loadingLabel="Recalculando…"
        loading
        onClick={() => undefined}
      />,
    );
    const btn = screen.getByTestId('refresh-button');
    expect(btn).toHaveAttribute('data-state', 'loading');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Recalculando…');
  });

  it('cooldown state — shows "Espera Ns" and is disabled', () => {
    render(
      <RefreshButton
        label="Refrescar análisis"
        cooldownSeconds={42}
        onClick={() => undefined}
      />,
    );
    const btn = screen.getByTestId('refresh-button');
    expect(btn).toHaveAttribute('data-state', 'cooldown');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Espera 42s');
  });

  it('explicit disabled prop overrides idle when no loading/cooldown', () => {
    render(
      <RefreshButton
        label="Refrescar análisis"
        disabled
        onClick={() => undefined}
      />,
    );
    const btn = screen.getByTestId('refresh-button');
    expect(btn).toHaveAttribute('data-state', 'disabled');
    expect(btn).toBeDisabled();
  });
});

/* ============================================================
 * MetricsGrid
 * ============================================================ */
describe('MetricsGrid', () => {
  const items = [
    { id: 'm1', label: 'Ingresos', value: '2,4M €', trend: 'up' as const, hint: 'YoY' },
    { id: 'm2', label: 'EBITDA',   value: '480k €', trend: 'flat' as const },
    { id: 'm3', label: 'Empleados', value: '32',     trend: 'down' as const },
    { id: 'm4', label: 'Margen',   value: '20%',     trend: 'up' as const },
  ];

  it('renders one card per item and exposes the columns attribute', () => {
    render(<MetricsGrid items={items} columns={4} />);
    const grid = screen.getByTestId('metrics-grid');
    expect(grid).toHaveAttribute('data-columns', '4');
    expect(screen.getByTestId('metrics-grid-item-m1')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-item-m4')).toBeInTheDocument();
  });

  it('renders trend indicators when showTrends is true (default)', () => {
    render(<MetricsGrid items={items} columns={4} />);
    expect(
      screen.getByTestId('metrics-grid-item-m1-trend'),
    ).toHaveAttribute('aria-label', 'Tendencia up');
    expect(
      screen.getByTestId('metrics-grid-item-m2-trend'),
    ).toHaveAttribute('aria-label', 'Tendencia flat');
  });

  it('hides trends when showTrends is false', () => {
    render(<MetricsGrid items={items} columns={4} showTrends={false} />);
    expect(
      screen.queryByTestId('metrics-grid-item-m1-trend'),
    ).not.toBeInTheDocument();
  });

  it('honours the columns prop (1 / 2 / 3 / 4)', () => {
    const cases: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
    for (const c of cases) {
      const { unmount } = render(
        <MetricsGrid items={items} columns={c} testId={`mg-${c}`} />,
      );
      expect(screen.getByTestId(`mg-${c}`)).toHaveAttribute(
        'data-columns',
        String(c),
      );
      unmount();
    }
  });
});
