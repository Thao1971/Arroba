export const locales = ['es', 'en'] as const;
export const defaultLocale = 'es' as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'es' || value === 'en';
}
