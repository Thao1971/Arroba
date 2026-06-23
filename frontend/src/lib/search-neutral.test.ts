import { describe, expect, it } from 'vitest';
import { containsNeutral, normalizeText } from './search-neutral';

describe('normalizeText', () => {
  it('Muñoz === Munoz → "munoz"', () => {
    expect(normalizeText('Muñoz')).toBe('munoz');
    expect(normalizeText('Munoz')).toBe('munoz');
    expect(normalizeText('Muñoz')).toEqual(normalizeText('Munoz'));
  });
  it('ROYAL === royal → "royal"', () => {
    expect(normalizeText('ROYAL')).toBe('royal');
    expect(normalizeText('royal')).toBe('royal');
    expect(normalizeText('ROYAL')).toEqual(normalizeText('royal'));
  });
  it('strips accents and lowercases', () => {
    expect(normalizeText('Álvaro García')).toBe('alvaro garcia');
    expect(normalizeText('Éxito')).toBe('exito');
    expect(normalizeText(' Águila ')).toBe('aguila');
  });
  it('handles empty / falsy inputs', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   ')).toBe('');
  });
});

describe('containsNeutral', () => {
  it('matches across diacritics', () => {
    expect(containsNeutral('Agencia Nómada', 'nomada')).toBe(true);
    expect(containsNeutral('Muñoz Consulting', 'munoz')).toBe(true);
  });
  it('case insensitive', () => {
    expect(containsNeutral('Studio 44', 'STUDIO')).toBe(true);
  });
  it('returns true for empty needle', () => {
    expect(containsNeutral('whatever', '')).toBe(true);
  });
  it('returns false for no match', () => {
    expect(containsNeutral('Studio 44', 'zara')).toBe(false);
  });
});
