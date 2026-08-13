'use client';
/**
 * HARDENING-021 · Fase 1 · Sistema `.tip` (tooltip flotante fijo, accesible).
 *
 * Portado LITERAL del mockup `ficha-empresa-f01.html` (líneas 445-448 · CSS
 * ya scopeado bajo `.afk` en `fichaMockupCss.ts`). Este componente añade la
 * lógica JS de posicionamiento + eventos accesibles que el mockup delegaba
 * a un script inline.
 *
 * Modo de uso:
 *   1. Envolver la ficha con `<TipProvider>` (una sola vez a nivel raíz).
 *   2. Añadir `data-tip="TERM_KEY"` (clave del glosario) o `data-tip="texto literal"`
 *      a cualquier elemento. El provider auto-detecta hovers/foco/tap sobre
 *      `[data-tip]` y muestra el tooltip fijo global.
 *   3. Preferido: `<Tip term="EBITDA"><span className="help">EBITDA</span></Tip>`
 *      para envolver con `tabIndex` + `aria-describedby` en un solo paso.
 *
 * Accesibilidad:
 *   · mouseenter/mouseleave (ratón)
 *   · focusin/focusout (teclado — anchor debe ser focuseable · añadimos `tabIndex=0`
 *     al usar el wrapper `<Tip>`)
 *   · touchstart (móvil — muestra al tap; ocultar tras 3s o al tocar fuera)
 *   · aria-describedby en el anchor apuntando al id del tooltip
 *   · role="tooltip" en el elemento del tip
 *
 * Layout defensivo:
 *   · position: fixed
 *   · viewport clamp (si el tip se sale por la derecha, lo desplaza a la izquierda del anchor)
 *   · z-index: 200 (por encima del deal panel sticky)
 *
 * Regla del turno: NO menciona "Intel" en ningún string. Toda la prosa viene
 * del glosario canónico (`glosario.ts`).
 */

import * as React from 'react';
import { GLOSARIO, formatGlosarioTooltip } from '@/lib/companies/glosario';

const TIP_ID = 'arroba-global-tip';

/**
 * Provider global — renderiza UN `.tip` fijo en el DOM raíz y engancha
 * listeners globales a `[data-tip]`. Idempotente: si se monta 2 veces, sólo
 * la primera instancia activa listeners (guard con `data-installed`).
 */
export function TipProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const doc = document;
    // Guard idempotente.
    if (doc.getElementById(TIP_ID)) return;
    // Crear el tooltip fixed root.
    const root = doc.createElement('div');
    root.className = 'afk';
    // El root no debe interceptar clicks/hovers (excepto el propio tooltip).
    root.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:200';
    const tip = doc.createElement('div');
    tip.className = 'tip';
    tip.id = TIP_ID;
    tip.setAttribute('role', 'tooltip');
    tip.setAttribute('aria-hidden', 'true');
    root.appendChild(tip);
    doc.body.appendChild(root);

    let activeAnchor: HTMLElement | null = null;
    let hideTimeout: number | null = null;
    let touchHideTimeout: number | null = null;

    function resolveCopy(raw: string | null): string | null {
      if (!raw) return null;
      const trimmed = raw.trim();
      // Si es una clave del glosario → composición estructurada.
      if (GLOSARIO[trimmed]) {
        const entry = GLOSARIO[trimmed]!;
        return `<span class="tl">${escapeHtml(entry.label)}</span>${escapeHtml(formatGlosarioTooltip(entry))}`;
      }
      // Si contiene <span class='tl'>...</span> (formato mockup), lo respetamos.
      if (/^<span class=['"]tl['"]/.test(trimmed)) return trimmed;
      // Fallback: texto literal.
      return escapeHtml(trimmed);
    }

    function positionTip(anchor: HTMLElement) {
      const rect = anchor.getBoundingClientRect();
      // Medir tras hacer visible con opacity 0 para tener dimensiones.
      tip.style.opacity = '0';
      tip.classList.add('show');
      const tipRect = tip.getBoundingClientRect();
      // Preferencia: encima del anchor, centrado.
      let top = rect.top - tipRect.height - 8;
      let left = rect.left + rect.width / 2 - tipRect.width / 2;
      // Si no cabe arriba, ponerlo debajo.
      if (top < 8) {
        top = rect.bottom + 8;
      }
      // Clamp horizontal a viewport.
      const vw = window.innerWidth;
      if (left < 8) left = 8;
      if (left + tipRect.width > vw - 8) left = vw - tipRect.width - 8;
      tip.style.left = `${Math.round(left)}px`;
      tip.style.top = `${Math.round(top)}px`;
      tip.style.opacity = '1';
    }

    function show(anchor: HTMLElement) {
      if (hideTimeout) { window.clearTimeout(hideTimeout); hideTimeout = null; }
      const raw = anchor.getAttribute('data-tip');
      const copy = resolveCopy(raw);
      if (!copy) return;
      activeAnchor = anchor;
      tip.innerHTML = copy;
      tip.setAttribute('aria-hidden', 'false');
      anchor.setAttribute('aria-describedby', TIP_ID);
      positionTip(anchor);
    }

    function hide() {
      if (hideTimeout) window.clearTimeout(hideTimeout);
      hideTimeout = window.setTimeout(() => {
        tip.classList.remove('show');
        tip.setAttribute('aria-hidden', 'true');
        if (activeAnchor) {
          activeAnchor.removeAttribute('aria-describedby');
          activeAnchor = null;
        }
      }, 120);
    }

    function findAnchor(target: EventTarget | null): HTMLElement | null {
      if (!(target instanceof Element)) return null;
      const el = target.closest('[data-tip]');
      return el instanceof HTMLElement ? el : null;
    }

    function onMouseOver(e: MouseEvent) {
      const anchor = findAnchor(e.target);
      if (!anchor) return;
      show(anchor);
    }
    function onMouseOut(e: MouseEvent) {
      const anchor = findAnchor(e.target);
      if (!anchor) return;
      const to = e.relatedTarget instanceof Element ? e.relatedTarget.closest('[data-tip]') : null;
      if (to === anchor) return;
      hide();
    }
    function onFocusIn(e: FocusEvent) {
      const anchor = findAnchor(e.target);
      if (anchor) show(anchor);
    }
    function onFocusOut(e: FocusEvent) {
      const anchor = findAnchor(e.target);
      if (anchor) hide();
    }
    function onTouchStart(e: TouchEvent) {
      const anchor = findAnchor(e.target);
      if (!anchor) {
        if (activeAnchor) hide();
        return;
      }
      if (touchHideTimeout) window.clearTimeout(touchHideTimeout);
      show(anchor);
      // En móvil, ocultar tras 3s si no hay nueva interacción.
      touchHideTimeout = window.setTimeout(hide, 3000);
    }
    function onScrollOrResize() {
      if (activeAnchor) positionTip(activeAnchor);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && activeAnchor) hide();
    }

    doc.addEventListener('mouseover', onMouseOver, true);
    doc.addEventListener('mouseout', onMouseOut, true);
    doc.addEventListener('focusin', onFocusIn, true);
    doc.addEventListener('focusout', onFocusOut, true);
    doc.addEventListener('touchstart', onTouchStart, { passive: true });
    doc.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      doc.removeEventListener('mouseover', onMouseOver, true);
      doc.removeEventListener('mouseout', onMouseOut, true);
      doc.removeEventListener('focusin', onFocusIn, true);
      doc.removeEventListener('focusout', onFocusOut, true);
      doc.removeEventListener('touchstart', onTouchStart);
      doc.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      if (hideTimeout) window.clearTimeout(hideTimeout);
      if (touchHideTimeout) window.clearTimeout(touchHideTimeout);
      // Retirar el root del DOM.
      if (root.parentNode) root.parentNode.removeChild(root);
    };
  }, []);
  return <>{children}</>;
}

/**
 * Wrapper de conveniencia. Envuelve un elemento con `data-tip` + `tabIndex=0`
 * automáticamente (accesibilidad teclado). Uso:
 *
 *   <Tip term="EBITDA"><b>EBITDA</b></Tip>
 *   <Tip text="Dato financiero verificado"><span className="srcdot r" /></Tip>
 */
export function Tip({ term, text, className, children, as = 'span' }: {
  term?: string;
  text?: string;
  className?: string;
  children: React.ReactNode;
  as?: 'span' | 'div' | 'b';
}) {
  const tip = term ?? text ?? null;
  if (!tip) return <>{children}</>;
  const Tag = as as 'span';
  return (
    <Tag className={className} data-tip={tip} tabIndex={0}>
      {children}
    </Tag>
  );
}

/**
 * Escape HTML defensivo — evita XSS si algún `data-tip` viene con HTML no confiable.
 * El HTML controlado del `<span class="tl">` se preserva porque `resolveCopy` lo
 * construye a partir del glosario tras `escapeHtml` del label + copy.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
