import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dealsAPI, engagementsAPI, ndaAPI, companiesAPI, marketplaceAPI } from '../services/api';
import { FinancialVisualsGallery, FinancialVisualCard } from '../components/FinancialVisualCard';
import { fmtES, fmtMillions } from '../utils/formatES';
import {
  Building2, MapPin, Calendar, Users, TrendingUp, FileText, Shield,
  Loader2, ArrowLeft, MessageSquare, FolderOpen, Handshake, FileSignature,
  Check, Lock, Eye, Star, ChevronRight
} from 'lucide-react';

const SECTIONS = [
  { id: 'empresa', label: 'Información de la empresa', icon: Building2 },
  { id: 'transaccion', label: 'Información de la transacción', icon: TrendingUp },
  { id: 'documentacion', label: 'Documentación adicional', icon: FolderOpen },
  { id: 'qa', label: 'Preguntas y respuestas', icon: MessageSquare },
  { id: 'reuniones', label: 'Reuniones', icon: Handshake },
];

const BuyerDealView = () => {
  const { dealId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('empresa');
  const [visuals, setVisuals] = useState(null);
  const fromBuyer = searchParams.get('from') === 'buyer';
  const fromSection = searchParams.get('section') || 'dashboard';

  const fetchDeal = useCallback(async () => {
    try {
      const res = await marketplaceAPI.getDealTeaser(dealId);
      setDeal(res.data);
      // Load visuals if available
      if (res.data?.company_id) {
        try {
          const vRes = await companiesAPI.getVisuals(res.data.company_id);
          setVisuals(vRes.data?.financial_visuals);
        } catch {}
      }
    } catch {}
    finally { setLoading(false); }
  }, [dealId]);

  useEffect(() => { fetchDeal(); }, [fetchDeal]);

  // Dynamic OG
  useEffect(() => {
    if (!deal) return;
    const t = deal.teaser || {};
    const title = t.title || t.headline || 'Oportunidad';
    document.title = `${title} — ARROBA`;
    return () => { document.title = 'Arroba — Plataforma M&A para Agencias Digitales'; };
  }, [deal]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;
  if (!deal) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}><p style={{ color: 'var(--outline)' }}>Deal no encontrado</p></div>;

  const teaser = deal.teaser || {};
  const hasNda = deal.ndas_signed?.some(n => n.buyer_id === user?.user_id);
  const buyerVisuals = visuals ? Object.fromEntries(
    Object.entries(visuals).filter(([, v]) => v.use_in_buyer_advanced && v.enabled)
  ) : null;
  const teaserVisuals = visuals ? Object.fromEntries(
    Object.entries(visuals).filter(([, v]) => v.use_in_teaser && v.enabled)
  ) : null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="buyer-deal-view">

      {/* ─── SIDEBAR ─── */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40 overflow-y-auto" style={{ background: 'var(--surface-1)', paddingTop: 24 }}>
        <div className="px-6 mb-5">
          <Link to="/" className="text-2xl font-black tracking-tight block mb-3" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</Link>
          <p className="label-arroba" style={{ color: 'var(--outline)', fontSize: 9 }}>FICHA DE LA OPERACIÓN</p>
          <h2 className="text-sm font-extrabold mt-1 truncate" style={{ color: 'var(--on-surface)' }}>
            {teaser.title || teaser.headline || 'Oportunidad'}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            {teaser.sector_display && <span className="px-2 py-0.5 text-[9px] font-bold" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>{teaser.sector_display}</span>}
            {teaser.geography_display && <span className="text-[10px]" style={{ color: 'var(--outline)' }}>{teaser.geography_display}</span>}
          </div>
        </div>

        {/* Access status */}
        <div className="px-4 mb-5">
          <div className="px-3 py-2" style={{ background: hasNda ? 'rgba(22,163,74,0.06)' : 'var(--surface-2)' }}>
            <div className="flex items-center gap-1.5">
              {hasNda ? <Shield size={11} style={{ color: '#16a34a' }} /> : <Lock size={11} style={{ color: 'var(--outline)' }} />}
              <span className="text-[10px] font-bold" style={{ color: hasNda ? '#16a34a' : 'var(--outline)' }}>
                {hasNda ? 'NDA FIRMADO' : 'ACCESO LIMITADO'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = s.id === activeSection;
            const isLocked = !hasNda && ['documentacion', 'qa', 'reuniones'].includes(s.id);
            return (
              <button key={s.id} onClick={() => !isLocked && setActiveSection(s.id)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all text-left"
                style={{
                  color: isLocked ? 'var(--outline-variant)' : isActive ? 'var(--arroba-primary)' : 'var(--on-surface-variant)',
                  background: isActive ? 'var(--surface-lowest)' : 'transparent',
                  boxShadow: isActive ? '0px 4px 12px rgba(26,28,28,0.06)' : 'none',
                  opacity: isLocked ? 0.5 : 1,
                }}
                data-testid={`deal-nav-${s.id}`}>
                <Icon size={14} />
                <span className="flex-1">{s.label}</span>
                {isLocked && <Lock size={10} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-4 pb-6 space-y-2 mt-auto">
          <Link to={fromBuyer ? '/buyer/procesos' : '/explorar'}>
            <button className="w-full py-2.5 text-[11px] font-bold flex items-center justify-center gap-2" style={{ background: 'var(--on-surface)', color: '#fff' }}>
              <ArrowLeft size={12} /> {fromBuyer ? 'VOLVER AL PANEL' : 'VOLVER AL LISTADO'}
            </button>
          </Link>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main className="ml-60 min-h-screen" style={{ paddingTop: 32 }}>
        <div className="max-w-[1100px] mx-auto px-8 pb-16">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>
                {SECTIONS.find(s => s.id === activeSection)?.label.toUpperCase()}
              </p>
              <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                {teaser.title || teaser.headline || 'Oportunidad de inversión'}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm" style={{ color: 'var(--outline)' }}>
                {teaser.geography_display && <span className="flex items-center gap-1"><MapPin size={12} /> {teaser.geography_display}</span>}
                {teaser.sector_display && <span>· {teaser.sector_display}</span>}
              </div>
            </div>
          </div>

          {/* Content + Rail */}
          <div className="flex gap-8">
            <div className="flex-1 min-w-0">

              {/* ═══ EMPRESA ═══ */}
              {activeSection === 'empresa' && (
                <div className="space-y-5" data-testid="section-empresa">
                  {/* Resumen ejecutivo */}
                  <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                    <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>RESUMEN</p>
                    <p className="text-sm" style={{ color: 'var(--on-surface)', lineHeight: 1.7 }}>{teaser.description || teaser.short_description || '—'}</p>
                  </div>

                  {/* Métricas clave */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'FACTURACIÓN', value: teaser.revenue_display || teaser.revenue_range || '—' },
                      { label: 'EBITDA', value: teaser.ebitda_display || teaser.ebitda_range || '—' },
                      { label: 'EMPLEADOS', value: teaser.employees_display || '—' },
                      { label: 'FUNDACIÓN', value: teaser.founded_year || '—' },
                    ].map((m, i) => (
                      <div key={i} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
                        <p className="label-arroba mb-1" style={{ color: 'var(--outline)' }}>{m.label}</p>
                        <p className="text-lg font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Highlights */}
                  {teaser.highlights?.length > 0 && (
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>HIGHLIGHTS</p>
                      <div className="space-y-2">
                        {teaser.highlights.filter(Boolean).map((h, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--arroba-primary)' }} />
                            <span className="text-sm" style={{ color: 'var(--on-surface)' }}>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teaser visuals */}
                  {teaserVisuals && Object.keys(teaserVisuals).length > 0 && (
                    <div>
                      <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>MÉTRICAS FINANCIERAS</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(teaserVisuals).map(([id, v]) => (
                          <FinancialVisualCard key={id} chartId={id} visual={v} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Post-NDA: buyer advanced visuals */}
                  {hasNda && buyerVisuals && Object.keys(buyerVisuals).length > 0 && (
                    <div>
                      <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ANÁLISIS FINANCIERO AVANZADO</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(buyerVisuals).map(([id, v]) => (
                          <FinancialVisualCard key={id} chartId={id} visual={v} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ TRANSACCIÓN ═══ */}
              {activeSection === 'transaccion' && (
                <div className="space-y-5" data-testid="section-transaccion">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>TIPO DE OPERACIÓN</p>
                      <div className="flex flex-wrap gap-2">
                        {(deal.operation_types_allowed || []).map(op => (
                          <span key={op} className="px-3 py-1 text-xs font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>
                            {op === 'full_sale' ? 'Venta total' : op === 'partial_sale' ? 'Venta parcial' : 'Fusión'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>PRECIO SOLICITADO</p>
                      <p className="text-2xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.02em' }}>
                        {deal.asking_price ? fmtMillions(deal.asking_price) : 'Negociable'}
                      </p>
                    </div>
                  </div>
                  <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                    <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>ESTADO DEL PROCESO</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>
                      {deal.status === 'published' ? 'Abierto a interés' : deal.status === 'exclusivity' ? 'En exclusividad' : deal.status}
                    </p>
                  </div>
                </div>
              )}

              {/* ═══ DOCUMENTACIÓN ═══ */}
              {activeSection === 'documentacion' && (
                <div data-testid="section-documentacion">
                  {hasNda ? (
                    <div className="space-y-4">
                      <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                        <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>DOCUMENTOS DISPONIBLES</p>
                        {deal.infomemo?.content && (
                          <Link to={`/explorar/${dealId}?from=buyer`} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--surface-1)' }}>
                            <FileText size={16} style={{ color: 'var(--arroba-primary)' }} />
                            <div><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Information Memorandum</p><p className="text-[10px]" style={{ color: 'var(--outline)' }}>Documento completo del activo</p></div>
                          </Link>
                        )}
                        <div className="flex items-center gap-3 py-3">
                          <FolderOpen size={16} style={{ color: 'var(--arroba-secondary)' }} />
                          <div><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Data Room</p><p className="text-[10px]" style={{ color: 'var(--outline)' }}>Documentación financiera y legal</p></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
                      <Lock size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Documentación bloqueada</p>
                      <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Firma el NDA para acceder a la documentación completa.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ Q&A ═══ */}
              {activeSection === 'qa' && (
                <div data-testid="section-qa">
                  {hasNda ? (
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>PREGUNTAS Y RESPUESTAS</p>
                      <p className="text-xs" style={{ color: 'var(--outline)' }}>La sección de Q&A se activa cuando el seller acepta tu interés.</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
                      <Lock size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Requiere NDA</p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ REUNIONES ═══ */}
              {activeSection === 'reuniones' && (
                <div data-testid="section-reuniones">
                  {hasNda ? (
                    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                      <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>REUNIONES</p>
                      <p className="text-xs" style={{ color: 'var(--outline)' }}>La funcionalidad de reuniones estará disponible próximamente.</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
                      <Lock size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Requiere NDA</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── RAIL ─── */}
            <div className="w-[260px] shrink-0 space-y-5">
              {/* NDA / Access */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ACCESO</p>
                {hasNda ? (
                  <div className="flex items-center gap-2">
                    <Shield size={14} style={{ color: '#16a34a' }} />
                    <p className="text-xs font-bold" style={{ color: '#16a34a' }}>NDA firmado — acceso completo</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs mb-3" style={{ color: 'var(--outline)' }}>Firma el NDA para acceder a documentación, Q&A y reuniones.</p>
                    <button onClick={() => navigate(`/explorar/${dealId}`)} className="w-full py-2 text-[10px] font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>FIRMAR NDA</button>
                  </div>
                )}
              </div>

              {/* Quick metrics */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>SNAPSHOT</p>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>Facturación</span><span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{teaser.revenue_display || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>EBITDA</span><span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{teaser.ebitda_display || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>Precio</span><span className="text-xs font-bold" style={{ color: 'var(--arroba-primary)' }}>{deal.asking_price ? fmtMillions(deal.asking_price) : 'Negociable'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuyerDealView;
