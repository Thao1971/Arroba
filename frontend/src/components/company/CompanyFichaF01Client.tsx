'use client';
/**
 * CompanyFichaF01Client (Sprint F0.1b) — orquestador de datos de la Ficha de
 * Empresa. SWR fetch de las tres secciones canónicas + delegación al shell
 * `CompanyFichaLayout` (contenedor sin COMP-ID).
 *
 * Los COMP internos (COMP-1001..1003, COMP-1004, COMP-P-0001..0006) se
 * consumen sin modificar. La forma del layout la fija `CompanyFichaLayout`
 * según el ZIP canónico.
 *
 * B-2.4 · Refactor a agregador `/api/companies/{cif}/ficha` (arroba-ficha-v1):
 * consolida `identity` + `financial-analysis` en 1 sola llamada. El resto de
 * SWR hooks (semantic, financial-section, valuation, signal, buyers,
 * opportunities) permanece independiente hasta que Intel exponga esos shapes
 * en el agregador (cf. `PARA_BETA_B24_FICHA_SHAPE.md`).
 */
import useSWR from 'swr';

import { useAuth } from '@/contexts/auth-context';
import { intelligenceClient } from '@/lib/companies/intelligence-client';
import type {
  CompanyFicha,
  FinancialSection,
  IdentitySection,
  RecommendationSet,
  SemanticSection,
  SignalAnalysis,
  ValuationAnalysis,
} from '@/lib/companies/intelligence-types';
import { Spinner } from '@/components/ds';
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';

import { CompanyFichaLayoutV2 } from './layout/CompanyFichaLayoutV2';

const FETCH_CONFIG = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};

export interface CompanyFichaF01ClientProps {
  cif: string;
}

/**
 * B-2.4 · adapter · mapea el bloque rico `identity` del agregador (33 claves)
 * al shape `IdentitySection` que consume `CompanyFichaLayoutV2` desde F0.1b.
 * Passthrough puro: NO calculamos, solo reasignamos claves existentes.
 */
function adaptIdentityFromFicha(
  raw: Record<string, unknown> | null | undefined,
  cif: string,
): IdentitySection | null {
  if (!raw) return null;
  const get = (k: string): unknown => raw[k];
  const cnaePrimary = (get('cnae_primary') as Record<string, unknown> | string | null) ?? null;
  const cnaeCode = typeof cnaePrimary === 'object' && cnaePrimary
    ? ((cnaePrimary as Record<string, unknown>)['code'] as string | null) ?? null
    : (cnaePrimary as string | null);
  const cnaeDescription = typeof cnaePrimary === 'object' && cnaePrimary
    ? ((cnaePrimary as Record<string, unknown>)['description'] as string | null) ?? null
    : null;
  const cnaeSection = typeof cnaePrimary === 'object' && cnaePrimary
    ? ((cnaePrimary as Record<string, unknown>)['section'] as string | null) ?? null
    : null;
  const cnaeDivision = typeof cnaePrimary === 'object' && cnaePrimary
    ? ((cnaePrimary as Record<string, unknown>)['division'] as string | null) ?? null
    : null;
  const identity: IdentitySection = {
    master_id: (get('master_id') as string | null) ?? null,
    cif_normalized: (get('cif') as string | null) ?? cif.toUpperCase(),
    status: (get('record_status') as 'active' | 'merged' | 'deprecated') ?? 'active',
    legal_name: (get('legal_name') as string | null) ?? null,
    commercial_name: (get('commercial_name') as string | null) ?? null,
    aliases: (get('aliases') as string[] | null) ?? [],
    country: (get('country') as string | null) ?? null,
    classification: {
      cnae_code: cnaeCode ?? null,
      cnae_description: cnaeDescription ?? null,
      cnae_section: cnaeSection ?? null,
      cnae_division: cnaeDivision ?? null,
    },
    location: {
      provincia: (get('province') as string | null) ?? null,
      municipio: (get('locality') as string | null) ?? null,
      codigo_postal: (get('postal_code') as string | null) ?? null,
      pais: (get('country') as string | null) ?? null,
    },
    contact: {
      web: (get('website') as string | null) ?? null,
      domain: (get('domain') as string | null) ?? null,
    },
    size: {
      employees_total: (get('employees_total') as number | null) ?? null,
      capital_social: (get('capital_social') as number | null) ?? null,
    },
    objeto_social: (get('corporate_purpose') as string | null) ?? null,
    officers_count: null,
    coverage: {
      core: true,
      ownership: false,
      officers: false,
      objeto_social: get('corporate_purpose') != null,
    },
    explainability: null,
    metadata: {} as IdentitySection['metadata'],
    // ---- F0.1 · superficie ampliada V2 ----
    activity: (get('activity') as string | null) ?? null,
    sectors: (get('sectors') as string[] | null) ?? [],
    address: (get('address') as string | null) ?? null,
    autonomous_community: (get('autonomous_community') as string | null) ?? null,
    description: (get('description') as string | null) ?? null,
    registry_status: {
      mercantile_status: (get('mercantile_status') as string | null) ?? null,
      record_status: (get('record_status') as string | null) ?? null,
      activity_status: (get('activity_status') as string | null) ?? null,
      legal_form: (get('legal_form') as string | null) ?? null,
      incorporation_date: (get('incorporation_date') as string | null) ?? null,
      is_listed: (get('is_listed') as boolean | null) ?? null,
      listed_market: (get('listed_market') as string | null) ?? null,
    },
    data_coverage: (get('data_coverage') as Record<string, boolean> | null) ?? {},
  };
  return identity;
}

export function CompanyFichaF01Client({ cif }: CompanyFichaF01ClientProps) {
  const cifUpper = cif.toUpperCase();
  // Mixed-access: identidad + perfil semántico son públicos; las secciones con
  // cifras (finanzas, valoración, señales, compradores, oportunidades) solo se
  // piden con sesión. `null` key = no fetch.
  const { isAuthenticated } = useAuth();

  // B-2.4 · Agregador: consolida `identity` + `financial-analysis` en 1 llamada.
  const {
    data: ficha,
    error: fichaError,
    isLoading: fichaLoading,
  } = useSWR<CompanyFicha | null>(
    ['ficha-b24-aggregate', cifUpper],
    () => intelligenceClient.ficha(cifUpper),
    FETCH_CONFIG,
  );

  const identity = ficha ? adaptIdentityFromFicha(ficha.identity, cifUpper) : null;
  const financialAnalysis = ficha?.finances ?? null;

  const { data: semantic } = useSWR<SemanticSection | null>(
    ['ficha-f01-semantic', cifUpper],
    () => intelligenceClient.semanticSection(cifUpper),
    FETCH_CONFIG,
  );
  const { data: financial } = useSWR<FinancialSection | null>(
    isAuthenticated ? ['ficha-f01-financial', cifUpper] : null,
    () => intelligenceClient.financialSection(cifUpper),
    FETCH_CONFIG,
  );
  const { data: valuation, isLoading: valuationLoading } = useSWR<ValuationAnalysis | null>(
    isAuthenticated ? ['ficha-f03-valuation', cifUpper] : null,
    () => intelligenceClient.valuation(cifUpper),
    FETCH_CONFIG,
  );
  const { data: signal } = useSWR<SignalAnalysis | null>(
    isAuthenticated ? ['ficha-f01-signal', cifUpper] : null,
    () => intelligenceClient.signalAnalyze(cifUpper),
    FETCH_CONFIG,
  );
  const { data: buyers } = useSWR<RecommendationSet | null>(
    isAuthenticated ? ['ficha-f01-buyers', cifUpper] : null,
    () => intelligenceClient.buyers(cifUpper),
    FETCH_CONFIG,
  );
  const { data: opportunities } = useSWR<RecommendationSet | null>(
    isAuthenticated ? ['ficha-f01-opportunities', cifUpper] : null,
    () => intelligenceClient.opportunities(cifUpper),
    FETCH_CONFIG,
  );

  if (fichaLoading) {
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

  if (fichaError) {
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
    <CompanyFichaLayoutV2
      identity={identity}
      financial={financial ?? null}
      financialAnalysis={financialAnalysis}
      financialAnalysisLoading={fichaLoading}
      valuation={valuation ?? null}
      valuationLoading={valuationLoading}
      semantic={semantic ?? null}
      signal={signal ?? null}
      buyers={buyers ?? null}
      opportunities={opportunities ?? null}
      authenticated={isAuthenticated}
    />
  );
}
