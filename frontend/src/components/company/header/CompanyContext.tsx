'use client';
/**
 * @componentId COMP-1002
 * @status READY
 * @section Header
 * @source ce-app.jsx (línea de contexto: sector, CIF, ciudad, provincia, web)
 * @endpoints POST /api/v2/company-intelligence/identity (vía intelligence_layer)
 * @acc ACC_v0.1.md §4.2 · Company Context
 *
 * COMP-1002 Company Context — contexto operativo de la empresa (sector,
 * CNAE, forma jurídica, actividad, edad, ubicación, web oficial).
 *
 * Renderiza únicamente los campos verificables desde
 * `IdentitySection`. Cualquier campo ausente se omite (no se inventa).
 */
import { Building2, MapPin, ExternalLink, Layers } from 'lucide-react';
import { Tooltip } from '@/components/ds';
import type { IdentitySection } from '@/lib/companies/intelligence-types';
import { yearsSince, formatIsoDateEs } from '../_lib/format';
import { HEADER_TESTIDS } from '../_lib/testids';

export interface CompanyContextProps {
  identity: IdentitySection;
}

export function CompanyContext({ identity }: CompanyContextProps) {
  const cnaeDesc = identity.classification.cnae_description;
  const cnaeCode = identity.classification.cnae_code;
  const activity = identity.activity;
  const legalForm = identity.registry_status?.legal_form ?? null;
  const incorporation = identity.registry_status?.incorporation_date ?? null;
  const municipio = identity.location.municipio;
  const provincia = identity.location.provincia;
  const web = identity.contact.web ?? null;
  const domain = identity.contact.domain;
  const sectors = identity.sectors ?? [];

  const ageYears = yearsSince(incorporation);

  const items: Array<{ icon: React.ReactNode; label: string; testId: string; tooltip?: string }> = [];
  if (activity || cnaeDesc) {
    items.push({
      icon: <Building2 size={13} aria-hidden />,
      label: `${activity ?? cnaeDesc}${cnaeCode ? ` · CNAE ${cnaeCode}` : ''}`,
      testId: `${HEADER_TESTIDS.context}-activity`,
      tooltip: cnaeDesc && cnaeDesc !== activity ? `CNAE: ${cnaeDesc}` : undefined,
    });
  }
  if (legalForm) {
    items.push({
      icon: <Layers size={13} aria-hidden />,
      label: legalForm,
      testId: `${HEADER_TESTIDS.context}-legal-form`,
      tooltip: incorporation
        ? `Constituida el ${formatIsoDateEs(incorporation)}${ageYears !== null ? ` (${ageYears} años)` : ''}`
        : undefined,
    });
  }
  if (municipio || provincia) {
    const location = [municipio, provincia].filter(Boolean).join(', ');
    items.push({
      icon: <MapPin size={13} aria-hidden />,
      label: location,
      testId: `${HEADER_TESTIDS.context}-location`,
    });
  }

  return (
    <section
      data-testid={HEADER_TESTIDS.context}
      className="flex items-center gap-2 flex-wrap text-text-muted"
      style={{ fontSize: '12.5px', lineHeight: 1.3 }}
    >
      {items.map((item) => {
        const chip = (
          <span
            key={item.testId}
            data-testid={item.testId}
            className="inline-flex items-center gap-1"
          >
            {item.icon}
            {item.label}
          </span>
        );
        return item.tooltip ? (
          <Tooltip key={item.testId} content={{ description: item.tooltip }}>
            {chip}
          </Tooltip>
        ) : (
          chip
        );
      })}
      {sectors.length > 0 && (
        <div
          data-testid={`${HEADER_TESTIDS.context}-sectors`}
          className="inline-flex items-center gap-1 flex-wrap"
        >
          {sectors.slice(0, 3).map((s) => (
            <span
              key={s}
              className="font-medium text-text-primary bg-surface-muted border border-border-default rounded-full"
              style={{ fontSize: '11px', padding: '0 8px', lineHeight: 1.6 }}
            >
              {s}
            </span>
          ))}
        </div>
      )}
      {web && (
        <a
          href={web}
          target="_blank"
          rel="noreferrer"
          data-testid={`${HEADER_TESTIDS.context}-website`}
          className="inline-flex items-center gap-1 text-brand-primary font-semibold hover:underline"
        >
          <ExternalLink size={12} aria-hidden />
          {domain ?? web}
        </a>
      )}
    </section>
  );
}
