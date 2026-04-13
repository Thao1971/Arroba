import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../layout/Layout';
import api from '../../services/api';
import {
  Loader2, ArrowLeft, Check, Clock, Lock, Star, Shield, Send,
  Calendar, MessageSquare, FolderOpen, FileText, Handshake,
  ChevronRight, AlertTriangle, Users, ArrowRight, HelpCircle, X
} from 'lucide-react';

/* ═══ SEMANTIC EVENT MAPPING ═══
   Verde: aceptado, firmado, confirmado, concedido, completado
   Azul:  enviado, solicitado, propuesto
   Naranja: pendiente, counter, info requerida, en preparacion
   Rojo: rechazado, cancelado, expirado
*/
const EVENT_CONFIG = {
  NDA_SIGNED:              { color: '#16a34a', label: 'NDA firmado', variant: 'completed' },
  INTEREST_SUBMITTED:      { color: 'var(--arroba-blue, #006493)', label: 'Interes enviado', variant: 'submitted' },
  INTEREST_ACCEPTED:       { color: '#16a34a', label: 'Interes aceptado', variant: 'completed' },
  INTEREST_REJECTED:       { color: '#dc2626', label: 'Interes declinado', variant: 'rejected' },
  INTEREST_RESPONDED:      { color: '#d97706', label: 'Respuesta del vendedor', variant: 'pending' },
  MEETING_PROPOSED:        { color: 'var(--arroba-blue, #006493)', label: 'Reunion solicitada', variant: 'submitted' },
  MEETING_INFO_REQUESTED:  { color: '#d97706', label: 'Info solicitada (reunion)', variant: 'pending' },
  MEETING_COUNTER_PROPOSED:{ color: '#d97706', label: 'Alternativa propuesta', variant: 'pending' },
  MEETING_CONFIRMED:       { color: '#16a34a', label: 'Reunion confirmada', variant: 'completed' },
  MEETING_REJECTED:        { color: '#dc2626', label: 'Reunion declinada', variant: 'rejected' },
  DATA_ROOM_REQUESTED:     { color: 'var(--arroba-blue, #006493)', label: 'Data Room solicitado', variant: 'submitted' },
  DATA_ROOM_PARTIALLY_GRANTED: { color: '#16a34a', label: 'Data Room concedido (parcial)', variant: 'completed' },
  DATA_ROOM_REJECTED:      { color: '#dc2626', label: 'Data Room rechazado', variant: 'rejected' },
  DOCUMENTS_REQUESTED:     { color: 'var(--arroba-blue, #006493)', label: 'Documento solicitado', variant: 'submitted' },
  DOCUMENT_PREPARING:      { color: '#d97706', label: 'Documento en preparacion', variant: 'pending' },
  DOCUMENT_SENT:           { color: '#16a34a', label: 'Documento entregado', variant: 'completed' },
  DOCUMENT_REJECTED:       { color: '#dc2626', label: 'Documento rechazado', variant: 'rejected' },
  EXCLUSIVITY_REQUESTED:   { color: 'var(--arroba-blue, #006493)', label: 'Exclusividad solicitada', variant: 'submitted' },
  EXCLUSIVITY_GRANTED:     { color: '#16a34a', label: 'Exclusividad concedida', variant: 'completed' },
  EXCLUSIVITY_COUNTERED:   { color: '#d97706', label: 'Contraoferta de exclusividad', variant: 'pending' },
  EXCLUSIVITY_REJECTED:    { color: '#dc2626', label: 'Exclusividad rechazada', variant: 'rejected' },
  PRELIMINARY_OFFER_SUBMITTED: { color: 'var(--arroba-blue, #006493)', label: 'Oferta preliminar enviada', variant: 'submitted' },
  PRELIMINARY_OFFER_ACCEPTED:  { color: '#16a34a', label: 'Oferta preliminar aceptada', variant: 'completed' },
  FORMAL_LOI_SUBMITTED:    { color: 'var(--arroba-blue, #006493)', label: 'LOI formal enviada', variant: 'submitted' },
  FORMAL_LOI_ACCEPTED:     { color: '#16a34a', label: 'LOI formal aceptada', variant: 'completed' },
  DD_IN_PROGRESS:          { color: '#d97706', label: 'Due Diligence en curso', variant: 'pending' },
  DD_COMPLETED_READY_TO_CLOSE: { color: '#16a34a', label: 'DD completada', variant: 'completed' },
  DEAL_CLOSED_SUCCESS:     { color: '#16a34a', label: 'Operacion cerrada', variant: 'completed' },
  DEAL_CLOSED_FAILED:      { color: '#dc2626', label: 'Operacion no ejecutada', variant: 'rejected' },
};

const getEventConfig = (eventName) => EVENT_CONFIG[eventName] || { color: 'var(--outline)', label: eventName, variant: 'neutral' };

/* ═══ WAITING STATE CONTEXT ═══ */
const WAITING_CONTEXT = {
  INTEREST_SUBMITTED: { who: 'El vendedor', what: 'tu expresion de interes', next: 'Si acepta, se abrira un canal Q&A. Si responde, recibiras una respuesta guiada.' },
  MEETING_REQUESTED: { who: 'El vendedor y ARROBA', what: 'tu solicitud de reunion', next: 'Pueden aceptar un slot, proponer alternativas o pedir mas informacion.' },
  DATA_ROOM_REQUESTED: { who: 'El vendedor', what: 'tu solicitud de acceso al Data Room', next: 'El vendedor seleccionara las carpetas a compartir contigo.' },
  EXCLUSIVITY_REQUESTED: { who: 'El vendedor', what: 'tu solicitud de exclusividad', next: 'Puede aceptar, rechazar o proponer un plazo alternativo. Las acciones competitivas de otros compradores quedan en pausa.' },
  EXCLUSIVITY_COUNTERED: { who: 'Tu', what: 'la contraoferta de exclusividad del vendedor', next: 'Puedes aceptar o rechazar el plazo propuesto.' },
};

const MicrocopyBlock = ({ text }) => (
  <div className="flex items-start gap-2 p-3 mb-4" style={{ background: 'var(--surface-1)' }}>
    <HelpCircle size={12} className="shrink-0 mt-0.5" style={{ color: 'var(--outline)' }} />
    <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>{text}</p>
  </div>
);

const TimelineEvent = ({ event }) => {
  const cfg = getEventConfig(event.event);
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-2.5 h-2.5 shrink-0 mt-1" style={{ background: cfg.color, borderRadius: cfg.variant === 'completed' ? '50%' : 0 }} />
      <div className="flex-1">
        <p className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{cfg.label}</p>
        <p className="text-[9px]" style={{ color: 'var(--outline)' }}>{new Date(event.at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
};

/* ═══ WAITING STATE BLOCK ═══ */
const WaitingStateBlock = ({ state }) => {
  const ctx = WAITING_CONTEXT[state];
  if (!ctx) return null;
  const cfg = getEventConfig(state);
  return (
    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="waiting-state">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} style={{ color: '#d97706' }} />
        <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>Esperando respuesta</p>
      </div>
      <p className="text-xs mb-2" style={{ color: 'var(--on-surface)', lineHeight: 1.6 }}>
        {ctx.who} debe responder a {ctx.what}.
      </p>
      <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>
        {ctx.next}
      </p>
    </div>
  );
};

/* ═══ SELLER PENDING REQUEST CARD ═══ */
const SellerRequestCard = ({ type, items, onRespond }) => {
  const icons = { interest: Star, meeting: Calendar, dataroom: FolderOpen, document: FileText, exclusivity: Shield };
  const labels = { interest: 'Expresiones de interes', meeting: 'Reuniones', dataroom: 'Accesos Data Room', document: 'Documentos', exclusivity: 'Exclusividad' };
  const Icon = icons[type] || FileText;

  return (
    <div className="p-4 mb-3" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} style={{ color: 'var(--arroba-primary)' }} />
        <p className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{labels[type] || type}</p>
        <span className="text-[9px] font-bold px-1.5 py-0.5 ml-auto" style={{ background: 'rgba(217,119,6,0.08)', color: '#d97706' }}>{items.length} PENDIENTE{items.length > 1 ? 'S' : ''}</span>
      </div>
      {items.map(item => (
        <div key={item.id} className="p-3 mb-2" style={{ background: 'var(--surface-1)' }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{item.title}</p>
              <p className="text-[9px]" style={{ color: 'var(--outline)' }}>{item.subtitle}</p>
            </div>
            <p className="text-[9px]" style={{ color: 'var(--outline)' }}>{item.date}</p>
          </div>
          {item.message && <p className="text-[10px] mb-2 p-2" style={{ color: 'var(--on-surface)', background: 'var(--surface-lowest)', lineHeight: 1.5 }}>"{item.message}"</p>}
          <div className="flex gap-2">
            {item.actions?.map(a => (
              <button key={a.key} onClick={() => onRespond(type, item.id, a.key)} className="px-3 py-1.5 text-[9px] font-bold" style={{ background: a.primary ? 'var(--on-surface)' : 'var(--surface-2)', color: a.primary ? '#fff' : 'var(--on-surface)' }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ═══ MAIN PAGE ═══ */
export const DealProcessView = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
  const [process, setProcess] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [sellerPending, setSellerPending] = useState(null);

  const load = useCallback(async () => {
    try {
      const [procRes, actRes] = await Promise.all([
        api.get(`/deal-process/${dealId}`),
        api.get(`/deal-process/${dealId}/available-actions`),
      ]);
      setProcess(procRes.data.processes ? procRes.data.processes[0] : procRes.data);
      setActions(actRes.data.actions || []);

      // Seller: load pending items
      if (isSeller) {
        const [ints, mtgs] = await Promise.all([
          api.get(`/deal-process/${dealId}/interests`).catch(() => ({ data: [] })),
          api.get(`/deal-process/${dealId}/meetings`).catch(() => ({ data: [] })),
        ]);
        setSellerPending({
          interests: (ints.data || []).filter(i => i.status === 'submitted'),
          meetings: (mtgs.data || []).filter(m => m.status === 'proposed'),
        });
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [dealId, isSeller]);

  useEffect(() => { load(); }, [load]);

  const submitAction = async (actionKey, payload) => {
    setFormLoading(true);
    try {
      const endpoints = {
        submit_interest: `/deal-process/${dealId}/interest`,
        request_meeting: `/deal-process/${dealId}/meeting`,
        request_dataroom: `/deal-process/${dealId}/dataroom-request`,
        request_document: `/deal-process/${dealId}/document-request`,
        request_exclusivity: `/deal-process/${dealId}/exclusivity`,
        submit_offer: `/deal-process/${dealId}/preliminary-offer`,
      };
      await api.post(endpoints[actionKey], payload);
      setActiveForm(null);
      setFormData({});
      await load();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error');
    } finally { setFormLoading(false); }
  };

  const handleSellerRespond = async (type, itemId, action) => {
    try {
      const endpoints = {
        interest: `/deal-process/${dealId}/interest/${itemId}/respond`,
        meeting: `/deal-process/${dealId}/meeting/${itemId}/respond`,
      };
      await api.post(endpoints[type], { action, message: '' });
      await load();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error');
    }
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 size={18} className="animate-spin" /></div></Layout>;
  if (!process) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><p className="text-sm" style={{ color: 'var(--outline)' }}>Firma el NDA para iniciar el proceso.</p></div></Layout>;

  const state = process.state || 'NDA_SIGNED';
  const stateCfg = getEventConfig(state);
  const isWaiting = actions.length === 0 && !isSeller;

  return (
    <Layout showFooter={false}>
      <div className="px-6 py-2 flex items-center gap-2 text-[10px]" style={{ background: 'var(--surface-1)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:underline" style={{ color: 'var(--outline)' }}><ArrowLeft size={10} /> Volver</button>
        <span style={{ color: 'var(--outline)' }}>/</span>
        <span className="font-bold" style={{ color: 'var(--on-surface)' }}>Proceso del deal</span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8" data-testid="deal-process-view">
        <div className="lg:col-span-2 space-y-6">
          {/* State header */}
          <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
            <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: stateCfg.color + '15', color: stateCfg.color }}>{stateCfg.label}</span>
            <h1 className="text-xl font-extrabold mt-2 mb-1" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Proceso de negociacion</h1>
            <p className="text-xs" style={{ color: 'var(--outline)' }}>Deal: {dealId}</p>
          </div>

          {/* Waiting state (buyer with no actions) */}
          {isWaiting && <WaitingStateBlock state={state} />}

          {/* Seller pending requests */}
          {isSeller && sellerPending && (
            <div>
              {sellerPending.interests.length > 0 && (
                <SellerRequestCard type="interest" items={sellerPending.interests.map(i => ({
                  id: i.interest_id, title: `Interes ${i.interest_type}`, subtitle: `Buyer: ${i.buyer_id}`, date: new Date(i.created_at).toLocaleDateString('es-ES'),
                  message: i.message, actions: [{ key: 'accept', label: 'ACEPTAR', primary: true }, { key: 'reject', label: 'RECHAZAR' }, { key: 'respond', label: 'RESPONDER' }],
                }))} onRespond={handleSellerRespond} />
              )}
              {sellerPending.meetings.length > 0 && (
                <SellerRequestCard type="meeting" items={sellerPending.meetings.map(m => ({
                  id: m.meeting_id, title: `Reunion: ${m.purpose}`, subtitle: `${m.proposed_slots?.length || 0} slots propuestos`, date: new Date(m.created_at).toLocaleDateString('es-ES'),
                  message: m.message, actions: [{ key: 'accept_slot', label: 'ACEPTAR SLOT', primary: true }, { key: 'counter_propose', label: 'ALTERNATIVA' }, { key: 'reject', label: 'RECHAZAR' }],
                }))} onRespond={handleSellerRespond} />
              )}
            </div>
          )}

          {/* Buyer available actions */}
          {!isSeller && actions.length > 0 && !activeForm && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ACCIONES DISPONIBLES</p>
              <div className="space-y-2">
                {actions.map(a => (
                  <button key={a.key} onClick={() => { setActiveForm(a.key); setFormData({}); }} className="w-full flex items-center gap-3 p-3 text-left transition-all hover:translate-x-0.5" style={{ background: 'var(--surface-1)' }}>
                    <Star size={12} style={{ color: 'var(--arroba-primary)' }} />
                    <div className="flex-1"><p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{a.label}</p><p className="text-[10px]" style={{ color: 'var(--outline)' }}>{a.microcopy}</p></div>
                    <ArrowRight size={12} style={{ color: 'var(--outline)' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══ BUYER FORMS ═══ */}

          {activeForm === 'submit_interest' && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>EXPRESAR INTERES</p>
              <MicrocopyBlock text="El vendedor recibira tu expresion de interes y podra aceptar, responder o declinar. Tu mensaje y tipo de interes seran visibles por el vendedor y por ARROBA." />
              <div className="space-y-4">
                <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>TIPO DE INTERES</label>
                  <select value={formData.interest_type || ''} onChange={e => setFormData(d => ({ ...d, interest_type: e.target.value }))} className="input-arroba w-full"><option value="">Selecciona...</option><option value="exploratory">Exploratorio</option><option value="serious">Interes serio</option><option value="strategic">Interes estrategico</option><option value="financial">Interes financiero</option></select></div>
                <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>MENSAJE</label>
                  <textarea value={formData.message || ''} onChange={e => setFormData(d => ({ ...d, message: e.target.value }))} className="input-arroba w-full resize-none" rows={3} placeholder="Explica brevemente por que te interesa..." /><p className="text-[9px] mt-1" style={{ color: 'var(--outline)' }}>Visible por vendedor y ARROBA.</p></div>
                <div className="flex gap-2 pt-2">
                  <button disabled={!formData.interest_type || !formData.message || formLoading} onClick={() => submitAction('submit_interest', { interest_type: formData.interest_type, message: formData.message })} className="px-5 py-2.5 text-[11px] font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }}><Send size={11} /> Enviar</button>
                  <button onClick={() => setActiveForm(null)} className="px-4 py-2.5 text-[11px] font-bold" style={{ background: 'var(--surface-2)' }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {activeForm === 'request_meeting' && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>SOLICITAR REUNION</p>
              <MicrocopyBlock text="Las reuniones siempre incluyen buyer, seller y un representante de ARROBA. Propone 3 franjas horarias." />
              <div className="space-y-3">
                <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>MOTIVO</label>
                  <select value={formData.purpose || ''} onChange={e => setFormData(d => ({ ...d, purpose: e.target.value }))} className="input-arroba w-full"><option value="">Selecciona...</option><option value="exploratorio">Exploratorio</option><option value="negociacion">Negociacion</option><option value="due_diligence">Due Diligence</option><option value="post_oferta">Post-oferta</option></select></div>
                <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>3 FRANJAS HORARIAS</label>
                  {[0,1,2].map(i => <input key={i} type="datetime-local" value={formData[`slot_${i}`] || ''} onChange={e => setFormData(d => ({ ...d, [`slot_${i}`]: e.target.value }))} className="input-arroba w-full mb-2" />)}</div>
                <div className="flex gap-2">
                  <button disabled={!formData.purpose || !formData.slot_0 || formLoading} onClick={() => submitAction('request_meeting', { proposed_slots: [0,1,2].filter(i => formData[`slot_${i}`]).map(i => ({ datetime: formData[`slot_${i}`], duration_minutes: 45 })), purpose: formData.purpose, label: formData.purpose })} className="px-5 py-2.5 text-[11px] font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }}><Calendar size={11} /> Solicitar</button>
                  <button onClick={() => setActiveForm(null)} className="px-4 py-2.5 text-[11px] font-bold" style={{ background: 'var(--surface-2)' }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {activeForm === 'request_dataroom' && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>SOLICITAR ACCESO AL DATA ROOM</p>
              <MicrocopyBlock text="Esta solicitud no abre automaticamente todo el Data Room. El vendedor seleccionara las carpetas a las que te da acceso." />
              <textarea value={formData.dr_message || ''} onChange={e => setFormData(d => ({ ...d, dr_message: e.target.value }))} className="input-arroba w-full resize-none mb-3" rows={3} placeholder="Que documentacion necesitas revisar..." />
              <div className="flex gap-2"><button disabled={formLoading} onClick={() => submitAction('request_dataroom', { message: formData.dr_message })} className="px-5 py-2.5 text-[11px] font-bold disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }}>Solicitar acceso</button><button onClick={() => setActiveForm(null)} className="px-4 py-2.5 text-[11px] font-bold" style={{ background: 'var(--surface-2)' }}>Cancelar</button></div>
            </div>
          )}

          {activeForm === 'request_document' && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>SOLICITAR DOCUMENTO</p>
              <MicrocopyBlock text="Describe el documento que necesitas. El vendedor podra enviartelo directamente o anadirlo al Data Room." />
              <div className="space-y-3">
                <select value={formData.doc_category || ''} onChange={e => setFormData(d => ({ ...d, doc_category: e.target.value }))} className="input-arroba w-full"><option value="">Categoria...</option><option value="financiero">Financiero</option><option value="legal">Legal</option><option value="fiscal">Fiscal</option><option value="comercial">Comercial</option><option value="operaciones">Operaciones</option><option value="equipo">Equipo</option><option value="tecnologia">Tecnologia</option></select>
                <textarea value={formData.doc_description || ''} onChange={e => setFormData(d => ({ ...d, doc_description: e.target.value }))} className="input-arroba w-full resize-none" rows={2} placeholder="Describe el documento..." />
                <div className="flex gap-2"><button disabled={!formData.doc_category || !formData.doc_description || formLoading} onClick={() => submitAction('request_document', { category: formData.doc_category, description: formData.doc_description })} className="px-5 py-2.5 text-[11px] font-bold disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }}>Solicitar</button><button onClick={() => setActiveForm(null)} className="px-4 py-2.5 text-[11px] font-bold" style={{ background: 'var(--surface-2)' }}>Cancelar</button></div>
              </div>
            </div>
          )}

          {activeForm === 'request_exclusivity' && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>SOLICITAR EXCLUSIVIDAD</p>
              <MicrocopyBlock text="La exclusividad bloqueara otras acciones competitivas hasta la fecha indicada. Otros compradores veran que hay un proceso exclusivo activo." />
              <div className="space-y-3">
                <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>PLAZO (DIAS)</label><input type="number" value={formData.excl_days || 30} onChange={e => setFormData(d => ({ ...d, excl_days: parseInt(e.target.value) }))} className="input-arroba w-32" min={7} max={180} /><p className="text-[9px] mt-1" style={{ color: 'var(--outline)' }}>Tipico: 30-60 dias.</p></div>
                <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>MOTIVO</label><textarea value={formData.excl_rationale || ''} onChange={e => setFormData(d => ({ ...d, excl_rationale: e.target.value }))} className="input-arroba w-full resize-none" rows={3} placeholder="Por que necesitas exclusividad..." /></div>
                <div className="flex gap-2"><button disabled={!formData.excl_rationale || formLoading} onClick={() => submitAction('request_exclusivity', { period_days: formData.excl_days || 30, rationale: formData.excl_rationale })} className="px-5 py-2.5 text-[11px] font-bold disabled:opacity-50" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>Solicitar exclusividad</button><button onClick={() => setActiveForm(null)} className="px-4 py-2.5 text-[11px] font-bold" style={{ background: 'var(--surface-2)' }}>Cancelar</button></div>
              </div>
            </div>
          )}

          {/* Preliminary offer form */}
          {activeForm === 'submit_offer' && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>OFERTA PRELIMINAR</p>
              <MicrocopyBlock text="Presenta una oferta estructurada al vendedor. No es vinculante. El vendedor podra aceptar, rechazar, pedir mas informacion o invitarte a formalizar una LOI." />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>ENTERPRISE VALUE (EUR)</label><input type="number" value={formData.ev || ''} onChange={e => setFormData(d => ({ ...d, ev: e.target.value }))} className="input-arroba w-full" placeholder="Ej: 3500000" /><p className="text-[9px] mt-1" style={{ color: 'var(--outline)' }}>Valor total de la empresa que propones.</p></div>
                  <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>TIPO DE OPERACION</label><select value={formData.op_type || 'full_sale'} onChange={e => setFormData(d => ({ ...d, op_type: e.target.value }))} className="input-arroba w-full"><option value="full_sale">Venta total (100%)</option><option value="partial_sale">Venta parcial</option><option value="investment">Inversion</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>CASH AL CIERRE (EUR)</label><input type="number" value={formData.cash || ''} onChange={e => setFormData(d => ({ ...d, cash: e.target.value }))} className="input-arroba w-full" placeholder="Importe en efectivo" /></div>
                  <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>PAGO DIFERIDO (EUR)</label><input type="number" value={formData.deferred || ''} onChange={e => setFormData(d => ({ ...d, deferred: e.target.value }))} className="input-arroba w-full" placeholder="Opcional" /></div>
                </div>
                <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>RESUMEN EJECUTIVO</label><textarea value={formData.summary || ''} onChange={e => setFormData(d => ({ ...d, summary: e.target.value }))} className="input-arroba w-full resize-none" rows={3} placeholder="Describe brevemente tu propuesta, motivacion y encaje..." /><p className="text-[9px] mt-1" style={{ color: 'var(--outline)' }}>Este resumen sera lo primero que lea el vendedor.</p></div>
                <div><label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>VALIDEZ DE LA OFERTA</label><input type="date" value={formData.validity || ''} onChange={e => setFormData(d => ({ ...d, validity: e.target.value }))} className="input-arroba w-48" /></div>
                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.subject_dd || true} onChange={e => setFormData(d => ({ ...d, subject_dd: e.target.checked }))} /><span className="text-[10px]">Sujeta a due diligence satisfactoria</span></div>
                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.legal || false} onChange={e => setFormData(d => ({ ...d, legal: e.target.checked }))} /><span className="text-[10px]">Acepto que esta oferta tiene caracter indicativo y no vinculante</span></div>
                <div className="flex gap-2 pt-2">
                  <button disabled={!formData.ev || !formData.summary || !formData.legal || formLoading} onClick={() => submitAction('submit_offer', { enterprise_value: parseFloat(formData.ev), operation_type: formData.op_type || 'full_sale', cash_at_closing: parseFloat(formData.cash) || null, deferred_payment: parseFloat(formData.deferred) || null, executive_summary: formData.summary, validity_date: formData.validity, subject_to_dd: formData.subject_dd !== false, legal_accepted: formData.legal, commitment_level: 'indicative' })} className="px-5 py-2.5 text-[11px] font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--arroba-primary)', color: '#fff' }}><Send size={11} /> Enviar oferta preliminar</button>
                  <button onClick={() => setActiveForm(null)} className="px-4 py-2.5 text-[11px] font-bold" style={{ background: 'var(--surface-2)' }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ═══ SIDEBAR ═══ */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>TIMELINE</p>
              {(process.timeline || []).slice().reverse().map((e, i) => <TimelineEvent key={`${e.event}-${i}`} event={e} />)}
            </div>
            <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ACCESOS RAPIDOS</p>
              <button onClick={() => navigate(`/explorar/${dealId}`)} className="w-full flex items-center gap-2 p-2 mb-1 text-left" style={{ background: 'var(--surface-1)' }}><FileText size={10} /><span className="text-[10px] font-semibold">Ver ficha del deal</span></button>
              <button onClick={() => navigate(`/qa/${dealId}`)} className="w-full flex items-center gap-2 p-2 mb-1 text-left" style={{ background: 'var(--surface-1)' }}><MessageSquare size={10} /><span className="text-[10px] font-semibold">Abrir Q&A</span></button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
