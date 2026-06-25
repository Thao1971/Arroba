/**
 * Entity primitives — public re-exports (Design System v1.0.0).
 *
 * The brief calls for canonical names `EntityHeader` / `EntitySection` that
 * future entity pages (Sector, Territorio, Valoración…) can import without
 * caring about the underlying file. The implementations stay where they are
 * (CompanyHeader, EntitySectionWrapper) — the brief explicitly forbids
 * premature generalisation. When E1.6 demands true polymorphism we lift
 * the implementation up and these re-exports stay stable.
 *
 * Today: EntityHeader === CompanyHeader (Empresa-only instance, but the
 * import surface is stable).
 * Today: EntitySection === EntitySectionWrapper (already generic).
 */
export { CompanyHeader as EntityHeader } from './CompanyHeader';
export type { CompanyHeaderProps as EntityHeaderProps } from './CompanyHeader';
export { EntitySectionWrapper as EntitySection } from './EntitySectionWrapper';
export type { EntitySectionWrapperProps as EntitySectionProps } from './EntitySectionWrapper';
export { LockedSectionBlur } from './LockedSectionBlur';
export type { LockedSectionBlurProps } from './LockedSectionBlur';
