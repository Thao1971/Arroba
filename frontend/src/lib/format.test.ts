import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDecimal,
  formatNumber,
  formatPercent,
} from './format';

describe('formatNumber', () => {
  it('uses dots as thousands separator (es-ES)', () => {
    expect(formatNumber(5265)).toBe('5.265');
    expect(formatNumber(183_978)).toBe('183.978');
    expect(formatNumber(4_228)).toBe('4.228');
  });
  it('returns em dash for nullish / NaN', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
    expect(formatNumber(NaN)).toBe('—');
  });
  it('handles zero and negatives', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-12_345)).toBe('-12.345');
    expect(formatNumber(999)).toBe('999');
  });
});

describe('formatDecimal', () => {
  it('uses comma as decimal separator', () => {
    expect(formatDecimal(4.8)).toBe('4,8');
    expect(formatDecimal(18.13, 1)).toBe('18,1');
    expect(formatDecimal(2.4)).toBe('2,4');
  });
  it('respects decimals parameter', () => {
    expect(formatDecimal(3.14159, 2)).toBe('3,14');
    expect(formatDecimal(3.14159, 0)).toBe('3');
    expect(formatDecimal(3, 3)).toBe('3,000');
  });
});

describe('formatCurrency', () => {
  it('renders millions with M€ and comma decimals', () => {
    expect(formatCurrency(4_800_000)).toBe('4,8M€');
    expect(formatCurrency(2_400_000)).toBe('2,4M€');
    expect(formatCurrency(1_500_000, { decimals: 2 })).toBe('1,50M€');
  });
  it('renders thousands with K€', () => {
    expect(formatCurrency(48_000)).toBe('48,0K€');
    expect(formatCurrency(120_500)).toBe('120,5K€');
  });
  it('renders exact euros when compact disabled', () => {
    expect(formatCurrency(4_823_000, { compact: false })).toContain('4.823.000');
    expect(formatCurrency(1234, { compact: false })).toContain('1.234');
  });
});

describe('formatPercent', () => {
  it('uses comma + percent symbol', () => {
    expect(formatPercent(18.1)).toBe('18,1%');
    expect(formatPercent(2.4)).toBe('2,4%');
    expect(formatPercent(100)).toBe('100,0%');
  });
});

describe('formatDate', () => {
  it('renders DD/MM/AAAA', () => {
    expect(formatDate('2026-05-31T12:00:00Z')).toBe('31/05/2026');
    expect(formatDate(new Date(2026, 0, 7))).toBe('07/01/2026');
    expect(formatDate(new Date(2024, 11, 1))).toBe('01/12/2024');
  });
  it('returns em dash for invalid input', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('formatDateShort', () => {
  it('returns DD/MM by default', () => {
    expect(formatDateShort(new Date(2026, 4, 31))).toBe('31/05');
    expect(formatDateShort(new Date(2024, 11, 1))).toBe('01/12');
  });
  it('returns DD + spanish month abbreviation when requested', () => {
    expect(formatDateShort(new Date(2026, 4, 31), { month: true })).toBe('31\u00A0may');
    expect(formatDateShort(new Date(2026, 0, 7), { month: true })).toBe('07\u00A0ene');
    expect(formatDateShort(new Date(2026, 11, 25), { month: true })).toBe('25\u00A0dic');
  });
});
