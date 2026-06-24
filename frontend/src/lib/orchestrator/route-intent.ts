/**
 * Intent routing. Plain text → `search`. Reserved slash commands are parsed
 * here so the rest of the pipeline doesn't have to think about them.
 *
 * Today only two reserved commands exist:
 *   - `/clear` → empty the conversation history
 *   - `/help`  → render an inline help message
 *
 * Anything else, including text that just happens to start with `/`, is
 * treated as a normal search query (we strip the leading `/`).
 */
import type { Intent } from './types';

const SLASH = /^\/(?<cmd>\w+)\b\s*(?<rest>.*)$/u;

export function routeIntent(input: string): Intent {
  const text = (input || '').trim();
  if (!text) return { kind: 'search', query: '' };

  const match = text.match(SLASH);
  if (match && match.groups) {
    const cmd = match.groups['cmd']?.toLowerCase();
    if (cmd === 'clear') return { kind: 'clear' };
    if (cmd === 'help') return { kind: 'help' };
    // Unrecognised slash command: fall through as plain search.
  }

  return { kind: 'search', query: text };
}
