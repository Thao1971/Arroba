/**
 * Tests for the orchestrator's intent router. Pure-function, no DOM.
 */
import { describe, expect, it } from 'vitest';
import { routeIntent } from './route-intent';

describe('routeIntent', () => {
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
