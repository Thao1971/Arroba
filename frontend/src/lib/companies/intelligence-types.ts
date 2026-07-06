/**
 * intelligence-types — Tipos TS canónicos UI arroba (B.6.f · D2).
 *
 * Refleja los schemas Pydantic de
 * `backend/src/modules/intelligence_layer/interfaces/canonical_ui.py`.
 * Contrato interno **congelado** (R5). Cualquier cambio requiere bump del
 * `engine_version` (`arroba-financial-v1`, `arroba-semantic-v1`, …).
 *
 * Estos tipos son la superficie que consume `CompanyPageClient` y los
 * bloques (`RevenueEvolutionBlock`, `PLBlock`, `BalanceBlock`, …) desde
 * los endpoints `/api/companies/{cif}/section/*`.
 *
 * R4/R10 — El frontend NO deriva `variation`, `benchmark`, `semantic`,
 * `explanation`. Sólo pinta lo que llega. Si no llega → `null`.
 */

/* ============================================================
 * Tipos comunes
 * ============================================================ */

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type Severity = 'low' | 'medium' | 'high';
export type Impact = 'low' | 'medium' | 'high';
export type Direction = 'up' | 'down' | 'flat';
export type Magnitude = 'weak' | 'medium' | 'strong';
export type CellFormat = 'currency' | 'percent' | 'number' | 'ratio';
export type CellSemantic = 'positive' | 'negative' | 'neutral' | 'warning';
export type RowCategory = 'total' | 'subtotal' | 'line' | 'derived';
export type RatioCategory =
  | 'profitability'
  | 'liquidity'
  | 'solvency'
  | 'efficiency'
  | 'growth';
export type SeriesFormat = 'currency' | 'percent' | 'ratio';
export type RatioFormat = 'percent' | 'ratio' | 'currency' | 'multiple';

export interface ConfidenceInfo {
  level: ConfidenceLevel;
  score?: number | null;
}

export interface Variation {
  value: number;
  direction: Direction;
  magnitude: Magnitude;
}

export interface Benchmark {
  median: number;
  percentile?: number | null;
}

/** Anotación temporal para charts (A1). Superficie preparada aunque hoy [] . */
export interface ChartAnnotation {
  id: string;
  timestamp: string | number;
  type: 'anomaly' | 'trend_change' | 'milestone' | 'corporate_event';
  subtype?: string | null;
  title: string;
  description?: string | null;
  severity?: Severity | null;
}

/* ============================================================
 * BlockExplainability (D3) — slot canónico presente en cada bloque
 * ============================================================ */

export interface BlockExplainabilityRisk {
  title: string;
  description: string;
  severity: Severity;
}

export interface BlockExplainabilityOpportunity {
  title: string;
  description: string;
  impact: Impact;
}

export interface BlockExplainability {
  key_insight?: string | null;
  relevance?: string | null;
  buyer_perspective?: string | null;
  seller_perspective?: string | null;
  risks?: BlockExplainabilityRisk[];
  opportunities?: BlockExplainabilityOpportunity[];
  confidence?: ConfidenceInfo | null;
  generated_at?: string | null;
  engine_version?: string | null; // "arroba-explainability-v1" cuando exista
}

/** Props base de todo bloque canónico B.6.f (D3). */
export interface BlockProps<TData> {
  data: TData | null;
  loading?: boolean;
  error?: Error | null;
  /** Slot canónico D3. Hoy siempre `undefined`. */
  explainability?: BlockExplainability;
  onLearnMore?: () => void;
}

/* ============================================================
 * SectionMetadata (D2)
 * ============================================================ */

export interface SectionCoverage {
  evolution: boolean;
  profit_loss: boolean;
  balance: boolean;
  ratios: boolean;
}

export interface SectionMetadata {
  source: string | null;
  updated_at: string | null;
  confidence: ConfidenceInfo | null;
  engine_version: string; // "arroba-*-v1"
  coverage: SectionCoverage | null;
  generated_at: string | null;
}

/* ============================================================
 * FinancialSection
 * ============================================================ */

export interface FinancialTableCell {
  value: number | null;
  format: CellFormat;
  variation?: Variation | null;
  semantic?: CellSemantic | null;
  benchmark?: Benchmark | null;
  explanation?: string | null;
}

export interface FinancialTableRow {
  key: string;
  label: string;
  category: RowCategory;
  values: FinancialTableCell[];
}

export interface FinancialSeries {
  key: string;
  label: string;
  values: (number | null)[];
  format: SeriesFormat;
}

export interface FinancialEvolutionBlock {
  years: number[];
  series: FinancialSeries[];
  annotations: ChartAnnotation[];
}

export interface FinancialTableBlock {
  years: number[];
  rows: FinancialTableRow[];
}

export interface FinancialRatioItem {
  key: string;
  name: string;
  value: number | null;
  format: RatioFormat;
  category: RatioCategory;
  formula?: string | null;
  benchmark?: Benchmark | null;
}

export interface FinancialRatiosBlock {
  items: FinancialRatioItem[];
}

export interface FinancialAnomaly {
  detected: boolean;
  severity?: Severity | null;
  title?: string | null;
  explanation?: string | null;
}

export interface FinancialSection {
  master_id: string | null;
  cif_normalized: string | null;
  evolution: FinancialEvolutionBlock | null;
  profit_loss: FinancialTableBlock | null;
  balance: FinancialTableBlock | null;
  ratios: FinancialRatiosBlock | null;
  anomaly: FinancialAnomaly | null;
  annotations: ChartAnnotation[];
  explainability: BlockExplainability | null;
  metadata: SectionMetadata;
}

/* ============================================================
 * IdentitySection
 * ============================================================ */

export interface IdentityClassification {
  cnae_code: string | null;
  cnae_description: string | null;
  cnae_section: string | null;
  cnae_division: string | null;
}

export interface IdentityLocation {
  provincia: string | null;
  municipio: string | null;
  codigo_postal: string | null;
  pais: string | null;
}

export interface IdentityContact {
  web: string | null;
  domain: string | null;
}

export interface IdentitySize {
  employees_total: number | null;
  capital_social: number | null;
}

export interface IdentitySectionCoverage {
  core: boolean;
  ownership: boolean;
  officers: boolean;
  objeto_social: boolean;
}

export interface IdentitySection {
  master_id: string | null;
  cif_normalized: string | null;
  status: 'active' | 'merged' | 'deprecated';
  legal_name: string | null;
  commercial_name: string | null;
  aliases: string[];
  country: string | null;
  classification: IdentityClassification;
  location: IdentityLocation;
  contact: IdentityContact;
  size: IdentitySize;
  objeto_social: string | null;
  officers_count: number | null;
  coverage: IdentitySectionCoverage;
  explainability: BlockExplainability | null;
  metadata: SectionMetadata;
}

/* ============================================================
 * ValuationSection
 * ============================================================ */

export interface ValuationRangeBar {
  low: number | null;
  central: number | null;
  high: number | null;
  currency: 'EUR';
}

export interface ValuationPeer {
  master_id: string | null;
  name: string | null;
  cnae_section: string | null;
  same_province: boolean | null;
  ebitda_margin: number | null;
  multiple: number | null;
}

export interface ValuationSectionCoverage {
  valuation: boolean;
  peers: boolean;
}

export interface ValuationSection {
  master_id: string | null;
  cif_normalized: string | null;
  method: string | null;
  multiple_label: string | null;
  multiple_value: number | null;
  range: ValuationRangeBar | null;
  peers: ValuationPeer[];
  inputs: Array<{ label: string; value: string; hint?: string | null }>;
  disclaimer: string | null;
  coverage: ValuationSectionCoverage;
  explainability: BlockExplainability | null;
  metadata: SectionMetadata;
}

/* ============================================================
 * SemanticSection
 * ============================================================ */

export interface SemanticSimilarItem {
  master_id: string | null;
  cif: string | null;
  name: string;
  sector: string | null;
  region: string | null;
  score: number;
  matched_dimensions: string[];
}

export interface SemanticSectionCoverage {
  profile: boolean;
  similar: boolean;
}

export interface SemanticSection {
  master_id: string | null;
  cif_normalized: string | null;
  activities: string[];
  products_services: string[];
  markets: string[];
  keywords: string[];
  value_proposition: string | null;
  business_model: string | null;
  similar: SemanticSimilarItem[];
  coverage: SemanticSectionCoverage;
  explainability: BlockExplainability | null;
  metadata: SectionMetadata;
}
