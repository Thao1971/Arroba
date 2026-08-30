'use client';
/**
 * @componentId COMP-P-0007
 * @status PROVISIONAL
 *
 * FichaLoadingScreen — pantalla de carga de la Ficha (2026-08-30).
 *
 * Mismo lenguaje visual que el boceto `Oportunidad.html` (activación de
 * oportunidad) que a Daniel le gustaba de cuando se lo enseñé
 * (`loading_ficha_boceto.html`): insignia con anillo pulsante, 3 pasos con
 * check, barra de progreso, nota de PDF al pie.
 *
 * Diferencia deliberada con el boceto: la Ficha carga hoy con UNA sola
 * llamada (`/api/companies/{cif}/ficha`, agregador B-2.4) que trae identidad
 * + finanzas juntas — no son 3 llamadas independientes que resuelven en
 * momentos distintos, así que los 3 pasos NO pueden hacer "check" cada uno
 * con su propia señal real (harían falta 3 endpoints separados que hoy no
 * existen). Se mantiene el ritmo de 3 pasos por el valor narrativo/visual
 * que Daniel aprobó, pero es puramente cosmético — ninguno afirma haber
 * verificado nada por separado. Lo que SÍ es estrictamente real: el swap a
 * la ficha cargada ocurre en cuanto `ready` se vuelve true (la llamada real
 * ha terminado) — nunca espera a que el ritmo cosmético complete su ciclo,
 * y la pausa tras completarse es corta y fija (`SETTLE_MS`), no una espera
 * artificial. Mismo criterio que pedía el boceto: "en cuanto ve los 3
 * verificados espera ver el contenido ya, no una espera extra".
 */
import { useEffect, useState } from 'react';
import { Building2, TrendingUp, FileCheck, BookText, Sparkles } from 'lucide-react';

const STAGES = [
  { label: 'Cargando identidad de la empresa', icon: Building2 },
  { label: 'Calculando indicadores financieros', icon: TrendingUp },
  { label: 'Preparando la ficha completa', icon: FileCheck },
] as const;

// Ritmo cosmético entre pasos (ms). Si `ready` llega antes de que termine el
// ciclo, no importa: el efecto de abajo corta directo a completo.
const STAGE_DELAY_MS = [900, 1400];

// Cuánto se mantienen visibles los 3 pasos completos antes de avisar al
// padre para que sustituya esta pantalla por la ficha real. Corto a
// propósito — solo para que el ojo lo registre, no una espera extra.
const SETTLE_MS = 220;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export interface FichaLoadingScreenProps {
  cif: string;
  /** true en cuanto la llamada real ha terminado (`fichaLoading === false`). */
  ready: boolean;
  /** Avisa al padre de que ya puede sustituir esta pantalla por la ficha real. */
  onSettled: () => void;
}

export function FichaLoadingScreen({ cif, ready, onSettled }: FichaLoadingScreenProps) {
  const [stage, setStage] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (ready || reduced || stage >= STAGE_DELAY_MS.length) return;
    const t = setTimeout(() => setStage((s) => s + 1), STAGE_DELAY_MS[stage]);
    return () => clearTimeout(t);
  }, [stage, ready, reduced]);

  useEffect(() => {
    if (!ready) return;
    if (reduced) {
      onSettled();
      return;
    }
    const t = setTimeout(onSettled, SETTLE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduced]);

  const effectiveStage = ready ? STAGES.length : stage;
  const progressPct = Math.min(100, Math.round((effectiveStage / STAGES.length) * 100));

  return (
    <div className="flex justify-center py-10 px-4" data-testid="ficha-f01-loading">
      <div className="w-full max-w-md rounded-[20px] overflow-hidden shadow-[0_20px_60px_-20px_rgba(28,26,24,0.35)] border border-black/5">
        <div
          className="relative min-h-[420px] flex items-center justify-center px-7 py-8"
          style={{ background: 'radial-gradient(circle at 50% 30%, var(--neutral-900), var(--neutral-950))' }}
        >
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-[11px] bg-arroba-red shrink-0">
                <Sparkles size={18} className="text-white" />
                {!reduced && (
                  <span className="absolute inset-[-4px] rounded-[14px] border-[1.5px] border-arroba-red/40 animate-ping" />
                )}
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-arroba-red">
                  Cargando ficha
                </div>
                <div className="text-[13px] text-white/60 mt-0.5">
                  Arroba está reuniendo los datos de la empresa
                </div>
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold text-white leading-tight tracking-tight mb-7 text-balance">
              CIF {cif.toUpperCase()}
            </h2>

            <div className="h-[3px] bg-white/10 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-arroba-red rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex flex-col gap-0.5 mb-5">
              {STAGES.map((s, i) => {
                const done = i < effectiveStage;
                const active = i === effectiveStage;
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className={`flex items-center gap-3.5 py-2.5 transition-opacity duration-300 ${
                      done || active ? 'opacity-100' : 'opacity-35'
                    }`}
                  >
                    <span
                      className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center border-[1.5px] transition-colors ${
                        done
                          ? 'bg-arroba-red border-arroba-red'
                          : active
                            ? 'border-white/35'
                            : 'border-white/15'
                      }`}
                    >
                      {done && <Icon size={12} className="text-white" strokeWidth={3} />}
                      {active && !done && !reduced && (
                        <span className="w-1.5 h-1.5 rounded-full bg-arroba-red animate-pulse" />
                      )}
                    </span>
                    <span
                      className={`flex-1 text-sm ${
                        done || active ? 'font-semibold text-white' : 'font-medium text-white/60'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2.5 items-start pt-4 mt-1 border-t border-white/10">
              <BookText size={15} className="text-arroba-red shrink-0 mt-0.5" />
              <p className="text-[12.5px] leading-relaxed text-white/60 m-0">
                <span className="font-semibold text-white/70">Recuerda:</span> puedes descargar esta
                ficha en PDF con los datos reales del Registro Mercantil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
