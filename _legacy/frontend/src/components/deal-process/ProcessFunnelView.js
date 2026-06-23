import React from 'react';
import { Check, Clock, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

const FUNNEL_STEPS = [
  { id: 'nda', label: 'NDA', states: ['NDA_SIGNED'] },
  { id: 'interest', label: 'Interés', states: ['INTEREST_SUBMITTED', 'INTEREST_ACCEPTED'] },
  { id: 'meeting', label: 'Reunión', states: ['MEETING_REQUESTED', 'MEETING_CONFIRMED'] },
  { id: 'dataroom', label: 'Data Room', states: ['DATA_ROOM_REQUESTED', 'DATA_ROOM_PARTIALLY_GRANTED'] },
  { id: 'exclusivity', label: 'Exclusividad', states: ['EXCLUSIVITY_REQUESTED', 'EXCLUSIVITY_GRANTED'] },
  { id: 'offer', label: 'Oferta', states: ['PRELIMINARY_OFFER_SUBMITTED', 'PRELIMINARY_OFFER_ACCEPTED'] },
  { id: 'loi', label: 'LOI', states: ['FORMAL_LOI_SUBMITTED', 'FORMAL_LOI_ACCEPTED'] },
  { id: 'dd', label: 'Due Diligence', states: ['DD_IN_PROGRESS', 'DD_COMPLETED_READY_TO_CLOSE'] },
  { id: 'closing', label: 'Cierre', states: ['CLOSING_IN_PROGRESS', 'DEAL_CLOSED_SUCCESS'] },
];

const getStepStatus = (step, timeline, currentState) => {
  const events = (timeline || []).map(e => e.event);

  // Check if any state of this step appears in timeline
  const reached = step.states.some(s => events.includes(s));
  const completed = step.states.some(s => {
    const idx = step.states.indexOf(s);
    return idx === step.states.length - 1 && events.includes(s);
  });

  // Current step
  const isCurrent = step.states.includes(currentState);

  if (completed) return 'completed';
  if (isCurrent) return 'current';
  if (reached) return 'in_progress';
  return 'pending';
};

const STATUS_STYLES = {
  completed: { bg: '#16a34a', color: '#fff', icon: Check },
  current: { bg: 'var(--arroba-primary)', color: '#fff', icon: Clock },
  in_progress: { bg: '#d97706', color: '#fff', icon: Clock },
  pending: { bg: 'var(--surface-2)', color: 'var(--outline)', icon: Lock },
};

const ProcessFunnelView = ({ timeline, currentState, lastEvent, nextAction, blocker }) => {
  return (
    <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="process-funnel">
      <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>ESTADO DEL PROCESO</p>

      {/* Funnel bar */}
      <div className="flex items-center gap-1 mb-4">
        {FUNNEL_STEPS.map((step, i) => {
          const status = getStepStatus(step, timeline, currentState);
          const style = STATUS_STYLES[status];
          const Icon = style.icon;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center" style={{ flex: 1 }}>
                <div className="w-7 h-7 flex items-center justify-center mb-1" style={{ background: style.bg }}>
                  <Icon size={11} style={{ color: style.color }} />
                </div>
                <p className="text-[8px] font-bold text-center" style={{ color: status === 'pending' ? 'var(--outline-variant)' : 'var(--on-surface)' }}>{step.label}</p>
              </div>
              {i < FUNNEL_STEPS.length - 1 && (
                <div className="h-0.5 flex-1 mt-[-12px]" style={{ background: status === 'completed' ? '#16a34a' : 'var(--surface-2)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Context line */}
      <div className="grid grid-cols-3 gap-3 text-[10px]">
        {lastEvent && (
          <div>
            <p className="font-bold mb-0.5" style={{ color: 'var(--outline)' }}>ÚLTIMO HITO</p>
            <p style={{ color: 'var(--on-surface)' }}>{lastEvent}</p>
          </div>
        )}
        {nextAction && (
          <div>
            <p className="font-bold mb-0.5" style={{ color: 'var(--outline)' }}>PRÓXIMO PASO</p>
            <p style={{ color: 'var(--on-surface)' }}>{nextAction}</p>
          </div>
        )}
        {blocker && (
          <div>
            <p className="font-bold mb-0.5" style={{ color: '#dc2626' }}>BLOQUEO</p>
            <p style={{ color: '#dc2626' }}>{blocker}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessFunnelView;
