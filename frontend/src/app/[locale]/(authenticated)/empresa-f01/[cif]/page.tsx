/**
 * Ficha de Empresa Sprint F0.1 — página real bajo `/empresa-f01/[cif]`.
 *
 * Ruta separada de `/empresa/[cif]` (SoT anterior de datos) durante F0.1
 * mientras se valida la reconstrucción canónica. Se fusionará en F0.N
 * cuando toda la ficha esté implementada.
 */
import type { Metadata } from 'next';
import { RequireAuth } from '@/components/RequireAuth';
import { CompanyFichaF01Client } from '@/components/company/CompanyFichaF01Client';

export const metadata: Metadata = {
  title: 'Ficha de empresa · arroba',
};

interface PageProps {
  params: { cif: string; locale: string };
}

export default function CompanyFichaF01Page({ params }: PageProps) {
  const cif = params.cif.toUpperCase();
  return (
    <RequireAuth>
      <CompanyFichaF01Client cif={cif} />
    </RequireAuth>
  );
}
