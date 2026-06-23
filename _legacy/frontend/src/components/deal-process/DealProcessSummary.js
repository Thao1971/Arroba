import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Check, Clock, Lock, AlertTriangle, Loader2 } from 'lucide-react';

const PHASE_STYLES = {
  completed: { bg: '#16a34a', color: '#fff', icon: Check, barColor: '#16a34a' },
  current: { bg: 'var(--on-surface)', color: '#fff', icon: Clock, barColor: 'var(--on-surface)' },
  pending: { bg: 'var(--surface-2)', color: 'var(--outline-variant)', icon: Lock, barColor: 'var(--surface-2)' },
  blocked: { bg: '#dc2626', color: '#fff', icon: AlertTriangle, barColor: '#dc2626' },
};

const ACTOR_LABELS = { buyer: 'Comprador', seller: 'Vendedor', arroba: 'ARROBA', admin: 'ARROBA' };

const DealProcessSummary = ({ dealId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealId) return;
    api.get(`/deal-process/${dealId}/process-summary`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [dealId]);

  if (loading) return <div className="p-4 text-center"><Loader2 size={14} className="animate-spin mx-auto" /></div>;
  if (!data || !data.phases) return null;

  return (
    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="process-summary">
      <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>ESTADO DEL PROCESO</p>

      {/* Context card */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <div>
          <p className="text-[8px] font-bold" style={{ color: 'var(--outline)', letterSpacing: '0.05em' }}>ESTADO ACTUAL</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--on-surface)' }}>{data.current_phase}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold" style={{ color: 'var(--outline)', letterSpacing: '0.05em' }}>ÚLTIMO HITO</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--on-surface)' }}>{data.last_hito}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold" style={{ color: 'var(--outline)', letterSpacing: '0.05em' }}>PRÓXIMO PASO</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--on-surface)' }}>{data.next_step || '—'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold" style={{ color: 'var(--outline)', letterSpacing: '0.05em' }}>DEBE ACTUAR</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--on-surface)' }}>{data.actor ? ACTOR_LABELS[data.actor] || data.actor : '—'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold" style={{ color: data.blocker ? '#dc2626' : 'var(--outline)', letterSpacing: '0.05em' }}>BLOQUEOS</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: data.blocker ? '#dc2626' : '#16a34a' }}>{data.blocker || 'Sin bloqueos'}</p>
        </div>
      </div>

      {/* Funnel horizontal */}
      <div className="flex items-center">
        {data.phases.map((phase, i) => {
          const style = PHASE_STYLES[phase.status] || PHASE_STYLES.pending;
          const Icon = style.icon;
          return (
            <React.Fragment key={phase.id}>
              <div className="flex flex-col items-center" style={{ flex: 1 }}>
                <div className="w-7 h-7 flex items-center justify-center mb-1.5" style={{ background: style.bg }}>
                  <Icon size={11} style={{ color: style.color }} />
                </div>
                <p className="text-[7px] font-bold text-center leading-tight" style={{ color: phase.status === 'pending' ? 'var(--outline-variant)' : 'var(--on-surface)', letterSpacing: '0.03em' }}>
                  {phase.label.toUpperCase()}
                </p>
              </div>
              {i < data.phases.length - 1 && (
                <div className="h-px flex-1 mt-[-14px]" style={{ background: style.barColor }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* DD progress if active */}
      {data.dd_completion_pct != null && (
        <div className="mt-3 pt-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--surface-2)' }}>
          <p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>DD</p>
          <div className="flex-1 h-1.5" style={{ background: 'var(--surface-2)' }}>
            <div className="h-full" style={{ width: `${data.dd_completion_pct}%`, background: data.blocker ? '#dc2626' : '#16a34a' }} />
          </div>
          <p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>{data.dd_completion_pct}%</p>
        </div>
      )}
    </div>
  );
};

export default DealProcessSummary;
