/**
 * intelligence-client — Cliente SWR-friendly de los endpoints canónicos
 * UI (`/api/companies/{cif}/section/*`) del `intelligence_layer` (B.6.f).
 *
 * Reglas críticas aplicadas:
 *   - Todas las llamadas al backend usan `REACT_APP_BACKEND_URL` (via
 *     `apiClient.request`).
 *   - Nunca se envían headers de proveedor externo (R12).
 *   - El frontend consume EXCLUSIVAMENTE `arroba-*-v1` (R5).
 *   - En 404 devolvemos `null` (silencioso, para degradar a UnavailableBlock).
 *     Los 401/403/5xx propagan como `ApiError` para que
 *     `SectionErrorBoundary` / `PermissionDenied` los pinten.
 */
import { apiRequest, ApiError } from '@/lib/api/client';
import type {
  CompanyFicha,
  FinancialAnalysis,
  FinancialSection,
  IdentitySection,
  RecommendationSet,
  SemanticSection,
  SignalAnalysis,
  ValuationAnalysis,
  ValuationSection,
} from './intelligence-types';

async function _get<T>(path: string): Promise<T | null> {
  try {
    return await apiRequest<T>(path, { method: 'GET' });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export const intelligenceClient = {
  identitySection: (cif: string) =>
    _get<IdentitySection>(`/api/companies/${encodeURIComponent(cif)}/section/identity`),

  financialSection: (cif: string) =>
    _get<FinancialSection>(`/api/companies/${encodeURIComponent(cif)}/section/financial`),

  /**
   * F0.2 · endpoint `/financial-analysis` (superficie más rica que
   * `/section/financial`) para la sección Finanzas: cuenta de resultados y
   * balance completos, cashflow real (o null→BLOCKED), evolution.points,
   * financial_quality + assessment + explainability para narrativa
   * source-grounded (P1).
   */
  financialAnalysis: (cif: string) =>
    _get<FinancialAnalysis>(`/api/companies/${encodeURIComponent(cif)}/financial-analysis`),

  /**
   * F0.3 · endpoint canónico `/valuation` (arroba-valuation-v1).
   * Devuelve method + multiple + EV/Equity + range + hypotheses + lineage +
   * confidence. bridge_components/scenarios/sensitivity son `null` en F0.3
   * (BLOCKED BY DATA hasta que el motor los exponga).
   */
  valuation: (cif: string) =>
    _get<ValuationAnalysis>(`/api/companies/${encodeURIComponent(cif)}/valuation`),

  valuationSection: (cif: string) =>
    _get<ValuationSection>(`/api/companies/${encodeURIComponent(cif)}/section/valuation`),

  semanticSection: (cif: string, limit = 10) =>
    _get<SemanticSection>(
      `/api/companies/${encodeURIComponent(cif)}/section/semantic?limit=${limit}`,
    ),

  /** §6.4 · señales (score + señales + counts). arroba-signal-v1. */
  signalAnalyze: (cif: string) =>
    _get<SignalAnalysis>(`/api/companies/${encodeURIComponent(cif)}/signals`),

  /** §6.6 · compradores encajados (con fit_dimensions + reason). arroba-recommendation-v1. */
  buyers: (cif: string, limit = 10) =>
    _get<RecommendationSet>(`/api/companies/${encodeURIComponent(cif)}/buyers?limit=${limit}`),

  /** §6.6 · oportunidades detectadas. arroba-recommendation-v1. */
  opportunities: (cif: string, limit = 10) =>
    _get<RecommendationSet>(`/api/companies/${encodeURIComponent(cif)}/opportunities?limit=${limit}`),

  /**
   * B-2.4 · agregador `/company/{cif}/ficha` (`arroba-ficha-v1`). Devuelve
   * `identity + finances + ownership + governance + events + ranking + market
   * + control_graph` en una sola llamada.
   *
   * HARDENING-015 (2026-08-13) · Mixed-access con opt-in explícito:
   *   - Anónimo por defecto (fail-closed): `authenticated=false` no envía flag.
   *   - Autenticado: pasar `authenticated: true` añade `?authenticated=true`.
   *     El backend valida sesión server-side y sólo desbloquea el shape
   *     completo si AMBAS condiciones se cumplen (cookie válida + flag).
   *   - El backend NUNCA confía en el flag por sí solo. La resolución final
   *     queda expuesta en el header `X-Ficha-Auth`.
   */
  ficha: (cif: string, authenticated = false) => {
    const qs = authenticated ? '?authenticated=true' : '';
    return _get<CompanyFicha>(`/api/companies/${encodeURIComponent(cif)}/ficha${qs}`);
  },
};

export type { IdentitySection, FinancialSection, FinancialAnalysis, ValuationAnalysis, ValuationSection, SemanticSection, SignalAnalysis, RecommendationSet, CompanyFicha };
