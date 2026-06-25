'use client';
/**
 * EntityAdvisor — semantic marker for the specialised Copilot binding.
 *
 * The Advisor module (ENTITY_FRAMEWORK.md §3.4) does NOT occupy a slot in
 * the page flow — it lives in the global dock (`CopilotDock`). This
 * component exists as a **declarative marker** so consumer pages can
 * announce that they bind a specialised advisor for this entity.
 *
 * Rendering it has the side effect of dispatching a `CustomEvent` so the
 * dock can update its identity ("✦ Company Advisor de Kitchen Studio"
 * vs. "Arroba Copilot"). For E1.5.6 we keep this **purely declarative**
 * — the dock identity is already driven by pathname detection in
 * `CopilotProvider`. The marker is here so future page templates document
 * the binding explicitly.
 *
 * Example:
 *   <EntityAdvisor entityType="company" identifier="B86540112"
 *                  displayName="Kitchen Studio, S.L." />
 */
import type { EntityTypeId } from './types';

export interface EntityAdvisorProps {
  entityType: EntityTypeId;
  /** CIF, slug or id of the entity. */
  identifier: string;
  /** Human name passed to the dock for the header label. */
  displayName: string | null;
}

export function EntityAdvisor({
  entityType,
  identifier,
  displayName,
}: EntityAdvisorProps) {
  // Hidden semantic anchor. The actual dock binding is done by the
  // CopilotProvider through pathname detection — no JS work needed here.
  return (
    <span
      hidden
      data-entity-section="advisor"
      data-entity-type={entityType}
      data-entity-identifier={identifier}
      data-entity-displayname={displayName ?? ''}
      aria-hidden
    />
  );
}
