/**
 * LockedSectionBlur — anonymous teaser block used across the company page.
 *
 * Pins the public surface contract:
 *   - Default title/description come from next-intl messages (`entity.lock.*`).
 *   - Custom title/description override the i18n defaults.
 *   - CTAs link to /registro and /login with stable test ids.
 *   - When `children` is provided, they are rendered behind the blur layer
 *     with `aria-hidden` and `pointer-events-none`.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import { LockedSectionBlur } from './LockedSectionBlur';

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

describe('LockedSectionBlur', () => {
  it('renders the default i18n title + description when no overrides are provided', () => {
    render(withIntl(<LockedSectionBlur />));
    expect(
      screen.getByText('Disponible al crear cuenta'),
    ).toBeInTheDocument();
    expect(screen.getByText('Crea tu cuenta para acceder.')).toBeInTheDocument();
  });

  it('renders both CTA links to /registro and /login with stable test ids', () => {
    render(
      withIntl(
        <LockedSectionBlur testId="my-locked" title="X" description="y" />,
      ),
    );
    const register = screen.getByTestId('my-locked-cta-register');
    const login = screen.getByTestId('my-locked-cta-login');
    expect(register).toHaveAttribute('href', '/registro');
    expect(login).toHaveAttribute('href', '/login');
  });

  it('honours custom title and description over the i18n defaults', () => {
    render(
      withIntl(
        <LockedSectionBlur
          title="Score sectorial bloqueado"
          description="Necesitas iniciar sesión."
        />,
      ),
    );
    expect(
      screen.getByText('Score sectorial bloqueado'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Necesitas iniciar sesión.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Disponible al crear cuenta')).not.toBeInTheDocument();
  });

  it('places children behind the blur layer with aria-hidden', () => {
    render(
      withIntl(
        <LockedSectionBlur>
          <div data-testid="behind">child content</div>
        </LockedSectionBlur>,
      ),
    );
    const inner = screen.getByTestId('behind');
    // Walk up to find the aria-hidden wrapper.
    const blurWrapper = inner.closest('[aria-hidden="true"]');
    expect(blurWrapper).not.toBeNull();
  });
});
