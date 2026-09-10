import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/cn';
import { formatNumber, formatPercent } from '@/lib/format';

export interface KpiCardProps {
  label: string;
  value: number | null;
  /**
   * Variación en formato FRACCIÓN (0.008 = 0.8%), tal cual la devuelve Intel
   * en `business-demography` (`change_pct_mom`/`change_pct_yoy`). Este
   * componente la multiplica ×100 antes de pintarla — pasar aquí un valor ya
   * en puntos porcentuales (8 en vez de 0.08) la duplicaría por 100.
   */
  changePct: number | null;
  trend: string | null;
  /**
   * Qué periodo describe `changePct`, para no dejarlo ambiguo en pantalla
   * (bug real encontrado 2026-09-10 en Mapa Empresarial: la card mostraba
   * "vs. periodo anterior" sin decir cuál, y además pintaba la fracción sin
   * multiplicar ×100 — p.ej. -0.154 salía como "-0.2%" en vez de "-15,4%").
   */
  periodLabel?: string;
}

export function KpiCard({ label, value, changePct, trend, periodLabel = 'vs. periodo anterior' }: KpiCardProps) {
  const changePoints = changePct === null || changePct === undefined ? null : changePct * 100;
  return (
    <Card>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-display text-2xl font-semibold text-text mt-1">{formatNumber(value)}</p>
      <div className="flex items-center gap-1 mt-1">
        <TrendIcon trend={trend} />
        <span
          className={cn(
            'text-xs font-medium',
            changePoints !== null && changePoints > 0
              ? 'text-success'
              : changePoints !== null && changePoints < 0
              ? 'text-danger'
              : 'text-text-muted',
          )}
        >
          {changePoints !== null && changePoints > 0 ? '+' : ''}
          {formatPercent(changePoints, 1)}
        </span>
        <span className="text-xs text-text-muted">{periodLabel}</span>
      </div>
    </Card>
  );
}

function TrendIcon({ trend }: { trend: string | null | undefined }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-success" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-danger" />;
  return <Minus size={14} className="text-text-muted" />;
}
