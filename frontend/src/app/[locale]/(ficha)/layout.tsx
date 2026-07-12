'use client';
/**
 * Layout de la Ficha de Empresa F0.1b · route group `(ficha)`.
 *
 * Este layout NO renderiza `<AuthHeader />` global — la Ficha canónica
 * asume ser un canvas full-screen con su propio Topbar (`CompanyTopbar`)
 * como marca el ZIP. La autenticación se garantiza vía `RequireAuth`
 * dentro de cada `page.tsx`.
 */
import type { ReactNode } from 'react';

export default function FichaGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--surface-primary, #F7F5F0)' }}
    >
      {children}
    </div>
  );
}
