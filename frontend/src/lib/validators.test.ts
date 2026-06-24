import { describe, expect, it } from 'vitest';
import { checkPasswordStrength, isValidEmail, isValidSpanishTaxId } from './validators';

describe('isValidEmail', () => {
  it('accepts well-formed emails', () => {
    expect(isValidEmail('hello@arroba.com')).toBe(true);
    expect(isValidEmail('a.b+c@example.co.uk')).toBe(true);
  });
  it('rejects malformed emails', () => {
    expect(isValidEmail('plain')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a @b.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('checkPasswordStrength', () => {
  it('requires min 8 chars AND at least one digit', () => {
    expect(checkPasswordStrength('Secret123').ok).toBe(true);
    expect(checkPasswordStrength('short1').ok).toBe(false);
    expect(checkPasswordStrength('NoDigitsHere').ok).toBe(false);
    expect(checkPasswordStrength('12345678').ok).toBe(true);
    expect(checkPasswordStrength('').ok).toBe(false);
  });
  it('reports individual checks', () => {
    const s = checkPasswordStrength('short');
    expect(s.minLength).toBe(false);
    expect(s.hasNumber).toBe(false);
    const s2 = checkPasswordStrength('LongEnough');
    expect(s2.minLength).toBe(true);
    expect(s2.hasNumber).toBe(false);
  });
});

describe('isValidSpanishTaxId', () => {
  it('accepts CIF format', () => {
    expect(isValidSpanishTaxId('B12345678')).toBe(true);
    expect(isValidSpanishTaxId('A1234567B')).toBe(true);
  });
  it('accepts NIF format', () => {
    expect(isValidSpanishTaxId('12345678Z')).toBe(true);
  });
  it('accepts NIE format', () => {
    expect(isValidSpanishTaxId('X1234567T')).toBe(true);
  });
  it('rejects malformed tax ids', () => {
    expect(isValidSpanishTaxId('')).toBe(false);
    expect(isValidSpanishTaxId('12345')).toBe(false);
    expect(isValidSpanishTaxId('Q12345678')).toBe(false); // wrong char count
    expect(isValidSpanishTaxId('K12345678')).toBe(false); // K not a valid CIF letter
  });
});
