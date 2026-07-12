'use client';
/**
 * CompanyPerfil (Sprint F0.1) — orquestador visual del bloque Perfil de
 * la Ficha de Empresa. Compone COMP-P-0001..0006 en el orden del ZIP.
 *
 * NO tiene COMP-ID propio (es un contenedor de layout). La regla R14 aplica
 * a cada COMP-P referenciado.
 */
import type {
  FinancialSection,
  IdentitySection,
  SemanticSection,
} from '@/lib/companies/intelligence-types';

import { CompanyAiSummary } from './CompanyAiSummary';
import { FinancialEvolutionTeaser } from './FinancialEvolutionTeaser';
import { PrimaryKpisGrid } from './PrimaryKpisGrid';
import { PositioningKpisGrid } from './PositioningKpisGrid';
import { IdentityFieldsGrid } from './IdentityFieldsGrid';
import { IntelligenceScoresRing } from './IntelligenceScoresRing';
import { PERFIL_TESTIDS } from '../_lib/testids';

export interface CompanyPerfilProps {
  identity: IdentitySection;
  financial: FinancialSection | null;
  semantic: SemanticSection | null;
  onOpenFinanzas?: () => void;
}

export function CompanyPerfil({
  identity,
  financial,
  semantic,
  onOpenFinanzas,
}: CompanyPerfilProps) {
  return (
    <div
      data-testid={PERFIL_TESTIDS.root}
      className="flex flex-col gap-5"
    >
      <CompanyAiSummary semantic={semantic} identity={identity} />
      <FinancialEvolutionTeaser
        financial={financial}
        onOpenFinanzas={onOpenFinanzas}
      />
      <PrimaryKpisGrid identity={identity} financial={financial} />
      <PositioningKpisGrid />
      <IdentityFieldsGrid identity={identity} />
      <IntelligenceScoresRing />
    </div>
  );
}
