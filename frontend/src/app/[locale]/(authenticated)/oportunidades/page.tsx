'use client';
/**
 * Página "Oportunidades" (comprador) — F0.x.
 *
 * Ver DIAGNOSTICO_PAGINA_OPORTUNIDADES.md (arroba.com/, 2026-08-20) para la
 * auditoría completa. Resumen de lo que esta página hace y NO hace:
 *
 *  - Consume el mandato de compra real del usuario (`/api/mandates/mine`) y,
 *    para el mandato activo, el motor real mandato→universo
 *    (`/api/mandates/{id}/targets`, proxy a Intel `buyer-mandates`).
 *  - Cada tarjeta es UNA empresa candidata rankeada contra el mandato — no
 *    el objeto "Oportunidad" multi-empresa del Blueprint v1.2 (ese motor
 *    de agrupación — Situation Engine — no está confirmado como construido;
 *    ver adenda del diagnóstico). No se inventa esa capa aquí.
 *  - Estado "sin tesis": lleva a crear un mandato, no genera datos falsos.
 *  - "Ver oportunidad" navega a `/oportunidad/{master_id}` (ficha de detalle
 *    de la candidata — F0.x, adaptación de `_design_intake/opportunity`).
 */
import { useMemo, useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Target } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import {
  EmptyStateBlock,
  LoadingBlock,
  ErrorBlock,
  CompanyCardsGridBlock,
  type CompanyCardsGridItem,
} from '@/components/blocks';
import {
  apiClient,
  type Mandate,
  type MandateTargetsResponse,
} from '@/lib/api/client';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { useEntityContext } from '@/components/copilot/CopilotProvider';

function mandateSummary(m: Mandate): string {
  const parts: string[] = [];
  if (m.target_cnae_sections?.length) parts.push(m.target_cnae_sections.join(', '));
  else if (m.target_cnae_codes?.length) parts.push(m.target_cnae_codes.join(', '));
  if (m.revenue_min != null || m.revenue_max != null) {
    const lo = m.revenue_min != null ? `${(m.revenue_min / 1e6).toFixed(1)}M€` : '—';
    const hi = m.revenue_max != null ? `${(m.revenue_max / 1e6).toFixed(1)}M€` : '—';
    parts.push(`Facturación ${lo} – ${hi}`);
  }
  if (m.target_provincias?.length) parts.push(m.target_provincias.join(', '));
  return parts.join(' · ') || 'Sin criterios específicos de sector, tamaño o geografía';
}

export default function OportunidadesPage() {
  return (
    <RequireAuth>
      <OportunidadesContent />
    </RequireAuth>
  );
}

function OportunidadesContent() {
  const router = useRouter();
  const { activeOrgId } = useActiveOrg();
  const { publish } = useEntityContext();

  const mandatesKey = activeOrgId ? ['/api/mandates/mine', activeOrgId] : null;
  const {
    data: mandates,
    isLoading: mandatesLoading,
    error: mandatesError,
  } = useSWR<Mandate[]>(
    mandatesKey,
    () => apiClient.mandates.listMine(activeOrgId, 'active'),
    { revalidateOnFocus: false }
  );

  const activeMandate = mandates?.[0] ?? null;

  const targetsKey = activeMandate ? ['/api/mandates/targets', activeMandate.id] : null;
  const {
    data: targetsResp,
    isLoading: targetsLoading,
    error: targetsError,
  } = useSWR<MandateTargetsResponse>(
    targetsKey,
    () => apiClient.mandates.targets(activeMandate!.id, 30),
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!activeMandate) return;
    publish({
      entity_type: 'mandate',
      entity_id: activeMandate.id,
      entity_name: activeMandate.name,
    });
    return () => publish(null);
  }, [activeMandate, publish]);

  const items: CompanyCardsGridItem[] = useMemo(() => {
    if (!targetsResp?.targets) return [];
    return targetsResp.targets.map((t) => ({
      masterCompanyId: t.master_id,
      name: t.name || t.master_id,
      sector: t.sector ?? null,
      region: t.location ?? null,
      score: (t.score ?? 0) / 100,
      // Tipo de oportunidad real primero (role_label), luego el porqué —
      // CompanyCardsGridBlock no tiene un slot de badge propio, así que se
      // antepone al texto en vez de inventar un campo nuevo en el bloque compartido.
      reason: t.role_label ? `${t.role_label} — ${t.explanation ?? ''}`.trim() : t.explanation ?? null,
    }));
  }, [targetsResp]);

  const isLoading = mandatesLoading || (!!activeMandate && targetsLoading);
  const error = mandatesError || targetsError;

  return (
    <div
      data-testid="oportunidades-page"
      className="mx-auto max-w-6xl px-6 py-10 md:py-12 space-y-8"
    >
      <header className="space-y-2">
        <p className="text-caption uppercase tracking-caption text-text-muted">
          Comprar / Vender · Oportunidades
        </p>
        {activeMandate && targetsResp ? (
          <>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary leading-tight">
              Hemos encontrado {targetsResp.count} candidata
              {targetsResp.count === 1 ? '' : 's'} que encaja
              {targetsResp.count === 1 ? '' : 'n'} con tu mandato «{activeMandate.name}»
            </h1>
            <p className="text-body-lg text-text-secondary max-w-2xl">
              {mandateSummary(activeMandate)}
            </p>
            <Link
              href={`/oportunidades/mandato/${activeMandate.id}`}
              className="inline-block text-caption font-medium text-brand-primary hover:underline"
            >
              Ver / editar mi mandato →
            </Link>
          </>
        ) : (
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary leading-tight">
            Oportunidades
          </h1>
        )}
      </header>

      {isLoading && <LoadingBlock testId="oportunidades-loading" />}

      {!isLoading && error && (
        <ErrorBlock
          title="No hemos podido cargar tus oportunidades"
          message="Ha fallado la conexión con el motor de mandatos. Inténtalo de nuevo en un momento."
          testId="oportunidades-error"
        />
      )}

      {!isLoading && !error && !activeMandate && (
        <EmptyStateBlock
          icon={Compass}
          title="Aún no tienes un mandato de compra activo"
          description="Arroba necesita saber qué buscas — sector, tamaño y geografía — para poder mostrarte empresas candidatas reales en vez de un listado genérico."
          action={
            <Link
              href="/oportunidades/mandato/nuevo"
              className="inline-flex items-center rounded-lg bg-brand-primary px-4 py-2 text-body-sm font-medium text-white hover:opacity-90"
            >
              Crear mi mandato de compra
            </Link>
          }
          testId="oportunidades-sin-mandato"
        />
      )}

      {!isLoading && !error && activeMandate && targetsResp && items.length === 0 && (
        <EmptyStateBlock
          icon={Target}
          title="Ningún candidato supera la evidencia mínima con tu mandato actual"
          description="Hemos revisado el universo de empresas disponible y ninguna encaja con suficiente confianza. Puedes ampliar los criterios de tu mandato o revisarlo con tu copiloto."
          hint={`${targetsResp.candidates_scanned} empresas evaluadas.`}
          action={
            <Link
              href={`/oportunidades/mandato/${activeMandate.id}`}
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-body-sm font-medium text-text-primary hover:bg-surface-1"
            >
              Ampliar mi mandato
            </Link>
          }
          testId="oportunidades-vacio"
        />
      )}

      {!isLoading && !error && items.length > 0 && (
        <CompanyCardsGridBlock
          items={items}
          onPick={(item) =>
            router.push(
              `/oportunidad/${item.masterCompanyId}?mandato=${activeMandate!.id}`
            )
          }
          testId="oportunidades-grid"
        />
      )}
    </div>
  );
}
