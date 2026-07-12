'use client';
/**
 * CompanyPageClient — SPRINT 1 · F6 · Composición 100 % declarativa.
 *
 * Regla arquitectónica 3: la ficha de empresa es composición pura sobre
 * `<EntitySections/>`. Este cliente ya NO renderiza secciones a mano ni
 * decide layouts locales — se limita a:
 *
 *   1) Declarar los 12 módulos canónicos del Entity Framework
 *      (`header` + `advisor` viven fuera del flujo; los 10 restantes se
 *      declaran aquí como `EntitySectionDescriptor[]`).
 *   2) Elegir el estado de cada módulo (`ready | locked | unavailable |
 *      updating`) según la sesión y los datos de `initial`.
 *   3) Suscribirse al evento `arroba:company-section-update` para pulsar
 *      la sección afectada (state `updating` → animación section-pulse).
 *   4) Publicar el `EntityContext` para el Composer permanente al montar
 *      la ficha y limpiarlo en el unmount (Regla 1 · F7).
 *
 * B.6.f — Hidratación SWR de `IdentitySection` canónica arroba (endpoint
 * `/api/companies/{cif}/section/identity`, `engine_version=arroba-identity-v1`).
 * B.6.f queda oficialmente superseded por Sprint F0 (Ficha de Empresa v1).
 * El layout canónico 3-col se reconstruye componente a componente bajo
 * `components/company/*` con COMP-IDs declarados (Regla R14). La SoT visual
 * es `/app/memory/sources/empresa_v1/empresa_html/` (ZIP oficial).
 *
 * Los tests siguen validando los contratos de UX (secciones presentes,
 * refresh 429, section_updates in-place) pero ahora se apoyan en los
 * ids canónicos (`entity-section-hero`, `entity-section-analisis`, …).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Scale, Sparkles } from 'lucide-react';
import useSWR from 'swr';

import { apiClient, ApiError } from '@/lib/api/client';
import { intelligenceClient } from '@/lib/companies/intelligence-client';
import type { IdentitySection } from '@/lib/companies/intelligence-types';
import {
  COMPANY_SECTION_UPDATE_EVENT,
  useCopilot,
  useEntityContext,
} from '@/components/copilot/CopilotProvider';
import { CompanyHeader } from './CompanyHeader';
import { EntitySections } from './base/EntitySections';
import { EntityAdvisor } from './base/EntityAdvisor';
import { EntityHero } from './base/EntityHero';
import { EntityMetrics } from './base/EntityMetrics';
import { EntityInsights } from './base/EntityInsights';
import { EntityAnalisis } from './base/EntityAnalisis';
import { EntityRelations } from './base/EntityRelations';
import { EntityActions } from './base/EntityActions';
import { HeroBlock } from '@/components/blocks/HeroBlock';
import { NarrativeBlock } from '@/components/blocks/NarrativeBlock';
import { RefreshButton } from '@/components/blocks/RefreshButton';
import { ValuationBlock } from '@/components/blocks/ValuationBlock';
import { notify } from '@/lib/notify';
import type { BlockSpec } from '@/lib/orchestrator/types';
import type {
  CompanyConversationMessage,
  CompanyDetailResponse,
  CompanyIdentity,
  SectionId,
  SectionUpdate,
} from '@/lib/companies/types';
import type {
  EntityModuleId,
  EntitySectionDescriptor,
  EntityModuleState,
} from './base/types';

/* ============================================================
 * Tipos internos
 * ============================================================ */

type AnyBlock = BlockSpec & { props: Record<string, unknown> };

export interface CompanyPageClientProps {
  cif: string;
  initial: CompanyDetailResponse;
  authenticated: boolean;
}

/** Sección lógica de la ficha (id canónico ↔ módulo canónico). */
interface CompanySectionSlot {
  id: string;
  module: EntityModuleId;
  /** Vacío = sección chromeless (solo wrapper con testid). */
  title?: string;
  description?: string;
}

/**
 * SPRINT 1 · Regla 3 (composición 100 % declarativa).
 *
 * Mapeo canónico de los 12 módulos del Entity Framework a los ids de
 * sección visibles en la ficha de empresa. Este array es ESTÁTICO y
 * DETERMINISTA — no depende de la empresa concreta, ni del payload, ni
 * de flags de usuario. La misma composición se emite para B47820150,
 * B08540200, y cualquier otro CIF.
 *
 * `header` y `advisor` son slots chromeless (sin título propio) porque
 * traen su propia chrome:
 *   - `header`   → renderiza `<CompanyHeader/>` completo con avatar,
 *                  breadcrumb-like subtitle y row de acciones.
 *   - `advisor`  → marcador semántico oculto (`<EntityAdvisor/>`) que
 *                  documenta la relación de esta ficha con el Copilot
 *                  del dock global (§3.4 del framework).
 *
 * El orden final lo impone `EntitySections` sobre `CANONICAL_MODULE_ORDER`.
 */
const COMPANY_SLOTS: readonly CompanySectionSlot[] = [
  { id: 'header', module: 'header' },
  {
    id: 'hero',
    module: 'hero',
    title: 'Resumen',
  },
  {
    id: 'kpis',
    module: 'kpis',
    title: 'Cifras clave',
    description: 'Ingresos, EBITDA y evolución reciente.',
  },
  {
    id: 'insights',
    module: 'insights',
    title: 'Identidad y ficha corporativa',
    description: 'Datos básicos de la sociedad.',
  },
  {
    id: 'analisis',
    module: 'analisis',
    title: 'Análisis del Copilot',
    description: 'Lectura del analista IA basada en la ficha.',
  },
  {
    id: 'senales',
    module: 'senales',
    title: 'Señales externas',
    description: 'BORME, contratación pública y cambios societarios.',
  },
  {
    id: 'relaciones',
    module: 'relaciones',
    title: 'Empresas relacionadas',
    description: 'Comparables sectoriales y peers cercanos.',
  },
  {
    id: 'oportunidades',
    module: 'oportunidades',
    title: 'Oportunidades detectadas',
    description: 'Valoración indicativa y opciones activables.',
  },
  {
    id: 'documentacion',
    module: 'documentacion',
    title: 'Documentación',
    description: 'Memorias mercantiles, teasers e IMs asociados.',
  },
  {
    id: 'actividad',
    module: 'actividad',
    title: 'Actividad reciente',
    description: 'Eventos, refrescos y cambios en esta ficha.',
  },
  {
    id: 'acciones',
    module: 'acciones',
    title: 'Próximas mejores acciones',
    description: 'Atajos a las capacidades que conectan esta ficha con el resto del producto.',
  },
  { id: 'advisor', module: 'advisor' },
];

/** Duración del feedback visual `animate-section-pulse` en ms. */
const SECTION_PULSE_MS = 700;

/* ============================================================
 * Componente
 * ============================================================ */

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
  /** Ids canónicos que están momentáneamente en estado `updating` (pulse). */
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(() => new Set());
  const pulseTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const { hydrateEntityConversation } = useCopilot();
  const { publish: publishEntity } = useEntityContext();

  /* ---------- B.6.f · Hidratación SWR de la IdentitySection canónica ----------
   *
   * `IdentitySection` (arroba-identity-v1) es la fuente canónica UI de la
   * ficha. En Hito 1 sólo la hidratamos en background (no reemplaza los
   * bloques todavía · Hito 3 hará el swap completo). Sirve como:
   *   1. Verificación de contrato R5 (`engine_version` = `arroba-*-v1`).
   *   2. Warm-up de la caché backend antes de que el usuario navegue a
   *      sub-secciones que la reutilizarán (Finanzas, Semantic).
   *   3. Testids observables para regresión (`identity-section-engine`).
   *
   * `initial.header.name` sigue siendo la única fuente de nombre para el
   * árbol declarativo hasta que Hito 3 sustituya CompanyHeader por su
   * versión canónica UI. */
  const { data: identitySection } = useSWR<IdentitySection | null>(
    authenticated ? ['identity-section', cif] : null,
    () => intelligenceClient.identitySection(cif),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  /* ---------- Regla 1 · F7: publicar EntityContext siempre ---------- */
  useEffect(() => {
    publishEntity({
      entity_type: 'company',
      entity_id: cif,
      entity_name: initial.header.name,
    });
    return () => {
      publishEntity(null);
    };
  }, [cif, initial.header.name, publishEntity]);

  /* ---------- Hidratación de la conversación (solo autenticados) ---------- */
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
        // No fatal: el dock sigue funcionando en modo entity_context aunque
        // no cargue el hilo previo.
      }
    })();
    return () => {
      active = false;
    };
  }, [authenticated, cif, initial.header.name, hydrateEntityConversation]);

  /* ---------- Pulso visual reutilizable ---------- */
  const pulseSection = useCallback((sectionId: string) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
    const prevTimer = pulseTimersRef.current.get(sectionId);
    if (prevTimer) clearTimeout(prevTimer);
    const timer = setTimeout(() => {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
      pulseTimersRef.current.delete(sectionId);
    }, SECTION_PULSE_MS);
    pulseTimersRef.current.set(sectionId, timer);
  }, []);

  useEffect(() => {
    const timers = pulseTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  /* ---------- Escucha de section_updates del Advisor ---------- */
  useEffect(() => {
    function onUpdate(e: Event) {
      const detail = (
        e as CustomEvent<{ cif: string; section_updates: SectionUpdate[] }>
      ).detail;
      if (!detail || detail.cif !== cif) return;
      setSections((prev) => applySectionUpdates(prev, detail.section_updates));

      // Pulsar cada módulo canónico afectado por el update.
      detail.section_updates.forEach((u) => {
        const targetId = SECTION_ID_BY_UPDATE[u.section];
        if (targetId) pulseSection(targetId);
      });

      const sectionNames = detail.section_updates
        .map((u) => u.section)
        .join(', ');
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
  }, [cif, pulseSection]);

  /* ---------- Refresco manual del análisis ---------- */
  const onRefreshAnalysis = useCallback(async () => {
    if (refreshingAnalysis || analysisCountdown !== null) return;
    setRefreshingAnalysis(true);
    try {
      const res = await apiClient.companies.refreshAnalysis(cif);
      setSections((s) => ({ ...s, narrative: res.block }));
      pulseSection('analisis');
      notify({ kind: 'success', text: 'Análisis del Copilot actualizado.' });
      // Cooldown optimista alineado con el backend (60 s).
      startCountdown(60, setAnalysisCountdown);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
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
  }, [analysisCountdown, cif, pulseSection, refreshingAnalysis]);

  /* ---------- Cálculo declarativo de las 10 secciones ---------- */
  const locked = useMemo(
    () => new Set(initial.locked_sections || []),
    [initial.locked_sections],
  );

  const sectionDescriptors: EntitySectionDescriptor[] = useMemo(() => {
    return COMPANY_SLOTS.map((slot): EntitySectionDescriptor => {
      const isPulse = updatingIds.has(slot.id);
      const base = {
        id: slot.id,
        module: slot.module,
        title: slot.title,
        description: slot.description,
      };

      switch (slot.id) {
        case 'header': {
          // Chromeless: EntitySectionWrapper solo emite el `data-testid`
          // + anchor. `<CompanyHeader/>` mantiene toda su chrome propia
          // (avatar, título, subtítulo, acciones, dropdown).
          return {
            ...base,
            state: 'ready',
            children: (
              <CompanyHeader
                cif={cif}
                info={initial.header}
                authenticated={authenticated}
                initialInWatchlist={initial.in_watchlist}
                initialVisibility={initial.watchlist_visibility}
              />
            ),
          };
        }
        case 'hero': {
          return {
            ...base,
            state: pulseOrReady(isPulse),
            children: renderHero(sections.hero, initial.header.name),
          };
        }
        case 'kpis': {
          return {
            ...base,
            state: pulseOrReady(isPulse),
            children: renderKpis(sections.financials_metrics, authenticated),
          };
        }
        case 'insights': {
          return {
            ...base,
            state: pulseOrReady(isPulse),
            children: <IdentityCard identity={sections.identity} />,
          };
        }
        case 'analisis': {
          if (locked.has('narrative') || !sections.narrative) {
            return {
              ...base,
              state: 'locked',
              description:
                'El Company Advisor te da un resumen, riesgos y oportunidades adaptados a la ficha. Crea tu cuenta para verlo.',
            };
          }
          return {
            ...base,
            state: pulseOrReady(isPulse),
            action: (
              <RefreshButton
                testId="company-refresh-analysis"
                label="Refrescar análisis"
                loading={refreshingAnalysis}
                cooldownSeconds={analysisCountdown}
                onClick={onRefreshAnalysis}
              />
            ),
            children: renderNarrative(sections.narrative),
          };
        }
        case 'senales': {
          if (locked.has('score')) {
            return {
              ...base,
              state: 'locked',
              description:
                'Aquí verás los scores de oportunidad y riesgo y las señales BORME, contratación pública y cambios societarios.',
            };
          }
          if (sections.score_block) {
            return {
              ...base,
              state: pulseOrReady(isPulse),
              children: renderHero(sections.score_block, 'Score'),
            };
          }
          // `req` / `eta` resueltos desde MODULE_DEFAULTS (canónico).
          return { ...base, state: 'unavailable' };
        }
        case 'relaciones': {
          if (locked.has('comparables') || !sections.comparables) {
            return {
              ...base,
              state: 'locked',
              description:
                'Empresas similares con score de cercanía. Necesitas iniciar sesión.',
            };
          }
          return {
            ...base,
            state: pulseOrReady(isPulse),
            children: renderRelations(sections.comparables),
          };
        }
        case 'oportunidades': {
          if (locked.has('valuation') || !sections.valuation) {
            return {
              ...base,
              state: 'locked',
              description:
                'Banda central + rangos de valoración y opciones activables. Crea tu cuenta para verlo.',
            };
          }
          return {
            ...base,
            state: pulseOrReady(isPulse),
            children: renderValuation(sections.valuation),
          };
        }
        case 'documentacion':
        case 'actividad': {
          // `req` / `eta` resueltos desde MODULE_DEFAULTS (canónico).
          return { ...base, state: 'unavailable' };
        }
        case 'acciones': {
          if (locked.has('actions')) {
            return {
              ...base,
              state: 'locked',
              description:
                'Crear oportunidades, valoraciones avanzadas, descargas y matching M&A requieren cuenta.',
            };
          }
          return {
            ...base,
            state: pulseOrReady(isPulse),
            children: (
              <EntityActions
                entityType="company"
                items={NEXT_BEST_ACTIONS}
              />
            ),
          };
        }
        case 'advisor': {
          // Chromeless: marcador semántico oculto que documenta la
          // relación con el Copilot del dock (Regla 1 · el Composer y
          // el Company Advisor viven en el layout raíz, no en la ficha).
          return {
            ...base,
            state: 'ready',
            children: (
              <EntityAdvisor
                entityType="company"
                identifier={cif}
                displayName={initial.header.name}
              />
            ),
          };
        }
        default:
          return { ...base, state: 'unavailable' };
      }
    });
  }, [
    analysisCountdown,
    authenticated,
    cif,
    initial.header,
    initial.in_watchlist,
    initial.watchlist_visibility,
    locked,
    onRefreshAnalysis,
    refreshingAnalysis,
    sections,
    updatingIds,
  ]);

  return (
    <div className="pb-20" data-testid="company-page-client">
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

      {/* B.6.f · Marcador testable del contrato canónico UI. Invisible; sirve
          para que la testing suite verifique que `arroba-identity-v1` está
          activo sin depender del render de un bloque concreto. */}
      {identitySection?.metadata?.engine_version && (
        <span
          data-testid="identity-section-engine"
          data-engine-version={identitySection.metadata.engine_version}
          data-coverage-core={String(identitySection.coverage?.core ?? false)}
          className="sr-only"
          aria-hidden
        >
          {identitySection.metadata.engine_version}
        </span>
      )}

      <EntitySections
        entityType="company"
        authenticated={authenticated}
        sections={sectionDescriptors}
        className="space-y-12"
      />
    </div>
  );
}

/* ============================================================
 * Helpers puros
 * ============================================================ */

function pulseOrReady(pulse: boolean): EntityModuleState {
  return pulse ? 'updating' : 'ready';
}

/** Mapea la clave `section` que emite el backend al id de la sección UI. */
const SECTION_ID_BY_UPDATE: Record<SectionId, string> = {
  identity: 'insights',
  financials: 'kpis',
  metrics: 'kpis',
  score: 'senales',
  signals: 'senales',
  comparables: 'relaciones',
  valuation: 'oportunidades',
  narrative: 'analisis',
};

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
      // identity / signals / score: reservados para futuros REQs.
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

/* ============================================================
 * Renderizadores por bloque
 * ============================================================ */

function renderHero(spec: BlockSpec | null, fallbackTitle: string) {
  if (!spec) {
    return (
      <EntityHero
        entityType="company"
        title={fallbackTitle}
        variant="banner"
        tone="light"
      />
    );
  }
  const b = spec as AnyBlock;
  if (b.type !== 'hero') return null;
  const p = b.props as {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    tone?: 'light' | 'dark' | 'info';
  };
  return (
    <EntityHero
      entityType="company"
      eyebrow={p.eyebrow}
      title={p.title || fallbackTitle}
      subtitle={p.subtitle}
      variant="banner"
      tone={p.tone === 'dark' ? 'dark' : 'light'}
    />
  );
}

function renderKpis(spec: BlockSpec | null, authenticated: boolean) {
  const chart = <CompanyEvolutionChart authenticated={authenticated} />;
  if (!spec || (spec as AnyBlock).type !== 'metrics') {
    return <div className="space-y-6">{chart}</div>;
  }
  const b = spec as AnyBlock;
  const p = b.props as {
    title?: string;
    items: Array<{
      label: string;
      value: string;
      hint?: string;
      trend?: 'up' | 'down' | 'flat';
    }>;
  };
  return (
    <div className="space-y-6">
      <EntityMetrics
        entityType="company"
        title={p.title}
        metrics={p.items.map((it, idx) => ({
          id: `m_${idx}`,
          label: it.label,
          value: it.value,
          sub: it.hint,
          trend: it.trend,
        }))}
      />
      {chart}
    </div>
  );
}

function renderNarrative(spec: BlockSpec | null) {
  if (!spec || (spec as AnyBlock).type !== 'narrative') return null;
  const p = (spec as AnyBlock).props as {
    title?: string | null;
    summary?: string | null;
    key_points?: string[];
    risks?: string[];
    opportunities?: string[];
    citations?: string[];
  };
  return (
    <EntityAnalisis
      entityType="company"
      title={p.title ?? null}
      summary={p.summary ?? null}
      keyPoints={p.key_points || []}
      risks={p.risks || []}
      opportunities={p.opportunities || []}
      citations={p.citations || []}
    />
  );
}

function renderRelations(spec: BlockSpec | null) {
  if (!spec || (spec as AnyBlock).type !== 'company_cards_grid') return null;
  const p = (spec as AnyBlock).props as {
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
    <EntityRelations
      entityType="company"
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

function renderValuation(spec: BlockSpec | null) {
  if (!spec || (spec as AnyBlock).type !== 'valuation') return null;
  const p = (spec as AnyBlock).props as {
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

/* ============================================================
 * Sub-componentes internos (identidad, evolución, acciones)
 * ============================================================ */

function IdentityCard({ identity }: { identity: CompanyIdentity }) {
  const rows: Array<[string, string | null]> = [
    ['Razón social', identity.legal_name],
    ['CIF', identity.cif],
    ['Sector', identity.sector],
    [
      'Sede',
      [identity.region, identity.country].filter(Boolean).join(', ') || null,
    ],
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
        <div
          key={k}
          className="flex items-baseline justify-between border-b border-border/40 py-2"
        >
          <dt className="text-sm text-text-muted">{k}</dt>
          <dd className="text-sm font-semibold text-text">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function CompanyEvolutionChart({ authenticated }: { authenticated: boolean }) {
  // Sparkline determinístico. Los datos reales llegan con REQ-007.
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
  const dpath = xs
    .map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`)
    .join(' ');
  return (
    <div
      data-testid="company-evolution-chart"
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-sm font-semibold text-text">Evolución de ingresos</h4>
        <span className="text-xs text-text-muted">
          {authenticated ? 'Últimos 8 ejercicios' : 'Vista resumida'}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" aria-hidden>
        <path
          d={dpath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ys[i]}
            r="2.5"
            fill="currentColor"
            className="text-primary"
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Placeholder legacy usado por tests que buscan `company-next-best-actions`.
 * Lo devolvemos como wrapper alrededor del `EntityActions` para preservar
 * el contrato de e1_tester sin duplicar UI.
 */
function CompanyNextBestActions() {
  return (
    <div data-testid="company-next-best-actions">
      <EntityActions entityType="company" items={NEXT_BEST_ACTIONS} />
    </div>
  );
}
void CompanyNextBestActions;

const NEXT_BEST_ACTIONS = [
  {
    id: 'compare',
    label: 'Compárala con otra empresa',
    hint: 'El Copilot lo hace por ti.',
    icon: Scale,
    onClick: () => {},
    testId: 'company-action-card-compare',
  },
  {
    id: 'risks',
    label: 'Analiza riesgos en detalle',
    hint: 'Pídelo al Company Advisor.',
    icon: AlertTriangle,
    onClick: () => {},
    testId: 'company-action-card-risks',
  },
  {
    id: 'opportunities',
    label: 'Detecta oportunidades',
    hint: 'Buy-side o sell-side, desde la ficha.',
    icon: Sparkles,
    onClick: () => {},
    testId: 'company-action-card-opportunities',
  },
];
