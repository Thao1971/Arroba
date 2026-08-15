'use client';
// HARDENING-BETA-para-emergent · aterrizaje aislado (opción a2).
// Componente presentacional puro. NO cableado a ficha ni backend.
// Cableado real planificado en HARDENING-037 (layout monolito) y HARDENING-038 (proxies Intel).
/**
 * @componentId COMP-F-0010
 * @status PROVISIONAL
 * @section Finanzas / Perfil
 *
 * SingleExerciseChart — snapshot de UN solo ejercicio (Facturación + EBITDA).
 *
 * Cuando el proveedor solo entrega un año no hay tendencia que dibujar: una
 * línea con un único punto no comunica nada. En su lugar mostramos dos barras a
 * la MISMA escala — la de EBITDA corta respecto a la de Facturación transmite el
 * margen de un vistazo — con el margen calculado debajo.
 *
 * R4 · Zero calculation salvo el margen de conveniencia (ebitda/revenue) cuando
 *      el proveedor no lo entrega; si viene `ebitdaMargin`, se usa tal cual.
 * Soporta EBITDA negativo: la barra baja de la línea base y se pinta en `danger`.
 * Animación de entrada (respeta prefers-reduced-motion vía `motion-safe:`).
 */
import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Tooltip } from '@/components/ds';
import { cn } from '@/lib/cn';

export interface SingleExerciseChartProps {
  year: number;
  revenue: number | null;
  ebitda: number | null;
  /** Fracción (0,132 = 13,2 %). Si se omite se deriva de ebitda/revenue. */
  ebitdaMargin?: number | null;
  source?: string | null;
  updatedAt?: string | null;
  className?: string;
}

const CHART_H = 190; // px de zona de gráfico

function fmtEur(v: number | null): string {
  if (v == null || Number.isNaN(v)) return '—';
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 1_000_000)
    return `${sign}${(abs / 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} M€`;
  if (abs >= 1_000)
    return `${sign}${Math.round(abs / 1_000).toLocaleString('es-ES')} k€`;
  return `${sign}${Math.round(abs).toLocaleString('es-ES')} €`;
}

function fmtPct(v: number | null): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${(v * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`;
}

export function SingleExerciseChart({
  year,
  revenue,
  ebitda,
  ebitdaMargin,
  source,
  updatedAt,
  className,
}: SingleExerciseChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rev = typeof revenue === 'number' ? revenue : 0;
  const eb = typeof ebitda === 'number' ? ebitda : 0;

  // Escala compartida con línea base en cero (soporta EBITDA negativo).
  const posMax = Math.max(rev, eb, 0);
  const negMag = Math.max(0, -Math.min(eb, 0));
  const total = posMax + negMag || 1;
  const baseFromBottom = (negMag / total) * CHART_H; // altura de la línea base
  const revH = (Math.max(rev, 0) / total) * CHART_H;
  const ebNeg = eb < 0;
  const ebH = (Math.abs(eb) / total) * CHART_H;

  const margin =
    ebitdaMargin != null ? ebitdaMargin : rev ? eb / rev : null;

  const anim = 'motion-safe:transition-[height,bottom] motion-safe:duration-700 ease-out';

  return (
    <section
      data-testid="single-exercise-chart"
      className={cn(
        'rounded-2xl border border-border-default bg-surface-elevated p-6',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-1">
        <Tooltip
          content={{
            description:
              'Único ejercicio entregado por el proveedor. Sin serie histórica no se dibuja tendencia.',
            source: source ?? undefined,
            updated_at: updatedAt ?? undefined,
          }}
        >
          <span className="font-display text-h5 font-bold text-text-primary">
            Resultados {year}
          </span>
        </Tooltip>
        <span className="inline-flex items-center gap-1.5 text-body-sm text-text-muted bg-surface-muted rounded-full px-2.5 py-1">
          <BarChart3 size={14} strokeWidth={1.8} aria-hidden />
          Un solo ejercicio
        </span>
      </div>
      <p className="text-body-sm text-text-muted mb-6">
        Sin histórico para tendencia — se muestra el año disponible.
      </p>

      {/* Zona de gráfico */}
      <div
        className="relative"
        style={{ height: CHART_H }}
        role="img"
        aria-label={`Facturación ${fmtEur(revenue)} y EBITDA ${fmtEur(
          ebitda,
        )} en ${year}. Margen EBITDA ${fmtPct(margin)}.`}
      >
        {/* Línea base (cero) */}
        <div
          className="absolute left-0 right-0 border-t border-border-default"
          style={{ bottom: baseFromBottom }}
          aria-hidden
        />

        <div className="absolute inset-0 flex items-stretch justify-center gap-16 px-4">
          {/* Facturación */}
          <div className="relative flex-1 max-w-[80px]">
            <div
              className={cn('absolute left-0 right-0 rounded-t bg-brand-primary', anim)}
              style={{ bottom: baseFromBottom, height: mounted ? revH : 0 }}
              aria-hidden
            />
            <span
              className="absolute left-0 right-0 text-center text-body-sm font-bold text-text-primary"
              style={{ bottom: baseFromBottom + (mounted ? revH : 0) + 6 }}
            >
              {fmtEur(revenue)}
            </span>
          </div>

          {/* EBITDA (positivo sube, negativo baja) */}
          <div className="relative flex-1 max-w-[80px]">
            <div
              className={cn(
                'absolute left-0 right-0',
                ebNeg ? 'rounded-b bg-danger' : 'rounded-t bg-success',
                anim,
              )}
              style={{
                bottom: ebNeg
                  ? baseFromBottom - (mounted ? ebH : 0)
                  : baseFromBottom,
                height: mounted ? ebH : 0,
              }}
              aria-hidden
            />
            <span
              className={cn(
                'absolute left-0 right-0 text-center text-body-sm font-bold',
                ebNeg ? 'text-danger' : 'text-text-primary',
              )}
              style={
                ebNeg
                  ? { bottom: baseFromBottom - (mounted ? ebH : 0) - 20 }
                  : { bottom: baseFromBottom + (mounted ? ebH : 0) + 6 }
              }
            >
              {fmtEur(ebitda)}
            </span>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex justify-center gap-16 px-4 mt-3">
        <div className="flex-1 max-w-[80px] text-center text-body-sm text-text-muted">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-brand-primary mr-1.5 align-middle" />
          Facturación
        </div>
        <div className="flex-1 max-w-[80px] text-center text-body-sm text-text-muted">
          <span
            className={cn(
              'inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle',
              ebNeg ? 'bg-danger' : 'bg-success',
            )}
          />
          EBITDA
        </div>
      </div>

      {/* Margen */}
      <div className="mt-5 pt-4 border-t border-border-default flex items-center justify-between">
        <span className="text-body-sm text-text-muted">Margen EBITDA</span>
        <span
          className={cn(
            'text-body font-bold',
            ebNeg ? 'text-danger' : 'text-text-primary',
          )}
        >
          {fmtPct(margin)}
        </span>
      </div>
    </section>
  );
}

/**
 * Deriva las props desde un `FinancialEvolutionBlock` cuando trae UN solo año.
 * Devuelve null si hay 0 o ≥2 años (entonces se usa el chart de tendencia).
 */
export function singleExerciseFromEvolution(
  evolution: {
    years: number[];
    series: { key: string; values: (number | null)[] }[];
  } | null,
): { year: number; revenue: number | null; ebitda: number | null } | null {
  if (!evolution || evolution.years.length !== 1) return null;
  const year = evolution.years[0];
  if (year == null) return null;
  const pick = (key: string) =>
    evolution.series.find((s) => s.key === key)?.values?.[0] ?? null;
  return { year, revenue: pick('revenue'), ebitda: pick('ebitda') };
}
