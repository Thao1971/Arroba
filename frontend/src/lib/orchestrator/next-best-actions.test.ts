/**
 * Tests for the deterministic chip generator.
 */
import { describe, expect, it } from 'vitest';
import { nextBestActions } from './next-best-actions';

describe('nextBestActions', () => {
  it('returns the analizar preset on /analizar', () => {
    const chips = nextBestActions({ pathname: '/analizar', isAuthenticated: true });
    expect(chips).toHaveLength(3);
    expect(chips.some((c) => /Kitchen/i.test(c.label))).toBe(true);
  });

  it('returns the valorar preset on /valorar', () => {
    const chips = nextBestActions({ pathname: '/valorar', isAuthenticated: true });
    expect(chips.some((c) => /Múltiplos/i.test(c.label))).toBe(true);
  });

  it('returns auth-default chips for unknown auth path', () => {
    const chips = nextBestActions({ pathname: '/whatever', isAuthenticated: true });
    expect(chips.length).toBeGreaterThan(0);
  });

  it('returns guest chips for unknown public path', () => {
    const chips = nextBestActions({ pathname: '/', isAuthenticated: false });
    expect(chips.every((c) => c.intent === 'search')).toBe(true);
  });
});
