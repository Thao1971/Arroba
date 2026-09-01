# Parche Fase 2 (Beta): tarjeta "Mercados de capitales" en la Ficha

**Qué añade:** la tarjeta visual "Mercados de capitales" (cotización BME + compradores potenciales CNMV) dentro de la pestaña Mercado de la Ficha, usando el bloque nuevo `capital_markets` que ya devuelve `/ficha` en Intel (ver `Intel-140826/memory/PENDIENTE_ENVIAR_A_NEO_INTEL.md`, punto 3). El chip de cabecera "Cotizada" (COMP-1003) ya se enciende solo desde el lado de Intel — esto es aparte, la tarjeta de detalle.

**Dependencia:** requiere que el parche de Intel `FASE2_CAPITAL_MARKETS_PATCH.md` esté aplicado primero (o al menos que `/ficha` ya devuelva `capital_markets`); si no, esta tarjeta simplemente no se pinta (degradado limpio, sin error) porque `ficha?.capital_markets` llega `null`.

**Camino de render verificado (no es el `Mercado()` muerto de líneas ~1954-1980 de `CompanyFichaLayoutV2.tsx` — ese no se invoca en ningún sitio):**

`CompanyFichaF01Client.tsx` → prop `market`/`capitalMarkets` → `CompanyFichaLayoutV2.tsx` → `marketBlockToContextView()` (`components/company/layout/adapters.ts`) → `ctx.market` (`FichaSectionContext`) → `sectionRegistry.tsx`'s `EXTENSION_SECTIONS['mercado'].render` → `<MarketReadingBlock data={ctx.market ?? {}} />` (`components/blocks/market/MarketReadingBlock.tsx`).

5 archivos, en este orden:

## 1. `src/lib/companies/intelligence-types.ts`

**Buscar:**
```typescript
export interface MarketBlock {
  available?: boolean;
  sector?: MarketSector | null;
  geo?: MarketGeo | null;
  concentration?: MarketConcentration | null;
  position?: MarketPosition | null;
  coverage?: { sector?: boolean; geo?: boolean; concentration?: boolean; position?: boolean } | null;
  [key: string]: unknown;
}

export interface CompanyFicha {
  cif_normalized: string | null;
  master_id: string | null;
  finances: FinancialAnalysis | null;
  identity: Record<string, unknown> | null;
  ownership: OwnershipBlock | null;
  governance: GovernanceBlock | null;
  events: Record<string, unknown> | null;
  ranking: Record<string, unknown> | null;
  /** HARDENING-012 · bloque `market` top-level Intel. Passthrough puro. */
  market: MarketBlock | null;
```

**Sustituir por:**
```typescript
export interface MarketBlock {
  available?: boolean;
  sector?: MarketSector | null;
  geo?: MarketGeo | null;
  concentration?: MarketConcentration | null;
  position?: MarketPosition | null;
  coverage?: { sector?: boolean; geo?: boolean; concentration?: boolean; position?: boolean } | null;
  [key: string]: unknown;
}

/**
 * Fase 2 (2026-09-01) · bloque `capital_markets` top-level Intel (CNMV/BME).
 * Passthrough puro, mismo patrón `available`/`reason` que el resto de
 * sub-bloques de la Ficha. R15: cada sub-bloque solo trae dato si lo hay.
 */
export interface CapitalMarketsListing {
  available: boolean;
  reason?: string | null;
  company_name?: string | null;
  isin?: string | null;
  ticker?: string | null;
  market_segment?: string | null;
  market_cap?: number | null;
  share_price?: number | null;
  annual_performance?: number | null;
  sector?: string | null;
}
export interface CapitalMarketsRegulated {
  available: boolean;
  reason?: string | null;
  entity_type?: string | null;
  entity_type_label?: string | null;
  name?: string | null;
  registration_number?: string | null;
}
export interface CapitalMarketsBuyers {
  available: boolean;
  reason?: string | null;
  total?: number | null;
  buyers?: number | null;
  managers?: number | null;
}
export interface CapitalMarketsBlock {
  identifier?: string;
  cif?: string;
  master_id?: string;
  available: boolean;
  listing: CapitalMarketsListing;
  cnmv_regulated: CapitalMarketsRegulated;
  potential_buyers: CapitalMarketsBuyers;
  is_public_company?: boolean;
  engine_version?: string;
}

export interface CompanyFicha {
  cif_normalized: string | null;
  master_id: string | null;
  finances: FinancialAnalysis | null;
  identity: Record<string, unknown> | null;
  ownership: OwnershipBlock | null;
  governance: GovernanceBlock | null;
  events: Record<string, unknown> | null;
  ranking: Record<string, unknown> | null;
  /** HARDENING-012 · bloque `market` top-level Intel. Passthrough puro. */
  market: MarketBlock | null;
  /** Fase 2 (2026-09-01) · bloque `capital_markets` top-level Intel (CNMV/BME). Passthrough puro. */
  capital_markets: CapitalMarketsBlock | null;
```

(El resto de la interfaz `CompanyFicha` — `control_graph`, `opportunity`, `engine_version` — no se toca.)

## 2. `src/components/company/layout/adapters.ts`

**Buscar:**
```typescript
import type { MarketBlock } from '@/lib/companies/intelligence-types';
import type { MarketContextView } from '@/components/blocks/market/MarketReadingBlock';
```

**Sustituir por:**
```typescript
import type { CapitalMarketsBlock, MarketBlock } from '@/lib/companies/intelligence-types';
import type { MarketContextView } from '@/components/blocks/market/MarketReadingBlock';
```

**Buscar:**
```typescript
export function marketBlockToContextView(
  market: MarketBlock | null | undefined,
  reading?: string | null,
): MarketContextView {
  if (!market) {
    return {
      reading: reading ?? undefined,
    };
  }
```

**Sustituir por:**
```typescript
export function marketBlockToContextView(
  market: MarketBlock | null | undefined,
  reading?: string | null,
  capitalMarkets?: CapitalMarketsBlock | null,
): MarketContextView {
  if (!market) {
    return {
      reading: reading ?? undefined,
      capitalMarkets: capitalMarketsToView(capitalMarkets),
    };
  }
```

**Buscar** (el final de la función, justo antes de `sectorRankLabel`):
```typescript
            hhi:
              typeof (concentration as { hhi?: number | null }).hhi === 'number'
                ? ((concentration as { hhi: number }).hhi)
                : undefined,
          }
        : undefined,
  };
}

function sectorRankLabel(
```

**Sustituir por:**
```typescript
            hhi:
              typeof (concentration as { hhi?: number | null }).hhi === 'number'
                ? ((concentration as { hhi: number }).hhi)
                : undefined,
          }
        : undefined,
    capitalMarkets: capitalMarketsToView(capitalMarkets),
  };
}

/**
 * Fase 2 (2026-09-01) · `CapitalMarketsBlock` (shape Intel `capital_markets`
 * canónico) → `MarketContextView['capitalMarkets']`. R15: `listed` solo si
 * `listing.available`; `potentialBuyers` solo si `potential_buyers.available`.
 */
function capitalMarketsToView(
  capitalMarkets: CapitalMarketsBlock | null | undefined,
): MarketContextView['capitalMarkets'] {
  if (!capitalMarkets) return undefined;
  const listing = capitalMarkets.listing;
  const buyers = capitalMarkets.potential_buyers;
  const listed = listing?.available
    ? {
        market: listing.market_segment ?? undefined,
        ticker: listing.ticker ?? undefined,
        marketCap: typeof listing.market_cap === 'number' ? listing.market_cap : undefined,
        sharePrice: typeof listing.share_price === 'number' ? listing.share_price : undefined,
        annualPerformance:
          typeof listing.annual_performance === 'number' ? listing.annual_performance : undefined,
      }
    : undefined;
  const potentialBuyers =
    buyers?.available && typeof buyers.total === 'number'
      ? {
          total: buyers.total,
          buyers: typeof buyers.buyers === 'number' ? buyers.buyers : undefined,
          managers: typeof buyers.managers === 'number' ? buyers.managers : undefined,
        }
      : undefined;
  if (!listed && !potentialBuyers) return undefined;
  return { listed, potentialBuyers };
}

function sectorRankLabel(
```

(El resto del archivo — `territoryRankLabel`, `normalizeTrend`, y la sección de adapters de `opportunity` más abajo — no se toca.)

## 3. `src/components/company/layout/CompanyFichaLayoutV2.tsx`

**Buscar** (bloque de type imports, arriba del archivo):
```typescript
import type {
  BuyerItem, CashFlowRow, CashFlowStatement, ControlGraphAggregated, ControlGraphBlock, ControlGraphNominal, FinancialAnalysis, FinancialAnalysisBalanceSheet, FinancialAnalysisRatioDetail,
  FinancialSection, FinancialTableBlock, GovernanceAggregated, GovernanceBlock, GovernanceNominal,
  IdentitySection, MarketBlock, OwnershipAggregated, OwnershipBlock, OwnershipNominal,
  RecommendationSet, SemanticSection, SignalAnalysis, ValuationAnalysis,
} from '@/lib/companies/intelligence-types';
```

**Sustituir por:**
```typescript
import type {
  BuyerItem, CapitalMarketsBlock, CashFlowRow, CashFlowStatement, ControlGraphAggregated, ControlGraphBlock, ControlGraphNominal, FinancialAnalysis, FinancialAnalysisBalanceSheet, FinancialAnalysisRatioDetail,
  FinancialSection, FinancialTableBlock, GovernanceAggregated, GovernanceBlock, GovernanceNominal,
  IdentitySection, MarketBlock, OwnershipAggregated, OwnershipBlock, OwnershipNominal,
  RecommendationSet, SemanticSection, SignalAnalysis, ValuationAnalysis,
} from '@/lib/companies/intelligence-types';
```

**Buscar** (en la interfaz de props del componente, justo después de `market?: MarketBlock | null;`):
```typescript
  market?: MarketBlock | null;
  /**
   * HARDENING-038b · Payloads crudos de los proxies Intel para poblar sell
```

**Sustituir por:**
```typescript
  market?: MarketBlock | null;
  /** Fase 2 (2026-09-01) · bloque `capital_markets` top-level Intel (CNMV/BME). Passthrough puro. */
  capitalMarkets?: CapitalMarketsBlock | null;
  /**
   * HARDENING-038b · Payloads crudos de los proxies Intel para poblar sell
```

**Buscar** (construcción del `FichaSectionContext`, ~línea 3319):
```typescript
                market: marketBlockToContextView(props.market, props.marketReading),
```

**Sustituir por:**
```typescript
                market: marketBlockToContextView(props.market, props.marketReading, props.capitalMarkets),
```

**No tocar** la función `Mercado()` ni `MercadoSectorPanel`/`MercadoGeoPanel`/`MercadoConcentrationPanel`/`MercadoPositionPanel` (líneas ~1794-1980) — es código muerto, no se invoca desde ningún sitio (verificado por grep de `<Mercado` y de `'mercado'` en todo el árbol de `layout/`). El render real de la pestaña Mercado pasa por `sectionRegistry.tsx` → `MarketReadingBlock.tsx`, que es lo que este parche extiende.

## 4. `src/components/company/CompanyFichaF01Client.tsx`

**Buscar** (lista de props del `<CompanyFichaLayoutV2 .../>`):
```typescript
        market={ficha?.market ?? null}
        opportunity={ficha?.opportunity ?? null}
```

**Sustituir por:**
```typescript
        market={ficha?.market ?? null}
        capitalMarkets={ficha?.capital_markets ?? null}
        opportunity={ficha?.opportunity ?? null}
```

## 5. `src/components/blocks/market/MarketReadingBlock.tsx`

Archivo completo, sustituye tal cual: `memory/PENDING_FIXES/MarketReadingBlock.fixed.tsx`.

Cambios sobre el original: añade el campo `capitalMarkets` a la interfaz `MarketContextView`, añade los helpers `fmtEUR`/`fmtPrice` y el icono `Users` (import de `lucide-react`), y añade una nueva sección `<section>` "Mercados de capitales" al final del componente (mismo estilo de tarjeta que las secciones hermanas — posición/sector/territorio/concentración). Se pinta solo si `listed` o `potentialBuyers` tienen dato (degradado limpio si no, sin hueco ni error). No toca ninguna otra sección del componente.

## Notas para Neo

- Ningún archivo de este parche está en `Mercado()` (código muerto) — todo pasa por el camino de render real confirmado: `sectionRegistry.tsx` → `adapters.ts` → `MarketReadingBlock.tsx`.
- Si el bloque de Intel (`FASE2_CAPITAL_MARKETS_PATCH.md`, cola de Intel) no está desplegado todavía, esta tarjeta simplemente no aparece (degradado limpio) — no rompe nada mientras tanto. Se puede aplicar este parche de Beta antes o después del de Intel sin problema de orden, pero solo se verá completo cuando ambos estén desplegados.
- Diseño visual ya mostrado a Daniel y aprobado: ver `fase2-capital-markets-ficha.html` (mockup con dos ejemplos, no cotizada / cotizada).
- Verificar en preview: abrir la Ficha de una empresa NO cotizada (la tarjeta no debe aparecer si tampoco hay compradores potenciales; si hay compradores potenciales pero no cotiza, debe verse solo esa fila) y de una SÍ cotizada en BME (debe verse la fila de cotización completa). Confirmar que no aparece ningún hueco ni placeholder cuando `capital_markets` es `null` (visitante anónimo o Intel aún no desplegado).
