import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fmtES, fmtMillions } from '../utils/formatES';

const COLORS = {
  primary: '#B6212A',
  secondary: '#006493',
  green: '#16a34a',
  amber: '#d97706',
  gray: '#76777d',
  light: '#e2e2e2',
};

const formatTick = (v) => {
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1).replace('.', ',')}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return fmtES(v, 0);
};

const tooltipFormatter = (v) => fmtES(v, 0);

/* ─── Bar chart (revenue, ebitda, etc.) ─── */
const TrendBarChart = ({ data, color = COLORS.primary, height = 180 }) => {
  if (!data?.years?.length) return null;
  const chartData = data.years.map((y, i) => ({ year: y, value: data.values?.[i] || 0 }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={formatTick} tick={{ fontSize: 10 }} width={50} />
        <Tooltip formatter={tooltipFormatter} />
        <Bar dataKey="value" fill={color} radius={0} />
      </BarChart>
    </ResponsiveContainer>
  );
};

/* ─── Line chart (margin %) ─── */
const TrendLineChart = ({ data, color = COLORS.primary, height = 180 }) => {
  if (!data?.years?.length) return null;
  const chartData = data.years.map((y, i) => ({ year: y, value: data.values?.[i] || 0 }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} width={40} />
        <Tooltip formatter={v => `${fmtES(v, 1)}%`} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ fill: color, r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

/* ─── Dual bar (revenue vs ebitda) ─── */
const DualBarChart = ({ data, height = 180 }) => {
  if (!data?.years?.length) return null;
  const chartData = data.years.map((y, i) => ({ year: y, revenue: data.revenue?.[i] || 0, ebitda: data.ebitda?.[i] || 0 }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={formatTick} tick={{ fontSize: 10 }} width={50} />
        <Tooltip formatter={tooltipFormatter} />
        <Bar dataKey="revenue" fill={COLORS.secondary} name="Facturación" radius={0} />
        <Bar dataKey="ebitda" fill={COLORS.primary} name="EBITDA" radius={0} />
      </BarChart>
    </ResponsiveContainer>
  );
};

/* ─── KPI cards ─── */
const KpiGrid = ({ data }) => {
  const kpis = [
    { label: 'CAGR Ingresos', value: data?.cagr_revenue != null ? `${fmtES(data.cagr_revenue, 1)}%` : '—' },
    { label: 'CAGR EBITDA', value: data?.cagr_ebitda != null ? `${fmtES(data.cagr_ebitda, 1)}%` : '—' },
    { label: 'Margen medio', value: data?.avg_ebitda_margin != null ? `${fmtES(data.avg_ebitda_margin, 1)}%` : '—' },
    { label: 'EBITDA ajust. vs rep.', value: data?.adjusted_vs_reported ? `${fmtMillions(data.adjusted_vs_reported[0] || 0)} / ${fmtMillions(data.adjusted_vs_reported[1] || 0)}` : '—' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((k, i) => (
        <div key={i} className="p-3" style={{ background: 'var(--surface-1)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>{k.label}</p>
          <p className="text-lg font-black mt-1" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{k.value}</p>
        </div>
      ))}
    </div>
  );
};

/* ═══ MAIN: Financial Visual Card ═══ */
export const FinancialVisualCard = ({ chartId, visual, onToggle }) => {
  if (!visual) return null;

  const renderChart = () => {
    if (!visual.enabled || !visual.data) return null;
    switch (visual.chart_type) {
      case 'bar': return <TrendBarChart data={visual.data} color={chartId.includes('ebitda') ? COLORS.green : COLORS.primary} />;
      case 'line': return <TrendLineChart data={visual.data} color={COLORS.primary} />;
      case 'dual_bar': return <DualBarChart data={visual.data} />;
      case 'kpi_grid': return <KpiGrid data={visual.data} />;
      case 'waterfall': return <TrendBarChart data={{ years: [visual.data?.year], values: [visual.data?.revenue] }} color={COLORS.secondary} height={120} />;
      case 'stacked_bar': return <TrendBarChart data={{ years: [visual.data?.year], values: [visual.data?.revenue] }} color={COLORS.amber} height={120} />;
      default: return null;
    }
  };

  const statusLabel = visual.data_complete ? 'Completo' : visual.enabled ? 'Parcial' : 'No disponible';
  const statusColor = visual.data_complete ? '#16a34a' : visual.enabled ? '#d97706' : 'var(--outline)';

  return (
    <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid={`visual-card-${chartId}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{visual.label}</p>
        <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: `${statusColor}12`, color: statusColor }}>{statusLabel}</span>
      </div>

      {/* Chart preview */}
      <div className="mb-3" style={{ minHeight: visual.chart_type === 'kpi_grid' ? 'auto' : 140 }}>
        {visual.enabled ? renderChart() : (
          <div className="flex items-center justify-center h-32" style={{ background: 'var(--surface-1)' }}>
            <p className="text-xs" style={{ color: 'var(--outline)' }}>Sin datos suficientes</p>
          </div>
        )}
      </div>

      {/* Toggles */}
      {visual.enabled && onToggle && (
        <div className="flex items-center gap-4 pt-2" style={{ borderTop: '1px solid var(--surface-1)' }}>
          {['teaser', 'infomemo', 'buyer_advanced'].map(surface => {
            const key = `use_in_${surface}`;
            const labels = { teaser: 'Teaser', infomemo: 'Infomemo', buyer_advanced: 'Buyer avanzado' };
            const isOn = visual[key] || false;
            return (
              <label key={surface} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={isOn} onChange={() => onToggle(chartId, key, !isOn)}
                  style={{ accentColor: 'var(--arroba-primary)' }} />
                <span className="text-[10px] font-semibold" style={{ color: isOn ? 'var(--on-surface)' : 'var(--outline)' }}>{labels[surface]}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══ Gallery ═══ */
export const FinancialVisualsGallery = ({ visuals, onToggle, onRegenerate, loading }) => {
  if (!visuals || Object.keys(visuals).length === 0) {
    return (
      <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Todavía no se han generado visuales financieros</p>
        <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Genera los visuales a partir de los datos financieros validados.</p>
        {onRegenerate && (
          <button onClick={onRegenerate} disabled={loading} className="px-6 py-2 text-xs font-bold disabled:opacity-50" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
            {loading ? 'Generando...' : 'GENERAR VISUALES'}
          </button>
        )}
      </div>
    );
  }

  const enabled = Object.entries(visuals).filter(([, v]) => v.enabled);
  const disabled = Object.entries(visuals).filter(([, v]) => !v.enabled);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="label-arroba" style={{ color: 'var(--outline)' }}>VISUALES FINANCIEROS ({enabled.length} disponibles)</p>
        {onRegenerate && (
          <button onClick={onRegenerate} disabled={loading} className="text-[10px] font-bold flex items-center gap-1 disabled:opacity-50" style={{ color: 'var(--arroba-primary)' }}>
            {loading ? 'Regenerando...' : 'REGENERAR'}
          </button>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {enabled.map(([id, visual]) => (
          <FinancialVisualCard key={id} chartId={id} visual={visual} onToggle={onToggle} />
        ))}
      </div>
      {disabled.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--outline)' }}>NO DISPONIBLES ({disabled.length})</p>
          <div className="grid md:grid-cols-3 gap-2">
            {disabled.map(([id, visual]) => (
              <div key={id} className="p-3" style={{ background: 'var(--surface-1)' }}>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--outline)' }}>{visual.label}</p>
                <p className="text-[9px]" style={{ color: 'var(--outline-variant)' }}>Datos insuficientes</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
