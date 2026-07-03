/**
 * Tests para los 4 componentes nuevos del Sprint 1:
 *   IdentityCard · SignalsTimeline · DocumentList · ActivityTimeline
 *
 * Cada uno se prueba en al menos 2 estados canónicos:
 *   - data (populated)
 *   - empty / unavailable / error según corresponda al componente.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  IdentityCard,
  SignalsTimeline,
  DocumentList,
  ActivityTimeline,
  type SignalItem,
  type DocumentItem,
  type ActivityItem,
} from './index';

// ---------------------------------------------------------------------------
// IdentityCard
// ---------------------------------------------------------------------------
describe('IdentityCard', () => {
  it('renders identity fields when data is present', () => {
    render(
      <IdentityCard
        identity={{
          master_company_id: 'mc_olmedo',
          cif: 'B47820150',
          legal_name: 'Grupo Olmedo Hoteles, S.L.',
          sector: 'Hoteles',
          region: 'Castilla y León',
          country: 'ES',
          founded_year: 2001,
          employees: 82,
        }}
      />,
    );
    expect(screen.getByTestId('identity-card')).toBeInTheDocument();
    expect(screen.getByText('B47820150')).toBeInTheDocument();
    expect(screen.getByText('Hoteles')).toBeInTheDocument();
    // Región + país
    expect(screen.getByText('Castilla y León · ES')).toBeInTheDocument();
    // Empleados en formato es-ES
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('renders empty state when identity is null', () => {
    render(<IdentityCard identity={null} />);
    expect(screen.getByTestId('identity-card-empty')).toBeInTheDocument();
  });

  it('renders empty state when all fields are null/undefined', () => {
    render(
      <IdentityCard
        identity={{
          master_company_id: 'mc_x',
          cif: null,
          legal_name: 'Anon',
          sector: null,
          region: null,
          country: '',
          founded_year: null,
          employees: null,
        }}
      />,
    );
    expect(screen.getByTestId('identity-card-empty')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SignalsTimeline
// ---------------------------------------------------------------------------
describe('SignalsTimeline', () => {
  it('renders UnavailableBlock in unavailable state (Sprint 1 default)', () => {
    render(
      <SignalsTimeline
        items={[]}
        unavailable
        req="REQ-008"
        eta="Post-Sprint 1"
      />,
    );
    expect(screen.getByTestId('signals-timeline-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('signals-timeline-unavailable-req')).toHaveTextContent('REQ-008');
  });

  it('renders empty state when items empty and not unavailable', () => {
    render(<SignalsTimeline items={[]} />);
    expect(screen.getByTestId('signals-timeline-empty')).toBeInTheDocument();
  });

  it('renders items when data is present', () => {
    const items: SignalItem[] = [
      {
        kind: 'borme',
        dated_at: '2026-05-01T00:00:00Z',
        headline: 'Ampliación de capital registrada.',
        severity: 'info',
      },
      {
        kind: 'press',
        dated_at: null,
        headline: 'Compra de competidor local.',
        severity: 'warning',
      },
    ];
    render(<SignalsTimeline items={items} />);
    expect(screen.getByTestId('signals-timeline')).toBeInTheDocument();
    expect(screen.getByText('Ampliación de capital registrada.')).toBeInTheDocument();
    expect(screen.getByText('Compra de competidor local.')).toBeInTheDocument();
  });

  it('renders error state when error prop present', () => {
    render(<SignalsTimeline items={[]} error={{ message: 'Boom' }} />);
    expect(screen.getByTestId('signals-timeline-error')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// DocumentList
// ---------------------------------------------------------------------------
describe('DocumentList', () => {
  it('renders empty state with disabled upload CTA when items empty', () => {
    render(<DocumentList items={[]} />);
    expect(screen.getByTestId('document-list-empty')).toBeInTheDocument();
    const cta = screen.getByTestId('document-list-upload-disabled');
    expect(cta).toBeDisabled();
    expect(cta).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders items when documents are present', () => {
    const items: DocumentItem[] = [
      {
        doc_id: 'doc_1',
        kind: 'memoria_mercantil',
        display_name: 'Memoria 2024',
        size_bytes: 4_500_000,
        uploaded_at: '2026-04-10T09:30:00Z',
        download_url: '/files/doc_1.pdf',
      },
    ];
    render(<DocumentList items={items} />);
    expect(screen.getByTestId('document-list')).toBeInTheDocument();
    expect(screen.getByTestId('document-list-item-doc_1')).toBeInTheDocument();
    expect(screen.getByTestId('document-list-download-doc_1')).toHaveAttribute('href', '/files/doc_1.pdf');
    expect(screen.getByText('Memoria 2024')).toBeInTheDocument();
  });

  it('renders error state when error is present', () => {
    render(<DocumentList items={[]} error={{ message: 'Fallo' }} />);
    expect(screen.getByTestId('document-list-error')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ActivityTimeline
// ---------------------------------------------------------------------------
describe('ActivityTimeline', () => {
  it('renders empty state when no items', () => {
    render(<ActivityTimeline items={[]} />);
    expect(screen.getByTestId('activity-timeline-empty')).toBeInTheDocument();
  });

  it('renders items with kind labels', () => {
    const items: ActivityItem[] = [
      {
        event_id: 'ev_1',
        kind: 'watchlist_added',
        at: '2026-05-01T09:00:00Z',
        actor_label: 'Tú',
        summary: 'Guardada en watchlist',
      },
      {
        event_id: 'ev_2',
        kind: 'analysis_refreshed',
        at: '2026-05-01T10:00:00Z',
        actor_label: 'Arroba Copilot',
        summary: 'Nuevo análisis generado.',
      },
    ];
    render(<ActivityTimeline items={items} />);
    expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('activity-timeline-item-ev_1')).toBeInTheDocument();
    expect(screen.getByTestId('activity-timeline-item-ev_2')).toBeInTheDocument();
    expect(screen.getByText('Guardada en tu watchlist')).toBeInTheDocument();
    expect(screen.getByText('Análisis del Copilot refrescado')).toBeInTheDocument();
  });

  it('renders error state when error prop present', () => {
    render(<ActivityTimeline items={[]} error={{ message: 'Ups' }} />);
    expect(screen.getByTestId('activity-timeline-error')).toBeInTheDocument();
  });
});
