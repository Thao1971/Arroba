'use client';
/**
 * Tooltip — primitiva canónica "Explainability first" (Design System v1.1.0).
 *
 * Propósito
 * ---------
 * Superficie flotante que explica un dato — no sólo lo etiqueta. Se usa en toda
 * la plataforma para:
 *   1. Ratios financieros (fórmula matemática).
 *   2. Confidence badges (level + score).
 *   3. Source / updated_at / provenance de cualquier campo del payload proxy.
 *
 * API canónica
 * ------------
 * ```tsx
 * <Tooltip content={{
 *   title:       'ROE',
 *   description: 'Rentabilidad de los fondos propios',
 *   formula:     'Beneficio neto / Patrimonio neto',
 *   source:      'Iberinform · Registradores Mercantiles',
 *   updated_at:  '2026-01-14T00:00:00Z',
 *   confidence:  { level: 'high', score: 92 },
 *   learn_more:  { label: 'Ver metodología', onClick: openDrawer },
 * }}>
 *   <span>ROE</span>
 * </Tooltip>
 * ```
 *
 * Retrocompatible: `content` puede seguir siendo `string` (equivale a
 * `{ description: string }`).
 *
 * Variantes (`variant` opcional, se autoinfiere si no se especifica)
 * -----------------------------------------------------------------
 *   default        · solo title/description
 *   formula        · fondo `surface-muted`, fórmula en `<code>` mono
 *   explainability · source + updated_at + confidence + learn_more
 *
 * A11y: role="tooltip", aria-describedby, focus + hover + touch, respeta
 * `prefers-reduced-motion`. Sin dependencias externas (Radix / HeadlessUI).
 *
 * z-index: `--z-tooltip` (1300).
 */
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

import { cn } from '@/lib/cn';
import { ConfidenceBadge } from '@/components/ds/ConfidenceBadge';

/* ============================================================
 * Tipos canónicos (D1 — Tooltip explainability-first)
 * ============================================================ */

export type TooltipConfidenceLevel = 'low' | 'medium' | 'high';

export interface TooltipConfidence {
  level: TooltipConfidenceLevel;
  /** Puntaje opcional 0-100. */
  score?: number;
}

export interface TooltipLearnMore {
  /** Texto del CTA. Default: "Ver explicación completa". */
  label?: string;
  /** URL. Si presente se renderiza como `<a>`. */
  href?: string;
  /** Callback. Si presente se renderiza como `<button>` (abre drawer/modal). */
  onClick?: () => void;
}

export interface TooltipContent {
  title?: string;
  description?: string;
  /** Fórmula matemática. Se renderiza en `<code>` con `font-mono`. */
  formula?: string;
  /** Fuente del dato (ej. "Iberinform · Registradores Mercantiles"). */
  source?: string;
  /** ISO string. Se muestra como "hace X días". */
  updated_at?: string;
  /** Nivel de confianza + score opcional. Renderiza `<ConfidenceBadge>`. */
  confidence?: TooltipConfidence;
  /** CTA para abrir explicación completa. */
  learn_more?: TooltipLearnMore;
}

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';
export type TooltipVariant = 'default' | 'formula' | 'explainability';

export interface TooltipProps {
  /**
   * Contenido del tooltip. Puede ser:
   *   - `string`        → se trata como `{ description: string }`.
   *   - `ReactNode`     → contenido custom (escape hatch para casos avanzados).
   *   - `TooltipContent` → objeto tipado (recomendado).
   */
  content: string | ReactNode | TooltipContent;
  /**
   * Variante visual. Si se omite se infiere automáticamente:
   *   - Si `formula` está presente → 'formula'.
   *   - Si `source`/`updated_at`/`confidence`/`learn_more` presentes → 'explainability'.
   *   - En otro caso → 'default'.
   */
  variant?: TooltipVariant;
  side?: TooltipSide;
  align?: TooltipAlign;
  /** Delay al abrir (hover/focus). Default 200ms. */
  openDelayMs?: number;
  /** Delay al cerrar. Default 100ms. */
  closeDelayMs?: number;
  /** Máx 320px de ancho por defecto (D1). */
  maxWidthClassName?: string;
  /** Si `true` no se muestra el tooltip. */
  disabled?: boolean;
  /** `data-testid` del panel flotante. */
  testId?: string;
  /** Trigger. */
  children: ReactElement<{
    ref?: React.Ref<HTMLElement>;
    onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
    onFocus?: (e: FocusEvent<HTMLElement>) => void;
    onBlur?: (e: FocusEvent<HTMLElement>) => void;
    'aria-describedby'?: string;
  }>;
}

/* ============================================================
 * Helpers
 * ============================================================ */

function isTooltipContentObject(v: unknown): v is TooltipContent {
  if (v === null || typeof v !== 'object') return false;
  // ReactNode con `$$typeof` no lo consideramos como TooltipContent.
  if ('$$typeof' in (v as object)) return false;
  const keys = ['title', 'description', 'formula', 'source', 'updated_at', 'confidence', 'learn_more'];
  return keys.some((k) => k in (v as Record<string, unknown>));
}

function inferVariant(c: TooltipContent): TooltipVariant {
  if (c.formula) return 'formula';
  if (c.source || c.updated_at || c.confidence || c.learn_more) {
    return 'explainability';
  }
  return 'default';
}

function relativeFromNow(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const diffMs = Date.now() - t;
  const sign = diffMs >= 0 ? 'hace' : 'en';
  const abs = Math.abs(diffMs);
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;
  const min = 60 * 1000;
  if (abs < min) return sign === 'hace' ? 'hace segundos' : 'en segundos';
  if (abs < hour) {
    const m = Math.round(abs / min);
    return `${sign} ${m} min`;
  }
  if (abs < day) {
    const h = Math.round(abs / hour);
    return `${sign} ${h} h`;
  }
  if (abs < 30 * day) {
    const d = Math.round(abs / day);
    return `${sign} ${d} día${d === 1 ? '' : 's'}`;
  }
  if (abs < 365 * day) {
    const m = Math.round(abs / (30 * day));
    return `${sign} ${m} mes${m === 1 ? '' : 'es'}`;
  }
  const y = Math.round(abs / (365 * day));
  return `${sign} ${y} año${y === 1 ? '' : 's'}`;
}

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(media.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);
  return prefers;
}

/* ============================================================
 * Panel interno
 * ============================================================ */

const VARIANT_CLASSES: Record<TooltipVariant, string> = {
  default:
    'bg-surface-elevated text-text-primary border border-border-emphasis',
  formula:
    'bg-surface-muted text-text-primary border border-border-emphasis',
  explainability:
    'bg-surface-elevated text-text-primary border border-info/30',
};

function TooltipPanel({
  content,
  variant,
}: {
  content: TooltipContent;
  variant: TooltipVariant;
}) {
  return (
    <div className="flex items-start gap-2">
      {variant === 'explainability' && (
        <Info
          size={14}
          strokeWidth={1.8}
          className="shrink-0 mt-0.5 text-info"
          aria-hidden
        />
      )}
      <div className="flex-1 min-w-0 space-y-2">
        {content.title && (
          <p
            data-testid="tooltip-title"
            className="font-display font-semibold text-body-sm text-text-primary"
          >
            {content.title}
          </p>
        )}
        {content.description && (
          <p
            data-testid="tooltip-description"
            className="font-body text-body-sm text-text-secondary leading-body"
          >
            {content.description}
          </p>
        )}
        {content.formula && (
          <div data-testid="tooltip-formula">
            <p className="text-caption uppercase tracking-caption text-text-muted mb-1">
              Fórmula
            </p>
            <code className="block font-mono text-body-sm tabular-nums text-text-primary bg-surface-primary/50 rounded-md px-2 py-1 border border-border-default">
              {content.formula}
            </code>
          </div>
        )}
        {content.confidence && (
          <div
            data-testid="tooltip-confidence"
            className="flex items-center gap-2"
          >
            <ConfidenceBadge
              confidence={
                typeof content.confidence.score === 'number'
                  ? Math.max(0, Math.min(100, content.confidence.score)) / 100
                  : content.confidence.level === 'high'
                    ? 0.9
                    : content.confidence.level === 'medium'
                      ? 0.65
                      : 0.3
              }
              showPercent={typeof content.confidence.score === 'number'}
            />
          </div>
        )}
        {(content.source || content.updated_at) && (
          <div
            data-testid="tooltip-provenance"
            className="text-caption text-text-muted space-y-0.5 pt-1 border-t border-border-default/60"
          >
            {content.source && (
              <p>
                <span className="uppercase tracking-caption">Fuente:</span>{' '}
                {content.source}
              </p>
            )}
            {content.updated_at && (
              <p>
                <span className="uppercase tracking-caption">Actualizado:</span>{' '}
                {relativeFromNow(content.updated_at)}
              </p>
            )}
          </div>
        )}
        {content.learn_more && (
          <div className="pt-1 pointer-events-auto" data-testid="tooltip-learn-more">
            {content.learn_more.href ? (
              <a
                href={content.learn_more.href}
                className="inline-flex items-center gap-1 text-body-sm font-medium text-brand-primary hover:underline focus-visible:shadow-focus focus-visible:outline-none rounded"
              >
                {content.learn_more.label ?? 'Ver explicación completa'} →
              </a>
            ) : (
              <button
                type="button"
                onClick={content.learn_more.onClick}
                className="inline-flex items-center gap-1 text-body-sm font-medium text-brand-primary hover:underline focus-visible:shadow-focus focus-visible:outline-none rounded"
              >
                {content.learn_more.label ?? 'Ver explicación completa'} →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Componente público
 * ============================================================ */

const OFFSET_PX = 8;

export function Tooltip({
  content,
  variant,
  side = 'top',
  align = 'center',
  openDelayMs = 200,
  closeDelayMs = 100,
  maxWidthClassName = 'max-w-[320px]',
  disabled = false,
  testId,
  children,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uid = useId();
  const tooltipId = `tooltip-${uid.replace(/[:]/g, '')}`;
  const reduceMotion = usePrefersReducedMotion();

  /* Normalización del `content`. */
  const parsed: {
    isNode: boolean;
    obj?: TooltipContent;
    node?: ReactNode;
  } = useMemo(() => {
    if (typeof content === 'string') {
      return { isNode: false, obj: { description: content } };
    }
    if (isTooltipContentObject(content)) {
      return { isNode: false, obj: content as TooltipContent };
    }
    return { isNode: true, node: content as ReactNode };
  }, [content]);

  const resolvedVariant: TooltipVariant = useMemo(() => {
    if (variant) return variant;
    if (parsed.obj) return inferVariant(parsed.obj);
    return 'default';
  }, [variant, parsed.obj]);

  useEffect(() => setMounted(true), []);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const doOpen = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (openTimerRef.current) return;
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      setOpen(true);
    }, openDelayMs);
  }, [openDelayMs]);

  const doClose = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) return;
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
    }, closeDelayMs);
  }, [closeDelayMs]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearTimers();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, clearTimers]);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;
    const tr = trigger.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    let top = 0;
    let left = 0;
    switch (side) {
      case 'top':
        top = tr.top - pr.height - OFFSET_PX;
        left =
          align === 'start'
            ? tr.left
            : align === 'end'
              ? tr.right - pr.width
              : tr.left + tr.width / 2 - pr.width / 2;
        break;
      case 'bottom':
        top = tr.bottom + OFFSET_PX;
        left =
          align === 'start'
            ? tr.left
            : align === 'end'
              ? tr.right - pr.width
              : tr.left + tr.width / 2 - pr.width / 2;
        break;
      case 'left':
        left = tr.left - pr.width - OFFSET_PX;
        top =
          align === 'start'
            ? tr.top
            : align === 'end'
              ? tr.bottom - pr.height
              : tr.top + tr.height / 2 - pr.height / 2;
        break;
      case 'right':
        left = tr.right + OFFSET_PX;
        top =
          align === 'start'
            ? tr.top
            : align === 'end'
              ? tr.bottom - pr.height
              : tr.top + tr.height / 2 - pr.height / 2;
        break;
    }
    const margin = 8;
    const maxLeft = window.innerWidth - pr.width - margin;
    const maxTop = window.innerHeight - pr.height - margin;
    left = Math.min(Math.max(margin, left), Math.max(margin, maxLeft));
    top = Math.min(Math.max(margin, top), Math.max(margin, maxTop));
    setCoords({ top: top + window.scrollY, left: left + window.scrollX });
  }, [align, side]);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => reposition();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, reposition]);

  const childProps = children.props;

  const setTriggerRef = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (children as { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && typeof childRef === 'object') {
        (childRef as { current: HTMLElement | null }).current = node;
      }
    },
    [children],
  );

  const enhancedChild = useMemo(() => {
    if (!isValidElement(children)) return children;
    return cloneElement(children, {
      ref: setTriggerRef,
      onMouseEnter: (e: MouseEvent<HTMLElement>) => {
        childProps.onMouseEnter?.(e);
        if (!disabled) doOpen();
      },
      onMouseLeave: (e: MouseEvent<HTMLElement>) => {
        childProps.onMouseLeave?.(e);
        doClose();
      },
      onFocus: (e: FocusEvent<HTMLElement>) => {
        childProps.onFocus?.(e);
        if (!disabled) doOpen();
      },
      onBlur: (e: FocusEvent<HTMLElement>) => {
        childProps.onBlur?.(e);
        doClose();
      },
      'aria-describedby': open ? tooltipId : childProps['aria-describedby'],
    });
  }, [children, childProps, disabled, doClose, doOpen, open, setTriggerRef, tooltipId]);

  const panelStyle: CSSProperties = {
    top: coords?.top ?? -9999,
    left: coords?.left ?? -9999,
    visibility: coords ? 'visible' : 'hidden',
  };

  const hasLearnMoreCTA = parsed.obj?.learn_more;

  return (
    <>
      {enhancedChild}
      {mounted && open && !disabled
        ? createPortal(
            <div
              ref={panelRef}
              role="tooltip"
              id={tooltipId}
              data-testid={testId}
              data-variant={resolvedVariant}
              data-side={side}
              style={panelStyle}
              onMouseEnter={() => {
                /* Mantener abierto si el cursor entra en el panel (permite click en learn_more). */
                if (closeTimerRef.current) {
                  clearTimeout(closeTimerRef.current);
                  closeTimerRef.current = null;
                }
              }}
              onMouseLeave={doClose}
              className={cn(
                'fixed z-tooltip',
                hasLearnMoreCTA ? 'pointer-events-auto' : 'pointer-events-none',
                'rounded-md shadow-md p-3',
                'font-body text-body-sm leading-body',
                VARIANT_CLASSES[resolvedVariant],
                maxWidthClassName,
                !reduceMotion && 'animate-fade-in-up',
              )}
            >
              {parsed.isNode ? parsed.node : parsed.obj ? (
                <TooltipPanel content={parsed.obj} variant={resolvedVariant} />
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/* Helper puro exportado para tests unitarios. */
export const __test = { inferVariant, isTooltipContentObject, relativeFromNow };
