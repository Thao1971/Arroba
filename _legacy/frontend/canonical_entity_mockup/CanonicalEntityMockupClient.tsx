'use client';
/**
 * CanonicalEntityMockupClient — implementación aislada del layout canónico
 * de la Entity Page (arroba.com) definido en `_design_intake/company/ce-app.jsx`.
 *
 * Estructura visible:
 *   1. Company Header (banner surface-2) con avatar, badges Verificada/Auditada,
 *      subtítulo + link web y hero row de oportunidades + CTAs.
 *   2. Deal Banner condicional (venta/compra/financiación/fusión/none).
 *   3. Body en CSS Grid `210px minmax(0,1fr) 360px` con:
 *        - Left column: SectionNav sticky top:78 con grupos
 *          `Perfil` / `Inteligencia` / `Fuentes` (10 secciones canónicas).
 *        - Center column: una única sección visible a la vez,
 *          con `window.scrollTo(0,0)` al cambiar.
 *        - Right column: `<DealPanel/>` sticky top:78, ancho 360px.
 *   4. El Composer floating dock (FAB) vive en el layout raíz autenticado
 *      — heredado, no duplicado aquí.
 *
 * Vocabularios reconciliados:
 *   - 10 secciones canónicas de navegación (id de la nav lateral).
 *   - 12 módulos declarativos (piezas de contenido) distribuidos dentro.
 *
 * Datos:
 *   - `sections.hero`, `sections.kpi_metrics`, `sections.identity`,
 *     `sections.financials_metrics`, `sections.valuation`, `sections.narrative`,
 *     `sections.comparables`, `sections.score_block` — todos vienen del
 *     endpoint `/api/companies/{cif}` (payload real, sin fabricación).
 *   - `propiedad`, `gobierno`, `registros`, `documentos` — pendientes de
 *     backend, renderizados como `UnavailableBlock` con REQ del registry
 *     `MODULE_DEFAULTS` (base/types.ts) y los REQ-009/010 añadidos.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Bookmark,
  BookmarkCheck,
  Building2,
  Coins,
  Euro,
  ExternalLink,
  FileText,
  LayoutGrid,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import {
  HeroBlock,
  MetricsBlock,
  NarrativeBlock,
  UnavailableBlock,
  ValuationBlock,
  CompanyCardsGridBlock,
} from '@/components/blocks';
import type { BlockSpec } from '@/lib/orchestrator/types';
import type { CompanyDetailResponse } from '@/lib/companies/types';

/* ============================================================================
 * Tipos y catálogos canónicos (mockup)
 * ============================================================================
 */

type SectionId =
  | 'resumen'
  | 'finanzas'
  | 'valoracion'
  | 'propiedad'
  | 'gobierno'
  | 'mercado'
  | 'senales'
  | 'oportunidades'
  | 'registros'
  | 'documentos';

type SectionGroup = 'Perfil' | 'Inteligencia' | 'Fuentes';

type DealScenarioId = 'none' | 'venta' | 'compra' | 'financiacion' | 'fusion';

interface NavItem {
  id: SectionId;
  label: string;
  group: SectionGroup;
  Icon: LucideIcon;
}

const NAV: readonly NavItem[] = [
  { id: 'resumen', label: 'Resumen', group: 'Perfil', Icon: LayoutGrid },
  { id: 'finanzas', label: 'Finanzas', group: 'Perfil', Icon: Euro },
  { id: 'valoracion', label: 'Valoración', group: 'Perfil', Icon: Coins },
  { id: 'propiedad', label: 'Propiedad', group: 'Perfil', Icon: Users },
  { id: 'gobierno', label: 'Gobierno', group: 'Perfil', Icon: User },
  { id: 'mercado', label: 'Mercado', group: 'Perfil', Icon: BarChart3 },
  { id: 'senales', label: 'Señales', group: 'Inteligencia', Icon: Activity },
  { id: 'oportunidades', label: 'Oportunidades', group: 'Inteligencia', Icon: Target },
  { id: 'registros', label: 'Registros públicos', group: 'Fuentes', Icon: FileText },
  { id: 'documentos', label: 'Documentos', group: 'Fuentes', Icon: FileText },
];

const GROUP_ORDER: SectionGroup[] = ['Perfil', 'Inteligencia', 'Fuentes'];

/**
 * Módulos declarativos pendientes de backend — se rendera vía UnavailableBlock
 * con REQ codes canónicos. Coherentes con `MODULE_DEFAULTS` del registry
 * (`base/types.ts`) que ya define REQ-006/007/008 para senales/documentacion/actividad.
 * Ampliación con REQ-009 (propiedad) y REQ-010 (gobierno) para el mockup.
 */
const SECTION_PENDING: Partial<Record<SectionId, { req: string; eta: string; title: string; description: string }>> = {
  propiedad: {
    req: 'REQ-009',
    eta: 'Sprint 2',
    title: 'Estructura accionarial',
    description: 'Accionistas, participaciones y estructura societaria consolidada.',
  },
  gobierno: {
    req: 'REQ-010',
    eta: 'Sprint 2',
    title: 'Órganos de gobierno',
    description: 'Consejo, apoderamientos y auditor de las cuentas.',
  },
  registros: {
    req: 'REQ-008',
    eta: 'Sprint 2',
    title: 'Registros públicos',
    description: 'BORME, contratación pública y cuentas depositadas.',
  },
  documentos: {
    req: 'REQ-007',
    eta: 'Sprint 2',
    title: 'Documentos disponibles',
    description: 'Informe ejecutivo, memoria mercantil, teasers e IMs asociados.',
  },
};

/* ============================================================================
 * Escenarios de "Operación activa" (mockup del panel derecho)
 * ============================================================================
 */

interface DealScenario {
  id: DealScenarioId;
  label: string;
  short: string;
  color: string;
  bg: string;
  border: string;
  headline: string;
  terms: Array<{ label: string; value: string; link?: SectionId }>;
  actions: Array<{ id: string; label: string; done: string; primary?: boolean }>;
  timeline: Array<{ label: string; state: 'done' | 'active' | 'todo' }>;
}

const DEAL_SCENARIOS: Record<DealScenarioId, DealScenario> = {
  none: {
    id: 'none', label: 'Sin proceso activo', short: '', color: 'var(--text-subtle)', bg: 'var(--surface-2)', border: 'var(--border)',
    headline: '', terms: [], actions: [], timeline: [],
  },
  venta: {
    id: 'venta', label: 'En venta', short: 'Proceso de venta activo',
    color: '#E8001D', bg: 'rgba(232,0,29,.07)', border: 'rgba(232,0,29,.22)',
    headline: 'El propietario ha abierto un proceso de venta / entrada de socio. Arroba coordina el acceso a la información de forma confidencial.',
    terms: [
      { label: 'Tipo de proceso', value: 'Venta / entrada de socio' },
      { label: 'Participación', value: 'Hasta 100%' },
      { label: 'Asesor', value: 'Mandato Arroba' },
      { label: 'Rango orientativo', value: 'Pendiente de valoración', link: 'valoracion' },
    ],
    actions: [
      { id: 'nda', label: 'Descargar NDA', done: 'NDA descargado', primary: true },
      { id: 'cuaderno', label: 'Solicitar cuaderno de venta', done: 'Cuaderno solicitado' },
      { id: 'match', label: 'Hacer match con el vendedor', done: 'Match solicitado' },
      { id: 'interes', label: 'Indicar interés', done: 'Interés registrado' },
    ],
    timeline: [
      { label: 'Mandato firmado', state: 'done' },
      { label: 'Teaser disponible', state: 'done' },
      { label: 'Firma de NDA', state: 'active' },
      { label: 'Cuaderno de venta', state: 'todo' },
      { label: 'Ofertas indicativas', state: 'todo' },
      { label: 'Due diligence', state: 'todo' },
      { label: 'Cierre', state: 'todo' },
    ],
  },
  compra: {
    id: 'compra', label: 'Comprando', short: 'Mandato de compra activo',
    color: '#2164E3', bg: 'rgba(33,100,227,.07)', border: 'rgba(33,100,227,.22)',
    headline: 'Esta compañía busca adquisiciones para su estrategia de consolidación. Si representas a un target que encaja, puedes proponerlo.',
    terms: [
      { label: 'Tipo de proceso', value: 'Compra · buy & build' },
      { label: 'Sectores objetivo', value: 'Hotelero · termal · bienestar' },
      { label: 'Geografía', value: 'España' },
      { label: 'Ticket', value: 'Por definir' },
    ],
    actions: [
      { id: 'oportunidad', label: 'Presentar una oportunidad', done: 'Oportunidad enviada', primary: true },
      { id: 'match', label: 'Hacer match con el comprador', done: 'Match solicitado' },
      { id: 'tesis', label: 'Compartir tesis de encaje', done: 'Tesis enviada' },
      { id: 'nda', label: 'Descargar NDA', done: 'NDA descargado' },
    ],
    timeline: [
      { label: 'Mandato de compra', state: 'done' },
      { label: 'Criterios definidos', state: 'done' },
      { label: 'Búsqueda de targets', state: 'active' },
      { label: 'Primer contacto', state: 'todo' },
      { label: 'Firma de NDA', state: 'todo' },
      { label: 'Negociación', state: 'todo' },
    ],
  },
  financiacion: {
    id: 'financiacion', label: 'Buscando financiación', short: 'Ronda de financiación abierta',
    color: '#1A8A4A', bg: 'rgba(26,138,74,.08)', border: 'rgba(26,138,74,.25)',
    headline: 'La compañía tiene una ronda abierta para financiar su plan de expansión y nuevas aperturas.',
    terms: [
      { label: 'Tipo de proceso', value: 'Ampliación de capital / deuda' },
      { label: 'Destino', value: 'Aperturas y expansión' },
      { label: 'Instrumento', value: 'Equity / deuda' },
      { label: 'Importe', value: 'Por definir' },
    ],
    actions: [
      { id: 'nda', label: 'Descargar NDA', done: 'NDA descargado', primary: true },
      { id: 'dossier', label: 'Solicitar dossier de inversión', done: 'Dossier solicitado' },
      { id: 'match', label: 'Hacer match con el inversor', done: 'Match solicitado' },
      { id: 'interes', label: 'Indicar interés', done: 'Interés registrado' },
    ],
    timeline: [
      { label: 'Ronda abierta', state: 'done' },
      { label: 'Teaser disponible', state: 'done' },
      { label: 'Firma de NDA', state: 'active' },
      { label: 'Dossier de inversión', state: 'todo' },
      { label: 'Term sheet', state: 'todo' },
      { label: 'Cierre de ronda', state: 'todo' },
    ],
  },
  fusion: {
    id: 'fusion', label: 'Fusión', short: 'Explorando una fusión',
    color: '#7C3AED', bg: 'rgba(124,58,237,.07)', border: 'rgba(124,58,237,.22)',
    headline: 'La compañía explora una fusión con un actor complementario del sector para ganar escala.',
    terms: [
      { label: 'Tipo de proceso', value: 'Fusión / integración' },
      { label: 'Perfil buscado', value: 'Hotelero complementario' },
      { label: 'Estructura', value: 'Por definir' },
      { label: 'Geografía', value: 'España' },
    ],
    actions: [
      { id: 'nda', label: 'Descargar NDA', done: 'NDA descargado', primary: true },
      { id: 'encaje', label: 'Explorar encaje estratégico', done: 'Análisis solicitado' },
      { id: 'match', label: 'Hacer match', done: 'Match solicitado' },
      { id: 'interes', label: 'Indicar interés', done: 'Interés registrado' },
    ],
    timeline: [
      { label: 'Intención de fusión', state: 'done' },
      { label: 'Firma de NDA', state: 'active' },
      { label: 'Análisis de encaje', state: 'todo' },
      { label: 'Valoración relativa', state: 'todo' },
      { label: 'Estructura del acuerdo', state: 'todo' },
      { label: 'Cierre', state: 'todo' },
    ],
  },
};

const DEAL_ORDER: DealScenarioId[] = ['venta', 'compra', 'financiacion', 'fusion', 'none'];

/* ============================================================================
 * Renderer de bloques (BlockSpec canónico) — mismo patrón que producción
 * ============================================================================
 */

type AnyBlock = BlockSpec & { props: Record<string, unknown> };

function RenderBlock({ spec }: { spec: BlockSpec | null | undefined }) {
  if (!spec) return null;
  const b = spec as AnyBlock;
  if (b.type === 'hero') {
    const p = b.props as {
      eyebrow?: string;
      title?: string;
      subtitle?: string;
      tone?: string;
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
      items: Array<{
        label: string;
        value: string;
        hint?: string;
        trend?: 'up' | 'down' | 'flat';
      }>;
    };
    return (
      <MetricsBlock
        title={p.title}
        metrics={p.items.map((it, i) => ({
          id: `m_${i}`,
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

/* ============================================================================
 * Primitivos visuales compartidos
 * ============================================================================
 */

function SectionCard({
  children,
  className,
  testId,
}: {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'rounded-2xl border border-border bg-surface p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <div className="text-[11px] font-bold tracking-[0.09em] uppercase text-text-subtle mb-2">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-2xl font-bold text-text tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-text-muted mt-2 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Callout "Y esto implica" — pieza canónica del ce-sections1.jsx (línea 33). */
function ImpliesCallout({ text, cta, onCta }: { text: string; cta?: string; onCta?: () => void }) {
  return (
    <div
      className="mt-4 flex items-center gap-3 rounded-lg border p-3.5"
      style={{
        background: 'rgba(232,0,29,0.04)',
        borderColor: 'rgba(232,0,29,0.18)',
      }}
    >
      <span className="flex-shrink-0 w-6 h-6 rounded-md bg-primary flex items-center justify-center">
        <Sparkles size={12} className="text-white" strokeWidth={2.4} />
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold tracking-wider uppercase text-primary mr-2">
          Y esto implica
        </span>
        <span className="text-sm text-text leading-relaxed">{text}</span>
      </div>
      {cta && (
        <button
          onClick={onCta}
          className="flex-shrink-0 px-3.5 py-2 rounded-md border border-border-strong bg-surface text-primary text-sm font-bold hover:border-primary transition-colors"
        >
          {cta} →
        </button>
      )}
    </div>
  );
}

/* ============================================================================
 * Header banner (canónico) — banner surface-2 con avatar, badges, hero row
 * ============================================================================
 */

function CanonicalHeader({
  initial,
  onOpenOportunidades,
}: {
  initial: CompanyDetailResponse;
  onOpenOportunidades: () => void;
}) {
  const { header } = initial;
  const [saved, setSaved] = useState<boolean>(initial.in_watchlist);
  const [following, setFollowing] = useState<boolean>(false);

  const subtitleParts = [
    header.sector,
    header.region,
    header.country,
    header.cif,
  ].filter((v): v is string => Boolean(v));

  return (
    <div
      data-testid="mockup-canonical-header"
      className="bg-surface-2 border-b border-border"
    >
      <div className="mx-auto max-w-[min(1760px,95vw)] px-7 py-5">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-text-subtle mb-3.5 flex items-center gap-1.5"
        >
          <span>Analizar</span>
          <span aria-hidden>/</span>
          <span>Empresas</span>
          <span aria-hidden>/</span>
          <span className="text-text font-semibold">{header.name}</span>
        </nav>

        {/* Row 1: Avatar + identity + secondary actions */}
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="w-[52px] h-[52px] rounded-xl flex-shrink-0 flex items-center justify-center text-[19px] font-black text-primary font-display"
              style={{ background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)' }}
            >
              {header.initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                <h1 className="font-display text-[23px] font-extrabold text-text leading-tight">
                  {header.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border" style={{ color: '#1A8A4A', background: '#E8F5EE', borderColor: '#C2E8D0' }}>
                  <Sparkles size={10} className="text-primary" strokeWidth={2.4} />
                  Verificada
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted bg-surface px-2 py-0.5 rounded border border-border whitespace-nowrap">
                  <ShieldCheck size={11} strokeWidth={2} /> Auditada · Ernst & Young
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-sm text-text-muted">
                <span>{subtitleParts.join(' · ')}</span>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <ExternalLink size={12} strokeWidth={2} />
                  castillatermal.com
                </a>
              </div>
            </div>
          </div>

          {/* Secondary actions: Guardar · Seguir · Compartir */}
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              data-testid="mockup-action-save"
              onClick={() => setSaved((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-[1.5px] text-sm font-semibold transition-colors',
                saved
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border-strong bg-surface text-text hover:border-primary',
              )}
            >
              {saved ? <BookmarkCheck size={14} strokeWidth={2} /> : <Bookmark size={14} strokeWidth={2} />}
              {saved ? 'Guardada' : 'Guardar'}
            </button>
            <button
              data-testid="mockup-action-follow"
              onClick={() => setFollowing((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-[1.5px] text-sm font-semibold transition-colors',
                following
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border-strong bg-surface text-text hover:border-primary',
              )}
            >
              <Bell size={14} strokeWidth={2} />
              {following ? 'Siguiendo' : 'Seguir'}
            </button>
            <button
              data-testid="mockup-action-share"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border-strong bg-surface hover:border-primary transition-colors"
              aria-label="Compartir"
            >
              <Share2 size={14} strokeWidth={2} className="text-text-muted" />
            </button>
          </div>
        </div>

        {/* Hero row: Oportunidades + CTAs */}
        <div className="mt-4 pt-4 border-t border-border flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <span className="text-[11px] font-bold tracking-wider uppercase text-text-subtle inline-flex items-center gap-1.5 flex-shrink-0">
              <Sparkles size={11} className="text-primary" strokeWidth={2.4} />
              Oportunidades
            </span>
            <div className="flex gap-2 flex-wrap">
              {['Buy & Build', 'Captación de capital', 'Entrada de socio'].map((op) => (
                <button
                  key={op}
                  data-testid={`mockup-opportunity-chip-${op.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '')}`}
                  onClick={onOpenOportunidades}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-text bg-surface border border-border px-3 py-1.5 rounded-full hover:border-primary transition-colors"
                >
                  <span className="text-primary text-[10px]">✓</span> {op}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              data-testid="mockup-cta-activate"
              onClick={onOpenOportunidades}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <Sparkles size={13} strokeWidth={2.4} /> Activar oportunidad
            </button>
            <button
              data-testid="mockup-cta-claim"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border-[1.5px] border-text bg-surface text-text text-sm font-semibold hover:opacity-80 transition-opacity"
            >
              <ShieldCheck size={13} strokeWidth={2} /> Reclamar mi empresa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * Deal Banner (canónico) — franja slim bajo el header cuando hay proceso activo
 * ============================================================================
 */

function CanonicalDealBanner({ deal }: { deal: DealScenarioId }) {
  const s = DEAL_SCENARIOS[deal];
  if (s.id === 'none') return null;
  return (
    <div
      data-testid="mockup-deal-banner"
      className="text-white"
      style={{ background: s.color }}
    >
      <div className="mx-auto max-w-[min(1760px,95vw)] px-7 py-2.5 flex items-center gap-3.5 flex-wrap">
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide">
          <span
            className="w-2 h-2 rounded-full bg-white"
            style={{ animation: 'pulse 1.6s infinite' }}
          />
          {s.label.toUpperCase()}
        </span>
        <span className="text-xs opacity-90">
          {s.short} · esta compañía tiene una operación en curso en Arroba
        </span>
      </div>
    </div>
  );
}

/* ============================================================================
 * Section Nav (canónico) — sticky left column con grupos Perfil/Inteligencia/Fuentes
 * ============================================================================
 */

function CanonicalSectionNav({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav
      data-testid="mockup-section-nav"
      className="sticky top-[78px] pt-0"
    >
      {GROUP_ORDER.map((group) => (
        <div key={group} className="mb-5">
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-subtle mb-2 pl-3">
            {group}
          </div>
          {NAV.filter((n) => n.group === group).map((n) => {
            const on = active === n.id;
            return (
              <button
                key={n.id}
                data-testid={`mockup-nav-${n.id}`}
                onClick={() => onSelect(n.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 py-2 px-3 rounded-lg mb-0.5 text-left transition-colors',
                  on
                    ? 'bg-primary/10 text-text font-bold'
                    : 'text-text-muted font-medium hover:bg-surface-2',
                )}
              >
                <n.Icon
                  size={15}
                  strokeWidth={2}
                  className={on ? 'text-primary' : 'text-text-subtle'}
                />
                <span className="text-[13.5px]">{n.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/* ============================================================================
 * Deal Panel (canónico) — sticky right column, ancho 360px
 * ============================================================================
 */

function CanonicalDealPanel({
  deal,
  setDeal,
  onGoTo,
}: {
  deal: DealScenarioId;
  setDeal: (d: DealScenarioId) => void;
  onGoTo: (id: SectionId) => void;
}) {
  const [actionsTaken, setActionsTaken] = useState<Record<string, boolean>>({});
  const s = DEAL_SCENARIOS[deal];

  // Reset actions state at every deal change (spec parity con ce-deal.jsx L127).
  useEffect(() => {
    setActionsTaken({});
  }, [deal]);

  const Switcher = (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-[9.5px] font-bold tracking-wider uppercase text-text-subtle">
        Escenario · demo
      </span>
      <select
        data-testid="mockup-deal-switcher"
        value={deal}
        onChange={(e) => setDeal(e.target.value as DealScenarioId)}
        className="flex-1 text-[11.5px] font-semibold text-text-muted bg-surface border border-border rounded-md px-2 py-1 cursor-pointer"
      >
        {DEAL_ORDER.map((id) => (
          <option key={id} value={id}>
            {DEAL_SCENARIOS[id].label}
          </option>
        ))}
      </select>
    </div>
  );

  if (s.id === 'none') {
    return (
      <div
        data-testid="mockup-deal-panel"
        className="sticky top-[78px] self-start flex flex-col gap-4"
      >
        {Switcher}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="text-[13px] font-bold text-text mb-1.5">
            Sin proceso activo
          </div>
          <p className="text-xs text-text-muted leading-relaxed mb-3">
            Esta compañía no tiene un proceso de M&A en curso. Si la representas,
            puedes activar un mandato de venta, compra, financiación o fusión.
          </p>
          <button className="w-full py-2.5 rounded-lg border-[1.5px] border-text bg-surface text-text text-sm font-bold hover:opacity-80 transition-opacity">
            Reclamar mi empresa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="mockup-deal-panel"
      className="sticky top-[78px] self-start flex flex-col gap-4"
    >
      {Switcher}
      <div
        className="rounded-2xl border-[1.5px] bg-surface overflow-hidden"
        style={{ borderColor: s.border }}
      >
        {/* header */}
        <div
          className="p-4 border-b"
          style={{ background: s.bg, borderColor: s.border }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: s.color }}
            >
              <Building2 size={14} className="text-white" strokeWidth={2.2} />
            </div>
            <div>
              <div
                className="text-[9.5px] font-bold tracking-wider uppercase"
                style={{ color: s.color }}
              >
                Operación activa
              </div>
              <div className="text-sm font-black text-text font-display leading-tight">
                {s.label}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-[12.3px] text-text-muted leading-relaxed mb-3.5">
            {s.headline}
          </p>

          {/* terms */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-3.5 pb-3.5 border-b border-border">
            {s.terms.map((t) => (
              <div key={t.label}>
                <div className="text-[10px] text-text-subtle mb-0.5">{t.label}</div>
                {t.link ? (
                  <button
                    onClick={() => onGoTo(t.link!)}
                    className="p-0 border-0 bg-transparent text-xs font-bold cursor-pointer text-left"
                    style={{ color: s.color }}
                  >
                    {t.value} →
                  </button>
                ) : (
                  <div className="text-xs font-semibold text-text">{t.value}</div>
                )}
              </div>
            ))}
          </div>

          {/* actions */}
          <div className="text-[9.5px] font-bold tracking-wider uppercase text-text-subtle mb-2">
            Acciones
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            {s.actions.map((a) => {
              const done = !!actionsTaken[a.id];
              const primary = a.primary && !done;
              return (
                <button
                  key={a.id}
                  data-testid={`mockup-deal-action-${a.id}`}
                  onClick={() => setActionsTaken((p) => ({ ...p, [a.id]: true }))}
                  disabled={done}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12.5px] font-semibold text-left transition-colors',
                    done ? 'cursor-default' : 'cursor-pointer',
                  )}
                  style={
                    primary
                      ? { background: s.color, color: '#fff', border: 'none' }
                      : done
                      ? { background: s.bg, color: s.color, border: `1px solid ${s.border}` }
                      : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-strong)' }
                  }
                >
                  <span className="flex-1">{done ? a.done : a.label}</span>
                  {done && <span className="text-[13px]" style={{ color: s.color }}>✓</span>}
                </button>
              );
            })}
          </div>

          {/* timeline */}
          <div className="text-[9.5px] font-bold tracking-wider uppercase text-text-subtle mb-2.5">
            Proceso
          </div>
          <div className="relative pl-1">
            {s.timeline.map((step, i) => {
              const last = i === s.timeline.length - 1;
              return (
                <div
                  key={i}
                  className={cn('relative flex gap-2.5', last ? 'pb-0' : 'pb-3')}
                >
                  {!last && (
                    <div
                      className="absolute left-[5px] top-3 bottom-0 w-[2px]"
                      style={{ background: step.state === 'done' ? s.color : 'var(--border)' }}
                    />
                  )}
                  <div
                    className="relative z-10 flex-shrink-0 mt-0.5 w-3 h-3 rounded-full"
                    style={{
                      background: step.state === 'todo' ? 'var(--surface)' : s.color,
                      border:
                        step.state === 'todo'
                          ? '2px solid var(--border-strong)'
                          : step.state === 'active'
                          ? `2px solid ${s.color}`
                          : 'none',
                      boxShadow: step.state === 'active' ? `0 0 0 4px ${s.bg}` : 'none',
                    }}
                  >
                    {step.state === 'active' && (
                      <span className="absolute inset-[2px] rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs',
                      step.state === 'active'
                        ? 'font-bold text-text'
                        : step.state === 'todo'
                        ? 'font-medium text-text-subtle'
                        : 'font-medium text-text',
                    )}
                  >
                    {step.label}
                    {step.state === 'active' && (
                      <span
                        className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: s.color, background: s.bg }}
                      >
                        Fase actual
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * Secciones (10 canónicas)
 * ============================================================================
 */

function SecResumen({ initial }: { initial: CompanyDetailResponse }) {
  const { header, sections } = initial;
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        eyebrow="Perfil · Resumen"
        title={header.name}
        subtitle="Vista integrada: identidad, cifras clave y lectura del Company Advisor."
      />
      {sections.hero && <RenderBlock spec={sections.hero} />}
      {sections.kpi_metrics && <RenderBlock spec={sections.kpi_metrics} />}
      <SectionCard testId="mockup-identity-card">
        <IdentityGrid identity={sections.identity} />
      </SectionCard>
      {sections.narrative ? (
        <RenderBlock spec={sections.narrative} />
      ) : (
        <ImpliesCallout
          text="El Company Advisor genera un resumen cuando refrescas el análisis desde la ficha."
          cta="Ver análisis"
          onCta={() => {}}
        />
      )}
    </div>
  );
}

function IdentityGrid({
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
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
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

function SecFinanzas({ initial }: { initial: CompanyDetailResponse }) {
  const { sections } = initial;
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        eyebrow="Perfil · Finanzas"
        title="Cuentas y ratios financieros"
        subtitle="Cuentas oficiales, KPIs derivados y ratios clave. Datos individuales del último ejercicio disponible."
      />
      {sections.financials_metrics ? (
        <RenderBlock spec={sections.financials_metrics} />
      ) : (
        <SectionCard>
          <p className="text-sm text-text-muted">
            No hay indicadores financieros para este ejercicio.
          </p>
        </SectionCard>
      )}
      <ImpliesCallout
        text="Margen EBITDA sobre la media sectorial + balance sólido → apalancamiento moderado."
        cta="Ir a valoración"
        onCta={() => {}}
      />
    </div>
  );
}

function SecValoracion({ initial }: { initial: CompanyDetailResponse }) {
  const { sections } = initial;
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        eyebrow="Perfil · Valoración"
        title="Valoración indicativa"
        subtitle="Múltiplo determinístico sobre ingresos y rango 0.75×–1.30×. Para valoración avanzada, solicítala desde la ficha."
      />
      {sections.valuation ? (
        <RenderBlock spec={sections.valuation} />
      ) : (
        <SectionCard>
          <p className="text-sm text-text-muted">
            La valoración indicativa se está calculando. Vuelve en unos segundos
            o refréscala desde el Company Advisor.
          </p>
        </SectionCard>
      )}
    </div>
  );
}

function SecMercado({ initial }: { initial: CompanyDetailResponse }) {
  const { sections } = initial;
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        eyebrow="Perfil · Mercado"
        title="Posición en el sector"
        subtitle="Comparables cercanos por sector y región + score de cercanía."
      />
      {sections.comparables ? (
        <RenderBlock spec={sections.comparables} />
      ) : (
        <SectionCard>
          <p className="text-sm text-text-muted">
            Sin comparables suficientes para este perfil.
          </p>
        </SectionCard>
      )}
    </div>
  );
}

function SecSenales({ initial }: { initial: CompanyDetailResponse }) {
  const { sections } = initial;
  if (sections.score_block) {
    return (
      <div className="flex flex-col gap-6">
        <SectionTitle
          eyebrow="Inteligencia · Señales"
          title="Score y señales externas"
          subtitle="Score consolidado + señales BORME, contratación pública y cambios societarios."
        />
        <RenderBlock spec={sections.score_block} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        eyebrow="Inteligencia · Señales"
        title="Score y señales externas"
      />
      <UnavailableBlock
        title="Motor de señales externas"
        description="BORME, contratación pública y cambios societarios en tiempo real."
        req="REQ-006"
        eta="Sprint 2"
      />
    </div>
  );
}

function SecOportunidades({ initial }: { initial: CompanyDetailResponse }) {
  const { sections } = initial;
  const oportunidades = [
    {
      type: 'Buy & Build',
      title: 'Plataforma de consolidación sectorial',
      conf: 84,
      value: 'Alto',
      heat: 'Alta',
      desc: 'Holding operativo con margen EBITDA P90+, base idónea para seguir integrando actores del segmento.',
    },
    {
      type: 'Captación de capital',
      title: 'Capital de expansión para nuevas aperturas',
      conf: 71,
      value: 'Medio',
      heat: 'Media',
      desc: 'Deuda neta/EBITDA moderada y balance sólido: capacidad para financiar aperturas con inversor institucional.',
    },
    {
      type: 'Entrada de socio',
      title: 'Encaje para un grupo estratégico',
      conf: 66,
      value: 'Medio',
      heat: 'Media',
      desc: 'Activos singulares y rentabilidad superior a la media, atractivos para un operador especializado.',
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        eyebrow="Inteligencia · Oportunidades"
        title="Oportunidades detectadas por Arroba"
        subtitle="Sugerencias del Copilot basadas en el perfil financiero y sectorial de la empresa."
      />
      {sections.narrative && <RenderBlock spec={sections.narrative} />}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {oportunidades.map((o) => (
          <SectionCard
            key={o.type}
            testId={`mockup-opportunity-${o.type.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '')}`}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
                {o.type}
              </span>
              <span className="text-[10px] text-text-muted ml-auto">{o.conf}%</span>
            </div>
            <div className="text-sm font-bold text-text">{o.title}</div>
            <p className="text-xs text-text-muted leading-relaxed">{o.desc}</p>
            <div className="flex gap-2 text-[10px] text-text-subtle mt-1">
              <span>Valor · {o.value}</span>
              <span>·</span>
              <span>Heat · {o.heat}</span>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

function SecPending({ id }: { id: SectionId }) {
  const meta = SECTION_PENDING[id];
  if (!meta) return null;
  const groupItem = NAV.find((n) => n.id === id);
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        eyebrow={`${groupItem?.group} · ${groupItem?.label}`}
        title={meta.title}
        subtitle={meta.description}
      />
      <UnavailableBlock
        title={meta.title}
        description={meta.description}
        req={meta.req}
        eta={meta.eta}
      />
    </div>
  );
}

/* ============================================================================
 * Section dispatcher (una sección visible a la vez)
 * ============================================================================
 */

function CanonicalSectionContent({
  section,
  initial,
}: {
  section: SectionId;
  initial: CompanyDetailResponse;
}) {
  switch (section) {
    case 'resumen':
      return <SecResumen initial={initial} />;
    case 'finanzas':
      return <SecFinanzas initial={initial} />;
    case 'valoracion':
      return <SecValoracion initial={initial} />;
    case 'mercado':
      return <SecMercado initial={initial} />;
    case 'senales':
      return <SecSenales initial={initial} />;
    case 'oportunidades':
      return <SecOportunidades initial={initial} />;
    case 'propiedad':
    case 'gobierno':
    case 'registros':
    case 'documentos':
      return <SecPending id={section} />;
    default:
      return null;
  }
}

/* ============================================================================
 * Componente principal
 * ============================================================================
 */

export interface CanonicalEntityMockupClientProps {
  cif: string;
  initial: CompanyDetailResponse;
}

export function CanonicalEntityMockupClient({
  cif,
  initial,
}: CanonicalEntityMockupClientProps) {
  const [section, setSection] = useState<SectionId>('resumen');
  const [deal, setDeal] = useState<DealScenarioId>('venta');
  const contentRef = useRef<HTMLDivElement | null>(null);

  const goTo = useCallback((id: SectionId) => {
    setSection(id);
  }, []);

  // scrollTo(0,0) al cambiar de sección — parity con ce-app.jsx L18.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [section]);

  const activeNav = useMemo(() => NAV.find((n) => n.id === section), [section]);

  return (
    <div
      data-testid="mockup-canonical-entity-root"
      data-cif={cif}
      data-active-section={section}
      className="min-h-screen -mx-6 md:-mx-8 lg:-mx-10"
    >
      {/* Banner sticky de aviso: esta ruta es un mockup */}
      <div
        data-testid="mockup-preview-notice"
        className="bg-amber-500/10 border-b border-amber-500/30 text-[11px] font-semibold text-amber-800 dark:text-amber-300 text-center py-1.5 tracking-wide uppercase"
      >
        Vista previa canónica · ruta aislada · pendiente de aprobación visual
      </div>

      <CanonicalHeader
        initial={initial}
        onOpenOportunidades={() => goTo('oportunidades')}
      />

      <CanonicalDealBanner deal={deal} />

      <div
        className="mx-auto max-w-[min(1760px,95vw)] px-7 py-6 pb-20 grid gap-8 items-start"
        style={{ gridTemplateColumns: '210px minmax(0,1fr) 360px' }}
      >
        {/* Left: Section Nav */}
        <CanonicalSectionNav active={section} onSelect={goTo} />

        {/* Center: content — una sección visible a la vez */}
        <div
          ref={contentRef}
          data-testid={`mockup-section-${section}`}
          data-testid-active-label={activeNav?.label ?? ''}
          className="min-w-0"
        >
          <CanonicalSectionContent section={section} initial={initial} />
        </div>

        {/* Right: Deal Panel */}
        <CanonicalDealPanel deal={deal} setDeal={setDeal} onGoTo={goTo} />
      </div>
    </div>
  );
}
