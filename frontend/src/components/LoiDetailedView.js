import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { engagementsAPI } from '../services/api';
import BuyerActivityPanel from './BuyerActivityPanel';
import {
  FileSignature, TrendingUp, Clock, User, Loader2, Star, Zap, Target,
  CheckCircle2, XCircle, Lock, ArrowRight, AlertTriangle, ArrowUpDown,
  Shield, MessageSquare, Eye, Award, ChevronDown
} from 'lucide-react';

/* ─── Configs ─── */
const stageLabels = {
  SUBMITTED: { label: 'Enviado', bg: 'rgba(59,130,246,0.06)', color: 'text-blue-700' },
  VIEWED: { label: 'Visto', bg: 'rgba(217,119,6,0.06)', color: 'text-amber-700' },
  ACCEPTED: { label: 'Aceptado', bg: 'rgba(20,184,166,0.06)', color: 'text-teal-700' },
  SHORTLISTED: { label: 'Shortlist', bg: 'rgba(22,163,74,0.06)', color: 'text-green-700' },
  EXCLUSIVITY: { label: 'Exclusividad', bg: 'rgba(79,70,229,0.06)', color: 'text-indigo-700' },
  REJECTED: { label: 'Descartado', bg: 'rgba(220,38,38,0.05)', color: 'text-red-600' },
};

const certLabels = {
  certified: { label: 'Certificado', color: '#16a34a' },
  verified: { label: 'Verificado', color: '#d97706' },
  basic: { label: 'Básico', color: 'var(--outline)' },
};

const intentLabels = {
  alta: { label: 'Alta', color: '#16a34a', icon: Zap },
  media: { label: 'Media', color: '#d97706', icon: Target },
  baja: { label: 'Baja', color: 'var(--outline)', icon: null },
};

const flagConfig = {
  best_offer: { bg: 'rgba(182,33,42,0.06)', color: 'var(--arroba-primary)' },
  most_cash: { bg: 'rgba(22,163,74,0.06)', color: '#16a34a' },
  highest_activity: { bg: 'rgba(0,100,147,0.06)', color: '#006493' },
  low_activity: { bg: 'rgba(220,38,38,0.05)', color: '#dc2626' },
  expires_soon: { bg: 'rgba(217,119,6,0.06)', color: '#d97706' },
};

const fmtEur = (v) => v ? `${(v / 1e6).toFixed(1).replace('.', ',')}M€` : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

/* ═══════════════════════════════════════════
   LOI COMPARATOR
   ═══════════════════════════════════════════ */
const LoiDetailedView = ({ deal, onRefresh }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('valuation_offer');
  const [sortDir, setSortDir] = useState('desc');
  const [stageFilter, setStageFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [actionLoading, setActionLoading] = useState('');
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);

  const loadData = async () => {
    try {
      const res = await engagementsAPI.getLoiComparator(deal.deal_id);
      setData(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [deal.deal_id]);

  const lois = useMemo(() => {
    let items = data?.lois || [];
    if (stageFilter !== 'all') items = items.filter(l => l.stage === stageFilter);
    items.sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      return sortDir === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
    });
    return items;
  }, [data, sortField, sortDir, stageFilter]);

  const summary = data?.summary || {};
  const askingPrice = data?.deal_asking_price || 0;

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleAction = async (action, buyerId) => {
    setActionLoading(buyerId);
    try {
      if (action === 'shortlist') await engagementsAPI.shortlistBuyer(deal.deal_id, buyerId);
      if (action === 'reject') await engagementsAPI.rejectBuyer(deal.deal_id, buyerId);
      if (action === 'exclusivity') await engagementsAPI.grantExclusivity(deal.deal_id, buyerId);
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
    finally { setActionLoading(''); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;

  if (!data || lois.length === 0) {
    return (
      <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }} data-testid="loi-comparator-empty">
        <FileSignature size={28} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Sin LOIs recibidas</p>
        <p className="text-xs" style={{ color: 'var(--outline)' }}>Cuando los buyers envíen ofertas, aparecerán aquí para comparar.</p>
      </div>
    );
  }

  return (
    <div data-testid="loi-comparator">
      {/* ─── BUYER ACTIVITY PANEL ─── */}
      {selectedBuyerId && (
        <BuyerActivityPanel dealId={deal.deal_id} buyerId={selectedBuyerId} onClose={() => setSelectedBuyerId(null)} />
      )}

      {/* ─── COMPARATOR (hidden when activity panel is open) ─── */}
      {!selectedBuyerId && (
      <>
      {/* ─── SUMMARY HEADER ─── */}
      <div className="grid grid-cols-4 gap-3 mb-6" data-testid="loi-summary">
        <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--outline)' }}>LOIs RECIBIDAS</p>
          <p className="text-2xl font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{summary.count}</p>
        </div>
        <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--outline)' }}>MEJOR OFERTA</p>
          <p className="text-2xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.02em' }}>{fmtEur(summary.best_offer)}</p>
        </div>
        <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--outline)' }}>MEDIA % CASH</p>
          <p className="text-2xl font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{summary.avg_cash_pct}%</p>
        </div>
        <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--outline)' }}>MAYOR INTENCIÓN</p>
          <p className="text-sm font-bold truncate" style={{ color: 'var(--on-surface)' }}>{summary.highest_intent_buyer || '—'}</p>
        </div>
      </div>

      {/* ─── TOOLBAR ─── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold outline-none" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)', borderRadius: 0 }} data-testid="loi-stage-filter">
            <option value="all">Todos los stages</option>
            {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {['valuation_offer', 'cash_percentage', 'intent_score', 'total_time_minutes', 'submitted_at'].map(f => {
            const labels = { valuation_offer: 'Oferta', cash_percentage: '% Cash', intent_score: 'Intención', total_time_minutes: 'Actividad', submitted_at: 'Fecha' };
            const isActive = sortField === f;
            return (
              <button key={f} onClick={() => handleSort(f)}
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                style={{ background: isActive ? 'var(--on-surface)' : 'var(--surface-2)', color: isActive ? '#fff' : 'var(--outline)' }}
                data-testid={`sort-${f}`}>
                {labels[f]} {isActive && <ArrowUpDown size={9} />}
              </button>
            );
          })}
          <div className="flex ml-2" style={{ background: 'var(--surface-2)' }}>
            <button onClick={() => setViewMode('table')} className="px-2 py-1 text-[10px] font-bold"
              style={{ background: viewMode === 'table' ? 'var(--on-surface)' : 'transparent', color: viewMode === 'table' ? '#fff' : 'var(--outline)' }} data-testid="view-table">Tabla</button>
            <button onClick={() => setViewMode('cards')} className="px-2 py-1 text-[10px] font-bold"
              style={{ background: viewMode === 'cards' ? 'var(--on-surface)' : 'transparent', color: viewMode === 'cards' ? '#fff' : 'var(--outline)' }} data-testid="view-cards">Cards</button>
          </div>
        </div>
      </div>

      {/* ─── TABLE VIEW ─── */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <table className="w-full text-sm" data-testid="loi-comparison-table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
                <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>Buyer</th>
                <th className="text-right py-3 px-3 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>Oferta</th>
                <th className="text-right py-3 px-3 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>% Ask</th>
                <th className="text-center py-3 px-3 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>Estructura</th>
                <th className="text-center py-3 px-3 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>Intención</th>
                <th className="text-center py-3 px-3 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>Actividad</th>
                <th className="text-center py-3 px-3 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>Stage</th>
                <th className="text-right py-3 px-4 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lois.map(loi => {
                const stage = stageLabels[loi.stage] || stageLabels.SUBMITTED;
                const cert = certLabels[loi.buyer_certification_level] || certLabels.basic;
                const intent = intentLabels[loi.intent_level] || intentLabels.baja;
                return (
                  <tr key={loi.engagement_id} style={{ borderBottom: '1px solid var(--surface-1)' }} data-testid={`loi-row-${loi.engagement_id}`}>
                    {/* Buyer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{loi.buyer_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{loi.buyer_type}</span>
                            <Award size={9} style={{ color: cert.color }} />
                            <span className="text-[10px]" style={{ color: cert.color }}>{cert.label}</span>
                          </div>
                          {loi.flags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {loi.flags.map((f, i) => {
                                const fc = flagConfig[f.type] || {};
                                return <span key={i} className="px-1.5 py-0.5 text-[9px] font-bold" style={{ background: fc.bg, color: fc.color }}>{f.label}</span>;
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Offer */}
                    <td className="py-3 px-3 text-right">
                      <p className="text-sm font-black" style={{ color: 'var(--arroba-primary)' }}>{fmtEur(loi.valuation_offer)}</p>
                    </td>
                    {/* % vs asking */}
                    <td className="py-3 px-3 text-right">
                      <p className="text-xs font-bold" style={{ color: loi.pct_vs_asking >= 95 ? '#16a34a' : loi.pct_vs_asking >= 80 ? 'var(--on-surface)' : '#d97706' }}>{loi.pct_vs_asking}%</p>
                    </td>
                    {/* Structure */}
                    <td className="py-3 px-3 text-center">
                      <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{loi.cash_percentage}% cash</p>
                      {loi.earn_out_percentage > 0 && <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{loi.earn_out_percentage}% earn-out</p>}
                    </td>
                    {/* Intent */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: intent.color }}>
                        {intent.icon && React.createElement(intent.icon, { size: 10 })} {intent.label}
                      </span>
                    </td>
                    {/* Activity */}
                    <td className="py-3 px-3 text-center">
                      <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{loi.total_time_minutes}min</p>
                      <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{loi.dr_views} DR views</p>
                    </td>
                    {/* Stage */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold ${stage.color}`} style={{ background: stage.bg }}>
                        {stage.label}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedBuyerId(loi.buyer_id)}
                          className="px-2 py-1 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }} data-testid={`action-activity-${loi.engagement_id}`}>
                          Actividad
                        </button>
                        {loi.stage !== 'SHORTLISTED' && loi.stage !== 'EXCLUSIVITY' && loi.stage !== 'REJECTED' && (
                          <button onClick={() => handleAction('shortlist', loi.buyer_id)} disabled={actionLoading === loi.buyer_id}
                            className="px-2 py-1 text-[10px] font-bold" style={{ background: 'rgba(22,163,74,0.06)', color: '#16a34a' }} data-testid={`action-shortlist-${loi.engagement_id}`}>
                            Shortlist
                          </button>
                        )}
                        {loi.stage === 'SHORTLISTED' && (
                          <button onClick={() => handleAction('exclusivity', loi.buyer_id)} disabled={actionLoading === loi.buyer_id}
                            className="px-2 py-1 text-[10px] font-bold" style={{ background: 'rgba(79,70,229,0.06)', color: '#4f46e5' }} data-testid={`action-exclusivity-${loi.engagement_id}`}>
                            Exclusividad
                          </button>
                        )}
                        {loi.conversation_id && (
                          <Link to={`/qa/${loi.conversation_id}`} className="px-2 py-1 text-[10px] font-bold" style={{ background: 'rgba(0,100,147,0.06)', color: '#004b74' }}>
                            Q&A
                          </Link>
                        )}
                        {loi.stage !== 'REJECTED' && loi.stage !== 'EXCLUSIVITY' && (
                          <button onClick={() => handleAction('reject', loi.buyer_id)} disabled={actionLoading === loi.buyer_id}
                            className="px-2 py-1 text-[10px] font-bold" style={{ background: 'rgba(220,38,38,0.05)', color: '#dc2626' }}>
                            Rechazar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── CARDS VIEW ─── */}
      {viewMode === 'cards' && (
        <div className="grid md:grid-cols-2 gap-4" data-testid="loi-comparison-cards">
          {lois.map(loi => {
            const stage = stageLabels[loi.stage] || stageLabels.SUBMITTED;
            const cert = certLabels[loi.buyer_certification_level] || certLabels.basic;
            const intent = intentLabels[loi.intent_level] || intentLabels.baja;
            return (
              <div key={loi.engagement_id} className="p-5 transition-all duration-150 hover:-translate-y-0.5"
                style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}
                data-testid={`loi-card-${loi.engagement_id}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{loi.buyer_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{loi.buyer_type}</span>
                      <Award size={9} style={{ color: cert.color }} />
                      <span className="text-[10px]" style={{ color: cert.color }}>{cert.label}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold ${stage.color}`} style={{ background: stage.bg }}>{stage.label}</span>
                </div>

                {/* Flags */}
                {loi.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {loi.flags.map((f, i) => {
                      const fc = flagConfig[f.type] || {};
                      return <span key={i} className="px-1.5 py-0.5 text-[9px] font-bold" style={{ background: fc.bg, color: fc.color }}>{f.label}</span>;
                    })}
                  </div>
                )}

                {/* Offer */}
                <div className="grid grid-cols-3 gap-3 mb-3 pt-3" style={{ borderTop: '1px solid var(--surface-1)' }}>
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>OFERTA</p>
                    <p className="text-lg font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.02em' }}>{fmtEur(loi.valuation_offer)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>% ASK</p>
                    <p className="text-lg font-black" style={{ color: loi.pct_vs_asking >= 95 ? '#16a34a' : 'var(--on-surface)', letterSpacing: '-0.02em' }}>{loi.pct_vs_asking}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>CASH</p>
                    <p className="text-lg font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{loi.cash_percentage}%</p>
                  </div>
                </div>

                {/* Signals */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>INTENCIÓN</p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: intent.color }}>
                      {intent.icon && React.createElement(intent.icon, { size: 10 })} {intent.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>ACTIVIDAD</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{loi.total_time_minutes}min</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>DR</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{loi.dr_views} vistas</p>
                  </div>
                </div>

                {/* Conditions */}
                {loi.conditions && (
                  <div className="mb-3 pt-2" style={{ borderTop: '1px solid var(--surface-1)' }}>
                    <p className="text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--outline)' }}>CONDICIONES</p>
                    <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>{loi.conditions}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-3" style={{ borderTop: '1px solid var(--surface-1)' }}>
                  <button onClick={() => setSelectedBuyerId(loi.buyer_id)}
                    className="px-3 py-1.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>Actividad</button>
                  {loi.stage !== 'SHORTLISTED' && loi.stage !== 'EXCLUSIVITY' && loi.stage !== 'REJECTED' && (
                    <button onClick={() => handleAction('shortlist', loi.buyer_id)} disabled={actionLoading === loi.buyer_id}
                      className="px-3 py-1.5 text-[10px] font-bold" style={{ background: 'rgba(22,163,74,0.06)', color: '#16a34a' }}>Shortlist</button>
                  )}
                  {loi.stage === 'SHORTLISTED' && (
                    <button onClick={() => handleAction('exclusivity', loi.buyer_id)} disabled={actionLoading === loi.buyer_id}
                      className="px-3 py-1.5 text-[10px] font-bold" style={{ background: 'rgba(79,70,229,0.06)', color: '#4f46e5' }}>Exclusividad</button>
                  )}
                  {loi.conversation_id && (
                    <Link to={`/qa/${loi.conversation_id}`} className="px-3 py-1.5 text-[10px] font-bold" style={{ background: 'rgba(0,100,147,0.06)', color: '#004b74' }}>Q&A</Link>
                  )}
                  {loi.stage !== 'REJECTED' && loi.stage !== 'EXCLUSIVITY' && (
                    <button onClick={() => handleAction('reject', loi.buyer_id)} disabled={actionLoading === loi.buyer_id}
                      className="px-3 py-1.5 text-[10px] font-bold ml-auto" style={{ background: 'rgba(220,38,38,0.05)', color: '#dc2626' }}>Rechazar</button>
                  )}
                </div>

                <p className="text-[10px] mt-2" style={{ color: 'var(--outline)' }}>Enviada el {fmtDate(loi.submitted_at)}</p>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default LoiDetailedView;
