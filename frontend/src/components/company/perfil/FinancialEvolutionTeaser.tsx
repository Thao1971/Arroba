'use client';
/**
 * @componentId COMP-P-0002
 * @status PROVISIONAL
 * @section Perfil
 * @source ce-sections1.jsx (card "Evolución financiera" con CTA "Ver cifras exactas")
 * @endpoints POST /api/v1/financial-intelligence/analyze (evolution)
 * @acc_pending Pendiente de ratificación en ACC v0.2 (contradicción C2)
 *
 * COMP-P-0002 Financial Evolution Teaser — resumen textual + insight sobre la
 * evolución financiera con CTA a la sección Finanzas.
 *
 * P2 · Intelligence over data: no dibuja el chart aquí (eso vive en Finanzas).
 *      Es un teaser narrativo que orienta al usuario.
 * R4 · Zero calculation: no calcula CAGRs ni variaciones — sólo pinta si el
 *      proveedor lo entrega. Si no hay evolution → UnavailableBlock.
 */
import { ArrowRight, LineChart } from 'lucide-react';
import { Tooltip } from '@/components/ds';
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';
import { cn } from '@/lib/cn';
import type { FinancialSection } from '@/lib/companies/intelligence-types';
import { PERFIL_TESTIDS } from '../_lib/testids';

export interface FinancialEvolutionTeaserProps {
  financial: FinancialSection | null;
  onOpenFinanzas?: () => void;
}

export function FinancialEvolutionTeaser({
  financial,
  onOpenFinanzas,
}: FinancialEvolutionTeaserProps) {
  const evolution = financial?.evolution ?? null;
  const years = evolution?.years ?? [];

  if (!evolution || years.length === 0) {
    return (
      <section data-testid={PERFIL_TESTIDS.evolutionTeaser}>
        <UnavailableBlock
          testId={`${PERFIL_TESTIDS.evolutionTeaser}-unavailable`}
          title="Evolución financiera no disponible"
          description="No hay series históricas verificables entregadas por el proveedor para esta empresa."
          req="Financial evolution · arroba-financial-v1"
        />
      </section>
    );
  }

  const yearsLabel = `${years[0]}–${years[years.length - 1]}`;
  const seriesLabels = evolution.series.map((s) => s.label).join(' · ');

  return (
    <section
      data-testid={PERFIL_TESTIDS.evolutionTeaser}
      className={cn(
        'rounded-2xl border border-border-default bg-surface-elevated p-6',
        'flex items-start gap-4 flex-wrap',
      )}
    >
      <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-surface-muted flex items-center justify-center text-text-muted" aria-hidden>
        <LineChart size={20} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-[240px] space-y-1">
        <Tooltip
          content={{
            description:
              'Series históricas entregadas por el proveedor sin cálculo intermedio en arroba.',
            source: financial?.metadata.source ?? undefined,
            updated_at: financial?.metadata.updated_at ?? undefined,
          }}
        >
          <div
            data-testid={`${PERFIL_TESTIDS.evolutionTeaser}-title`}
            className="font-display text-h5 font-bold text-text-primary"
          >
            Evolución financiera · {yearsLabel}
          </div>
        </Tooltip>
        <p
          data-testid={`${PERFIL_TESTIDS.evolutionTeaser}-subtitle`}
          className="text-body-sm text-text-muted"
        >
          Series disponibles: {seriesLabels}
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenFinanzas}
        data-testid={`${PERFIL_TESTIDS.evolutionTeaser}-cta`}
        className={cn(
          'inline-flex items-center gap-2 self-center',
          'text-body-sm font-bold text-brand-primary',
          'px-4 py-2 rounded-lg border border-border-emphasis',
          'bg-surface-elevated hover:bg-surface-muted transition-colors duration-fast',
        )}
      >
        Ver cifras exactas
        <ArrowRight size={14} aria-hidden />
      </button>
    </section>
  );
}
