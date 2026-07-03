'use client';
/**
 * IdentityCard — sub-componente del módulo Identidad (ENTITY_FRAMEWORK §3.2
 * "identidad" en la Company Page canónica).
 *
 * Muestra los hechos identificativos planos de una empresa: CIF, nombre,
 * sector, territorio, empleados y antigüedad. Uniforme por prop `identity`.
 *
 * Estados canónicos:
 *   - data (default): renderiza los campos disponibles.
 *   - loading: skeleton (usa LoadingBlock a nivel superior).
 *   - empty: cuando faltan todos los campos, muestra EmptyStateBlock.
 */
import { Building2, MapPin, Users, CalendarClock, IdCard } from 'lucide-react';
import { cn } from '@/lib/cn';
import { EmptyStateBlock } from './EmptyStateBlock';

export interface IdentityCardIdentity {
  master_company_id: string;
  cif: string | null;
  legal_name: string;
  sector: string | null;
  region: string | null;
  country: string;
  founded_year: number | null;
  employees: number | null;
}

export interface IdentityCardProps {
  identity: IdentityCardIdentity | null;
  className?: string;
  testId?: string;
}

interface Field {
  label: string;
  value: string;
  icon: typeof Building2;
}

function buildFields(identity: IdentityCardIdentity): Field[] {
  const currentYear = new Date().getFullYear();
  const antiquity =
    identity.founded_year !== null && identity.founded_year > 0
      ? `${currentYear - identity.founded_year} años`
      : null;
  const rows: Array<Field | null> = [
    identity.cif
      ? { label: 'CIF', value: identity.cif, icon: IdCard }
      : null,
    identity.sector
      ? { label: 'Sector', value: identity.sector, icon: Building2 }
      : null,
    identity.region
      ? {
          label: 'Territorio',
          value: `${identity.region}${identity.country ? ` · ${identity.country}` : ''}`,
          icon: MapPin,
        }
      : null,
    identity.employees !== null && identity.employees !== undefined
      ? {
          label: 'Empleados',
          value: identity.employees.toLocaleString('es-ES'),
          icon: Users,
        }
      : null,
    antiquity
      ? { label: 'Antigüedad', value: antiquity, icon: CalendarClock }
      : null,
  ];
  return rows.filter((r): r is Field => r !== null);
}

export function IdentityCard({
  identity,
  className,
  testId = 'identity-card',
}: IdentityCardProps) {
  if (!identity) {
    return (
      <EmptyStateBlock
        testId={`${testId}-empty`}
        title="Sin datos de identidad"
        description="No hemos podido cargar los datos identificativos de esta empresa."
      />
    );
  }

  const fields = buildFields(identity);

  if (fields.length === 0) {
    return (
      <EmptyStateBlock
        testId={`${testId}-empty`}
        title="Sin datos de identidad"
        description="No hemos podido cargar los datos identificativos de esta empresa."
      />
    );
  }

  return (
    <dl
      data-testid={testId}
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
        'rounded-2xl border border-border-default bg-surface p-6',
        className,
      )}
    >
      {fields.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          data-testid={`${testId}-${label.toLowerCase()}`}
          className="flex items-start gap-3"
        >
          <div className="rounded-lg p-2 bg-surface-muted text-text-secondary shrink-0" aria-hidden>
            <Icon size={18} strokeWidth={1.6} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <dt className="text-caption uppercase tracking-caption text-text-muted">
              {label}
            </dt>
            <dd className="text-body font-medium text-text-primary truncate">
              {value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
