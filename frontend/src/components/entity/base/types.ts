/**
 * Entity Framework v1.0.0 — shared types (E1.5.6).
 *
 * Source of truth for the canonical UX architecture of any entity page in
 * arroba.com. Mirrors `/app/memory/ENTITY_FRAMEWORK.md` and the ontology
 * declared in `/app/memory/ENTITY_MODEL.md`.
 *
 * These types stay **structural** — no implementation details, no Mongo
 * shapes. The data fed into entity primitives can come from any backend
 * shape; we adapt at the consumer boundary.
 */
import type { ComponentType } from 'react';

/** Loose icon type that fits both Lucide icons and any custom icon
 *  component with size/strokeWidth-like props. Kept any to avoid coupling. */
export type EntityIconComponent = ComponentType<any>;

/** The 12 canonical entity types declared in ENTITY_MODEL.md §3. */
export type EntityTypeId =
  | 'company'
  | 'sector'
  | 'territory'
  | 'person'
  | 'advisor'
  | 'mandate'
  | 'operation'
  | 'valuation'
  | 'document'
  | 'opportunity'
  | 'client'
  | 'organization';

/** The 12 canonical UX modules declared in ENTITY_FRAMEWORK.md §3. */
export type EntityModuleId =
  | 'header'
  | 'hero'
  | 'kpis'
  | 'advisor'
  | 'insights'
  | 'analisis'
  | 'senales'
  | 'relaciones'
  | 'oportunidades'
  | 'documentacion'
  | 'actividad'
  | 'acciones';

/** The 6 canonical states a module can be in. See ENTITY_FRAMEWORK.md §6. */
export type EntityModuleState =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'locked'
  | 'error'
  | 'unavailable'
  | 'updating';

/** Compact, typed action descriptor consumed by EntityHeader.
 *  Each action declares its own testid so consumers (CompanyHeader,
 *  future SectorHeader, etc.) can keep their stable testids without the
 *  presentational primitive caring about entity-specific names. */
export interface EntityHeaderAction {
  /** Stable data-testid (e.g. "company-action-watchlist"). */
  testId: string;
  /** Visible label. */
  label: string;
  /** Lucide icon component (kept type-loose to avoid coupling). */
  icon: EntityIconComponent;
  /** Click handler. */
  onClick: () => void;
  /** When true, render in "active" colour state. */
  active?: boolean;
  /** When true, render as primary CTA (brand-primary background). */
  primary?: boolean;
  /** When true, the button is non-interactive. */
  disabled?: boolean;
}

/** Compact entity-header info — what the user needs to identify the entity.
 *  Generic across types: a `company` fills sector/identifier with CIF, a
 *  `sector` with its parent slug, etc. */
export interface EntityHeaderInfo {
  /** Display name (text-h1). */
  name: string;
  /** 2-3 letter initials for the avatar. Optional. */
  initials?: string;
  /** Comma- or `·`-separated subtitle, e.g. "Software · Madrid · B12345678". */
  subtitle?: string;
  /** Score badge (when applicable to this entity type). */
  score?: number | null;
  /** Identifier shown in the URL bar (CIF, slug, id). */
  identifier?: string;
}

/** Declarative descriptor consumed by EntitySections (orchestrator). */
export interface EntitySectionDescriptor {
  /** Stable anchor id (`#analisis`, `#kpis`, …). */
  id: string;
  /** Which canonical UX module this section represents. */
  module: EntityModuleId;
  /** Visible section title. */
  title: string;
  /** Optional description shown under the title. */
  description?: string;
  /** Current state. Drives which fallback component is used (loading skeleton,
   *  locked teaser, unavailable placeholder, etc.). */
  state: EntityModuleState;
  /** Pendings REQ when state is "unavailable". */
  req?: string;
  /** ETA when state is "unavailable". */
  eta?: string;
  /** Right-side action slot (e.g. <RefreshButton/>). */
  action?: React.ReactNode;
  /** Children render when state is "ready". */
  children?: React.ReactNode;
}

/**
 * Default per-(entityType, module) anchor ids — used by EntitySections when
 * a descriptor omits its `id`. Future entities can extend without touching
 * EntitySections.
 */
export const DEFAULT_SECTION_IDS: Record<EntityModuleId, string> = {
  header: 'header',
  hero: 'resumen',
  kpis: 'kpis',
  advisor: 'advisor',
  insights: 'insights',
  analisis: 'analisis',
  senales: 'senales',
  relaciones: 'relaciones',
  oportunidades: 'oportunidades',
  documentacion: 'documentacion',
  actividad: 'actividad',
  acciones: 'acciones',
};

/**
 * Canonical top→bottom order declared in ENTITY_FRAMEWORK.md §4.
 * EntitySections sorts the input array against this index regardless of
 * how the consumer ordered them.
 */
export const CANONICAL_MODULE_ORDER: EntityModuleId[] = [
  'header',
  'hero',
  'kpis',
  'insights',
  'analisis',
  'senales',
  'relaciones',
  'oportunidades',
  'documentacion',
  'actividad',
  'acciones',
  // `advisor` is intentionally absent: it lives in the dock, not the flow.
];
