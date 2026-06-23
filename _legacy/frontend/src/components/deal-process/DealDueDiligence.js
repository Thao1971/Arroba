import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Loader2, Check, Clock, AlertTriangle, Lock, ChevronDown, ChevronRight,
  MessageSquare, Shield, HelpCircle
} from 'lucide-react';

const STATUS_CONFIG = {
  pendiente: { color: 'var(--outline)', label: 'Pendiente', icon: Clock },
  en_revision: { color: '#d97706', label: 'En revisión', icon: Clock },
  resuelto: { color: '#16a34a', label: 'Resuelto', icon: Check },
  bloqueado: { color: '#dc2626', label: 'Bloqueado', icon: AlertTriangle },
  en_curso: { color: '#d97706', label: 'En curso', icon: Clock },
  completado: { color: '#16a34a', label: 'Completado', icon: Check },
  completada: { color: '#16a34a', label: 'Completada', icon: Check },
  no_iniciada: { color: 'var(--outline)', label: 'No iniciada', icon: Lock },
};

const DealDueDiligence = ({ dealId, user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [commentText, setCommentText] = useState('');

  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';
  const canManage = isSeller || isAdmin;

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/deal-process/${dealId}/dd/dashboard`);
      setData(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [dealId]);

  useEffect(() => { load(); }, [load]);

  const startDD = async () => {
    setActionLoading('start');
    try {
      await api.post(`/deal-process/${dealId}/dd/start`);
      await load();
    } catch (e) { alert(e.response?.data?.detail || 'Error'); }
    finally { setActionLoading(null); }
  };

  const updateItem = async (itemId, action, extra = {}) => {
    setActionLoading(itemId);
    try {
      await api.post(`/deal-process/${dealId}/dd/checklist/${itemId}/update`, { action, ...extra });
      await load();
    } catch (e) { alert(e.response?.data?.detail || 'Error'); }
    finally { setActionLoading(null); }
  };

  if (loading) return <div className="py-12 text-center"><Loader2 size={16} className="animate-spin mx-auto" /></div>;

  // Not started
  if (!data || data.status === 'no_iniciada') {
    return (
      <div className="space-y-4">
        <p className="label-arroba" style={{ color: 'var(--arroba-primary)' }}>DUE DILIGENCE</p>
        <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <Shield size={28} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Due Diligence no iniciada</p>
          <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Inicia la DD cuando el proceso esté listo. Se creará una checklist por áreas con ítems predefinidos.</p>
          {canManage && (
            <button onClick={startDD} disabled={actionLoading === 'start'} className="px-6 py-2.5 text-[11px] font-bold disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }}>
              {actionLoading === 'start' ? <Loader2 size={11} className="animate-spin" /> : 'INICIAR DUE DILIGENCE'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.en_curso;

  return (
    <div className="space-y-6" data-testid="deal-due-diligence">
      <div>
        <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>DUE DILIGENCE</p>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: statusCfg.color + '15', color: statusCfg.color }}>{statusCfg.label?.toUpperCase()}</span>
          <span className="text-xs" style={{ color: 'var(--outline)' }}>{data.completion_pct}% completada · {data.resolved_items}/{data.total_items} ítems · {data.blocked_count} bloqueados</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2" style={{ background: 'var(--surface-2)' }}>
        <div className="h-full transition-all" style={{ width: `${data.completion_pct}%`, background: data.blocked_count > 0 ? '#d97706' : '#16a34a' }} />
      </div>

      {/* Section progress overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.section_progress?.map(sp => {
          const spCfg = STATUS_CONFIG[sp.status] || STATUS_CONFIG.pendiente;
          return (
            <button key={sp.block_id} onClick={() => setExpandedSection(expandedSection === sp.block_id ? null : sp.block_id)}
              className="p-3 text-left transition-all" style={{ background: expandedSection === sp.block_id ? 'var(--surface-lowest)' : 'var(--surface-1)', boxShadow: expandedSection === sp.block_id ? '0 2px 8px rgba(25,28,30,0.04)' : 'none' }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: 'var(--on-surface)' }}>{sp.name}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1" style={{ background: 'var(--surface-2)' }}>
                  <div className="h-full" style={{ width: `${sp.completion_pct}%`, background: spCfg.color }} />
                </div>
                <span className="text-[9px] font-bold" style={{ color: spCfg.color }}>{sp.completion_pct}%</span>
              </div>
              {sp.blocked > 0 && <p className="text-[8px] font-bold mt-1" style={{ color: '#dc2626' }}>{sp.blocked} bloqueado{sp.blocked > 1 ? 's' : ''}</p>}
            </button>
          );
        })}
      </div>

      {/* Blockers alert */}
      {data.blockers?.length > 0 && (
        <div className="p-4" style={{ background: 'rgba(220,38,38,0.04)', borderLeft: '3px solid #dc2626' }}>
          <p className="text-[10px] font-bold mb-2" style={{ color: '#dc2626' }}>BLOQUEOS ACTIVOS ({data.blockers.length})</p>
          {data.blockers.map((b, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <AlertTriangle size={10} className="shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
              <div>
                <p className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{b.label} <span style={{ color: 'var(--outline)' }}>({b.section})</span></p>
                <p className="text-[9px]" style={{ color: 'var(--outline)' }}>Motivo: {b.reason} · Acción: {b.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded section detail */}
      {expandedSection && data.sections?.map(sec => {
        if (sec.block_id !== expandedSection) return null;
        return (
          <div key={sec.block_id} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
            <p className="label-arroba mb-3" style={{ color: 'var(--on-surface)' }}>{sec.name?.toUpperCase()}</p>
            <div className="space-y-2">
              {sec.items?.map(item => {
                const itemCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pendiente;
                const ItemIcon = itemCfg.icon;
                return (
                  <div key={item.item_id} className="p-3" style={{ background: 'var(--surface-1)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <ItemIcon size={11} style={{ color: itemCfg.color }} />
                      <span className="text-[10px] font-bold flex-1" style={{ color: 'var(--on-surface)' }}>{item.label}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5" style={{ background: itemCfg.color + '15', color: itemCfg.color }}>{itemCfg.label}</span>
                    </div>
                    {item.status === 'bloqueado' && (
                      <div className="mt-1 p-2" style={{ background: 'rgba(220,38,38,0.04)' }}>
                        <p className="text-[9px]" style={{ color: '#dc2626' }}>Motivo: {item.blocked_reason}</p>
                        <p className="text-[9px]" style={{ color: '#dc2626' }}>Acción: {item.blocked_action}</p>
                      </div>
                    )}
                    {/* Comments */}
                    {item.comments?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.comments.map((c, ci) => (
                          <p key={ci} className="text-[9px] px-2 py-1" style={{ background: c.role === 'buyer' ? 'rgba(0,100,147,0.04)' : 'var(--surface-2)', color: 'var(--on-surface)' }}>
                            <span className="font-bold">{c.role}:</span> {c.text}
                          </p>
                        ))}
                      </div>
                    )}
                    {/* Actions */}
                    <div className="flex gap-1 mt-2">
                      {canManage && item.status === 'pendiente' && (
                        <>
                          <button onClick={() => updateItem(item.item_id, 'update_status', { status: 'en_revision' })} disabled={!!actionLoading} className="px-2 py-1 text-[8px] font-bold" style={{ background: 'var(--surface-2)' }}>EN REVISIÓN</button>
                          <button onClick={() => updateItem(item.item_id, 'update_status', { status: 'resuelto' })} disabled={!!actionLoading} className="px-2 py-1 text-[8px] font-bold" style={{ background: '#16a34a', color: '#fff' }}>RESUELTO</button>
                          <button onClick={() => updateItem(item.item_id, 'mark_blocked', { reason: 'Pendiente de documentación', action_required: 'Seller debe subir documento' })} disabled={!!actionLoading} className="px-2 py-1 text-[8px] font-bold" style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626' }}>BLOQUEAR</button>
                        </>
                      )}
                      {canManage && item.status === 'en_revision' && (
                        <>
                          <button onClick={() => updateItem(item.item_id, 'update_status', { status: 'resuelto' })} disabled={!!actionLoading} className="px-2 py-1 text-[8px] font-bold" style={{ background: '#16a34a', color: '#fff' }}>RESUELTO</button>
                          <button onClick={() => updateItem(item.item_id, 'mark_blocked', { reason: 'Pendiente', action_required: 'Acción requerida' })} disabled={!!actionLoading} className="px-2 py-1 text-[8px] font-bold" style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626' }}>BLOQUEAR</button>
                        </>
                      )}
                      {canManage && item.status === 'bloqueado' && (
                        <button onClick={() => updateItem(item.item_id, 'resolve_blocked')} disabled={!!actionLoading} className="px-2 py-1 text-[8px] font-bold" style={{ background: '#16a34a', color: '#fff' }}>DESBLOQUEAR</button>
                      )}
                      <button onClick={() => {
                        const text = prompt('Comentario:');
                        if (text) updateItem(item.item_id, 'comment', { text });
                      }} className="px-2 py-1 text-[8px] font-bold" style={{ background: 'var(--surface-2)' }}>
                        <MessageSquare size={8} className="inline mr-1" />COMENTAR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Microcopy */}
      <div className="flex items-start gap-2 p-3" style={{ background: 'var(--surface-1)' }}>
        <HelpCircle size={10} className="shrink-0 mt-0.5" style={{ color: 'var(--outline)' }} />
        <p className="text-[9px]" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>
          {canManage ? 'Gestiona el estado de cada ítem. Al resolver todos los ítems de un área, se marca como completada automáticamente. Cuando todas las áreas estén completadas, la DD pasará a estado "completada".'
          : 'Puedes comentar en cada ítem. El vendedor y ARROBA gestionan los estados. Recibirás notificación de cada cambio.'}
        </p>
      </div>
    </div>
  );
};

export default DealDueDiligence;
