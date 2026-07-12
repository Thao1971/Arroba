'use client';
/**
 * CompanyCompanyHeaderBlock (F0.1b · layout container · sin COMP-ID).
 *
 * Reproduce el bloque "Company Header" del ZIP (ce-app.jsx · line 25-98):
 *   - breadcrumb Analizar / Empresas / <legal_name>
 *   - fila 1: avatar 52 + <CompanyIdentity/> + <CompanyContext/> · botones (Guardar / Seguir / ⋯)
 *   - fila 2: <CompanyOpportunityRow/>
 *
 * Los COMP-1001..1003 son componentes existentes (F0.1) — se importan y
 * componen aquí sin modificar su interior. R14 se cumple porque este
 * fichero es un contenedor sin COMP-ID.
 */
import Link from 'next/link';
import { ChevronRight, Bookmark, Bell, MoreHorizontal } from 'lucide-react';

import type { IdentitySection } from '@/lib/companies/intelligence-types';

import { CompanyIdentity } from '../header/CompanyIdentity';
import { CompanyContext } from '../header/CompanyContext';
import { CompanyOpportunityRow } from './CompanyOpportunityRow';

export interface CompanyHeaderBlockProps {
  identity: IdentitySection;
}

export function CompanyHeaderBlock({ identity }: CompanyHeaderBlockProps) {
  const legal = identity.legal_name ?? 'Empresa';
  return (
    <div
      data-testid="ficha-company-header"
      style={{
        background: 'var(--surface-muted, #F1EEE7)',
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: 'min(1760px, 95vw)',
          padding: '20px 28px',
        }}
      >
        {/* Breadcrumb */}
        <div
          data-testid="ficha-breadcrumb"
          className="flex items-center flex-wrap"
          style={{
            gap: '6px',
            fontSize: '12.5px',
            color: 'var(--text-secondary, #6B6B6B)',
            marginBottom: '14px',
          }}
        >
          <Link href="/analiza" style={{ color: 'inherit', textDecoration: 'none' }}>
            Analizar
          </Link>
          <ChevronRight size={12} aria-hidden />
          <Link href="/empresas" style={{ color: 'inherit', textDecoration: 'none' }}>
            Empresas
          </Link>
          <ChevronRight size={12} aria-hidden />
          <span style={{ color: 'var(--text-primary, #101010)', fontWeight: 600 }}>{legal}</span>
        </div>

        {/* Row 1: identity block + quick action mini-buttons */}
        <div
          className="flex items-start justify-between flex-wrap"
          style={{ gap: '20px' }}
        >
          <div className="flex-1 min-w-0 flex flex-col" style={{ gap: '2px' }}>
            <CompanyIdentity identity={identity} />
            <CompanyContext identity={identity} />
          </div>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <MiniButton icon={<Bookmark size={14} strokeWidth={1.9} />} label="Guardar" testId="ch-btn-guardar" />
            <MiniButton icon={<Bell size={14} strokeWidth={1.9} />} label="Seguir" testId="ch-btn-seguir" />
            <MiniButton icon={<MoreHorizontal size={14} strokeWidth={1.9} />} label="Más" testId="ch-btn-more" iconOnly />
          </div>
        </div>

        {/* Row 2: oportunidades + CTAs */}
        <CompanyOpportunityRow />
      </div>
    </div>
  );
}

function MiniButton({
  icon,
  label,
  testId,
  iconOnly,
}: {
  icon: React.ReactNode;
  label: string;
  testId: string;
  iconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      className="inline-flex items-center"
      style={{
        gap: '6px',
        padding: iconOnly ? '9px' : '9px 14px',
        borderRadius: '10px',
        background: 'var(--surface-elevated, #FFFFFF)',
        color: 'var(--text-primary, #101010)',
        border: '1px solid var(--border-default, rgba(0,0,0,0.08))',
        fontSize: '13.5px',
        fontWeight: 700,
      }}
    >
      {icon}
      {!iconOnly && label}
    </button>
  );
}
