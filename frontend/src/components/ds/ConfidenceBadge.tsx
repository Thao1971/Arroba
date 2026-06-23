import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * ConfidenceBadge: combina icono ✩ + texto descriptivo + color +
 * porcentaje en tabular-nums. El COLOR no es portador unico de info (WCAG).
 */
type Tier = 'high' | 'med' | 'low';

function toTier(c: number): Tier {
  if (c >= 0.75) return 'high';
  if (c >= 0.5) return 'med';
  return 'low';
}

const tierStyle: Record<Tier, { cls: string; labelEs: string }> = {
  high: {
    cls: 'bg-success/10 text-success border-success/30',
    labelEs: 'Alta',
  },
  med: {
    cls: 'bg-warning/10 text-warning border-warning/30',
    labelEs: 'Media',
  },
  low: {
    cls: 'bg-danger/10 text-danger border-danger/30',
    labelEs: 'Baja',
  },
};

export interface ConfidenceBadgeProps {
  confidence: number; // 0..1
  label?: string;     // 'Confianza' por defecto
  tierLabels?: { high: string; med: string; low: string };
  showPercent?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  label = 'Confianza',
  tierLabels,
  showPercent = true,
  className,
}: ConfidenceBadgeProps) {
  const c = Math.max(0, Math.min(1, confidence));
  const tier = toTier(c);
  const base = tierStyle[tier];
  const tierLabel = tierLabels?.[tier] ?? base.labelEs;
  const pct = Math.round(c * 100);
  return (
    <span
      role="img"
      aria-label={`${label} ${tierLabel}, ${pct}%`}
      className={cn(
        'inline-flex items-center gap-1 px-2 h-7 rounded-full border text-xs font-medium font-body',
        base.cls,
        className
      )}
    >
      <Sparkles size={12} strokeWidth={1.5} className="ai-marker" aria-hidden />
      <span>{label}</span>
      <span aria-hidden>·</span>
      <span>{tierLabel}</span>
      {showPercent && (
        <span className="font-mono tabular text-[11px]">({pct}%)</span>
      )}
    </span>
  );
}
