import React, { useState, useMemo } from 'react';
import { AlertCircle, Check, Info, RefreshCw } from 'lucide-react';
import { fmtES } from '../utils/formatES';
import { NumericInputES } from './NumericInputES';

/* ─── Source badge ─── */
const SourceBadge = ({ source }) => {
  const cfg = {
    CIS: { bg: 'rgba(79,70,229,0.06)', color: '#4f46e5', label: 'CIS' },
    IBERINFORM: { bg: 'rgba(22,163,74,0.06)', color: '#16a34a', label: 'Iberinform' },
    MANUAL: { bg: 'var(--surface-2)', color: 'var(--on-surface)', label: 'Manual' },
    MIXED: { bg: 'rgba(217,119,6,0.06)', color: '#d97706', label: 'Mixto' },
  };
  const c = cfg[source] || cfg.MANUAL;
  return <span className="px-1.5 py-0.5 text-[8px] font-bold" style={{ background: c.bg, color: c.color }}>{c.label}</span>;
};

/* ─── Editable cell ─── */
const Cell = ({ value, onChange, source, readonly, highlight, testId }) => (
  <td className="py-2 px-2">
    <div className="flex flex-col gap-0.5">
      {readonly ? (
        <span className="text-sm font-bold px-2 py-1.5" style={{ color: 'var(--on-surface)', background: 'var(--surface-1)' }}>{value !== null && value !== undefined && value !== '' ? fmtES(value, 0) : '—'}</span>
      ) : (
        <NumericInputES value={value} onChange={onChange} placeholder="—" className="text-sm font-semibold px-2 py-1.5 outline-none border-0 border-b-2 border-transparent focus:border-arroba-coral" style={{ background: highlight ? 'rgba(182,33,42,0.03)' : 'var(--surface-2)', borderRadius: 0, color: 'var(--on-surface)' }} testId={testId} />
      )}
      {source && <SourceBadge source={source} />}
    </div>
  </td>
);

/* ─── Validation alert ─── */
const ValidationAlert = ({ type, message }) => {
  const isWarning = type === 'warning';
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 text-[10px]" style={{ background: isWarning ? 'rgba(217,119,6,0.04)' : 'rgba(220,38,38,0.04)', color: isWarning ? '#d97706' : '#dc2626' }}>
      <AlertCircle size={10} /> {message}
    </div>
  );
};

/* ═══════════════════════════════════════════
   FINANCIAL STATEMENTS STEP
   ═══════════════════════════════════════════ */
const FinancialStatementsStep = ({ financials, setFinancials, financialDataSource, valuationInputs, setValuationInputs, onRecalculate }) => {
  const years = useMemo(() => {
    const yrs = financials.map(f => f.year).filter(Boolean).sort((a, b) => b - a);
    if (yrs.length < 3) {
      const latest = yrs[0] || new Date().getFullYear() - 1;
      while (yrs.length < 3) { yrs.push(latest - yrs.length); }
    }
    return yrs.slice(0, 5);
  }, [financials]);

  const getFinIdx = (year) => financials.findIndex(f => f.year === year);

  const getVal = (year, field) => {
    const idx = getFinIdx(year);
    if (idx < 0) return '';
    const f = financials[idx];
    // Check nested pnl/balance structure first, then flat
    if (field.startsWith('pnl.')) { const k = field.replace('pnl.', ''); return f.pnl?.[k] ?? f[k] ?? ''; }
    if (field.startsWith('balance.')) { const k = field.replace('balance.', ''); return f.balance?.[k] ?? f[k] ?? ''; }
    return f[field] ?? '';
  };

  const setVal = (year, field, value) => {
    setFinancials(prev => {
      const next = [...prev];
      let idx = next.findIndex(f => f.year === year);
      if (idx < 0) { next.push({ year, pnl: {}, balance: {}, sources: {}, data_source: 'MANUAL' }); idx = next.length - 1; }
      const entry = { ...next[idx] };
      
      // Set in nested structure
      const cleanField = field.replace('pnl.', '').replace('balance.', '');
      if (field.startsWith('pnl.')) { entry.pnl = { ...(entry.pnl || {}), [cleanField]: value }; }
      else if (field.startsWith('balance.')) { entry.balance = { ...(entry.balance || {}), [cleanField]: value }; }
      else { entry[cleanField] = value; }
      
      // Also set flat for backward compat
      entry[cleanField] = value;
      
      // Track source as manual
      entry.sources = { ...(entry.sources || {}), [field]: 'MANUAL' };
      entry.is_manually_edited = true;
      entry.edited_at = new Date().toISOString();
      
      next[idx] = entry;
      return next;
    });
  };

  const getSource = (year, field) => {
    const idx = getFinIdx(year);
    if (idx < 0) return null;
    return financials[idx]?.sources?.[field] || financials[idx]?.data_source || null;
  };

  // Computed values
  const grossMargin = (year) => {
    const rev = parseFloat(getVal(year, 'pnl.revenue')) || 0;
    const sup = parseFloat(getVal(year, 'pnl.supplies')) || 0;
    return rev && sup ? rev + sup : null; // supplies is negative
  };
  const totalAssets = (year) => {
    const nca = parseFloat(getVal(year, 'balance.non_current_assets')) || 0;
    const ca = parseFloat(getVal(year, 'balance.current_assets')) || 0;
    return (nca || ca) ? nca + ca : null;
  };
  const totalLiabEquity = (year) => {
    const eq = parseFloat(getVal(year, 'balance.equity')) || 0;
    const ncl = parseFloat(getVal(year, 'balance.non_current_liabilities')) || 0;
    const cl = parseFloat(getVal(year, 'balance.current_liabilities')) || 0;
    return (eq || ncl || cl) ? eq + ncl + cl : null;
  };
  const balanceMatches = (year) => {
    const ta = totalAssets(year);
    const tle = totalLiabEquity(year);
    if (!ta || !tle) return null;
    return Math.abs(ta - tle) < 1;
  };

  // Validations per year
  const validations = useMemo(() => {
    const v = {};
    years.forEach(y => {
      const errs = [];
      if (!getVal(y, 'pnl.revenue')) errs.push({ type: 'error', message: `Facturación ${y} faltante` });
      if (!getVal(y, 'pnl.ebitda') && !getVal(y, 'pnl.adjusted_ebitda')) errs.push({ type: 'error', message: `EBITDA ${y} faltante` });
      if (!getVal(y, 'pnl.adjusted_ebitda')) errs.push({ type: 'warning', message: `EBITDA ajustado ${y} no completado — mejora la calidad de la valoración` });
      if (!getVal(y, 'pnl.personnel_expenses')) errs.push({ type: 'warning', message: `Gastos de personal ${y} faltante` });
      if (!getVal(y, 'pnl.net_result')) errs.push({ type: 'warning', message: `Resultado del ejercicio ${y} faltante` });
      const bm = balanceMatches(y);
      if (bm === false) errs.push({ type: 'error', message: `Balance ${y} descuadrado` });
      v[y] = errs;
    });
    return v;
  }, [financials, years]);

  const allValidations = Object.values(validations).flat();
  const errors = allValidations.filter(v => v.type === 'error');
  const warnings = allValidations.filter(v => v.type === 'warning');

  // P&L rows config
  const pnlRows = [
    { key: 'pnl.revenue', label: 'Facturación', editable: true },
    { key: 'pnl.supplies', label: 'Aprovisionamientos', editable: true },
    { key: 'pnl.gross_margin', label: 'Margen bruto', editable: false, computed: grossMargin },
    { key: 'pnl.operating_expenses', label: 'Gastos de explotación', editable: true },
    { key: 'pnl.personnel_expenses', label: 'Gastos de personal', editable: true },
    { key: 'pnl.ebitda', label: 'EBITDA', editable: true },
    { key: 'pnl.adjusted_ebitda', label: 'EBITDA ajustado', editable: true, manual: true },
    { key: 'pnl.net_result', label: 'Resultado del ejercicio', editable: true },
  ];

  const balanceRows = [
    { key: 'balance.non_current_assets', label: 'Activo no corriente', editable: true },
    { key: 'balance.current_assets', label: 'Activo corriente', editable: true },
    { key: 'total_assets', label: 'Total activo', editable: false, computed: totalAssets },
    { key: 'balance.equity', label: 'Patrimonio neto', editable: true },
    { key: 'balance.non_current_liabilities', label: 'Pasivo no corriente', editable: true },
    { key: 'balance.current_liabilities', label: 'Pasivo corriente', editable: true },
    { key: 'total_liab_equity', label: 'Total pasivo + patrimonio', editable: false, computed: totalLiabEquity },
  ];

  return (
    <div className="w-full" data-testid="financial-statements-step">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
          Estados financieros
        </h1>
        <p className="text-sm mb-4" style={{ color: 'var(--outline)', maxWidth: 600 }}>
          Hemos precargado tus estados financieros desde CIS e Iberinform. Revísalos y corrige cualquier dato antes de continuar.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {financialDataSource && financialDataSource !== 'MANUAL' && <SourceBadge source={financialDataSource} />}
          <span className="px-2 py-0.5 text-[9px] font-bold" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>Edición manual disponible</span>
          <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{years.length} ejercicios</span>
        </div>
      </div>

      {/* Validations panel */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="mb-6 space-y-1" data-testid="validation-panel">
          {errors.map((v, i) => <ValidationAlert key={`e${i}`} {...v} />)}
          {warnings.slice(0, 3).map((v, i) => <ValidationAlert key={`w${i}`} {...v} />)}
          {warnings.length > 3 && <p className="text-[10px] px-3" style={{ color: 'var(--outline)' }}>+{warnings.length - 3} alertas adicionales</p>}
        </div>
      )}

      {/* P&L Table */}
      <div className="mb-8">
        <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>CUENTA DE RESULTADOS</p>
        <div className="overflow-x-auto" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <table className="w-full text-sm" data-testid="pnl-table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
                <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)', width: '25%' }}>Partida</th>
                {years.map(y => <th key={y} className="text-center py-3 px-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>{y}</th>)}
              </tr>
            </thead>
            <tbody>
              {pnlRows.map(row => (
                <tr key={row.key} style={{ borderBottom: '1px solid var(--surface-1)', background: row.manual ? 'rgba(182,33,42,0.02)' : row.computed ? 'var(--surface-1)' : undefined }}>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs ${row.computed ? 'italic' : 'font-semibold'}`} style={{ color: 'var(--on-surface)' }}>{row.label}</span>
                      {row.manual && <span className="px-1 py-0.5 text-[7px] font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>MANUAL</span>}
                    </div>
                    {row.manual && <p className="text-[9px]" style={{ color: 'var(--outline)' }}>EBITDA ajustado que consideras representativo para valoración</p>}
                  </td>
                  {years.map(y => row.computed ? (
                    <Cell key={y} value={row.computed(y)} readonly source={null} />
                  ) : (
                    <Cell key={y} value={getVal(y, row.key)} onChange={v => setVal(y, row.key, v)} source={getSource(y, row.key)} highlight={row.manual} testId={`${row.key}-${y}`} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Table */}
      <div className="mb-8">
        <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>BALANCE</p>
        <div className="overflow-x-auto" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <table className="w-full text-sm" data-testid="balance-table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
                <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)', width: '25%' }}>Partida</th>
                {years.map(y => <th key={y} className="text-center py-3 px-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>{y}</th>)}
              </tr>
            </thead>
            <tbody>
              {balanceRows.map(row => {
                const isTotal = row.key.startsWith('total_');
                return (
                  <tr key={row.key} style={{ borderBottom: '1px solid var(--surface-1)', background: isTotal ? 'var(--surface-1)' : undefined }}>
                    <td className="py-2 px-3">
                      <span className={`text-xs ${isTotal ? 'font-bold' : 'font-semibold'}`} style={{ color: 'var(--on-surface)' }}>{row.label}</span>
                      {row.key === 'total_liab_equity' && years.some(y => balanceMatches(y) === false) && (
                        <span className="ml-1 text-[8px] font-bold" style={{ color: '#dc2626' }}>DESCUADRADO</span>
                      )}
                    </td>
                    {years.map(y => {
                      if (row.computed) {
                        const val = row.computed(y);
                        const match = row.key === 'total_liab_equity' ? balanceMatches(y) : null;
                        return (
                          <td key={y} className="py-2 px-2">
                            <span className="text-sm font-bold px-2 py-1.5 block" style={{ color: match === false ? '#dc2626' : 'var(--on-surface)', background: 'var(--surface-1)' }}>
                              {val !== null ? fmtES(val, 0) : '—'}
                              {match === true && <Check size={10} className="inline ml-1" style={{ color: '#16a34a' }} />}
                              {match === false && <AlertCircle size={10} className="inline ml-1" />}
                            </span>
                          </td>
                        );
                      }
                      return <Cell key={y} value={getVal(y, row.key)} onChange={v => setVal(y, row.key, v)} source={getSource(y, row.key)} testId={`${row.key}-${y}`} />;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Valuation factors (kept from original) */}
      <div className="pt-6 mb-6" style={{ borderTop: '2px solid var(--surface-2)' }}>
        <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>FACTORES CUALITATIVOS DEL SELLER</p>
        <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Estos datos complementan los estados financieros y mejoran la precisión de la valoración.</p>
        <div className="grid grid-cols-2 gap-4 p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <div>
            <label className="label-arroba block mb-1">% INGRESOS RECURRENTES</label>
            <NumericInputES value={getVal(years[0], 'recurring_revenue_pct')} onChange={v => setVal(years[0], 'recurring_revenue_pct', v)} placeholder="70" className="input-arroba w-full" testId="input-recurring" />
          </div>
          <div>
            <label className="label-arroba block mb-1">% CONCENTRACIÓN TOP 5 CLIENTES</label>
            <NumericInputES value={getVal(years[0], 'client_concentration_top5')} onChange={v => setVal(years[0], 'client_concentration_top5', v)} placeholder="40" className="input-arroba w-full" testId="input-concentration" />
          </div>
          <div>
            <label className="label-arroba block mb-1">DEPENDENCIA DEL FUNDADOR</label>
            <select value={valuationInputs.founder_dependency} onChange={e => setValuationInputs({...valuationInputs, founder_dependency: e.target.value})} className="input-arroba w-full" data-testid="select-founder-dep">
              <option value="low">Baja — Equipo autónomo</option>
              <option value="medium">Media — Fundador operativo</option>
              <option value="high">Alta — Fundador imprescindible</option>
            </select>
          </div>
          <div>
            <label className="label-arroba block mb-1">TIPO DE INGRESOS</label>
            <select value={valuationInputs.recurring_revenue_type} onChange={e => setValuationInputs({...valuationInputs, recurring_revenue_type: e.target.value})} className="input-arroba w-full" data-testid="select-revenue-type">
              <option value="retainer">Retainer / Fee mensual</option>
              <option value="project">Proyectos puntuales</option>
              <option value="mixed">Mixto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      {onRecalculate && (
        <div className="flex items-center gap-3">
          <button onClick={onRecalculate} className="flex items-center gap-2 px-4 py-2 text-xs font-bold" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>
            <RefreshCw size={12} /> RECALCULAR VALORACIÓN
          </button>
        </div>
      )}
    </div>
  );
};

export default FinancialStatementsStep;
