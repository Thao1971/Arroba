import { describe, expect, it } from 'vitest';
import { deriveJourney, normalizeES, searchCompanies } from './derive';

describe('normalizeES', () => {
  it('strips accents, lowercases and trims', () => {
    expect(normalizeES('  Muñoz Comunicación ')).toBe('munoz comunicacion');
    expect(normalizeES('Olmedo')).toBe('olmedo');
    expect(normalizeES('')).toBe('');
  });
});

describe('searchCompanies', () => {
  it('matches by name (accent-insensitive)', () => {
    const r = searchCompanies('munoz');
    expect(r.map((c) => c.id)).toContain('munoz');
  });
  it('matches by CIF with spaces and dashes', () => {
    const r = searchCompanies('B-47 594 478');
    expect(r.map((c) => c.id)).toContain('olmedo');
  });
  it('returns [] for empty input', () => {
    expect(searchCompanies('')).toHaveLength(0);
  });
  it('returns [] when nothing matches', () => {
    expect(searchCompanies('zzzzzzzz')).toHaveLength(0);
  });
});

describe('deriveJourney', () => {
  it('builds the comprar narrative with company + plazo', () => {
    const d = deriveJourney({
      intent: 'comprar',
      about: 'invierto',
      company: { name: 'Acme Holdings' },
      objetivo: 'Reforzar mi negocio actual',
      plazo: 'Ahora',
    });
    expect(d.entityType).toBe('Tesis de Inversión');
    expect(d.companyName).toBe('Acme Holdings');
    expect(d.narrative).toContain('Acme Holdings');
    expect(d.narrative).toContain('de forma inmediata');
  });

  it('handles multi objectives (vender)', () => {
    const d = deriveJourney({
      intent: 'vender',
      about: 'empresa',
      company: { name: 'Kitchen' },
      objetivo: ['Conocer cuánto vale', 'Explorar una posible venta'],
      plazo: 'En los próximos 12 meses',
    });
    expect(d.entityType).toBe('Oportunidad potencial');
    expect(d.narrative).toContain('Kitchen');
    expect(d.narrative).toContain('en los próximos 12 meses');
  });

  it('falls back gracefully for explorar', () => {
    const d = deriveJourney({ intent: 'explorar', about: 'empezando', vehicle: 'Mi espacio' });
    expect(d.entityType).toBe('Oportunidad'); // explorar has entity=null → fallback label
    expect(d.narrative).toContain('Mi espacio');
  });
});
