'use client';
import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Info, Sparkles } from 'lucide-react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  ConfidenceBadge,
  Divider,
  Input,
  Spinner,
  Tooltip,
} from '@/components/ds';
import { RequireAuth } from '@/components/RequireAuth';
import { tokens } from '@/lib/tokens';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDecimal,
  formatNumber,
  formatPercent,
} from '@/lib/format';
import { contrastRatio, passesAA } from '@/lib/contrast';
import { cn } from '@/lib/cn';
import {
  EmptyStateBlock,
  ErrorBlock,
  LoadingBlock,
  MetricsGrid,
  RefreshButton,
  UnavailableBlock,
} from '@/components/blocks';
import { LockedSectionBlur } from '@/components/entity';
import { notify } from '@/lib/notify';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="font-display font-semibold text-xl mb-4">{title}</h2>
      <Card>{children}</Card>
    </section>
  );
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-12 h-12 rounded-md border border-border"
        style={{ background: `var(${varName})` }}
      />
      <div>
        <p className="font-display font-medium text-sm">{name}</p>
        <p className="text-xs text-text-subtle font-mono">var({varName})</p>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <RequireAuth role="admin">
      <DesignSystemInner />
    </RequireAuth>
  );
}

function DesignSystemInner() {
  const t = useTranslations();
  const [mono, setMono] = useState(false);

  /* Contrast pairs computed from tokens.ts (light mode values). */
  const contrastPairs = useMemo(
    () => [
      { name: 'text on bg', a: tokens.neutral[950], b: tokens.neutral[50] },
      { name: 'text-muted on bg', a: tokens.neutral[600], b: tokens.neutral[50] },
      { name: 'white on primary', a: tokens.brand.white, b: tokens.brand.red },
      { name: 'text-subtle on surface', a: tokens.neutral[400], b: tokens.brand.white },
      { name: 'text on surface-2', a: tokens.neutral[950], b: tokens.neutral[100] },
      { name: 'white on success', a: tokens.brand.white, b: tokens.feedback.success },
      { name: 'white on warning', a: tokens.brand.white, b: tokens.feedback.warning },
      { name: 'white on danger', a: tokens.brand.white, b: tokens.feedback.danger },
    ],
    []
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12" data-monochrome={mono ? '' : undefined}>
      <header className="mb-10">
        <h1 className="font-display font-semibold text-3xl mb-2">{t('ds.title')}</h1>
        <p className="text-text-muted">{t('ds.subtitle')}</p>
      </header>

      <div className="mb-12 flex gap-2 items-center">
        <Button variant="secondary" onClick={() => setMono((m) => !m)}>
          {mono ? t('monochrome.off') : t('monochrome.on')}
        </Button>
        <p className="text-xs text-text-subtle font-body">
          QA visual: si la jerarquía no funciona en monocromo, falta contraste.
        </p>
      </div>

      <Section id="brand" title={t('ds.sectionBrand')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Swatch name="Arroba Red" varName="--arroba-red" />
          <Swatch name="Arroba Red Hover" varName="--arroba-red-hover" />
          <Swatch name="Arroba Red Dark" varName="--arroba-red-dark" />
          <Swatch name="Arroba Red Light" varName="--arroba-red-light" />
          <Swatch name="Arroba Black" varName="--arroba-black" />
        </div>
      </Section>

      <Section id="semantic" title={t('ds.sectionSemantic')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Swatch name="bg" varName="--bg" />
          <Swatch name="surface" varName="--surface" />
          <Swatch name="surface-2" varName="--surface-2" />
          <Swatch name="border" varName="--border" />
          <Swatch name="border-strong" varName="--border-strong" />
          <Swatch name="text" varName="--text" />
          <Swatch name="text-muted" varName="--text-muted" />
          <Swatch name="text-subtle" varName="--text-subtle" />
          <Swatch name="primary" varName="--primary" />
          <Swatch name="primary-hover" varName="--primary-hover" />
        </div>
      </Section>

      <Section id="feedback" title={t('ds.sectionFeedback')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Swatch name="success" varName="--success" />
          <Swatch name="warning" varName="--warning" />
          <Swatch name="danger" varName="--danger" />
          <Swatch name="info" varName="--info" />
        </div>
      </Section>

      <Section id="typography" title={t('ds.sectionTypography')}>
        <div className="space-y-3">
          <p className="font-display text-3xl">Space Grotesk — Display</p>
          <p className="font-body text-lg">DM Sans — Body</p>
          <p className="font-mono tabular text-base">JetBrains Mono — Datos 12.345,67</p>
        </div>
      </Section>

      <Section id="format" title={t('ds.sectionFormat')}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono tabular text-sm">
          <div><span className="text-text-subtle text-xs block font-body">Number</span>{formatNumber(183978)}</div>
          <div><span className="text-text-subtle text-xs block font-body">Decimal</span>{formatDecimal(4.8)}</div>
          <div><span className="text-text-subtle text-xs block font-body">Currency (M)</span>{formatCurrency(4_800_000)}</div>
          <div><span className="text-text-subtle text-xs block font-body">Currency (exact)</span>{formatCurrency(4_823_000, { compact: false })}</div>
          <div><span className="text-text-subtle text-xs block font-body">Percent</span>{formatPercent(18.1)}</div>
          <div><span className="text-text-subtle text-xs block font-body">Date</span>{formatDate('2026-05-31')}</div>
          <div><span className="text-text-subtle text-xs block font-body">Date short</span>{formatDateShort(new Date(2026, 4, 31), { month: true })}</div>
        </div>
      </Section>

      <Section id="spacing" title={t('ds.sectionSpacing')}>
        <div className="space-y-2 font-mono text-xs">
          {tokens.spacing.map((s) => (
            <div key={s} className="flex items-center gap-3">
              <span className="w-16 text-text-subtle">{s}px</span>
              <span className="h-4 bg-primary rounded-sm" style={{ width: s }} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="radii" title={t('ds.sectionRadii')}>
        <div className="flex flex-wrap gap-6">
          {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((r) => (
            <div key={r} className="flex flex-col items-center gap-2">
              <span
                className="w-16 h-16 bg-surface-2 border border-border"
                style={{ borderRadius: `var(--radius-${r})` }}
              />
              <span className="text-xs font-mono text-text-subtle">{r}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="primitives" title={t('ds.sectionPrimitives')}>
        <h3 id="primitives-buttons" className="font-display font-medium text-sm text-text-muted uppercase tracking-wider mb-3 scroll-mt-20">
          Buttons
        </h3>
        <div className="flex flex-wrap gap-3 mb-6">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Sm</Button>
          <Button size="lg">Lg</Button>
        </div>
        <Divider className="my-4" />
        <h3 id="primitives-inputs" className="font-display font-medium text-sm text-text-muted uppercase tracking-wider mb-3 scroll-mt-20">
          Inputs
        </h3>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Input label="Email" placeholder="hola@arroba.com" />
          <Input label="Contraseña" type="password" helperText="Mínimo 8 caracteres" />
          <Input label="Con error" defaultValue="x" error="Email no válido" />
        </div>
        <Divider className="my-4" />
        <h3 id="primitives-badges" className="font-display font-medium text-sm text-text-muted uppercase tracking-wider mb-3 scroll-mt-20">
          Badges
        </h3>
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="info" icon={<Sparkles size={10} className="ai-marker" />}>✩ IA</Badge>
        </div>
        <h3 id="primitives-alerts" className="font-display font-medium text-sm text-text-muted uppercase tracking-wider mb-3 scroll-mt-20">
          Alerts
        </h3>
        <div className="space-y-2 mb-6">
          <Alert variant="info" title="Info">Esta acción es trazable.</Alert>
          <Alert variant="success" title="Listo">Cambios guardados correctamente.</Alert>
          <Alert variant="warning" title="Atención">Revisa los datos.</Alert>
          <Alert variant="danger" title="Error">No se ha podido completar.</Alert>
        </div>
        <Divider className="my-4" />
        <h3 id="primitives-avatar" className="font-display font-medium text-sm text-text-muted uppercase tracking-wider mb-3 scroll-mt-20">
          Avatar &amp; Spinner
        </h3>
        <div className="flex items-center gap-6 mb-6 flex-wrap">
          <Avatar name="Ana Pérez" />
          <Avatar name="Carlos Muñoz" size={44} />
          <Avatar name="Álvaro García" size={56} />
          <Spinner />
        </div>
        <h3 id="primitives-confidence" className="font-display font-medium text-sm text-text-muted uppercase tracking-wider mb-3 scroll-mt-20">
          Confidence
        </h3>
        <div className="flex flex-wrap gap-2">
          <ConfidenceBadge confidence={0.88} />
          <ConfidenceBadge confidence={0.65} />
          <ConfidenceBadge confidence={0.32} />
        </div>
      </Section>

      <Section id="card" title="Card">
        <p className="text-sm text-text-muted mb-4">
          Contenedor base. Variantes: simple, con header, con footer.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <p className="font-display font-medium mb-1">Card simple</p>
            <p className="text-sm text-text-muted">Contenido libre.</p>
          </Card>
          <Card header={<span>Con header</span>}>
            <p className="text-sm text-text-muted">El header tiene una línea inferior.</p>
          </Card>
          <Card header={<span>Card completa</span>} footer={<span className="text-xs text-text-subtle">Footer</span>}>
            <p className="text-sm text-text-muted">Header + body + footer.</p>
          </Card>
        </div>
      </Section>

      <Section id="contrast" title={t('ds.sectionContrast')}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm font-body">
            <thead className="text-text-subtle text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left py-2">{t('ds.contrastPair')}</th>
                <th className="text-left py-2">{t('ds.contrastRatio')}</th>
                <th className="text-left py-2">{t('ds.contrastResult')}</th>
                <th className="text-left py-2">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contrastPairs.map((p) => {
                const ratio = contrastRatio(p.a, p.b);
                const ok = passesAA(p.a, p.b);
                return (
                  <tr key={p.name}>
                    <td className="py-3 pr-4">{p.name}</td>
                    <td className="py-3 pr-4 font-mono tabular">{ratio.toFixed(2)} : 1</td>
                    <td className="py-3 pr-4">
                      <Badge variant={ok ? 'success' : 'danger'}>
                        {ok ? t('ds.contrastPass') : t('ds.contrastFail')}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <span
                        className={cn('inline-block px-3 py-1 rounded-md text-sm')}
                        style={{ color: p.a, background: p.b }}
                      >
                        Aa
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ================================================================
       * v1.0.0 — Canonical Design System (E1.5.5)
       *
       * From here down: tokens + components + page patterns documented in
       * /app/memory/DESIGN_SYSTEM.md. Living catalog rendered with the
       * actual primitives (not mocks).
       * ============================================================== */}
      <DesignSystemV1Catalog />
    </div>
  );
}

/* ====================================================================
 * Helpers and the v1.0.0 living catalog.
 * ================================================================== */

function ThemeSwitcher() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.hasAttribute('data-dark'));
  }, []);
  function toggle() {
    const html = document.documentElement;
    if (html.hasAttribute('data-dark')) {
      html.removeAttribute('data-dark');
      setDark(false);
    } else {
      html.setAttribute('data-dark', '');
      setDark(true);
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      data-testid="ds-theme-switcher"
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2',
        'text-body-sm font-semibold border border-border-default',
        'bg-surface-elevated text-text-primary hover:bg-surface-muted',
        'transition-colors duration-fast focus-visible:shadow-focus',
      )}
    >
      {dark ? '☀ Light' : '☾ Dark'}
    </button>
  );
}

function BreakpointBadge() {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-caption font-mono text-text-muted"
      data-testid="ds-breakpoint-badge"
    >
      <span className="block sm:hidden">xs &lt;640</span>
      <span className="hidden sm:block md:hidden">sm 640-768</span>
      <span className="hidden md:block lg:hidden">md 768-1024</span>
      <span className="hidden lg:block xl:hidden">lg 1024-1280</span>
      <span className="hidden xl:block 2xl:hidden">xl 1280-1536</span>
      <span className="hidden 2xl:block">2xl ≥1536</span>
    </div>
  );
}

function CanonSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-testid={`ds-canon-${id}`}
      className="mb-12 scroll-mt-20"
    >
      <header className="mb-4">
        <h2 className="font-display font-semibold text-h2 leading-h2 text-text-primary">
          {title}
        </h2>
        {description && (
          <p className="text-body-sm text-text-secondary mt-1">{description}</p>
        )}
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function TokenChip({ name, value }: { name: string; value: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-elevated p-3"
      data-testid={`ds-token-${name}`}
    >
      <span
        aria-hidden
        className="block w-10 h-10 rounded-md border border-border-default shrink-0"
        style={{ background: `var(${value})` }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold text-text-primary truncate">
          {name}
        </p>
        <p className="text-caption text-text-muted font-mono truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

const SEMANTIC_TOKENS: Array<{ name: string; value: string }> = [
  { name: 'brand-primary', value: '--brand-primary' },
  { name: 'brand-primary-hover', value: '--brand-primary-hover' },
  { name: 'brand-accent', value: '--brand-accent' },
  { name: 'surface-primary', value: '--surface-primary' },
  { name: 'surface-elevated', value: '--surface-elevated' },
  { name: 'surface-muted', value: '--surface-muted' },
  { name: 'text-primary', value: '--text-primary' },
  { name: 'text-secondary', value: '--text-secondary' },
  { name: 'text-muted', value: '--text-muted' },
  { name: 'text-disabled', value: '--text-disabled' },
  { name: 'border-default', value: '--border-default' },
  { name: 'border-emphasis', value: '--border-emphasis' },
  { name: 'success', value: '--success' },
  { name: 'warning', value: '--warning' },
  { name: 'danger', value: '--danger' },
  { name: 'info', value: '--info' },
];

function DesignSystemV1Catalog() {
  return (
    <div data-testid="ds-v1-catalog" className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-6 mt-12 border-t border-border-default">
        <div>
          <p className="text-caption uppercase tracking-caption text-text-muted">
            E1.5.5 · canonized
          </p>
          <h2 className="text-h1 font-display font-semibold leading-h1 text-text-primary">
            Design System v1.0.0
          </h2>
          <p className="text-body text-text-secondary mt-2 max-w-2xl">
            Catálogo vivo de tokens semánticos, componentes canonizados y page
            patterns. Spec en{' '}
            <code className="font-mono text-body-sm">
              /app/memory/DESIGN_SYSTEM.md
            </code>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BreakpointBadge />
          <ThemeSwitcher />
        </div>
      </header>

      {/* ---------- Tokens semánticos ---------- */}
      <CanonSection
        id="tokens-semantic"
        title="Tokens semánticos"
        description="Paleta canónica. Click en cada chip para ver el valor (el catálogo se redibuja al cambiar light/dark)."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SEMANTIC_TOKENS.map((t) => (
            <TokenChip key={t.name} name={t.name} value={t.value} />
          ))}
        </div>
      </CanonSection>

      {/* ---------- Type scale ---------- */}
      <CanonSection
        id="type-scale"
        title="Type scale canónica"
        description="Display · h1-h4 · body · body-sm · caption. Todas con line-height y letter-spacing definidos."
      >
        <div className="space-y-3" data-testid="ds-type-scale">
          <p className="text-display font-display leading-display tracking-display">
            Display 72
          </p>
          <p className="text-h1 font-display leading-h1 tracking-h1">H1 36</p>
          <p className="text-h2 font-display leading-h2 tracking-h2">H2 28</p>
          <p className="text-h3 font-display leading-h3 tracking-h3">H3 22</p>
          <p className="text-h4 font-display leading-h4">H4 18</p>
          <p className="text-body">Body 15 — texto por defecto con DM Sans.</p>
          <p className="text-body-sm text-text-secondary">
            Body-sm 14 — microcopy y descripciones secundarias.
          </p>
          <p className="text-caption text-text-muted uppercase tracking-caption">
            Caption 12 — labels y badges
          </p>
        </div>
      </CanonSection>

      {/* ---------- RefreshButton variants ---------- */}
      <CanonSection
        id="refresh-button"
        title="RefreshButton — 4 estados"
        description="idle · loading · cooldown · disabled. Atributo data-state para QA."
      >
        <div className="flex flex-wrap gap-3">
          <RefreshButton
            label="Refrescar análisis"
            onClick={() =>
              notify({ kind: 'success', text: 'Refresh ejecutado.' })
            }
            testId="ds-refresh-idle"
          />
          <RefreshButton
            label="Refrescar análisis"
            loading
            onClick={() => undefined}
            testId="ds-refresh-loading"
          />
          <RefreshButton
            label="Refrescar análisis"
            cooldownSeconds={42}
            onClick={() => undefined}
            testId="ds-refresh-cooldown"
          />
          <RefreshButton
            label="Refrescar análisis"
            disabled
            onClick={() => undefined}
            testId="ds-refresh-disabled"
          />
        </div>
      </CanonSection>

      {/* ---------- Tooltip (DS v1.1 · explainability-first) ---------- */}
      <CanonSection
        id="tooltip"
        title="Tooltip — explainability-first (DS v1.1.0)"
        description="Primitiva rica con 3 variantes: default · formula · explainability. Content acepta string o TooltipContent {title, description, formula, source, updated_at, confidence, learn_more}."
      >
        <div className="flex flex-wrap gap-6">
          {/* default */}
          <Tooltip
            testId="ds-tooltip-default"
            content={{
              title: 'Ingresos netos',
              description:
                'Cifra de negocios del último ejercicio depositado.',
            }}
          >
            <span
              data-testid="ds-tooltip-default-trigger"
              className="inline-flex items-center gap-1 font-body text-body-sm text-text-primary underline decoration-dotted underline-offset-4 cursor-help"
            >
              Ingresos <Info size={14} strokeWidth={1.8} className="text-text-muted" aria-hidden />
            </span>
          </Tooltip>
          {/* formula */}
          <Tooltip
            testId="ds-tooltip-formula"
            variant="formula"
            content={{
              title: 'ROE · Rentabilidad sobre fondos propios',
              description:
                'Mide qué porcentaje del patrimonio neto genera el beneficio.',
              formula: 'ROE = Beneficio neto / Patrimonio neto',
            }}
          >
            <span
              data-testid="ds-tooltip-formula-trigger"
              className="inline-flex items-center gap-1 font-mono text-body-sm text-text-primary underline decoration-dotted underline-offset-4 cursor-help"
            >
              ROE = 18%
            </span>
          </Tooltip>
          {/* explainability */}
          <Tooltip
            testId="ds-tooltip-explainability"
            variant="explainability"
            content={{
              title: 'EBITDA 2024',
              description:
                'Beneficios antes de intereses, impuestos, depreciaciones y amortizaciones.',
              source: 'Registros oficiales · Cuentas depositadas',
              updated_at: new Date(
                Date.now() - 3 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              confidence: { level: 'high', score: 92 },
              learn_more: {
                label: 'Ver metodología',
                onClick: () =>
                  notify({ kind: 'info', text: 'Abrir drawer de metodología' }),
              },
            }}
          >
            <span
              data-testid="ds-tooltip-explainability-trigger"
              className="inline-flex items-center gap-1 font-body text-body-sm text-text-primary underline decoration-dotted underline-offset-4 cursor-help"
            >
              EBITDA · 3,2M €
            </span>
          </Tooltip>
        </div>
        <p className="text-caption text-text-muted mt-4 max-w-2xl">
          Hover o focus para abrir (delay 200ms). Escape cierra. Panel máx 320px.
          Respeta <code className="font-mono">prefers-reduced-motion</code>.
          Cuando <code className="font-mono">learn_more</code> está presente el
          panel captura pointer-events y el CTA es clickable.
        </p>
      </CanonSection>

      {/* ---------- MetricsGrid 1/2/4 ---------- */}
      <CanonSection
        id="metrics-grid"
        title="MetricsGrid — 1 / 2 / 4 columnas"
        description="Responsive (1 col mobile, escala según prop columns en md+)."
      >
        <MetricsGrid
          columns={4}
          testId="ds-metrics-4"
          items={[
            { id: 'a', label: 'Ingresos', value: '2,4M €', trend: 'up', hint: 'YoY +12%' },
            { id: 'b', label: 'EBITDA', value: '480k €', trend: 'flat' },
            { id: 'c', label: 'Empleados', value: '32', trend: 'down' },
            { id: 'd', label: 'Margen', value: '20%', trend: 'up' },
          ]}
        />
        <MetricsGrid
          columns={2}
          testId="ds-metrics-2"
          items={[
            { id: 'p1', label: 'Score sectorial', value: '92' },
            { id: 'p2', label: 'Confianza dato', value: '0.92' },
          ]}
        />
      </CanonSection>

      {/* ---------- State family ---------- */}
      <CanonSection
        id="states"
        title="Estados — loading / empty / error / unavailable / locked"
        description="Un estado por situación. Ver §3.10 del DESIGN_SYSTEM."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-caption uppercase tracking-caption text-text-muted mb-2">
              Loading
            </p>
            <LoadingBlock />
          </div>
          <div>
            <p className="text-caption uppercase tracking-caption text-text-muted mb-2">
              Empty
            </p>
            <EmptyStateBlock
              title="Aún no hay comparables"
              description="Cuando guardes una empresa en cartera, sus comparables aparecerán aquí."
            />
          </div>
          <div>
            <p className="text-caption uppercase tracking-caption text-text-muted mb-2">
              Error
            </p>
            <ErrorBlock
              title="No hemos podido cargar las señales"
              message="HTTP 500 — vuelve a intentarlo en unos segundos."
              onRetry={() => notify({ kind: 'info', text: 'Reintentado.' })}
            />
          </div>
          <div>
            <p className="text-caption uppercase tracking-caption text-text-muted mb-2">
              Unavailable (REQ-XXX)
            </p>
            <UnavailableBlock
              title="Señales BORME"
              description="Datos extraídos del BORME, contratación pública y cambios societarios."
              req="REQ-008"
              eta="E1.8"
            />
          </div>
          <div className="lg:col-span-2">
            <p className="text-caption uppercase tracking-caption text-text-muted mb-2">
              Locked (anon)
            </p>
            <LockedSectionBlur
              testId="ds-locked"
              title="Valoración indicativa por múltiplo"
              description="Banda central + rangos. Crea tu cuenta para verla."
            />
          </div>
        </div>
      </CanonSection>

      {/* ---------- Toast helper ---------- */}
      <CanonSection
        id="toast"
        title="Toast (helper notify)"
        description="4 kinds. Slide-in arriba centrado, auto-dismiss 3s."
      >
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            data-testid="ds-toast-success"
            className="rounded-full px-4 py-2 text-body-sm font-semibold bg-success text-text-on-brand"
            onClick={() =>
              notify({
                kind: 'success',
                text: 'Sección «narrative» actualizada.',
              })
            }
          >
            success
          </button>
          <button
            type="button"
            data-testid="ds-toast-warn"
            className="rounded-full px-4 py-2 text-body-sm font-semibold bg-warning text-text-on-brand"
            onClick={() =>
              notify({
                kind: 'warn',
                text: 'Has refrescado el análisis. Espera 60s.',
              })
            }
          >
            warn
          </button>
          <button
            type="button"
            data-testid="ds-toast-error"
            className="rounded-full px-4 py-2 text-body-sm font-semibold bg-danger text-text-on-brand"
            onClick={() =>
              notify({ kind: 'error', text: 'No hemos podido procesar.' })
            }
          >
            error
          </button>
          <button
            type="button"
            data-testid="ds-toast-info"
            className="rounded-full px-4 py-2 text-body-sm font-semibold bg-info text-text-on-brand"
            onClick={() =>
              notify({
                kind: 'info',
                text: 'Próximamente: E1.8 (Valoración avanzada).',
              })
            }
          >
            info
          </button>
        </div>
      </CanonSection>

      {/* ---------- Page patterns ---------- */}
      <CanonSection
        id="page-patterns"
        title="Page Patterns — Nivel 3"
        description="12 patrones documentados en /app/memory/DESIGN_SYSTEM.md §3."
      >
        <div className="rounded-2xl border border-border-default bg-surface-elevated p-6">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-body-sm">
            <li>✅ Company Page (canónico de referencia, E1.5-REWORK)</li>
            <li>🔵 Sector Page (template para E1.6)</li>
            <li>🔵 Territory Page (template para E1.7)</li>
            <li>🔵 Valuation Page (template para E1.8)</li>
            <li>🔵 Opportunity Page (template para E1.9)</li>
            <li>🔵 Transaction Page (template para E2.0)</li>
            <li>🟡 Dashboard (parcial)</li>
            <li>🟡 Search Results (parcial)</li>
            <li>🟡 Assistant / Copilot Dock (parcial)</li>
            <li>✅ State family (loading/empty/error/locked/unavailable)</li>
            <li>🟡 Valuation Result (ValuationBlock plantilla)</li>
            <li>🔵 Marketplace Flows (post-E2.0)</li>
          </ul>
          <p className="text-caption text-text-muted mt-4">
            Consulta cada patrón en DESIGN_SYSTEM.md §3.1–§3.12 para anatomía,
            estados, responsive y composición.
          </p>
        </div>
      </CanonSection>
    </div>
  );
}
