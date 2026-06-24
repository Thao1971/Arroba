'use client';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
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
    </div>
  );
}
