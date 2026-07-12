'use client';
/**
 * @componentId COMP-1003
 * @status READY
 * @section Header
 * @source ce-app.jsx (chips de estado: Auditada, Activa, Cotizada, Deal)
 * @endpoints POST /api/v2/company-intelligence/identity (vía intelligence_layer)
 * @acc ACC_v0.1.md §4.3 · Company Public Status
 *
 * COMP-1003 Company Public Status — estado registral público de la empresa:
 * situación mercantil, situación de actividad, cotización y estado registral.
 *
 * Cada chip tiene su Tooltip con la fuente/actualización (P1 Explainability
 * first). Cuando `registry_status` es `null` renderiza `UnavailableBlock`
 * inline delgado, sin ocultar la ausencia.
 */
import { Activity, Landmark, Shield, TrendingUp } from 'lucide-react';
import { Tooltip } from '@/components/ds';
import { cn } from '@/lib/cn';
import type { IdentitySection } from '@/lib/companies/intelligence-types';
import { HEADER_TESTIDS } from '../_lib/testids';

export interface CompanyPublicStatusProps {
  identity: IdentitySection;
}

function statusVariant(status: string | null | undefined): {
  color: string;
  bg: string;
  border: string;
} {
  const s = (status ?? '').toLowerCase();
  if (
    s.includes('activ') ||
    s.includes('inscri') ||
    s.includes('vigente') ||
    s.includes('en actividad')
  ) {
    return {
      color: 'text-success',
      bg: 'bg-success-subtle',
      border: 'border-success/30',
    };
  }
  if (s.includes('baja') || s.includes('cancel') || s.includes('extin')) {
    return {
      color: 'text-danger',
      bg: 'bg-danger-subtle',
      border: 'border-danger/30',
    };
  }
  return {
    color: 'text-text-muted',
    bg: 'bg-surface-muted',
    border: 'border-border-default',
  };
}

export function CompanyPublicStatus({ identity }: CompanyPublicStatusProps) {
  const registry = identity.registry_status;
  const chips: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    tooltip: string;
    variant: ReturnType<typeof statusVariant>;
  }> = [];

  if (registry?.mercantile_status) {
    chips.push({
      key: 'mercantile',
      label: registry.mercantile_status,
      icon: <Landmark size={12} aria-hidden />,
      tooltip: 'Situación mercantil según Registro Mercantil.',
      variant: statusVariant(registry.mercantile_status),
    });
  }
  if (registry?.activity_status) {
    chips.push({
      key: 'activity',
      label: registry.activity_status,
      icon: <Activity size={12} aria-hidden />,
      tooltip: 'Situación de actividad declarada.',
      variant: statusVariant(registry.activity_status),
    });
  }
  if (registry?.record_status) {
    chips.push({
      key: 'record',
      label: registry.record_status,
      icon: <Shield size={12} aria-hidden />,
      tooltip: 'Estado del expediente en el registro.',
      variant: statusVariant(registry.record_status),
    });
  }
  if (registry?.is_listed) {
    chips.push({
      key: 'listed',
      label: registry.listed_market
        ? `Cotizada · ${registry.listed_market}`
        : 'Cotizada',
      icon: <TrendingUp size={12} aria-hidden />,
      tooltip: 'La empresa cotiza en un mercado organizado.',
      variant: statusVariant('activa'),
    });
  }

  if (chips.length === 0) {
    return (
      <section
        data-testid={HEADER_TESTIDS.publicStatus}
        className="text-caption text-text-muted italic"
      >
        Estado público sin información verificable.
      </section>
    );
  }

  return (
    <section
      data-testid={HEADER_TESTIDS.publicStatus}
      className="flex items-center gap-2 flex-wrap"
    >
      {chips.map((chip) => (
        <Tooltip
          key={chip.key}
          content={{
            description: chip.tooltip,
            source: identity.metadata.source ?? undefined,
            updated_at: identity.metadata.updated_at ?? undefined,
          }}
        >
          <span
            data-testid={`${HEADER_TESTIDS.publicStatus}-${chip.key}`}
            className={cn(
              'inline-flex items-center gap-1.5',
              'text-caption font-semibold px-2 py-0.5 rounded border',
              chip.variant.color,
              chip.variant.bg,
              chip.variant.border,
            )}
          >
            {chip.icon}
            {chip.label}
          </span>
        </Tooltip>
      ))}
    </section>
  );
}
