import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../layout/Layout';
import api from '../../services/api';
import DealProcessSummary from './DealProcessSummary';
import {
  Shield, Star, Calendar, FolderOpen, FileText, Users, Handshake,
  Lock, MessageSquare, CheckCircle2, Settings, Eye, ArrowLeft, Loader2
} from 'lucide-react';

const CANONICAL_STAGES = [
  { id: 'resumen', label: 'Resumen', icon: Eye },
  { id: 'nda', label: 'NDA', icon: Shield },
  { id: 'interes', label: 'Interés', icon: Star },
  { id: 'reunion', label: 'Reunión', icon: Calendar },
  { id: 'dataroom', label: 'Data Room', icon: FolderOpen },
  { id: 'oferta', label: 'Oferta indicativa', icon: Handshake },
  { id: 'loi', label: 'LOI', icon: FileText },
  { id: 'exclusividad', label: 'Exclusividad', icon: Lock },
  { id: 'dd', label: 'Due Diligence', icon: CheckCircle2 },
  { id: 'closing', label: 'Cierre', icon: Settings },
];

const STAGE_STATUS_COLORS = {
  completed: '#16a34a',
  current: 'var(--arroba-primary)',
  pending: 'var(--outline-variant)',
  blocked: '#dc2626',
};

const BuyerDealWorkspace = () => {
  const { dealId, section } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentSection = section || 'resumen';

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/deal-process/${dealId}/buyer-process-summary`);
      setSummary(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [dealId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 size={18} className="animate-spin" /></div></Layout>;

  // Build stage status map from summary
  const stageStatus = {};
  (summary?.phases || []).forEach(p => { stageStatus[p.id] = p.status; });

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="buyer-deal-workspace">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col" style={{ background: 'var(--surface-1)', minHeight: '100vh' }}>
        <div className="px-5 pt-6 pb-3">
          <span className="text-xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</span>
          <p className="text-[8px] font-bold mt-1 mb-3" style={{ color: 'var(--outline)', letterSpacing: '0.08em' }}>MI PROCESO</p>
        </div>

        <button onClick={() => navigate('/buyer/procesos')} className="flex items-center gap-2 px-5 py-2 text-[10px] font-bold mb-3" style={{ color: 'var(--outline)' }}>
          <ArrowLeft size={10} /> VOLVER A MIS PROCESOS
        </button>

        <nav className="flex-1 px-3 space-y-0.5">
          {CANONICAL_STAGES.map(stage => {
            const active = currentSection === stage.id;
            const status = stageStatus[stage.id] || 'pending';
            const dotColor = STAGE_STATUS_COLORS[status];
            const Icon = stage.icon;
            return (
              <button key={stage.id} onClick={() => navigate(`/buyer/deal/${dealId}/proceso/${stage.id}`)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all"
                style={{ background: active ? 'var(--surface-lowest)' : 'transparent', color: active ? 'var(--on-surface)' : status === 'pending' ? 'var(--outline-variant)' : 'var(--on-surface)', boxShadow: active ? '0 2px 8px rgba(25,28,30,0.04)' : 'none' }}>
                <div className="relative">
                  <Icon size={12} />
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5" style={{ background: dotColor, borderRadius: status === 'completed' ? '50%' : 0 }} />
                </div>
                <span className="text-[10px] font-semibold">{stage.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 text-[9px]" style={{ color: 'var(--outline)' }}>
          <p>{user?.email}</p>
          <p className="font-bold mt-1">COMPRADOR</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        <div className="px-8 py-6">
          {/* Header with summary */}
          {summary && (
            <div className="mb-6">
              <DealProcessSummary dealId={dealId} />
            </div>
          )}

          {/* Stage content — placeholder per stage */}
          <div className="space-y-4">
            {currentSection === 'resumen' && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>RESUMEN DE TU PROCESO</p>
                <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                  Vista general de tu participación en este deal. Navega por las fases del proceso para ver el estado de cada una y ejecutar las acciones disponibles.
                </p>
              </div>
            )}
            {currentSection === 'nda' && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>NDA</p>
                <p className="text-xs" style={{ color: stageStatus.nda === 'completed' ? '#16a34a' : 'var(--outline)' }}>{stageStatus.nda === 'completed' ? 'NDA firmado. Tienes acceso a la ficha completa y al infomemo.' : 'Firma el NDA para desbloquear el acceso completo a esta oportunidad.'}</p>
              </div>
            )}
            {currentSection === 'interes' && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>INTERÉS</p>
                <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                  {stageStatus.interes === 'completed' ? 'Tu interés ha sido aceptado. Se ha abierto un canal Q&A con el vendedor.' : stageStatus.interes === 'current' ? 'Has enviado tu expresión de interés. Esperando respuesta del vendedor.' : 'Envía una expresión de interés al vendedor para iniciar la conversación.'}
                </p>
              </div>
            )}
            {currentSection === 'reunion' && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>REUNIÓN</p>
                <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                  {stageStatus.reunion === 'completed' ? 'Reunión confirmada o completada.' : stageStatus.reunion === 'current' ? 'Reunión solicitada. El vendedor y ARROBA están coordinando los horarios.' : 'Solicita una videoconferencia con el vendedor y ARROBA.'}
                </p>
              </div>
            )}
            {currentSection === 'dataroom' && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>DATA ROOM</p>
                <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                  {stageStatus.dataroom === 'completed' ? 'Tienes acceso a las carpetas seleccionadas por el vendedor.' : 'Solicita acceso al Data Room. El vendedor seleccionará las carpetas que te comparte.'}
                </p>
              </div>
            )}
            {currentSection === 'oferta' && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>OFERTA INDICATIVA</p>
                <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                  {stageStatus.oferta === 'completed' ? 'Tu oferta indicativa ha sido aceptada. El siguiente paso es formalizar una LOI.' : stageStatus.oferta === 'current' ? 'Oferta enviada. Esperando respuesta del vendedor.' : 'Presenta una oferta indicativa estructurada al vendedor.'}
                </p>
              </div>
            )}
            {currentSection === 'loi' && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>LOI</p>
                <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                  {stageStatus.loi === 'completed' ? 'LOI aceptada. El proceso avanza a exclusividad y due diligence.' : stageStatus.loi === 'current' ? 'LOI formal enviada. Esperando respuesta del vendedor.' : 'Formaliza tu propuesta como Letter of Intent.'}
                </p>
              </div>
            )}
            {currentSection === 'exclusividad' && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>EXCLUSIVIDAD</p>
                <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                  {stageStatus.exclusividad === 'completed' ? 'Tienes exclusividad sobre este deal. Las acciones competitivas de otros compradores están bloqueadas.' : 'Solicita exclusividad para avanzar con seguridad en el proceso.'}
                </p>
              </div>
            )}
            {currentSection === 'dd' && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>DUE DILIGENCE</p>
                <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                  {stageStatus.dd === 'completed' ? 'Due Diligence completada. El proceso avanza a fase de cierre.' : stageStatus.dd === 'current' ? 'Due Diligence en curso. Puedes comentar en cada ítem de la checklist.' : stageStatus.dd === 'blocked' ? 'Due Diligence bloqueada. Contacta con el vendedor para resolver los bloqueos.' : 'La Due Diligence se iniciará cuando el vendedor esté preparado.'}
                </p>
              </div>
            )}
            {currentSection === 'closing' && (
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>CIERRE</p>
                <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                  {stageStatus.closing === 'completed' ? 'Operación cerrada.' : 'El cierre lo gestiona ARROBA. Aquí verás el estado final de la operación.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuyerDealWorkspace;
