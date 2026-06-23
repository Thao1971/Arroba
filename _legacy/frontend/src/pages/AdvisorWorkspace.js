import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { fmtMillions } from '../utils/formatES';
import {
  Loader2, AlertTriangle, FileText, Users, Shield, Clock, Check,
  BarChart3, ArrowRight, Briefcase, Target
} from 'lucide-react';

const AdvisorWorkspace = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/deal-process/advisor/dashboard').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 size={18} className="animate-spin" /></div></Layout>;

  return (
    <Layout showFooter={false}>
      <div className="max-w-6xl mx-auto px-6 py-8" data-testid="advisor-workspace">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>ADVISOR WORKSPACE</p>
            <h1 className="text-2xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Panel de mandatos</h1>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <span style={{ color: 'var(--on-surface)' }}>{data?.total_deals || 0} deals activos</span>
            <span style={{ color: data?.total_pending > 0 ? '#d97706' : '#16a34a' }}>{data?.total_pending || 0} decisiones pendientes</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main: deals */}
          <div className="lg:col-span-2 space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>MANDATOS</p>
                <p className="text-2xl font-black" style={{ color: 'var(--on-surface)' }}>{data?.total_deals || 0}</p>
              </div>
              <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="text-[9px] font-bold" style={{ color: '#d97706' }}>PENDIENTES</p>
                <p className="text-2xl font-black" style={{ color: '#d97706' }}>{data?.total_pending || 0}</p>
              </div>
              <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>DD ACTIVAS</p>
                <p className="text-2xl font-black">{(data?.deals || []).filter(d => d.dd_status === 'en_curso' || d.dd_status === 'bloqueada').length}</p>
              </div>
              <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>EN CIERRE</p>
                <p className="text-2xl font-black">{(data?.deals || []).filter(d => d.closing_status).length}</p>
              </div>
            </div>

            {/* Deals list */}
            <div>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>DEALS EN CURSO</p>
              {(data?.deals || []).map(d => (
                <div key={d.deal_id} className="p-4 mb-3" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: d.status === 'exclusivity' ? 'rgba(217,119,6,0.08)' : 'rgba(22,163,74,0.06)', color: d.status === 'exclusivity' ? '#d97706' : '#16a34a' }}>{d.status?.toUpperCase()}</span>
                        {d.pending_decisions > 0 && <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'rgba(217,119,6,0.08)', color: '#d97706' }}>{d.pending_decisions} PENDIENTE{d.pending_decisions > 1 ? 'S' : ''}</span>}
                        {d.dd_status === 'bloqueada' && <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626' }}>DD BLOQUEADA</span>}
                      </div>
                      <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{d.title}</p>
                      <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{d.seller} · {d.process_count} proceso{d.process_count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      {d.asking_price && <p className="text-sm font-black" style={{ color: 'var(--arroba-primary)' }}>{fmtMillions(d.asking_price)}</p>}
                      {d.dd_completion != null && <p className="text-[9px]" style={{ color: 'var(--outline)' }}>DD: {d.dd_completion}%</p>}
                      {d.closing_target && <p className="text-[9px]" style={{ color: '#16a34a' }}>Cierre: {new Date(d.closing_target).toLocaleDateString('es-ES')}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Link to={`/seller/deals/${d.deal_id}/negociacion`} className="px-3 py-1.5 text-[9px] font-bold flex items-center gap-1" style={{ background: 'var(--on-surface)', color: '#fff' }}>
                      Negociación <ArrowRight size={9} />
                    </Link>
                    {d.dd_status && (
                      <Link to={`/seller/deals/${d.deal_id}/duediligence`} className="px-3 py-1.5 text-[9px] font-bold" style={{ background: 'var(--surface-2)' }}>Due Diligence</Link>
                    )}
                    <Link to={`/seller/deals/${d.deal_id}/resumen`} className="px-3 py-1.5 text-[9px] font-bold" style={{ background: 'var(--surface-2)' }}>Resumen</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: alerts */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Critical alerts */}
              <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: data?.critical_alerts?.length > 0 ? '#dc2626' : 'var(--outline)' }}>
                  ALERTAS CRÍTICAS ({data?.critical_alerts?.length || 0})
                </p>
                {data?.critical_alerts?.length > 0 ? (
                  <div className="space-y-2">
                    {data.critical_alerts.map((a, i) => (
                      <Link key={i} to={`/seller/deals/${a.deal_id}/negociacion`} className="flex items-start gap-2 p-2 transition-all hover:translate-x-0.5" style={{ background: a.type === 'dd_blocked' ? 'rgba(220,38,38,0.04)' : a.type === 'loi_pending' ? 'rgba(217,119,6,0.04)' : 'rgba(22,163,74,0.04)' }}>
                        <AlertTriangle size={10} className="shrink-0 mt-0.5" style={{ color: a.type === 'dd_blocked' ? '#dc2626' : '#d97706' }} />
                        <div>
                          <p className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{a.title}</p>
                          <p className="text-[9px]" style={{ color: 'var(--outline)' }}>{a.message}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Check size={16} className="mx-auto mb-1" style={{ color: '#16a34a' }} />
                    <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Sin alertas críticas</p>
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>RESUMEN RÁPIDO</p>
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between"><span style={{ color: 'var(--outline)' }}>Deals publicados</span><span className="font-bold">{(data?.deals || []).filter(d => d.status === 'published').length}</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--outline)' }}>En exclusividad</span><span className="font-bold">{(data?.deals || []).filter(d => d.status === 'exclusivity').length}</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--outline)' }}>DD en curso</span><span className="font-bold">{(data?.deals || []).filter(d => d.dd_status === 'en_curso').length}</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--outline)' }}>Cierres previstos</span><span className="font-bold">{(data?.deals || []).filter(d => d.closing_status).length}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdvisorWorkspace;
