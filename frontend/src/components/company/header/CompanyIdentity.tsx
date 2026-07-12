'use client';
/**
 * @componentId COMP-1001
 * @status READY
 * @section Header
 * @source ce-sections1.jsx (bloque "Identity" del header) + ce-app.jsx (cabecera empresa)
 * @endpoints POST /api/v2/company-intelligence/identity (vía intelligence_layer)
 * @acc ACC_v0.1.md §4.1 · Company Identity
 *
 * COMP-1001 Company Identity — nombre legal, comercial, CIF, país y avatar
 * corporativo. Es el bloque de identificación inequívoca de la empresa dentro
 * de la Ficha. Reproduce fielmente el ZIP (`ce-app.jsx` cabecera empresa).
 *
 * P1 · Explainability first: usa `Tooltip` para exponer fuente + actualización.
 * P2 · Intelligence over data: los aliases quedan en badge; el foco es
 *       el nombre legal + comercial jerarquizados.
 * P3 · Zero coupling: consume `IdentitySection` (arroba-identity-v1), NUNCA
 *       el shape crudo del proveedor externo.
 */
import { CheckCircle2 } from 'lucide-react';
import { Tooltip } from '@/components/ds';
import { cn } from '@/lib/cn';
import type { IdentitySection } from '@/lib/companies/intelligence-types';
import { HEADER_TESTIDS } from '../_lib/testids';

export interface CompanyIdentityProps {
  identity: IdentitySection;
}

function initialsFromName(name: string | null | undefined): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const second = words[1]?.[0] ?? '';
  return (first + second).toUpperCase() || '?';
}

export function CompanyIdentity({ identity }: CompanyIdentityProps) {
  const legalName = identity.legal_name;
  const commercialName = identity.commercial_name;
  const cif = identity.cif_normalized;
  const verified = identity.coverage.core;
  // Prefiere iniciales del nombre comercial (el ZIP muestra "CT" para
  // "Castilla Termal Olmedo") sobre el nombre legal.
  const avatarInitials = initialsFromName(commercialName || legalName);

  return (
    <section
      data-testid={HEADER_TESTIDS.identity}
      className="flex items-start gap-4"
    >
      <div
        className={cn(
          'flex-shrink-0 w-[52px] h-[52px] rounded-xl',
          'bg-gradient-to-br from-[#E8001D] to-[#C0001A]',
          'flex items-center justify-center',
          'font-display font-black text-lg text-white',
        )}
        aria-hidden
        data-testid={`${HEADER_TESTIDS.identity}-avatar`}
      >
        {avatarInitials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1
            data-testid={`${HEADER_TESTIDS.identity}-legal-name`}
            className="font-display text-2xl font-extrabold text-text-primary leading-none truncate"
          >
            {legalName ?? '—'}
          </h1>
          {commercialName && commercialName !== legalName && (
            <span
              data-testid={`${HEADER_TESTIDS.identity}-commercial-name`}
              className="font-body text-body-sm font-semibold text-text-muted"
            >
              · {commercialName}
            </span>
          )}
          {verified && (
            <Tooltip
              content={{
                title: 'Empresa verificada',
                description:
                  'La identidad está contrastada contra registros oficiales.',
                source: identity.metadata.source ?? undefined,
                updated_at: identity.metadata.updated_at ?? undefined,
              }}
            >
              <span
                data-testid={`${HEADER_TESTIDS.identity}-verified`}
                className={cn(
                  'inline-flex items-center gap-1',
                  'text-caption font-semibold text-success',
                  'bg-success-subtle border border-success/30',
                  'px-2 py-0.5 rounded',
                )}
              >
                <CheckCircle2 size={12} aria-hidden /> Verificada
              </span>
            </Tooltip>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 flex-wrap text-body-sm text-text-muted">
          {cif && (
            <span data-testid={`${HEADER_TESTIDS.identity}-cif`}>
              CIF <span className="font-mono">{cif}</span>
            </span>
          )}
          {identity.country && (
            <>
              <span aria-hidden>·</span>
              <span data-testid={`${HEADER_TESTIDS.identity}-country`}>
                {identity.country}
              </span>
            </>
          )}
          {identity.aliases.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span
                data-testid={`${HEADER_TESTIDS.identity}-aliases`}
                className="italic"
                title={identity.aliases.join(', ')}
              >
                {identity.aliases.length} alias
              </span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
