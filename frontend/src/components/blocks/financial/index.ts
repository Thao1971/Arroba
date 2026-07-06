/**
 * B.6.f · Bloques financieros de la ficha de empresa.
 * Composición canónica descrita en `/app/memory/ARROBA_B6F_DESIGN_PROPOSAL_v1.md`.
 */
export { AnomalyBanner } from './AnomalyBanner';
export type { AnomalyBannerProps, AnomalySeverity } from './AnomalyBanner';

export { FinanzasHeader } from './FinanzasHeader';
export type { FinanzasHeaderProps, FinanzasBasis } from './FinanzasHeader';

export { FinanzasSubNav } from './FinanzasSubNav';
export type { FinanzasSubNavProps, FinanzasSubNavItem } from './FinanzasSubNav';

/* Anchor ids canónicos que consume el SubNav (mantener sincronizados con
   los `id` de los bloques cuando lleguen en Hito 2). */
export const FINANZAS_ANCHOR_IDS = {
  evolucion: 'finanzas-evolucion',
  pl: 'finanzas-pl',
  balance: 'finanzas-balance',
  ratios: 'finanzas-ratios',
  calidad: 'finanzas-calidad',
  solvencia: 'finanzas-solvencia',
} as const;

export type FinanzasAnchorId =
  (typeof FINANZAS_ANCHOR_IDS)[keyof typeof FINANZAS_ANCHOR_IDS];
