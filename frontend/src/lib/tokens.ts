/**
 * Tokens en TypeScript — SOLO para uso programatico (charts, calculos, exports).
 * El render UI debe usar var(--*) via Tailwind o CSS directo. No duplicar valores.
 */
export const tokens = {
  brand: {
    red: '#E8001D',
    redHover: '#C50019',
    redDark: '#B5001A',
    redLight: '#FF1A35',
    black: '#0C0C0E',
    white: '#FFFFFF',
  },
  neutral: {
    50: '#FAFAF8',
    100: '#F4F4F0',
    200: '#E8E8E2',
    300: '#D4D4CC',
    400: '#ADADAA',
    500: '#858580',
    600: '#636360',
    700: '#4A4A47',
    800: '#2E2E2C',
    900: '#1A1A18',
    950: '#0C0C0E',
  },
  feedback: {
    success: '#15803D',
    warning: '#C2410C',
    danger: '#B91C1C',
    info: '#1D4ED8',
  },
  fonts: {
    display: 'Space Grotesk',
    body: 'DM Sans',
    mono: 'JetBrains Mono',
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80] as const,
  radii: { sm: 4, md: 8, lg: 12, xl: 16, '2xl': 24 } as const,
} as const;

export type Tokens = typeof tokens;
