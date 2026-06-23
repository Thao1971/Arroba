import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dealsAPI, companiesAPI, engagementsAPI, coachingAPI, conversationsAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DataRoomSellerTab from '../components/DataRoomSellerTab';
import LoiDetailedView from '../components/LoiDetailedView';
import {
  ArrowLeft, Eye, Users, FileSignature, FileText, CheckCircle2,
  AlertCircle, Shield, TrendingUp, Loader2, ChevronRight, Star, Lock, FolderOpen,
  AlertTriangle, Info, MessageSquare, ArrowRight
} from 'lucide-react';

/* ─── Sidebar sections ─── */
const SECTIONS = [
  { id: 'resumen', label: 'Resumen', icon: Eye },
  { id: 'interesados', label: 'Interesados', icon: Users },
  { id: 'lois', label: 'LOIs', icon: FileSignature },
  { id: 'qa', label: 'Q&A', icon: MessageSquare },
  { id: 'dataroom', label: 'Data Room', icon: FolderOpen },
  { id: 'infomemo', label: 'Infomemo', icon: FileText },
];

const TAB_MAP = { lois: 'lois', comparator: 'interesados', qa: 'qa', dataroom: 'dataroom', infomemo: 'infomemo', overview: 'resumen' };

/* ─── Sub-components (preserved from original) ─── */
const ComparatorTab = ({ deal, onRefresh }) => {
  const [engData, setEngData] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [shortlistedIds, setShortlistedIds] = useState([]);
  const [exclusiveBuyer, setExclusiveBuyer] = useState(null);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await engagementsAPI.listDealEngagements(deal.deal_id);
        setEngData(res.data);
        setShortlistedIds(res.data?.engagements?.filter(e => e.stage === 'SHORTLISTED').map(e => e.buyer_id) || []);
        setExclusiveBuyer(res.data?.engagements?.find(e => e.stage === 'EXCLUSIVITY') || null);
      } catch {}
    };
    load();
  }, [deal.deal_id]);
  if (!engData) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--outline)' }} /></div>;
  const engagements = engData?.engagements || [];
  return (
    <div data-testid="interesados-content">
      <div className="flex items-center gap-3 mb-5">
        <span className="px-3 py-1 text-xs font-bold" style={{ background: 'rgba(59,130,246,0.06)', color: '#1d4ed8' }}>{engData?.total_interests || 0} Intereses</span>
        <span className="px-3 py-1 text-xs font-bold" style={{ background: 'rgba(182,33,42,0.06)', color: 'var(--arroba-primary)' }}>{engData?.total_lois === 1 ? 'LOI recibida' : `${engData?.total_lois || 0} LOIs recibidas`}</span>
        <span className="px-3 py-1 text-xs font-bold" style={{ background: 'rgba(22,163,74,0.06)', color: '#16a34a' }}>{shortlistedIds.length}/3 Shortlist</span>
      </div>
      {engagements.length === 0 ? (
        <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
          <Users size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
          <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Sin interesados aún</p>
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
              <th className="text-left py-3 px-4 label-arroba" style={{ color: 'var(--outline)' }}>BUYER</th>
              <th className="text-center py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>TIPO</th>
              <th className="text-center py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>STAGE</th>
              <th className="text-right py-3 px-3 label-arroba" style={{ color: 'var(--outline)' }}>OFERTA</th>
              <th className="text-right py-3 px-4 label-arroba" style={{ color: 'var(--outline)' }}>ACCIONES</th>
            </tr></thead>
            <tbody>
              {engagements.map(eng => (
                <tr key={eng.engagement_id} style={{ borderBottom: '1px solid var(--surface-1)' }}>
                  <td className="py-3 px-4"><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{eng.buyer_name || 'Buyer'}</p></td>
                  <td className="py-3 px-3 text-center"><span className="text-xs" style={{ color: 'var(--outline)' }}>{eng.type}</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>{eng.stage}</span></td>
                  <td className="py-3 px-3 text-right"><span className="text-sm font-bold" style={{ color: 'var(--arroba-primary)' }}>{eng.valuation_offer ? `${(eng.valuation_offer/1e6).toFixed(1).replace('.',',')}M€` : '—'}</span></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {eng.stage !== 'SHORTLISTED' && eng.stage !== 'EXCLUSIVITY' && eng.stage !== 'REJECTED' && (
                        <button onClick={async () => { try { await engagementsAPI.shortlistBuyer(deal.deal_id, eng.buyer_id); onRefresh(); } catch {} }}
                          className="px-2 py-1 text-[10px] font-bold" style={{ background: 'rgba(22,163,74,0.06)', color: '#16a34a' }}>Shortlist</button>
                      )}
                      {eng.stage !== 'REJECTED' && eng.stage !== 'EXCLUSIVITY' && (
                        <button onClick={async () => { try { await engagementsAPI.rejectBuyer(deal.deal_id, eng.buyer_id); onRefresh(); } catch {} }}
                          className="px-2 py-1 text-[10px] font-bold" style={{ background: 'rgba(220,38,38,0.05)', color: '#dc2626' }}>Rechazar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const QaTab = ({ dealId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    conversationsAPI.getForDeal(dealId).then(r => setConversations(r.data?.conversations || r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [dealId]);
  if (loading) return <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;
  if (conversations.length === 0) return <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}><MessageSquare size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} /><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Sin conversaciones Q&A</p><p className="text-xs" style={{ color: 'var(--outline)' }}>Se activarán cuando aceptes un interés.</p></div>;
  return (
    <div className="space-y-3" data-testid="qa-content">
      {conversations.map(conv => (
        <Link key={conv.conversation_id} to={`/qa/${conv.conversation_id}`} className="block p-4 group transition-all duration-150 hover:-translate-y-0.5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold group-hover:opacity-80 transition-opacity" style={{ color: 'var(--on-surface)' }}>{conv.buyer_name || 'Buyer'}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--outline)' }}>{conv.pending_count || 0} pendientes · {conv.total_count || 0} total</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: conv.status === 'OPEN' ? 'rgba(22,163,74,0.06)' : 'var(--surface-2)', color: conv.status === 'OPEN' ? '#16a34a' : 'var(--outline)' }}>
              {conv.status === 'OPEN' ? 'ACTIVA' : 'CERRADA'}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════
   DEAL MANAGEMENT — Shell Buyer Dashboard
   ═══════════════════════════════════════════ */
const DealManagement = () => {
  const { dealId } = useParams();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deal, setDeal] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(TAB_MAP[tabParam] || 'resumen');
  const [totalPendingQA, setTotalPendingQA] = useState(0);
  const [readiness, setReadiness] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => { loadDeal(); }, [dealId]);

  const loadDeal = async () => {
    try {
      setLoading(true);
      const res = await dealsAPI.get(dealId);
      setDeal(res.data);
      if (res.data.company_id) {
        const compRes = await companiesAPI.get(res.data.company_id);
        setCompany(compRes.data);
      }
      try { const r = await dealsAPI.getReadiness(dealId); setReadiness(r.data.readiness); } catch {}
      try { const h = await dealsAPI.getHealth(dealId); setHealth(h.data); } catch {}
      try { const q = await conversationsAPI.getForDeal(dealId); setTotalPendingQA((q.data?.conversations || q.data || []).reduce((s, c) => s + (c.pending_count || 0), 0)); } catch {}
    } catch (err) { setError(err.response?.data?.detail || 'Error'); }
    finally { setLoading(false); }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await dealsAPI.activate(dealId);
      await loadDeal();
    } catch (err) { setError(err.response?.data?.detail || 'Error al activar'); }
    finally { setActionLoading(false); }
  };

  const getStatusLabel = (s) => ({ draft: 'Borrador', published: 'Publicado', exclusivity: 'Exclusividad', closed: 'Cerrado', dropped: 'Cancelado' }[s] || s);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;
  if (!deal) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}><p style={{ color: 'var(--outline)' }}>Deal no encontrado</p></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="deal-management">

      {/* ─── LEFT SIDEBAR (fixed) — Buyer Dashboard shell ─── */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40" style={{ background: 'var(--surface-1)', paddingTop: 80 }}>
        <div className="px-6 mb-5">
          <Link to="/" className="text-2xl font-black tracking-tight block mb-3" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</Link>
          <h2 className="text-base font-extrabold truncate" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            {company?.trade_name || company?.legal_name || 'Deal'}
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--outline)' }}>
            GESTIÓN DE OPERACIÓN
          </p>
        </div>

        {/* Status + Health badges */}
        <div className="px-4 mb-5 space-y-2">
          <div className="px-3 py-2 flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
            <span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{getStatusLabel(deal.status).toUpperCase()}</span>
            {health && health.health !== 'INACTIVO' && (
              <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: health.health === 'VERDE' ? '#16a34a' : health.health === 'AMARILLO' ? '#d97706' : '#dc2626' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: health.health === 'VERDE' ? '#16a34a' : health.health === 'AMARILLO' ? '#d97706' : '#dc2626' }} />
                {health.health === 'VERDE' ? 'SANO' : health.health}
              </span>
            )}
          </div>
          {readiness && (
            <div className="px-3 py-2" style={{ background: readiness.score >= 90 ? 'rgba(22,163,74,0.06)' : readiness.score >= 60 ? 'rgba(217,119,6,0.06)' : 'rgba(220,38,38,0.05)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: 'var(--outline)' }}>READINESS</span>
                <span className="text-[10px] font-bold" style={{ color: readiness.score >= 90 ? '#16a34a' : readiness.score >= 60 ? '#d97706' : '#dc2626' }}>{readiness.score}%</span>
              </div>
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
                {s.id === 'qa' && totalPendingQA > 0 && (
                  <span className="ml-auto w-5 h-5 text-[9px] font-bold flex items-center justify-center" style={{ background: 'var(--arroba-primary)', color: '#fff', borderRadius: '50%' }}>{totalPendingQA}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar bottom */}
        <div className="px-4 pb-6 space-y-3">
          {deal.status === 'draft' && (
            <button onClick={handleActivate} disabled={actionLoading}
              className="w-full py-3 text-[11px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
              {actionLoading ? <Loader2 size={12} className="animate-spin" /> : null} PUBLICAR DEAL
            </button>
          )}
          <Link to="/seller/deals">
            <button className="w-full py-3 text-[11px] font-bold flex items-center justify-center gap-2"
              style={{ background: 'var(--on-surface)', color: '#fff' }}>
              <ArrowLeft size={12} /> VOLVER AL DASHBOARD
            </button>
          </Link>
        </div>
      </aside>

      {/* ─── MAIN CONTENT (offset by sidebar) ─── */}
      <main className="ml-60 min-h-screen" style={{ paddingTop: 32 }}>
        <div className="max-w-[1100px] mx-auto px-8 pb-16">

          {/* ─── HEADER ─── */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>
                {SECTIONS.find(s => s.id === activeSection)?.label.toUpperCase()}
              </p>
              <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                {company?.trade_name || company?.legal_name || 'Deal'}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--outline)' }}>
                {deal.deal_id} · {deal.teaser?.sector_display || ''} · {deal.teaser?.geography_display || ''}
              </p>
            </div>
          </div>

          {/* ─── CONTENT + RAIL ─── */}
          <div className="flex gap-8">
            {/* CENTER */}
            <div className="flex-1 min-w-0">

              {/* ═══ RESUMEN ═══ */}
              {activeSection === 'resumen' && (
                <div className="space-y-5" data-testid="section-resumen">
                  {/* KPIs */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'VISTAS', valor: deal.metrics?.teaser_views || 0, icon: Eye },
                      { label: 'NDAs FIRMADOS', valor: deal.metrics?.ndas_signed_count || 0, icon: FileSignature },
                      { label: 'LOIs RECIBIDAS', valor: (deal.metrics?.lois_received_count || 0) === 1 ? 'LOI recibida' : `${deal.metrics?.lois_received_count || 0}`, icon: FileText },
                      { label: 'SOLICITUDES', valor: deal.metrics?.access_requests_count || 0, icon: Users },
                      { label: 'INTERESES', valor: deal.metrics?.interests_count || 0, icon: Star },
                      { label: 'READINESS', valor: readiness ? `${readiness.score}%` : '—', icon: CheckCircle2, color: readiness?.score >= 90 ? '#16a34a' : readiness?.score >= 60 ? '#d97706' : 'var(--on-surface)' },
                    ].map((kpi, i) => {
                      const Icon = kpi.icon;
                      return (
                        <div key={i} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Icon size={11} style={{ color: 'var(--outline)' }} />
                            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>{kpi.label}</p>
                          </div>
                          <p className="text-lg font-black" style={{ color: kpi.color || 'var(--on-surface)', letterSpacing: '-0.02em' }}>{kpi.valor}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Teaser */}
                  <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                    <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>TEASER PÚBLICO</p>
                    <p className="text-xs mb-1" style={{ color: 'var(--outline)' }}>{deal.teaser?.sector_display}</p>
                    <h3 className="text-base font-bold mb-2" style={{ color: 'var(--on-surface)' }}>{deal.teaser?.headline}</h3>
                    <p className="text-sm mb-3" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>{deal.teaser?.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="label-arroba" style={{ color: 'var(--outline)' }}>FACTURACIÓN</p><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{deal.teaser?.revenue_display || '—'}</p></div>
                      <div><p className="label-arroba" style={{ color: 'var(--outline)' }}>EBITDA</p><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{deal.teaser?.ebitda_display || '—'}</p></div>
                    </div>
                  </div>

                  {/* Health alerts */}
                  {health?.alerts?.length > 0 && (
                    <div className="space-y-2">
                      <p className="label-arroba" style={{ color: 'var(--outline)' }}>ALERTAS DE SALUD</p>
                      {health.alerts.map((a, i) => (
                        <div key={i} className="p-4 flex items-start gap-3" style={{ background: 'var(--surface-lowest)', borderLeft: `3px solid ${a.severity === 'red' ? '#dc2626' : a.severity === 'amber' ? '#d97706' : 'var(--outline)'}` }}>
                          <AlertTriangle size={14} style={{ color: a.severity === 'red' ? '#dc2626' : '#d97706' }} />
                          <div>
                            <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{a.problem}</p>
                            <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{a.cause}</p>
                            <p className="text-[10px] font-semibold mt-1" style={{ color: 'var(--arroba-primary)' }}>{a.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ INTERESADOS ═══ */}
              {activeSection === 'interesados' && <ComparatorTab deal={deal} onRefresh={loadDeal} />}

              {/* ═══ LOIs ═══ */}
              {activeSection === 'lois' && <LoiDetailedView deal={deal} onRefresh={loadDeal} />}

              {/* ═══ Q&A ═══ */}
              {activeSection === 'qa' && <QaTab dealId={deal.deal_id} />}

              {/* ═══ DATA ROOM ═══ */}
              {activeSection === 'dataroom' && <DataRoomSellerTab deal={deal} />}

              {/* ═══ INFOMEMO ═══ */}
              {activeSection === 'infomemo' && (
                <div data-testid="section-infomemo">
                  {deal.infomemo?.content ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="label-arroba" style={{ color: 'var(--outline)' }}>INFORMATION MEMORANDUM</p>
                        <Link to={`/seller/company/${company?.company_id}?step=4`} className="text-xs font-bold" style={{ color: 'var(--arroba-primary)' }}>Editar</Link>
                      </div>
                      <div className="p-6 prose prose-sm max-w-none" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{deal.infomemo.content}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}>
                      <FileText size={24} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Infomemo no generado</p>
                      <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Genera el infomemo desde el wizard de la compañía.</p>
                      <Link to={`/seller/company/${company?.company_id}?step=4`}>
                        <button className="px-6 py-2 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>GENERAR INFOMEMO</button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── RAIL DERECHO (w-[260px] — mismo que BuyerDashboard) ─── */}
            <div className="w-[260px] shrink-0 space-y-5">
              {/* Deal info */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>INFORMACIÓN DEL DEAL</p>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>Precio solicitado</span><span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{deal.asking_price ? `${(deal.asking_price/1e6).toFixed(1).replace('.',',')}M €` : 'Negociable'}</span></div>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>Tipo operación</span><span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{deal.operation_types_allowed?.includes('full_sale') ? 'Venta total' : 'Parcial/Fusión'}</span></div>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>Creado</span><span className="text-xs" style={{ color: 'var(--on-surface)' }}>{new Date(deal.created_at).toLocaleDateString('es-ES')}</span></div>
                  {deal.published_at && <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--outline)' }}>Publicado</span><span className="text-xs" style={{ color: 'var(--on-surface)' }}>{new Date(deal.published_at).toLocaleDateString('es-ES')}</span></div>}
                </div>
              </div>

              {/* Valuation */}
              {company?.valuation && (
                <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                  <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>VALORACIÓN</p>
                  <p className="text-xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.02em' }}>
                    {(company.valuation.valuation_min/1e6).toFixed(1).replace('.',',')}M - {(company.valuation.valuation_max/1e6).toFixed(1).replace('.',',')}M €
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--outline)' }}>
                    Múltiplo: {company.valuation.multiple_min?.toFixed(1)}x - {company.valuation.multiple_max?.toFixed(1)}x
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ACCIONES</p>
                <div className="space-y-2">
                  <Link to={`/seller/company/${company?.company_id}`} className="flex items-center gap-2 py-1.5 group">
                    <ChevronRight size={12} style={{ color: 'var(--outline)' }} />
                    <span className="text-xs font-semibold group-hover:opacity-70 transition-opacity" style={{ color: 'var(--on-surface)' }}>Editar compañía</span>
                  </Link>
                  <Link to="/seller/interesados" className="flex items-center gap-2 py-1.5 group">
                    <ChevronRight size={12} style={{ color: 'var(--outline)' }} />
                    <span className="text-xs font-semibold group-hover:opacity-70 transition-opacity" style={{ color: 'var(--on-surface)' }}>Ver interesados</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DealManagement;
