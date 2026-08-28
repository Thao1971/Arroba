'use client';
/**
 * Ficha de detalle de una candidata de oportunidad — F0.x.
 *
 * Adaptación honesta de `_design_intake/opportunity/op-app.jsx` (confirmado
 * por Daniel como pantalla de destino de "Ver oportunidad", 2026-08-20).
 * Diferencia deliberada respecto al prototipo: esta ficha describe UNA
 * empresa candidata rankeada contra un mandato (dato real, vía
 * `/api/mandates/{id}/targets`), no un objeto "Oportunidad" multi-empresa —
 * ese agrupador (Situation Engine, Blueprint v1.2 P1/P2) no está confirmado
 * como construido. Las pestañas que dependerían de él se marcan
 * "Próximamente" en vez de simular contenido.
 */
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { LoadingBlock, ErrorBlock, EmptyStateBlock } from '@/components/blocks';
import { apiClient, type MandateTarget, type MandateTargetsResponse } from '@/lib/api/client';
import { intelligenceClient } from '@/lib/companies/intelligence-client';
import type { SignalAnalysis } from '@/lib/companies/intelligence-types';
import { useEntityContext } from '@/components/copilot/CopilotProvider';

const TABS = [
  { id: 'resumen', label: 'Resumen', real: true },
  { id: 'empresas', label: 'Empresas', real: true },
  { id: 'senales', label: 'Señales', real: true },
  { id: 'compradores', label: 'Compradores', real: false },
  { id: 'inversores', label: 'Inversores', real: false },
  { id: 'plan', label: 'Plan', real: false },
  { id: 'actividad', label: 'Actividad', real: false },
] as const;

type TabId = (typeof TABS)[number]['id'];

function fitLabel(dim: string): string {
  const labels: Record<string, string> = {
    sector_fit: 'Sector',
    size_fit: 'Tamaño',
    geo_fit: 'Geografía',
    ownership_fit: 'Propiedad',
    opportunity_fit: 'Oportunidad',
  };
  return labels[dim] || dim;
}

export default function OportunidadDetallePage() {
  return (
    <RequireAuth>
      <OportunidadDetalleContent />
    </RequireAuth>
  );
}

function OportunidadDetalleContent() {
  const params = useParams<{ masterId: string }>();
  const searchParams = useSearchParams();
  const mandateId = searchParams.get('mandato');
  const masterId = params.masterId;
  const [tab, setTab] = useState<TabId>('resumen');
  const { publish } = useEntityContext();

  const { data: targetsResp, isLoading: targetsLoading, error: targetsError } = useSWR<MandateTargetsResponse>(
    mandateId ? ['/api/mandates/targets', mandateId] : null,
    () => apiClient.mandates.targets(mandateId!, 50),
    { revalidateOnFocus: false }
  );

  const target: MandateTarget | undefined = useMemo(
    () => targetsResp?.targets.find((t) => t.master_id === masterId),
    [targetsResp, masterId]
  );

  const { data: signals } = useSWR<SignalAnalysis | null>(
    tab === 'senales' && target?.cif ? ['/api/companies/signals', target.cif] : null,
    () => intelligenceClient.signalAnalyze(target!.cif!),
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!target) return;
    publish({ entity_type: 'company', entity_id: target.master_id, entity_name: target.name || undefined });
    return () => publish(null);
  }, [target, publish]);

  if (!mandateId) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <EmptyStateBlock
          title="Falta el contexto del mandato"
          description="Esta ficha muestra por qué una empresa encaja con un mandato de compra concreto. Entra desde la página de Oportunidades para verla con contexto."
          action={
            <Link
              href="/oportunidades"
              className="inline-flex items-center rounded-lg bg-brand-primary px-4 py-2 text-body-sm font-medium text-white hover:opacity-90"
            >
              Ir a Oportunidades
            </Link>
          }
          testId="oportunidad-sin-mandato"
        />
      </div>
    );
  }

  if (targetsLoading) return <div className="px-6 py-10"><LoadingBlock testId="oportunidad-loading" /></div>;
  if (targetsError) return <div className="px-6 py-10"><ErrorBlock title="No hemos podido cargar esta oportunidad" testId="oportunidad-error" /></div>;
  if (!target) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <EmptyStateBlock
          title="Esta candidata ya no aparece en tu mandato"
          description="Puede que el mandato haya cambiado de criterios desde que viste esta ficha."
          action={
            <Link href="/oportunidades" className="text-brand-primary font-medium hover:underline">
              Volver a Oportunidades
            </Link>
          }
          testId="oportunidad-no-encontrada"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:py-12 space-y-6">
      <p className="text-caption uppercase tracking-caption text-text-muted">
        <Link href="/oportunidades" className="hover:underline">
          Comprar / Vender
        </Link>{' '}
        / Oportunidades / {target.master_id}
      </p>
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          {target.role_label && (
            <span className="inline-flex items-center rounded-full bg-surface-2 px-3 py-1 text-caption font-medium uppercase tracking-caption text-text-secondary">
              {target.role_label}
            </span>
          )}
          <h1 className="font-display text-3xl font-semibold text-text-primary leading-tight">
            {target.name || target.master_id}
          </h1>
        </div>
        <p className="text-body-lg text-text-secondary max-w-2xl">
          {target.explanation || 'Sin explicación disponible para esta candidata.'}
        </p>
      </header>

      <nav className="flex gap-1 border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-body-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-brand-primary text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'resumen' && (
        <section className="space-y-4" data-testid="oportunidad-tab-resumen">
          <div className="rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-caption uppercase tracking-caption text-text-muted">
                Encaje con el mandato
              </span>
              <span className="font-display text-2xl font-semibold text-text-primary">
                {target.score != null ? Math.round(target.score) : '—'}
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(target.fit_dimensions).map(([dim, fit]) => (
                <div key={dim} className="space-y-1">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-text-secondary">{fitLabel(dim)}</span>
                    <span className="text-text-muted">
                      {fit.value != null ? String(fit.value) : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full"
                      style={{ width: `${Math.round((fit.score ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-caption text-text-muted">
              Método: {target.score_method || 'no especificado'}
            </p>
          </div>
        </section>
      )}

      {tab === 'empresas' && (
        <section data-testid="oportunidad-tab-empresas">
          <div className="rounded-xl border border-border p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">{target.name || target.master_id}</p>
              <p className="text-caption text-text-muted">
                {[target.sector, target.location].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
              </p>
            </div>
            {target.cif && (
              <Link
                href={`/empresa-f01/${target.cif}`}
                className="text-body-sm font-medium text-brand-primary hover:underline"
              >
                Ver ficha completa →
              </Link>
            )}
          </div>
        </section>
      )}

      {tab === 'senales' && (
        <section data-testid="oportunidad-tab-senales">
          {!target.cif && (
            <EmptyStateBlock
              title="No hay CIF disponible para consultar señales"
              description="Este dato solo está disponible en modo real del motor de mandatos."
              testId="senales-sin-cif"
            />
          )}
          {target.cif && !signals && <LoadingBlock testId="senales-loading" />}
          {target.cif && signals && signals.signals.length === 0 && (
            <EmptyStateBlock title="Sin señales detectadas para esta empresa" testId="senales-vacio" />
          )}
          {target.cif && signals && signals.signals.length > 0 && (
            <ul className="space-y-3">
              {signals.signals.map((s) => (
                <li key={s.signal_id} className="rounded-xl border border-border p-4">
                  <p className="font-medium text-text-primary">{s.title || s.signal_type}</p>
                  <p className="text-caption text-text-muted">
                    {s.category} · confianza {s.confidence != null ? `${Math.round(s.confidence * 100)}%` : '—'}
                  </p>
                  {s.explanation && <p className="text-body-sm text-text-secondary mt-1">{s.explanation}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {(tab === 'compradores' || tab === 'inversores' || tab === 'plan' || tab === 'actividad') && (
        <EmptyStateBlock
          title="Próximamente"
          description="Esta sección requiere el Motor de Situaciones y el Buyer & Capital Graph (Opportunity Intelligence System v1.2, fases P1/P2), que todavía no están confirmados como construidos. No mostramos datos simulados."
          testId={`oportunidad-tab-${tab}-proximamente`}
        />
      )}
    </div>
  );
}
