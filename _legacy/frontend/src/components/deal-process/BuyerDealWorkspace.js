import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DealProcessSummary from './DealProcessSummary';
import { fmtMillions } from '../../utils/formatES';
import {
  Shield, Star, Calendar, FolderOpen, FileText, Handshake,
  Lock, CheckCircle2, Settings, Eye, ArrowLeft, Loader2,
  Check, Clock, AlertTriangle, Send, HelpCircle
} from 'lucide-react';

const PHASES = [
  { id: 'resumen', label: 'RESUMEN', icon: Eye },
  { id: 'nda', label: 'NDA', icon: Shield },
  { id: 'interes', label: 'INTERÉS', icon: Star },
  { id: 'reunion', label: 'REUNIÓN', icon: Calendar },
  { id: 'dataroom', label: 'DATA ROOM', icon: FolderOpen },
  { id: 'oferta', label: 'OFERTA INDICATIVA', icon: Handshake },
  { id: 'loi', label: 'LOI', icon: FileText },
  { id: 'exclusividad', label: 'EXCLUSIVIDAD', icon: Lock },
  { id: 'dd', label: 'DUE DILIGENCE', icon: CheckCircle2 },
  { id: 'closing', label: 'CIERRE', icon: Settings },
];

const DOT = { completed: '#16a34a', current: 'var(--arroba-primary)', pending: 'var(--surface-2)', blocked: '#dc2626' };
const STATUS_LABELS = { firmado: 'Firmado', pendiente: 'Pendiente', submitted: 'Enviado', accepted: 'Aceptado', rejected: 'Rechazado', confirmed: 'Confirmada', proposed: 'Propuesta', partially_granted: 'Acceso parcial', preparing: 'En preparación', sent: 'Entregado', granted: 'Concedida', countered: 'Contraofertada', en_curso: 'En curso', completada: 'Completada', bloqueada: 'Bloqueada', no_iniciada: 'No iniciada', upgraded_to_loi: 'Formalizada como LOI', no_iniciado: 'No iniciado' };

const Microcopy = ({ text }) => (
  <div className="flex items-start gap-2 p-3 mt-3" style={{ background: 'var(--surface-1)' }}>
    <HelpCircle size={10} className="shrink-0 mt-0.5" style={{ color: 'var(--outline)' }} />
    <p className="text-[9px]" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>{text}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const color = status === 'firmado' || status === 'accepted' || status === 'confirmed' || status === 'granted' || status === 'completada' ? '#16a34a'
    : status === 'rejected' || status === 'bloqueada' ? '#dc2626'
    : status === 'submitted' || status === 'proposed' || status === 'en_curso' ? '#d97706' : 'var(--outline)';
  return <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: color + '15', color }}>{(STATUS_LABELS[status] || status || 'Pendiente').toUpperCase()}</span>;
};

const BuyerDealWorkspace = () => {
  const { dealId, section } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tree, setTree] = useState(null);
  const [phaseData, setPhaseData] = useState(null);
  const [phaseLoading, setPhaseLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentPhase = section || 'resumen';

  // Load tree + initial phase
  const loadTree = useCallback(async () => {
    try {
      const res = await api.get('/deal-process/my-process-tree');
      const deal = (res.data || []).find(d => d.deal_id === dealId);
      setTree(deal);
    } catch { /* fallback */ }
    finally { setLoading(false); }
  }, [dealId]);

  useEffect(() => { loadTree(); }, [loadTree]);

  // Load phase detail when section changes
  useEffect(() => {
    if (!dealId || currentPhase === 'resumen') { setPhaseData(null); return; }
    setPhaseLoading(true);
    api.get(`/deal-process/buyer-phase/${dealId}/${currentPhase}`)
      .then(r => setPhaseData(r.data))
      .catch(() => setPhaseData(null))
      .finally(() => setPhaseLoading(false));
  }, [dealId, currentPhase]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}><Loader2 size={18} className="animate-spin" /></div>;

  const phases = tree?.phases || {};

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="buyer-deal-workspace">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="w-60 shrink-0 flex flex-col" style={{ background: 'var(--surface-1)', minHeight: '100vh' }}>
        <div className="px-5 pt-6 pb-2">
          <span className="text-xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</span>
        </div>

        <button onClick={() => navigate('/buyer/procesos')} className="flex items-center gap-2 px-5 py-2 text-[9px] font-bold mb-2" style={{ color: 'var(--outline)' }}>
          <ArrowLeft size={10} /> MIS PROCESOS
        </button>

        {/* Deal name */}
        <div className="px-5 py-2 mb-1" style={{ borderBottom: '1px solid var(--surface-2)' }}>
          <p className="text-[10px] font-black" style={{ color: 'var(--on-surface)' }}>{tree?.company_name || 'Deal'}</p>
          <p className="text-[8px] font-bold" style={{ color: 'var(--outline)' }}>{tree?.state}</p>
        </div>

        {/* Canonical phases */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {PHASES.map(p => {
            const active = currentPhase === p.id;
            const status = phases[p.id] || 'pending';
            const Icon = p.icon;
            return (
              <button key={p.id} onClick={() => navigate(`/buyer/deal/${dealId}/proceso/${p.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all"
                style={{ background: active ? 'var(--surface-lowest)' : 'transparent', boxShadow: active ? '0 2px 8px rgba(25,28,30,0.04)' : 'none' }}>
                <div className="w-2 h-2 shrink-0" style={{ background: DOT[status] || DOT.pending, borderRadius: status === 'completed' ? '50%' : 0 }} />
                <span className="text-[10px] font-bold" style={{ color: active ? 'var(--on-surface)' : status === 'pending' ? 'var(--outline-variant)' : 'var(--on-surface)', letterSpacing: '0.04em' }}>{p.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-3 text-[8px]" style={{ color: 'var(--outline)', borderTop: '1px solid var(--surface-2)' }}>
          <p>{user?.email}</p>
          <p className="font-bold mt-0.5">COMPRADOR</p>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 min-h-screen">
        <div className="px-8 py-6 max-w-4xl">
          {/* Process summary header */}
          <div className="mb-6">
            <DealProcessSummary dealId={dealId} />
          </div>

          {/* Phase content */}
          {phaseLoading ? (
            <div className="py-12 text-center"><Loader2 size={16} className="animate-spin mx-auto" /></div>
          ) : currentPhase === 'resumen' ? (
            <div className="p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>RESUMEN DE TU PROCESO</p>
              <p className="text-xs mb-4" style={{ color: 'var(--on-surface)', lineHeight: 1.7 }}>Vista general de tu participación en {tree?.company_name}. Navega por las fases del proceso en la barra lateral para ver el estado de cada una y ejecutar las acciones disponibles.</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(phases).filter(([,v]) => v !== 'pending').map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 p-2" style={{ background: 'var(--surface-1)' }}>
                    <div className="w-2 h-2" style={{ background: DOT[v], borderRadius: v === 'completed' ? '50%' : 0 }} />
                    <span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{k.toUpperCase()}</span>
                    <StatusBadge status={v} />
                  </div>
                ))}
              </div>
              <Microcopy text="Cada fase refleja tu estado real dentro de este deal. Las fases completadas se marcan en verde, las activas en rojo y las pendientes en gris." />
            </div>
          ) : phaseData ? (
            <PhaseContent phase={currentPhase} data={phaseData} dealId={dealId} navigate={navigate} />
          ) : (
            <div className="p-6 text-center" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="text-xs" style={{ color: 'var(--outline)' }}>Cargando información de esta fase...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

/* ═══ Phase Content — renders real data per phase ═══ */
const PhaseContent = ({ phase, data, dealId, navigate }) => {
  const status = data.latest_status || data.status;

  return (
    <div className="p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
      <div className="flex items-center gap-3 mb-4">
        <p className="label-arroba" style={{ color: 'var(--arroba-primary)' }}>{phase.toUpperCase()}</p>
        {status && <StatusBadge status={status} />}
      </div>

      {/* NDA */}
      {phase === 'nda' && (
        <>
          <p className="text-xs mb-3" style={{ color: 'var(--on-surface)', lineHeight: 1.7 }}>
            {data.status === 'firmado'
              ? `NDA firmado el ${data.signed_at ? new Date(data.signed_at).toLocaleDateString('es-ES') : '—'}. Tienes acceso a la ficha completa y al infomemo.`
              : 'Firma el acuerdo de confidencialidad para desbloquear el acceso completo a esta oportunidad.'}
          </p>
          <p className="text-[10px] mb-3" style={{ color: 'var(--outline)' }}>Desbloquea: {data.unlocks}</p>
          <button className="px-4 py-2 text-[10px] font-bold" style={{ background: data.status === 'firmado' ? 'var(--surface-2)' : 'var(--on-surface)', color: data.status === 'firmado' ? 'var(--on-surface)' : '#fff' }}>{data.cta}</button>
          <Microcopy text="El NDA es un acuerdo mutuo de confidencialidad. Al firmarlo, el vendedor también puede ver tu perfil de comprador." />
        </>
      )}

      {/* Interés */}
      {phase === 'interes' && (
        <>
          {data.expressions?.length > 0 ? (
            <div className="space-y-3 mb-4">
              {data.expressions.map(e => (
                <div key={e.interest_id} className="p-3" style={{ background: 'var(--surface-1)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={e.status} />
                    <span className="text-[9px]" style={{ color: 'var(--outline)' }}>{e.interest_type} · {new Date(e.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--on-surface)' }}>"{e.message}"</p>
                  {e.seller_response && <p className="text-[10px] mt-1 p-2" style={{ background: 'var(--surface-lowest)', color: 'var(--outline)' }}>Respuesta: {e.seller_response.message || e.seller_response.action}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>Envía una expresión de interés al vendedor para iniciar la conversación. Puedes indicar el tipo de interés y un rango orientativo.</p>
          )}
          <button className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>{data.cta}</button>
          <Microcopy text="Tu expresión de interés será visible por el vendedor y por ARROBA. Si el vendedor acepta, se abrirá un canal Q&A." />
        </>
      )}

      {/* Reunión */}
      {phase === 'reunion' && (
        <>
          {data.meetings?.length > 0 ? (
            <div className="space-y-3 mb-4">
              {data.meetings.map(m => (
                <div key={m.meeting_id} className="p-3" style={{ background: 'var(--surface-1)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={m.status} />
                    <span className="text-[9px]" style={{ color: 'var(--outline)' }}>{m.purpose} · {m.proposed_slots?.length || 0} slots</span>
                  </div>
                  {m.confirmed_slot && <p className="text-xs font-bold" style={{ color: '#16a34a' }}>Confirmada: {new Date(m.confirmed_slot.datetime).toLocaleString('es-ES')}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>Solicita una videoconferencia con el vendedor y ARROBA. Propone 3 franjas horarias.</p>
          )}
          <button className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>{data.cta}</button>
          <Microcopy text="Las reuniones siempre incluyen buyer, seller y un representante de ARROBA." />
        </>
      )}

      {/* Data Room */}
      {phase === 'dataroom' && (
        <>
          {data.granted_folders?.length > 0 ? (
            <div className="mb-4">
              <p className="text-xs mb-2" style={{ color: 'var(--on-surface)' }}>Tienes acceso a {data.granted_folders.length} carpeta(s):</p>
              <div className="flex flex-wrap gap-2">{data.granted_folders.map(f => <span key={f} className="text-[9px] font-bold px-2 py-1" style={{ background: 'var(--surface-1)' }}>{f}</span>)}</div>
            </div>
          ) : data.requests?.length > 0 ? (
            <div className="mb-4"><p className="text-xs" style={{ color: 'var(--outline)' }}>Solicitud de acceso enviada. Esperando respuesta del vendedor.</p>
              {data.requests[0]?.status === 'rejected' && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>Tu solicitud fue rechazada.</p>}
            </div>
          ) : (
            <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>Solicita acceso al Data Room. El vendedor seleccionará las carpetas que te comparte.</p>
          )}
          <button className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>{data.cta}</button>
          <Microcopy text="Esta solicitud no abre automáticamente todo el Data Room. El vendedor decide qué carpetas compartir contigo." />
        </>
      )}

      {/* Oferta indicativa */}
      {phase === 'oferta' && (
        <>
          {data.offers?.length > 0 ? (
            <div className="space-y-3 mb-4">
              {data.offers.map(o => (
                <div key={o.offer_id} className="p-3" style={{ background: 'var(--surface-1)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <StatusBadge status={o.status} />
                    {o.enterprise_value && <span className="text-sm font-black" style={{ color: 'var(--arroba-primary)' }}>{fmtMillions(o.enterprise_value)}</span>}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--on-surface)' }}>{o.executive_summary?.slice(0, 120)}</p>
                  {o.seller_response && <p className="text-[10px] mt-1 p-2" style={{ background: 'var(--surface-lowest)', color: 'var(--outline)' }}>Respuesta: {o.seller_response.message || o.seller_response.action}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>Presenta una oferta indicativa estructurada al vendedor. Incluye valoración, estructura de pago y condiciones.</p>
          )}
          <button className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>{data.cta}</button>
          <Microcopy text="La oferta indicativa no es vinculante. El vendedor puede aceptar, rechazar, pedir más información o invitarte a formalizar una LOI." />
        </>
      )}

      {/* LOI */}
      {phase === 'loi' && (
        <>
          {data.lois?.length > 0 ? (
            <div className="space-y-3 mb-4">
              {data.lois.map(l => (
                <div key={l.loi_id} className="p-3" style={{ background: 'var(--surface-1)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <StatusBadge status={l.status} />
                    {l.enterprise_value && <span className="text-sm font-black" style={{ color: 'var(--arroba-primary)' }}>{fmtMillions(l.enterprise_value)}</span>}
                  </div>
                  {l.exclusivity_requested && <p className="text-[9px] font-bold" style={{ color: '#d97706' }}>Exclusividad solicitada: {l.exclusivity_days} días</p>}
                  {l.counter_terms && <div className="mt-1 p-2" style={{ background: 'rgba(217,119,6,0.04)' }}><p className="text-[9px] font-bold" style={{ color: '#d97706' }}>Contraoferta del vendedor</p></div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>Formaliza tu propuesta como Letter of Intent. Si ya enviaste una oferta indicativa, los datos se precargan automáticamente.</p>
          )}
          <button className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>{data.cta}</button>
          <Microcopy text="La LOI formal es el paso previo a la exclusividad y la due diligence. Al enviarla, aceptas los términos indicados." />
        </>
      )}

      {/* Exclusividad */}
      {phase === 'exclusividad' && (
        <>
          {data.granted ? (
            <div className="p-4 mb-4" style={{ background: 'rgba(22,163,74,0.04)', borderLeft: '3px solid #16a34a' }}>
              <p className="text-xs font-bold" style={{ color: '#16a34a' }}>Exclusividad concedida</p>
              <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Hasta: {data.end_date ? new Date(data.end_date).toLocaleDateString('es-ES') : '—'}</p>
              <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Las acciones competitivas de otros compradores están bloqueadas.</p>
            </div>
          ) : data.requests?.length > 0 ? (
            <div className="mb-4"><p className="text-xs" style={{ color: 'var(--outline)' }}>Solicitud de exclusividad enviada. Estado: {data.requests[0]?.status}</p></div>
          ) : (
            <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>Solicita exclusividad para avanzar con seguridad en el proceso. La exclusividad bloquea acciones competitivas de otros compradores.</p>
          )}
          <button className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>{data.cta}</button>
          <Microcopy text="La exclusividad bloquea otras acciones competitivas hasta la fecha indicada. El vendedor puede aceptar, rechazar o proponer un plazo alternativo." />
        </>
      )}

      {/* Due Diligence */}
      {phase === 'dd' && (
        <>
          {data.status === 'no_iniciada' ? (
            <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>La Due Diligence se iniciará cuando el vendedor esté preparado. Aquí verás el progreso por áreas y podrás comentar en cada ítem.</p>
          ) : (
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg font-black" style={{ color: data.status === 'completada' ? '#16a34a' : 'var(--on-surface)' }}>{data.completion_pct || 0}%</span>
                <div className="flex-1 h-2" style={{ background: 'var(--surface-2)' }}><div className="h-full" style={{ width: `${data.completion_pct || 0}%`, background: data.status === 'bloqueada' ? '#dc2626' : '#16a34a' }} /></div>
              </div>
              {data.sections?.map(s => (
                <div key={s.name} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5" style={{ background: s.status === 'completado' ? '#16a34a' : s.resolved > 0 ? '#d97706' : 'var(--surface-2)' }} />
                  <span className="text-[10px] font-bold flex-1">{s.name}</span>
                  <span className="text-[9px]" style={{ color: 'var(--outline)' }}>{s.resolved}/{s.total}</span>
                </div>
              ))}
            </div>
          )}
          <button className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>{data.cta}</button>
          <Microcopy text="El vendedor y ARROBA gestionan los estados de cada ítem. Tú puedes comentar en cada punto. Recibirás notificación de cada cambio." />
        </>
      )}

      {/* Cierre */}
      {phase === 'closing' && (
        <>
          {data.data ? (
            <div className="mb-4">
              <p className="text-xs" style={{ color: 'var(--on-surface)' }}>Estado del cierre: {data.status}</p>
              {data.data.target_close_date && <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Fecha objetivo: {new Date(data.data.target_close_date).toLocaleDateString('es-ES')}</p>}
            </div>
          ) : (
            <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>El cierre lo gestiona ARROBA. Aquí verás el estado final de la operación cuando el proceso llegue a esta fase.</p>
          )}
          <button className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>{data.cta}</button>
          <Microcopy text="Solo ARROBA gestiona los estados de la fase de cierre. Seller y buyer tienen acceso en modo lectura." />
        </>
      )}
    </div>
  );
};

export default BuyerDealWorkspace;
