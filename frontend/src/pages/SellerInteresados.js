import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SellerShell from '../components/layout/SellerShell';
import { coachingAPI } from '../services/api';
import {
  Loader2, Users, ArrowRight, AlertTriangle, TrendingUp,
  FileText, ChevronRight, Zap, Eye, MessageSquare
} from 'lucide-react';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const mins = Math.floor((now - d) / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return `hace ${Math.floor(days / 7)}sem`;
};

const stageLabel = (stage) => ({ SUBMITTED: 'Nuevo', VIEWED: 'Visto', ACCEPTED: 'Aceptado', SHORTLISTED: 'Shortlist', EXCLUSIVITY: 'Exclusividad', REJECTED: 'Descartado' }[stage] || stage);

const SellerInteresados = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    coachingAPI.getSellerInteresados().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <SellerShell title="Interesados" subtitle="CENTRO DE DECISIÓN">
      <div className="flex items-center justify-center py-16"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>
    </SellerShell>
  );

  const { buyers = [], nudges = [], summary = {}, deals_count = 0 } = data || {};

  return (
    <SellerShell
      title="Interesados"
      subtitle="CENTRO DE DECISIÓN"
    >
      <div data-testid="seller-interesados-page">
        <p className="text-sm mb-6" style={{ color: 'var(--outline)' }}>
          Todos los buyers de {deals_count} deal{deals_count !== 1 ? 's' : ''} activo{deals_count !== 1 ? 's' : ''}
        </p>

        {/* KPIs */}
        {buyers.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6" data-testid="summary-cards">
            {[
              { label: 'TOTAL BUYERS', valor: summary.total, icon: Users },
              { label: summary.lois === 1 ? 'LOI RECIBIDA' : 'LOIS RECIBIDAS', valor: summary.lois || 0, icon: FileText },
              { label: 'ALTA INTENCIÓN', valor: summary.high_intent, icon: TrendingUp },
              { label: 'REQUIEREN ACCIÓN', valor: summary.needs_action, icon: Zap, color: 'var(--arroba-primary)' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
                  <div className="flex items-center gap-1.5 mb-2"><Icon size={11} style={{ color: 'var(--outline)' }} /><p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>{kpi.label}</p></div>
                  <p className="text-lg font-black" style={{ color: kpi.color || 'var(--on-surface)', letterSpacing: '-0.02em' }}>{kpi.valor}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Nudges */}
        {nudges.length > 0 && (
          <div className="space-y-2 mb-6" data-testid="interesados-nudges">
            {nudges.slice(0, 3).map((n, i) => (
              <Link key={i} to={n.deal_id ? `/seller/deal/${n.deal_id}` : '#'}
                className="block p-4 flex items-start gap-3 transition-all duration-150 hover:-translate-y-0.5"
                style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)', borderLeft: `3px solid ${n.priority === 'ALTA' ? '#dc2626' : '#d97706'}` }}>
                <AlertTriangle size={14} style={{ color: n.priority === 'ALTA' ? '#dc2626' : '#d97706' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--outline)' }}>{n.message}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Tabla buyers */}
        {buyers.length === 0 ? (
          <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }} data-testid="interesados-empty">
            <Users size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
            <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Aún no tienes interesados</p>
            <p className="text-xs" style={{ color: 'var(--outline)' }}>Publica un deal para empezar a recibir interés.</p>
          </div>
        ) : (
          <div style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="interesados-table">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
                  <th className="text-left py-3 px-4 label-arroba" style={{ color: 'var(--outline)' }}>BUYER</th>
                  <th className="text-left py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>DEAL</th>
                  <th className="text-center py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>TIPO / ESTADO</th>
                  <th className="text-center py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>INTENCIÓN</th>
                  <th className="text-right py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>LOI</th>
                  <th className="text-left py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>QUÉ HACER</th>
                  <th className="text-right py-3 px-4 label-arroba" style={{ color: 'var(--outline)' }}>ACTIVIDAD</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b, i) => {
                  const action = b.action || {};
                  const urgColor = action.urgency === 'alta' ? '#dc2626' : action.urgency === 'media' ? '#d97706' : 'var(--outline-variant)';
                  const intentColor = b.intent_score >= 55 ? '#16a34a' : b.intent_score >= 25 ? '#d97706' : 'var(--outline)';
                  return (
                    <tr key={b.engagement_id || i} style={{ borderBottom: '1px solid var(--surface-1)' }} data-testid={`buyer-row-${i}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: urgColor }} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{b.buyer_name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{b.buyer_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Link to={`/seller/deal/${b.deal_id}`} className="text-xs" style={{ color: 'var(--outline)' }}>{b.deal_title}</Link>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: b.type === 'LOI' ? 'rgba(182,33,42,0.06)' : 'var(--surface-1)', color: b.type === 'LOI' ? 'var(--arroba-primary)' : 'var(--on-surface)' }}>{b.type}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>{stageLabel(b.stage)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-12 h-1.5" style={{ background: 'var(--surface-2)' }}>
                            <div className="h-full" style={{ background: intentColor, width: `${Math.max(b.intent_score, 4)}%` }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: intentColor }}>{b.intent_score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm font-bold" style={{ color: 'var(--arroba-primary)' }}>{b.valuation_offer ? `${(b.valuation_offer/1e6).toFixed(1).replace('.',',')}M` : '—'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-xs" style={{ color: 'var(--on-surface)' }}>{action.label || '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{timeAgo(b.last_activity)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--surface-1)' }}>
              <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{buyers.length} interesado{buyers.length !== 1 ? 's' : ''} en {deals_count} deal{deals_count !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--outline)' }}>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#dc2626' }} /> Acción urgente</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#d97706' }} /> Seguimiento</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--outline-variant)' }} /> Monitorizar</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerShell>
  );
};

export default SellerInteresados;
