'use client';
/**
 * @componentId COMP-P-0001
 * @status PROVISIONAL
 * @section Perfil
 * @source ce-sections1.jsx (bloque "Resumen de compañía" · card oscura AI Summary)
 * @endpoints POST /api/v1/semantic-intelligence/profile (value_proposition + business_model)
 * @acc_pending Pendiente de ratificación en ACC v0.2 (contradicción C2 · Perfil sin COMP-IDs formales)
 *
 * COMP-P-0001 Company AI Summary — resumen narrativo generado por Arroba
 * sobre el perfil semántico. Reproduce fielmente el hero card oscuro del ZIP
 * ("Resumen de compañía") con el fondo `linear-gradient(135deg,#0C0C0E,#1A1A18)`.
 *
 * P1 · Explainability first: tooltip con fuente + confianza semántica.
 * P2 · Intelligence over data: la síntesis prevalece sobre los tags crudos.
 * Si el semantic profile viene vacío → renderiza `UnavailableBlock`.
 */
import { Sparkles } from 'lucide-react';
import { Tooltip } from '@/components/ds';
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';
import { cn } from '@/lib/cn';
import type {
  IdentitySection,
  SemanticSection,
} from '@/lib/companies/intelligence-types';
import { PERFIL_TESTIDS } from '../_lib/testids';

export interface CompanyAiSummaryProps {
  semantic: SemanticSection | null;
  identity: IdentitySection;
}

export function CompanyAiSummary({ semantic, identity }: CompanyAiSummaryProps) {
  // Prioridad: value_proposition > business_model > identity.description
  const narrative =
    semantic?.value_proposition ??
    semantic?.business_model ??
    identity.description ??
    null;

  if (!narrative) {
    return (
      <section data-testid={PERFIL_TESTIDS.aiSummary}>
        <UnavailableBlock
          testId={`${PERFIL_TESTIDS.aiSummary}-unavailable`}
          title="Resumen de compañía no disponible"
          description="El motor semántico no ha generado todavía una síntesis verificable para esta empresa."
          req="Semantic profile · arroba-semantic-v1"
        />
      </section>
    );
  }

  const source =
    semantic?.metadata.source ?? identity.metadata.source ?? undefined;
  const updated =
    semantic?.metadata.updated_at ?? identity.metadata.updated_at ?? undefined;

  return (
    <section
      data-testid={PERFIL_TESTIDS.aiSummary}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-neutral-950 to-neutral-800',
        'p-7 md:p-8',
      )}
    >
      <span
        aria-hidden
        className="absolute -right-4 -top-8 text-[9rem] font-black leading-none text-brand-primary/10 pointer-events-none select-none"
      >
        ✦
      </span>
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand-primary text-white"
            aria-hidden
          >
            <Sparkles size={14} strokeWidth={2.5} />
          </span>
          <Tooltip
            content={{
              description:
                'Síntesis generada por Arroba a partir del perfil semántico verificable de la empresa.',
              source,
              updated_at: updated,
            }}
          >
            <span
              data-testid={`${PERFIL_TESTIDS.aiSummary}-label`}
              className="text-caption font-bold uppercase tracking-caption text-white/90"
            >
              Resumen de compañía · Arroba
            </span>
          </Tooltip>
        </div>
        <p
          data-testid={`${PERFIL_TESTIDS.aiSummary}-narrative`}
          className="text-body-md md:text-body-lg leading-body text-white/85 max-w-3xl"
        >
          {narrative}
        </p>
      </div>
    </section>
  );
}
