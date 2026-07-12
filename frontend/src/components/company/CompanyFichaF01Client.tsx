'use client';
/**
 * CompanyFichaF01Client (Sprint F0.1b) — orquestador de datos de la Ficha de
 * Empresa. SWR fetch de las tres secciones canónicas + delegación al shell
 * `CompanyFichaLayout` (contenedor sin COMP-ID).
 *
 * Los COMP internos (COMP-1001..1003, COMP-1004, COMP-P-0001..0006) se
 * consumen sin modificar. La forma del layout la fija `CompanyFichaLayout`
 * según el ZIP canónico.
 */
import useSWR from 'swr';

import { intelligenceClient } from '@/lib/companies/intelligence-client';
import type {
  FinancialAnalysis,
  FinancialSection,
  IdentitySection,
  SemanticSection,
} from '@/lib/companies/intelligence-types';
import { Spinner } from '@/components/ds';
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';

import { CompanyFichaLayout } from './layout/CompanyFichaLayout';

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
  const { data: financialAnalysis, isLoading: financialAnalysisLoading } = useSWR<FinancialAnalysis | null>(
    ['ficha-f02-financial-analysis', cifUpper],
    () => intelligenceClient.financialAnalysis(cifUpper),
    FETCH_CONFIG,
  );
  const { data: semantic } = useSWR<SemanticSection | null>(
    ['ficha-f01-semantic', cifUpper],
    () => intelligenceClient.semanticSection(cifUpper),
    FETCH_CONFIG,
  );

  if (identityLoading) {
    return (
      <div
        data-testid="ficha-f01-loading"
        className="py-24 flex items-center justify-center text-body-sm"
        style={{ color: 'var(--text-secondary, #6B6B6B)' }}
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
    <CompanyFichaLayout
      cif={cifUpper}
      identity={identity}
      financial={financial ?? null}
      financialAnalysis={financialAnalysis ?? null}
      financialAnalysisLoading={financialAnalysisLoading}
      semantic={semantic ?? null}
    />
  );
}
