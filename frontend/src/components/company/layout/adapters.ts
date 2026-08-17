/**
 * HARDENING-037 · Adapters entre payloads canónicos del monolito y los
 * `View` shapes que consumen los 4 blocks presentacionales aterrizados en
 * `components/blocks/{committee,financial,market,opportunity}`.
 *
 * Se separa en un módulo aparte para que `CompanyFichaLayoutV2.tsx` no
 * cargue con detalle de mapping — el layout consume 2 funciones puras
 * (`marketBlockToContextView`, `opportunityToThesisView`) y punto.
 *
 * R15 · degradación honesta:
 *   - Todo campo sin fuente hoy → `undefined` explícito (no `null`, no `""`,
 *     no `0`, no valores sintéticos). Los blocks ya renderizan `<Empty/>` o
 *     placeholder visual cuando reciben `undefined`.
 *   - No fabricamos scores, verdicts, thesis strings, ni rankings.
 */
import type { MarketBlock } from '@/lib/companies/intelligence-types';
import type { MarketContextView } from '@/components/blocks/market/MarketReadingBlock';
import type {
  OpportunityThesisView,
  RollupTarget,
} from '@/components/blocks/opportunity/OpportunityThesisBlock';

/**
 * `MarketBlock` (shape Intel `market` canónico) → `MarketContextView` (shape
 * del bloque `MarketReadingBlock`). El campo `reading` se rellena solo si el
 * caller lo provee (por ejemplo, tras un fetch a `apiClient.marketReading`).
 */
export function marketBlockToContextView(
  market: MarketBlock | null | undefined,
  reading?: string | null,
): MarketContextView {
  if (!market) {
    return {
      reading: reading ?? undefined,
    };
  }
  const sector = market.sector ?? null;
  const geo = market.geo ?? null;
  const concentration = market.concentration ?? null;
  const position = market.position ?? null;

  const sectorLabel =
    (sector as { label?: string | null } | null)?.label ??
    (sector as { name?: string | null } | null)?.name ??
    undefined;
  const sectorVerdict =
    (sector as { verdict?: string | null } | null)?.verdict ?? undefined;
  const territoryLabel =
    (geo as { label?: string | null } | null)?.label ??
    (geo as { name?: string | null } | null)?.name ??
    undefined;
  const territoryVerdict =
    (geo as { verdict?: string | null } | null)?.verdict ?? undefined;
  const concentrationLabel =
    (concentration as { label?: string | null } | null)?.label ?? undefined;

  const positionHeadline =
    (position as { headline?: string | null } | null)?.headline ?? undefined;

  return {
    reading: reading ?? undefined,
    position:
      position && positionHeadline
        ? {
            headline: positionHeadline,
            percentile:
              typeof (position as { percentile?: number | null }).percentile === 'number'
                ? ((position as { percentile: number }).percentile)
                : undefined,
            sectorRank: sectorRankLabel(position),
            territoryRank: territoryRankLabel(position),
          }
        : undefined,
    sector:
      sector && sectorLabel && sectorVerdict
        ? {
            label: sectorLabel,
            verdict: sectorVerdict,
            dynamism:
              typeof (sector as { dynamism?: number | null }).dynamism === 'number'
                ? ((sector as { dynamism: number }).dynamism)
                : undefined,
            trend: normalizeTrend((sector as { trend?: unknown }).trend),
          }
        : undefined,
    territory:
      geo && territoryLabel && territoryVerdict
        ? {
            label: territoryLabel,
            verdict: territoryVerdict,
            dynamism:
              typeof (geo as { dynamism?: number | null }).dynamism === 'number'
                ? ((geo as { dynamism: number }).dynamism)
                : undefined,
            activeCompanies:
              typeof (geo as { active_companies?: number | null }).active_companies ===
              'number'
                ? ((geo as { active_companies: number }).active_companies)
                : undefined,
            netCreation:
              typeof (geo as { net_creation?: number | null }).net_creation === 'number'
                ? ((geo as { net_creation: number }).net_creation)
                : undefined,
          }
        : undefined,
    concentration:
      concentration && concentrationLabel
        ? {
            label: concentrationLabel,
            actors:
              typeof (concentration as { actors?: number | null }).actors === 'number'
                ? ((concentration as { actors: number }).actors)
                : undefined,
            hhi:
              typeof (concentration as { hhi?: number | null }).hhi === 'number'
                ? ((concentration as { hhi: number }).hhi)
                : undefined,
          }
        : undefined,
  };
}

function sectorRankLabel(
  position: NonNullable<MarketBlock['position']>,
): string | undefined {
  const p = position as {
    market_position?: { rank?: number | null; total?: number | null } | null;
  };
  const mp = p.market_position;
  if (mp && typeof mp.rank === 'number' && typeof mp.total === 'number') {
    return `#${mp.rank} de ${mp.total}`;
  }
  return undefined;
}

function territoryRankLabel(
  position: NonNullable<MarketBlock['position']>,
): string | undefined {
  const p = position as {
    locality_position?: {
      rank?: number | null;
      total?: number | null;
      scope?: string | null;
    } | null;
  };
  const lp = p.locality_position;
  if (lp && typeof lp.rank === 'number' && typeof lp.total === 'number') {
    return lp.scope
      ? `#${lp.rank} de ${lp.total} en ${lp.scope}`
      : `#${lp.rank} de ${lp.total}`;
  }
  return undefined;
}

function normalizeTrend(t: unknown): 'up' | 'down' | 'flat' | undefined {
  if (t === 'up' || t === 'down' || t === 'flat') return t;
  return undefined;
}

// ────────────────────────────────────────────────────────────────────
// Opportunity adapter (MVP · HARDENING-038b pending)
// ────────────────────────────────────────────────────────────────────

type LayoutOpportunity = {
  thesis?: {
    narrative?: string | null;
    components?: Record<string, string | null> | null;
  } | null;
  chips?: Array<{ enum?: string | null; label_es?: string | null }> | null;
} | null | undefined;

/**
 * `props.opportunity` del monolito → `OpportunityThesisView` del bloque nuevo.
 *
 * TODO(HARDENING-038b): completar `sell.*` desde `succession_profile`
 * y `buy.*` desde `rollup_thesis` vía server-side fetch en el data-loader
 * parent (page.tsx de la ficha). No cablear client-side (R15 · sin motores
 * Intel dev activos, seríamos empty state disfrazado con spinner eterno).
 * Ver `/app/docs/HARDENING-038b_opportunity_full_wiring.md`.
 */
/** Payload crudo de `succession-profile` (proxy Intel). Passthrough tolerante. */
type SuccessionRaw =
  | { score?: number | null; summary?: string | null; narrative?: string | null; attractiveness?: string | null }
  | null
  | undefined;

/** Payload crudo de `rollup-thesis` (proxy Intel). Passthrough tolerante. */
type RollupRaw =
  | { viable?: boolean | null; narrative?: string | null; thesis?: string | null; targets?: Array<{ name?: string | null; fit_score?: number | null }> | null }
  | null
  | undefined;

/**
 * HARDENING-038b · `succession_profile` -> `sell` (sell-side). Solo emite el
 * bloque si hay al menos un campo con fuente; campos ausentes -> null (R15: no
 * fabricamos score ni atractivo). Devuelve undefined si no hay nada.
 */
function mapSell(raw: unknown): OpportunityThesisView['sell'] {
  const s = (raw ?? undefined) as SuccessionRaw;
  if (!s || typeof s !== 'object') return undefined;
  const successionScore = typeof s.score === 'number' ? s.score : undefined;
  const note = s.summary ?? s.narrative ?? undefined;
  const attractiveness = s.attractiveness ?? undefined;
  if (successionScore === undefined && !note && !attractiveness) return undefined;
  return {
    successionScore: successionScore ?? null,
    note: note ?? null,
    attractiveness: attractiveness ?? null,
  };
}

/**
 * HARDENING-038b · `rollup_thesis` -> `buy` (buy-side). `viable` se deriva de
 * `rollup.viable` o, en su defecto, de que existan targets. Los targets solo se
 * incluyen si traen name Y fit_score numerico (R15: sin fit inventado).
 */
function mapBuy(raw: unknown): OpportunityThesisView['buy'] {
  const r = (raw ?? undefined) as RollupRaw;
  if (!r || typeof r !== 'object') return undefined;
  const targets: RollupTarget[] = (Array.isArray(r.targets) ? r.targets : [])
    .map((t) => {
      const name = t?.name ?? null;
      const fit = typeof t?.fit_score === 'number' ? t.fit_score : null;
      return name && fit != null ? { name, fit } : null;
    })
    .filter((x): x is RollupTarget => x !== null);
  const viable =
    typeof r.viable === 'boolean' ? r.viable : targets.length > 0 ? true : undefined;
  const note = r.narrative ?? r.thesis ?? undefined;
  if (viable === undefined && !note && targets.length === 0) return undefined;
  return {
    viable: viable ?? null,
    note: note ?? null,
    targets: targets.length > 0 ? targets : undefined,
  };
}

export function opportunityToThesisView(
  opportunity: LayoutOpportunity,
  succession?: unknown,
  rollup?: unknown,
): OpportunityThesisView {
  const thesis = opportunity?.thesis?.narrative ?? undefined;
  const detected =
    (opportunity?.chips ?? [])
      .map((c) => {
        const label = c.label_es ?? undefined;
        if (!label) return null;
        return { label, strength: 'media' as const };
      })
      .filter((x): x is { label: string; strength: 'media' } => x !== null);

  return {
    thesis,
    detected: detected.length > 0 ? detected : undefined,
    sell: mapSell(succession),
    buy: mapBuy(rollup),
  };
}
