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
 * FinancialAnalysis (raw §6.2 · endpoint /financial-analysis)
 * ============================================================
 * Superficie más rica que `FinancialSection` — la usa la sección Finanzas
 * (F0.2) para pintar Nivel 3 detalle (Cuenta de Resultados completa, Balance
 * completo, cashflow=null → UnavailableBlock) + la narrativa Copilot
 * source-grounded (`financial_quality.strengths/weaknesses/risks` +
 * `explainability.rules_applied`).
 */

export interface FinancialAnalysisIncomeStatement {
  revenue?: number | null;
  supplies?: number | null;
  personnel_costs?: number | null;
  depreciation?: number | null;
  operating_income?: number | null;
  financial_expenses?: number | null;
  ebit?: number | null;
  ebitda?: number | null;
  net_income?: number | null;
}

export interface FinancialAnalysisBalanceSheet {
  current_assets?: number | null;
  non_current_assets?: number | null;
  total_assets?: number | null;
  cash?: number | null;
  current_liabilities?: number | null;
  non_current_liabilities?: number | null;
  total_liabilities?: number | null;
  st_debt?: number | null;
  lt_debt?: number | null;
  financial_debt?: number | null;
  equity?: number | null;
}

export interface FinancialAnalysisKpis {
  revenue?: number | null;
  ebitda?: number | null;
  ebitda_margin?: number | null;
  ebit?: number | null;
  ebit_margin?: number | null;
  net_income?: number | null;
  net_margin?: number | null;
  gross_margin?: number | null;
  employees_total?: number | null;
  revenue_per_employee?: number | null;
  revenue_growth_yoy?: number | null;
  revenue_cagr?: number | null;
  ebitda_growth_yoy?: number | null;
  [k: string]: number | null | undefined | Record<string, unknown>;
}

export interface FinancialAnalysisRatioDetail {
  value?: number | null;
  name?: string | null;
  category?: string | null;
  formula?: string | null;
  explanation?: string | null;
  source?: string | null;
  available?: boolean | null;
  prev_value?: number | null;
  delta?: number | null;
  /** Carácter Unicode devuelto por Intel: '▲', '▼' o null. */
  trend?: string | null;
}

export interface FinancialAnalysisEvolutionPoint {
  year: number;
  revenue?: number | null;
  ebitda?: number | null;
  net_income?: number | null;
}

export interface FinancialAnalysisEvolution {
  trend?: 'positive' | 'flat' | 'deterioration' | 'stable' | string | null;
  years?: number | null;
  anomaly?: boolean | null;
  revenue_growth_yoy?: number | null;
  ebitda_growth_yoy?: number | null;
  revenue_cagr?: number | null;
  points?: FinancialAnalysisEvolutionPoint[] | null;
}

export interface FinancialAnalysisQuality {
  score?: number | null;
  assessment?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  risks?: string[];
}

export interface FinancialAnalysisAssessment {
  score?: number | null;
  label?: string | null;
  /** Prosa CF cuantitativa (paridad conceptual con `financial_quality.assessment`). */
  assessment?: string | null;
  /** Prosa CF veredictal cualitativa · Hero card "Veredicto de ARROBA" (Intel 2026-08-11). */
  verdict?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  risks?: string[];
}

export interface FinancialAnalysisExplainability {
  data_source?: string | null;
  source_version?: string | null;
  basis?: string | null;
  year?: number | null;
  rules_applied?: string | null;
  ai_used?: boolean | null;
}

/** Identidad anidada dentro de FinancialAnalysis (Intel I-1 puebla aquí description/objeto_social cuando /section/identity aún los devuelve null). */
export interface FinancialAnalysisIdentity {
  name?: string | null;
  cnae_code?: string | null;
  cnae_section?: string | null;
  provincia?: string | null;
  objeto_social?: string | null;
  description?: string | null;
}

/** Ranking sectorial y geográfico embebido en analyze.ranking (Intel I-1). Todos los campos opcionales. */
export interface FinancialAnalysisRanking {
  sector_revenue_percentile?: number | null;
  market_position?: { rank: number; total: number; scope: string } | null;
  locality_position?: { rank: number; total: number; scope: string } | null;
  explain?: string[] | null;
}

/**
 * B-2.5 · Estado de flujos de efectivo · passthrough desde analyze.statements.cash_flow (Intel I-1).
 * Shape observado en Servier `B28184687`:
 *   - `years`: array descendente de años (más reciente → más antiguo).
 *   - `rows[]`: 6 filas categorizadas (`operating`, `investing`, `financing`,
 *     `net_change`, `summary`). Cada `values[i]` alinea con `years[i]`.
 *   - `values[].format`: `currency` o `percent`.
 * R15 estricto: no derivar subtotales en frontend, sólo renderizar lo que llega.
 */
export type CashFlowRowCategory = 'operating' | 'investing' | 'financing' | 'net_change' | 'summary';
export interface CashFlowValue {
  value?: number | null;
  format?: 'currency' | 'percent' | string | null;
}
export interface CashFlowRow {
  key: string;
  label: string;
  category: CashFlowRowCategory | string;
  values: CashFlowValue[];
}
export interface CashFlowStatement {
  years: number[];
  rows: CashFlowRow[];
}

export interface FinancialAnalysis {
  master_id: string | null;
  cif_normalized: string | null;
  identity: FinancialAnalysisIdentity | null;
  cnae_code: string | null;
  cnae_section: string | null;
  provincia: string | null;
  has_financials: boolean;
  data_source: string | null;
  source_version: string | null;
  basis: 'individual' | 'consolidated' | null;
  year: number | null;
  years: number[];
  kpis: FinancialAnalysisKpis | null;
  income_statement: FinancialAnalysisIncomeStatement | null;
  balance_sheet: FinancialAnalysisBalanceSheet | null;
  cashflow: Record<string, unknown> | null;
  cash_flow: CashFlowStatement | null;
  ratios: Record<string, FinancialAnalysisRatioDetail | number> | Record<string, never>;
  financial_quality: FinancialAnalysisQuality | null;
  evolution: FinancialAnalysisEvolution | null;
  assessment: FinancialAnalysisAssessment | null;
  valuation: Record<string, unknown> | null;
  ranking: FinancialAnalysisRanking | null;
  explainability: FinancialAnalysisExplainability | null;
  engine_version: string | null;
  generated_at: string | null;
}

/* ============================================================
 * ValuationAnalysis (F0.3 · arroba-valuation-v1)
 * ============================================================ */

export interface ValuationRange {
  low: number | null;
  central: number | null;  // = enterprise_value canónico (arroba lo enriquece)
  high: number | null;
}

/** Un escenario de valoración (Intel I-1 devuelve típicamente `conservador` / `base` / `optimista`). */
export interface ValuationScenario {
  name: string;
  enterprise_value: number | null;
  equity_value: number | null;
}

/** Benchmark peer para valoración (Intel I-1 v2: subject vs mediana sector, con percentile). */
export interface ValuationBenchmark {
  peers_count: number;
  scope: string | null;
  median_ebitda_margin: number | null;
  subject_ebitda_margin: number | null;
  median_revenue: number | null;
  subject_revenue: number | null;
  ebitda_margin_percentile: number | null;
}

export interface ValuationLineage {
  financials_source: string | null;
  basis: string | null;
  year: number | null;
}

export interface ValuationAnalysis {
  master_id: string | null;
  cif_normalized: string | null;
  method: string | null;
  method_label: string | null;
  multiple: number | null;
  multiple_basis: string | null;
  enterprise_value: number | null;
  equity_value: number | null;
  range: ValuationRange | null;
  confidence: number | null;
  confidence_level: 'low' | 'medium' | 'high' | null;
  hypotheses: string[];
  lineage: ValuationLineage | null;
  bridge_components: Array<Record<string, unknown>> | null;
  scenarios: ValuationScenario[] | null;
  sensitivity: Record<string, unknown> | null;
  benchmark: ValuationBenchmark | null;
  methodology: string | null;
  has_valuation: boolean;
  engine_version: string;  // "arroba-valuation-v1"
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

/** Sprint F0.1 — estado registral y mercantil (COMP-1003 Public Status). */
export interface IdentityRegistryStatus {
  mercantile_status?: string | null;
  record_status?: string | null;
  activity_status?: string | null;
  legal_form?: string | null;
  incorporation_date?: string | null;
  is_listed?: boolean | null;
  listed_market?: string | null;
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
  // ---- F0.1 · superficie ampliada V2 ----
  activity?: string | null;
  sectors?: string[];
  address?: string | null;
  autonomous_community?: string | null;
  description?: string | null;
  registry_status?: IdentityRegistryStatus | null;
  /** `{field: bool}` mapa de presencia (Explainability P1). */
  data_coverage?: Record<string, boolean>;
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

/* ============================================================
 * SignalAnalysis (§6.4 · arroba-signal-v1)
 * ============================================================ */

export interface SignalItem {
  signal_id: string;
  signal_type: string | null;
  category: string | null;
  severity: string | null;
  polarity: string | null;
  title: string | null;
  confidence: number | null;
  detected_at: string | null;
  recommended_actions: string[];
  // HARDENING-007 · B-2 Turno post-D · passthrough aditivo desde
  // `signal-intelligence/analyze` (Intel). R15: sin cálculo, sólo transporte.
  explanation?: string | null;
  evidence?: { metric?: string | null; value?: number | string | null; window?: string | null } | null;
  dimensions?: { impact?: number; confidence?: number; urgency?: number; persistence?: number } | null;
  rule?: { id?: string; expression?: string; threshold?: number | null; passed?: boolean } | null;
}

export interface SignalScore {
  signal_score: number | null;
  method: string | null;
}

export interface SignalAnalysis {
  master_id: string | null;
  cif_normalized: string | null;
  signals: SignalItem[];
  score: SignalScore | null;
  counts_by_category: Record<string, number>;
  engine_version: string | null;
  generated_at: string | null;
}

/* ============================================================
 * RecommendationSet — compradores (§6.6 · arroba-recommendation-v1)
 * ============================================================ */

export interface BuyerItem {
  master_id: string | null;
  name: string | null;
  sector: string | null;
  recommendation_type: string | null;
  score: number | null;
  fit_dimensions: Record<string, number>;
  reason: string | null;
  recommended_actions: string[];
}

export interface RecommendationSet {
  master_id: string | null;
  cif_normalized: string | null;
  recommendation_type: string | null;
  count: number;
  recommendations: BuyerItem[];
  engine_version: string | null;
  generated_at: string | null;
}

/* ============================================================
 * CompanyFicha — agregador `/company/{cif}/ficha` (B-2.4 · arroba-ficha-v1)
 * ============================================================
 * Un solo response contiene: identity + finances + ownership + governance +
 * events + ranking. Reduce el waterfall SWR de 5 llamadas a 1. Mixed-access:
 * el usuario anónimo recibe `finances=null` (secciones con cifras siguen gated).
 * Passthrough puro: `identity`, `ownership`, `governance`, `events`, `ranking`
 * (top-level) llegan como `Record<string, unknown>` para consumo específico
 * en fases futuras (B-2.2 Ownership, Events shell).
 *
 * B-2.3 · DPD backend (2026-08-11): `governance` viaja en 2 shapes disjuntos
 * según auth-state (el discriminador es la presencia de `officers` vs `summary`):
 *
 *   1) Autenticado → shape nominal (passthrough Intel):
 *      { available: true, officers: [{name, role, since, year}, ...], coverage, ... }
 *
 *   2) Anónimo → shape agregado DPD (SIN `officers`):
 *      { available: true, coverage, summary: { total, roles: [{role, role_label, count}, ...] } }
 *
 *   3) available:false → passthrough para ambos:
 *      { available: false, ... }
 *
 * El backend garantiza que el usuario anónimo NUNCA recibe nombres de personas
 * físicas (regla DPD estricta). El frontend consume `GovernanceBlock` (union type
 * `GovernanceNominal | GovernanceAggregated | GovernanceUnavailable`).
 */

export interface GovernanceOfficer {
  name: string;
  role: string;
  since: string | null;
  year: number | null;
}

export interface GovernanceRoleSummaryEntry {
  /** Slug determinista (lower + `_`), útil para keys estables y i18n futura. */
  role: string;
  /** Label CF español passthrough desde Intel (sin traducir · R15). */
  role_label: string;
  count: number;
}

export interface GovernanceNominal {
  available: true;
  officers: GovernanceOfficer[];
  coverage?: { officers_count?: number } | null;
  engine_version?: string;
  [key: string]: unknown;
}

export interface GovernanceAggregated {
  available: true;
  summary: {
    total: number;
    roles: GovernanceRoleSummaryEntry[];
  };
  coverage?: { officers_count?: number } | null;
  [key: string]: unknown;
}

export interface GovernanceUnavailable {
  available: false;
  engine_version?: string;
  [key: string]: unknown;
}

export type GovernanceBlock = GovernanceNominal | GovernanceAggregated | GovernanceUnavailable;

/* ============================================================
 * OwnershipBlock (B-2.2 · DPD backend · 2026-08-11)
 * ============================================================
 * Shape del bloque `ownership` del agregador. Union discriminado:
 *
 *   1) Autenticado con datos → shape nominal Intel:
 *      {
 *        available: true,
 *        shareholders: [{name, cif, pct, as_of_year}, ...],
 *        control: {controlling_shareholder, top1_pct, top1_name, tier},
 *        coverage: {shareholders_count},
 *        ...
 *      }
 *      Campo real es `pct` (NO `percentage`) — Fase 0 Servier confirmada.
 *
 *   2) Anónimo con datos → shape agregado DPD (sin nombres):
 *      {
 *        available: true,
 *        coverage,
 *        summary: {total_shareholders, tier?, top1_pct?}
 *      }
 *      Cero nombres (físicos y jurídicos), cero cifs individuales, cero pcts
 *      individuales. Política simplificada aprobada 2026-08-11.
 *
 *   3) available:false → passthrough para ambos.
 */

export interface OwnershipShareholder {
  name: string;
  cif: string | null;
  pct: number | null;
  as_of_year: number | null;
}

export interface OwnershipControl {
  controlling_shareholder: string | null;
  top1_pct: number | null;
  top1_name: string | null;
  tier: string | null;
}

export interface OwnershipNominal {
  available: true;
  shareholders: OwnershipShareholder[];
  control?: OwnershipControl | null;
  coverage?: { shareholders_count?: number } | null;
  engine_version?: string;
  [key: string]: unknown;
}

export interface OwnershipAggregated {
  available: true;
  summary: {
    total_shareholders: number;
    tier?: string | null;
    top1_pct?: number | null;
  };
  coverage?: { shareholders_count?: number } | null;
  [key: string]: unknown;
}

export interface OwnershipUnavailable {
  available: false;
  engine_version?: string;
  [key: string]: unknown;
}

export type OwnershipBlock = OwnershipNominal | OwnershipAggregated | OwnershipUnavailable;

/* ============================================================
 * MarketBlock (HARDENING-012 · 2026-08-12)
 * ============================================================
 * Shape del bloque `market` top-level entregado por Intel · passthrough puro.
 * 4 sub-paneles independientes: sector, geo, concentration, position.
 * `position` duplica semánticamente `finances.ranking` (paridad Intel).
 * Sección UI "Contexto sectorial y territorial" · sector+geo+concentration públicos,
 * position gated.
 */
export interface MarketSector {
  available?: boolean;
  cnae_code?: string | null;
  cnae_label?: string | null;
  cnae_level?: string | null;
  size_score?: number | null;
  dynamism_score?: number | null;
  growth_score?: number | null;
  activity_score?: number | null;
  active_companies?: number | null;
  iberinform_companies?: number | null;
  market_share?: number | null;
  national_yoy_pct?: number | null;
  trend_direction?: 'up' | 'stable' | 'down' | string | null;
  primary_driver?: string | null;
  signal?: string | null;
}
export interface MarketGeo {
  available?: boolean;
  geo_id?: string | null;
  geo_name?: string | null;
  geo_level?: string | null;
  parent_ccaa?: string | null;
  size_score?: number | null;
  dynamism_score?: number | null;
  growth_score?: number | null;
  revenue_growth?: number | null;
  employment_growth?: number | null;
  net_company_creation?: number | null;
  active_companies?: number | null;
  trend_direction?: 'up' | 'stable' | 'down' | string | null;
  primary_driver?: string | null;
  signal?: string | null;
}
export interface MarketConcentration {
  available?: boolean;
  level?: string | null;
  degraded?: boolean;
  cnae_field?: string | null;
  cnae_value?: string | null;
  hhi?: number | null;
  concentration_label?: string | null;
  market_actors_count?: number | null;
  distinct_ownership_groups?: number | null;
  standalone_targets_count?: number | null;
  total_companies_in_universe?: number | null;
  companies_with_revenue_data?: number | null;
  hhi_methodology?: string | null;
  caveat?: string | null;
  degraded_reason?: string | null;
}
export interface MarketPosition {
  available?: boolean;
  sector_revenue_percentile?: number | null;
  market_position?: { rank?: number | null; total?: number | null; scope?: string | null } | null;
  locality_position?: { rank?: number | null; total?: number | null; scope?: string | null } | null;
  explain?: string[];
}
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
  /** HARDENING-014 · bloque `control_graph` top-level Intel. Union discriminado. */
  control_graph: ControlGraphBlock | null;
  engine_version: string;
}

/* ============================================================
 * ControlGraphBlock (HARDENING-014 · 2026-08-13 · shape v2 post-REQ Intel)
 * ============================================================
 * Shape del bloque `control_graph` del agregador Intel · union discriminado:
 *
 *   1) Autenticado con datos → shape nominal Intel completo v2:
 *      { available:true, company, as_of_year, shareholders[], subsidiaries[],
 *        ubo, graph:{nodes[], edges[]}, distribution[], narrative, coverage,
 *        engine_version }
 *      Intel YA anonimiza los nombres (`"Accionista principal"`, `"Beneficiario
 *      último"`, `"Participada 1"`) — Arroba no re-anonimiza.
 *
 *   2) Anónimo con datos → shape DPD agregado (Arroba oculta las estructuras
 *      gateadas por política opt-in):
 *      { available:true, company, coverage, summary{shareholders_count,
 *        participations_count}, engine_version }
 *      Sin `shareholders`, `subsidiaries`, `ubo`, `graph`, `distribution`,
 *      `narrative`.
 *
 *   3) available:false → passthrough para ambos.
 */
export interface ControlGraphCompany {
  master_id?: string | null;
  name?: string | null;
  cif?: string | null;
}
export interface ControlGraphShareholder {
  name: string | null;
  type?: 'legal' | 'natural' | string | null;
  pct: number | null;
  label?: string | null;
  cif?: string | null;
  master_id?: string | null;
  is_ubo?: boolean;
}
export interface ControlGraphSubsidiary {
  name: string | null;
  cif?: string | null;
  master_id?: string | null;
  pct: number | null;
  activity?: string | null;
  control_label?: string | null;
}
export interface ControlGraphUbo {
  name?: string | null;
  type?: string | null;
  kind?: string | null;
  pct_effective?: number | null;
}
export interface ControlGraphNode {
  id: string;
  label: string;
  kind: 'company' | 'shareholder' | 'ubo' | 'subsidiary' | string;
}
export interface ControlGraphEdge {
  from: string;
  to: string;
  pct: number | null;
}
export interface ControlGraphGraph {
  nodes: ControlGraphNode[];
  edges: ControlGraphEdge[];
}
export interface ControlGraphDistributionItem {
  label: string;
  pct: number | null;
  tone?: 'primary' | 'neutral' | string | null;
}
export interface ControlGraphCoverage {
  shareholders?: boolean;
  subsidiaries?: boolean;
  ubo?: boolean;
  truncated?: boolean;
}
export interface ControlGraphNominal {
  available: true;
  company: ControlGraphCompany | null;
  as_of_year?: number | null;
  shareholders: ControlGraphShareholder[];
  subsidiaries: ControlGraphSubsidiary[];
  ubo?: ControlGraphUbo | null;
  graph?: ControlGraphGraph | null;
  distribution?: ControlGraphDistributionItem[] | null;
  narrative?: string | null;
  coverage?: ControlGraphCoverage | null;
  engine_version?: string;
}
export interface ControlGraphAggregated {
  available: true;
  company?: ControlGraphCompany | null;
  coverage?: ControlGraphCoverage | null;
  summary: {
    shareholders_count: number;
    participations_count: number;
  };
  engine_version?: string;
}
export interface ControlGraphUnavailable {
  available: false;
  engine_version?: string;
}
export type ControlGraphBlock =
  | ControlGraphNominal
  | ControlGraphAggregated
  | ControlGraphUnavailable;
