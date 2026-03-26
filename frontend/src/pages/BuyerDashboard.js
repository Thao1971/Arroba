import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { marketplaceAPI, matchingAPI, engagementsAPI, ndaAPI } from '../services/api';
import {
  TrendingUp, Search, FileText, ArrowRight, Building2,
  Sparkles, MapPin, Zap, ChevronRight, Send, FileSignature, Shield,
  Star, Lock, AlertCircle, MessageSquare, CheckCircle2,
  FolderOpen, Eye, Database, ArrowUpRight
} from 'lucide-react';

/* ─── Stage config ─── */
const stageConfig = {
  SUBMITTED: { label: 'Enviado', color: 'text-blue-700', bg: 'rgba(59,130,246,0.06)', icon: Send },
  VIEWED: { label: 'Visto por seller', color: 'text-amber-700', bg: 'rgba(217,119,6,0.06)', icon: Eye },
  ACCEPTED: { label: 'Aceptado', color: 'text-teal-700', bg: 'rgba(20,184,166,0.06)', icon: CheckCircle2 },
  SHORTLISTED: { label: 'En Shortlist', color: 'text-green-700', bg: 'rgba(22,163,74,0.06)', icon: Star },
  REJECTED: { label: 'No seleccionado', color: 'text-red-600', bg: 'rgba(220,38,38,0.05)', icon: AlertCircle },
  EXCLUSIVITY: { label: 'En Exclusividad', color: 'text-indigo-700', bg: 'rgba(79,70,229,0.06)', icon: Lock },
};

/* ─── Plan tier detection ─── */
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

/* ═══════════════════════════════════════════
   BUYER DASHBOARD — FASE 1
   ═══════════════════════════════════════════ */
const BuyerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendedDeals, setRecommendedDeals] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [ndaCount, setNdaCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  const planTier = getPlanTier(user);
  const plan = planLabels[planTier];
  const isFree = planTier === 'free';
  const interactionLimit = planTier === 'free' ? 0 : planTier === 'pro' ? 5 : -1;
  const interactionsUsed = 0; // future: from backend

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, processRes] = await Promise.all([
          marketplaceAPI.getStats(),
          engagementsAPI.getMyProcesses().catch(() => ({ data: { processes: [] } })),
        ]);
        setStats(statsRes.data);
        setProcesses(processRes.data.processes || []);

        // Parallel non-critical fetches
        Promise.all([
          matchingAPI.getRecommendedDeals().then(r => {
            setRecommendedDeals(r.data.deals || []);
            setProfileComplete(r.data.profile_complete || false);
          }).catch(() => setProfileComplete(false)),
          ndaAPI.mySignatures().then(r => setNdaCount(r.data?.length || 0)).catch(() => {}),
          engagementsAPI.getSaved?.().then(r => setSavedCount(r.data?.total || r.data?.deals?.length || 0)).catch(() => {}),
        ]);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-6 h-6 animate-spin" style={{ border: '2px solid var(--surface-2)', borderTopColor: 'var(--arroba-primary)', borderRadius: '50%' }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ background: 'var(--surface-0)', minHeight: '100vh' }} data-testid="buyer-dashboard">
        <div className="container mx-auto px-6 py-8">

          {/* ─── EXECUTIVE HEADER ─── */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
            <div>
              <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>PANEL DE COMPRADOR</p>
              <h1 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                Hola, {user?.first_name || 'Inversor'}
              </h1>
              <p className="text-sm" style={{ color: 'var(--outline)' }}>
                {processes.length > 0
                  ? `${processes.length} proceso${processes.length !== 1 ? 's' : ''} activo${processes.length !== 1 ? 's' : ''} · ${ndaCount} NDA${ndaCount !== 1 ? 's' : ''} firmado${ndaCount !== 1 ? 's' : ''}`
                  : 'Explora oportunidades y activa tu primer proceso'
                }
              </p>
            </div>

            {/* Plan badge + upgrade */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: plan.bg }}>
                <span className="text-[10px] font-bold" style={{ color: plan.color }}>{plan.label}</span>
                {interactionLimit >= 0 && (
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--outline)' }}>
                    · {interactionLimit === 0 ? 'Sin interacciones' : `${interactionsUsed}/${interactionLimit} interacciones`}
                  </span>
                )}
                {interactionLimit === -1 && (
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--arroba-primary)' }}>· Ilimitadas</span>
                )}
              </div>
              {isFree && (
                <Link to="/planes?role=buyer&source=buyer_dashboard">
                  <button className="px-4 py-2 text-[11px] font-bold flex items-center gap-1.5"
                    style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="upgrade-plan-btn">
                    MEJORAR PLAN <ArrowRight size={12} />
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* ─── PROFILE ALERT ─── */}
          {!profileComplete && (
            <div className="mb-8 p-5 flex items-center justify-between gap-4" style={{ background: 'rgba(182,33,42,0.04)', borderLeft: '3px solid var(--arroba-primary)' }} data-testid="profile-alert">
              <div className="flex items-center gap-3">
                <Building2 size={18} style={{ color: 'var(--arroba-primary)' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Completa tu perfil de comprador</p>
                  <p className="text-xs" style={{ color: 'var(--outline)' }}>Sin perfil completo no podrás enviar interés, LOI ni ver recomendaciones</p>
                </div>
              </div>
              <Link to="/buyer/onboarding">
                <button className="px-5 py-2 text-xs font-bold whitespace-nowrap" style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="complete-profile-btn">
                  COMPLETAR PERFIL
                </button>
              </Link>
            </div>
          )}

          {/* ─── KPIs ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10" data-testid="kpi-grid">
            {[
              { label: 'PROCESOS ACTIVOS', value: processes.filter(p => p.stage !== 'REJECTED').length, icon: FolderOpen },
              { label: 'NDAs FIRMADOS', value: ndaCount, icon: FileSignature },
              { label: 'DEALS GUARDADOS', value: savedCount, icon: Star },
              { label: 'DEALS EN MERCADO', value: stats?.published_deals || 0, icon: Building2 },
              { label: 'RECOMENDADOS', value: recommendedDeals.length, icon: Sparkles },
              { label: 'INTERACCIONES', value: interactionLimit === -1 ? 'Sin límite' : interactionLimit === 0 ? 'Bloqueadas' : `${interactionsUsed}/${interactionLimit}`, icon: Zap, highlight: interactionLimit === 0 },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }} data-testid={`kpi-${kpi.label.toLowerCase().replace(/ /g, '-')}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={13} style={{ color: 'var(--outline)' }} />
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>{kpi.label}</p>
                  </div>
                  <p className={`text-lg font-black ${kpi.highlight ? '' : ''}`} style={{ color: kpi.highlight ? 'var(--arroba-primary)' : 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                    {kpi.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ─── FREE PLAN UPGRADE BANNER ─── */}
          {isFree && processes.length === 0 && (
            <div className="mb-10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }} data-testid="free-upgrade-banner">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                  <Lock size={16} style={{ color: 'var(--on-surface)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Desbloquea el acceso operativo</p>
                  <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>
                    Con el plan Free puedes explorar y guardar oportunidades. Para gestionar interacciones, firmar NDAs y acceder a documentación, activa un plan Pro.
                  </p>
                </div>
              </div>
              <Link to="/planes?role=buyer&source=buyer_dashboard" className="shrink-0">
                <button className="px-6 py-3 text-xs font-bold flex items-center gap-2" style={{ background: 'var(--on-surface)', color: '#fff' }}>
                  VER PLANES PARA BUYERS <ArrowRight size={12} />
                </button>
              </Link>
            </div>
          )}

          {/* ─── MAIN LAYOUT: Content + Rail ─── */}
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ─── LEFT: Mis Procesos ─── */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-extrabold flex items-center gap-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                  Mis procesos activos
                </h2>
                <span className="text-xs font-semibold" style={{ color: 'var(--outline)' }}>
                  {processes.filter(p => p.stage !== 'REJECTED').length} activo{processes.filter(p => p.stage !== 'REJECTED').length !== 1 ? 's' : ''}
                </span>
              </div>

              {processes.length === 0 ? (
                <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }} data-testid="no-processes">
                  <Search size={28} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Aún no tienes procesos activos</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Explora el marketplace y expresa interés en una oportunidad para iniciar tu primer proceso.</p>
                  <Link to="/explorar">
                    <button className="px-6 py-2.5 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>EXPLORAR OPORTUNIDADES</button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4" data-testid="my-processes">
                  {processes.map((proc) => {
                    const stage = stageConfig[proc.stage] || { label: proc.stage, color: 'text-slate-600', bg: 'var(--surface-1)', icon: FileText };
                    const StageIcon = stage.icon;
                    const isBlocked = isFree && proc.stage !== 'REJECTED';

                    return (
                      <div key={proc.engagement_id}
                        className="transition-all duration-150 hover:-translate-y-0.5"
                        style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}
                        data-testid={`process-${proc.engagement_id}`}>

                        {/* Process header */}
                        <Link to={`/explorar/${proc.deal_id}`} className="block p-5 group">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold" style={{ background: stage.bg, color: stage.color }}>
                                  <StageIcon size={10} /> {stage.label}
                                </span>
                                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--outline)' }}>{proc.type}</span>
                              </div>
                              <h3 className="text-sm font-bold group-hover:opacity-80 transition-opacity" style={{ color: 'var(--on-surface)' }}>
                                {proc.deal_title}
                              </h3>
                              <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--outline)' }}>
                                {proc.deal_sector && <span>{proc.deal_sector}</span>}
                                {proc.deal_location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {proc.deal_location}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {proc.valuation_offer && (
                                <p className="text-sm font-black" style={{ color: 'var(--arroba-primary)' }}>
                                  {(proc.valuation_offer / 1e6).toFixed(1).replace('.', ',')}M€
                                </p>
                              )}
                              <ChevronRight size={14} className="mt-1 ml-auto" style={{ color: 'var(--outline-variant)' }} />
                            </div>
                          </div>

                          {/* Next step */}
                          {proc.next_step && proc.stage !== 'REJECTED' && (
                            <div className="pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--surface-1)' }}>
                              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}>
                                <ArrowRight size={10} /> {proc.next_step.action}
                              </span>
                              {proc.conversation_id && (
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/qa/${proc.conversation_id}`; }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase"
                                  style={{ background: 'rgba(0,100,147,0.06)', color: '#004b74' }}
                                  data-testid={`qa-link-${proc.engagement_id}`}>
                                  <MessageSquare size={9} /> Q&A
                                </button>
                              )}
                            </div>
                          )}
                        </Link>

                        {/* Free plan overlay */}
                        {isBlocked && (
                          <div className="px-5 pb-4 pt-0">
                            <div className="p-3 flex items-center gap-3" style={{ background: 'rgba(182,33,42,0.04)' }}>
                              <Lock size={12} style={{ color: 'var(--arroba-primary)' }} />
                              <p className="text-[11px]" style={{ color: 'var(--outline)' }}>
                                <span className="font-bold" style={{ color: 'var(--on-surface)' }}>Detalle limitado.</span>{' '}
                                <Link to="/planes?role=buyer" className="font-bold underline" style={{ color: 'var(--arroba-primary)' }}>Mejora tu plan</Link> para gestionar esta interacción.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ─── RECOMMENDED (compact, below processes) ─── */}
              {profileComplete && recommendedDeals.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Recomendados para ti</h2>
                    <Link to="/explorar" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}>
                      Ver todos <ArrowRight size={10} />
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4" data-testid="recommended-deals-list">
                    {recommendedDeals.slice(0, 4).map((deal) => {
                      const teaser = deal.teaser || {};
                      return (
                        <Link key={deal.deal_id} to={`/explorar/${deal.deal_id}`}
                          className="p-4 block group transition-all duration-150 hover:-translate-y-0.5"
                          style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}
                          data-testid={`recommended-deal-${deal.deal_id}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>
                              {teaser.sector_display || 'Digital'}
                            </span>
                            {deal.match_reason && (
                              <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{deal.match_reason}</span>
                            )}
                          </div>
                          <p className="text-sm font-bold group-hover:opacity-80 transition-opacity truncate" style={{ color: 'var(--on-surface)' }}>
                            {teaser.title || teaser.headline || 'Oportunidad'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--outline)' }}>
                            <span>{teaser.revenue_range || teaser.revenue_display || 'N/D'}</span>
                            <span>{teaser.ebitda_range || teaser.ebitda_display || ''}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ─── RIGHT RAIL ─── */}
            <div className="lg:w-[300px] shrink-0 space-y-5">

              {/* Plan status card */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="plan-status-card">
                <div className="flex items-center justify-between mb-4">
                  <p className="label-arroba" style={{ color: 'var(--outline)', fontSize: 9 }}>TU PLAN</p>
                  <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: plan.bg, color: plan.color }}>{plan.label}</span>
                </div>
                {isFree ? (
                  <>
                    <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Buyer Free</p>
                    <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>
                      Exploración básica. Mejora a Pro para gestionar interacciones y acceder a documentación.
                    </p>
                    <Link to="/planes?role=buyer&source=buyer_dashboard">
                      <button className="w-full py-2.5 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="rail-upgrade-btn">
                        MEJORAR PLAN
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>
                      Buyer {planTier === 'pro+' ? 'Pro+' : 'Pro'}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={12} style={{ color: interactionLimit === -1 ? 'var(--arroba-primary)' : 'var(--outline)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>
                        {interactionLimit === -1 ? 'Interacciones ilimitadas' : `${interactionsUsed}/${interactionLimit} interacciones este mes`}
                      </span>
                    </div>
                    {interactionLimit > 0 && (
                      <div className="w-full h-1.5 mb-3" style={{ background: 'var(--surface-2)' }}>
                        <div className="h-full" style={{ background: 'var(--arroba-primary)', width: `${Math.min((interactionsUsed / interactionLimit) * 100, 100)}%` }} />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Market snapshot */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-4" style={{ color: 'var(--outline)', fontSize: 9 }}>MERCADO</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--outline)' }}>Deals activos</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{stats?.published_deals || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--outline)' }}>Nuevos esta semana</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--arroba-primary)' }}>+{stats?.new_this_week || 0}</span>
                  </div>
                </div>
                <Link to="/explorar" className="flex items-center gap-1 text-xs font-semibold mt-4" style={{ color: 'var(--arroba-primary)' }}>
                  Explorar marketplace <ArrowRight size={10} />
                </Link>
              </div>

              {/* Quick links */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)', fontSize: 9 }}>ACCESOS RÁPIDOS</p>
                <div className="space-y-2">
                  {[
                    { label: 'Explorar oportunidades', href: '/explorar', icon: Search },
                    { label: 'Deals guardados', href: '/buyer/guardados', icon: Star },
                    { label: 'Mis NDAs firmados', href: '#', icon: FileSignature },
                    { label: 'Soporte', href: 'mailto:equipo@arroba.es', icon: Shield },
                  ].map((link, i) => (
                    <Link key={i} to={link.href} className="flex items-center gap-2.5 py-1.5 group">
                      <link.icon size={13} style={{ color: 'var(--outline)' }} />
                      <span className="text-xs font-semibold group-hover:opacity-70 transition-opacity" style={{ color: 'var(--on-surface)' }}>{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerDashboard;
