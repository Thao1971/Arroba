'use client';
/**
 * CompanyHeader (Sprint F0.1) — orquestador del Header canónico de la
 * Ficha de Empresa. Compone COMP-1001..COMP-1005 + COMP-1010 (stub).
 *
 * NO tiene COMP-ID propio (es un contenedor de layout, no un componente ACC).
 * La regla R14 aplica sólo a componentes con COMP-ID declarado en el ACC.
 *
 * Layout: reproduce fielmente el hero del ZIP (`ce-app.jsx`):
 *   - Fila 1 · Identity + Quick Actions
 *   - Fila 2 · Context + Public Status
 *   - Fila 3 · Executive Snapshot (KPIs)
 *   - Fila 4 · User Relationship (BLOCKED · stub)
 */
import type {
  FinancialSection,
  IdentitySection,
} from '@/lib/companies/intelligence-types';

import { CompanyIdentity } from './CompanyIdentity';
import { CompanyContext } from './CompanyContext';
import { CompanyPublicStatus } from './CompanyPublicStatus';
import { CompanyQuickActions } from './CompanyQuickActions';
import { ExecutiveSnapshot } from './ExecutiveSnapshot';
import { UserRelationship } from './UserRelationship';
import { HEADER_TESTIDS } from '../_lib/testids';

export interface CompanyHeaderProps {
  identity: IdentitySection;
  financial: FinancialSection | null;
  cif: string;
}

export function CompanyHeader({ identity, financial, cif }: CompanyHeaderProps) {
  return (
    <header
      data-testid={HEADER_TESTIDS.root}
      className="w-full bg-surface-muted border-b border-border-default"
    >
      <div className="max-w-[1760px] mx-auto px-6 py-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <CompanyIdentity identity={identity} />
          </div>
          <CompanyQuickActions cif={cif} />
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-between">
          <CompanyContext identity={identity} />
          <CompanyPublicStatus identity={identity} />
        </div>
        <ExecutiveSnapshot identity={identity} financial={financial} />
        <UserRelationship />
      </div>
    </header>
  );
}
