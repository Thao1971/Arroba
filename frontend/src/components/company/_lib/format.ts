/**
 * Formateadores puros F0.1 — usados por bloques del Header + Perfil.
 * NO calculan lógica de negocio (R4). Solo formato de presentación.
 */

export function formatCurrencyEs(value: number | null | undefined, opts?: { compact?: boolean }): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (opts?.compact && Math.abs(value) >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M€`;
  }
  return value.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

export function formatIntegerEs(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('es-ES', { maximumFractionDigits: 0 });
}

export function formatIsoDateEs(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function yearsSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const diffMs = Date.now() - t;
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 0) return null;
  return Math.floor(years);
}
