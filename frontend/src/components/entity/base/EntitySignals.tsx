'use client';
/**
 * EntitySignals — external events feed (E1.5.6).
 *
 * Today: thin shell that delegates to `UnavailableBlock` (REQ-008 — BORME,
 * contratación pública, cambios societarios). Future (E1.6+): becomes a
 * `SignalsTimeline` primitive when the real data provider ingests the feed.
 *
 * See ENTITY_FRAMEWORK.md §3.7 — Señales module.
 *
 * Example:
 *   <EntitySignals entityType="company" req="REQ-008" eta="E1.8" />
 */
import { UnavailableBlock } from '@/components/blocks';
import type { EntityTypeId } from './types';

export interface EntitySignalsProps {
  entityType: EntityTypeId;
  /** REQ blocking signals delivery. Defaults to REQ-008 for company. */
  req?: string;
  /** ETA for when this module becomes live. */
  eta?: string;
  /** Override title — defaults to "Señales". */
  title?: string;
  /** Optional description shown under the title. */
  description?: string;
}

const DEFAULTS_BY_TYPE: Partial<
  Record<EntityTypeId, { req: string; eta: string; description: string }>
> = {
  company: {
    req: 'REQ-008',
    eta: 'E1.8',
    description:
      'Cuando integremos BORME, contratación pública y cambios societarios, esta sección mostrará el feed de señales de la empresa.',
  },
  sector: {
    req: 'REQ-010',
    eta: 'E1.6',
    description:
      'Señales agregadas del sector (M&A reciente, movimientos de capital).',
  },
  territory: {
    req: 'REQ-011',
    eta: 'E1.7',
    description: 'Señales agregadas en la región (M&A, inversión, IPOs).',
  },
};

export function EntitySignals({
  entityType,
  req,
  eta,
  title = 'Señales',
  description,
}: EntitySignalsProps) {
  const defaults = DEFAULTS_BY_TYPE[entityType];
  return (
    <div data-entity-section="senales" data-entity-type={entityType}>
      <UnavailableBlock
        title={title}
        description={description ?? defaults?.description}
        req={req ?? defaults?.req}
        eta={eta ?? defaults?.eta}
      />
    </div>
  );
}
