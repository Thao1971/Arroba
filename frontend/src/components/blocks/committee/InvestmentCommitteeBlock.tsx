'use client';
// HARDENING-BETA-para-emergent · aterrizaje aislado (opción a2).
// Componente presentacional puro. NO cableado a ficha ni backend.
// Cableado real planificado en HARDENING-037 (layout monolito) y HARDENING-038 (proxies Intel).
/**
 * @componentId COMP-C-0030
 * @status PROVISIONAL
 * @section Comité de inversión
 * @engine Intel `/api/v1/investment-decision/analyze` (service-key, ya construido)
 *
 * InvestmentCommitteeBlock — "Ver deliberación" del comité de 10 especialistas.
 *
 * Canon: NO es un chat, es un informe premium bajo demanda. Cálculo pesado →
 * se dispara con botón y se cachea aguas arriba (por cif + lente).
 *
 * Encuadre (decisión de producto): DIAGNÓSTICO NEUTRAL por defecto + LENTE por
 * perfil. Cada lente enuncia SU PREGUNTA explícita para que el usuario sepa
 * siempre qué se responde y desde qué punto de vista:
 *   - neutral  → "¿Cómo está la empresa?" (sin veredicto de operación)
 *   - buyer    → "¿Debería avanzar con la adquisición?" (buyer_profile estratégico)
 *   - investor → "¿Es una buena inversión?" (buyer_profile financiero)
 *   - seller   → tesis de desinversión (strategy-intelligence) → PRÓXIMAMENTE
 * La lente arranca en el perfil del usuario cuando Beta lo conozca (`defaultLens`).
 * Presentacional: recibe `runCommittee(cif, lens)` inyectado.
 */
import { useState } from 'react';
import { Scale, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type CommitteeLens = 'neutral' | 'buyer' | 'investor' | 'seller';

export interface CommitteeFinding { text: string; by?: string | null }
export interface SpecialistOpinion {
  specialist: string;
  recommendation: string;
  score?: number | null;
  confidence?: { value?: number | null } | null;
  strengths?: CommitteeFinding[];
  weaknesses?: CommitteeFinding[];
  risks?: CommitteeFinding[];
  veto?: boolean;
  veto_kind?: string | null;
}
export interface CommitteeResult {
  decision_id?: string | null;
  recommendation: string; // band
  investment_score: number; // 0-100
  confidence: number; // 0-1
  executive_summary?: string | null;
  investment_thesis?: string | null;
  conditions_to_proceed?: string[];
  committee: SpecialistOpinion[];
}

const LENSES: { id: CommitteeLens; label: string; question: string; ready: boolean }[] = [
  { id: 'neutral', label: 'Diagnóstico neutral', question: '¿Cómo está la empresa?', ready: true },
  { id: 'buyer', label: 'Comprador', question: '¿Debería avanzar con la adquisición?', ready: true },
  { id: 'investor', label: 'Inversor', question: '¿Es una buena inversión?', ready: true },
  { id: 'seller', label: 'Vendedor', question: '¿Está lista para vender y cómo la vería un comprador?', ready: false },
];

const BANDS: Record<string, { label: string; badge: string }> = {
  PROCEED: { label: 'Avanzar', badge: 'bg-success-subtle text-success' },
  PROCEED_WITH_CONDITIONS: { label: 'Avanzar con condiciones', badge: 'bg-surface-muted text-text-primary' },
  EXPLORE: { label: 'Explorar', badge: 'bg-surface-muted text-text-secondary' },
  PASS: { label: 'No avanzar', badge: 'bg-danger-subtle text-danger' },
  REJECT: { label: 'Rechazar', badge: 'bg-danger-subtle text-danger' },
};
const REC: Record<string, string> = {
  proceed: 'Avanzar', proceed_with_conditions: 'Con condiciones',
  explore: 'Explorar', pass: 'No avanzar', abstain: 'Se abstiene',
};
const SPECIALISTS: Record<string, string> = {
  cfo: 'CFO · Finanzas', risk: 'Riesgo', legal: 'Legal', operations: 'Operaciones',
  commercial: 'Comercial', market: 'Mercado', strategy: 'Estrategia',
  valuation: 'Valoración', technology: 'Tecnología', tech: 'Tecnología',
  esg: 'ESG', synergy: 'Sinergias', hr: 'Personas',
  investment_director: 'Dirección de inversión',
};

// Composición real del comité (motor Intel): a quién representa cada voz y qué
// defiende. `veto`: Legal y Riesgo pueden bloquear la operación.
const ROSTER: { name: string; focus: string; veto?: boolean }[] = [
  { name: 'CFO · Finanzas', focus: 'Rentabilidad, crecimiento, apalancamiento y solvencia' },
  { name: 'Valoración', focus: 'Múltiplo de referencia, rango y ajuste de EV a equity' },
  { name: 'Estrategia', focus: 'Encaje con el mandato, tesis y sinergias' },
  { name: 'Dirección de inversión', focus: 'Síntesis del caso y recomendación final (preside)' },
  { name: 'Mercado', focus: 'Posición competitiva y consolidación del sector' },
  { name: 'Comercial', focus: 'Cartera de clientes, recurrencia y concentración' },
  { name: 'Operaciones', focus: 'Escalabilidad, eficiencia y dependencias' },
  { name: 'Personas', focus: 'Continuidad directiva y plan de sucesión' },
  { name: 'Legal', focus: 'Propiedad y control, contingencias y contratos', veto: true },
  { name: 'Riesgo', focus: 'Riesgo agregado: regulatorio, operativo, financiero', veto: true },
];
const specName = (k: string) => SPECIALISTS[k] || k.charAt(0).toUpperCase() + k.slice(1);
const recTone = (r: string) => (r === 'proceed' ? 'text-success' : r === 'pass' ? 'text-danger' : 'text-text-secondary');

export function InvestmentCommitteeBlock({
  cif,
  runCommittee,
  onExport,
  defaultLens = 'neutral',
}: {
  cif: string;
  runCommittee: (cif: string, lens: CommitteeLens) => Promise<CommitteeResult>;
  onExport?: (decisionId: string) => void;
  defaultLens?: CommitteeLens;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [lens, setLens] = useState<CommitteeLens>(defaultLens);
  const [result, setResult] = useState<CommitteeResult | null>(null);

  const meta = LENSES.find((l) => l.id === lens)
    ?? { id: 'neutral' as CommitteeLens, label: 'Diagnóstico neutral', question: '¿Cómo está la empresa?', ready: true };

  async function load(next: CommitteeLens) {
    setLens(next);
    setState('loading');
    try {
      setResult(await runCommittee(cif, next));
      setState('done');
    } catch {
      setState('error');
    }
  }

  function LensPicker() {
    return (
      <>
        <div className="text-caption text-text-muted mb-2">Verlo como</div>
        <div className="flex gap-2 flex-wrap">
          {LENSES.map((l) => {
            const activeLens = l.id === lens && state !== 'idle';
            return (
              <button
                key={l.id}
                type="button"
                disabled={!l.ready || state === 'loading'}
                onClick={() => l.ready && load(l.id)}
                className={cn(
                  'text-body-sm rounded-full px-3.5 py-1.5 transition-colors',
                  activeLens ? 'bg-brand-primary text-white font-bold'
                    : l.ready ? 'bg-surface-muted text-text-primary hover:bg-surface-muted/70'
                    : 'bg-surface-muted text-text-muted cursor-not-allowed',
                )}
              >
                {l.label}{!l.ready ? ' · pronto' : ''}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  function QuestionBox() {
    return (
      <div className="bg-surface-muted rounded-xl px-4 py-3">
        <div className="text-caption text-text-muted mb-0.5">El comité responde a</div>
        <div className="text-body font-bold text-text-primary">{meta.question}</div>
      </div>
    );
  }

  // ---- idle ----
  if (state === 'idle') {
    return (
      <section data-testid="committee-idle" className="rounded-2xl border border-border-default bg-surface-elevated p-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center text-text-muted mb-4">
            <Scale size={24} strokeWidth={1.6} aria-hidden />
          </div>
          <div className="font-display text-h4 font-bold text-text-primary mb-1">Comité de inversión</div>
          <p className="text-body-sm text-text-muted max-w-md mx-auto mb-5">
            Diez especialistas analizan la empresa y emiten un consenso explicable. Elige desde qué
            perfil quieres la lectura; puedes cambiarla luego.
          </p>
        </div>
        <div className="max-w-md mx-auto flex flex-col gap-4">
          <LensPicker />
          <QuestionBox />
          <button
            type="button"
            onClick={() => load(lens)}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-brand-primary text-white text-body-sm font-bold hover:bg-brand-primary-hover transition-colors"
          >
            <Sparkles size={16} aria-hidden /> Ver deliberación del comité
          </button>
        </div>

        {/* Cómo funciona el comité */}
        <div className="mt-8 pt-6 border-t border-border-default">
          <div className="text-body-sm font-bold text-text-primary mb-1">Cómo funciona</div>
          <p className="text-body-sm text-text-muted mb-4 max-w-2xl">
            Diez voces especializadas revisan la empresa desde su ángulo, cada una con datos y
            evidencia. Sus opiniones se combinan en un <span className="text-text-secondary">consenso ponderado</span> (unas
            áreas pesan más que otras según el perfil), y <span className="text-text-secondary">Legal y Riesgo pueden vetar</span> si
            detectan un problema grave. El resultado es una recomendación explicable: no una caja
            negra, sino quién opina qué y por qué.
          </p>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {ROSTER.map((r) => (
              <div key={r.name} className="flex gap-2 items-start rounded-lg bg-surface-muted px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-caption font-bold text-text-primary flex items-center gap-1.5">
                    {r.name}
                    {r.veto ? <span className="text-caption font-normal text-danger">· veto</span> : null}
                  </div>
                  <div className="text-caption text-text-muted leading-snug">{r.focus}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-caption text-text-muted mt-4">
            Te ayuda a decidir con criterio: reúne en segundos el juicio de un comité de M&A sobre la
            empresa, señala fortalezas, riesgos y condiciones, y adapta la conclusión a tu perfil.
          </p>
        </div>
      </section>
    );
  }

  if (state === 'loading') {
    return (
      <section data-testid="committee-loading" className="rounded-2xl border border-border-default bg-surface-elevated p-8 text-center">
        <Loader2 size={22} className="mx-auto mb-3 animate-spin text-brand-primary" aria-hidden />
        <p className="text-body-sm text-text-muted">Deliberando desde la lente «{meta.label}»…</p>
      </section>
    );
  }

  if (state === 'error' || !result) {
    return (
      <section data-testid="committee-error" className="rounded-2xl border border-danger/30 bg-danger-subtle/40 p-6 text-body-sm text-text-secondary">
        No hemos podido reunir al comité en este momento.{' '}
        <button type="button" onClick={() => load(lens)} className="text-brand-primary font-bold hover:underline">Reintentar</button>
      </section>
    );
  }

  // ---- done ----
  const isNeutral = lens === 'neutral';
  const band = BANDS[result.recommendation] || { label: result.recommendation, badge: 'bg-surface-muted text-text-primary' };
  const score = Math.round(result.investment_score);
  const conf = Math.round((result.confidence ?? 0) * 100);

  return (
    <div data-testid="committee-report" className="flex flex-col gap-4">
      <section className="rounded-2xl border border-border-default bg-surface-elevated p-6 flex flex-col gap-4">
        <LensPicker />
        <QuestionBox />
        <div>
          <div className="text-body-sm text-text-secondary mb-2">
            {isNeutral ? 'Diagnóstico del comité' : 'Recomendación del comité'}
          </div>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            {!isNeutral ? <span className={cn('text-body font-bold rounded-full px-3 py-1', band.badge)}>{band.label}</span> : null}
            <span className="text-body-sm text-text-muted">Confianza {conf}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-caption text-text-muted w-14">{isNeutral ? 'Salud' : 'Score'}</span>
            <div className="flex-1 h-2 rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
            </div>
            <span className="text-body-sm font-bold text-text-primary w-16 text-right">{score}/100</span>
          </div>
        </div>
      </section>

      {result.executive_summary || result.investment_thesis ? (
        <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={16} className="text-brand-primary" aria-hidden />
            <span className="text-body-sm font-bold text-text-primary">{isNeutral ? 'Conclusión del comité' : 'Respuesta del comité'}</span>
            <span className="text-caption text-text-muted bg-surface-muted rounded-full px-2 py-0.5">lente: {meta.label.toLowerCase()}</span>
          </div>
          {result.executive_summary ? <p className="text-body text-text-primary leading-relaxed m-0">{result.executive_summary}</p> : null}
          {result.investment_thesis ? <p className="text-body-sm text-text-secondary leading-relaxed mt-3 m-0">{result.investment_thesis}</p> : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
        <div className="text-body-sm font-bold text-text-primary mb-4">Deliberación por especialista</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {result.committee.map((o) => {
            const findings = [...(o.strengths || []), ...(o.risks || []), ...(o.weaknesses || [])].slice(0, 2);
            return (
              <div key={o.specialist} className="rounded-xl border border-border-default p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-body-sm font-bold text-text-primary">{specName(o.specialist)}</span>
                  <span className={cn('text-caption font-bold', recTone(o.recommendation))}>
                    {o.veto ? '⛔ Veto' : REC[o.recommendation] || o.recommendation}
                  </span>
                </div>
                {findings.length ? (
                  <ul className="m-0 pl-0 list-none flex flex-col gap-1">
                    {findings.map((f, i) => (
                      <li key={i} className="text-caption text-text-secondary leading-snug">· {f.text}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-caption text-text-muted m-0">Sin observaciones destacadas.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {result.conditions_to_proceed && result.conditions_to_proceed.length ? (
        <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
          <div className="flex items-center gap-2 text-body-sm font-bold text-text-primary mb-3">
            <AlertTriangle size={15} className="text-text-muted" aria-hidden /> Condiciones para avanzar
          </div>
          <ul className="m-0 pl-0 list-none flex flex-col gap-2">
            {result.conditions_to_proceed.map((c, i) => (
              <li key={i} className="text-body-sm text-text-secondary flex gap-2"><span className="text-brand-primary">•</span> {c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.decision_id && onExport ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onExport(result.decision_id as string)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border-emphasis bg-surface-elevated text-body-sm font-bold text-text-primary hover:bg-surface-muted transition-colors"
          >
            Descargar informe conclusivo
            <span className="text-caption text-text-muted bg-surface-muted rounded-full px-2 py-0.5">consume créditos</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
