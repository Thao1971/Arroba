/**
 * Tests for the orchestrator's intent router. Pure-function, no DOM.
 *
 * E1.4: detects verb prefixes (analizar/valorar/recomendar) accent- and case-
 * insensitively. Default falls through to `search`.
 */
import { describe, expect, it } from 'vitest';
import { routeIntent, __test } from './route-intent';

describe('routeIntent — slash commands & fallback', () => {
  it('returns search intent with trimmed query for plain text', () => {
    expect(routeIntent('  Kitchen Studio  ')).toEqual({
      kind: 'search',
      query: 'Kitchen Studio',
    });
  });

  it('recognises /clear as a reserved command', () => {
    expect(routeIntent('/clear')).toEqual({ kind: 'clear' });
    expect(routeIntent('  /clear ')).toEqual({ kind: 'clear' });
  });

  it('recognises /help as a reserved command', () => {
    expect(routeIntent('/help')).toEqual({ kind: 'help' });
  });

  it('falls through to search for unknown slash commands', () => {
    expect(routeIntent('/lol something')).toMatchObject({ kind: 'search' });
  });

  it('returns empty search for empty input', () => {
    expect(routeIntent('')).toEqual({ kind: 'search', query: '' });
    expect(routeIntent('   ')).toEqual({ kind: 'search', query: '' });
  });
});

describe('routeIntent — verb detection (E1.4)', () => {
  it('detects analyze verb', () => {
    expect(routeIntent('analiza Kitchen Studio')).toEqual({
      kind: 'analyze',
      query: 'analiza Kitchen Studio',
    });
    expect(routeIntent('Analizar Kitchen Studio')).toMatchObject({ kind: 'analyze' });
    expect(routeIntent('ficha de Kitchen Studio')).toMatchObject({ kind: 'analyze' });
    expect(routeIntent('analyze Kitchen Studio')).toMatchObject({ kind: 'analyze' });
  });

  it('detects value verb', () => {
    expect(routeIntent('valora Kitchen Studio')).toMatchObject({ kind: 'value' });
    expect(routeIntent('cuánto vale Grupo Olmedo')).toMatchObject({ kind: 'value' });
    expect(routeIntent('Cuanto vale Grupo Olmedo')).toMatchObject({ kind: 'value' });
    expect(routeIntent('value Kitchen Studio')).toMatchObject({ kind: 'value' });
  });

  it('detects recommend verb', () => {
    expect(routeIntent('recomienda empresas similares a Kitchen Studio')).toMatchObject({
      kind: 'recommend',
    });
    expect(routeIntent('empresas similares a Kitchen Studio')).toMatchObject({
      kind: 'recommend',
    });
    expect(routeIntent('Compañías similares a Kitchen Studio')).toMatchObject({
      kind: 'recommend',
    });
    expect(routeIntent('oportunidades en software')).toMatchObject({
      kind: 'recommend',
    });
    expect(routeIntent('empresas en alimentación')).toMatchObject({
      kind: 'recommend',
    });
  });

  it('verb detection is accent-insensitive', () => {
    expect(routeIntent('análisis de Kitchen Studio')).toEqual({
      kind: 'search',
      query: 'análisis de Kitchen Studio',
    });
    // "valoración de" → value
    expect(routeIntent('Valoración de Kitchen Studio')).toMatchObject({ kind: 'value' });
    // "compañías" (with ñ) → normalised to "companias"
    expect(routeIntent('Compañías parecidas a Quickads')).toMatchObject({ kind: 'recommend' });
  });

  it('does not misroute search queries that just contain the verb stem', () => {
    // "Analista de ventas" — starts with "anali" but does not match the strict
    // prefix "analiza"/"analizar"/"analizame"/"analisame" (the latter two are
    // accent-stripped forms used in some Latam dialects).
    expect(routeIntent('Analista de ventas')).toMatchObject({ kind: 'search' });
  });
});

describe('routeIntent — internal helpers', () => {
  it('normalize strips diacritics and lowercases', () => {
    expect(__test.normalize('Análisis CAÑÓN')).toBe('analisis canon');
    expect(__test.normalize('  multiple   spaces  ')).toBe('multiple spaces');
  });

  it('detectVerbIntent returns null for plain search', () => {
    expect(__test.detectVerbIntent('kitchen studio')).toBeNull();
  });
});
