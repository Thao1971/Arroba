'use client';
/**
 * FichaLoadingScreen — pantalla de carga de la Ficha (2026-08-30, retocada
 * 2026-09-07 · Daniel, tarea de pulido UI/UX de 5 puntos).
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
 *
 * 2026-09-07 · Retoque de 5 puntos (Daniel):
 * 1) Tema: sustituidos los colores oscuros hardcodeados (`--neutral-900/950`,
 *    `text-white`, `border-white/N`) por los tokens semánticos de
 *    `tokens.css` (`--surface-elevated`, `--text-primary`, `--border-default`,
 *    etc., mapeados a clases Tailwind en `tailwind.config.ts`). Estos tokens
 *    ya cambian solos con el atributo `[data-dark]` en `<html>` — la tarjeta
 *    ahora sigue el tema activo (claro por defecto) en vez de ser siempre
 *    oscura. El rojo de marca (`arroba-red`) no cambia entre temas por
 *    diseño, así que se mantiene igual.
 * 2) Ritmo: los dos primeros pasos cosméticos ("Cargando identidad",
 *    "Calculando indicadores") se han alargado (`STAGE_DELAY_MS`) para que
 *    no pasen en un parpadeo. El tercer paso ("Preparando la ficha
 *    completa") es el que de verdad espera a la llamada real — NO se le
 *    puede añadir una espera artificial sin romper el principio de arriba
 *    (swap inmediato en cuanto `ready`), así que en vez de alargarlo
 *    artificialmente se le ha dado vida visual: la barra de progreso sigue
 *    "reptando" lentamente hacia un techo (nunca al 100% hasta que `ready`
 *    es real — R15 aplicado también aquí, no se miente sobre progreso que
 *    no existe) y el icono del paso activo pulsa con el mismo destello
 *    explícito del punto 4. Esto ataca directamente la queja de Daniel
 *    ("se queda parado") sin inventar una demora que no está pasando de
 *    verdad en el backend.
 * 3) Nombre de la empresa: nuevo prop opcional `companyName`. Si el padre ya
 *    resolvió el nombre (vía `/api/companies/{cif}/resolve`, más rápido que
 *    el agregador de ficha completo), se muestra como titular; si no,
 *    fallback al CIF como antes. Cuando hay nombre, el CIF se mantiene
 *    visible pero como línea secundaria pequeña (no se pierde el dato, solo
 *    deja de ser el protagonista, tal y como pidió Daniel).
 * 4) Destello más explícito: el aro pulsante del icono de cabecera se ha
 *    reforzado (doble aro, tono más saturado) y además ahora también brilla
 *    el propio badge circular del icono (nuevo keyframe `icon-glow` en
 *    `tailwind.config.ts`, un pulso de sombra en bucle). El MISMO efecto se
 *    aplica ahora al icono del paso que está activo en cada momento (antes
 *    solo tenía un puntito parpadeando dentro) — se ve claramente cuál es
 *    el paso "vivo".
 * 5) Mensajes "Recuerda": ya no es un único texto fijo — `tips` es un prop
 *    opcional (array de strings) con un valor por defecto exportado
 *    (`DEFAULT_FICHA_LOADING_TIPS`) que rota en bucle cada
 *    `TIP_ROTATE_MS` mientras la pantalla está visible. Se respeta
 *    `prefers-reduced-motion`: si está activo, se queda fijo en el primer
 *    mensaje (mismo criterio que el resto de animaciones de este
 *    componente).
 */
import { useEffect, useState } from 'react';
import { Building2, TrendingUp, FileCheck, BookText, Sparkles } from 'lucide-react';

const STAGES = [
  { label: 'Cargando identidad de la empresa', icon: Building2 },
  { label: 'Calculando indicadores financieros', icon: TrendingUp },
  { label: 'Preparando la ficha completa', icon: FileCheck },
] as const;

// Ritmo cosmético entre pasos (ms). Alargado 2026-09-07 (Daniel: los dos
// primeros pasos se cargaban "muy rápido") respecto al original [900, 1400].
// Si `ready` llega antes de que termine el ciclo, no importa: el efecto de
// abajo corta directo a completo — nunca se espera a este ritmo.
const STAGE_DELAY_MS = [1700, 2300];

// Progreso (%) que la barra alcanza al llegar a cada paso. El último tramo
// (paso 3, "Preparando la ficha completa") no es fijo: sigue "reptando" con
// FINAL_STAGE_CREEP mientras se espera la llamada real, para que nunca se
// vea estático — pero nunca llega a FINAL_STAGE_CAP_PCT hasta que `ready`
// sea real (no se finge un 100% que no existe).
const STAGE_MILESTONE_PCT = [38, 70];
const FINAL_STAGE_CAP_PCT = 93;
const FINAL_STAGE_CREEP_MS = 850;
const FINAL_STAGE_CREEP_EASE = 0.18; // fracción del hueco restante que se recorre por tick

// Cuánto se mantienen visibles los 3 pasos completos antes de avisar al
// padre para que sustituya esta pantalla por la ficha real. Corto a
// propósito — solo para que el ojo lo registre, no una espera extra.
const SETTLE_MS = 220;

// Mensajes por defecto del pie ("Recuerda: ..."). Configurable vía el prop
// `tips` — este array es solo el valor por defecto cuando el padre no pasa
// uno propio.
export const DEFAULT_FICHA_LOADING_TIPS: readonly string[] = [
  'Puedes descargar esta ficha en PDF con los datos reales del Registro Mercantil.',
  'Los indicadores financieros se recalculan en cuanto el Registro Mercantil publica cuentas nuevas.',
  'Desde la ficha puedes abrir directamente un Deal Aside para hacer seguimiento de esta oportunidad.',
];

const TIP_ROTATE_MS = 3200;

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
  /**
   * Nombre de la empresa, si ya se conoce (p.ej. resuelto vía
   * `/api/companies/{cif}/resolve`, más rápido que el agregador completo).
   * Si no se pasa (o es `null`/vacío), se muestra el CIF como antes.
   */
  companyName?: string | null;
  /**
   * Mensajes del pie "Recuerda: ...", rotan en bucle. Por defecto
   * `DEFAULT_FICHA_LOADING_TIPS`.
   */
  tips?: readonly string[];
}

export function FichaLoadingScreen({
  cif,
  ready,
  onSettled,
  companyName,
  tips,
}: FichaLoadingScreenProps) {
  const [stage, setStage] = useState(0);
  const [creepPct, setCreepPct] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const reduced = useReducedMotion();

  const tipsList = tips && tips.length > 0 ? tips : DEFAULT_FICHA_LOADING_TIPS;

  // Reinicia el ritmo cosmético si el padre reutiliza esta pantalla para un
  // CIF distinto (navegación entre fichas sin desmontar el componente).
  useEffect(() => {
    setStage(0);
    setCreepPct(0);
    setTipIndex(0);
  }, [cif]);

  useEffect(() => {
    if (ready || reduced || stage >= STAGE_DELAY_MS.length) return;
    const t = setTimeout(() => setStage((s) => s + 1), STAGE_DELAY_MS[stage]);
    return () => clearTimeout(t);
  }, [stage, ready, reduced]);

  // Punto 2 (Daniel): mientras se espera de verdad en el último paso, la
  // barra sigue avanzando poco a poco (nunca hasta el 100%) para que no se
  // vea "parada" — sin fingir que el trabajo real ha terminado antes de
  // tiempo.
  useEffect(() => {
    if (ready || reduced || stage < STAGE_DELAY_MS.length) return;
    const cap = FINAL_STAGE_CAP_PCT - (STAGE_MILESTONE_PCT[STAGE_MILESTONE_PCT.length - 1] ?? 0);
    const t = setInterval(() => {
      setCreepPct((p) => (p >= cap ? p : p + (cap - p) * FINAL_STAGE_CREEP_EASE));
    }, FINAL_STAGE_CREEP_MS);
    return () => clearInterval(t);
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

  // Punto 5 (Daniel): mensajes del pie en bucle mientras se ve la pantalla.
  useEffect(() => {
    if (reduced || tipsList.length <= 1) return;
    const t = setInterval(() => {
      setTipIndex((i) => (i + 1) % tipsList.length);
    }, TIP_ROTATE_MS);
    return () => clearInterval(t);
  }, [reduced, tipsList.length]);

  const effectiveStage = ready ? STAGES.length : stage;
  const progressPct = ready
    ? 100
    : effectiveStage === 0
      ? 0
      : effectiveStage < STAGES.length
        ? (STAGE_MILESTONE_PCT[effectiveStage - 1] ?? 0) + (effectiveStage === STAGES.length - 1 ? creepPct : 0)
        : (STAGE_MILESTONE_PCT[STAGE_MILESTONE_PCT.length - 1] ?? 0) + creepPct;
  const clampedProgressPct = Math.min(100, Math.round(progressPct));

  const heading = companyName && companyName.trim().length > 0 ? companyName : `CIF ${cif.toUpperCase()}`;
  const showCifSubline = Boolean(companyName && companyName.trim().length > 0);

  return (
    <div className="flex justify-center py-10 px-4" data-testid="ficha-f01-loading">
      <div className="w-full max-w-md rounded-[20px] overflow-hidden shadow-[0_20px_60px_-20px_rgba(28,26,24,0.35)] border border-border-default">
        <div
          className="relative min-h-[420px] flex items-center justify-center px-7 py-8"
          style={{ background: 'radial-gradient(circle at 50% 30%, var(--surface-elevated), var(--surface-muted))' }}
        >
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-[11px] bg-arroba-red shrink-0">
                <Sparkles size={18} className="relative z-10 text-text-on-brand" />
                {!reduced && (
                  <>
                    <span className="absolute inset-0 rounded-[11px] animate-icon-glow" />
                    <span className="absolute inset-[-4px] rounded-[14px] border-2 border-arroba-red/60 animate-ping" />
                    <span className="absolute inset-[-9px] rounded-[18px] border border-arroba-red/30 animate-ping [animation-delay:400ms]" />
                  </>
                )}
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-arroba-red">
                  Cargando ficha
                </div>
                <div className="text-[13px] text-text-secondary mt-0.5">
                  Arroba está reuniendo los datos de la empresa
                </div>
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold text-text-primary leading-tight tracking-tight mb-1 text-balance line-clamp-2">
              {heading}
            </h2>
            {showCifSubline && (
              <div className="text-[12.5px] text-text-muted mb-6">CIF {cif.toUpperCase()}</div>
            )}
            {!showCifSubline && <div className="mb-6" />}

            <div className="h-[3px] bg-surface-muted rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-arroba-red rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${clampedProgressPct}%` }}
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
                      className={`relative w-[24px] h-[24px] rounded-full shrink-0 flex items-center justify-center border-2 transition-colors ${
                        done
                          ? 'bg-arroba-red border-arroba-red'
                          : active
                            ? 'border-arroba-red bg-surface-elevated'
                            : 'border-border-default'
                      } ${active && !done && !reduced ? 'animate-icon-glow' : ''}`}
                    >
                      {done && <Icon size={12} className="text-text-on-brand" strokeWidth={3} />}
                      {active && !done && <Icon size={12} className="text-arroba-red" strokeWidth={2.5} />}
                    </span>
                    <span
                      className={`flex-1 text-sm ${
                        done || active ? 'font-semibold text-text-primary' : 'font-medium text-text-muted'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2.5 items-start pt-4 mt-1 border-t border-border-default">
              <BookText size={15} className="text-arroba-red shrink-0 mt-0.5" />
              <p
                key={tipIndex}
                className={`text-[12.5px] leading-relaxed text-text-secondary m-0 ${!reduced ? 'animate-fade-in-up' : ''}`}
              >
                <span className="font-semibold text-text-primary">Recuerda:</span> {tipsList[tipIndex]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
