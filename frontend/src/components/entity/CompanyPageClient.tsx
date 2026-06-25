'use client';
/**
 * CompanyPageClient — the entire authenticated/anonymous client surface of
 * `/empresa/{cif}`. Renders the eight sections of the ficha, hooks into the
 * Copilot's `entity_context` mode so the dock becomes "✦ Company Advisor de
 * {name}" and listens for `arroba:company-section-update` events emitted by
 * the provider after every Company Advisor turn — refreshing ONLY the
 * sections the LLM decided to update (per ARROBA_PHILOSOPHY.md §12 "La
 * ficha es la verdad").
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiClient, ApiError } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import {
  COMPANY_SECTION_UPDATE_EVENT,
  useCopilot,
} from '@/components/copilot/CopilotProvider';
import { CompanyHeader } from './CompanyHeader';
import { EntitySectionWrapper } from './EntitySectionWrapper';
import { LockedSectionBlur } from './LockedSectionBlur';
import { HeroBlock } from '@/components/blocks/HeroBlock';
import { MetricsBlock } from '@/components/blocks/MetricsBlock';
import { NarrativeBlock } from '@/components/blocks/NarrativeBlock';
import { RefreshButton } from '@/components/blocks/RefreshButton';
import { ValuationBlock } from '@/components/blocks/ValuationBlock';
import { CompanyCardsGridBlock } from '@/components/blocks/CompanyCardsGridBlock';
import { notify } from '@/lib/notify';
import type { BlockSpec, Workspace } from '@/lib/orchestrator/types';
import type {
  CompanyConversationMessage,
  CompanyDetailResponse,
  SectionId,
  SectionUpdate,
} from '@/lib/companies/types';

type AnyBlock = BlockSpec & { props: Record<string, unknown> };

export interface CompanyPageClientProps {
  cif: string;
  initial: CompanyDetailResponse;
  authenticated: boolean;
}

export function CompanyPageClient({
  cif,
  initial,
  authenticated,
}: CompanyPageClientProps) {
  const [sections, setSections] = useState(initial.sections);
  const [refreshingAnalysis, setRefreshingAnalysis] = useState(false);
  const [analysisCountdown, setAnalysisCountdown] = useState<number | null>(
    null,
  );
  const copilot = useCopilot();
  const { hydrateEntityConversation } = copilot;

  /* ---------- Hydrate Copilot conversation on mount ---------- */
  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    (async () => {
      try {
        const { messages } = await apiClient.companies.getConversation(cif);
        if (!active) return;
        hydrateEntityConversation(
          messages.map(toCopilotMessage),
          initial.header.name,
        );
      } catch {
        // Non-fatal: dock still works in entity mode, just without history.
      }
    })();
    return () => {
      active = false;
    };
  }, [authenticated, cif, initial.header.name, hydrateEntityConversation]);

  /* ---------- Listen for section_updates from the advisor ---------- */
  useEffect(() => {
    function onUpdate(e: Event) {
      const detail = (
        e as CustomEvent<{ cif: string; section_updates: SectionUpdate[] }>
      ).detail;
      if (!detail || detail.cif !== cif) return;
      setSections((prev) => applySectionUpdates(prev, detail.section_updates));
      const sectionNames = detail.section_updates.map((u) => u.section).join(', ');
      notify({
        kind: 'success',
        text:
          detail.section_updates.length === 1
            ? `Sección «${sectionNames}» actualizada.`
            : `${detail.section_updates.length} secciones actualizadas: ${sectionNames}.`,
      });
    }
    window.addEventListener(COMPANY_SECTION_UPDATE_EVENT, onUpdate);
    return () =>
      window.removeEventListener(COMPANY_SECTION_UPDATE_EVENT, onUpdate);
  }, [cif]);

  /* ---------- Manual refresh of the narrative (rate-limited) ---------- */
  const onRefreshAnalysis = useCallback(async () => {
    if (refreshingAnalysis || analysisCountdown !== null) return;
    setRefreshingAnalysis(true);
    try {
      const res = await apiClient.companies.refreshAnalysis(cif);
      setSections((s) => ({ ...s, narrative: res.block }));
      notify({ kind: 'success', text: 'Análisis del Copilot actualizado.' });
      // Optimistic client-side cooldown matching the backend window (60s).
      // This locks the button immediately so users don't trigger a 2nd
      // round-trip that the server would only refuse with 429.
      startCountdown(60, setAnalysisCountdown);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        // Server enforced cooldown: extract the remaining seconds from the
        // detail field — falls back to 60 if the backend ever changes shape.
        const m = /(\d+)/.exec(String(e.detail || ''));
        const retry = m && m[1] ? Number(m[1]) : 60;
        startCountdown(retry, setAnalysisCountdown);
        notify({
          kind: 'warn',
          text: `Has refrescado el análisis recientemente. Espera ${retry}s para volver a intentarlo.`,
        });
      } else {
        notify({ kind: 'error', text: 'No hemos podido refrescar el análisis.' });
      }
    } finally {
      setRefreshingAnalysis(false);
    }
  }, [cif, refreshingAnalysis, analysisCountdown]);

  /* ---------- Section locks (anonymous only) ---------- */
  const locked = useMemo(
    () => new Set(initial.locked_sections || []),
    [initial.locked_sections],
  );

  return (
    <div className="pb-20" data-testid="company-page-client">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="text-sm text-text-muted mb-4 flex flex-wrap items-center gap-1.5"
        data-testid="company-breadcrumb"
      >
        <span>Inicio</span>
        <span aria-hidden>›</span>
        <span>Analizar</span>
        <span aria-hidden>›</span>
        <span>Empresas</span>
        <span aria-hidden>›</span>
        <span className="text-text">{initial.header.name}</span>
      </nav>

      {/* Global header */}
      <CompanyHeader
        cif={cif}
        info={initial.header}
        authenticated={authenticated}
        initialInWatchlist={initial.in_watchlist}
        initialVisibility={initial.watchlist_visibility}
      />

      <div className="mt-10 space-y-12">
        {/* Section 1 — Resumen (public) */}
        <EntitySectionWrapper id="resumen" title="Resumen">
          <SectionBlock spec={sections.hero} />
          <div className="mt-6">
            <SectionBlock spec={sections.kpi_metrics} />
          </div>
        </EntitySectionWrapper>

        {/* Section 2 — Identidad (public) */}
        <EntitySectionWrapper
          id="identidad"
          title="Identidad y estructura"
          description="Datos básicos de la sociedad."
        >
          <IdentityCard identity={sections.identity} />
        </EntitySectionWrapper>

        {/* Section 3 — Financieros (public summary; detail tabs locked) */}
        <EntitySectionWrapper
          id="financieros"
          title="Financieros"
          description={
            authenticated
              ? 'Cuentas abreviadas y datos completos.'
              : 'Vista resumida. Las cuentas completas requieren registro.'
          }
        >
          <SectionBlock spec={sections.financials_metrics} />
          <div className="mt-6">
            <CompanyEvolutionChart authenticated={authenticated} />
          </div>
        </EntitySectionWrapper>

        {/* Section 4 — Score y señales (locked anon) */}
        <EntitySectionWrapper id="score" title="Score y señales">
          {locked.has('score') || !sections.score_block ? (
            <LockedSectionBlur
              testId="company-score-locked"
              title="Score sectorial + señales del Copilot"
              description="Disponible al crear tu cuenta. Aquí verás los scores de oportunidad y riesgo y las señales BORME, contratación pública y cambios societarios."
            />
          ) : (
            <SectionBlock spec={sections.score_block} />
          )}
        </EntitySectionWrapper>

        {/* Section 5 — Posición de mercado (locked anon) */}
        <EntitySectionWrapper
          id="comparables"
          title="Posición de mercado"
          description="Empresas comparables en el mismo sector y región."
        >
          {locked.has('comparables') || !sections.comparables ? (
            <LockedSectionBlur
              testId="company-comparables-locked"
              title="Comparables sectoriales"
              description="3-5 empresas similares con score de cercanía. Necesitas iniciar sesión."
            />
          ) : (
            <SectionBlock spec={sections.comparables} />
          )}
        </EntitySectionWrapper>

        {/* Section 6 — Valoración indicativa (locked anon) */}
        <EntitySectionWrapper
          id="valoracion"
          title="Valoración indicativa"
          description="Múltiplo determinístico sobre ingresos."
        >
          {locked.has('valuation') || !sections.valuation ? (
            <LockedSectionBlur
              testId="company-valuation-locked"
              title="Valoración indicativa por múltiplo"
              description="Banda central + rangos. La valoración completa avanzada llega con E1.8."
            />
          ) : (
            <SectionBlock spec={sections.valuation} />
          )}
        </EntitySectionWrapper>

        {/* Section 7 — Análisis del Copilot (locked anon) */}
        <EntitySectionWrapper
          id="analisis"
          title="Análisis del Copilot"
          description="Lectura del analista IA basada en la ficha."
          action={
            authenticated && !locked.has('narrative') ? (
              <RefreshButton
                testId="company-refresh-analysis"
                label="Refrescar análisis"
                loading={refreshingAnalysis}
                cooldownSeconds={analysisCountdown}
                onClick={onRefreshAnalysis}
              />
            ) : null
          }
        >
          {locked.has('narrative') || !sections.narrative ? (
            <LockedSectionBlur
              testId="company-narrative-locked"
              title="Lectura del analista IA"
              description="El Company Advisor te da un resumen, riesgos y oportunidades adaptados a la ficha. Crea tu cuenta para verlo."
            />
          ) : (
            <SectionBlock spec={sections.narrative} />
          )}
        </EntitySectionWrapper>

        {/* Section 8 — Próximas mejores acciones */}
        <EntitySectionWrapper
          id="acciones"
          title="Próximas mejores acciones"
          description="Atajos a las capacidades que conectan esta ficha con el resto del producto."
        >
          {locked.has('actions') ? (
            <LockedSectionBlur
              testId="company-actions-locked"
              title="Activación de capacidades"
              description="Crear oportunidades, valoraciones avanzadas, descargas y matching M&A requieren cuenta."
            />
          ) : (
            <CompanyNextBestActions />
          )}
        </EntitySectionWrapper>
      </div>
    </div>
  );
}

/* ============================================================ */

function startCountdown(
  initial: number,
  setter: (v: number | null) => void,
) {
  setter(initial);
  let n = initial;
  const id = window.setInterval(() => {
    n -= 1;
    if (n <= 0) {
      window.clearInterval(id);
      setter(null);
    } else {
      setter(n);
    }
  }, 1000);
}

function applySectionUpdates(
  current: CompanyDetailResponse['sections'],
  updates: SectionUpdate[],
): CompanyDetailResponse['sections'] {
  const next = { ...current };
  for (const u of updates) {
    switch (u.section) {
      case 'narrative':
        next.narrative = u.block;
        break;
      case 'valuation':
        next.valuation = u.block;
        break;
      case 'comparables':
        next.comparables = u.block;
        break;
      case 'metrics':
      case 'financials':
        next.financials_metrics = u.block;
        break;
      // identity / signals / score: ignore for now (backend won't emit them
      // in v1; we keep the case so it doesn't crash if it ever does).
      default:
        break;
    }
  }
  return next;
}

function toCopilotMessage(m: CompanyConversationMessage): {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
} {
  return {
    id: m.message_id,
    role: m.role === 'system' ? 'assistant' : (m.role as 'user' | 'assistant'),
    text: m.content,
    ts: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
  };
}

/* ---------- Block renderers ---------- */

function SectionBlock({ spec }: { spec: BlockSpec | null }) {
  if (!spec) return null;
  const b = spec as AnyBlock;
  if (b.type === 'hero') {
    const p = b.props as {
      eyebrow?: string;
      title?: string;
      subtitle?: string;
      tone?: 'light' | 'dark' | 'info';
    };
    return (
      <HeroBlock
        eyebrow={p.eyebrow}
        title={p.title || ''}
        subtitle={p.subtitle}
        variant="banner"
        tone={p.tone === 'dark' ? 'dark' : 'light'}
      />
    );
  }
  if (b.type === 'metrics') {
    const p = b.props as {
      title?: string;
      items: Array<{ label: string; value: string; hint?: string; trend?: 'up' | 'down' | 'flat' }>;
    };
    return (
      <MetricsBlock
        title={p.title}
        metrics={p.items.map((it, idx) => ({
          id: `m_${idx}`,
          label: it.label,
          value: it.value,
          sub: it.hint,
          trend: it.trend,
        }))}
      />
    );
  }
  if (b.type === 'narrative') {
    const p = b.props as {
      title?: string | null;
      summary?: string | null;
      key_points?: string[];
      risks?: string[];
      opportunities?: string[];
      citations?: string[];
    };
    return (
      <NarrativeBlock
        title={p.title ?? null}
        summary={p.summary ?? null}
        keyPoints={p.key_points || []}
        risks={p.risks || []}
        opportunities={p.opportunities || []}
        citations={p.citations || []}
      />
    );
  }
  if (b.type === 'valuation') {
    const p = b.props as {
      company_name: string;
      sector?: string | null;
      method: 'ebitda_multiple' | 'revenue_multiple';
      multiple_label: string;
      multiple_value: number;
      central_value: number;
      low_value: number;
      high_value: number;
      currency?: 'EUR';
      inputs?: Array<{ label: string; value: string; hint?: string }>;
      disclaimer: string;
    };
    return (
      <ValuationBlock
        companyName={p.company_name}
        sector={p.sector ?? null}
        method={p.method}
        multipleLabel={p.multiple_label}
        multipleValue={p.multiple_value}
        centralValue={p.central_value}
        lowValue={p.low_value}
        highValue={p.high_value}
        currency={p.currency || 'EUR'}
        inputs={(p.inputs || []).map((it) => ({ label: it.label, value: it.value }))}
        disclaimer={p.disclaimer}
      />
    );
  }
  if (b.type === 'company_cards_grid') {
    const p = b.props as {
      title?: string | null;
      subtype:
        | 'similar_to_company'
        | 'opportunities_by_sector'
        | 'list_by_sector'
        | 'generic';
      items: Array<{
        master_company_id: string;
        name: string;
        sector?: string | null;
        region?: string | null;
        score: number;
        reason?: string | null;
      }>;
    };
    return (
      <CompanyCardsGridBlock
        title={p.title ?? null}
        subtype={p.subtype}
        items={p.items.map((it) => ({
          masterCompanyId: it.master_company_id,
          name: it.name,
          sector: it.sector ?? null,
          region: it.region ?? null,
          score: it.score,
          reason: it.reason ?? null,
        }))}
      />
    );
  }
  return null;
}

/* ---------- Tiny in-page components ---------- */

function IdentityCard({
  identity,
}: {
  identity: CompanyDetailResponse['sections']['identity'];
}) {
  const rows: Array<[string, string | null]> = [
    ['Razón social', identity.legal_name],
    ['CIF', identity.cif],
    ['Sector', identity.sector],
    ['Sede', [identity.region, identity.country].filter(Boolean).join(', ') || null],
    ['Empleados', identity.employees != null ? String(identity.employees) : null],
    [
      'Año constitución',
      identity.founded_year != null ? String(identity.founded_year) : null,
    ],
  ];
  return (
    <dl
      data-testid="company-identity-card"
      className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 rounded-2xl border border-border bg-surface p-6"
    >
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between border-b border-border/40 py-2">
          <dt className="text-sm text-text-muted">{k}</dt>
          <dd className="text-sm font-semibold text-text">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function CompanyEvolutionChart({ authenticated }: { authenticated: boolean }) {
  // Tiny SVG sparkline. Deterministic mock data; real data will arrive with REQ-007.
  // For anonymous visitors we still render the shape so the page doesn't feel empty.
  const data = [42, 51, 49, 58, 64, 68, 72, 80];
  const w = 480;
  const h = 96;
  const padX = 12;
  const padY = 8;
  const xs = data.map((_, i) => padX + (i * (w - padX * 2)) / (data.length - 1));
  const ymax = Math.max(...data);
  const ymin = Math.min(...data);
  const ys = data.map(
    (v) => padY + ((ymax - v) / (ymax - ymin || 1)) * (h - padY * 2),
  );
  const dpath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  return (
    <div
      data-testid="company-evolution-chart"
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-sm font-semibold text-text">Evolución de ingresos</h4>
        <span className="text-xs text-text-muted">
          {authenticated ? 'Últimos 8 ejercicios (mock)' : 'Vista resumida (mock)'}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" aria-hidden>
        <path d={dpath} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r="2.5" fill="currentColor" className="text-primary" />
        ))}
      </svg>
    </div>
  );
}

function CompanyNextBestActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-testid="company-next-best-actions">
      {[
        { label: 'Compárala con otra empresa', hint: 'El Copilot lo hace por ti.' },
        { label: 'Analiza riesgos en detalle', hint: 'Pídelo al Company Advisor.' },
        { label: 'Detecta oportunidades', hint: 'Buy-side o sell-side, desde la ficha.' },
      ].map((a) => (
        <div
          key={a.label}
          className="rounded-2xl border border-border bg-surface p-5"
          data-testid={`company-action-card-${a.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <p className="font-semibold text-text">{a.label}</p>
          <p className="text-sm text-text-muted mt-1">{a.hint}</p>
        </div>
      ))}
    </div>
  );
}

// Silence unused warnings for the helper types/values that the dock uses
// elsewhere — they are part of the public surface of this file.
type _Silence = Workspace | SectionId;
const _silence: _Silence | undefined = undefined;
void _silence;
