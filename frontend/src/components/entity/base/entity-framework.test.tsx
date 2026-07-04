/**
 * Entity Framework v1.0.0 — base primitives tests (E1.5.6).
 *
 * Pins the canonical contract of:
 *   - `EntityHeader` (presentational base, `data-entity-type` exposed,
 *     actions consumed declaratively, derived initials fallback).
 *   - `EntitySections` (orchestrator that sorts by CANONICAL_MODULE_ORDER
 *     and maps non-ready states to the correct fallback components).
 *
 * These tests are the regression net for the consolidation refactor.
 * They prove that the canonical primitives can be specialised by props
 * alone (no need to fork files for Sector / Territory / etc.).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { Bookmark, Share2 } from 'lucide-react';

import {
  CANONICAL_MODULE_ORDER,
  EntityHeader,
  EntitySections,
  MODULE_DEFAULTS,
  type EntityHeaderAction,
  type EntitySectionDescriptor,
} from './index';

const messages = {
  entity: {
    lock: {
      title: 'Disponible al crear cuenta',
      description: 'Crea tu cuenta para acceder.',
      register: 'Crear cuenta',
      login: 'Iniciar sesión',
    },
  },
};

function withIntl(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

/* ===========================================================
 * EntityHeader — presentational base
 * =========================================================== */
describe('EntityHeader', () => {
  it('exposes data-entity-type on the root and derives a default testId', () => {
    render(
      <EntityHeader
        entityType="sector"
        info={{ name: 'Software', subtitle: 'Tecnología' }}
        authenticated={false}
      />,
    );
    const root = screen.getByTestId('sector-header');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('data-entity-type', 'sector');
  });

  it('renders the name, subtitle and optional score badge', () => {
    render(
      <EntityHeader
        entityType="company"
        info={{
          name: 'Kitchen Studio, S.L.',
          subtitle: 'Software · Madrid · B86540112',
          score: 92,
          initials: 'KS',
        }}
        authenticated={false}
      />,
    );
    expect(screen.getByTestId('company-header-name')).toHaveTextContent(
      'Kitchen Studio, S.L.',
    );
    expect(screen.getByTestId('company-header-subtitle')).toHaveTextContent(
      'Software · Madrid · B86540112',
    );
    expect(screen.getByTestId('company-header-score')).toHaveTextContent('Score 92');
  });

  it('derives initials from the name when not provided', () => {
    render(
      <EntityHeader
        entityType="person"
        info={{ name: 'Lucía Pérez' }}
        authenticated={false}
      />,
    );
    // We can't query the avatar via testid (intentional, it's aria-hidden),
    // but we can assert the rendered text content of the header includes
    // the derived initials "LP".
    expect(screen.getByTestId('person-header')).toHaveTextContent('LP');
  });

  it('hides the actions row when not authenticated', () => {
    const actions: EntityHeaderAction[] = [
      {
        testId: 'company-action-watchlist',
        label: 'Guardar',
        icon: Bookmark,
        onClick: vi.fn(),
      },
    ];
    render(
      <EntityHeader
        entityType="company"
        info={{ name: 'X' }}
        authenticated={false}
        actions={actions}
      />,
    );
    expect(screen.queryByTestId('company-header-actions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('company-action-watchlist')).not.toBeInTheDocument();
  });

  it('renders the actions row with stable per-action testids when authenticated', async () => {
    const onWatchlist = vi.fn();
    const onShare = vi.fn();
    const actions: EntityHeaderAction[] = [
      {
        testId: 'company-action-watchlist',
        label: 'Guardar en cartera',
        icon: Bookmark,
        onClick: onWatchlist,
      },
      {
        testId: 'company-action-share',
        label: 'Compartir',
        icon: Share2,
        onClick: onShare,
        disabled: true,
      },
    ];
    render(
      <EntityHeader
        entityType="company"
        info={{ name: 'X' }}
        authenticated
        actions={actions}
      />,
    );
    const watch = screen.getByTestId('company-action-watchlist');
    const share = screen.getByTestId('company-action-share');
    expect(watch).toBeInTheDocument();
    expect(share).toBeDisabled();
    await userEvent.click(watch);
    expect(onWatchlist).toHaveBeenCalledTimes(1);
  });
});

/* ===========================================================
 * EntitySections — canonical orchestrator
 * =========================================================== */
describe('EntitySections', () => {
  it('renders sections in the canonical top→bottom order regardless of input', () => {
    const sections: EntitySectionDescriptor[] = [
      {
        id: 'acciones',
        module: 'acciones',
        title: 'Acciones',
        state: 'ready',
        children: <div>actions</div>,
      },
      {
        id: 'resumen',
        module: 'hero',
        title: 'Resumen',
        state: 'ready',
        children: <div>hero</div>,
      },
      {
        id: 'kpis',
        module: 'kpis',
        title: 'KPIs',
        state: 'ready',
        children: <div>kpis</div>,
      },
    ];
    render(
      <EntitySections
        entityType="company"
        authenticated
        sections={sections}
      />,
    );
    const wrappers = screen
      .getAllByTestId(/^entity-section-/)
      .filter((el) => {
        const tid = el.getAttribute('data-testid') || '';
        return /^entity-section-(resumen|kpis|acciones)$/.test(tid);
      });
    expect(wrappers.map((w) => w.getAttribute('data-testid'))).toEqual([
      'entity-section-resumen',
      'entity-section-kpis',
      'entity-section-acciones',
    ]);
  });

  it('uses LockedSectionBlur for `locked` state', () => {
    render(
      withIntl(
        <EntitySections
          entityType="company"
          authenticated={false}
          sections={[
            {
              id: 'analisis',
              module: 'analisis',
              title: 'Análisis',
              description: 'Lectura del Copilot',
              state: 'locked',
            },
          ]}
        />,
      ),
    );
    expect(
      screen.getByTestId('entity-part-analisis-locked'),
    ).toBeInTheDocument();
  });

  it('uses UnavailableBlock for `unavailable` state, surfacing REQ and ETA', () => {
    render(
      <EntitySections
        entityType="company"
        authenticated
        sections={[
          {
            id: 'senales',
            module: 'senales',
            title: 'Señales',
            description: 'BORME y contratación pública.',
            state: 'unavailable',
            req: 'REQ-008',
            eta: 'E1.8',
          },
        ]}
      />,
    );
    expect(screen.getByTestId('block-unavailable-req')).toHaveTextContent(
      'REQ-008',
    );
    expect(screen.getByTestId('block-unavailable-eta')).toHaveTextContent(
      'E1.8',
    );
  });

  it('renders the `action` slot only when state is ready', () => {
    render(
      withIntl(
        <EntitySections
          entityType="company"
          authenticated
          sections={[
            {
              id: 'analisis-ready',
              module: 'analisis',
              title: 'Análisis',
              state: 'ready',
              action: <button data-testid="action-slot-ready">refresh</button>,
              children: <div>content</div>,
            },
            {
              id: 'senales-locked',
              module: 'senales',
              title: 'Señales',
              state: 'locked',
              action: <button data-testid="action-slot-locked">refresh</button>,
            },
          ]}
        />,
      ),
    );
    expect(screen.getByTestId('action-slot-ready')).toBeInTheDocument();
    expect(screen.queryByTestId('action-slot-locked')).not.toBeInTheDocument();
  });

  it('exposes data-entity-type and data-authenticated on the root', () => {
    render(
      <EntitySections
        entityType="sector"
        authenticated={false}
        sections={[]}
      />,
    );
    const root = screen.getByTestId('entity-sections');
    expect(root).toHaveAttribute('data-entity-type', 'sector');
    expect(root).toHaveAttribute('data-authenticated', 'false');
  });

  it('resuelve `req` y `eta` desde MODULE_DEFAULTS cuando el descriptor los omite', () => {
    // Regla 3 · Sprint 1: cualquier módulo canónico en estado `unavailable`
    // debe emitir SIEMPRE el mismo REQ/ETA independientemente de la entidad
    // concreta o del payload. La fuente única es `MODULE_DEFAULTS`.
    render(
      <EntitySections
        entityType="company"
        authenticated
        sections={[
          {
            id: 'senales',
            module: 'senales',
            title: 'Señales',
            state: 'unavailable',
          },
          {
            id: 'documentacion',
            module: 'documentacion',
            title: 'Documentación',
            state: 'unavailable',
          },
          {
            id: 'actividad',
            module: 'actividad',
            title: 'Actividad',
            state: 'unavailable',
          },
        ]}
      />,
    );
    const reqs = screen.getAllByTestId('block-unavailable-req');
    const etas = screen.getAllByTestId('block-unavailable-eta');
    expect(reqs.map((n) => n.textContent)).toEqual(['REQ-006', 'REQ-007', 'REQ-008']);
    expect(etas.map((n) => n.textContent)).toEqual(['Sprint 2', 'Sprint 2', 'Sprint 2']);
  });
});

/* ===========================================================
 * Registry canónico — MODULE_DEFAULTS / CANONICAL_MODULE_ORDER
 * =========================================================== */
describe('Registry canónico (Sprint 1 · Regla 3)', () => {
  it('MODULE_DEFAULTS mapea los REQ canónicos de los 3 módulos pendientes', () => {
    expect(MODULE_DEFAULTS.senales).toEqual({ req: 'REQ-006', eta: 'Sprint 2' });
    expect(MODULE_DEFAULTS.documentacion).toEqual({ req: 'REQ-007', eta: 'Sprint 2' });
    expect(MODULE_DEFAULTS.actividad).toEqual({ req: 'REQ-008', eta: 'Sprint 2' });
  });

  it('MODULE_DEFAULTS deja vacíos los módulos ya entregados', () => {
    // Los módulos entregados en Sprint 1 no llevan `req`/`eta`; si aparecen
    // en `unavailable` (caso patológico) es porque el consumer pasó los
    // valores explícitamente.
    for (const mod of ['header', 'hero', 'kpis', 'insights', 'analisis',
                       'relaciones', 'oportunidades', 'acciones', 'advisor'] as const) {
      expect(MODULE_DEFAULTS[mod]).toEqual({});
    }
  });

  it('CANONICAL_MODULE_ORDER incluye los 12 módulos canónicos exactos', () => {
    // Regla 2 · Sprint 1: `header` y `advisor` participan del orden canónico
    // — ningún módulo canónico puede "desaparecer" del DOM.
    expect(CANONICAL_MODULE_ORDER).toHaveLength(12);
    expect(CANONICAL_MODULE_ORDER[0]).toBe('header');
    expect(CANONICAL_MODULE_ORDER).toContain('advisor');
    expect(new Set(CANONICAL_MODULE_ORDER)).toEqual(new Set([
      'header', 'hero', 'kpis', 'insights', 'analisis', 'senales',
      'relaciones', 'oportunidades', 'documentacion', 'actividad',
      'acciones', 'advisor',
    ]));
  });
});
