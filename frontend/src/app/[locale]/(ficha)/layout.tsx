'use client';
/**
 * Layout de la Ficha de Empresa F0.1b · route group `(ficha)`.
 *
 * App Shell (2026-08-29, confirmado por Daniel: "ambas con sidebar") — la
 * Ficha lleva ahora el mismo `Sidebar` (`components/layout/Sidebar.tsx`)
 * que el resto de páginas autenticadas. `CompanyFichaLayoutV2` (el shell
 * real que consume `CompanyFichaF01Client`, no el `CompanyFichaLayout` V1
 * ya retirado) nunca renderizó el `CompanyTopbar` del ZIP — esa nota estaba
 * desactualizada. La Ficha sigue siendo mixed-access (SIN `RequireAuth` en
 * `page.tsx`: el anónimo ve identidad/perfil, cifras bajo CTA de registro),
 * y `Sidebar` ya soporta usuario anónimo (`role: 'anonymous'`), así que
 * añadirlo aquí no fuerza login.
 */
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function FichaGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--surface-primary, #F7F5F0)' }}
    >
      <Sidebar>{children}</Sidebar>
    </div>
  );
}
