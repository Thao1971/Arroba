'use client';
/**
 * CompanyFichaLayout (F0.1b · shell canónico · sin COMP-ID).
 *
 * Shell principal de la Ficha de Empresa. Reproduce fielmente el árbol del
 * ZIP (`ce-app.jsx`):
 *
 *   Topbar ────────────────────────────────────
 *   CompanyHeaderBlock (breadcrumb + fila1 + fila2)
 *   DealBanner (rojo)
 *   ┌──────────────────────────────────────────┐
 *   │ SectionNav │  Content     │ DealPanel    │
 *   │  210px     │  minmax(0,1fr)│  360px       │
 *   └──────────────────────────────────────────┘
 *   ComposerStub (fixed bottom-right)
 *
 * Este componente NO consume datos; recibe `identity`, `financial`,
 * `semantic` desde el cliente SWR (`CompanyFichaF01Client`) y los pasa a los
 * COMP existentes (COMP-1001..1003 en el header, COMP-P-0001..0006 en el
 * perfil). R14 no aplica (contenedor de layout).
 */
import { useState } from 'react';
import type {
  FinancialAnalysis,
  FinancialSection,
  IdentitySection,
  SemanticSection,
} from '@/lib/companies/intelligence-types';

import { CompanyPerfil } from '../perfil/CompanyPerfil';
import { CompanyFinanzas } from '../finanzas/CompanyFinanzas';

import { CompanyTopbar } from './CompanyTopbar';
import { CompanyHeaderBlock } from './CompanyHeaderBlock';
import { CompanyDealBanner } from './CompanyDealBanner';
import { CompanySectionNav, type SectionKey } from './CompanySectionNav';
import { CompanyDealPanel } from './CompanyDealPanel';
import { CompanyComposerStub } from './CompanyComposerStub';
import { SectionPlaceholder } from './SectionPlaceholder';

export interface CompanyFichaLayoutProps {
  cif: string;
  identity: IdentitySection;
  financial: FinancialSection | null;
  financialAnalysis: FinancialAnalysis | null;
  financialAnalysisLoading?: boolean;
  semantic: SemanticSection | null;
}

export function CompanyFichaLayout({
  cif,
  identity,
  financial,
  financialAnalysis,
  financialAnalysisLoading,
  semantic,
}: CompanyFichaLayoutProps) {
  const [section, setSection] = useState<SectionKey>('resumen');

  return (
    <div
      data-testid="ficha-f01-root"
      style={{
        minHeight: '100vh',
        background: 'var(--surface-primary, #F7F5F0)',
      }}
    >
      <CompanyTopbar />
      <CompanyHeaderBlock identity={identity} />
      <CompanyDealBanner active />
      <div
        data-testid="ficha-main-grid"
        className="mx-auto"
        style={{
          maxWidth: 'min(1760px, 95vw)',
          padding: '24px 28px 80px',
          display: 'grid',
          gridTemplateColumns: '210px minmax(0px, 1fr) 360px',
          gap: '32px',
        }}
      >
        <CompanySectionNav section={section} onChange={setSection} />

        <div data-testid="ficha-content" style={{ minWidth: 0 }}>
          {section === 'resumen' && (
            <div
              data-testid="ficha-content-resumen"
              className="flex flex-col"
              style={{ gap: '18px' }}
            >
              <CompanyPerfil
                identity={identity}
                financial={financial}
                semantic={semantic}
                onOpenFinanzas={() => setSection('finanzas')}
              />
            </div>
          )}
          {section === 'finanzas' && (
            <CompanyFinanzas
              cif={cif}
              analysis={financialAnalysis}
              loading={financialAnalysisLoading}
            />
          )}
          {section !== 'resumen' && section !== 'finanzas' && (
            <SectionPlaceholder section={section} />
          )}
        </div>

        <CompanyDealPanel />
      </div>
      <CompanyComposerStub />
    </div>
  );
}
