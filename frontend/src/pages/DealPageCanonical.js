import React, { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDealPresentation } from '../hooks/useDealPresentation';
import { fmtES, fmtMillions } from '../utils/formatES';
import {
  ArrowLeft, Loader2, Shield, Star, Lock, ArrowRight, Check, Clock,
  Building2, MapPin, Users, Calendar, TrendingUp, BarChart3, FileText,
  Briefcase, Eye, Target, HelpCircle, AlertTriangle, ChevronRight,
  FolderOpen, MessageSquare, Bookmark, Send, ExternalLink
} from 'lucide-react';

/* ─── Locked Module Shell ─── */
const LockedModule = ({ headline, mod, children }) => {
  const navigate = useNavigate();
  if (!mod || mod.state === 'hidden_only_if_no_data') return null;
  if (mod.state === 'open' || mod.state === 'preview') return children;

  return (
    <div className="relative" data-testid={`module-locked-${headline?.toLowerCase().replace(/\s/g,'-')}`}>
      <div style={{ opacity: 0.5, pointerEvents: 'none' }}>{children}</div>
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(249,249,249,0.85)' }}>
        <div className="text-center p-6 max-w-sm">
          <Lock size={16} className="mx-auto mb-2" style={{ color: 'var(--outline)' }} />
          <p className="text-xs font-bold mb-1" style={{ color: 'var(--on-surface)' }}>{mod.cta_label || headline}</p>
          <p className="text-[10px] mb-3" style={{ color: 'var(--outline)' }}>{mod.cta_description}</p>
          <button
            onClick={() => {
              if (mod.cta_action === 'upgrade_pro' || mod.cta_action === 'upgrade_pro+') navigate('/planes?role=buyer');
              else if (mod.cta_action === 'sign_nda') navigate(`?action=nda`);
            }}
            className="px-4 py-2 text-[10px] font-bold"
            style={{ background: 'var(--on-surface)', color: '#fff' }}
          >
            {mod.cta_label || 'DESBLOQUEAR'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Module Wrapper ─── */
const Module = ({ id, modules, children, className = '' }) => {
  const mod = modules?.[id];
  if (!mod || mod.state === 'hidden_only_if_no_data') return null;
  return (
    <LockedModule headline={mod.headline} mod={mod}>
      <div className={className} data-testid={`module-${id}`}>{children}</div>
    </LockedModule>
  );
};

/* ─── Timeline Step ─── */
const TimelineStep = ({ step, isLast }) => {
  const colors = { completed: '#16a34a', pending: '#d97706', available: 'var(--arroba-primary)', locked: 'var(--outline-variant)' };
  const icons = { completed: Check, pending: Clock, available: ChevronRight, locked: Lock };
  const Icon = icons[step.status] || Lock;
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 flex items-center justify-center" style={{ background: colors[step.status] + '15' }}>
        <Icon size={10} style={{ color: colors[step.status] }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color: step.status === 'locked' ? 'var(--outline-variant)' : 'var(--on-surface)' }}>
        {step.label}
      </span>
      {!isLast && <div className="flex-1 h-px mx-1" style={{ background: 'var(--surface-2)' }} />}
    </div>
  );
};

/* ─── Main Page ─── */
const DealPageCanonical = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { presentation: p, loading, error, contactLoading, requestContact, refresh } = useDealPresentation(dealId);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;
  if (error || !p) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}><p className="text-sm" style={{ color: 'var(--outline)' }}>{error || 'Deal no encontrado'}</p></div>;

  const { modules: mods, deal_summary: ds, financial_data: fd, qualitative_data: qd, actions_panel: ap, process_timeline: tl } = p;

  const handleCta = () => {
    const a = p.primary_cta?.action;
    if (a === 'contact_request') requestContact();
    else if (a === 'sign_nda') navigate(`/explorar/${dealId}?action=nda`);
    else if (a === 'view_process' || a === 'view_teaser') { /* already here */ }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="deal-page-canonical">
      {/* Header bar */}
      <div className="px-6 py-3 flex items-center justify-between" style={{ background: 'var(--surface-lowest)', borderBottom: '1px solid var(--surface-2)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/explorar')} className="flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--outline)' }}><ArrowLeft size={11} /> MARKETPLACE</button>
          <div className="h-3 w-px" style={{ background: 'var(--surface-2)' }} />
          <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: p.buyer_tier === 'pro+' ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', color: p.buyer_tier === 'pro+' ? 'var(--arroba-primary)' : 'var(--outline)' }}>
            {p.buyer_tier?.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-bold" style={{ color: 'var(--outline)' }}>
          <span>{p.content_richness_score}% COMPLETITUD</span>
          <span className="px-1.5 py-0.5" style={{ background: p.visual_mode === 'rich' ? 'rgba(22,163,74,0.06)' : 'var(--surface-2)', color: p.visual_mode === 'rich' ? '#16a34a' : 'var(--outline)' }}>{p.visual_mode?.toUpperCase()}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ═══ MAIN CONTENT (3 cols) ═══ */}
        <div className="lg:col-span-3 space-y-6">

          {/* 1. HERO */}
          <Module id="hero" modules={mods}>
            <div className="p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
              <div className="flex items-start gap-5">
                {ds?.logo_url && <img src={ds.logo_url} alt="" className="w-14 h-14 object-contain" style={{ background: 'var(--surface-1)' }} />}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {ds?.sector && <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'rgba(182,33,42,0.06)', color: 'var(--arroba-primary)' }}>{ds.sector}</span>}
                    {ds?.subcategory && <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>{ds.subcategory}</span>}
                    {ds?.operation_types?.map(t => <span key={t} className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>{t.replace(/_/g,' ').toUpperCase()}</span>)}
                  </div>
                  <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{ds?.title}</h1>
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--outline)' }}>
                    {ds?.city && <span className="flex items-center gap-1"><MapPin size={11} />{ds.city}{ds?.province ? `, ${ds.province}` : ''}</span>}
                    {ds?.employees && <span className="flex items-center gap-1"><Users size={11} />{ds.employees} empleados</span>}
                    {ds?.founded_year && <span className="flex items-center gap-1"><Calendar size={11} />Fundada en {ds.founded_year}</span>}
                  </div>
                </div>
              </div>
            </div>
          </Module>

          {/* 2. EXECUTIVE SUMMARY */}
          <Module id="executive_summary" modules={mods}>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>RESUMEN EJECUTIVO</p>
              <p className="text-sm" style={{ color: 'var(--on-surface)', lineHeight: 1.7 }}>{ds?.description || 'Informacion disponible tras verificacion de acceso.'}</p>
            </div>
          </Module>

          {/* 3. BUSINESS SNAPSHOT */}
          <Module id="business_snapshot" modules={mods}>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>SNAPSHOT DE NEGOCIO</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {ds?.revenue ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>FACTURACION {ds.year}</p><p className="text-xl font-black" style={{ color: 'var(--on-surface)' }}>{fmtMillions(ds.revenue)}</p></div> : null}
                {ds?.ebitda ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>EBITDA {ds.year}</p><p className="text-xl font-black" style={{ color: 'var(--on-surface)' }}>{fmtMillions(ds.ebitda)}</p></div> : null}
                {ds?.ebitda_margin ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>MARGEN EBITDA</p><p className="text-xl font-black" style={{ color: 'var(--on-surface)' }}>{fmtES(ds.ebitda_margin, 1)}%</p></div> : null}
                {ds?.asking_price ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--arroba-primary)' }}>ASKING PRICE</p><p className="text-xl font-black" style={{ color: 'var(--arroba-primary)' }}>{fmtMillions(ds.asking_price)}</p></div> : null}
                {ds?.employees ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>EMPLEADOS</p><p className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{ds.employees}</p></div> : null}
                {ds?.founded_year ? <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>FUNDACION</p><p className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{ds.founded_year}</p></div> : null}
              </div>
            </div>
          </Module>

          {/* 4. FINANCIAL EVOLUTION */}
          <Module id="financial_evolution" modules={mods}>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>EVOLUCION FINANCIERA</p>
              {fd?.years && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
                      <th className="text-left py-2 pr-4 font-bold" style={{ color: 'var(--outline)' }}>EJERCICIO</th>
                      {fd.years.map(y => <th key={y.year} className="text-right py-2 px-3 font-bold" style={{ color: 'var(--on-surface)' }}>{y.year}</th>)}
                    </tr></thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--surface-2)' }}>
                        <td className="py-2 pr-4 font-semibold" style={{ color: 'var(--on-surface)' }}>Facturacion</td>
                        {fd.years.map(y => <td key={y.year} className="text-right py-2 px-3 font-bold" style={{ color: 'var(--on-surface)' }}>{y.revenue ? fmtES(y.revenue, 0) : '—'}</td>)}
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--surface-2)' }}>
                        <td className="py-2 pr-4 font-semibold" style={{ color: 'var(--on-surface)' }}>EBITDA</td>
                        {fd.years.map(y => <td key={y.year} className="text-right py-2 px-3 font-bold" style={{ color: y.ebitda >= 0 ? 'var(--on-surface)' : '#dc2626' }}>{y.ebitda ? fmtES(y.ebitda, 0) : '—'}</td>)}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold" style={{ color: 'var(--on-surface)' }}>Margen EBITDA</td>
                        {fd.years.map(y => <td key={y.year} className="text-right py-2 px-3" style={{ color: 'var(--outline)' }}>{y.ebitda_margin ? `${fmtES(y.ebitda_margin, 1)}%` : '—'}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {fd?.cagr && Object.keys(fd.cagr).length > 0 && (
                <div className="flex gap-4 mt-4 pt-3" style={{ borderTop: '1px solid var(--surface-2)' }}>
                  {fd.cagr.revenue != null && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>CAGR INGRESOS</p><p className="text-sm font-black" style={{ color: fd.cagr.revenue >= 0 ? '#16a34a' : '#dc2626' }}>{fd.cagr.revenue > 0 ? '+' : ''}{fmtES(fd.cagr.revenue, 1)}%</p></div>}
                  {fd.cagr.ebitda != null && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>CAGR EBITDA</p><p className="text-sm font-black" style={{ color: fd.cagr.ebitda >= 0 ? '#16a34a' : '#dc2626' }}>{fd.cagr.ebitda > 0 ? '+' : ''}{fmtES(fd.cagr.ebitda, 1)}%</p></div>}
                </div>
              )}
            </div>
          </Module>

          {/* 5. PnL */}
          <Module id="pnl" modules={mods}>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>CUENTA DE RESULTADOS</p>
              <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Ingresos, aprovisionamientos, margen bruto, gastos de personal, EBITDA, resultado del ejercicio.</p>
            </div>
          </Module>

          {/* 6. Balance */}
          <Module id="balance" modules={mods}>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>BALANCE RESUMIDO</p>
              <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Activo corriente/no corriente, pasivo, patrimonio neto.</p>
            </div>
          </Module>

          {/* 7. Qualitative */}
          <Module id="qualitative" modules={mods}>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>POSICIONAMIENTO Y CUALITATIVOS</p>
              {qd && (
                <div className="grid grid-cols-2 gap-3">
                  {qd.founder_dependency && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>DEPENDENCIA FUNDADOR</p><p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{qd.founder_dependency === 'low' ? 'Baja' : qd.founder_dependency === 'high' ? 'Alta' : 'Media'}</p></div>}
                  {qd.recurring_revenue_pct && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>INGRESOS RECURRENTES</p><p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{qd.recurring_revenue_pct}%</p></div>}
                  {qd.client_concentration_top5 && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>CONCENTRACION TOP 5</p><p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{qd.client_concentration_top5}%</p></div>}
                  {qd.client_diversification && <div><p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>DIVERSIFICACION</p><p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{qd.client_diversification === 'high' ? 'Alta' : qd.client_diversification === 'low' ? 'Baja' : 'Media'}</p></div>}
                </div>
              )}
              {qd?.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-3">{qd.tags.map((t,i) => <span key={i} className="text-[8px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>{t}</span>)}</div>}
            </div>
          </Module>

          {/* 8. Infomemo */}
          <Module id="infomemo" modules={mods}>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', borderLeft: '3px solid var(--arroba-primary)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>INFORMATION MEMORANDUM</p>
              <p className="text-xs" style={{ color: 'var(--on-surface)' }}>Documento completo de la oportunidad con analisis detallado.</p>
            </div>
          </Module>

          {/* 9. Dataroom */}
          <Module id="dataroom" modules={mods}>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen size={14} style={{ color: 'var(--outline)' }} />
                <p className="label-arroba" style={{ color: 'var(--outline)' }}>DATA ROOM</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--on-surface)' }}>Documentacion confidencial del proceso.</p>
            </div>
          </Module>

          {/* 10. Premium Analysis placeholder */}
          <Module id="premium_analysis" modules={mods}>
            <div className="p-5" style={{ background: 'rgba(182,33,42,0.02)', borderLeft: '3px solid var(--arroba-primary)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>ANALISIS PREMIUM PRO+</p>
              <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>Fortalezas, riesgos, preguntas sugeridas para DD y encaje con tu tesis de inversion.</p>
            </div>
          </Module>

          {/* 11. Trust footer */}
          <Module id="trust_footer" modules={mods}>
            <div className="p-4 flex items-center justify-between" style={{ background: 'var(--surface-1)' }}>
              <div className="flex items-center gap-3 text-[9px]" style={{ color: 'var(--outline)' }}>
                <Shield size={10} />
                <span>Informacion anonimizada · Fuente: {fd?.source || 'ARROBA'}</span>
                <span>·</span>
                <span>Completitud: {p.content_richness_score}%</span>
              </div>
              <span className="text-[9px]" style={{ color: 'var(--outline)' }}>BUD Advisors, S.L.</span>
            </div>
          </Module>
        </div>

        {/* ═══ SIDEBAR (1 col) ═══ */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* CTA Panel */}
            <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <div className="flex items-center gap-2 mb-3">
                {p.visibility_state === 'OPERATIVE_ACCESS' ? <Check size={12} style={{ color: '#16a34a' }} /> : p.visibility_state === 'CONTACT_REQUESTED' ? <Clock size={12} style={{ color: '#d97706' }} /> : <Shield size={12} style={{ color: 'var(--arroba-primary)' }} />}
                <span className="text-[10px] font-bold" style={{ color: p.visibility_state === 'OPERATIVE_ACCESS' ? '#16a34a' : 'var(--on-surface)' }}>
                  {p.visibility_state === 'OPERATIVE_ACCESS' ? 'Acceso operativo' : p.visibility_state === 'NDA_AVAILABLE' ? 'NDA disponible' : p.visibility_state === 'CONTACT_REQUESTED' ? 'Solicitud pendiente' : p.visibility_state === 'TEASER_UNLOCKED' ? 'Teaser desbloqueado' : 'Contacto requerido'}
                </span>
              </div>
              <button
                onClick={handleCta}
                disabled={p.primary_cta?.style === 'disabled' || contactLoading}
                className="w-full py-3 text-[11px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: p.primary_cta?.style === 'disabled' ? 'var(--surface-2)' : p.primary_cta?.style?.includes('premium') ? 'var(--arroba-primary)' : 'var(--on-surface)', color: p.primary_cta?.style === 'disabled' ? 'var(--outline)' : '#fff' }}
                data-testid="deal-primary-cta"
              >
                {contactLoading ? 'Enviando...' : p.primary_cta?.label} {p.primary_cta?.style !== 'disabled' && !contactLoading && <ArrowRight size={11} />}
              </button>
              {p.primary_cta?.description && <p className="text-[10px] mt-2" style={{ color: 'var(--outline)' }}>{p.primary_cta.description}</p>}
              {p.secondary_cta && <button onClick={() => {}} className="w-full py-2 mt-2 text-[10px] font-bold" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>{p.secondary_cta.label}</button>}
            </div>

            {/* Process Timeline */}
            {tl?.length > 0 && (
              <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ESTADO DEL PROCESO</p>
                <div className="space-y-2">
                  {tl.map((s, i) => <TimelineStep key={s.step} step={s} isLast={i === tl.length - 1} />)}
                </div>
              </div>
            )}

            {/* Actions Panel */}
            {ap && (
              <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>SIGUIENTES ACCIONES</p>
                {ap.recommended?.map(a => (
                  <div key={a.key} className="flex items-center gap-2 p-2 mb-1" style={{ background: 'rgba(182,33,42,0.04)', borderLeft: '2px solid var(--arroba-primary)' }}>
                    <Star size={10} style={{ color: 'var(--arroba-primary)' }} />
                    <span className="text-[10px] font-bold" style={{ color: 'var(--arroba-primary)' }}>{a.label}</span>
                  </div>
                ))}
                {ap.available?.map(a => (
                  <div key={a.key} className="flex items-center gap-2 p-2 mb-1">
                    <Check size={10} style={{ color: '#16a34a' }} />
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--on-surface)' }}>{a.label}</span>
                  </div>
                ))}
                {ap.blocked?.map(a => (
                  <div key={a.key} className="flex items-center gap-2 p-2 mb-1" style={{ opacity: 0.6 }}>
                    <Lock size={10} style={{ color: 'var(--outline)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{a.label}</span>
                    {a.upgrade && <span className="text-[8px] font-bold ml-auto" style={{ color: 'var(--arroba-primary)' }}>{a.upgrade.toUpperCase()}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Quick summary */}
            <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>RESUMEN</p>
              <div className="space-y-2">
                {ds?.sector && <div className="flex justify-between"><span className="text-[10px]" style={{ color: 'var(--outline)' }}>Sector</span><span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{ds.sector}</span></div>}
                {ds?.city && <div className="flex justify-between"><span className="text-[10px]" style={{ color: 'var(--outline)' }}>Ciudad</span><span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{ds.city}</span></div>}
                {ds?.revenue && <div className="flex justify-between"><span className="text-[10px]" style={{ color: 'var(--outline)' }}>Facturacion</span><span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{fmtMillions(ds.revenue)}</span></div>}
                {ds?.employees && <div className="flex justify-between"><span className="text-[10px]" style={{ color: 'var(--outline)' }}>Empleados</span><span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{ds.employees}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealPageCanonical;
