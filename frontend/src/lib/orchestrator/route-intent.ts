/**
 * Intent routing.
 *
 *  text → (verb detection) → search | analyze | value | recommend
 *
 * Reserved slash commands:
 *   - `/clear` → empty conversation
 *   - `/help`  → render an inline help message
 *
 * Verb detection is accent-insensitive (NFD) and case-insensitive. We DELIBERATELY
 * keep the routing on the client side so the dock can route without a round-trip.
 */
import type { Intent, SkillIntentKind } from './types';

const SLASH = /^\/(?<cmd>\w+)\b\s*(?<rest>.*)$/u;

function normalize(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Verb prefixes per intent — ordered by length DESC inside each list so the
 * longest matches win. Each entry MUST be already normalised (no diacritics,
 * lowercase, single spaces).
 */
const VERB_PREFIXES: Record<SkillIntentKind, string[]> = {
  analyze: [
    'analiza la empresa',
    'analizar la empresa',
    'analisame la empresa',
    'analizame la empresa',
    'ficha de la empresa',
    'tell me about',
    'analyze the company',
    'analiza',
    'analizar',
    'analisame',
    'analizame',
    'analyze',
    'ficha de',
    'ficha sobre',
    'informacion de',
    'informacion sobre',
  ],
  value: [
    'cuanto vale la empresa',
    'cuanto vale',
    'valora la empresa',
    'valorar la empresa',
    'valorame la empresa',
    'valoracion de',
    'valoracion indicativa de',
    'how much is',
    'value the company',
    'valora',
    'valorar',
    'valorame',
    'value',
  ],
  recommend: [
    'recomienda empresas similares a',
    'recomienda empresas parecidas a',
    'companias similares a',
    'companias parecidas a',
    'empresas similares a',
    'empresas parecidas a',
    'similares a',
    'parecidas a',
    'similar to',
    'companies similar to',
    'oportunidades en',
    'oportunidades de',
    'empresas en',
    'empresas de',
    'companias en',
    'companias de',
    'recomienda',
    'recomiendame',
    'que recomiendas',
    'recommend',
  ],
  // search has no verb prefixes — it's the fallback.
  search: [],
};

const INTENT_ORDER: SkillIntentKind[] = ['analyze', 'value', 'recommend'];

function detectVerbIntent(textNorm: string): SkillIntentKind | null {
  for (const kind of INTENT_ORDER) {
    for (const prefix of VERB_PREFIXES[kind]) {
      if (textNorm === prefix || textNorm.startsWith(prefix + ' ')) {
        return kind;
      }
    }
  }
  return null;
}

export function routeIntent(input: string): Intent {
  const text = (input || '').trim();
  if (!text) return { kind: 'search', query: '' };

  const slashMatch = text.match(SLASH);
  if (slashMatch && slashMatch.groups) {
    const cmd = slashMatch.groups['cmd']?.toLowerCase();
    if (cmd === 'clear') return { kind: 'clear' };
    if (cmd === 'help') return { kind: 'help' };
    // Unrecognised slash command: fall through as plain text.
  }

  const textNorm = normalize(text);
  const verb = detectVerbIntent(textNorm);
  if (verb === 'analyze') return { kind: 'analyze', query: text };
  if (verb === 'value') return { kind: 'value', query: text };
  if (verb === 'recommend') return { kind: 'recommend', query: text };

  return { kind: 'search', query: text };
}

/** Exposed for testing only. */
export const __test = { normalize, detectVerbIntent };
