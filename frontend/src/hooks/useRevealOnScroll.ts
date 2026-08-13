'use client';
/**
 * HARDENING-021 · Fase 1 · Hook `useRevealOnScroll` + `useCountUp` + `useBarFill`.
 *
 * Micro-animaciones on-scroll fieles al mockup:
 *   · revUp   — keyframe portado en fichaMockupCss.ts (`@keyframes revUp{to{opacity:1;transform:none}}`)
 *   · countUp — animación numérica 0 → finalValue con requestAnimationFrame
 *   · barFill — width:0 → width:X% al aparecer en viewport (transition CSS ya definida en el mockup)
 *
 * Todos usan `IntersectionObserver` con `once: true` (desconectar tras el primer trigger).
 * En SSR devuelven no-op sin efectos secundarios (`typeof window === 'undefined'`).
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Marca el elemento como "revelado" cuando entra en viewport.
 * Uso:
 *   const ref = useRevealOnScroll<HTMLDivElement>();
 *   <div ref={ref} className="reveal-target" />
 * Estado inicial (CSS inline en el elemento):
 *   opacity: 0; transform: translateY(10px);
 * Al revelar añade animación `revUp` (portada en fichaMockupCss.ts).
 */
export function useRevealOnScroll<T extends HTMLElement>(options?: {
  rootMargin?: string;
  threshold?: number;
}): React.RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      // SSR o navegadores viejos → revelar inmediato.
      if (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
      return;
    }
    // Estado inicial defensivo (si el consumidor no lo aplicó ya).
    if (el.style.opacity === '') el.style.opacity = '0';
    if (el.style.transform === '') el.style.transform = 'translateY(10px)';
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.style.animation = 'revUp .5s cubic-bezier(.2,.7,.3,1) forwards';
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.1,
        rootMargin: options?.rootMargin ?? '0px 0px -40px 0px',
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.rootMargin, options?.threshold]);
  return ref as React.RefObject<T>;
}

/**
 * Anima un valor numérico de 0 → target al aparecer en viewport.
 * Devuelve `{ref, display}` donde `display` es el string formateado en el
 * frame actual. Uso:
 *   const { ref, display } = useCountUp(1_870_000, { format: fmtEUR });
 *   <span ref={ref}>{display}</span>
 *
 * · Si target es `null`/`undefined`/`NaN` → devuelve el fallback ("—" por defecto).
 * · Respeta `prefers-reduced-motion` (usuario con motion sickness · no anima).
 */
export function useCountUp<T extends HTMLElement>(
  target: number | null | undefined,
  options?: {
    duration?: number;
    format?: (n: number) => string;
    fallback?: string;
  },
): { ref: React.RefObject<T>; display: string } {
  const ref = useRef<T>(null);
  const duration = options?.duration ?? 800;
  const format = options?.format ?? ((n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 1 }));
  const fallback = options?.fallback ?? '—';
  const validTarget = typeof target === 'number' && Number.isFinite(target) ? target : null;
  const [display, setDisplay] = useState<string>(validTarget !== null ? format(validTarget) : fallback);

  useEffect(() => {
    const el = ref.current;
    if (validTarget === null || !el || typeof window === 'undefined') return;
    // Respetar prefers-reduced-motion.
    const prefersReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReduce) {
      setDisplay(format(validTarget));
      return;
    }
    let started = false;
    let rafId: number | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started) {
            started = true;
            const from = 0;
            const to = validTarget;
            const startTime = performance.now();
            const tick = (now: number) => {
              const elapsed = now - startTime;
              const t = Math.min(1, elapsed / duration);
              // ease-out cubic.
              const eased = 1 - Math.pow(1 - t, 3);
              const value = from + (to - from) * eased;
              setDisplay(format(value));
              if (t < 1) rafId = window.requestAnimationFrame(tick);
              else setDisplay(format(to));
            };
            rafId = window.requestAnimationFrame(tick);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [validTarget, duration, format]);

  return { ref: ref as React.RefObject<T>, display };
}

/**
 * Anima el `width` de una barra de 0 → `percent`% al aparecer en viewport.
 * La transición CSS ya está definida en `fichaMockupCss.ts`
 * (`transition: width .9s cubic-bezier(.3,.7,.3,1)`), sólo necesitamos
 * disparar el cambio de estilo tras un `requestAnimationFrame`.
 *
 * Uso:
 *   const ref = useBarFill<HTMLDivElement>(0.85);   // 85%
 *   <div className="rb"><i ref={ref} /></div>
 * El elemento inicia con `width: 0` y transiciona a `85%`.
 */
export function useBarFill<T extends HTMLElement>(percent: number | null | undefined): React.RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    const pct = typeof percent === 'number' && Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : null;
    if (pct === null) {
      el.style.width = '0';
      return;
    }
    el.style.width = '0';
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: fill directo.
      window.requestAnimationFrame(() => { el.style.width = `${pct}%`; });
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.requestAnimationFrame(() => { el.style.width = `${pct}%`; });
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [percent]);
  return ref as React.RefObject<T>;
}
