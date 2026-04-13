import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../layout/Layout';
import api from '../../services/api';
import { fmtMillions } from '../../utils/formatES';
import {
  Loader2, ArrowLeft, Check, Clock, Lock, Star, Shield, Send,
  Calendar, MessageSquare, FolderOpen, FileText, Handshake,
  ChevronRight, AlertTriangle, Users, ArrowRight, HelpCircle
} from 'lucide-react';

const STATE_LABELS = {
  NDA_SIGNED: 'NDA firmado',
  INTEREST_SUBMITTED: 'Interes enviado',
  INTEREST_ACCEPTED: 'Interes aceptado',
  INTEREST_REJECTED: 'Interes declinado',
  INTEREST_RESPONDED: 'Respuesta del vendedor',
  MEETING_REQUESTED: 'Reunion solicitada',
  MEETING_CONFIRMED: 'Reunion confirmada',
  DATA_ROOM_REQUESTED: 'Data Room solicitado',
  DATA_ROOM_PARTIALLY_GRANTED: 'Data Room parcialmente concedido',
  EXCLUSIVITY_REQUESTED: 'Exclusividad solicitada',
  EXCLUSIVITY_GRANTED: 'Exclusividad concedida',
  PRELIMINARY_OFFER_SUBMITTED: 'Oferta preliminar enviada',
  PRELIMINARY_OFFER_ACCEPTED: 'Oferta preliminar aceptada',
  FORMAL_LOI_SUBMITTED: 'LOI formal enviada',
  FORMAL_LOI_ACCEPTED: 'LOI formal aceptada',
  DD_IN_PROGRESS: 'Due Diligence en curso',
  DD_COMPLETED_READY_TO_CLOSE: 'DD completada',
  CLOSING_IN_PROGRESS: 'Cierre en proceso',
  DEAL_CLOSED_SUCCESS: 'Operacion cerrada',
};

const MicrocopyBlock = ({ text }) => (
  <div className="flex items-start gap-2 p-3 mb-4" style={{ background: 'var(--surface-1)' }}>
    <HelpCircle size={12} className="shrink-0 mt-0.5" style={{ color: 'var(--outline)' }} />
    <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>{text}</p>
  </div>
);

const TimelineEvent = ({ event }) => {
  const colors = { NDA_SIGNED: '#16a34a', INTEREST_SUBMITTED: 'var(--arroba-primary)', INTEREST_ACCEPTED: '#16a34a', MEETING_PROPOSED: '#d97706', MEETING_CONFIRMED: '#16a34a' };
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-2 h-2 shrink-0" style={{ background: colors[event.event] || 'var(--outline)' }} />
      <div className="flex-1">
        <p className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{STATE_LABELS[event.event] || event.event}</p>
        <p className="text-[9px]" style={{ color: 'var(--outline)' }}>{new Date(event.at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
};

export const DealProcessView = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [process, setProcess] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({});

  const load = useCallback(async () => {
    try {
      const [procRes, actRes] = await Promise.all([
        api.get(`/deal-process/${dealId}`),
        api.get(`/deal-process/${dealId}/available-actions`),
      ]);
      setProcess(procRes.data);
      setActions(actRes.data.actions || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [dealId]);

  useEffect(() => { load(); }, [load]);

  const submitAction = async (actionKey, payload) => {
    setFormLoading(true);
    try {
      if (actionKey === 'submit_interest') {
        await api.post(`/deal-process/${dealId}/interest`, payload);
      } else if (actionKey === 'request_meeting') {
        await api.post(`/deal-process/${dealId}/meeting`, payload);
      }
      setActiveForm(null);
      setFormData({});
      await load();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error');
    } finally { setFormLoading(false); }
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 size={18} className="animate-spin" /></div></Layout>;
  if (!process) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><p className="text-sm" style={{ color: 'var(--outline)' }}>Firma el NDA para iniciar el proceso.</p></div></Layout>;

  return (
    <Layout showFooter={false}>
      <div className="px-6 py-2 flex items-center gap-2 text-[10px]" style={{ background: 'var(--surface-1)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:underline" style={{ color: 'var(--outline)' }}><ArrowLeft size={10} /> Volver</button>
        <span style={{ color: 'var(--outline)' }}>/</span>
        <span className="font-bold" style={{ color: 'var(--on-surface)' }}>Proceso del deal</span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8" data-testid="deal-process-view">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* State header */}
          <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'rgba(22,163,74,0.06)', color: '#16a34a' }}>{STATE_LABELS[process.state] || process.state}</span>
            </div>
            <h1 className="text-xl font-extrabold mb-1" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Proceso de negociacion</h1>
            <p className="text-xs" style={{ color: 'var(--outline)' }}>Deal: {dealId}</p>
          </div>

          {/* Available actions */}
          {actions.length > 0 && !activeForm && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ACCIONES DISPONIBLES</p>
              <div className="space-y-2">
                {actions.map(a => (
                  <button key={a.key} onClick={() => { setActiveForm(a.key); setFormData({}); }} className="w-full flex items-center gap-3 p-3 text-left transition-all hover:translate-x-0.5" style={{ background: 'var(--surface-1)' }}>
                    <Star size={12} style={{ color: 'var(--arroba-primary)' }} />
                    <div className="flex-1">
                      <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{a.label}</p>
                      <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{a.microcopy}</p>
                    </div>
                    <ArrowRight size={12} style={{ color: 'var(--outline)' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interest form */}
          {activeForm === 'submit_interest' && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>EXPRESAR INTERES</p>
              <MicrocopyBlock text="El vendedor recibira tu expresion de interes y podra aceptar, responder o declinar. Tu mensaje y tipo de interes seran visibles por el vendedor y por ARROBA." />

              <div className="space-y-4">
                <div>
                  <label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>TIPO DE INTERES</label>
                  <select value={formData.interest_type || ''} onChange={e => setFormData(d => ({ ...d, interest_type: e.target.value }))} className="input-arroba w-full">
                    <option value="">Selecciona...</option>
                    <option value="exploratory">Exploratorio — Quiero saber mas</option>
                    <option value="serious">Interes serio — Encaja con nuestra tesis</option>
                    <option value="strategic">Interes estrategico — Sinergias claras</option>
                    <option value="financial">Interes financiero — Oportunidad de inversion</option>
                  </select>
                  <p className="text-[9px] mt-1" style={{ color: 'var(--outline)' }}>Selecciona el nivel que mejor describe tu situacion actual.</p>
                </div>
                <div>
                  <label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>MENSAJE</label>
                  <textarea value={formData.message || ''} onChange={e => setFormData(d => ({ ...d, message: e.target.value }))} className="input-arroba w-full resize-none" rows={3} placeholder="Explica brevemente por que te interesa esta oportunidad..." />
                  <p className="text-[9px] mt-1" style={{ color: 'var(--outline)' }}>Este mensaje sera visible por el vendedor y por ARROBA.</p>
                </div>
                <div>
                  <label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>RANGO ORIENTATIVO (OPCIONAL)</label>
                  <p className="text-[9px] mb-2" style={{ color: 'var(--outline)' }}>Un rango orientativo ayuda al vendedor a evaluar el encaje, pero no es vinculante.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={formData.range_min || ''} onChange={e => setFormData(d => ({ ...d, range_min: e.target.value }))} className="input-arroba" placeholder="Desde (EUR)" />
                    <input type="number" value={formData.range_max || ''} onChange={e => setFormData(d => ({ ...d, range_max: e.target.value }))} className="input-arroba" placeholder="Hasta (EUR)" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button disabled={!formData.interest_type || !formData.message || formLoading} onClick={() => submitAction('submit_interest', { interest_type: formData.interest_type, message: formData.message, indicative_range: formData.range_min ? { min: parseFloat(formData.range_min), max: parseFloat(formData.range_max) } : null })} className="px-5 py-2.5 text-[11px] font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }} data-testid="submit-interest-btn">
                    {formLoading ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} Enviar expresion de interes
                  </button>
                  <button onClick={() => setActiveForm(null)} className="px-4 py-2.5 text-[11px] font-bold" style={{ background: 'var(--surface-2)' }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Meeting form */}
          {activeForm === 'request_meeting' && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>SOLICITAR REUNION</p>
              <MicrocopyBlock text="Las reuniones siempre incluyen buyer, seller y un representante de ARROBA. Propone 3 franjas horarias. El vendedor y ARROBA confirmaran la mas viable." />

              <div className="space-y-4">
                <div>
                  <label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>MOTIVO</label>
                  <select value={formData.purpose || ''} onChange={e => setFormData(d => ({ ...d, purpose: e.target.value }))} className="input-arroba w-full">
                    <option value="">Selecciona...</option>
                    <option value="exploratorio">Exploratorio — Primera toma de contacto</option>
                    <option value="negociacion">Negociacion — Discutir condiciones</option>
                    <option value="due_diligence">Due Diligence — Aclaraciones DD</option>
                    <option value="post_oferta">Post-oferta — Seguimiento</option>
                  </select>
                </div>
                <div>
                  <label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>3 FRANJAS HORARIAS PROPUESTAS</label>
                  <p className="text-[9px] mb-2" style={{ color: 'var(--outline)' }}>Propone 3 opciones para facilitar la coordinacion.</p>
                  {[0, 1, 2].map(i => (
                    <input key={i} type="datetime-local" value={formData[`slot_${i}`] || ''} onChange={e => setFormData(d => ({ ...d, [`slot_${i}`]: e.target.value }))} className="input-arroba w-full mb-2" />
                  ))}
                </div>
                <div>
                  <label className="label-arroba mb-1 block" style={{ color: 'var(--outline)' }}>MENSAJE (OPCIONAL)</label>
                  <textarea value={formData.meeting_message || ''} onChange={e => setFormData(d => ({ ...d, meeting_message: e.target.value }))} className="input-arroba w-full resize-none" rows={2} placeholder="Contexto adicional para la reunion..." />
                </div>
                <div className="flex gap-2 pt-2">
                  <button disabled={!formData.purpose || !formData.slot_0 || formLoading} onClick={() => submitAction('request_meeting', { proposed_slots: [0,1,2].filter(i => formData[`slot_${i}`]).map(i => ({ datetime: formData[`slot_${i}`], duration_minutes: 45 })), purpose: formData.purpose, label: formData.purpose, message: formData.meeting_message })} className="px-5 py-2.5 text-[11px] font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }} data-testid="submit-meeting-btn">
                    {formLoading ? <Loader2 size={11} className="animate-spin" /> : <Calendar size={11} />} Solicitar reunion
                  </button>
                  <button onClick={() => setActiveForm(null)} className="px-4 py-2.5 text-[11px] font-bold" style={{ background: 'var(--surface-2)' }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Timeline */}
            <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>TIMELINE</p>
              <div className="space-y-0">
                {(process.timeline || []).slice().reverse().map((e, i) => <TimelineEvent key={`${e.event}-${i}`} event={e} />)}
              </div>
            </div>

            {/* Quick links */}
            <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ACCESOS RAPIDOS</p>
              <button onClick={() => navigate(`/explorar/${dealId}`)} className="w-full flex items-center gap-2 p-2 mb-1 text-left" style={{ background: 'var(--surface-1)' }}>
                <FileText size={10} /><span className="text-[10px] font-semibold">Ver ficha del deal</span>
              </button>
              <button onClick={() => navigate(`/qa/${dealId}`)} className="w-full flex items-center gap-2 p-2 mb-1 text-left" style={{ background: 'var(--surface-1)' }}>
                <MessageSquare size={10} /><span className="text-[10px] font-semibold">Abrir Q&A</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
