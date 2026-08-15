'use client';
// HARDENING-BETA-para-emergent · aterrizaje aislado (opción a2).
// Componente presentacional puro. NO cableado a ficha ni backend.
// Cableado real planificado en HARDENING-037 (layout monolito) y HARDENING-038 (proxies Intel).
/**
 * @componentId COMP-O-0040
 * @status PROVISIONAL
 * @section Oportunidades (ficha)
 *
 * OpportunityThesisBlock — replanteamiento de Oportunidades como TESIS DE
 * OPERACIÓN de la empresa. Absorbe Sucesión (E2) y Sector & Roll-up (retiradas
 * como pestañas sueltas) y las organiza por las dos direcciones de operación:
 *   - Como OBJETIVO (sell-side): sucesión/venta + atractivo + señales activas.
 *   - Como COMPRADOR (buy-side): roll-up (plataforma + targets).
 * Cierra en ACCIONES (seguir, generar documento, comité, crear oportunidad),
 * conectando la inteligencia con el resto de la plataforma.
 *
 * Motores (Intel, ya construidos): succession-intelligence (E2),
 * investment-intelligence (fragmentation + rollup-thesis), recommendation/feed.
 * Presentacional + degradación elegante: cada bloque solo se pinta si hay dato.
 */
import { Sparkles, Hourglass, Combine, Users, Bookmark, FileText, Scale, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DetectedOpportunity { label: string; strength?: string | null }
export interface RollupTarget { name: string; fit: number }
export interface OpportunityThesisView {
  thesis?: string | null;
  detected?: DetectedOpportunity[];
  sell?: {
    successionScore?: number | null; // 0-100
    note?: string | null;
    attractiveness?: string | null;
  } | null;
  buy?: {
    viable?: boolean | null;
    note?: string | null;
    targets?: RollupTarget[];
  } | null;
}

function strengthTone(s?: string | null): string {
  const v = (s || '').toLowerCase();
  if (v.includes('alt')) return 'bg-danger-subtle text-danger';
  if (v.includes('med')) return 'bg-success-subtle text-success';
  return 'bg-surface-muted text-text-secondary';
}

export function OpportunityThesisBlock({
  data,
  onFollow,
  onGenerateDoc,
  onCommittee,
  onCreateOpportunity,
  onSeeSuccession,
  onSeeRollup,
}: {
  data: OpportunityThesisView;
  onFollow?: () => void;
  onGenerateDoc?: () => void;
  onCommittee?: () => void;
  onCreateOpportunity?: () => void;
  onSeeSuccession?: () => void;
  onSeeRollup?: () => void;
}) {
  const { thesis, detected, sell, buy } = data;
  const hasAny = thesis || detected?.length || sell || buy;
  if (!hasAny) {
    return (
      <section data-testid="opportunity-thesis-empty" className="rounded-2xl border border-border-default bg-surface-elevated p-6 text-body-sm text-text-muted">
        No hemos detectado oportunidades de operación con los datos disponibles.
      </section>
    );
  }

  return (
    <div data-testid="opportunity-thesis" className="flex flex-col gap-4">
      {thesis ? (
        <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={16} className="text-brand-primary" aria-hidden />
            <span className="text-body-sm font-bold text-text-primary">Tesis de operación</span>
            <span className="text-caption text-text-muted bg-surface-muted rounded-full px-2 py-0.5">IA · datos verificados</span>
          </div>
          <p className="text-body text-text-primary leading-relaxed m-0">{thesis}</p>
        </section>
      ) : null}

      {detected && detected.length ? (
        <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
          <div className="text-body-sm font-bold text-text-primary mb-3">Oportunidades detectadas</div>
          <div className="flex flex-col gap-2">
            {detected.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border-default px-3 py-2.5">
                <span className="text-body-sm text-text-primary flex-1">{d.label}</span>
                {d.strength ? <span className={cn('text-caption rounded-full px-2 py-0.5', strengthTone(d.strength))}>{d.strength}</span> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {sell || buy ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {sell ? (
            <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
              <div className="text-caption text-text-muted uppercase tracking-wide mb-3">Como objetivo · sell-side</div>
              <div className="flex items-center gap-2 mb-2">
                <Hourglass size={16} className="text-text-muted" aria-hidden />
                <span className="text-body-sm font-bold text-text-primary flex-1">Sucesión / venta</span>
                {sell.successionScore != null ? (
                  <span className="text-caption rounded-full px-2 py-0.5 bg-danger-subtle text-danger">Riesgo {Math.round(sell.successionScore)}</span>
                ) : null}
              </div>
              {sell.successionScore != null ? (
                <div className="h-1.5 rounded-full bg-surface-muted mb-3">
                  <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.max(0, Math.min(100, sell.successionScore))}%` }} />
                </div>
              ) : null}
              {sell.note ? <p className="text-body-sm text-text-secondary m-0">{sell.note}</p> : null}
              {sell.attractiveness ? (
                <div className="flex items-start gap-2 mt-2.5">
                  <Users size={15} className="text-text-muted mt-0.5" aria-hidden />
                  <span className="text-body-sm text-text-secondary">{sell.attractiveness}</span>
                </div>
              ) : null}
              {onSeeSuccession ? (
                <button type="button" onClick={onSeeSuccession} className="text-caption font-bold text-brand-primary mt-3 hover:underline">Ver sucesión en detalle →</button>
              ) : null}
            </section>
          ) : null}

          {buy ? (
            <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
              <div className="text-caption text-text-muted uppercase tracking-wide mb-3">Como comprador · buy-side</div>
              <div className="flex items-center gap-2 mb-2">
                <Combine size={16} className="text-text-muted" aria-hidden />
                <span className="text-body-sm font-bold text-text-primary flex-1">Roll-up / consolidación</span>
                {buy.viable != null ? (
                  <span className={cn('text-caption rounded-full px-2 py-0.5', buy.viable ? 'bg-success-subtle text-success' : 'bg-surface-muted text-text-secondary')}>
                    {buy.viable ? 'Viable' : 'Poco viable'}
                  </span>
                ) : null}
              </div>
              {buy.note ? <p className="text-body-sm text-text-secondary m-0 mb-2.5">{buy.note}</p> : null}
              {buy.targets && buy.targets.length ? (
                <div className="flex gap-1.5 flex-wrap">
                  {buy.targets.slice(0, 4).map((t, i) => (
                    <span key={i} className="text-caption text-text-primary bg-surface-muted rounded-full px-2.5 py-1">{t.name} {Math.round(t.fit)}</span>
                  ))}
                </div>
              ) : null}
              {onSeeRollup ? (
                <button type="button" onClick={onSeeRollup} className="text-caption font-bold text-brand-primary mt-3 hover:underline">Ver tesis de roll-up →</button>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}

      {onFollow || onGenerateDoc || onCommittee || onCreateOpportunity ? (
        <section className="rounded-2xl border border-border-default bg-surface-elevated px-6 py-4">
          <div className="text-caption text-text-muted mb-2.5">Siguiente paso</div>
          <div className="flex gap-2 flex-wrap">
            {onFollow ? (
              <button type="button" onClick={onFollow} className="inline-flex items-center gap-1.5 text-body-sm text-text-primary bg-surface-muted rounded-lg px-3.5 py-2 hover:bg-surface-muted/70 transition-colors">
                <Bookmark size={15} aria-hidden /> Seguir
              </button>
            ) : null}
            {onGenerateDoc ? (
              <button type="button" onClick={onGenerateDoc} className="inline-flex items-center gap-1.5 text-body-sm text-text-primary bg-surface-muted rounded-lg px-3.5 py-2 hover:bg-surface-muted/70 transition-colors">
                <FileText size={15} aria-hidden /> Generar teaser
              </button>
            ) : null}
            {onCommittee ? (
              <button type="button" onClick={onCommittee} className="inline-flex items-center gap-1.5 text-body-sm text-text-primary bg-surface-muted rounded-lg px-3.5 py-2 hover:bg-surface-muted/70 transition-colors">
                <Scale size={15} aria-hidden /> Llevar al comité
              </button>
            ) : null}
            {onCreateOpportunity ? (
              <button type="button" onClick={onCreateOpportunity} className="inline-flex items-center gap-1.5 text-body-sm text-white bg-brand-primary rounded-lg px-3.5 py-2 hover:bg-brand-primary-hover transition-colors font-bold">
                <Plus size={15} aria-hidden /> Crear oportunidad
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
