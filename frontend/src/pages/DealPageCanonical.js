import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDealPresentation } from '../hooks/useDealPresentation';
import Layout from '../components/layout/Layout';
import { fmtES, fmtMillions } from '../utils/formatES';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
  ArrowLeft, Loader2, Shield, Star, Lock, ArrowRight, Check, Clock,
  Building2, MapPin, Users, Calendar, TrendingUp, BarChart3, FileText,
  Briefcase, Eye, Target, HelpCircle, AlertTriangle, ChevronRight,
  FolderOpen, MessageSquare, Bookmark, Send, ExternalLink, Image,
  Download, Info
} from 'lucide-react';

const NAV_SECTIONS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'financieros', label: 'Financieros' },
  { id: 'infomemo', label: 'Infomemo' },
  { id: 'dataroom', label: 'Data Room' },
  { id: 'proceso', label: 'Proceso' },
];

const TOOLTIP_MAP = {
  contact: 'El vendedor ha aceptado tu solicitud de contacto y puedes acceder al teaser.',
  nda: 'El NDA es un acuerdo de confidencialidad mutuo que desbloquea el acceso completo.',
  interest: 'Enviar una expresion de interes inicia el proceso de evaluacion con el seller.',
  loi: 'La Letter of Intent es una oferta indicativa no vinculante.',
};

/* ═══ Locked module overlay ═══ */
const LockedOverlay = ({ mod, navigate }) => {
  if (!mod || mod.state === 'open' || mod.state === 'preview' || mod.state === 'hidden_only_if_no_data') return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(249,249,249,0.88)' }}>
      <div className="text-center p-5 max-w-xs">
        <Lock size={14} className="mx-auto mb-2" style={{ color: 'var(--outline)' }} />
        <p className="text-[11px] font-bold mb-1" style={{ color: 'var(--on-surface)' }}>{mod.cta_label}</p>
        <p className="text-[10px] mb-3" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>{mod.cta_description}</p>
        <button onClick={() => {
          if (mod.cta_action?.includes('upgrade')) navigate('/planes?role=buyer');
          else if (mod.cta_action === 'sign_nda') { /* scroll to NDA action */ }
          else if (mod.cta_action === 'contact_request') { /* trigger contact */ }
        }} className="px-5 py-2 text-[10px] font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>
          {mod.cta_label}
        </button>
      </div>
    </div>
  );
};

/* ═══ Module container ═══ */
const Mod = ({ id, modules, children, className = '', onNavigate }) => {
  const mod = modules?.[id];
  if (!mod || mod.state === 'hidden_only_if_no_data') return null;
  const locked = !['open', 'preview'].includes(mod.state);
  return (
    <div className={`relative ${className}`} data-testid={`module-${id}`} style={{ minHeight: locked ? 120 : 'auto' }}>
      {locked && <LockedOverlay mod={mod} navigate={onNavigate} />}
      <div style={locked ? { opacity: 0.35, pointerEvents: 'none' } : {}}>{children}</div>
    </div>
  );
};

/* ═══ Process step with tooltip ═══ */
const ProcessStep = ({ step }) => {
  const [showTip, setShowTip] = useState(false);
  const colors = { completed: '#16a34a', pending: '#d97706', available: 'var(--arroba-primary)', locked: 'var(--outline-variant)' };
  const labels = { completed: 'Completado', pending: 'Pendiente', available: 'Disponible', locked: 'Bloqueado' };
  const icons = { completed: Check, pending: Clock, available: ChevronRight, locked: Lock };
  const Icon = icons[step.status];
  return (
    <div className="relative" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <div className="flex items-center gap-3 py-2 px-3" style={{ background: step.status === 'completed' ? 'rgba(22,163,74,0.04)' : 'transparent' }}>
        <div className="w-6 h-6 flex items-center justify-center shrink-0" style={{ background: colors[step.status] + '18' }}>
          <Icon size={11} style={{ color: colors[step.status] }} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-bold" style={{ color: step.status === 'locked' ? 'var(--outline-variant)' : 'var(--on-surface)' }}>{step.label}</p>
          <p className="text-[9px]" style={{ color: 'var(--outline)' }}>{labels[step.status]}</p>
        </div>
      </div>
      {showTip && TOOLTIP_MAP[step.step] && (
        <div className="absolute left-0 right-0 top-full z-20 p-3 text-[10px]" style={{ background: 'var(--on-surface)', color: '#fff', lineHeight: 1.5 }}>
          {TOOLTIP_MAP[step.step]}
        </div>
      )}
    </div>
  );
};

/* ═══ MAIN PAGE ═══ */
const DealPageCanonical = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { presentation: p, loading, error, contactLoading, requestContact, refresh } = useDealPresentation(dealId);
  const [activeNav, setActiveNav] = useState('resumen');
  const sectionRefs = useRef({});

  const scrollTo = (id) => {
    setActiveNav(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActiveNav(e.target.dataset.section); });
    }, { rootMargin: '-100px 0px -60% 0px' });
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [p]);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div></Layout>;
  if (error || !p) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><p className="text-sm" style={{ color: 'var(--outline)' }}>{error || 'Deal no encontrado'}</p></div></Layout>;

  const { modules: mods, deal_summary: ds, financial_data: fd, qualitative_data: qd, actions_panel: ap, process_timeline: tl } = p;

  const handlePrimaryCta = () => {
    const a = p.primary_cta?.action;
    if (a === 'contact_request') requestContact();
    else if (a === 'sign_nda') navigate(`/explorar/${dealId}?action=nda`);
  };

  const handleAction = (key) => {
    if (key === 'view_infomemo' || key === 'send_interest') scrollTo('infomemo');
    else if (key === 'dataroom') scrollTo('dataroom');
    else if (key === 'submit_questions') navigate(`/qa/${dealId}`);
    else if (key === 'save_deal') { /* save logic */ }
    else if (key === 'send_loi') navigate(`/explorar/${dealId}?action=loi`);
    else if (key === 'sign_nda') navigate(`/explorar/${dealId}?action=nda`);
    else if (key === 'premium_analysis') navigate('/planes?role=buyer');
  };

  // Chart data
  const chartData = fd?.years ? [...fd.years].reverse().map(y => ({
    year: String(y.year),
    revenue: Math.round((y.revenue || 0) / 1000),
    ebitda: Math.round((y.ebitda || 0) / 1000),
    margin: y.ebitda_margin || 0,
  })) : [];

  return (
    <Layout showFooter={false}>
      {/* Breadcrumb */}
      <div className="px-6 py-2 flex items-center gap-2 text-[10px]" style={{ background: 'var(--surface-1)', color: 'var(--outline)' }}>
        <Link to="/explorar" className="hover:underline">Marketplace</Link>
        <span>/</span>
        <span className="font-bold" style={{ color: 'var(--on-surface)' }}>{ds?.title || 'Deal'}</span>
        <span className="ml-auto text-[9px] font-bold px-2 py-0.5" style={{ background: p.buyer_tier === 'pro+' ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', color: p.buyer_tier === 'pro+' ? 'var(--arroba-primary)' : 'var(--outline)' }}>
          {p.buyer_tier?.toUpperCase()}
        </span>
      </div>

      {/* Sticky subnav */}
      <nav className="sticky top-0 z-30 px-6 flex gap-1" style={{ background: 'var(--surface-lowest)', borderBottom: '1px solid var(--surface-2)' }} data-testid="deal-subnav">
        {NAV_SECTIONS.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)}
            className="px-4 py-3 text-[11px] font-bold transition-all relative"
            style={{ color: activeNav === s.id ? 'var(--on-surface)' : 'var(--outline)' }}>
            {s.label}
            {activeNav === s.id && <span className="absolute bottom-0 left-2 right-2 h-[2px]" style={{ background: 'var(--on-surface)' }} />}
          </button>
        ))}
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8" data-testid="deal-page-canonical">
        {/* ═══ MAIN (3 cols) ═══ */}
        <div className="lg:col-span-3 space-y-6">

          {/* ── SECTION: RESUMEN ── */}
          <div ref={el => sectionRefs.current['resumen'] = el} data-section="resumen">
            {/* Hero */}
            <Mod id="hero" modules={mods} onNavigate={navigate} onNavigate={navigate}>
              <div className="p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
                <div className="flex items-start gap-5">
                  {ds?.logo_url ? (
                    <img src={ds.logo_url} alt="" className="w-16 h-16 object-contain shrink-0" style={{ background: 'var(--surface-1)', padding: 4 }} />
                  ) : ds?.screenshots?.length ? (
                    <div className="w-16 h-16 shrink-0 overflow-hidden" style={{ background: 'var(--surface-1)' }}>
                      <img src={ds.screenshots[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 shrink-0 flex items-center justify-center" style={{ background: 'var(--surface-1)' }}><Building2 size={20} style={{ color: 'var(--outline-variant)' }} /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {ds?.sector && <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'rgba(182,33,42,0.06)', color: 'var(--arroba-primary)' }}>{ds.sector}</span>}
                      {ds?.subcategory && <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>{ds.subcategory}</span>}
                      {ds?.operation_types?.map(t => <span key={t} className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>{t.replace(/_/g, ' ').toUpperCase()}</span>)}
                      {ds?.status === 'exclusivity' && <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: '#d97706', color: '#fff' }}>EXCLUSIVIDAD</span>}
                    </div>
                    <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{ds?.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--outline)' }}>
                      {ds?.city && <span className="flex items-center gap-1"><MapPin size={11} />{ds.city}{ds?.province ? `, ${ds.province}` : ''}</span>}
                      {ds?.employees && <span className="flex items-center gap-1"><Users size={11} />{ds.employees} empleados</span>}
                      {ds?.founded_year && <span className="flex items-center gap-1"><Calendar size={11} />Fundada en {ds.founded_year}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </Mod>

            {/* Executive summary */}
            <Mod id="executive_summary" modules={mods} onNavigate={navigate} className="mt-6">
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>RESUMEN EJECUTIVO</p>
                <p className="text-sm mb-4" style={{ color: 'var(--on-surface)', lineHeight: 1.7 }}>{ds?.description}</p>
                {ds?.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--surface-2)' }}>
                    {ds.highlights.map((h, i) => <span key={i} className="text-[10px] font-bold px-3 py-1" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>{h}</span>)}
                  </div>
                )}
              </div>
            </Mod>

            {/* Snapshot */}
            <Mod id="business_snapshot" modules={mods} onNavigate={navigate} className="mt-6">
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>SNAPSHOT DE NEGOCIO</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {ds?.revenue ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>FACTURACION {ds.year}</p><p className="text-xl font-black" style={{ color: 'var(--on-surface)' }}>{fmtMillions(ds.revenue)}</p></div> : null}
                  {ds?.ebitda ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>EBITDA {ds.year}</p><p className="text-xl font-black" style={{ color: 'var(--on-surface)' }}>{fmtMillions(ds.ebitda)}</p></div> : null}
                  {ds?.ebitda_margin ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>MARGEN EBITDA</p><p className="text-xl font-black" style={{ color: 'var(--on-surface)' }}>{fmtES(ds.ebitda_margin, 1)}%</p></div> : null}
                  {ds?.asking_price ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--arroba-primary)' }}>ASKING PRICE</p><p className="text-xl font-black" style={{ color: 'var(--arroba-primary)' }}>{fmtMillions(ds.asking_price)}</p></div> : null}
                  {ds?.employees ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>EMPLEADOS</p><p className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{ds.employees}</p></div> : null}
                  {ds?.founded_year ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>FUNDACION</p><p className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{ds.founded_year}</p></div> : null}
                  {qd?.recurring_revenue_pct ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>RECURRENCIA</p><p className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{qd.recurring_revenue_pct}%</p></div> : null}
                  {qd?.client_concentration_top5 ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>CONCENTRACION TOP 5</p><p className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{qd.client_concentration_top5}%</p></div> : null}
                </div>
              </div>
            </Mod>

            {/* Visual assets */}
            <Mod id="visual_assets" modules={mods} onNavigate={navigate} className="mt-6">
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ACTIVOS VISUALES</p>
                <div className="flex gap-4">
                  {ds?.logo_url && <img src={ds.logo_url} alt="Logo" className="h-20 object-contain" style={{ background: 'var(--surface-1)', padding: 8 }} />}
                  {ds?.screenshots?.map((s, i) => <img key={i} src={s} alt={`Screenshot ${i+1}`} className="h-20 object-cover" style={{ maxWidth: 200 }} />)}
                  {!ds?.logo_url && !ds?.screenshots?.length && <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--outline)' }}><Image size={14} /> Sin activos visuales disponibles</div>}
                </div>
              </div>
            </Mod>

            {/* Qualitative */}
            <Mod id="qualitative" modules={mods} onNavigate={navigate} className="mt-6">
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>POSICIONAMIENTO Y CUALITATIVOS</p>
                <div className="grid grid-cols-2 gap-4">
                  {qd?.founder_dependency && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>DEPENDENCIA FUNDADOR</p><p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{qd.founder_dependency === 'low' ? 'Baja' : qd.founder_dependency === 'high' ? 'Alta' : 'Media'}</p></div>}
                  {qd?.recurring_revenue_pct && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>INGRESOS RECURRENTES</p><p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{qd.recurring_revenue_pct}%</p></div>}
                  {qd?.client_diversification && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>DIVERSIFICACION</p><p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{qd.client_diversification === 'high' ? 'Alta' : qd.client_diversification === 'low' ? 'Baja' : 'Media'}</p></div>}
                  {qd?.margin_stability && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>ESTABILIDAD MARGENES</p><p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{qd.margin_stability === 'stable' ? 'Estables' : qd.margin_stability === 'improving' ? 'Mejorando' : 'Empeorando'}</p></div>}
                </div>
                {qd?.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-3 pt-3" style={{ borderTop: '1px solid var(--surface-2)' }}>{qd.tags.map((t, i) => <span key={i} className="text-[8px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>{t}</span>)}</div>}
              </div>
            </Mod>
          </div>

          {/* ── SECTION: FINANCIEROS ── */}
          <div ref={el => sectionRefs.current['financieros'] = el} data-section="financieros" className="space-y-6">
            {/* Charts */}
            <Mod id="charts" modules={mods} onNavigate={navigate}>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>EVOLUCION FINANCIERA</p>
                {chartData.length >= 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[9px] font-bold mb-2" style={{ color: 'var(--outline)' }}>INGRESOS (K EUR)</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-2)" />
                          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--outline)' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'var(--outline)' }} />
                          <RTooltip formatter={(v) => `${fmtES(v, 0)}K`} />
                          <Bar dataKey="revenue" fill="var(--on-surface)" radius={0} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold mb-2" style={{ color: 'var(--outline)' }}>EBITDA (K EUR)</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-2)" />
                          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--outline)' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'var(--outline)' }} />
                          <RTooltip formatter={(v) => `${fmtES(v, 0)}K`} />
                          <Bar dataKey="ebitda" fill="var(--arroba-primary)" radius={0} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {fd?.cagr && Object.keys(fd.cagr).length > 0 && (
                  <div className="flex gap-6 mt-4 pt-3" style={{ borderTop: '1px solid var(--surface-2)' }}>
                    {fd.cagr.revenue != null && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>CAGR INGRESOS</p><p className="text-sm font-black" style={{ color: fd.cagr.revenue >= 0 ? '#16a34a' : '#dc2626' }}>{fd.cagr.revenue > 0 ? '+' : ''}{fmtES(fd.cagr.revenue, 1)}%</p></div>}
                    {fd.cagr.ebitda != null && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>CAGR EBITDA</p><p className="text-sm font-black" style={{ color: fd.cagr.ebitda >= 0 ? '#16a34a' : '#dc2626' }}>{fd.cagr.ebitda > 0 ? '+' : ''}{fmtES(fd.cagr.ebitda, 1)}%</p></div>}
                  </div>
                )}
              </div>
            </Mod>

            {/* Financial evolution table */}
            <Mod id="financial_evolution" modules={mods} onNavigate={navigate}>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>TABLA FINANCIERA COMPARATIVA</p>
                {fd?.years && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs"><thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}><th className="text-left py-2 pr-4 font-bold" style={{ color: 'var(--outline)' }}>PARTIDA</th>{fd.years.map(y => <th key={y.year} className="text-right py-2 px-3 font-bold" style={{ color: 'var(--on-surface)' }}>{y.year}</th>)}</tr></thead><tbody>
                      <tr style={{ borderBottom: '1px solid var(--surface-2)' }}><td className="py-2 font-semibold">Facturacion</td>{fd.years.map(y => <td key={y.year} className="text-right px-3 font-bold">{y.revenue ? fmtES(y.revenue, 0) : '—'}</td>)}</tr>
                      <tr style={{ borderBottom: '1px solid var(--surface-2)' }}><td className="py-2 font-semibold">EBITDA</td>{fd.years.map(y => <td key={y.year} className="text-right px-3 font-bold" style={{ color: (y.ebitda||0) < 0 ? '#dc2626' : 'inherit' }}>{y.ebitda ? fmtES(y.ebitda, 0) : '—'}</td>)}</tr>
                      <tr><td className="py-2 font-semibold">Margen EBITDA</td>{fd.years.map(y => <td key={y.year} className="text-right px-3" style={{ color: 'var(--outline)' }}>{y.ebitda_margin ? `${fmtES(y.ebitda_margin, 1)}%` : '—'}</td>)}</tr>
                    </tbody></table>
                  </div>
                )}
              </div>
            </Mod>

            {/* PnL */}
            <Mod id="pnl" modules={mods} onNavigate={navigate}>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>CUENTA DE RESULTADOS</p>
                {fd?.years?.[0]?.pnl ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs"><thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}><th className="text-left py-2 pr-4 font-bold" style={{ color: 'var(--outline)' }}>PARTIDA</th>{fd.years.filter(y=>y.pnl).map(y => <th key={y.year} className="text-right py-2 px-3 font-bold">{y.year}</th>)}</tr></thead><tbody>
                      {['revenue','supplies','gross_margin','personnel_expenses','operating_expenses','ebitda','depreciation','operating_result','net_result'].map(k => {
                        const labels = {revenue:'Ingresos',supplies:'Aprovisionamientos',gross_margin:'Margen bruto',personnel_expenses:'Gastos de personal',operating_expenses:'Otros gastos',ebitda:'EBITDA',depreciation:'Amortizacion',operating_result:'Resultado explotacion',net_result:'Resultado ejercicio'};
                        const bold = ['revenue','gross_margin','ebitda','net_result'].includes(k);
                        return <tr key={k} style={{ borderBottom: '1px solid var(--surface-2)' }}><td className={`py-1.5 ${bold?'font-bold':'font-medium'}`} style={{ color: bold?'var(--on-surface)':'var(--on-surface-variant)' }}>{labels[k]}</td>{fd.years.filter(y=>y.pnl).map(y => <td key={y.year} className={`text-right px-3 ${bold?'font-bold':''}`} style={{ color: (y.pnl?.[k]||0)<0?'#dc2626':'inherit' }}>{y.pnl?.[k] != null ? fmtES(y.pnl[k], 0) : '—'}</td>)}</tr>;
                      })}
                    </tbody></table>
                  </div>
                ) : (
                  <div className="text-center py-6"><p className="text-[10px]" style={{ color: 'var(--outline)' }}>Ingresos, aprovisionamientos, margen bruto, gastos de personal, EBITDA, resultado del ejercicio.</p></div>
                )}
              </div>
            </Mod>

            {/* Balance */}
            <Mod id="balance" modules={mods} onNavigate={navigate}>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>BALANCE RESUMIDO</p>
                {fd?.years?.[0]?.balance ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs"><thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}><th className="text-left py-2 pr-4 font-bold" style={{ color: 'var(--outline)' }}>PARTIDA</th>{fd.years.filter(y=>y.balance).map(y => <th key={y.year} className="text-right py-2 px-3 font-bold">{y.year}</th>)}</tr></thead><tbody>
                      {['non_current_assets','current_assets','equity','non_current_liabilities','current_liabilities'].map(k => {
                        const labels = {non_current_assets:'Activo no corriente',current_assets:'Activo corriente',equity:'Patrimonio neto',non_current_liabilities:'Pasivo no corriente',current_liabilities:'Pasivo corriente'};
                        return <tr key={k} style={{ borderBottom: '1px solid var(--surface-2)' }}><td className="py-1.5 font-medium">{labels[k]}</td>{fd.years.filter(y=>y.balance).map(y => <td key={y.year} className="text-right px-3">{y.balance?.[k] != null ? fmtES(y.balance[k], 0) : '—'}</td>)}</tr>;
                      })}
                    </tbody></table>
                  </div>
                ) : (
                  <div className="text-center py-6"><p className="text-[10px]" style={{ color: 'var(--outline)' }}>Activo corriente/no corriente, pasivo, patrimonio neto.</p></div>
                )}
              </div>
            </Mod>
          </div>

          {/* ── SECTION: INFOMEMO ── */}
          <div ref={el => sectionRefs.current['infomemo'] = el} data-section="infomemo">
            <Mod id="infomemo" modules={mods} onNavigate={navigate}>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', borderLeft: '3px solid var(--arroba-primary)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="label-arroba" style={{ color: 'var(--arroba-primary)' }}>INFORMATION MEMORANDUM</p>
                  {mods?.infomemo?.state === 'open' && <button className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}><Download size={10} /> DESCARGAR</button>}
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--on-surface)', lineHeight: 1.7 }}>Documento completo con analisis detallado de la oportunidad, metricas financieras, posicionamiento competitivo y estructura de la transaccion.</p>
                {mods?.infomemo?.state === 'open' && <div className="p-3" style={{ background: 'var(--surface-1)' }}><p className="text-[10px]" style={{ color: 'var(--outline)' }}>Generado el {new Date().toLocaleDateString('es-ES')} · Version 1</p></div>}
              </div>
            </Mod>
          </div>

          {/* ── SECTION: DATAROOM ── */}
          <div ref={el => sectionRefs.current['dataroom'] = el} data-section="dataroom">
            <Mod id="dataroom" modules={mods} onNavigate={navigate}>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <div className="flex items-center gap-2 mb-3"><FolderOpen size={14} style={{ color: 'var(--outline)' }} /><p className="label-arroba" style={{ color: 'var(--outline)' }}>DATA ROOM</p></div>
                <p className="text-sm mb-3" style={{ color: 'var(--on-surface)' }}>Documentacion confidencial del proceso de transaccion.</p>
                {mods?.dataroom?.state === 'open' && <button className="px-4 py-2 text-[10px] font-bold flex items-center gap-2" style={{ background: 'var(--on-surface)', color: '#fff' }}><FolderOpen size={10} /> ACCEDER AL DATA ROOM</button>}
              </div>
            </Mod>
          </div>

          {/* ── SECTION: PROCESO ── */}
          <div ref={el => sectionRefs.current['proceso'] = el} data-section="proceso">
            {/* Premium analysis */}
            <Mod id="premium_analysis" modules={mods} onNavigate={navigate}>
              <div className="p-5" style={{ background: 'rgba(182,33,42,0.02)', borderLeft: '3px solid var(--arroba-primary)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>ANALISIS PREMIUM PRO+</p>
                <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>Fortalezas, riesgos, preguntas sugeridas para due diligence y encaje con tu tesis de inversion. Generado por IA.</p>
              </div>
            </Mod>
          </div>

          {/* Trust footer */}
          <Mod id="trust_footer" modules={mods} onNavigate={navigate} className="mt-4">
            <div className="p-4 flex items-center justify-between" style={{ background: 'var(--surface-1)' }}>
              <div className="flex items-center gap-3 text-[9px]" style={{ color: 'var(--outline)' }}>
                <Shield size={10} /><span>Informacion anonimizada · Fuente: {fd?.source || 'ARROBA'} · Completitud: {p.content_richness_score}%</span>
              </div>
              <span className="text-[9px]" style={{ color: 'var(--outline)' }}>BUD Advisors, S.L.</span>
            </div>
          </Mod>
        </div>

        {/* ═══ SIDEBAR ═══ */}
        <div className="lg:col-span-1">
          <div className="sticky top-14 space-y-4">
            {/* CTA */}
            <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <div className="flex items-center gap-2 mb-3">
                {p.visibility_state === 'OPERATIVE_ACCESS' ? <Check size={12} style={{ color: '#16a34a' }} /> : p.visibility_state === 'CONTACT_REQUESTED' ? <Clock size={12} style={{ color: '#d97706' }} /> : <Shield size={12} style={{ color: 'var(--arroba-primary)' }} />}
                <span className="text-[10px] font-bold" style={{ color: p.visibility_state === 'OPERATIVE_ACCESS' ? '#16a34a' : 'var(--on-surface)' }}>
                  {{OPERATIVE_ACCESS:'Acceso operativo',NDA_AVAILABLE:'NDA disponible',CONTACT_REQUESTED:'Solicitud pendiente',TEASER_UNLOCKED:'Teaser desbloqueado',LOCKED_CONTACT_REQUIRED:'Contacto requerido'}[p.visibility_state]}
                </span>
              </div>
              <button onClick={handlePrimaryCta} disabled={p.primary_cta?.style === 'disabled' || contactLoading} className="w-full py-3 text-[11px] font-bold flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: p.primary_cta?.style === 'disabled' ? 'var(--surface-2)' : p.primary_cta?.style?.includes('premium') ? 'var(--arroba-primary)' : 'var(--on-surface)', color: p.primary_cta?.style === 'disabled' ? 'var(--outline)' : '#fff' }} data-testid="deal-primary-cta">
                {contactLoading ? 'Enviando...' : p.primary_cta?.label} {p.primary_cta?.style !== 'disabled' && !contactLoading && <ArrowRight size={11} />}
              </button>
              {p.primary_cta?.description && <p className="text-[10px] mt-2" style={{ color: 'var(--outline)' }}>{p.primary_cta.description}</p>}
              {p.secondary_cta && <button className="w-full py-2 mt-2 text-[10px] font-bold" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>{p.secondary_cta.label}</button>}
            </div>

            {/* Process timeline with tooltips */}
            {tl?.length > 0 && (
              <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ESTADO DEL PROCESO</p>
                <div className="space-y-0.5">{tl.map(s => <ProcessStep key={s.step} step={s} />)}</div>
              </div>
            )}

            {/* Actions — all clickable */}
            {ap && (
              <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>SIGUIENTES ACCIONES</p>
                {ap.recommended?.map(a => (
                  <button key={a.key} onClick={() => handleAction(a.key)} className="w-full flex items-center gap-2 p-2 mb-1 text-left transition-all hover:translate-x-0.5" style={{ background: 'rgba(182,33,42,0.04)', borderLeft: '2px solid var(--arroba-primary)' }}>
                    <Star size={10} style={{ color: 'var(--arroba-primary)' }} />
                    <span className="text-[10px] font-bold" style={{ color: 'var(--arroba-primary)' }}>{a.label}</span>
                    <ArrowRight size={9} className="ml-auto" style={{ color: 'var(--arroba-primary)' }} />
                  </button>
                ))}
                {ap.available?.map(a => (
                  <button key={a.key} onClick={() => handleAction(a.key)} className="w-full flex items-center gap-2 p-2 mb-1 text-left transition-all hover:translate-x-0.5">
                    <Check size={10} style={{ color: '#16a34a' }} />
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--on-surface)' }}>{a.label}</span>
                    <ArrowRight size={9} className="ml-auto" style={{ color: 'var(--outline)' }} />
                  </button>
                ))}
                {ap.blocked?.map(a => (
                  <button key={a.key} onClick={() => { if (a.upgrade) navigate('/planes?role=buyer'); }} className="w-full flex items-center gap-2 p-2 mb-1 text-left opacity-60 hover:opacity-80">
                    <Lock size={10} style={{ color: 'var(--outline)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{a.label}</span>
                    {a.upgrade && <span className="text-[8px] font-bold ml-auto" style={{ color: 'var(--arroba-primary)' }}>{a.upgrade.toUpperCase()}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DealPageCanonical;
