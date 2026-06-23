/**
 * Search-friendly normalisation: NFD + strip combining marks + lowercase + trim.
 * ñ → n (Muñoz === Munoz).
 */
export function normalizeText(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function containsNeutral(haystack: string, needle: string): boolean {
  const h = normalizeText(haystack);
  const n = normalizeText(needle);
  if (!n) return true;
  return h.includes(n);
}
