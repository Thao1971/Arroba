'use client';
/**
 * FinanzasSubNav — sub-navegación sticky intra-sección Finanzas.
 *
 * Componente **local** a Finanzas (NO primitiva del DS). Sigue el patrón
 * visual del nav lateral canónico (pills con `data-active`) pero horizontal.
 *
 * Anclas canónicas (deben coincidir con los `id` de los bloques):
 *   - `finanzas-evolucion`
 *   - `finanzas-pl`
 *   - `finanzas-balance`
 *   - `finanzas-ratios`
 *   - `finanzas-calidad`   (FinancialQualityCard futuro)
 *   - `finanzas-solvencia` (SolvencyCard futuro)
 *
 * Comportamiento:
 *   - Sticky `top-[128px]` (56px topbar + 72px section header canónico).
 *   - Detecta el ancla más cercana usando `IntersectionObserver`.
 *   - Click en pill hace `scrollIntoView` con offset (respetando `scroll-mt-24`
 *     del `EntitySectionWrapper`).
 *   - Sin librería externa.
 */
import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

export interface FinanzasSubNavItem {
  id: string;
  label: string;
  /** Marca el ítem como no interactivo (ej. bloque unavailable). */
  disabled?: boolean;
}

export interface FinanzasSubNavProps {
  items: readonly FinanzasSubNavItem[];
  testId?: string;
  className?: string;
}

export function FinanzasSubNav({
  items,
  testId = 'finanzas-subnav',
  className,
}: FinanzasSubNavProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        /* Selecciona la sección más visible (mayor `intersectionRatio`). */
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      {
        rootMargin: '-140px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      /* `scroll-mt-24` en EntitySectionWrapper compensa la topbar (56 + 24 = 80).
         Como el SubNav está más abajo (top-[128]), forzamos scrollIntoView + un
         reajuste con window.scrollBy para que el header del bloque quede visible. */
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        window.scrollBy({ top: -(128 + 8), behavior: 'smooth' });
      }, 0);
      setActiveId(id);
    }
  };

  return (
    <nav
      aria-label="Sub-navegación Finanzas"
      data-testid={testId}
      className={cn(
        'sticky top-[128px] z-sticky',
        '-mx-4 md:-mx-6',
        'px-4 md:px-6',
        'py-2',
        'bg-surface-primary/85 backdrop-blur',
        'border-b border-border-default',
        'mb-6',
        className,
      )}
    >
      <ul className="flex flex-wrap items-center gap-1.5">
        {items.map((it) => {
          const active = it.id === activeId;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                onClick={it.disabled ? undefined : (e) => onClick(e, it.id)}
                aria-current={active ? 'true' : undefined}
                aria-disabled={it.disabled || undefined}
                data-active={active || undefined}
                data-testid={`${testId}-item-${it.id}`}
                className={cn(
                  'inline-flex items-center gap-1.5',
                  'rounded-full px-3 py-1.5',
                  'text-body-sm font-body font-medium',
                  'transition-colors duration-fast',
                  'focus-visible:shadow-focus focus-visible:outline-none',
                  active
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
                  it.disabled &&
                    'opacity-50 cursor-not-allowed pointer-events-none',
                )}
              >
                {it.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
