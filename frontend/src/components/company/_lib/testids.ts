/**
 * data-testid canónicos de la Ficha de Empresa Sprint F0.1.
 * Cambios en estas constantes requieren actualizar los tests correspondientes.
 */
export const HEADER_TESTIDS = {
  root: 'ficha-header-root',
  identity: 'comp-1001-identity',
  context: 'comp-1002-context',
  publicStatus: 'comp-1003-public-status',
  quickActions: 'comp-1004-quick-actions',
  executiveSnapshot: 'comp-1005-executive-snapshot',
  userRelationship: 'comp-1010-user-relationship',
} as const;

export const PERFIL_TESTIDS = {
  root: 'ficha-perfil-root',
  aiSummary: 'comp-p-0001-ai-summary',
  evolutionTeaser: 'comp-p-0002-evolution-teaser',
  primaryKpis: 'comp-p-0003-primary-kpis',
  positioningKpis: 'comp-p-0004-positioning-kpis',
  identityGrid: 'comp-p-0005-identity-grid',
  intelligenceScores: 'comp-p-0006-intelligence-scores',
} as const;
