/**
 * WCAG relative luminance + contrast ratio.
 * Used in /design-system to display contrast for critical token pairs.
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h.padEnd(6, '0');
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return [r, g, b];
}

function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

export function contrastRatio(hexA: string, hexB: string): number {
  const La = relativeLuminance(hexA);
  const Lb = relativeLuminance(hexB);
  const [hi, lo] = La > Lb ? [La, Lb] : [Lb, La];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA requires >= 4.5 for normal text, >= 3 for large text. */
export function passesAA(
  hexA: string,
  hexB: string,
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = contrastRatio(hexA, hexB);
  const threshold = size === 'large' ? 3 : 4.5;
  return ratio >= threshold;
}
