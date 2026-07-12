'use client';
/**
 * CompanyFichaF01Client — Cliente de la Ficha de Empresa canónica Sprint F0.1.
 *
 * Orquesta el Header (COMP-1001..1005 + COMP-1010) y el Perfil
 * (COMP-P-0001..0006) consumiendo los endpoints canónicos
 * `/api/companies/{cif}/section/{identity,financial,semantic}` del
 * `intelligence_layer`.
 *
 * NO renderiza el resto de secciones (Finanzas, Valoración, ...) — esos
 * llegarán en sub-sprints F0.2 y siguientes. Este cliente NO tiene
 * COMP-ID (contenedor de layout).
 *
 * Layout: fiel al ZIP `Empresa.html`. Header full-width en cabecera,
 * contenido central max 1760px con padding lateral.
 */
import { useCallback } from 'react';
import useSWR from 'swr';

import { intelligenceClient } from '@/lib/companies/intelligence-client';
import type {
  FinancialSection,
  IdentitySection,
  SemanticSection,
} from '@/lib/companies/intelligence-types';
import { Spinner } from '@/components/ds';
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';

import { CompanyHeader } from './header/CompanyHeader';
import { CompanyPerfil } from './perfil/CompanyPerfil';

const FETCH_CONFIG = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};

export interface CompanyFichaF01ClientProps {
  cif: string;
}

export function CompanyFichaF01Client({ cif }: CompanyFichaF01ClientProps) {
  const cifUpper = cif.toUpperCase();

  const { data: identity, error: identityError, isLoading: identityLoading } =
    useSWR<IdentitySection | null>(
      ['ficha-f01-identity', cifUpper],
      () => intelligenceClient.identitySection(cifUpper),
      FETCH_CONFIG,
    );
  const { data: financial } = useSWR<FinancialSection | null>(
    ['ficha-f01-financial', cifUpper],
    () => intelligenceClient.financialSection(cifUpper),
    FETCH_CONFIG,
  );
  const { data: semantic } = useSWR<SemanticSection | null>(
    ['ficha-f01-semantic', cifUpper],
    () => intelligenceClient.semanticSection(cifUpper),
    FETCH_CONFIG,
  );

  const handleOpenFinanzas = useCallback(() => {
    // F0.2 conectará esta acción a la sección Finanzas. Hoy no-op.
  }, []);

  if (identityLoading) {
    return (
      <div
        data-testid="ficha-f01-loading"
        className="py-24 flex items-center justify-center text-text-muted text-body-sm"
      >
        <Spinner /> <span className="ml-3">Cargando ficha…</span>
      </div>
    );
  }

  if (identityError) {
    return (
      <div className="py-16 max-w-md mx-auto">
        <UnavailableBlock
          testId="ficha-f01-error"
          title="No hemos podido cargar la empresa"
          description={`Se ha producido un error al recuperar la identidad de ${cifUpper}. Inténtalo en unos segundos.`}
          req="Identity resolver · arroba-identity-v1"
        />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="py-16 max-w-md mx-auto">
        <UnavailableBlock
          testId="ficha-f01-not-found"
          title="Empresa no encontrada"
          description={`No hay ninguna empresa con CIF ${cifUpper} en las fuentes verificables.`}
          req="Identity resolver · arroba-identity-v1"
        />
      </div>
    );
  }

  return (
    <article
      data-testid="ficha-f01-root"
      className="min-h-screen bg-surface-primary"
    >
      <CompanyHeader identity={identity} financial={financial ?? null} cif={cifUpper} />
      <main className="max-w-[1760px] mx-auto px-6 py-8">
        <CompanyPerfil
          identity={identity}
          financial={financial ?? null}
          semantic={semantic ?? null}
          onOpenFinanzas={handleOpenFinanzas}
        />
      </main>
    </article>
  );
}
