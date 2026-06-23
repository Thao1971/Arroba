/**
 * Formateo numérico español — utilidad centralizada.
 * Punto para miles, coma para decimales.
 * Uso: import { fmtES, fmtEUR, fmtPct } from '../utils/formatES';
 */

/** Número genérico con formato español: 1.250.000,50 */
export const fmtES = (value, decimals) => {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  const dec = decimals !== undefined ? decimals : (num % 1 !== 0 ? 2 : 0);
  return num.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

/** Importe en EUR: 1.250.000 € */
export const fmtEUR = (value, decimals) => {
  const formatted = fmtES(value, decimals !== undefined ? decimals : 0);
  return formatted === '—' ? '—' : `${formatted} €`;
};

/** Importe abreviado en millones: 3,5M€ */
export const fmtMillions = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  if (num >= 1e6) return `${(num / 1e6).toFixed(1).replace('.', ',')}M€`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0).replace('.', ',')}K€`;
  return `${fmtES(num, 0)}€`;
};

/** Porcentaje: 15,5% */
export const fmtPct = (value, decimals) => {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  const dec = decimals !== undefined ? decimals : (num % 1 !== 0 ? 1 : 0);
  return `${num.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec })}%`;
};

/** Rango de millones: 3,2M — 4,1M€ */
export const fmtMillionRange = (low, high) => {
  const l = fmtMillions(low);
  const h = fmtMillions(high);
  if (l === '—' && h === '—') return '—';
  if (l === '—') return `hasta ${h}`;
  if (h === '—') return `desde ${l}`;
  return `${l.replace('€', '')} — ${h}`;
};
