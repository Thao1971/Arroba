import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { marketplaceAPI, matchingAPI, engagementsAPI, ndaAPI, notificationsAPI, buyerAPI, billingAPI } from '../services/api';
import {
  Search, FileText, ArrowRight, Building2,
  Sparkles, MapPin, Zap, ChevronRight, Send, FileSignature, Shield,
  Star, Lock, AlertCircle, MessageSquare, CheckCircle2,
  FolderOpen, Eye, User, Bell, Settings, Bookmark, ArrowLeft, Clock,
  Award, CreditCard, Info, MoreHorizontal, Copy, Share2, X, Trash2
} from 'lucide-react';

/* ─── Configs ─── */
const stageConfig = {
  SUBMITTED: { label: 'Enviado', color: 'text-blue-700', bg: 'rgba(59,130,246,0.06)', icon: Send },
  VIEWED: { label: 'Visto por seller', color: 'text-amber-700', bg: 'rgba(217,119,6,0.06)', icon: Eye },
  ACCEPTED: { label: 'Aceptado', color: 'text-teal-700', bg: 'rgba(20,184,166,0.06)', icon: CheckCircle2 },
  SHORTLISTED: { label: 'En Shortlist', color: 'text-green-700', bg: 'rgba(22,163,74,0.06)', icon: Star },
  REJECTED: { label: 'No seleccionado', color: 'text-red-600', bg: 'rgba(220,38,38,0.05)', icon: AlertCircle },
  EXCLUSIVITY: { label: 'En Exclusividad', color: 'text-indigo-700', bg: 'rgba(79,70,229,0.06)', icon: Lock },
};

const getPlanTier = (user) => {
  const sub = user?.subscription?.plan_type;
  if (sub === 'buyer_proplus' || sub === 'buyer_pro+') return 'pro+';
  if (sub === 'buyer_pro') return 'pro';
  return 'free';
};
const planLabels = {
  'free': { label: 'FREE', color: 'var(--outline)', bg: 'var(--surface-2)' },
  'pro': { label: 'PRO', color: 'var(--arroba-secondary)', bg: 'rgba(0,100,147,0.08)' },
  'pro+': { label: 'PRO+', color: 'var(--arroba-primary)', bg: 'rgba(182,33,42,0.06)' },
};

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: FolderOpen },
  { id: 'procesos', label: 'Mis procesos', icon: FileText },
  { id: 'seguimiento', label: 'Seguimiento', icon: Bookmark },
  { id: 'recomendados', label: 'Recomendados', icon: Sparkles },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'facturacion', label: 'Facturación', icon: CreditCard },
];

/* ═══════════════════════════════════════════ */
const BuyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [stats, setStats] = useState(null);
  const [recommendedDeals, setRecommendedDeals] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [savedDeals, setSavedDeals] = useState([]);
  const [ndaCount, setNdaCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [certData, setCertData] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [notifPrefs, setNotifPrefs] = useState({
    new_opportunities: true,
    seller_responses: true,
    process_changes: true,
  });

  // Derived from certData (backend is source of truth)
  const planTier = certData?.plan?.tier || getPlanTier(user);
  const plan = planLabels[planTier];
  const isFree = planTier === 'free';
  const interactionLimit = certData?.plan?.monthly_interaction_limit ?? (planTier === 'free' ? 0 : planTier === 'pro' ? 5 : -1);
  const interactionsUsed = certData?.plan?.interactions_used || 0;
  const cert = certData?.certification;
  const planInfo = certData?.plan;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, processRes] = await Promise.all([
          marketplaceAPI.getStats(),
          engagementsAPI.getMyProcesses().catch(() => ({ data: { processes: [] } })),
        ]);
        setStats(statsRes.data);
        setProcesses(processRes.data.processes || []);
        Promise.all([
          matchingAPI.getRecommendedDeals().then(r => { setRecommendedDeals(r.data.deals || []); setProfileComplete(r.data.profile_complete || false); }).catch(() => setProfileComplete(false)),
          ndaAPI.mySignatures().then(r => setNdaCount(r.data?.length || 0)).catch(() => {}),
          engagementsAPI.listSaved().then(r => setSavedDeals(r.data?.deals || [])).catch(() => {}),
          notificationsAPI.list().then(r => setNotifications(r.data?.slice?.(0, 20) || [])).catch(() => {}),
          notificationsAPI.unreadCount().then(r => setUnreadCount(r.data?.count || 0)).catch(() => {}),
          buyerAPI.getCertification().then(r => setCertData(r.data)).catch(() => {}),
          billingAPI.getSummary().then(r => setBillingData(r.data)).catch(() => {}),
        ]);
      } catch (e) { console.error('Dashboard fetch error:', e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
        <div className="w-6 h-6 animate-spin" style={{ border: '2px solid var(--surface-2)', borderTopColor: 'var(--arroba-primary)', borderRadius: '50%' }} />
      </div>
    );
  }

  const activeProcesses = processes.filter(p => p.stage !== 'REJECTED');

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="buyer-dashboard">

      {/* ─── LEFT SIDEBAR (fixed) ─── */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40" style={{ background: 'var(--surface-1)', paddingTop: 24 }}>
        <div className="px-6 mb-4">
          <Link to="/" className="text-2xl font-black tracking-tight block mb-2" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</Link>
          <p className="label-arroba" style={{ color: 'var(--outline)', fontSize: 9 }}>PANEL DE COMPRADOR</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--on-surface)' }}>
            {user?.first_name} {user?.last_name}
          </p>
        </div>

        {/* Plan + Certification in sidebar */}
        <div className="px-4 mb-5 space-y-2">
          <div className="px-3 py-2 flex items-center justify-between" style={{ background: plan.bg }}>
            <span className="text-[10px] font-bold" style={{ color: plan.color }}>PLAN {plan.label}</span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--outline)' }}>
              {interactionLimit === -1 ? 'Ilimitadas' : interactionLimit === 0 ? '0 inter.' : `${interactionsUsed}/${interactionLimit}`}
            </span>
          </div>
          {cert && (
            <div className="px-3 py-2 flex items-center gap-2" style={{ background: cert.level === 'certified' ? 'rgba(22,163,74,0.06)' : cert.level === 'verified' ? 'rgba(217,119,6,0.06)' : 'var(--surface-2)' }} data-testid="cert-badge-sidebar">
              <Award size={12} style={{ color: cert.level === 'certified' ? '#16a34a' : cert.level === 'verified' ? '#d97706' : 'var(--outline)' }} />
              <span className="text-[10px] font-bold" style={{ color: cert.level === 'certified' ? '#16a34a' : cert.level === 'verified' ? '#d97706' : 'var(--outline)' }}>
                {cert.level_label.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = s.id === activeSection;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className="flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider transition-all"
                style={{
                  color: isActive ? 'var(--arroba-primary)' : 'var(--on-surface-variant)',
                  background: isActive ? 'var(--surface-lowest)' : 'transparent',
                  boxShadow: isActive ? '0px 4px 12px rgba(26,28,28,0.06)' : 'none',
                }}
                data-testid={`nav-${s.id}`}>
                <Icon size={16} />
                <span>{s.label}</span>
                {s.id === 'alertas' && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 text-[9px] font-bold flex items-center justify-center" style={{ background: 'var(--arroba-primary)', color: '#fff', borderRadius: '50%' }}>{unreadCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar bottom */}
        <div className="px-4 pb-6 space-y-3">
          {isFree && (
            <Link to="/planes?role=buyer&source=buyer_dashboard">
              <button className="w-full py-3 text-[11px] font-bold flex items-center justify-center gap-2"
                style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="upgrade-plan-btn">
                MEJORAR PLAN <ArrowRight size={12} />
              </button>
            </Link>
          )}
          <Link to="/explorar">
            <button className="w-full py-3 text-[11px] font-bold flex items-center justify-center gap-2"
              style={{ background: 'var(--on-surface)', color: '#fff' }}>
              <Search size={12} /> LISTADO DE AGENCIAS
            </button>
          </Link>
        </div>
      </aside>

      {/* ─── MAIN CONTENT (offset by sidebar) ─── */}
      <main className="ml-60 min-h-screen" style={{ paddingTop: 32 }}>
        <div className="max-w-[1100px] mx-auto px-8 pb-16">

          {/* ─── TOP HEADER ─── */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>
                {SECTIONS.find(s => s.id === activeSection)?.label.toUpperCase()}
              </p>
              <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                {activeSection === 'dashboard' ? `Hola, ${user?.first_name || 'Inversor'}` :
                 activeSection === 'procesos' ? (selectedProcess ? selectedProcess.deal_title : 'Mis procesos activos') :
                 activeSection === 'seguimiento' ? 'Empresas en seguimiento' :
                 activeSection === 'recomendados' ? 'Deals recomendados' :
                 activeSection === 'alertas' ? 'Alertas y notificaciones' :
                 'Perfil comprador'}
              </h1>
              {activeSection === 'dashboard' && (
                <p className="text-sm mt-1" style={{ color: 'var(--outline)' }}>
                  {activeProcesses.length > 0
                    ? `${activeProcesses.length} proceso${activeProcesses.length !== 1 ? 's' : ''} activo${activeProcesses.length !== 1 ? 's' : ''} · ${ndaCount} NDA${ndaCount !== 1 ? 's' : ''} firmado${ndaCount !== 1 ? 's' : ''}`
                    : 'Explora oportunidades y activa tu primer proceso'}
                </p>
              )}
            </div>
          </div>

          {/* ─── PROFILE ALERT ─── */}
          {!profileComplete && activeSection === 'dashboard' && (
            <div className="mb-6 p-4 flex items-center justify-between gap-4" style={{ background: 'rgba(182,33,42,0.04)', borderLeft: '3px solid var(--arroba-primary)' }} data-testid="profile-alert">
              <div className="flex items-center gap-3">
                <Building2 size={16} style={{ color: 'var(--arroba-primary)' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Completa tu perfil de comprador</p>
                  <p className="text-xs" style={{ color: 'var(--outline)' }}>Sin perfil completo no verás recomendaciones ni podrás enviar interés</p>
                </div>
              </div>
              <Link to="/buyer/onboarding">
                <button className="px-5 py-2 text-xs font-bold whitespace-nowrap" style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="complete-profile-btn">COMPLETAR PERFIL</button>
              </Link>
            </div>
          )}

          {/* ─── CONTENT + RAIL ─── */}
          <div className="flex gap-8">
            {/* CENTER content */}
            <div className="flex-1 min-w-0">

              {/* ═══ DASHBOARD ═══ */}
              {activeSection === 'dashboard' && (
                <>
                  {/* KPIs */}
                  <div className="grid grid-cols-3 gap-3 mb-8" data-testid="kpi-grid">
                    {[
                      { label: 'PROCESOS ACTIVOS', value: activeProcesses.length, icon: FolderOpen, tip: 'Operaciones donde has interactuado: NDA, interés, LOI o due diligence.' },
                      { label: 'NDAs FIRMADOS', value: ndaCount, icon: FileSignature, tip: 'Acuerdos de confidencialidad firmados que te dan acceso a infomemos y data rooms.' },
                      { label: 'EN SEGUIMIENTO', value: savedDeals.length, icon: Star, tip: 'Deals que has guardado para seguir su evolución.' },
                      { label: 'DEALS DISPONIBLES', value: stats?.published_deals || 0, icon: Building2, tip: 'Total de operaciones activas publicadas en el listado de agencias.' },
                      { label: 'RECOMENDADOS', value: recommendedDeals.length, icon: Sparkles, tip: 'Oportunidades seleccionadas según tu perfil inversor y tesis de inversión.' },
                      { label: 'INTERACCIONES', value: interactionLimit === -1 ? 'Sin límite' : interactionLimit === 0 ? 'Bloqueadas' : `${interactionsUsed}/${interactionLimit}`, icon: Zap, highlight: interactionLimit === 0, tip: 'Intereses, contactos o reuniones que puedes gestionar este mes según tu plan.' },
                    ].map((kpi, i) => {
                      const Icon = kpi.icon;
                      return (
                        <div key={i} className="p-4 relative group" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Icon size={11} style={{ color: 'var(--outline)' }} />
                            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>{kpi.label}</p>
                            <Info size={9} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" style={{ color: 'var(--outline)' }} />
                          </div>
                          <p className="text-lg font-black" style={{ color: kpi.highlight ? 'var(--arroba-primary)' : 'var(--on-surface)', letterSpacing: '-0.02em' }}>{kpi.value}</p>
                          {/* Tooltip */}
                          <div className="absolute left-0 right-0 top-full mt-1 p-2 text-[10px] leading-tight z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" style={{ background: 'var(--on-surface)', color: '#fff' }}>{kpi.tip}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Processes */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-base font-extrabold" style={{ color: 'var(--on-surface)' }}>Mis procesos activos</h2>
                      <span className="text-xs font-semibold" style={{ color: 'var(--outline)' }}>{activeProcesses.length}</span>
                    </div>
                    <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>Tus procesos activos incluyen todas las operaciones en las que ya has interactuado de forma relevante: NDA firmado, interés enviado, LOI presentada o due diligence en curso.</p>
                    {activeProcesses.length === 0 ? (
                      <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }} data-testid="no-processes">
                        <Search size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                        <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Aún no tienes procesos activos</p>
                        <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Explora el listado de agencias para iniciar tu primer proceso.</p>
                        <Link to="/explorar"><button className="px-6 py-2 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>EXPLORAR</button></Link>
                      </div>
                    ) : (
                      <div className="space-y-3" data-testid="my-processes">
                        {processes.map(proc => <ProcessCard key={proc.engagement_id} proc={proc} isFree={isFree} />)}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ═══ MIS PROCESOS ═══ */}
              {activeSection === 'procesos' && !selectedProcess && (
                <div data-testid="tab-procesos-content">
                  <p className="text-xs mb-6" style={{ color: 'var(--outline)' }}>{activeProcesses.length} proceso{activeProcesses.length !== 1 ? 's' : ''} activo{activeProcesses.length !== 1 ? 's' : ''}</p>
                  {activeProcesses.length === 0 ? (
                    <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
                      <Search size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Aún no tienes procesos activos</p>
                      <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Explora el listado de agencias para iniciar tu primer proceso.</p>
                      <Link to="/explorar"><button className="px-6 py-2 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>EXPLORAR</button></Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {processes.map(proc => (
                        <ProcessCard key={proc.engagement_id} proc={proc} isFree={isFree} onClick={() => setSelectedProcess(proc)} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ PROCESS DETAIL ═══ */}
              {activeSection === 'procesos' && selectedProcess && (
                <ProcessDetailView proc={selectedProcess} isFree={isFree} onBack={() => setSelectedProcess(null)} />
              )}

              {/* ═══ SEGUIMIENTO ═══ */}
              {activeSection === 'seguimiento' && (
                <div data-testid="tab-seguimiento-content">
                  <p className="text-xs mb-6" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>Aquí aparecen las empresas que has guardado para seguir su evolución y volver a ellas más tarde. {savedDeals.length} oportunidad{savedDeals.length !== 1 ? 'es' : ''} guardada{savedDeals.length !== 1 ? 's' : ''}.</p>
                  {savedDeals.length === 0 ? (
                    <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
                      <Bookmark size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Sin empresas en seguimiento</p>
                      <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Guarda oportunidades desde el listado de agencias.</p>
                      <Link to="/explorar"><button className="px-6 py-2 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>EXPLORAR</button></Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedDeals.map(deal => {
                        const t = deal.teaser || {};
                        return <SeguimientoCard key={deal.deal_id} deal={deal} teaser={t} onUnsave={async () => { try { await engagementsAPI.unsaveDeal(deal.deal_id); setSavedDeals(prev => prev.filter(d => d.deal_id !== deal.deal_id)); } catch {} }} />;
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ RECOMENDADOS ═══ */}
              {activeSection === 'recomendados' && (
                <div data-testid="tab-recomendados-content">
                  <p className="text-xs mb-6" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>Estos deals se te recomiendan porque encajan con tu perfil inversor, tu rango de interés y el tipo de operaciones que estás buscando.</p>
                  {!profileComplete ? (
                    <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
                      <Sparkles size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Recomendaciones no disponibles</p>
                      <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Completa tu perfil para activar matching.</p>
                      <Link to="/buyer/onboarding"><button className="px-6 py-2 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>COMPLETAR PERFIL</button></Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recommendedDeals.map(deal => {
                        const t = deal.teaser || {};
                        const isSaved = savedDeals.some(s => s.deal_id === deal.deal_id);
                        return (
                          <div key={deal.deal_id} className="p-5 transition-all duration-150 hover:-translate-y-0.5 group" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid={`recommended-deal-${deal.deal_id}`}>
                            <div className="flex items-start justify-between gap-4">
                              <Link to={`/explorar/${deal.deal_id}?from=buyer&section=${activeSection}`} className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>{t.sector_display || 'Digital'}</span>
                                  {deal.affinity && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: deal.affinity === 'high' ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.08)', color: deal.affinity === 'high' ? '#16a34a' : '#d97706' }}>{deal.affinity_label}</span>
                                  )}
                                </div>
                                <p className="text-sm font-bold group-hover:opacity-80 transition-opacity truncate" style={{ color: 'var(--on-surface)' }}>{t.title || t.headline || 'Oportunidad'}</p>
                                {deal.match_reason && (
                                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}><Sparkles size={10} /> {deal.match_reason}</p>
                                )}
                              </Link>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>Facturación</p>
                                  <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{t.revenue_range || t.revenue_display || 'N/D'}</p>
                                </div>
                                {/* Save/unsave inline */}
                                <button onClick={async (e) => { e.preventDefault(); try { if (isSaved) { await engagementsAPI.unsaveDeal(deal.deal_id); setSavedDeals(prev => prev.filter(d => d.deal_id !== deal.deal_id)); } else { await engagementsAPI.saveDeal(deal.deal_id); setSavedDeals(prev => [...prev, { deal_id: deal.deal_id, teaser: t, saved_at: new Date().toISOString() }]); } } catch {} }}
                                  className="p-1.5 transition-opacity" style={{ color: isSaved ? 'var(--arroba-primary)' : 'var(--outline)' }} title={isSaved ? 'Quitar de seguimiento' : 'Guardar'}>
                                  {isSaved ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ ALERTAS ═══ */}
              {activeSection === 'alertas' && (
                <div data-testid="tab-alertas-content">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xs" style={{ color: 'var(--outline)' }}>{unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}</p>
                    {notifications.length > 0 && (
                      <button onClick={async () => { try { await notificationsAPI.markAllRead(); setUnreadCount(0); setNotifications(ns => ns.map(n => ({...n, read: true}))); } catch {} }}
                        className="text-xs font-bold" style={{ color: 'var(--arroba-primary)' }}>MARCAR TODO LEÍDO</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
                      <Bell size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Sin notificaciones</p>
                      <p className="text-xs" style={{ color: 'var(--outline)' }}>Te avisaremos cuando haya actividad relevante.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((n, i) => (
                        <div key={n.notification_id || i} className="p-4 flex items-start gap-3" style={{ background: n.read ? 'var(--surface-lowest)' : 'rgba(182,33,42,0.03)', boxShadow: '0 1px 4px rgba(25,28,30,0.02)' }}>
                          <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: n.read ? 'var(--surface-1)' : 'rgba(182,33,42,0.08)' }}>
                            <Bell size={12} style={{ color: n.read ? 'var(--outline)' : 'var(--arroba-primary)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--on-surface)' }}>{n.title}</p>
                            <p className="text-xs line-clamp-2" style={{ color: 'var(--outline)' }}>{n.message}</p>
                            <p className="text-[10px] mt-1" style={{ color: 'var(--outline-variant)' }}>{n.created_at ? new Date(n.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                          </div>
                          {!n.read && <span className="w-2 h-2 mt-1.5 shrink-0" style={{ background: 'var(--arroba-primary)', borderRadius: '50%' }} />}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Preferences */}
                  <div className="mt-8 p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Settings size={14} style={{ color: 'var(--outline)' }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Preferencias de notificación</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { key: 'new_opportunities', label: 'Nuevas oportunidades compatibles', desc: 'Cuando aparece un deal que encaja con tu perfil' },
                        { key: 'seller_responses', label: 'Respuestas del seller', desc: 'Cuando un seller responde a tu interés o Q&A' },
                        { key: 'process_changes', label: 'Cambios de estado en mis procesos', desc: 'Cuando tu proceso avanza o cambia de estado' },
                      ].map((pref) => (
                        <div key={pref.key} className="flex items-center justify-between py-1">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{pref.label}</p>
                            <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{pref.desc}</p>
                          </div>
                          <button onClick={() => setNotifPrefs(prev => ({ ...prev, [pref.key]: !prev[pref.key] }))}
                            className="relative w-10 h-5 shrink-0 transition-colors"
                            style={{ background: notifPrefs[pref.key] ? 'var(--arroba-primary)' : 'var(--surface-2)' }}
                            data-testid={`toggle-${pref.key}`}>
                            <span className="absolute top-0.5 w-4 h-4 transition-all" style={{ background: '#fff', left: notifPrefs[pref.key] ? 22 : 2 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ PERFIL ═══ */}
              {activeSection === 'perfil' && (
                <div data-testid="tab-perfil-content">
                  <div className="space-y-5">
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-4" style={{ color: 'var(--outline)', fontSize: 9 }}>DATOS PERSONALES</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ProfileField label="Nombre" value={`${user?.first_name || ''} ${user?.last_name || ''}`} />
                        <ProfileField label="Email" value={user?.email} />
                        <ProfileField label="Empresa" value={user?.buyer_profile?.company_name || '—'} />
                        <ProfileField label="Cargo" value={user?.buyer_profile?.job_title || '—'} />
                      </div>
                    </div>
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-4" style={{ color: 'var(--outline)', fontSize: 9 }}>TESIS DE INVERSIÓN</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ProfileField label="Tipo de buyer" value={user?.buyer_profile?.buyer_type || '—'} />
                        <ProfileField label="Ticket objetivo" value={user?.buyer_profile?.investment_range ? `${user.buyer_profile.investment_range.min_eur?.toLocaleString('es-ES')} - ${user.buyer_profile.investment_range.max_eur?.toLocaleString('es-ES')} EUR` : '—'} />
                        <ProfileField label="Sectores de interés" value={user?.buyer_profile?.taxonomy_categories?.join(', ') || user?.buyer_profile?.sectors?.join(', ') || '—'} />
                        <ProfileField label="Geografía" value={user?.buyer_profile?.preferred_regions?.join(', ') || '—'} />
                      </div>
                    </div>
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-4" style={{ color: 'var(--outline)', fontSize: 9 }}>VERIFICACIÓN</p>
                      <div className="space-y-2">
                        <VerificationRow label="Email verificado" done={!!user?.email} />
                        <VerificationRow label="Perfil completo" done={!!user?.buyer_profile?.profile_complete} />
                        <VerificationRow label="Empresa declarada" done={!!user?.buyer_profile?.company_name} />
                        <VerificationRow label="Tesis de inversión" done={!!user?.buyer_profile?.acquisition_thesis} />
                      </div>
                      <p className="text-[10px] mt-4" style={{ color: 'var(--outline-variant)' }}>El sello de Comprador Certificado estará disponible próximamente.</p>
                    </div>
                    {/* Visibility toggle */}
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-3" style={{ color: 'var(--outline)', fontSize: 9 }}>VISIBILIDAD DEL PERFIL</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>Perfil público</span>
                        <div className="relative">
                          <button disabled={isFree}
                            className="relative w-10 h-5 transition-colors" style={{ background: isFree ? 'var(--surface-2)' : 'var(--arroba-primary)', opacity: isFree ? 0.5 : 1 }}>
                            <span className="absolute top-0.5 w-4 h-4 transition-transform" style={{ background: '#fff', left: 22 }} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>
                        {isFree
                          ? 'Tu perfil es visible por defecto. Con una cuenta premium puedes ocultarlo y navegar con mayor discreción.'
                          : 'Tu perfil es visible para sellers dentro de la plataforma. Puedes desactivar la visibilidad desde aquí.'}
                      </p>
                      {isFree && (
                        <Link to="/planes?role=buyer" className="text-[10px] font-bold mt-2 inline-block" style={{ color: 'var(--arroba-primary)' }}>Ver planes premium</Link>
                      )}
                    </div>
                    <Link to="/buyer/onboarding"><button className="w-full py-3 text-xs font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>EDITAR PERFIL DE COMPRADOR</button></Link>
                  </div>
                </div>
              )}

              {/* ═══ FACTURACIÓN ═══ */}
              {activeSection === 'facturacion' && (
                <div data-testid="tab-facturacion-content">
                  <div className="space-y-5">
                    {/* Plan actual */}
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-3" style={{ color: 'var(--outline)', fontSize: 9 }}>PLAN ACTUAL</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{billingData?.plan?.name || 'Free'}</p>
                          <p className="text-xs" style={{ color: 'var(--outline)' }}>{billingData?.plan?.status === 'active' ? 'Activo' : 'Sin suscripción'}</p>
                        </div>
                        <Link to="/planes?role=buyer"><button className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>CAMBIAR PLAN</button></Link>
                      </div>
                    </div>
                    {/* Método de pago */}
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-3" style={{ color: 'var(--outline)', fontSize: 9 }}>MÉTODO DE PAGO</p>
                      {billingData?.payment_method?.configured ? (
                        <div className="flex items-center gap-3">
                          <CreditCard size={16} style={{ color: 'var(--on-surface)' }} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{billingData.payment_method.brand} •••• {billingData.payment_method.last_four}</p>
                            <p className="text-xs" style={{ color: 'var(--outline)' }}>Expira {billingData.payment_method.expires}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs mb-2" style={{ color: 'var(--outline)' }}>No hay método de pago configurado.</p>
                          <p className="text-[10px]" style={{ color: 'var(--outline-variant)' }}>Se configurará automáticamente al activar un plan de pago.</p>
                        </div>
                      )}
                    </div>
                    {/* Facturas */}
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-3" style={{ color: 'var(--outline)', fontSize: 9 }}>FACTURAS</p>
                      {(billingData?.invoices?.length || 0) === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--outline)' }}>No hay facturas emitidas.</p>
                      ) : (
                        <div className="space-y-2">
                          {billingData.invoices.map((inv, i) => (
                            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--surface-1)' }}>
                              <div><p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{inv.description || 'Factura'}</p><p className="text-[10px]" style={{ color: 'var(--outline)' }}>{new Date(inv.created_at).toLocaleDateString('es-ES')}</p></div>
                              <div className="flex items-center gap-3"><span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{inv.amount}€</span><span className="px-2 py-0.5 text-[9px] font-bold" style={{ background: inv.status === 'paid' ? 'rgba(22,163,74,0.06)' : 'rgba(217,119,6,0.06)', color: inv.status === 'paid' ? '#16a34a' : '#d97706' }}>{inv.status === 'paid' ? 'PAGADA' : 'PENDIENTE'}</span></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--outline-variant)' }}>La gestión de pagos se realizará a través de pasarela segura una vez activada la suscripción.</p>
                  </div>
                </div>
              )}
            </div>

            {/* ─── RIGHT RAIL (contextual) ─── */}
            <div className="w-[260px] shrink-0 space-y-5 hidden lg:block">

              {/* Certification card */}
              {cert && (
                <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="cert-card-rail">
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={14} style={{ color: cert.level === 'certified' ? '#16a34a' : cert.level === 'verified' ? '#d97706' : 'var(--outline)' }} />
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>CERTIFICACIÓN</p>
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ color: cert.level === 'certified' ? '#16a34a' : cert.level === 'verified' ? '#d97706' : 'var(--on-surface)' }}>
                    {cert.level_label}
                  </p>
                  {/* Progress bar — secondary reference */}
                  <div className="w-full h-1.5 mb-4" style={{ background: 'var(--surface-2)' }}>
                    <div className="h-full transition-all" style={{ background: cert.level === 'certified' ? '#16a34a' : cert.level === 'verified' ? '#d97706' : 'var(--outline)', width: `${cert.score}%` }} />
                  </div>
                  {/* Completitud criteria */}
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--outline)' }}>COMPLETITUD</p>
                  <div className="space-y-1.5 mb-3">
                    {cert.criteria.filter(cr => cr.category === 'completitud').map(cr => (
                      <div key={cr.id} className="flex items-center gap-2">
                        {cr.completed ? <CheckCircle2 size={11} style={{ color: '#16a34a' }} /> : <div className="w-[11px] h-[11px] shrink-0" style={{ border: '1.5px solid var(--outline-variant)', borderRadius: '50%' }} />}
                        <span className="text-[10px]" style={{ color: cr.completed ? 'var(--on-surface)' : 'var(--outline)' }}>{cr.label}</span>
                      </div>
                    ))}
                  </div>
                  {/* Confianza criteria */}
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--outline)' }}>CONFIANZA</p>
                  <div className="space-y-1.5 mb-3">
                    {cert.criteria.filter(cr => cr.category === 'confianza').map(cr => (
                      <div key={cr.id} className="flex items-center gap-2">
                        {cr.completed ? <CheckCircle2 size={11} style={{ color: '#16a34a' }} /> : <div className="w-[11px] h-[11px] shrink-0" style={{ border: '1.5px solid var(--outline-variant)', borderRadius: '50%' }} />}
                        <span className="text-[10px]" style={{ color: cr.completed ? 'var(--on-surface)' : 'var(--outline)' }}>{cr.label}</span>
                      </div>
                    ))}
                  </div>
                  {cert.level !== 'certified' && (
                    <>
                      <p className="text-[10px] mb-2" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>
                        Completa los criterios pendientes para mejorar tu nivel. Los sellers ven tu etiqueta de confianza al evaluar tu interés.
                      </p>
                      <button onClick={() => {
                        const pending = cert.criteria.find(c => !c.completed);
                        if (pending?.id === 'company_declared' || pending?.id === 'job_title_declared' || pending?.id === 'investment_thesis' || pending?.id === 'profile_complete') {
                          navigate('/buyer/onboarding');
                        } else {
                          setActiveSection('perfil');
                        }
                      }}
                        className="w-full py-2 text-[10px] font-bold mt-1" style={{ background: 'var(--on-surface)', color: '#fff' }} data-testid="complete-verification-btn">
                        COMPLETAR VERIFICACIÓN
                      </button>
                    </>
                  )}
                  {cert.level === 'certified' && (
                    <p className="text-[10px]" style={{ color: '#16a34a', lineHeight: 1.4 }}>
                      Máximo nivel de verificación. Los sellers confían en compradores certificados.
                    </p>
                  )}
                </div>
              )}

              {/* Plan detail */}
              {planInfo && (
                <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="plan-detail-rail">
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--outline)' }}>TU PLAN</p>
                  <p className="text-sm font-bold mb-2" style={{ color: 'var(--on-surface)' }}>Buyer {planInfo.label}</p>
                  <p className="text-xs mb-3" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>{planInfo.features_summary}</p>
                  <div className="space-y-1.5 mb-3">
                    <PlanFeatureRow label="Ver detalle completo" enabled={planInfo.can_view_full_detail} valueText={!planInfo.can_view_full_detail ? 'Desde Pro' : null} />
                    <PlanFeatureRow label="Gestionar interacciones" enabled={planInfo.can_manage_interactions} valueText={!planInfo.can_manage_interactions ? 'Desde Pro' : null} />
                    <PlanFeatureRow label="Acceso a Data Room" enabled={planInfo.can_access_dataroom} valueText={!planInfo.can_access_dataroom ? 'Desde Pro' : null} />
                    <PlanFeatureRow label="Acceso prioritario" enabled={planInfo.priority_access} valueText={!planInfo.priority_access ? 'Solo Pro+' : null} />
                  </div>
                  {interactionLimit >= 0 && (
                    <div className="pt-2 mb-3" style={{ borderTop: '1px solid var(--surface-1)' }}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span style={{ color: 'var(--outline)' }}>Interacciones</span>
                        <span className="font-bold" style={{ color: interactionLimit === 0 ? 'var(--arroba-primary)' : 'var(--on-surface)' }}>
                          {interactionLimit === 0 ? 'Bloqueadas' : `${interactionsUsed}/${interactionLimit}`}
                        </span>
                      </div>
                      {interactionLimit > 0 && (
                        <div className="w-full h-1" style={{ background: 'var(--surface-2)' }}><div className="h-full" style={{ background: 'var(--arroba-primary)', width: `${Math.min((interactionsUsed / interactionLimit) * 100, 100)}%` }} /></div>
                      )}
                    </div>
                  )}
                  {planInfo.upgrade_message && (
                    <>
                      <p className="text-[10px] mb-2" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>{planInfo.upgrade_message}</p>
                      <Link to={`/planes?role=buyer&source=buyer_dashboard`}>
                        <button className="w-full py-2 text-[10px] font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
                          MEJORAR A {planInfo.next_plan?.toUpperCase()}
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Market */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--outline)' }}>MERCADO</p>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>Deals activos</span><span className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{stats?.published_deals || 0}</span></div>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>Nuevos esta semana</span><span className="text-sm font-bold" style={{ color: 'var(--arroba-primary)' }}>+{stats?.new_this_week || 0}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ─── Sub-components ─── */
const ProcessCard = ({ proc, isFree, onClick }) => {
  const stage = stageConfig[proc.stage] || { label: proc.stage, color: 'text-slate-600', bg: 'var(--surface-1)', icon: FileText };
  const StageIcon = stage.icon;
  const isBlocked = isFree && proc.stage !== 'REJECTED';
  const Wrapper = onClick ? 'button' : Link;
  const wrapperProps = onClick ? { onClick, className: 'block p-5 group w-full text-left' } : { to: `/explorar/${proc.deal_id}`, className: 'block p-5 group' };

  return (
    <div className="transition-all duration-150 hover:-translate-y-0.5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid={`process-${proc.engagement_id}`}>
      <Wrapper {...wrapperProps}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold" style={{ background: stage.bg, color: stage.color }}><StageIcon size={10} /> {stage.label}</span>
              <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--outline)' }}>{proc.type}</span>
            </div>
            <h3 className="text-sm font-bold group-hover:opacity-80 transition-opacity" style={{ color: 'var(--on-surface)' }}>{proc.deal_title}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--outline)' }}>
              {proc.deal_sector && <span>{proc.deal_sector}</span>}
              {proc.deal_location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {proc.deal_location}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            {proc.valuation_offer && <p className="text-sm font-black" style={{ color: 'var(--arroba-primary)' }}>{(proc.valuation_offer / 1e6).toFixed(1).replace('.', ',')}M€</p>}
            <ChevronRight size={14} className="mt-1 ml-auto" style={{ color: 'var(--outline-variant)' }} />
          </div>
        </div>
        {proc.next_step && proc.stage !== 'REJECTED' && (
          <div className="pt-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--surface-1)' }}>
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}><ArrowRight size={10} /> {proc.next_step.action}</span>
            {proc.conversation_id && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/qa/${proc.conversation_id}`; }}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase" style={{ background: 'rgba(0,100,147,0.06)', color: '#004b74' }} data-testid={`qa-link-${proc.engagement_id}`}>
                <MessageSquare size={9} /> Q&A
              </button>
            )}
          </div>
        )}
      </Wrapper>
      {isBlocked && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 py-2 px-3" style={{ background: 'var(--surface-1)' }}>
            <Lock size={10} style={{ color: 'var(--outline)' }} />
            <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Acceso limitado en plan Free · <Link to="/planes?role=buyer" className="font-bold underline" style={{ color: 'var(--arroba-primary)' }}>Ver planes</Link></p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Process Detail View with Actions ─── */
const ProcessDetailView = ({ proc, isFree, onBack, context = 'procesos' }) => {
  const stage = stageConfig[proc.stage] || { label: proc.stage, color: 'text-slate-600', bg: 'var(--surface-1)', icon: FileText };
  const StageIcon = stage.icon;
  const actions = proc.actions || { recommended: null, available: [], blocked: [] };

  return (
    <div data-testid="process-detail">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold mb-6" style={{ color: 'var(--outline)' }}>
        <ArrowLeft size={12} /> Volver a mis procesos
      </button>

      {/* Header */}
      <div className="p-6 mb-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold" style={{ background: stage.bg, color: stage.color }}><StageIcon size={10} /> {stage.label}</span>
              <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--outline)' }}>{proc.type}</span>
              {proc.has_nda && <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(22,163,74,0.06)', color: '#16a34a' }}>NDA FIRMADO</span>}
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{proc.deal_title}</h2>
            <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: 'var(--outline)' }}>
              {proc.deal_sector && <span>{proc.deal_sector}</span>}
              {proc.deal_location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {proc.deal_location}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            {proc.valuation_offer && (
              <div>
                <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>OFERTA</p>
                <p className="text-xl font-black" style={{ color: 'var(--arroba-primary)' }}>{(proc.valuation_offer / 1e6).toFixed(1).replace('.', ',')}M€</p>
              </div>
            )}
            {proc.deal_revenue && (
              <div className="mt-2">
                <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>FACTURACIÓN</p>
                <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{proc.deal_revenue}</p>
              </div>
            )}
          </div>
        </div>
        <Link to={`/explorar/${proc.deal_id}?from=buyer&section=${context}`} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}>
          Ver ficha completa <ArrowRight size={10} />
        </Link>
      </div>

      {/* ── ACTIONS BLOCK ── */}
      <div className="mb-5">
        <p className="label-arroba mb-4" style={{ color: 'var(--outline)', fontSize: 9 }}>SIGUIENTES ACCIONES</p>

        {/* Recommended action */}
        {actions.recommended && (
          <Link to={actions.recommended.href || '#'} className="block p-4 mb-3 transition-all duration-150 hover:-translate-y-0.5"
            style={{ background: 'var(--surface-lowest)', borderLeft: '3px solid var(--arroba-primary)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}
            data-testid="action-recommended">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--arroba-primary)' }}>ACCIÓN RECOMENDADA</p>
                <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{actions.recommended.label}</p>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--arroba-primary)' }} />
            </div>
          </Link>
        )}

        {/* Available actions */}
        <div className="space-y-2 mb-4">
          {actions.available.filter(a => a.id !== actions.recommended?.id).map(action => (
            <div key={action.id} className="p-3 flex items-center justify-between"
              style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.02)' }}
              data-testid={`action-${action.id}`}>
              <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{action.label}</span>
              {action.href ? (
                <Link to={action.href} className="text-[10px] font-bold" style={{ color: 'var(--arroba-primary)' }}>Ir</Link>
              ) : (
                <span className="text-[10px] font-semibold" style={{ color: 'var(--outline)' }}>Próximamente</span>
              )}
            </div>
          ))}
        </div>

        {/* Blocked actions */}
        {actions.blocked.length > 0 && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--outline)' }}>NO DISPONIBLES</p>
            <div className="space-y-2">
              {actions.blocked.map(action => (
                <div key={action.id} className="p-3 flex items-center justify-between opacity-60"
                  style={{ background: 'var(--surface-1)' }} data-testid={`action-blocked-${action.id}`}>
                  <div className="flex items-center gap-2">
                    <Lock size={10} style={{ color: 'var(--outline)' }} />
                    <span className="text-xs" style={{ color: 'var(--outline)' }}>{action.label}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{action.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileField = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--outline)' }}>{label}</p>
    <p className="text-sm" style={{ color: 'var(--on-surface)' }}>{value || '—'}</p>
  </div>
);

const VerificationRow = ({ label, done }) => (
  <div className="flex items-center gap-2 py-1">
    {done ? <CheckCircle2 size={13} style={{ color: '#16a34a' }} /> : <AlertCircle size={13} style={{ color: 'var(--outline-variant)' }} />}
    <span className="text-xs" style={{ color: done ? 'var(--on-surface)' : 'var(--outline)' }}>{label}</span>
  </div>
);

const PlanFeatureRow = ({ label, enabled, valueText }) => (
  <div className="flex items-center gap-2">
    {enabled ? <CheckCircle2 size={11} style={{ color: '#16a34a' }} /> : <Lock size={11} style={{ color: 'var(--outline-variant)' }} />}
    <span className="text-[10px] flex-1" style={{ color: enabled ? 'var(--on-surface)' : 'var(--outline)' }}>{label}</span>
    {valueText && <span className="text-[9px] font-semibold" style={{ color: 'var(--arroba-primary)' }}>{valueText}</span>}
  </div>
);

/* ─── Seguimiento card with 3-dot menu ─── */
const SeguimientoCard = ({ deal, teaser, onUnsave, context = 'seguimiento' }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/explorar/${deal.deal_id}`;
  const title = teaser.headline || teaser.title || 'Oportunidad en ARROBA';

  const copyUrl = () => { navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {}); setMenuOpen(false); };
  const shareNative = () => { if (navigator.share) { navigator.share({ title, url }).catch(() => {}); } else { copyUrl(); } setMenuOpen(false); };

  return (
    <div className="p-5 transition-all duration-150 hover:-translate-y-0.5 group relative" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
      <div className="flex items-start justify-between gap-4">
        <Link to={`/explorar/${deal.deal_id}?from=buyer&section=${context}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>{teaser.sector_display || 'Digital'}</span>
            <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{teaser.geography_display}</span>
          </div>
          <p className="text-sm font-bold group-hover:opacity-80 transition-opacity truncate" style={{ color: 'var(--on-surface)' }}>{title}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--outline)' }}>Guardado el {new Date(deal.saved_at).toLocaleDateString('es-ES')}</p>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>Facturación</p>
            <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{teaser.revenue_display || 'N/D'}</p>
          </div>
          {/* 3-dot menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--outline)' }} data-testid={`menu-${deal.deal_id}`}>
              {menuOpen ? <X size={14} /> : <MoreHorizontal size={14} />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 py-1 min-w-[170px]" style={{ background: 'var(--surface-lowest)', boxShadow: '0 8px 24px rgba(25,28,30,0.12)' }}>
                <button onClick={onUnsave} className="w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center gap-2 hover:opacity-70" style={{ color: 'var(--on-surface)' }}>
                  <Trash2 size={12} /> Quitar de seguimiento
                </button>
                <button onClick={copyUrl} className="w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center gap-2 hover:opacity-70" style={{ color: 'var(--on-surface)' }}>
                  <Copy size={12} /> {copied ? 'Copiado' : 'Copiar enlace'}
                </button>
                <button onClick={shareNative} className="w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center gap-2 hover:opacity-70" style={{ color: 'var(--on-surface)' }}>
                  <Share2 size={12} /> Compartir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
