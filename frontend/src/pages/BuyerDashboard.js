import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { marketplaceAPI, matchingAPI, engagementsAPI, ndaAPI, notificationsAPI, buyerAPI } from '../services/api';
import {
  Search, FileText, ArrowRight, Building2,
  Sparkles, MapPin, Zap, ChevronRight, Send, FileSignature, Shield,
  Star, Lock, AlertCircle, MessageSquare, CheckCircle2,
  FolderOpen, Eye, User, Bell, Settings, Bookmark, ArrowLeft, Clock,
  Award
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
  { id: 'seguimiento', label: 'Seguimiento', icon: Bookmark },
  { id: 'recomendados', label: 'Recomendados', icon: Sparkles },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'perfil', label: 'Perfil', icon: User },
];

/* ═══════════════════════════════════════════ */
const BuyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
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
      <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40" style={{ background: 'var(--surface-1)', paddingTop: 80 }}>
        <div className="px-6 mb-6">
          <Link to="/" className="text-2xl font-black tracking-tight block mb-3" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</Link>
          <h2 className="text-base font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Panel de Comprador</h2>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--outline)' }}>
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
              <span className="text-[10px] ml-auto" style={{ color: 'var(--outline)' }}>{cert.score}%</span>
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
              <Search size={12} /> EXPLORAR MARKETPLACE
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
                      { label: 'PROCESOS ACTIVOS', value: activeProcesses.length, icon: FolderOpen },
                      { label: 'NDAs FIRMADOS', value: ndaCount, icon: FileSignature },
                      { label: 'EN SEGUIMIENTO', value: savedDeals.length, icon: Star },
                      { label: 'DEALS DISPONIBLES', value: stats?.published_deals || 0, icon: Building2 },
                      { label: 'RECOMENDADOS', value: recommendedDeals.length, icon: Sparkles },
                      { label: 'INTERACCIONES', value: interactionLimit === -1 ? 'Sin límite' : interactionLimit === 0 ? 'Bloqueadas' : `${interactionsUsed}/${interactionLimit}`, icon: Zap, highlight: interactionLimit === 0 },
                    ].map((kpi, i) => {
                      const Icon = kpi.icon;
                      return (
                        <div key={i} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Icon size={11} style={{ color: 'var(--outline)' }} />
                            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>{kpi.label}</p>
                          </div>
                          <p className="text-lg font-black" style={{ color: kpi.highlight ? 'var(--arroba-primary)' : 'var(--on-surface)', letterSpacing: '-0.02em' }}>{kpi.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Processes */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-extrabold" style={{ color: 'var(--on-surface)' }}>Mis procesos activos</h2>
                      <span className="text-xs font-semibold" style={{ color: 'var(--outline)' }}>{activeProcesses.length}</span>
                    </div>
                    {activeProcesses.length === 0 ? (
                      <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }} data-testid="no-processes">
                        <Search size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                        <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Aún no tienes procesos activos</p>
                        <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Explora el marketplace para iniciar tu primer proceso.</p>
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

              {/* ═══ SEGUIMIENTO ═══ */}
              {activeSection === 'seguimiento' && (
                <div data-testid="tab-seguimiento-content">
                  <p className="text-xs mb-6" style={{ color: 'var(--outline)' }}>{savedDeals.length} oportunidad{savedDeals.length !== 1 ? 'es' : ''} guardada{savedDeals.length !== 1 ? 's' : ''}</p>
                  {savedDeals.length === 0 ? (
                    <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
                      <Bookmark size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Sin empresas en seguimiento</p>
                      <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Guarda oportunidades desde el marketplace.</p>
                      <Link to="/explorar"><button className="px-6 py-2 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>EXPLORAR</button></Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedDeals.map(deal => {
                        const t = deal.teaser || {};
                        return (
                          <Link key={deal.deal_id} to={`/explorar/${deal.deal_id}`} className="block p-5 transition-all duration-150 hover:-translate-y-0.5 group" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>{t.sector_display || 'Digital'}</span>
                                  <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{t.geography_display}</span>
                                </div>
                                <p className="text-sm font-bold group-hover:opacity-80 transition-opacity truncate" style={{ color: 'var(--on-surface)' }}>{t.headline || t.title || 'Oportunidad'}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--outline)' }}>Guardado el {new Date(deal.saved_at).toLocaleDateString('es-ES')}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>Facturación</p>
                                <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{t.revenue_display || 'N/D'}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ RECOMENDADOS ═══ */}
              {activeSection === 'recomendados' && (
                <div data-testid="tab-recomendados-content">
                  <p className="text-xs mb-6" style={{ color: 'var(--outline)' }}>Oportunidades seleccionadas según tu perfil de inversión</p>
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
                        return (
                          <Link key={deal.deal_id} to={`/explorar/${deal.deal_id}`} className="block p-5 transition-all duration-150 hover:-translate-y-0.5 group" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid={`recommended-deal-${deal.deal_id}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
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
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>Facturación</p>
                                <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{t.revenue_range || t.revenue_display || 'N/D'}</p>
                              </div>
                            </div>
                          </Link>
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
                    <div className="flex items-center gap-2 mb-3">
                      <Settings size={14} style={{ color: 'var(--outline)' }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Preferencias de notificación</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Nuevas oportunidades compatibles', channel: 'Email' },
                        { label: 'Respuestas del seller', channel: 'Email + In-app' },
                        { label: 'Cambios de estado en mis procesos', channel: 'In-app' },
                      ].map((pref, i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                          <span className="text-xs" style={{ color: 'var(--on-surface)' }}>{pref.label}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5" style={{ background: 'var(--surface-1)', color: 'var(--outline)' }}>{pref.channel}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] mt-3" style={{ color: 'var(--outline-variant)' }}>La configuración avanzada de canales estará disponible próximamente.</p>
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
                    <Link to="/buyer/onboarding"><button className="w-full py-3 text-xs font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>EDITAR PERFIL DE COMPRADOR</button></Link>
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
                  {/* Progress bar */}
                  <div className="w-full h-1.5 mb-3" style={{ background: 'var(--surface-2)' }}>
                    <div className="h-full transition-all" style={{ background: cert.level === 'certified' ? '#16a34a' : cert.level === 'verified' ? '#d97706' : 'var(--outline)', width: `${cert.score}%` }} />
                  </div>
                  <div className="space-y-1.5">
                    {cert.criteria.map(cr => (
                      <div key={cr.id} className="flex items-center gap-2">
                        {cr.completed ? <CheckCircle2 size={11} style={{ color: '#16a34a' }} /> : <div className="w-[11px] h-[11px] shrink-0" style={{ border: '1.5px solid var(--outline-variant)', borderRadius: '50%' }} />}
                        <span className="text-[10px]" style={{ color: cr.completed ? 'var(--on-surface)' : 'var(--outline)' }}>{cr.label}</span>
                      </div>
                    ))}
                  </div>
                  {cert.level !== 'certified' && (
                    <p className="text-[10px] mt-3" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>
                      Completa los criterios pendientes para obtener el sello de Comprador Certificado. Los sellers ven tu nivel de verificación.
                    </p>
                  )}
                  {cert.level === 'certified' && (
                    <p className="text-[10px] mt-3" style={{ color: '#16a34a', lineHeight: 1.4 }}>
                      Tu perfil tiene el máximo nivel de verificación. Los sellers pueden confiar en tu seriedad como comprador.
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
                    <PlanFeatureRow label="Ver detalle completo" enabled={planInfo.can_view_full_detail} />
                    <PlanFeatureRow label="Gestionar interacciones" enabled={planInfo.can_manage_interactions} />
                    <PlanFeatureRow label="Acceso a Data Room" enabled={planInfo.can_access_dataroom} />
                    <PlanFeatureRow label="Acceso prioritario" enabled={planInfo.priority_access} />
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
                    <Link to={`/planes?role=buyer&source=buyer_dashboard`}>
                      <button className="w-full py-2 text-[10px] font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
                        MEJORAR A {planInfo.next_plan?.toUpperCase()}
                      </button>
                    </Link>
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
const ProcessCard = ({ proc, isFree }) => {
  const stage = stageConfig[proc.stage] || { label: proc.stage, color: 'text-slate-600', bg: 'var(--surface-1)', icon: FileText };
  const StageIcon = stage.icon;
  const isBlocked = isFree && proc.stage !== 'REJECTED';
  return (
    <div className="transition-all duration-150 hover:-translate-y-0.5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid={`process-${proc.engagement_id}`}>
      <Link to={`/explorar/${proc.deal_id}`} className="block p-5 group">
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
      </Link>
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

const PlanFeatureRow = ({ label, enabled }) => (
  <div className="flex items-center gap-2">
    {enabled ? <CheckCircle2 size={11} style={{ color: '#16a34a' }} /> : <Lock size={11} style={{ color: 'var(--outline-variant)' }} />}
    <span className="text-[10px]" style={{ color: enabled ? 'var(--on-surface)' : 'var(--outline)' }}>{label}</span>
  </div>
);

export default BuyerDashboard;
