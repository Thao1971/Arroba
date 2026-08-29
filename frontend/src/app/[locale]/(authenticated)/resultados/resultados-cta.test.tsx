/**
 * HARDENING-033 · Unit tests para el CTA contextual sobre `/resultados`.
 *
 * Cubre los tres invariantes canónicos:
 *   1. Ningún chip activo → el CTA NO se renderiza.
 *   2. Filtro ON + usuario anónimo → CTA anon con `Link` a `/{locale}/registro?next=<URL>`.
 *   3. Filtro ON + usuario autenticado → CTA auth con `Link` a `/{locale}/me/watchlists/new?...`.
 *
 * Extras: propagación de `q` y `signals` al querystring de destino y variante
 * de copy en función del `visibleCount` (singular vs plural).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ResultCTA } from './_result-cta';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const authState = {
  user: null as { user_id: string; email: string } | null,
  memberships: [] as unknown[],
  isAuthenticated: false,
  isLoading: false,
};

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => authState,
}));

beforeEach(() => {
  authState.user = null;
  authState.memberships = [];
  authState.isAuthenticated = false;
  authState.isLoading = false;
});

describe('HARDENING-033 · ResultCTA', () => {
  it('no renderiza cuando ambos chips están OFF (no compite con la lectura sin filtro)', () => {
    render(
      <ResultCTA
        query="agencias de marketing"
        onlyGrowth={false}
        excludeRisk={false}
        locale="es"
        pathname="/resultados"
        visibleCount={12}
      />,
    );
    expect(screen.queryByTestId('resultados-cta-watchlist')).toBeNull();
  });

  it('anónimo · onlyGrowth ON → renderiza variante anon con Link a /{locale}/registro?next=<URL-actual-encoded>', () => {
    authState.isAuthenticated = false;
    render(
      <ResultCTA
        query="agencias de marketing"
        onlyGrowth={true}
        excludeRisk={false}
        locale="es"
        pathname="/resultados"
        visibleCount={3}
      />,
    );
    const cta = screen.getByTestId('resultados-cta-watchlist');
    expect(cta).toBeInTheDocument();
    expect(cta.getAttribute('data-variant')).toBe('anon');
    expect(cta).toHaveTextContent(/3 candidatos filtrados hoy/);
    expect(cta).toHaveTextContent(/Crea una cuenta para hacer seguimiento diario/);

    const link = screen.getByTestId('resultados-cta-watchlist-link');
    const href = link.getAttribute('href') ?? '';
    expect(href.startsWith('/es/registro?')).toBe(true);
    // next= URL debe estar encodeada y contener el pathname + q + signals
    expect(href).toContain('next=');
    const nextParam = new URL(`http://x${href}`).searchParams.get('next');
    expect(nextParam).toBe('/resultados?q=agencias+de+marketing&signals=growth');
  });

  it('autenticado · excludeRisk ON → renderiza variante auth con Link a /{locale}/me/watchlists/new?q=…&signals=no-risk', () => {
    authState.isAuthenticated = true;
    authState.user = { user_id: 'u_1', email: 'buyer@arroba.com' };
    render(
      <ResultCTA
        query="agencias de marketing"
        onlyGrowth={false}
        excludeRisk={true}
        locale="es"
        pathname="/resultados"
        visibleCount={1}
      />,
    );
    const cta = screen.getByTestId('resultados-cta-watchlist');
    expect(cta).toBeInTheDocument();
    expect(cta.getAttribute('data-variant')).toBe('auth');
    // Singular (1) — validamos la variante de copy que NO añade la 's'
    expect(cta).toHaveTextContent(/1 candidato filtrado\./);
    expect(cta).toHaveTextContent(/¿Guardar esta búsqueda como watchlist\?/);

    const link = screen.getByTestId('resultados-cta-watchlist-link');
    const href = link.getAttribute('href') ?? '';
    expect(href.startsWith('/es/me/watchlists/new?')).toBe(true);
    const url = new URL(`http://x${href}`);
    expect(url.searchParams.get('q')).toBe('agencias de marketing');
    expect(url.searchParams.get('signals')).toBe('no-risk');
  });

  it('autenticado · ambos chips ON → signals contiene ambos tokens en orden growth,no-risk', () => {
    authState.isAuthenticated = true;
    render(
      <ResultCTA
        query="pymes industriales"
        onlyGrowth={true}
        excludeRisk={true}
        locale="en"
        pathname="/resultados"
        visibleCount={7}
      />,
    );
    const link = screen.getByTestId('resultados-cta-watchlist-link');
    const href = link.getAttribute('href') ?? '';
    expect(href.startsWith('/en/me/watchlists/new?')).toBe(true);
    const url = new URL(`http://x${href}`);
    expect(url.searchParams.get('signals')).toBe('growth,no-risk');
    expect(url.searchParams.get('q')).toBe('pymes industriales');
  });
});
