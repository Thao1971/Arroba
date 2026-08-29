'use client';
/**
 * Formulario de mandato de compra — campos 1:1 con `MandateCreatePayload`
 * (ver lib/api/client.ts). Simplificación deliberada para el primer corte:
 * sectores y provincias como texto libre separado por comas, en vez de un
 * selector con el catálogo CNAE completo — anotado explícitamente en la UI
 * para no fingir más precisión de la que hay hoy.
 */
import { useState } from 'react';
import { Input } from '@/components/ds/Input';
import { Button } from '@/components/ds/Button';
import type { Mandate, MandateCreatePayload } from '@/lib/api/client';

export interface MandateFormProps {
  initial?: Mandate | null;
  submitLabel: string;
  onSubmit: (payload: MandateCreatePayload) => Promise<void>;
}

function toList(value: string): string[] | undefined {
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

export function MandateForm({ initial, submitLabel, onSubmit }: MandateFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [mandateType, setMandateType] = useState(initial?.mandate_type ?? 'strategic');
  const [sectors, setSectors] = useState((initial?.target_cnae_sections ?? []).join(', '));
  const [provincias, setProvincias] = useState((initial?.target_provincias ?? []).join(', '));
  const [revenueMin, setRevenueMin] = useState(
    initial?.revenue_min != null ? String(initial.revenue_min) : ''
  );
  const [revenueMax, setRevenueMax] = useState(
    initial?.revenue_max != null ? String(initial.revenue_max) : ''
  );
  const [ownership, setOwnership] = useState(initial?.ownership_preference ?? 'any');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ponle un nombre a tu mandato (por ejemplo, «Servicios B2B España»).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        mandate_type: mandateType as MandateCreatePayload['mandate_type'],
        target_cnae_sections: toList(sectors),
        target_provincias: toList(provincias),
        revenue_min: revenueMin ? Number(revenueMin) : null,
        revenue_max: revenueMax ? Number(revenueMax) : null,
        ownership_preference: ownership as MandateCreatePayload['ownership_preference'],
        notes: notes.trim() || null,
      });
    } catch {
      setError('No hemos podido guardar el mandato. Inténtalo de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl" data-testid="mandate-form">
      <Input
        label="Nombre del mandato"
        placeholder="Servicios B2B España"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-muted font-body">Tipo de mandato</label>
        <select
          className="h-11 px-3 rounded-md font-body bg-surface text-text border border-border"
          value={mandateType}
          onChange={(e) => setMandateType(e.target.value as NonNullable<MandateCreatePayload['mandate_type']>)}
        >
          <option value="strategic">Estratégico</option>
          <option value="financial">Financiero</option>
          <option value="roll_up">Roll-up / consolidación</option>
        </select>
      </div>

      <Input
        label="Sectores (CNAE, separados por comas)"
        helperText="Provisional: texto libre hasta que exista un selector de catálogo CNAE."
        placeholder="Servicios B2B, Consultoría"
        value={sectors}
        onChange={(e) => setSectors(e.target.value)}
      />

      <Input
        label="Provincias objetivo (separadas por comas)"
        placeholder="Barcelona, Girona, Tarragona"
        value={provincias}
        onChange={(e) => setProvincias(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Facturación mínima (€)"
          type="number"
          min={0}
          placeholder="1000000"
          value={revenueMin}
          onChange={(e) => setRevenueMin(e.target.value)}
        />
        <Input
          label="Facturación máxima (€)"
          type="number"
          min={0}
          placeholder="10000000"
          value={revenueMax}
          onChange={(e) => setRevenueMax(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-muted font-body">
          Preferencia de propiedad
        </label>
        <select
          className="h-11 px-3 rounded-md font-body bg-surface text-text border border-border"
          value={ownership}
          onChange={(e) => setOwnership(e.target.value as NonNullable<MandateCreatePayload['ownership_preference']>)}
        >
          <option value="any">Cualquiera</option>
          <option value="standalone_only">Solo empresas independientes (sin grupo)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-muted font-body">Notas (opcional)</label>
        <textarea
          className="min-h-24 px-3 py-2 rounded-md font-body bg-surface text-text border border-border"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Cualquier criterio adicional que quieras que tengamos en cuenta."
        />
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" loading={submitting} data-testid="mandate-form-submit">
        {submitLabel}
      </Button>
    </form>
  );
}
