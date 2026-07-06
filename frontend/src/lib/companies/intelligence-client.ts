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
  FinancialSection,
  IdentitySection,
  SemanticSection,
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

  valuationSection: (cif: string) =>
    _get<ValuationSection>(`/api/companies/${encodeURIComponent(cif)}/section/valuation`),

  semanticSection: (cif: string, limit = 10) =>
    _get<SemanticSection>(
      `/api/companies/${encodeURIComponent(cif)}/section/semantic?limit=${limit}`,
    ),
};

export type { IdentitySection, FinancialSection, ValuationSection, SemanticSection };
