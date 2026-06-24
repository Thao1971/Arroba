'use client';
import { useState } from 'react';
import { ArrowRight, Sparkles, Edit2, Target, Clock, Layers, Building2, AlertCircle } from 'lucide-react';
import { Alert } from '@/components/ds';
import type { JourneyState } from '@/lib/journey/derive';
import { deriveJourney } from '@/lib/journey/derive';
import { isValidSpanishTaxId } from '@/lib/validators';

export interface ValidationStepProps {
  state: JourneyState;
  updateState: (patch: Partial<JourneyState>) => void;
  taxId: string;
  setTaxId: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  onCommit: () => Promise<void>;
  submitting: boolean;
  error: string | null;
  taxIdError: string | null;
}

/**
 * Final step before committing. Shows the Copilot's narrative, lets the user
 * edit the company name, and gathers two optional org fields (tax_id, country)
 * before POST /api/organizations.
 */
export function ValidationStep({
  state,
  updateState,
  taxId,
  setTaxId,
  country,
  setCountry,
  onCommit,
  submitting,
  error,
  taxIdError,
}: ValidationStepProps) {
  const derived = deriveJourney(state);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const taxIdValid = taxId.trim() === '' || isValidSpanishTaxId(taxId);

  return (
    <div className="animate-[journeyIn_.4s_ease_both]" data-testid="journey-validation-step">
      <div className="bg-surface rounded-[16px] p-5 mb-4 border-[1.5px]" style={{ borderColor: 'rgba(232,0,29,.22)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-primary flex items-center justify-center">
            <Sparkles size={13} strokeWidth={1.5} className="text-white" />
          </div>
          <span className="text-[12.5px] font-bold text-text">Resumen preparado por Arroba Copilot</span>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary px-2.5 py-1 rounded-md mb-3"
          style={{ background: 'rgba(232,0,29,.07)', border: '1px solid rgba(232,0,29,.2)' }}
        >
          {derived.entityType}
          {derived.companyName ? ` · ${derived.companyName}` : ''}
        </span>
        <p className="text-base text-text leading-relaxed font-body" data-testid="journey-validation-narrative">
          “{derived.narrative}”
        </p>
      </div>

      <div className="flex flex-col gap-2.5 mb-4">
        {derived.companyName && (
          <EditableRow
            label="Empresa"
            icon={Building2}
            value={derived.companyName}
            onChange={(v) => {
              if (state.company) updateState({ company: { ...state.company, name: v } });
              else updateState({ vehicle: v });
            }}
          />
        )}
        {derived.goalsStr && <ReadOnlyRow label="Objetivo" icon={Target} value={derived.goalsStr} />}
        {state.plazo && <ReadOnlyRow label="Horizonte" icon={Clock} value={state.plazo} />}
        <ReadOnlyRow label="Tipo de entidad" icon={Layers} value={derived.entityType} />
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((s) => !s)}
        data-testid="journey-validation-toggle-advanced"
        className="text-[13px] text-text-muted hover:text-text mb-3"
      >
        {showAdvanced ? '− Ocultar' : '+ Datos opcionales'} (CIF, país)
      </button>

      {showAdvanced && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[12.5px] font-semibold text-text font-body block mb-1.5">
              CIF / NIF (opcional)
            </label>
            <input
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="B12345678"
              data-testid="journey-validation-tax-id"
              className={
                'w-full h-11 px-3 rounded-[10px] font-body text-[15px] bg-surface text-text border-[1.5px] outline-none transition-colors ' +
                (taxIdValid ? 'border-border-strong focus:border-primary' : 'border-danger focus:border-danger')
              }
            />
            {!taxIdValid && taxId.trim() !== '' && (
              <p className="text-xs text-danger mt-1">Formato inválido.</p>
            )}
          </div>
          <div>
            <label className="text-[12.5px] font-semibold text-text font-body block mb-1.5">País</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              data-testid="journey-validation-country"
              className="w-full h-11 px-3 rounded-[10px] font-body text-[15px] bg-surface text-text border-[1.5px] border-border-strong outline-none focus:border-primary"
            >
              <option value="ES">España</option>
              <option value="PT">Portugal</option>
              <option value="FR">Francia</option>
              <option value="IT">Italia</option>
              <option value="DE">Alemania</option>
            </select>
          </div>
        </div>
      )}

      {taxIdError && (
        <div className="mb-3" data-testid="journey-validation-tax-error">
          <Alert variant="danger">{taxIdError}</Alert>
        </div>
      )}
      {error && !taxIdError && (
        <div className="mb-3" data-testid="journey-validation-error">
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      <button
        type="button"
        onClick={onCommit}
        disabled={submitting || !taxIdValid}
        data-testid="journey-commit-button"
        aria-busy={submitting || undefined}
        className={
          'w-full h-12 inline-flex items-center justify-center gap-2 rounded-[12px] font-body text-[15px] font-bold transition-colors ' +
          (submitting || !taxIdValid
            ? 'bg-surface-2 text-text-subtle cursor-not-allowed'
            : 'bg-primary text-white hover:bg-primary-hover')
        }
      >
        {submitting ? 'Creando tu espacio…' : 'Crear mi espacio'}
        {!submitting && <ArrowRight size={17} strokeWidth={1.6} />}
      </button>
      <p className="text-xs text-text-subtle text-center mt-2.5 leading-relaxed">
        Podrás revisar y completar todos los detalles más adelante, sin prisa.
      </p>
    </div>
  );
}

function ReadOnlyRow({
  label,
  icon: IconCmp,
  value,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 border border-border rounded-[12px] bg-surface">
      <div className="w-8 h-8 rounded-[9px] bg-surface-2 border border-border flex items-center justify-center shrink-0">
        <IconCmp size={15} strokeWidth={1.5} className="text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] font-bold tracking-[0.05em] uppercase text-text-subtle mb-0.5">
          {label}
        </div>
        <div className="text-[14px] font-semibold text-text leading-snug">{value || '—'}</div>
      </div>
    </div>
  );
}

function EditableRow({
  label,
  icon: IconCmp,
  value,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  return (
    <div className="flex items-start gap-3 p-3 border border-border rounded-[12px] bg-surface">
      <div className="w-8 h-8 rounded-[9px] bg-surface-2 border border-border flex items-center justify-center shrink-0">
        <IconCmp size={15} strokeWidth={1.5} className="text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] font-bold tracking-[0.05em] uppercase text-text-subtle mb-0.5">
          {label}
        </div>
        {editing ? (
          <input
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (draft.trim()) onChange(draft.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditing(false);
                if (draft.trim()) onChange(draft.trim());
              }
            }}
            data-testid="journey-validation-edit-input"
            className="w-full border-[1.5px] border-primary rounded-[8px] px-2 py-1 text-[14px] text-text bg-surface font-body outline-none"
          />
        ) : (
          <div className="text-[14px] font-semibold text-text leading-snug">{value || '—'}</div>
        )}
      </div>
      {!editing && (
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          aria-label="Editar"
          data-testid="journey-validation-edit-button"
          className="text-text-subtle hover:text-text p-1 shrink-0"
        >
          <Edit2 size={15} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
