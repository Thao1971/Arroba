/**
 * Next-best-action chips shown below the composer. Deterministic, derived
 * from the current pathname + auth state. Port of `arroba-composer.js`'s
 * `presetsFor()` with the routes our app actually has.
 */
export interface SuggestionChip {
  label: string;
  intent: 'search' | 'help' | 'clear';
  payload: { query?: string };
}

interface ChipContext {
  pathname: string;
  isAuthenticated: boolean;
}

const DEFAULT_GUEST: readonly SuggestionChip[] = [
  { label: 'Empresas de software en Madrid', intent: 'search', payload: { query: 'software Madrid' } },
  { label: 'Hoteles termales', intent: 'search', payload: { query: 'hoteles termales' } },
  { label: 'Marketing y publicidad', intent: 'search', payload: { query: 'marketing' } },
];

const DEFAULT_AUTH: readonly SuggestionChip[] = [
  { label: '¿Qué quieres analizar?', intent: 'search', payload: { query: 'Kitchen Studio' } },
  { label: 'Empresas en mi sector', intent: 'search', payload: { query: 'tecnología' } },
  { label: 'Quién compraría una empresa de software', intent: 'search', payload: { query: 'software' } },
];

const BY_PATH: Record<string, readonly SuggestionChip[]> = {
  '/analizar': [
    { label: 'Analizar Kitchen Studio', intent: 'search', payload: { query: 'Kitchen Studio' } },
    { label: 'Empresas de software', intent: 'search', payload: { query: 'software' } },
    { label: 'Hoteles en Valladolid', intent: 'search', payload: { query: 'hoteles Valladolid' } },
  ],
  '/valorar': [
    { label: 'Múltiplos de software', intent: 'search', payload: { query: 'software' } },
    { label: 'Comparables retail', intent: 'search', payload: { query: 'retail' } },
    { label: 'Valoración tecnología', intent: 'search', payload: { query: 'tecnología' } },
  ],
  '/comprar-vender': [
    { label: 'Empresas en venta', intent: 'search', payload: { query: 'venta' } },
    { label: 'Compradores activos', intent: 'search', payload: { query: 'inversor' } },
    { label: 'Sector construcción', intent: 'search', payload: { query: 'construcción' } },
  ],
  '/organizaciones': [
    { label: 'Buscar empresa', intent: 'search', payload: { query: 'Kitchen' } },
    { label: 'Sector marketing', intent: 'search', payload: { query: 'marketing' } },
    { label: 'Empresas en Madrid', intent: 'search', payload: { query: 'Madrid' } },
  ],
};

export function nextBestActions(ctx: ChipContext): readonly SuggestionChip[] {
  // Most-specific match first
  const exact = BY_PATH[ctx.pathname];
  if (exact) return exact;
  return ctx.isAuthenticated ? DEFAULT_AUTH : DEFAULT_GUEST;
}
