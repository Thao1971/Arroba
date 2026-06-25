/**
 * Entity Framework v1.0.0 — base primitives barrel (E1.5.6).
 *
 * Canonical imports for any current or future entity page. The Company
 * page is the first consumer; Sector / Territory / Valuation / Opportunity
 * / Operation pages will compose from these same primitives.
 *
 * See `/app/memory/ENTITY_FRAMEWORK.md` for the architectural contract
 * and `/app/memory/ENTITY_MODEL.md` for the ontology these consume.
 */
export * from './types';

export { EntityHeader } from './EntityHeader';
export type { EntityHeaderProps } from './EntityHeader';

export { EntityHero } from './EntityHero';
export type { EntityHeroProps } from './EntityHero';

export { EntityMetrics } from './EntityMetrics';
export type { EntityMetricsProps } from './EntityMetrics';

export { EntityInsights } from './EntityInsights';
export type { EntityInsightsProps } from './EntityInsights';

export { EntityAnalisis } from './EntityAnalisis';
export type { EntityAnalisisProps } from './EntityAnalisis';

export { EntityAdvisor } from './EntityAdvisor';
export type { EntityAdvisorProps } from './EntityAdvisor';

export { EntitySignals } from './EntitySignals';
export type { EntitySignalsProps } from './EntitySignals';

export { EntityRelations } from './EntityRelations';
export type { EntityRelationsProps } from './EntityRelations';

export { EntityActions } from './EntityActions';
export type { EntityActionsProps, EntityActionItem } from './EntityActions';

export { EntityDocuments } from './EntityDocuments';
export type { EntityDocumentsProps } from './EntityDocuments';

export { EntityActivity } from './EntityActivity';
export type { EntityActivityProps } from './EntityActivity';

export { EntitySections } from './EntitySections';
export type { EntitySectionsProps } from './EntitySections';
