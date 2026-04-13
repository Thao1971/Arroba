import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SellerShell from '../components/layout/SellerShell';
import { useAuth } from '../context/AuthContext';
import { companiesAPI, dealsAPI, coachingAPI, conversationsAPI } from '../services/api';
import {
  Plus, Building2, FileText, Users, TrendingUp, ArrowRight, Eye,
  MessageSquare, FileSignature, CheckCircle2, AlertCircle, AlertTriangle,
  Info, Clock, Star
} from 'lucide-react';

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nudges, setNudges] = useState([]);
  const [pendingData, setPendingData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, dealsRes] = await Promise.all([companiesAPI.list(), dealsAPI.list()]);
        setCompanies(companiesRes.data);
        setDeals(dealsRes.data);
        try {
          const [nudgesRes, pendingRes] = await Promise.all([coachingAPI.getSellerNudges(), conversationsAPI.getPending()]);
          setNudges(nudgesRes.data?.nudges || []);
          setPendingData(pendingRes.data);
        } catch {}
      } catch (error) {  }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const hasCompany = companies.length > 0;
  const activeDeal = deals.find(d => !['closed', 'dropped'].includes(d.status));
  const getStatusLabel = (s) => ({ draft: 'BORRADOR', published: 'PUBLICADO', exclusivity: 'EXCLUSIVIDAD', closed: 'CERRADO', dropped: 'CANCELADO' }[s] || s);

  if (loading) return (
    <SellerShell title={`Hola, ${user?.first_name || 'Vendedor'}`} subtitle="DASHBOARD">
      <div className="flex items-center justify-center py-16"><div className="w-6 h-6 animate-spin" style={{ border: '2px solid var(--surface-2)', borderTopColor: 'var(--arroba-primary)', borderRadius: '50%' }} /></div>
    </SellerShell>
  );

  return (
    <SellerShell
      title={`Hola, ${user?.first_name || 'Vendedor'}`}
      subtitle="DASHBOARD"
    >
      <div data-testid="seller-dashboard">

        {/* Acciones pendientes Q&A */}
        {pendingData && pendingData.total_pending > 0 && (
          <div className="mb-6 p-5 flex items-center justify-between gap-4" style={{ background: 'rgba(182,33,42,0.04)', borderLeft: '3px solid var(--arroba-primary)' }} data-testid="pending-actions-block">
            <div className="flex items-center gap-4">
              <MessageSquare size={20} style={{ color: 'var(--arroba-primary)' }} />
              <div>
                <p className="label-arroba mb-0.5" style={{ color: 'var(--arroba-primary)' }}>ACCIONES PENDIENTES</p>
                <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>
                  {pendingData.total_pending} pregunta{pendingData.total_pending !== 1 ? 's' : ''} pendiente{pendingData.total_pending !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {pendingData.most_urgent && (
              <Link to={`/qa/${pendingData.most_urgent.conversation_id}`}>
                <button className="px-5 py-2 text-xs font-bold flex items-center gap-2" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>RESPONDER AHORA <ArrowRight size={12} /></button>
              </Link>
            )}
          </div>
        )}

        {/* Nudges */}
        {nudges.length > 0 && (
          <div className="mb-6 space-y-2" data-testid="seller-nudges">
            {nudges.slice(0, 3).map((nudge, i) => (
              <div key={i} onClick={() => nudge.deal_id && navigate(`/seller/deal/${nudge.deal_id}`)}
                className="p-4 flex items-start gap-3 cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                style={{
                  background: 'var(--surface-lowest)',
                  boxShadow: '0 2px 8px rgba(25,28,30,0.04)',
                  borderLeft: `3px solid ${nudge.priority === 'ALTA' ? '#dc2626' : nudge.priority === 'MEDIA' ? '#d97706' : 'var(--outline)'}`,
                }}>
                <AlertTriangle size={14} style={{ color: nudge.priority === 'ALTA' ? '#dc2626' : '#d97706' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{nudge.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--outline)' }}>{nudge.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content + Rail */}
        <div className="flex gap-8">
          <div className="flex-1 min-w-0 space-y-5">

            {/* Onboarding */}
            {!hasCompany && (
              <div className="p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="onboarding-steps">
                <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>PASOS PARA PUBLICAR</p>
                {['Crea tu compañía', 'Añade datos financieros', 'Genera el infomemo con IA', 'Activa y publica tu deal'].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-7 h-7 flex items-center justify-center shrink-0" style={{ background: i === 0 ? 'rgba(182,33,42,0.08)' : 'var(--surface-2)' }}>
                      <span className="text-xs font-bold" style={{ color: i === 0 ? 'var(--arroba-primary)' : 'var(--outline)' }}>{i + 1}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: i === 0 ? 'var(--on-surface)' : 'var(--outline)' }}>{step}</span>
                  </div>
                ))}
                <Link to="/seller/onboarding" className="mt-4 block">
                  <button className="px-6 py-3 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="start-onboarding-btn">EMPEZAR AHORA</button>
                </Link>
              </div>
            )}

            {/* Compañía */}
            {hasCompany && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="company-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'rgba(182,33,42,0.08)' }}>
                      <Building2 size={18} style={{ color: 'var(--arroba-primary)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{companies[0]?.trade_name || companies[0]?.legal_name}</p>
                      <p className="text-xs" style={{ color: 'var(--outline)' }}>{companies[0]?.acronym}</p>
                    </div>
                  </div>
                  <Link to={`/seller/company/${companies[0]?.company_id}`} className="text-xs font-bold" style={{ color: 'var(--arroba-primary)' }}>Editar</Link>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-3" style={{ borderTop: '1px solid var(--surface-1)' }}>
                  <div><p className="label-arroba" style={{ color: 'var(--outline)' }}>FACTURACIÓN</p><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{companies[0]?.financials?.[0]?.revenue ? `${(companies[0].financials[0].revenue / 1e6).toFixed(1).replace('.',',')}M €` : '—'}</p></div>
                  <div><p className="label-arroba" style={{ color: 'var(--outline)' }}>EBITDA</p><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{companies[0]?.financials?.[0]?.ebitda ? `${(companies[0].financials[0].ebitda / 1e3).toFixed(0)}k €` : '—'}</p></div>
                  <div><p className="label-arroba" style={{ color: 'var(--outline)' }}>VALORACIÓN</p><p className="text-sm font-bold" style={{ color: 'var(--arroba-primary)' }}>{companies[0]?.valuation?.valuation_min ? `${(companies[0].valuation.valuation_min / 1e6).toFixed(1).replace('.',',')}-${(companies[0].valuation.valuation_max / 1e6).toFixed(1).replace('.',',')}M €` : '—'}</p></div>
                </div>
              </div>
            )}

            {/* Deal activo */}
            {activeDeal && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="deal-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Tu deal</p>
                    <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>{getStatusLabel(activeDeal.status)}</span>
                  </div>
                  <Link to={`/seller/deal/${activeDeal.deal_id}`} className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}>GESTIONAR <ArrowRight size={10} /></Link>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'VISTAS', val: activeDeal.metrics?.teaser_views || 0, icon: Eye },
                    { label: 'NDAs', val: activeDeal.metrics?.ndas_signed_count || 0, icon: FileSignature },
                    { label: 'LOIs', val: (activeDeal.metrics?.lois_received_count || 0) === 1 ? 'LOI recibida' : `${activeDeal.metrics?.lois_received_count || 0} LOIs recibidas`, icon: FileText },
                    { label: 'INTERESES', val: activeDeal.metrics?.interests_count || 0, icon: Star },
                  ].map((m, i) => (
                    <div key={i} className="p-3" style={{ background: 'var(--surface-1)' }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--outline)' }}>{m.label}</p>
                      <p className="text-lg font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rail derecho */}
          <div className="w-[260px] shrink-0 space-y-5">
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>SOPORTE</p>
              <p className="text-xs mb-2" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>¿Necesitas ayuda con tu proceso de venta?</p>
              <a href="mailto:equipo@arroba.es" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}>Contactar equipo <ArrowRight size={10} /></a>
            </div>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>TU PLAN</p>
              <p className="text-sm font-bold mb-2" style={{ color: 'var(--on-surface)' }}>Seller Free</p>
              <Link to="/planes?role=seller&source=seller_dashboard">
                <button className="w-full py-2 text-[10px] font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>VER PLANES</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SellerShell>
  );
};

export default SellerDashboard;
