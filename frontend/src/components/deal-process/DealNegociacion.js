import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Loader2, Star, Calendar, FolderOpen, FileText, Shield, Users,
  Check, Clock, HelpCircle, ArrowRight, MessageSquare, Handshake
} from 'lucide-react';

const EVENT_COLORS = {
  NDA_SIGNED: '#16a34a', INTEREST_SUBMITTED: '#006493', INTEREST_ACCEPTED: '#16a34a', INTEREST_REJECTED: '#dc2626',
  MEETING_PROPOSED: '#006493', MEETING_CONFIRMED: '#16a34a', MEETING_REJECTED: '#dc2626',
  DATA_ROOM_REQUESTED: '#006493', DATA_ROOM_PARTIALLY_GRANTED: '#16a34a',
  DOCUMENTS_REQUESTED: '#006493', DOCUMENT_SENT: '#16a34a',
  EXCLUSIVITY_REQUESTED: '#006493', EXCLUSIVITY_GRANTED: '#16a34a', EXCLUSIVITY_COUNTERED: '#d97706',
};

const EVENT_LABELS = {
  NDA_SIGNED: 'NDA firmado', INTEREST_SUBMITTED: 'Interes enviado', INTEREST_ACCEPTED: 'Interes aceptado',
  MEETING_PROPOSED: 'Reunion solicitada', MEETING_CONFIRMED: 'Reunion confirmada',
  DATA_ROOM_REQUESTED: 'Data Room solicitado', DATA_ROOM_PARTIALLY_GRANTED: 'Data Room concedido',
  DOCUMENTS_REQUESTED: 'Documento solicitado', EXCLUSIVITY_REQUESTED: 'Exclusividad solicitada',
  EXCLUSIVITY_GRANTED: 'Exclusividad concedida', EXCLUSIVITY_COUNTERED: 'Contraoferta exclusividad',
};

const TYPE_ICONS = { exclusivity: Shield, offer: Handshake, interest: Star, meeting: Calendar, dataroom: FolderOpen, document: FileText };
const TYPE_LABELS = { exclusivity: 'Exclusividad', offer: 'Oferta preliminar', interest: 'Interes', meeting: 'Reunión', dataroom: 'Data Room', document: 'Documento' };

const MICROCOPY = {
  exclusivity: 'Tu decision puede bloquear acciones competitivas de otros buyers.',
  offer: 'Tienes una oferta preliminar pendiente. Revisa valoracion, estructura y condiciones antes de decidir.',
  interest: 'Decide si aceptar este interes. Al aceptar, se abre un canal Q&A con el buyer.',
  meeting: 'Decide si aceptar un slot de reunion. Las reuniones incluyen buyer, seller y ARROBA.',
  dataroom: 'Selecciona que carpetas compartir. Esta solicitud no abre todo el Data Room.',
  document: 'El buyer ha solicitado un documento concreto. Puedes confirmar, preparar o rechazar.',
};

const DealNegociacion = ({ dealId, sellerId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/deal-process/${dealId}/seller-dashboard`);
      setData(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [dealId]);

  useEffect(() => { load(); }, [load]);

  const respond = async (type, id, action) => {
    setActionLoading(`${type}-${id}-${action}`);
    try {
      const endpoints = {
        interest: `/deal-process/${dealId}/interest/${id}/respond`,
        meeting: `/deal-process/${dealId}/meeting/${id}/respond`,
        dataroom: `/deal-process/${dealId}/dataroom-request/${id}/respond`,
        document: `/deal-process/${dealId}/document-request/${id}/respond`,
        exclusivity: `/deal-process/${dealId}/exclusivity/${id}/respond`,
      };
      await api.post(endpoints[type], { action });
      await load();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error');
    } finally { setActionLoading(null); }
  };

  if (loading) return <div className="py-12 text-center"><Loader2 size={16} className="animate-spin mx-auto" /></div>;

  const pending = data?.pending_decisions || [];
  const grouped = {};
  pending.forEach(p => { if (!grouped[p.type]) grouped[p.type] = []; grouped[p.type].push(p); });

  return (
    <div className="space-y-6" data-testid="deal-negociacion">
      {/* Header */}
      <div>
        <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>NEGOCIACION</p>
        <p className="text-xs" style={{ color: 'var(--outline)' }}>{data?.process_count || 0} proceso{data?.process_count !== 1 ? 's' : ''} activo{data?.process_count !== 1 ? 's' : ''} · {pending.length} decision{pending.length !== 1 ? 'es' : ''} pendiente{pending.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Pending decisions */}
      {pending.length > 0 ? (
        <div>
          <p className="label-arroba mb-3" style={{ color: 'var(--on-surface)' }}>PENDIENTE DE TU DECISION</p>
          {Object.entries(grouped).map(([type, items]) => {
            const Icon = TYPE_ICONS[type] || Star;
            return (
              <div key={type} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} style={{ color: 'var(--arroba-primary)' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{TYPE_LABELS[type] || type}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5" style={{ background: 'rgba(217,119,6,0.08)', color: '#d97706' }}>{items.length}</span>
                </div>
                <div className="flex items-start gap-2 p-2 mb-2" style={{ background: 'var(--surface-1)' }}>
                  <HelpCircle size={10} className="shrink-0 mt-0.5" style={{ color: 'var(--outline)' }} />
                  <p className="text-[9px]" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>{MICROCOPY[type]}</p>
                </div>
                {items.map(item => (
                  <div key={item.id} className="p-4 mb-2" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{item.buyer_name || item.buyer_id}</p>
                        <p className="text-[9px]" style={{ color: 'var(--outline)' }}>
                          {type === 'interest' && `Tipo: ${item.interest_type}`}
                          {type === 'meeting' && `${item.purpose} · ${item.slots_count} slots`}
                          {type === 'dataroom' && 'Solicitud de acceso'}
                          {type === 'document' && `${item.category}: ${item.description?.slice(0,50)}`}
                          {type === 'exclusivity' && `${item.period_days} dias · ${item.rationale?.slice(0,50)}`}
                          {type === 'offer' && `EV: ${item.enterprise_value ? (item.enterprise_value/1e6).toFixed(1)+'M€' : '?'} · ${item.commitment_level} · ${item.completeness}% completo`}
                        </p>
                      </div>
                      <p className="text-[9px]" style={{ color: 'var(--outline)' }}>{item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES') : ''}</p>
                    </div>
                    {item.message && <p className="text-[10px] mb-3 p-2" style={{ color: 'var(--on-surface)', background: 'var(--surface-1)', lineHeight: 1.5 }}>"{item.message}"</p>}
                    <div className="flex gap-2 flex-wrap">
                      {item.actions?.map(a => {
                        const primary = ['accept', 'accept_slot', 'approve', 'confirm', 'grant'].includes(a);
                        const isLoading = actionLoading === `${type}-${item.id}-${a}`;
                        return (
                          <button key={a} onClick={() => respond(type, item.id, a)} disabled={!!actionLoading}
                            className="px-3 py-1.5 text-[9px] font-bold flex items-center gap-1 disabled:opacity-50"
                            style={{ background: primary ? '#16a34a' : a === 'reject' ? 'rgba(220,38,38,0.06)' : 'var(--surface-2)', color: primary ? '#fff' : a === 'reject' ? '#dc2626' : 'var(--on-surface)' }}>
                            {isLoading ? <Loader2 size={9} className="animate-spin" /> : null}
                            {a.replace(/_/g, ' ').toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-5 text-center" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <Check size={20} className="mx-auto mb-2" style={{ color: '#16a34a' }} />
          <p className="text-xs font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Sin decisiones pendientes</p>
          <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Todos los procesos de negociacion estan al dia.</p>
        </div>
      )}

      {/* In progress */}
      {data?.in_progress?.length > 0 && (
        <div>
          <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>EN CURSO</p>
          <div className="space-y-1">
            {data.in_progress.map((item, i) => (
              <div key={`${item.type}-${item.id}-${i}`} className="flex items-center gap-3 py-2 px-3" style={{ background: 'var(--surface-1)' }}>
                <div className="w-2 h-2" style={{ background: item.status === 'confirmed' ? '#16a34a' : item.status === 'accepted' ? '#16a34a' : '#d97706' }} />
                <span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{TYPE_LABELS[item.type] || item.type}</span>
                <span className="text-[9px]" style={{ color: 'var(--outline)' }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {data?.timeline?.length > 0 && (
        <div>
          <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>TIMELINE</p>
          <div className="space-y-0">
            {data.timeline.slice(0, 15).map((ev, i) => (
              <div key={`${ev.event}-${i}`} className="flex items-start gap-3 py-2">
                <div className="w-2.5 h-2.5 shrink-0 mt-1" style={{ background: EVENT_COLORS[ev.event] || 'var(--outline)' }} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{EVENT_LABELS[ev.event] || ev.event}</p>
                  <p className="text-[9px]" style={{ color: 'var(--outline)' }}>{ev.at ? new Date(ev.at).toLocaleDateString('es-ES', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealNegociacion;
