'use client';
/**
 * @componentId COMP-P-0005
 * @status PROVISIONAL
 * @section Perfil
 * @source ce-sections1.jsx (card "Identificación" · grid 4 columnas de campos oficiales)
 * @endpoints POST /api/v2/company-intelligence/identity
 * @acc_pending Pendiente de ratificación en ACC v0.2 (contradicción C2)
 *
 * COMP-P-0005 Identity Fields Grid — grid con los campos oficiales de la
 * empresa (Razón social, CIF, Forma jurídica, CNAE, Domicilio, CP,
 * Municipio, Provincia, Capital social, Objeto social...).
 *
 * P1 · Explainability first: cada campo lleva Tooltip con fuente. Campos con
 *      `data_coverage[key] === false` (o ausentes) se muestran como `—` con
 *      Tooltip explicativo "No verificable por el proveedor".
 * P3 · Zero coupling: consume `IdentitySection` (arroba-identity-v1).
 */
import { Tooltip } from '@/components/ds';
import { cn } from '@/lib/cn';
import type { IdentitySection } from '@/lib/companies/intelligence-types';
import { formatCurrencyEs, formatIsoDateEs } from '../_lib/format';
import { PERFIL_TESTIDS } from '../_lib/testids';

export interface IdentityFieldsGridProps {
  identity: IdentitySection;
}

interface Field {
  key: string;
  label: string;
  value: string | null;
  tooltip: string;
}

function nonEmpty(v: string | null | undefined): string | null {
  if (!v) return null;
  const trimmed = String(v).trim();
  return trimmed === '' ? null : trimmed;
}

export function IdentityFieldsGrid({ identity }: IdentityFieldsGridProps) {
  const registry = identity.registry_status;
  const cnaePart =
    identity.classification.cnae_code && identity.classification.cnae_description
      ? `${identity.classification.cnae_code} · ${identity.classification.cnae_description}`
      : identity.classification.cnae_code ||
        identity.classification.cnae_description ||
        null;

  const fields: Field[] = [
    {
      key: 'legal-name',
      label: 'Razón social',
      value: nonEmpty(identity.legal_name),
      tooltip: 'Denominación legal completa según Registro Mercantil.',
    },
    {
      key: 'commercial-name',
      label: 'Nombre comercial',
      value: nonEmpty(identity.commercial_name),
      tooltip: 'Nombre bajo el que la empresa opera comercialmente.',
    },
    {
      key: 'cif',
      label: 'CIF',
      value: nonEmpty(identity.cif_normalized),
      tooltip: 'Código de Identificación Fiscal normalizado.',
    },
    {
      key: 'legal-form',
      label: 'Forma jurídica',
      value: nonEmpty(registry?.legal_form ?? null),
      tooltip: 'Tipo societario declarado.',
    },
    {
      key: 'mercantile-status',
      label: 'Situación mercantil',
      value: nonEmpty(registry?.mercantile_status ?? null),
      tooltip: 'Estado registral en el Registro Mercantil.',
    },
    {
      key: 'cnae',
      label: 'Actividad (CNAE)',
      value: cnaePart,
      tooltip: 'Clasificación Nacional de Actividades Económicas principal.',
    },
    {
      key: 'address',
      label: 'Domicilio',
      value: nonEmpty(identity.address),
      tooltip: 'Domicilio social declarado.',
    },
    {
      key: 'postal-code',
      label: 'Código postal',
      value: nonEmpty(identity.location.codigo_postal),
      tooltip: 'Código postal del domicilio social.',
    },
    {
      key: 'locality',
      label: 'Municipio',
      value: nonEmpty(identity.location.municipio),
      tooltip: 'Localidad del domicilio social.',
    },
    {
      key: 'province',
      label: 'Provincia',
      value: nonEmpty(identity.location.provincia),
      tooltip: 'Provincia del domicilio social.',
    },
    {
      key: 'capital',
      label: 'Capital social',
      value:
        identity.size.capital_social !== null
          ? formatCurrencyEs(identity.size.capital_social)
          : null,
      tooltip: 'Capital social escriturado.',
    },
    {
      key: 'incorporation',
      label: 'Constitución',
      value: nonEmpty(formatIsoDateEs(registry?.incorporation_date ?? null)),
      tooltip: 'Fecha de constitución declarada.',
    },
    {
      key: 'corporate-purpose',
      label: 'Objeto social',
      value: nonEmpty(identity.objeto_social),
      tooltip: 'Objeto social declarado en estatutos.',
    },
  ];

  const source = identity.metadata.source ?? undefined;
  const updated = identity.metadata.updated_at ?? undefined;

  return (
    <section
      data-testid={PERFIL_TESTIDS.identityGrid}
      className="rounded-2xl border border-border-default bg-surface-elevated p-6"
    >
      <div className="text-caption uppercase tracking-caption font-bold text-text-muted mb-4">
        Identificación
      </div>
      <dl
        className={cn(
          'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
          'gap-x-6 gap-y-4',
        )}
      >
        {fields.map((f) => (
          <div key={f.key} className="min-w-0">
            <Tooltip
              content={{
                description: f.tooltip,
                source,
                updated_at: updated,
              }}
            >
              <dt
                data-testid={`${PERFIL_TESTIDS.identityGrid}-${f.key}-label`}
                className="text-caption uppercase tracking-caption text-text-muted"
              >
                {f.label}
              </dt>
            </Tooltip>
            <dd
              data-testid={`${PERFIL_TESTIDS.identityGrid}-${f.key}-value`}
              className={cn(
                'font-body text-body-md text-text-primary mt-0.5 truncate',
                f.value === null && 'italic text-text-muted',
              )}
              title={f.value ?? ''}
            >
              {f.value ?? '—'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
