import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { dealsAPI, engagementsAPI, ndaAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DataRoomBuyerView from '../components/DataRoomBuyerView';
import useTimeTracker from '../hooks/useTimeTracker';
import {
  ArrowLeft, Shield, FileText, MapPin, Calendar, Users, TrendingUp,
  Check, Loader2, FileSignature, Building2, Bookmark, BookmarkCheck, Mail, ChevronRight,
  AlertCircle, Clock, Send, ArrowUpRight
} from 'lucide-react';

const OperationBadge = ({ types }) => {
  const labels = {
    full_sale: { text: 'Venta Total', color: 'bg-arroba-coral/10 text-arroba-coral' },
    partial_sale: { text: 'Venta Parcial', color: 'bg-arroba-blue/10 text-arroba-blue' },
    merger: { text: 'Fusión', color: 'bg-purple-100 text-purple-700' },
  };
  return (
    <div className="flex gap-2" data-testid="operation-badges">
      {(types || []).map(t => {
        const l = labels[t] || { text: t, color: 'bg-slate-100 text-slate-600' };
        return <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${l.color}`}>{l.text}</span>;
      })}
    </div>
  );
};

const stageBadge = {
  SUBMITTED: { text: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  VIEWED: { text: 'Visto', color: 'bg-yellow-100 text-yellow-700' },
  SHORTLISTED: { text: 'En Shortlist', color: 'bg-green-100 text-green-700' },
  REJECTED: { text: 'Rechazado', color: 'bg-red-100 text-red-700' },
  EXCLUSIVITY: { text: 'En Exclusividad', color: 'bg-indigo-100 text-indigo-700' },
};

// ===== NDA MODAL =====
const NdaModal = ({ dealId, onSigned, onClose, loading: externalLoading, user }) => {
  const [accepted, setAccepted] = useState(false);
  const [template, setTemplate] = useState(null);
  const [loadingTpl, setLoadingTpl] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerCompany, setSignerCompany] = useState('');
  const [signerTitle, setSignerTitle] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ndaAPI.getTemplate(dealId);
        setTemplate(res.data);
        setSignerName(res.data.signer_name_prefill || '');
        setSignerCompany(res.data.signer_company_prefill || '');
        setSignerTitle(res.data.signer_title_prefill || '');
      } catch {} finally { setLoadingTpl(false); }
    };
    load();
  }, [dealId]);

  const handleSign = async () => {
    if (!accepted || !signerName.trim()) return;
    setSigning(true);
    try {
      const res = await ndaAPI.sign({
        deal_id: dealId,
        signer_name: signerName.trim(),
        signer_company: signerCompany.trim() || null,
        signer_title: signerTitle.trim() || null,
        accept_terms: true,
      });
      onSigned(res.data);
    } catch (err) {
      console.error('NDA sign error:', err);
    } finally { setSigning(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} data-testid="nda-modal">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ background: 'var(--surface-lowest)' }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '2px solid var(--surface-1)' }}>
          <Shield size={18} style={{ color: 'var(--arroba-primary)' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Acuerdo de Confidencialidad Mutuo</p>
            <p className="text-xs" style={{ color: 'var(--outline)' }}>ARROBA / BUD Advisors, S.L. — Versión {template?.template_version || '2.0'}</p>
          </div>
        </div>

        {/* Document preview */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ background: 'var(--surface-1)' }}>
          {loadingTpl ? (
            <div className="text-center py-12"><Loader2 size={20} className="animate-spin mx-auto mb-2" style={{ color: 'var(--outline)' }} /><p className="text-xs" style={{ color: 'var(--outline)' }}>Cargando documento...</p></div>
          ) : (
            <pre className="whitespace-pre-wrap text-xs leading-relaxed" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: 'var(--on-surface-variant)' }} data-testid="nda-document-text">
              {template?.rendered_text || 'Documento no disponible'}
            </pre>
          )}
        </div>

        {/* Signer form + accept */}
        <div className="px-6 py-5" style={{ borderTop: '2px solid var(--surface-1)' }}>
          <p className="label-arroba mb-3" style={{ color: 'var(--outline)', fontSize: 9 }}>DATOS DEL FIRMANTE</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <input value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="Nombre completo *"
              className="px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--surface-2)', borderRadius: 0, color: 'var(--on-surface)' }} data-testid="nda-signer-name" />
            <input value={signerCompany} readOnly placeholder="Empresa (desde tu perfil)"
              className="px-3 py-2 text-sm outline-none cursor-not-allowed opacity-70" style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--surface-2)', borderRadius: 0, color: 'var(--on-surface)' }} data-testid="nda-signer-company" />
            <input value={signerTitle} readOnly placeholder="Cargo (desde tu perfil)"
              className="px-3 py-2 text-sm outline-none cursor-not-allowed opacity-70" style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--surface-2)', borderRadius: 0, color: 'var(--on-surface)' }} data-testid="nda-signer-title" />
          </div>
          <label className="flex items-start gap-2 mb-4 cursor-pointer" data-testid="nda-checkbox-label">
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-0.5" style={{ accentColor: 'var(--arroba-primary)' }} data-testid="nda-checkbox" />
            <span className="text-xs" style={{ color: 'var(--on-surface)' }}>
              He leído y acepto los términos del Acuerdo de Confidencialidad Mutuo. Confirmo que la firma electrónica tiene plena validez.
            </span>
          </label>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 text-sm font-bold" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }} data-testid="nda-cancel-btn">
              Cancelar
            </button>
            <button onClick={handleSign} disabled={!accepted || !signerName.trim() || signing}
              className="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="nda-accept-btn">
              {signing ? <Loader2 size={14} className="animate-spin" /> : <FileSignature size={14} />}
              Firmar NDA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== INTEREST FORM =====
const InterestForm = ({ dealId, operationTypes, onSubmit, loading }) => {
  const [form, setForm] = useState({
    valuation_range_min: '', valuation_range_max: '',
    operation_type: operationTypes?.[0] || 'full_sale', message: '', legal_accepted: false
  });
  const handleSubmit = () => {
    onSubmit({
      deal_id: dealId,
      valuation_range_min: form.valuation_range_min ? parseFloat(form.valuation_range_min) : null,
      valuation_range_max: form.valuation_range_max ? parseFloat(form.valuation_range_max) : null,
      operation_type: form.operation_type,
      message: form.message || null,
      legal_accepted: form.legal_accepted
    });
  };
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="interest-form">
      <h3 className="font-bold mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-arroba-coral" /> Enviar interés</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Valoración mín (€)</Label>
          <Input type="number" value={form.valuation_range_min} onChange={e => setForm({...form, valuation_range_min: e.target.value})}
            placeholder="2000000" className="mt-1" data-testid="interest-val-min" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Valoración máx (€)</Label>
          <Input type="number" value={form.valuation_range_max} onChange={e => setForm({...form, valuation_range_max: e.target.value})}
            placeholder="3500000" className="mt-1" data-testid="interest-val-max" />
        </div>
      </div>
      <div className="mb-4">
        <Label className="text-xs uppercase tracking-wider text-slate-500">Tipo de operación</Label>
        <Select value={form.operation_type} onValueChange={v => setForm({...form, operation_type: v})}>
          <SelectTrigger className="mt-1" data-testid="interest-op-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full_sale">Compra total</SelectItem>
            <SelectItem value="partial_sale">Compra parcial</SelectItem>
            <SelectItem value="merger">Fusión</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4">
        <Label className="text-xs uppercase tracking-wider text-slate-500">Mensaje (opcional)</Label>
        <Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
          placeholder="¿Por qué estás interesado?" className="mt-1 h-20" data-testid="interest-message" />
      </div>
      <label className="flex items-start gap-2 mb-4 cursor-pointer">
        <input type="checkbox" checked={form.legal_accepted} onChange={e => setForm({...form, legal_accepted: e.target.checked})}
          className="mt-1 rounded" data-testid="interest-legal-checkbox" />
        <span className="text-xs text-slate-500">Confirmo que esta expresión de interés es de buena fe</span>
      </label>
      <Button onClick={handleSubmit} disabled={loading || !form.legal_accepted}
        className="w-full bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="submit-interest-btn">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
        Enviar interés
      </Button>
    </div>
  );
};

// ===== LOI UPGRADE FORM =====
const LoiForm = ({ engagementId, onSubmit, loading }) => {
  const [form, setForm] = useState({
    valuation_offer: '', structure: 'cash', acquisition_percentage: '100',
    conditions: '', is_binding: false
  });
  const handleSubmit = () => {
    onSubmit(engagementId, {
      valuation_offer: parseFloat(form.valuation_offer),
      structure: form.structure,
      acquisition_percentage: parseFloat(form.acquisition_percentage),
      conditions: form.conditions || null,
      is_binding: form.is_binding
    });
  };
  return (
    <div className="bg-white border border-arroba-coral/20 rounded-lg p-6" data-testid="loi-form">
      <h3 className="font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-arroba-coral" /> Oferta indicativa (LOI)</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Valoración propuesta (€) *</Label>
          <Input type="number" value={form.valuation_offer} onChange={e => setForm({...form, valuation_offer: e.target.value})}
            placeholder="2800000" className="mt-1" data-testid="loi-valuation" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">% Adquisición</Label>
          <Input type="number" value={form.acquisition_percentage} onChange={e => setForm({...form, acquisition_percentage: e.target.value})}
            placeholder="100" className="mt-1" data-testid="loi-percentage" />
        </div>
      </div>
      <div className="mb-4">
        <Label className="text-xs uppercase tracking-wider text-slate-500">Estructura</Label>
        <Select value={form.structure} onValueChange={v => setForm({...form, structure: v})}>
          <SelectTrigger className="mt-1" data-testid="loi-structure"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="earn_out">Earn-out</SelectItem>
            <SelectItem value="mixed">Mixto (Cash + Earn-out)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4">
        <Label className="text-xs uppercase tracking-wider text-slate-500">Condiciones</Label>
        <Textarea value={form.conditions} onChange={e => setForm({...form, conditions: e.target.value})}
          placeholder="Sujeto a due diligence..." className="mt-1 h-20" data-testid="loi-conditions" />
      </div>
      <label className="flex items-start gap-2 mb-4 cursor-pointer">
        <input type="checkbox" checked={form.is_binding} onChange={e => setForm({...form, is_binding: e.target.checked})}
          className="mt-1 rounded" data-testid="loi-binding" />
        <span className="text-xs text-slate-500">Oferta vinculante (si no se marca, es indicativa/no vinculante)</span>
      </label>
      <Button onClick={handleSubmit} disabled={loading || !form.valuation_offer}
        className="w-full bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="submit-loi-btn">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
        Enviar LOI
      </Button>
    </div>
  );
};

// ===== MAIN DEAL PAGE =====
const DealPage = () => {
  const { dealId } = useParams();
  const [searchParams] = useSearchParams();
  const fromBuyer = searchParams.get('from') === 'buyer';
  const fromSection = searchParams.get('section');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [signingNda, setSigningNda] = useState(false);
  const [engagement, setEngagement] = useState(null);
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [submittingLoi, setSubmittingLoi] = useState(false);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [showLoiForm, setShowLoiForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const hasNda = deal?.has_nda;
  const isOwner = deal?.is_owner;
  const isBuyer = isAuthenticated && user?.role === 'buyer';

  // Time tracking — only for authenticated buyers
  useTimeTracker(dealId, 'deal_page', isBuyer && !isOwner);
  useTimeTracker(dealId, 'infomemo', isBuyer && hasNda && !isOwner);
  useTimeTracker(dealId, 'data_room', isBuyer && hasNda && !isOwner);

  const fetchDeal = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dealsAPI.getDealPage(dealId);
      setDeal(response.data);
      // Load engagement status
      if (isAuthenticated) {
        try {
          const engRes = await engagementsAPI.getMyStatus(dealId);
          setEngagement(engRes.data);
          const savedRes = await engagementsAPI.checkSaved(dealId);
          setIsSaved(savedRes.data.saved);
        } catch {}
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar el deal');
    } finally {
      setLoading(false);
    }
  }, [dealId, isAuthenticated]);

  useEffect(() => { fetchDeal(); }, [fetchDeal]);

  // Dynamic OG meta tags for social sharing
  useEffect(() => {
    if (!deal) return;
    const teaser = deal.teaser || {};
    const title = teaser.title || teaser.headline || 'Oportunidad de Inversión';
    const desc = teaser.short_description || teaser.description || 'Oportunidad en el sector digital — ARROBA';
    const pageTitle = `${title} — ARROBA`;

    document.title = pageTitle;

    const setMeta = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (el) { el.setAttribute('content', content); }
      else {
        el = document.createElement('meta');
        el.setAttribute(property.startsWith('og:') ? 'property' : 'name', property);
        el.setAttribute('content', content);
        document.head.appendChild(el);
      }
    };

    setMeta('og:title', pageTitle);
    setMeta('og:description', desc);
    setMeta('og:url', window.location.href);
    setMeta('twitter:title', pageTitle);
    setMeta('twitter:description', desc);

    return () => { document.title = 'Arroba — Plataforma M&A para Agencias Digitales'; };
  }, [deal]);

  const handleSignNda = () => {
    if (!isAuthenticated) { navigate(`/login?redirect=/explorar/${dealId}`); return; }
    setShowNdaModal(true);
  };

  const handleNdaSigned = async (result) => {
    setShowNdaModal(false);
    await fetchDeal();
  };

  const handleSubmitInterest = async (data) => {
    setSubmittingInterest(true); setError('');
    try {
      await engagementsAPI.submitInterest(data);
      setShowInterestForm(false);
      await fetchDeal();
    } catch (err) { setError(err.response?.data?.detail || 'Error al enviar interés'); }
    finally { setSubmittingInterest(false); }
  };

  const handleSubmitLoi = async (engagementId, data) => {
    setSubmittingLoi(true); setError('');
    try {
      await engagementsAPI.upgradeToLoi(engagementId, data);
      setShowLoiForm(false);
      await fetchDeal();
    } catch (err) { setError(err.response?.data?.detail || 'Error al enviar LOI'); }
    finally { setSubmittingLoi(false); }
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) { navigate(`/login?redirect=/explorar/${dealId}`); return; }
    try {
      if (isSaved) { await engagementsAPI.unsaveDeal(dealId); setIsSaved(false); }
      else { await engagementsAPI.saveDeal(dealId); setIsSaved(true); }
    } catch {}
  };

  if (loading) {
    return <Layout><div className="container mx-auto px-4 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-arroba-coral mx-auto" /></div></Layout>;
  }
  if (error && !deal) {
    return <Layout><div className="container mx-auto px-4 py-12 text-center"><AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" /><p className="text-slate-600">{error}</p><Link to="/explorar"><Button variant="outline" className="mt-4">Volver al Marketplace</Button></Link></div></Layout>;
  }

  const teaser = deal?.teaser || {};
  const hasEngagement = engagement?.has_engagement;
  const engStage = engagement?.stage;
  const engType = engagement?.type;
  const stageInfo = stageBadge[engStage] || {};

  return (
    <Layout>
      {showNdaModal && <NdaModal dealId={dealId} user={user} onSigned={handleNdaSigned} onClose={() => setShowNdaModal(false)} />}

      <div className="container mx-auto px-4 py-8 max-w-5xl" data-testid="deal-page">
        {fromBuyer ? (
          <Link to={`/buyer/procesos`} className="inline-flex items-center text-sm mb-6" style={{ color: 'var(--outline)' }} data-testid="back-to-dashboard"
            onClick={(e) => { if (fromSection) { e.preventDefault(); navigate(`/buyer/procesos`); setTimeout(() => { const el = document.querySelector(`[data-testid="nav-${fromSection}"]`); if (el) el.click(); }, 100); } }}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al panel de comprador
          </Link>
        ) : (
          <Link to="/explorar" className="inline-flex items-center text-sm mb-6" style={{ color: 'var(--outline)' }} data-testid="back-to-marketplace">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Marketplace
          </Link>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2" data-testid="deal-error">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <OperationBadge types={deal?.operation_types_allowed} />
              {hasNda && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700" data-testid="nda-badge">NDA Firmado</span>}
              {hasEngagement && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stageInfo.color}`} data-testid="engagement-stage-badge">{engType === 'LOI' ? `LOI — ${stageInfo.text}` : stageInfo.text}</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" data-testid="deal-title">
              {hasNda || isOwner ? (deal?.company?.trade_name || deal?.company?.legal_name || teaser.title) : teaser.title || teaser.headline || 'Oportunidad de Inversión'}
            </h1>
            <div className="flex items-center flex-wrap gap-4 text-sm text-slate-500">
              {(teaser.location || teaser.geography_display) && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {teaser.location || teaser.geography_display}</span>}
              {teaser.year_founded && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Fundada en {teaser.year_founded}</span>}
              {teaser.sector_display && <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {teaser.sector_display}</span>}
            </div>
            {/* Market signals */}
            {deal?.signals && deal.signals.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3" data-testid="deal-signals">
                {deal.signals.map((s, i) => {
                  const cfg = {
                    loi: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
                    competition: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
                    process: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
                    dr_activity: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
                    freshness: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  }[s.type] || { dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200' };
                  return (
                    <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {s.text}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!hasNda && !isOwner && (
              <Button onClick={handleSignNda}
                className="bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="request-access-btn">
                <Shield className="w-4 h-4 mr-2" /> Solicitar Acceso
              </Button>
            )}
            {isAuthenticated && !isOwner && (
              <Button variant="outline" onClick={handleToggleSave} data-testid="save-deal-btn">
                {isSaved ? <BookmarkCheck className="w-4 h-4 mr-2 text-arroba-coral" /> : <Bookmark className="w-4 h-4 mr-2" />}
                {isSaved ? 'Guardado' : 'Guardar'}
              </Button>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="deal-description">
              <p className="text-slate-600 leading-relaxed">{teaser.short_description || teaser.description || ''}</p>
            </div>

            {/* Highlights */}
            {teaser.highlights?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="deal-highlights">
                <h3 className="font-bold text-slate-900 mb-3">Puntos fuertes</h3>
                <ul className="space-y-2">{teaser.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><Check className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" /> {h}</li>
                ))}</ul>
              </div>
            )}

            {/* POST-NDA: Infomemo */}
            {(hasNda || isOwner) && deal?.infomemo?.content && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="deal-infomemo">
                <div className="flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-arroba-coral" /><h3 className="font-bold text-slate-900">Information Memorandum</h3></div>
                <div className="prose prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{deal.infomemo.content}</ReactMarkdown></div>
              </div>
            )}

            {/* POST-NDA: Data Room */}
            {hasNda && !isOwner && (
              <DataRoomBuyerView dealId={dealId} />
            )}

            {/* PRE-NDA: NDA CTA */}
            {!hasNda && !isOwner && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center" data-testid="nda-cta-section">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Documento completo disponible tras NDA</h3>
                <p className="text-sm text-slate-500 mb-4">Firma el acuerdo de confidencialidad para acceder al infomemo y poder enviar tu interés.</p>
                <Button onClick={handleSignNda}
                  className="bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="request-access-cta-btn">
                  <Shield className="w-4 h-4 mr-2" /> Solicitar Acceso
                </Button>
              </div>
            )}

            {/* POST-NDA: Interest/LOI Section */}
            {hasNda && !isOwner && (
              <div className="space-y-6">
                {/* Status of existing engagement */}
                {hasEngagement && (
                  <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="engagement-status">
                    <h3 className="font-bold mb-3">Tu {engType === 'LOI' ? 'oferta (LOI)' : 'interés'}</h3>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${stageInfo.color}`}>{stageInfo.text}</span>
                      <span className="text-sm text-slate-500">Tipo: {engType}</span>
                    </div>
                    {engagement.valuation_range_min && (
                      <p className="text-sm text-slate-600">Rango: {(engagement.valuation_range_min / 1e6).toFixed(1)}M - {(engagement.valuation_range_max / 1e6).toFixed(1)}M €</p>
                    )}
                    {engagement.valuation_offer && (
                      <p className="text-sm text-slate-600 font-semibold mt-1">Oferta LOI: {(engagement.valuation_offer / 1e6).toFixed(1)}M €</p>
                    )}

                    {/* Upgrade to LOI CTA */}
                    {engType === 'INTEREST' && engStage !== 'REJECTED' && (
                      <div className="mt-4">
                        {!showLoiForm ? (
                          <Button onClick={() => setShowLoiForm(true)} className="bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="upgrade-loi-cta">
                            <ArrowUpRight className="w-4 h-4 mr-2" /> Mejorar oferta (LOI)
                          </Button>
                        ) : (
                          <LoiForm engagementId={engagement.engagement_id} onSubmit={handleSubmitLoi} loading={submittingLoi} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Send Interest (if no engagement yet) */}
                {!hasEngagement && (
                  <>
                    {/* Block if profile incomplete */}
                    {user?.role === 'buyer' && !user?.buyer_profile?.profile_complete ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center" data-testid="profile-incomplete-block">
                        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                        <h3 className="font-bold mb-2">Perfil incompleto</h3>
                        <p className="text-sm text-slate-500 mb-4">Completa tu perfil de comprador antes de enviar interés o LOI</p>
                        <Button onClick={() => navigate('/buyer/onboarding')} className="bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="go-complete-profile-btn">
                          Completar perfil
                        </Button>
                      </div>
                    ) : !showInterestForm ? (
                      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center" data-testid="interest-cta">
                        <Send className="w-10 h-10 text-arroba-coral mx-auto mb-3" />
                        <h3 className="font-bold mb-2">¿Te interesa esta oportunidad?</h3>
                        <p className="text-sm text-slate-500 mb-4">Envía tu expresión de interés al seller</p>
                        <Button onClick={() => setShowInterestForm(true)} className="bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="show-interest-form-btn">
                          <Send className="w-4 h-4 mr-2" /> Enviar interés
                        </Button>
                      </div>
                    ) : (
                      <InterestForm dealId={dealId} operationTypes={deal?.operation_types_allowed} onSubmit={handleSubmitInterest} loading={submittingInterest} />
                    )}
                  </>
                )}

                {/* Next steps (post-engagement) */}
                {hasEngagement && engStage !== 'REJECTED' && (
                  <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="next-steps">
                    <h3 className="font-bold text-slate-900 mb-4">Siguientes pasos</h3>
                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left" data-testid="request-meeting-btn">
                        <div className="flex items-center gap-3"><Users className="w-5 h-5 text-arroba-blue" />
                          <div><p className="font-semibold text-sm">Solicitar reunión</p><p className="text-xs text-slate-500">Con el seller o su advisor</p></div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity log */}
            {hasNda && deal?.activity_log?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="activity-log">
                <h3 className="font-bold text-slate-900 mb-3">Actividad</h3>
                <div className="space-y-2">{deal.activity_log.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" /><span>{item.label}</span>
                    <span className="text-xs text-slate-400 ml-auto">{item.date ? new Date(item.date).toLocaleDateString('es-ES') : ''}</span>
                  </div>
                ))}</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="deal-financials">
              <h3 className="font-bold text-slate-900 mb-4">Datos Financieros</h3>
              <div className="space-y-4">
                <div><p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Facturación</p><p className="text-lg font-bold" data-testid="deal-revenue">{teaser.revenue_range || teaser.revenue_display || 'N/D'}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-slate-400 mb-1">EBITDA</p><p className="text-lg font-bold" data-testid="deal-ebitda">{teaser.ebitda_range || teaser.ebitda_display || 'N/D'}</p></div>
                {teaser.ebitda_margin_range && <div><p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Margen EBITDA</p><p className="font-semibold">{teaser.ebitda_margin_range}</p></div>}
                {teaser.growth_indicator && <div><p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Crecimiento</p><p className="font-semibold text-arroba-green flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {teaser.growth_indicator}</p></div>}
                {(deal?.asking_price || deal?.price_range) && (
                  <div className="pt-3 border-t">
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{deal.asking_price ? 'Precio solicitado' : 'Rango de valoración'}</p>
                    <p className="text-lg font-bold text-arroba-coral">{deal.asking_price ? `${(deal.asking_price / 1e6).toFixed(1)}M €` : deal.price_range}</p>
                    {deal?.price_negotiable && <span className="text-xs text-slate-400">Negociable</span>}
                  </div>
                )}
              </div>
            </div>
            {(hasNda || isOwner) && deal?.company && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="company-identity">
                <h3 className="font-bold text-slate-900 mb-4">Compañía</h3>
                <div className="space-y-3 text-sm">
                  <div><p className="text-slate-400 text-xs">Nombre Legal</p><p className="font-semibold">{deal.company.legal_name}</p></div>
                  {deal.company.trade_name && <div><p className="text-slate-400 text-xs">Marca</p><p className="font-semibold">{deal.company.trade_name}</p></div>}
                  {deal.company.website && <div><p className="text-slate-400 text-xs">Web</p><a href={deal.company.website} target="_blank" rel="noopener noreferrer" className="text-arroba-coral hover:underline">{deal.company.website}</a></div>}
                  <div><p className="text-slate-400 text-xs">Ubicación</p><p>{deal.company.city}, {deal.company.country}</p></div>
                </div>
              </div>
            )}
            <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="quick-facts">
              <h3 className="font-bold text-slate-900 mb-4">Datos clave</h3>
              <div className="space-y-3 text-sm">
                {teaser.employees_range && <div className="flex justify-between"><span className="text-slate-500">Empleados</span><span className="font-semibold">{teaser.employees_range}</span></div>}
                {teaser.recurring_revenue_indicator && <div className="flex justify-between"><span className="text-slate-500">Recurrencia</span><span className="font-semibold">{teaser.recurring_revenue_indicator}</span></div>}
                {teaser.deal_type && <div className="flex justify-between"><span className="text-slate-500">Operación</span><span className="font-semibold">{teaser.deal_type}</span></div>}
              </div>
            </div>
            {!isAuthenticated && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center" data-testid="login-cta">
                <Shield className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-3">Regístrate para solicitar acceso</p>
                <Link to={`/register?role=buyer&redirect=/explorar/${dealId}`}><Button className="w-full bg-arroba-coral hover:bg-arroba-coral/90 text-white">Crear cuenta</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DealPage;
