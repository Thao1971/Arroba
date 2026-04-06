
import { fmtMillions } from '../utils/formatES';
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companiesAPI, dealsAPI, coachingAPI, conversationsAPI, engagementsAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DataRoomSellerTab from '../components/DataRoomSellerTab';
import LoiDetailedView from '../components/LoiDetailedView';
import {
  BarChart3, Building2, FileText, Users, TrendingUp, ArrowRight, Eye,
  MessageSquare, FileSignature, CheckCircle2, AlertCircle, AlertTriangle,
  Plus, Search, Loader2, Star, FolderOpen, ChevronRight, Clock, Zap,
  Bell, Settings, ChevronDown, ArrowLeft, Shield, Lock
} from 'lucide-react';

/* ─── General nav items ─── */
const GENERAL_NAV = [
  { id: 'inicio', path: '/seller', label: 'Inicio', icon: BarChart3 },
  { id: 'interesados', path: '/seller/interesados', label: 'Interesados', icon: Users },
  { id: 'explorar', path: '/explorar', label: 'Listado de agencias', icon: Search },
];

/* ─── Deal sub-navigation ─── */
const DEAL_SECTIONS = [
  { id: 'resumen', label: 'Resumen', icon: Eye },
  { id: 'interesados', label: 'Interesados', icon: Users },
  { id: 'lois', label: 'LOIs', icon: FileSignature },
  { id: 'qa', label: 'Q&A', icon: MessageSquare },
  { id: 'dataroom', label: 'Data Room', icon: FolderOpen },
  { id: 'infomemo', label: 'Infomemo', icon: FileText },
];

const stageLabel = (s) => ({ SUBMITTED: 'Nuevo', VIEWED: 'Visto', ACCEPTED: 'Aceptado', SHORTLISTED: 'Shortlist', EXCLUSIVITY: 'Exclusividad', REJECTED: 'Descartado' }[s] || s);
const statusLabel = (s) => ({ draft: 'BORRADOR', published: 'PUBLICADO', exclusivity: 'EXCLUSIVIDAD', closed: 'CERRADO', dropped: 'CANCELADO' }[s] || s);
const timeAgo = (d) => { if (!d) return ''; const mins = Math.floor((new Date() - new Date(d)) / 60000); if (mins < 60) return `hace ${mins}m`; const h = Math.floor(mins/60); if (h < 24) return `hace ${h}h`; const days = Math.floor(h/24); if (days < 7) return `hace ${days}d`; return `hace ${Math.floor(days/7)}sem`; };
const intentBar = (score) => { const color = score >= 55 ? '#16a34a' : score >= 25 ? '#d97706' : 'var(--outline)'; return (<div className="flex items-center gap-2"><div className="w-12 h-1.5" style={{ background: 'var(--surface-2)' }}><div className="h-full" style={{ background: color, width: `${Math.max(score, 4)}%` }} /></div><span className="text-xs font-bold" style={{ color }}>{score}</span></div>); };

/* ═══════════════════════════════════════════
   SELLER WORKSPACE — Unified Shell
   ═══════════════════════════════════════════ */
const SellerWorkspace = () => {
  const { dealId, section } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // State
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [deal, setDeal] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nudges, setNudges] = useState([]);
  const [pendingData, setPendingData] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [health, setHealth] = useState(null);
  const [totalPendingQA, setTotalPendingQA] = useState(0);
  const [interesadosData, setInteresadosData] = useState(null);
  const [engData, setEngData] = useState(null);
  const [qaConversations, setQaConversations] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Determine current view
  const isDealView = !!dealId;
  const currentSection = section || (searchParams.get('tab') === 'lois' ? 'lois' : 'resumen');
  const isInteresadosGlobal = location.pathname === '/seller/interesados' && !dealId;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [compRes, dealsRes] = await Promise.all([companiesAPI.list(), dealsAPI.list()]);
        setCompanies(compRes.data);
        setDeals(dealsRes.data);
        try {
          const [nRes, pRes] = await Promise.all([coachingAPI.getSellerNudges(), conversationsAPI.getPending()]);
          setNudges(nRes.data?.nudges || []);
          setPendingData(pRes.data);
        } catch {}
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Load deal-specific data when dealId changes
  useEffect(() => {
    if (!dealId) { setDeal(null); setCompany(null); return; }
    const loadDeal = async () => {
      try {
        const res = await dealsAPI.get(dealId);
        setDeal(res.data);
        if (res.data.company_id) {
          const c = await companiesAPI.get(res.data.company_id);
          setCompany(c.data);
        }
        try { const r = await dealsAPI.getReadiness(dealId); setReadiness(r.data.readiness); } catch {}
        try { const h = await dealsAPI.getHealth(dealId); setHealth(h.data); } catch {}
      } catch {}
    };
    loadDeal();
  }, [dealId]);

  // Load section-specific data
  useEffect(() => {
    if (!dealId) return;
    if (currentSection === 'interesados' && dealId) {
      engagementsAPI.listDealEngagements(dealId).then(r => setEngData(r.data)).catch(() => {});
    }
    if (currentSection === 'qa' && dealId) {
      conversationsAPI.getForDeal(dealId).then(r => setQaConversations(r.data?.conversations || r.data || [])).catch(() => {});
    }
  }, [dealId, currentSection]);

  // Load global interesados
  useEffect(() => {
    if (isInteresadosGlobal) {
      coachingAPI.getSellerInteresados().then(r => setInteresadosData(r.data)).catch(() => {});
    }
  }, [isInteresadosGlobal]);

  const activeDeal = deals.find(d => !['closed', 'dropped'].includes(d.status));
  const hasCompany = companies.length > 0;
  const isActive = (path) => location.pathname === path;

  const handleActivate = async () => {
    if (!dealId) return;
    setActionLoading(true);
    try { await dealsAPI.activate(dealId); const r = await dealsAPI.get(dealId); setDeal(r.data); } catch {}
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
      <Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="seller-workspace">

      {/* ─── SIDEBAR ─── */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40 overflow-y-auto" style={{ background: 'var(--surface-1)', paddingTop: 80 }}>

        {/* BLOQUE 1: Identidad */}
        <div className="px-6 mb-5">
          <Link to="/" className="text-2xl font-black tracking-tight block mb-3" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</Link>
          <p className="label-arroba" style={{ color: 'var(--outline)' }}>PANEL DE VENDEDOR</p>
          <p className="text-xs font-bold mt-1" style={{ color: 'var(--on-surface)' }}>{user?.first_name} {user?.last_name}</p>
        </div>

        {/* BLOQUE 2: Navegación general */}
        <nav className="px-3 space-y-0.5 mb-4">
          {GENERAL_NAV.map(n => {
            const Icon = n.icon;
            const active = isActive(n.path) || (n.id === 'inicio' && location.pathname === '/seller/deals');
            return (
              <Link key={n.id} to={n.path}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all"
                style={{
                  color: active ? 'var(--arroba-primary)' : 'var(--on-surface-variant)',
                  background: active ? 'var(--surface-lowest)' : 'transparent',
                  boxShadow: active ? '0px 4px 12px rgba(26,28,28,0.06)' : 'none',
                  textDecoration: 'none',
                }}
                data-testid={`nav-${n.id}`}>
                <Icon size={14} /> {n.label}
              </Link>
            );
          })}
        </nav>

        {/* BLOQUE 3: Operación activa */}
        {(isDealView ? deal : activeDeal) && (
          <div className="px-3 mb-4">
            <div className="px-4 py-3" style={{ background: 'var(--surface-2)' }}>
              <p className="label-arroba mb-1" style={{ color: 'var(--outline)', fontSize: 8 }}>OPERACIÓN ACTIVA</p>
              <p className="text-xs font-bold truncate" style={{ color: 'var(--on-surface)' }}>
                {isDealView ? (company?.trade_name || company?.legal_name || 'Deal') : (companies[0]?.trade_name || 'Deal')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold" style={{ color: 'var(--on-surface)' }}>
                  {statusLabel((isDealView ? deal : activeDeal)?.status)}
                </span>
                {health && health.health !== 'INACTIVO' && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold" style={{ color: health.health === 'VERDE' ? '#16a34a' : health.health === 'AMARILLO' ? '#d97706' : '#dc2626' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: health.health === 'VERDE' ? '#16a34a' : health.health === 'AMARILLO' ? '#d97706' : '#dc2626' }} />
                    {health.health === 'VERDE' ? 'SANO' : health.health}
                  </span>
                )}
              </div>
            </div>

            {/* Deal sub-navigation */}
            <nav className="mt-1 space-y-0.5">
              {DEAL_SECTIONS.map(s => {
                const Icon = s.icon;
                const dealIdToUse = dealId || activeDeal?.deal_id;
                const active = isDealView && currentSection === s.id;
                return (
                  <Link key={s.id} to={`/seller/deals/${dealIdToUse}/${s.id}`}
                    className="flex items-center gap-2.5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all"
                    style={{
                      color: active ? 'var(--arroba-primary)' : 'var(--outline)',
                      background: active ? 'var(--surface-lowest)' : 'transparent',
                      textDecoration: 'none',
                    }}
                    data-testid={`deal-nav-${s.id}`}>
                    <Icon size={12} /> {s.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* BLOQUE 4: CTAs fijos */}
        <div className="mt-auto px-4 pb-6 space-y-2">
          <Link to="/seller/onboarding">
            <button className="w-full py-2.5 text-[11px] font-bold flex items-center justify-center gap-2" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
              <Plus size={11} /> NUEVA COMPAÑÍA
            </button>
          </Link>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main className="ml-60 min-h-screen" style={{ paddingTop: 32 }}>
        <div className="max-w-[1100px] mx-auto px-8 pb-16">

          {/* ═══ INICIO (Dashboard general) ═══ */}
          {!isDealView && !isInteresadosGlobal && (
            <InicioDashboard
              user={user}
              companies={companies}
              deals={deals}
              activeDeal={activeDeal}
              hasCompany={hasCompany}
              nudges={nudges}
              pendingData={pendingData}
              navigate={navigate}
            />
          )}

          {/* ═══ INTERESADOS GLOBAL ═══ */}
          {isInteresadosGlobal && (
            <InteresadosGlobal data={interesadosData} />
          )}

          {/* ═══ DEAL VIEW ═══ */}
          {isDealView && deal && (
            <DealView
              deal={deal}
              company={company}
              section={currentSection}
              readiness={readiness}
              health={health}
              engData={engData}
              qaConversations={qaConversations}
              onActivate={handleActivate}
              actionLoading={actionLoading}
              onRefresh={async () => { const r = await dealsAPI.get(dealId); setDeal(r.data); }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

/* ── INICIO DASHBOARD ── */
const InicioDashboard = ({ user, companies, deals, activeDeal, hasCompany, nudges, pendingData, navigate }) => {
  const activeDeals = deals.filter(d => ['published', 'shortlist', 'exclusivity', 'nda', 'evaluation'].includes(d.status));
  const activeCompanyIds = new Set(activeDeals.map(d => d.company_id));
  const activeCount = activeCompanyIds.size;
  // Plan limit
  const sub = user?.subscription?.plan_type || '';
  const limit = sub.includes('premium') ? null : 1;
  const limitLabel = limit === null ? 'Ilimitadas' : `${activeCount} de ${limit}`;

  return (
  <>
    <div className="mb-8">
      <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>INICIO</p>
      <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>Hola, {user?.first_name || 'Vendedor'}</h1>
      <p className="text-sm mt-1" style={{ color: 'var(--outline)' }}>Gestiona tus compañías y procesos de venta</p>
    </div>

    {pendingData?.total_pending > 0 && (
      <div className="mb-6 p-5 flex items-center justify-between gap-4" style={{ background: 'rgba(182,33,42,0.04)', borderLeft: '3px solid var(--arroba-primary)' }}>
        <div className="flex items-center gap-4">
          <MessageSquare size={20} style={{ color: 'var(--arroba-primary)' }} />
          <div>
            <p className="label-arroba mb-0.5" style={{ color: 'var(--arroba-primary)' }}>ACCIONES PENDIENTES</p>
            <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{pendingData.total_pending} pregunta{pendingData.total_pending !== 1 ? 's' : ''} pendiente{pendingData.total_pending !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {pendingData.most_urgent && (
          <Link to={`/qa/${pendingData.most_urgent.conversation_id}`}>
            <button className="px-5 py-2 text-xs font-bold flex items-center gap-2" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>RESPONDER AHORA <ArrowRight size={12} /></button>
          </Link>
        )}
      </div>
    )}

    {nudges.length > 0 && (
      <div className="mb-6 space-y-2">
        {nudges.slice(0, 3).map((n, i) => (
          <div key={i} onClick={() => n.deal_id && navigate(`/seller/deals/${n.deal_id}/resumen`)}
            className="p-4 flex items-start gap-3 cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
            style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)', borderLeft: `3px solid ${n.priority === 'ALTA' ? '#dc2626' : '#d97706'}` }}>
            <AlertTriangle size={14} style={{ color: n.priority === 'ALTA' ? '#dc2626' : '#d97706' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{n.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--outline)' }}>{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    )}

    <div className="flex gap-8">
      <div className="flex-1 min-w-0 space-y-5">
        {!hasCompany && (
          <div className="p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
            <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>PASOS PARA PUBLICAR</p>
            {['Crea tu compañía', 'Añade datos financieros', 'Genera el infomemo con IA', 'Activa y publica tu deal'].map((step, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-7 h-7 flex items-center justify-center shrink-0" style={{ background: i === 0 ? 'rgba(182,33,42,0.08)' : 'var(--surface-2)' }}>
                  <span className="text-xs font-bold" style={{ color: i === 0 ? 'var(--arroba-primary)' : 'var(--outline)' }}>{i + 1}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: i === 0 ? 'var(--on-surface)' : 'var(--outline)' }}>{step}</span>
              </div>
            ))}
            <Link to="/seller/onboarding"><button className="mt-4 px-6 py-3 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>EMPEZAR AHORA</button></Link>
          </div>
        )}
        {hasCompany && (
          <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="label-arroba" style={{ color: 'var(--outline)' }}>MIS COMPAÑÍAS</p>
              <span className="text-[10px] font-bold" style={{ color: limit !== null && activeCount >= limit ? 'var(--arroba-primary)' : 'var(--outline)' }}>
                {limitLabel} compañía{limit !== 1 ? 's' : ''} activa{limit !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {companies.map(comp => {
                const compDeal = deals.find(d => d.company_id === comp.company_id);
                const isActive = compDeal && ['published', 'shortlist', 'exclusivity', 'nda', 'evaluation'].includes(compDeal.status);
                return (
                  <div key={comp.company_id} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--surface-1)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center" style={{ background: isActive ? 'rgba(22,163,74,0.06)' : 'var(--surface-2)' }}>
                        <Building2 size={14} style={{ color: isActive ? '#16a34a' : 'var(--outline)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{comp.trade_name || comp.legal_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold" style={{ color: isActive ? '#16a34a' : 'var(--outline)' }}>{isActive ? 'ACTIVA' : compDeal ? statusLabel(compDeal.status).toUpperCase() : 'SIN DEAL'}</span>
                          {comp.financials?.[0]?.revenue && <span className="text-[10px]" style={{ color: 'var(--outline)' }}>· {fmtMillions(comp.financials[0].revenue)}</span>}
                        </div>
                      </div>
                    </div>
                    <Link to={compDeal ? `/seller/deals/${compDeal.deal_id}/resumen` : `/seller/company/${comp.company_id}`} className="text-xs font-bold" style={{ color: 'var(--arroba-primary)' }}>
                      {compDeal ? 'Gestionar' : 'Editar'}
                    </Link>
                  </div>
                );
              })}
            </div>
            {limit !== null && activeCount >= limit && (
              <div className="mt-3 p-3 flex items-center justify-between gap-3" style={{ background: 'rgba(182,33,42,0.03)' }}>
                <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Para activar más compañías, actualiza a <b style={{ color: 'var(--arroba-primary)' }}>Seller Premium</b></p>
                <Link to="/planes?role=seller" className="text-[10px] font-bold shrink-0" style={{ color: 'var(--arroba-primary)' }}>VER PLANES</Link>
              </div>
            )}
          </div>
        )}
        {activeDeal && (
          <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Tu operación</p><span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>{statusLabel(activeDeal.status)}</span></div>
              <Link to={`/seller/deals/${activeDeal.deal_id}/resumen`} className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}>GESTIONAR <ArrowRight size={10} /></Link>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'VISTAS', val: activeDeal.metrics?.teaser_views || 0 },
                { label: 'NDAs', val: activeDeal.metrics?.ndas_signed_count || 0 },
                { label: 'LOIs', val: (activeDeal.metrics?.lois_received_count || 0) === 1 ? 'LOI recibida' : `${activeDeal.metrics?.lois_received_count || 0}` },
                { label: 'INTERESES', val: activeDeal.metrics?.interests_count || 0 },
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
      <div className="w-[260px] shrink-0 space-y-5">
        <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>SOPORTE</p>
          <p className="text-xs mb-2" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>¿Necesitas ayuda con tu proceso de venta?</p>
          <a href="mailto:equipo@arroba.es" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}>Contactar equipo <ArrowRight size={10} /></a>
        </div>
        <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>TU PLAN</p>
          <p className="text-sm font-bold mb-2" style={{ color: 'var(--on-surface)' }}>Seller Free</p>
          <Link to="/planes?role=seller"><button className="w-full py-2 text-[10px] font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>VER PLANES</button></Link>
        </div>
      </div>
    </div>
  </>
  );
};

/* ── INTERESADOS GLOBAL ── */
const InteresadosGlobal = ({ data }) => {
  if (!data) return <div className="flex justify-center py-16"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;
  const { buyers = [], nudges = [], summary = {}, deals_count = 0 } = data;
  return (
    <>
      <div className="mb-8"><p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>CENTRO DE DECISIÓN</p><h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>Interesados</h1><p className="text-sm mt-1" style={{ color: 'var(--outline)' }}>Todos los buyers de {deals_count} deal{deals_count !== 1 ? 's' : ''} activo{deals_count !== 1 ? 's' : ''}</p></div>
      {buyers.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[{ label: 'TOTAL BUYERS', val: summary.total }, { label: summary.lois === 1 ? 'LOI RECIBIDA' : 'LOIS RECIBIDAS', val: summary.lois || 0 }, { label: 'ALTA INTENCIÓN', val: summary.high_intent }, { label: 'REQUIEREN ACCIÓN', val: summary.needs_action, color: 'var(--arroba-primary)' }].map((k, i) => (
            <div key={i} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}><p className="label-arroba mb-1" style={{ color: 'var(--outline)' }}>{k.label}</p><p className="text-lg font-black" style={{ color: k.color || 'var(--on-surface)', letterSpacing: '-0.02em' }}>{k.val}</p></div>
          ))}
        </div>
      )}
      {nudges.length > 0 && <div className="space-y-2 mb-6">{nudges.slice(0, 3).map((n, i) => (<div key={i} className="p-4 flex items-start gap-3" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)', borderLeft: `3px solid ${n.priority === 'ALTA' ? '#dc2626' : '#d97706'}` }}><AlertTriangle size={14} style={{ color: n.priority === 'ALTA' ? '#dc2626' : '#d97706' }} /><div className="flex-1"><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{n.title}</p><p className="text-xs mt-0.5" style={{ color: 'var(--outline)' }}>{n.message}</p></div></div>))}</div>}
      {buyers.length === 0 ? (
        <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}><Users size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} /><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Aún no tienes interesados</p></div>
      ) : (
        <div style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <table className="w-full text-sm"><thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
            <th className="text-left py-3 px-4 label-arroba" style={{ color: 'var(--outline)' }}>BUYER</th><th className="text-left py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>DEAL</th><th className="text-center py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>TIPO / ESTADO</th><th className="text-center py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>INTENCIÓN</th><th className="text-right py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>LOI</th><th className="text-right py-3 px-4 label-arroba" style={{ color: 'var(--outline)' }}>ACTIVIDAD</th>
          </tr></thead><tbody>
            {buyers.map((b, i) => { const urgColor = (b.action?.urgency === 'alta') ? '#dc2626' : (b.action?.urgency === 'media') ? '#d97706' : 'var(--outline-variant)'; return (
              <tr key={i} style={{ borderBottom: '1px solid var(--surface-1)' }}>
                <td className="py-3 px-4"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: urgColor }} /><div><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{b.buyer_name}</p><p className="text-[10px]" style={{ color: 'var(--outline)' }}>{b.buyer_type}</p></div></div></td>
                <td className="py-3 px-3"><Link to={`/seller/deals/${b.deal_id}/resumen`} className="text-xs" style={{ color: 'var(--outline)' }}>{b.deal_title}</Link></td>
                <td className="py-3 px-3 text-center"><div className="flex items-center gap-1 justify-center"><span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: b.type === 'LOI' ? 'rgba(182,33,42,0.06)' : 'var(--surface-1)', color: b.type === 'LOI' ? 'var(--arroba-primary)' : 'var(--on-surface)' }}>{b.type}</span><span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>{stageLabel(b.stage)}</span></div></td>
                <td className="py-3 px-3 text-center">{intentBar(b.intent_score)}</td>
                <td className="py-3 px-3 text-right"><span className="text-sm font-bold" style={{ color: 'var(--arroba-primary)' }}>{b.valuation_offer ? fmtMillions(b.valuation_offer) : '—'}</span></td>
                <td className="py-3 px-4 text-right"><span className="text-[10px]" style={{ color: 'var(--outline)' }}>{timeAgo(b.last_activity)}</span></td>
              </tr>
            ); })}
          </tbody></table>
        </div>
      )}
    </>
  );
};

/* ── DEAL VIEW ── */
const DealView = ({ deal, company, section, readiness, health, engData, qaConversations, onActivate, actionLoading, onRefresh }) => {
  const sectionLabel = DEAL_SECTIONS.find(s => s.id === section)?.label || section;
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>{sectionLabel.toUpperCase()}</p>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>{company?.trade_name || company?.legal_name || 'Deal'}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--outline)' }}>{deal.teaser?.sector_display || ''} · {deal.teaser?.geography_display || ''}</p>
        </div>
        {deal.status === 'draft' && (
          <button onClick={onActivate} disabled={actionLoading} className="px-5 py-2 text-xs font-bold disabled:opacity-50" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
            {actionLoading ? <Loader2 size={12} className="animate-spin" /> : 'PUBLICAR DEAL'}
          </button>
        )}
      </div>

      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          {section === 'resumen' && <DealResumen deal={deal} readiness={readiness} health={health} company={company} />}
          {section === 'interesados' && <DealInteresados deal={deal} engData={engData} onRefresh={onRefresh} />}
          {section === 'lois' && <LoiDetailedView deal={deal} onRefresh={onRefresh} />}
          {section === 'qa' && <DealQA conversations={qaConversations} />}
          {section === 'dataroom' && <DataRoomSellerTab deal={deal} />}
          {section === 'infomemo' && <DealInfomemo deal={deal} company={company} />}
        </div>
        <div className="w-[260px] shrink-0 space-y-5">
          <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
            <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>INFORMACIÓN</p>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>Precio solicitado</span><span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{deal.asking_price ? fmtMillions(deal.asking_price) : 'Negociable'}</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>Creado</span><span className="text-xs" style={{ color: 'var(--on-surface)' }}>{new Date(deal.created_at).toLocaleDateString('es-ES')}</span></div>
            </div>
          </div>
          {company?.valuation && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>VALORACIÓN</p>
              <p className="text-xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.02em' }}>{fmtMillions(company.valuation.valuation_min)} — {fmtMillions(company.valuation.valuation_max)}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ── Sub-sections ── */
const DealResumen = ({ deal, readiness, health, company }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-3 gap-3">
      {[{ label: 'VISTAS', val: deal.metrics?.teaser_views || 0 }, { label: 'NDAs FIRMADOS', val: deal.metrics?.ndas_signed_count || 0 }, { label: 'INTERESES', val: deal.metrics?.interests_count || 0 }, { label: 'LOIs', val: deal.metrics?.lois_received_count || 0 }, { label: 'SOLICITUDES', val: deal.metrics?.access_requests_count || 0 }, { label: 'READINESS', val: readiness ? `${readiness.score}%` : '—', color: readiness?.score >= 90 ? '#16a34a' : readiness?.score >= 60 ? '#d97706' : 'var(--on-surface)' }].map((k, i) => (
        <div key={i} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}><p className="label-arroba mb-1" style={{ color: 'var(--outline)' }}>{k.label}</p><p className="text-lg font-black" style={{ color: k.color || 'var(--on-surface)', letterSpacing: '-0.02em' }}>{k.val}</p></div>
      ))}
    </div>
    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
      <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>TEASER PÚBLICO</p>
      <h3 className="text-base font-bold mb-2" style={{ color: 'var(--on-surface)' }}>{deal.teaser?.headline}</h3>
      <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>{deal.teaser?.description}</p>
    </div>
    {health?.alerts?.length > 0 && (
      <div className="space-y-2">
        <p className="label-arroba" style={{ color: 'var(--outline)' }}>ALERTAS DE SALUD</p>
        {health.alerts.map((a, i) => (<div key={i} className="p-4 flex items-start gap-3" style={{ background: 'var(--surface-lowest)', borderLeft: `3px solid ${a.severity === 'red' ? '#dc2626' : '#d97706'}` }}><AlertTriangle size={14} style={{ color: a.severity === 'red' ? '#dc2626' : '#d97706' }} /><div><p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{a.problem}</p><p className="text-[10px]" style={{ color: 'var(--outline)' }}>{a.cause}</p><p className="text-[10px] font-semibold mt-1" style={{ color: 'var(--arroba-primary)' }}>{a.action}</p></div></div>))}
      </div>
    )}
  </div>
);

const DealInteresados = ({ deal, engData, onRefresh }) => {
  if (!engData) return <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;
  const engagements = engData?.engagements || [];
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="px-3 py-1 text-xs font-bold" style={{ background: 'rgba(59,130,246,0.06)', color: '#1d4ed8' }}>{engData?.total_interests || 0} Intereses</span>
        <span className="px-3 py-1 text-xs font-bold" style={{ background: 'rgba(182,33,42,0.06)', color: 'var(--arroba-primary)' }}>{(engData?.total_lois || 0) === 1 ? 'LOI recibida' : `${engData?.total_lois || 0} LOIs recibidas`}</span>
      </div>
      {engagements.length === 0 ? (
        <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}><Users size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} /><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Sin interesados aún</p></div>
      ) : (
        <div style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <table className="w-full text-sm"><thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}><th className="text-left py-3 px-4 label-arroba" style={{ color: 'var(--outline)' }}>BUYER</th><th className="text-center py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>TIPO</th><th className="text-center py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>STAGE</th><th className="text-right py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>OFERTA</th><th className="text-right py-3 px-4 label-arroba" style={{ color: 'var(--outline)' }}>ACCIONES</th></tr></thead>
          <tbody>{engagements.map(eng => (<tr key={eng.engagement_id} style={{ borderBottom: '1px solid var(--surface-1)' }}><td className="py-3 px-4"><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{eng.buyer_name || 'Buyer'}</p></td><td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--outline)' }}>{eng.type}</td><td className="py-3 px-3 text-center"><span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>{eng.stage}</span></td><td className="py-3 px-3 text-right"><span className="text-sm font-bold" style={{ color: 'var(--arroba-primary)' }}>{eng.valuation_offer ? fmtMillions(eng.valuation_offer) : '—'}</span></td><td className="py-3 px-4 text-right"><div className="flex items-center justify-end gap-1">{eng.stage !== 'SHORTLISTED' && eng.stage !== 'EXCLUSIVITY' && eng.stage !== 'REJECTED' && (<button onClick={async () => { try { await engagementsAPI.shortlistBuyer(deal.deal_id, eng.buyer_id); onRefresh(); } catch {} }} className="px-2 py-1 text-[10px] font-bold" style={{ background: 'rgba(22,163,74,0.06)', color: '#16a34a' }}>Shortlist</button>)}{eng.stage !== 'REJECTED' && eng.stage !== 'EXCLUSIVITY' && (<button onClick={async () => { try { await engagementsAPI.rejectBuyer(deal.deal_id, eng.buyer_id); onRefresh(); } catch {} }} className="px-2 py-1 text-[10px] font-bold" style={{ background: 'rgba(220,38,38,0.05)', color: '#dc2626' }}>Rechazar</button>)}</div></td></tr>))}</tbody></table>
        </div>
      )}
    </div>
  );
};

const DealQA = ({ conversations }) => {
  if (!conversations) return <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;
  if (conversations.length === 0) return <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}><MessageSquare size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} /><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Sin conversaciones Q&A</p><p className="text-xs" style={{ color: 'var(--outline)' }}>Se activarán cuando aceptes un interés.</p></div>;
  return (<div className="space-y-3">{conversations.map(c => (<Link key={c.conversation_id} to={`/qa/${c.conversation_id}`} className="block p-4 group transition-all duration-150 hover:-translate-y-0.5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}><div className="flex items-center justify-between"><div><p className="text-sm font-bold group-hover:opacity-80" style={{ color: 'var(--on-surface)' }}>{c.buyer_name || 'Buyer'}</p><p className="text-xs mt-0.5" style={{ color: 'var(--outline)' }}>{c.pending_count || 0} pendientes · {c.total_count || 0} total</p></div><span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: c.status === 'OPEN' ? 'rgba(22,163,74,0.06)' : 'var(--surface-2)', color: c.status === 'OPEN' ? '#16a34a' : 'var(--outline)' }}>{c.status === 'OPEN' ? 'ACTIVA' : 'CERRADA'}</span></div></Link>))}</div>);
};

const DealInfomemo = ({ deal, company }) => (
  <div>{deal.infomemo?.content ? (<div><div className="flex items-center justify-between mb-4"><p className="label-arroba" style={{ color: 'var(--outline)' }}>INFORMATION MEMORANDUM</p><Link to={`/seller/company/${company?.company_id}?step=4`} className="text-xs font-bold" style={{ color: 'var(--arroba-primary)' }}>Editar</Link></div><div className="p-6 prose prose-sm max-w-none" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{deal.infomemo.content}</ReactMarkdown></div></div>) : (<div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}><FileText size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} /><p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Infomemo no generado</p><Link to={`/seller/company/${company?.company_id}?step=4`}><button className="px-6 py-2 mt-3 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>GENERAR INFOMEMO</button></Link></div>)}</div>
);

export default SellerWorkspace;
