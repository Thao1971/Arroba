/**
 * HARDENING-025 · Item 3 · Plantillas de prompts para dispatch de chips.
 *
 * Cada entrada mapea el `enum` de `opportunity.chips[]` (emitido por Intel)
 * a una plantilla en español con marcador `{empresa}` que el dispatcher
 * sustituye por la razón social canónica (`identity.legal_name`).
 *
 * FILOSOFÍA:
 *   - Un solo sitio para editar copy. Nada inline en JSX.
 *   - Si un `enum` no está en el diccionario → chip NO clicable
 *     (`hasPromptForChip(enum) === false`). NO se rompe la UI.
 *   - R15: nunca fabricamos chips. Solo procesamos los que Intel emite.
 *
 * Uso:
 *   import { buildChipPrompt, hasPromptForChip } from '@/lib/copilot/prompts';
 *   if (hasPromptForChip(chip.enum)) {
 *     const text = buildChipPrompt(chip.enum, empresaName);
 *     prefillComposer(text);
 *   }
 */

export const CHIP_PROMPTS: Readonly<Record<string, string>> = {
  buy_and_build:
    'Prepárame una tesis de Buy & Build para {empresa}: sub-sectores y targets ' +
    'complementarios, y el racional de consolidación.',
  capital_raise:
    '¿Qué tipo de inversor encajaría para una captación de capital en {empresa} ' +
    'y con qué estructura?',
  partner_entry:
    'Perfílame el socio ideal para una entrada en el capital de {empresa} y el ' +
    'racional de la operación.',
} as const;

/** Devuelve `true` sólo si el `enum` tiene plantilla registrada. */
export function hasPromptForChip(chipEnum: string | null | undefined): boolean {
  if (!chipEnum) return false;
  return Object.prototype.hasOwnProperty.call(CHIP_PROMPTS, chipEnum);
}

/**
 * Construye el prompt final sustituyendo `{empresa}`. Si el `enum` no está
 * registrado devuelve `null` (nunca lanzar; llamador debe usar
 * `hasPromptForChip` para decidir si el chip es clicable).
 */
export function buildChipPrompt(
  chipEnum: string | null | undefined,
  empresa: string | null | undefined,
): string | null {
  if (!chipEnum) return null;
  const template = CHIP_PROMPTS[chipEnum];
  if (!template) return null;
  const safeEmpresa = (empresa && empresa.trim().length > 0) ? empresa.trim() : 'esta compañía';
  return template.replaceAll('{empresa}', safeEmpresa);
}
