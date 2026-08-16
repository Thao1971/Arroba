/**
 * @componentId ARCH-FICHA-0001
 * @status PROVISIONAL — base de HARDENING-037 (puntos de extensión de la ficha)
 *
 * Registro de secciones de la ficha. Convierte el `NAV[]` hardcoded + el switch
 * de render del monolito `CompanyFichaLayoutV2.tsx` en una tabla declarativa:
 * cada sección = { id, label, icon, group, ready, render(ctx) }.
 *
 * Objetivo: montar una sección nueva = añadir UNA entrada aquí, sin volver a
 * editar el monolito. El monolito solo (1) construye el `FichaSectionContext` y
 * (2) hace `getSection(active)?.render?.(ctx)` con fallback a su <Pending/>.
 *
 * Migración incremental: las secciones EXISTENTES pueden quedarse con su render
 * inline en el monolito (sin `render` aquí, solo metadatos de nav); las NUEVAS
 * (comité, mercado, oportunidades) traen su `render`. Nada se rompe.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Scale, BarChart3, Zap } from 'lucide-react';

import {
  InvestmentCommitteeBlock,
  type CommitteeLens,
  type CommitteeResult,
} from '@/components/blocks/committee/InvestmentCommitteeBlock';
import {
  MarketReadingBlock,
  type MarketContextView,
} from '@/components/blocks/market/MarketReadingBlock';
import {
  OpportunityThesisBlock,
  type OpportunityThesisView,
} from '@/components/blocks/opportunity/OpportunityThesisBlock';

/** Datos + callbacks que el monolito inyecta a las secciones. Ampliable. */
export interface FichaSectionContext {
  cif: string;
  anon?: boolean;
  market?: MarketContextView | null;
  opportunity?: OpportunityThesisView | null;
  runCommittee?: (cif: string, lens: CommitteeLens) => Promise<CommitteeResult>;
  onExportCommittee?: (decisionId: string) => void;
  committeeDefaultLens?: CommitteeLens;
}

export interface SectionEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  group: string;
  ready: boolean;
  /** Si existe, el monolito renderiza esto para `active===id`. Si no, usa su render inline. */
  render?: (ctx: FichaSectionContext) => ReactNode;
}

/**
 * Secciones gestionadas por el registro (las NUEVAS de esta tanda).
 * Oportunidades REEMPLAZA el listado antiguo y absorbe Sucesión + Sector&Roll-up
 * (esas dos se retiran del nav — ver spec HARDENING-037).
 */
export const EXTENSION_SECTIONS: SectionEntry[] = [
  {
    id: 'mercado',
    label: 'Mercado',
    icon: BarChart3,
    group: 'Perfil',
    ready: true,
    render: (ctx) => <MarketReadingBlock data={ctx.market ?? {}} />,
  },
  {
    id: 'oportunidades',
    label: 'Oportunidades',
    icon: Zap,
    group: 'Inteligencia',
    ready: true,
    render: (ctx) => <OpportunityThesisBlock data={ctx.opportunity ?? {}} />,
  },
  {
    id: 'comite',
    label: 'Comité de inversión',
    icon: Scale,
    group: 'Inteligencia',
    ready: true,
    render: (ctx) =>
      ctx.runCommittee ? (
        <InvestmentCommitteeBlock
          cif={ctx.cif}
          runCommittee={ctx.runCommittee}
          onExport={ctx.onExportCommittee}
          defaultLens={ctx.committeeDefaultLens ?? 'neutral'}
        />
      ) : null,
  },
];

const _BY_ID: Record<string, SectionEntry> = Object.fromEntries(
  EXTENSION_SECTIONS.map((s) => [s.id, s]),
);

/** Devuelve la entrada de registro de una sección, o undefined si es inline/monolito. */
export function getSection(id: string): SectionEntry | undefined {
  return _BY_ID[id];
}
