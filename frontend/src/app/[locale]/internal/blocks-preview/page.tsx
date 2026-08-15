'use client';
/**
 * HARDENING-BETA-para-emergent + HARDENING-BETA-preview-scenarios
 *
 * Página interna de review visual para los 4 componentes aterrizados en
 * `/app/frontend/src/components/blocks/{committee,financial,market,opportunity}/`.
 * NO cableada a Intel ni al layout monolítico (`CompanyFichaLayoutV2.tsx`) —
 * el cableado real vive en HARDENING-037 (layout) y HARDENING-038 (proxies).
 *
 * `runCommittee` aquí es un stub local con delay 400ms + mock por lente.
 * `?scenario=proceed|proceed_with_conditions|pass` sobreescribe el mock
 * neutral para poder validar los 3 veredictos canónicos del comité sin
 * backend (mini-fuzz visual).
 *
 * NO indexar: la ruta vive bajo `/[locale]/internal/` (excluida vía middleware
 * i18n) y este archivo emite `<meta name="robots" content="noindex">` para
 * defensiva adicional.
 */
import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import {
  InvestmentCommitteeBlock,
  type CommitteeLens,
  type CommitteeResult,
} from '@/components/blocks/committee/InvestmentCommitteeBlock';
import { SingleExerciseChart } from '@/components/blocks/financial/SingleExerciseChart';
import {
  MarketReadingBlock,
  type MarketContextView,
} from '@/components/blocks/market/MarketReadingBlock';
import {
  OpportunityThesisBlock,
  type OpportunityThesisView,
} from '@/components/blocks/opportunity/OpportunityThesisBlock';

type Scenario = 'proceed' | 'proceed_with_conditions' | 'pass';
const DEFAULT_SCENARIO: Scenario = 'proceed';
const SCENARIOS: { id: Scenario; label: string; blurb: string }[] = [
  { id: 'proceed', label: 'Avanzar', blurb: 'Veredicto favorable · confianza alta' },
  { id: 'proceed_with_conditions', label: 'Con condiciones', blurb: 'Favorable con condiciones · confianza media' },
  { id: 'pass', label: 'No avanzar', blurb: 'Rechazo con veto legal/riesgo · confianza contraria' },
];

// ─── Mocks · plausibles pero explícitamente sintéticos ──────────────────
const MOCK_MARKET: MarketContextView = {
  reading:
    'El sector se encuentra en fase de consolidación selectiva: los tres primeros actores concentran cerca del 40% del mercado y la creación neta de empresas se ha ralentizado en los últimos 12 meses. La empresa opera en la mitad superior del sector por ingresos, con posición destacada en su territorio, y muestra dinamismo comercial por encima de la media provincial.',
  position: {
    headline: 'Líder territorial en su categoría',
    percentile: 78,
    sectorRank: '#5 de 62 en su sector',
    territoryRank: '#1 de 12 en Bilbao',
  },
  sector: {
    label: 'Agencias de marketing',
    verdict: 'Sector maduro con consolidación selectiva',
    dynamism: 54,
    trend: 'flat',
  },
  territory: {
    label: 'Bilbao',
    verdict: 'Plaza de primer nivel',
    dynamism: 72,
    activeCompanies: 148,
    netCreation: 12,
  },
  concentration: {
    label: 'Mercado moderadamente concentrado',
    actors: 62,
    hhi: 1820,
  },
};

const MOCK_OPPORTUNITY: OpportunityThesisView = {
  thesis:
    'Perfil de operación mixto: la empresa presenta señales de sucesión (fundadora >60, sin plan público) que la hacen candidata a sell-side y, al tiempo, encaja como plataforma de roll-up regional por su liderazgo territorial y su estructura financiera saneada.',
  detected: [
    { label: 'Sucesión probable en 24-36 meses', strength: 'alta' },
    { label: 'Plataforma de roll-up regional', strength: 'media' },
    { label: 'Ventana de valoración favorable', strength: 'media' },
  ],
  sell: {
    successionScore: 74,
    note: 'Fundadora >60 sin plan de sucesión anunciado. EBITDA margin estable 15-18%.',
    attractiveness: 'Alta',
  },
  buy: {
    viable: true,
    note: '4 targets identificados en la provincia con EBITDA <1M y encaje sectorial fuerte.',
    targets: [
      { name: 'AGENCIA CREATIVA NORTE', fit: 82 },
      { name: 'ESTUDIO DIGITAL BILBAO', fit: 78 },
      { name: 'PUBLICIDAD ATLÁNTICA', fit: 71 },
      { name: 'COMUNICACIÓN BIZKAIA', fit: 65 },
    ],
  },
};

const MOCK_COMMITTEE_RESPONSES: Record<CommitteeLens, CommitteeResult> = {
  neutral: {
    decision_id: 'dec_mock_neutral_001',
    recommendation: 'PROCEED_WITH_CONDITIONS',
    investment_score: 72,
    confidence: 0.81,
    executive_summary:
      'Empresa saneada con posición territorial destacada, márgenes estables y crecimiento moderado. Se detectan dos áreas de atención: dependencia comercial de sus 3 principales clientes (>45% de la facturación) y ventana de sucesión abierta a medio plazo.',
    investment_thesis:
      'Perfil defensivo con potencial de consolidación regional. La empresa combina márgenes sostenibles con una cartera de clientes de largo recorrido y una base territorial difícil de replicar. La principal palanca de valor está en la diversificación comercial y el plan de sucesión.',
    conditions_to_proceed: [
      'Auditoría de dependencia comercial (top-10 clientes).',
      'Plan de sucesión directiva formalizado antes del closing.',
      'Revisión de contingencias laborales pre-2020.',
    ],
    committee: [
      { specialist: 'cfo', recommendation: 'proceed', score: 78, strengths: [{ text: 'EBITDA margin sostenido 15-18% en últimos 4 ejercicios.' }] },
      { specialist: 'valuation', recommendation: 'proceed', score: 74, strengths: [{ text: 'Múltiplo de referencia dentro de rango razonable (5.8x EV/EBITDA).' }] },
      { specialist: 'strategy', recommendation: 'proceed_with_conditions', score: 72, strengths: [{ text: 'Encaje sectorial fuerte con mandato de agencias regionales.' }] },
      { specialist: 'commercial', recommendation: 'proceed_with_conditions', score: 62, weaknesses: [{ text: 'Top-3 clientes concentran el 45% de la facturación.' }] },
      { specialist: 'operations', recommendation: 'proceed', score: 76 },
      { specialist: 'market', recommendation: 'proceed', score: 71 },
      { specialist: 'hr', recommendation: 'proceed_with_conditions', score: 58, risks: [{ text: 'Fundadora >60 sin plan de sucesión formalizado.' }] },
      { specialist: 'legal', recommendation: 'proceed', score: 82, veto: false },
      { specialist: 'risk', recommendation: 'proceed_with_conditions', score: 68, risks: [{ text: 'Riesgo agregado moderado, concentrado en comercial.' }] },
      { specialist: 'investment_director', recommendation: 'proceed_with_conditions', score: 73 },
    ],
  },
  buyer: {
    decision_id: 'dec_mock_buyer_001',
    recommendation: 'PROCEED_WITH_CONDITIONS',
    investment_score: 74,
    confidence: 0.78,
    executive_summary:
      'Encaje estratégico alto como plataforma de consolidación. Recomendamos avanzar tras satisfacer las condiciones sobre sucesión y dependencia comercial.',
    investment_thesis:
      'La adquisición aporta cobertura territorial en el norte y una cartera estable de clientes recurrentes. Las sinergias comerciales estimadas oscilan entre el 4% y el 7% de los ingresos combinados en el año 1.',
    conditions_to_proceed: [
      'Cerrar la transición directiva (retención founder 24m).',
      'Reducir concentración de clientes al <30% en el top-3 pre-closing.',
    ],
    committee: [
      { specialist: 'cfo', recommendation: 'proceed', score: 78 },
      { specialist: 'strategy', recommendation: 'proceed', score: 82 },
      { specialist: 'synergy', recommendation: 'proceed', score: 74, strengths: [{ text: 'Sinergias comerciales 4-7% de ingresos combinados año 1.' }] },
      { specialist: 'valuation', recommendation: 'proceed_with_conditions', score: 71 },
      { specialist: 'legal', recommendation: 'proceed', score: 82 },
      { specialist: 'risk', recommendation: 'proceed_with_conditions', score: 68 },
      { specialist: 'commercial', recommendation: 'proceed_with_conditions', score: 62 },
      { specialist: 'operations', recommendation: 'proceed', score: 76 },
      { specialist: 'hr', recommendation: 'proceed_with_conditions', score: 58 },
      { specialist: 'investment_director', recommendation: 'proceed_with_conditions', score: 74 },
    ],
  },
  investor: {
    decision_id: 'dec_mock_investor_001',
    recommendation: 'EXPLORE',
    investment_score: 64,
    confidence: 0.72,
    executive_summary:
      'Retornos esperados moderados con perfil defensivo. La ausencia de un vector de crecimiento agresivo limita el atractivo para un vehículo de private equity de crecimiento.',
    investment_thesis:
      'La empresa ofrece cashflow estable pero requiere una tesis de expansión clara para justificar el ticket. Recomendamos explorar el ángulo roll-up antes de descartar.',
    conditions_to_proceed: [
      'Identificar tesis de expansión concreta (roll-up regional o internacionalización).',
      'Modelar múltiplo de salida con al menos 2 escenarios (base y estresado).',
    ],
    committee: [
      { specialist: 'cfo', recommendation: 'explore', score: 68 },
      { specialist: 'valuation', recommendation: 'explore', score: 62 },
      { specialist: 'strategy', recommendation: 'proceed_with_conditions', score: 66 },
      { specialist: 'commercial', recommendation: 'pass', score: 54, weaknesses: [{ text: 'Concentración comercial y crecimiento orgánico limitado.' }] },
      { specialist: 'legal', recommendation: 'proceed', score: 82 },
      { specialist: 'risk', recommendation: 'proceed', score: 71 },
      { specialist: 'market', recommendation: 'explore', score: 61 },
      { specialist: 'operations', recommendation: 'proceed', score: 74 },
      { specialist: 'hr', recommendation: 'proceed_with_conditions', score: 58 },
      { specialist: 'investment_director', recommendation: 'explore', score: 64 },
    ],
  },
  seller: {
    // La lente `seller` está marcada `ready: false` en el componente → nunca
    // llegaremos aquí desde la UI, pero el mock queda por completitud del tipo.
    decision_id: null,
    recommendation: 'EXPLORE',
    investment_score: 0,
    confidence: 0,
    executive_summary: null,
    investment_thesis: null,
    conditions_to_proceed: [],
    committee: [],
  },
};

const stubRunCommittee = (
  scenario: Scenario,
) => (_cif: string, lens: CommitteeLens): Promise<CommitteeResult> =>
  new Promise((resolve) => {
    // El escenario override sólo tiene sentido en la lente `neutral` (el
    // scenario switcher es una lente global de veredicto, no de perfil).
    // Para las lentes buyer/investor el mock queda intacto — combinarlas
    // añadiría matriz 4×3 sin señal de review adicional.
    const base = MOCK_COMMITTEE_RESPONSES[lens];
    const scenarioOverride =
      lens === 'neutral' ? SCENARIO_OVERRIDES[scenario] ?? null : null;
    setTimeout(() => resolve(scenarioOverride ?? base), 400);
  });

// HARDENING-BETA-preview-scenarios · overrides del veredicto neutral para
// mini-fuzz visual. Cada override reemplaza el `MOCK_COMMITTEE_RESPONSES.neutral`
// completo (recommendation + score + confidence + summary + condiciones +
// deliberación por especialista) para que el `InvestmentCommitteeBlock`
// pinte los 3 estados canónicos sin necesidad de backend Intel.
const SCENARIO_OVERRIDES: Record<Scenario, CommitteeResult> = {
  proceed: {
    decision_id: 'dec_mock_proceed_001',
    recommendation: 'PROCEED',
    investment_score: 84,
    confidence: 0.89,
    executive_summary:
      'Empresa saneada con márgenes por encima de la media sectorial, crecimiento sostenido de doble dígito y posición de liderazgo territorial. Sin banderas rojas legales ni financieras materiales. Recomendamos avanzar.',
    investment_thesis:
      'Combinación infrecuente de crecimiento, rentabilidad y foco. El comité coincide en que el perfil es defensivo con opción de aceleración vía roll-up regional. Sin condiciones bloqueantes.',
    conditions_to_proceed: [],
    committee: [
      { specialist: 'cfo', recommendation: 'proceed', score: 88, strengths: [{ text: 'EBITDA margin 22% en TTM, growth +18% YoY.' }] },
      { specialist: 'valuation', recommendation: 'proceed', score: 82, strengths: [{ text: 'Múltiplo por debajo del rango de comparables premium.' }] },
      { specialist: 'strategy', recommendation: 'proceed', score: 86 },
      { specialist: 'commercial', recommendation: 'proceed', score: 80, strengths: [{ text: 'Cartera diversificada, top-3 clientes <25%.' }] },
      { specialist: 'operations', recommendation: 'proceed', score: 84 },
      { specialist: 'market', recommendation: 'proceed', score: 82 },
      { specialist: 'hr', recommendation: 'proceed', score: 78, strengths: [{ text: 'Plan de sucesión formalizado y comunicado.' }] },
      { specialist: 'legal', recommendation: 'proceed', score: 90, veto: false },
      { specialist: 'risk', recommendation: 'proceed', score: 85 },
      { specialist: 'investment_director', recommendation: 'proceed', score: 86 },
    ],
  },
  proceed_with_conditions: {
    decision_id: 'dec_mock_proceed_cond_001',
    recommendation: 'PROCEED_WITH_CONDITIONS',
    investment_score: 68,
    confidence: 0.72,
    executive_summary:
      'Empresa sólida con posición competitiva relevante pero con dos áreas de atención que requieren remediación pre-closing: dependencia comercial (top-3 concentra 45% de la facturación) y ventana de sucesión abierta a medio plazo. Recomendamos avanzar tras satisfacer las condiciones.',
    investment_thesis:
      'Perfil defensivo con potencial de consolidación regional. La empresa combina márgenes sostenibles con una cartera de clientes de largo recorrido y una base territorial difícil de replicar. La palanca principal está en diversificar comercialmente y cerrar el plan de sucesión.',
    conditions_to_proceed: [
      'Auditoría de dependencia comercial (top-10 clientes) pre-closing.',
      'Plan de sucesión directiva formalizado con retención founder 24 meses.',
      'Revisión de contingencias laborales pre-2020 con provisión adecuada.',
    ],
    committee: [
      { specialist: 'cfo', recommendation: 'proceed', score: 74 },
      { specialist: 'valuation', recommendation: 'proceed_with_conditions', score: 70 },
      { specialist: 'strategy', recommendation: 'proceed_with_conditions', score: 72 },
      { specialist: 'commercial', recommendation: 'proceed_with_conditions', score: 58, weaknesses: [{ text: 'Top-3 clientes concentran el 45% de la facturación.' }] },
      { specialist: 'operations', recommendation: 'proceed', score: 76 },
      { specialist: 'market', recommendation: 'proceed', score: 71 },
      { specialist: 'hr', recommendation: 'proceed_with_conditions', score: 56, risks: [{ text: 'Fundadora >60 sin plan de sucesión formalizado.' }] },
      { specialist: 'legal', recommendation: 'proceed', score: 82 },
      { specialist: 'risk', recommendation: 'proceed_with_conditions', score: 66, risks: [{ text: 'Riesgo agregado moderado, concentrado en comercial.' }] },
      { specialist: 'investment_director', recommendation: 'proceed_with_conditions', score: 70 },
    ],
  },
  pass: {
    decision_id: 'dec_mock_pass_001',
    recommendation: 'PASS',
    investment_score: 38,
    confidence: 0.83,
    executive_summary:
      'El comité recomienda NO AVANZAR. Se identifican dos vetos materiales: (a) contingencia legal significativa por litigio activo con la Agencia Tributaria; (b) riesgo agregado alto por deterioro de márgenes en los últimos 3 ejercicios. La confianza en la recomendación negativa es alta.',
    investment_thesis:
      'La operación no encaja en el mandato: el binomio deterioro operativo + contingencia legal desplaza el retorno esperado fuera del rango de tolerancia. Reevaluar en 24 meses si los frentes abiertos se cierran.',
    conditions_to_proceed: [
      'Resolución firme de la contingencia fiscal (litigio nº AT-2023-4471) antes de reabrir el caso.',
      'Reversión sostenida del deterioro de margen (2 ejercicios completos por encima del 10%).',
    ],
    committee: [
      { specialist: 'cfo', recommendation: 'pass', score: 42, weaknesses: [{ text: 'Deterioro sostenido de márgenes (-8pp en 3 años).' }] },
      { specialist: 'valuation', recommendation: 'pass', score: 40 },
      { specialist: 'strategy', recommendation: 'pass', score: 44 },
      { specialist: 'commercial', recommendation: 'pass', score: 48 },
      { specialist: 'operations', recommendation: 'proceed_with_conditions', score: 58 },
      { specialist: 'market', recommendation: 'explore', score: 52 },
      { specialist: 'hr', recommendation: 'pass', score: 46 },
      { specialist: 'legal', recommendation: 'pass', score: 22, veto: true, veto_kind: 'contingencia_material', risks: [{ text: 'Litigio activo con la Agencia Tributaria (AT-2023-4471) sin provisión.' }] },
      { specialist: 'risk', recommendation: 'pass', score: 28, veto: true, veto_kind: 'riesgo_agregado_alto', risks: [{ text: 'Riesgo agregado por deterioro operativo + contingencia legal.' }] },
      { specialist: 'investment_director', recommendation: 'pass', score: 38 },
    ],
  },
};

// ─── Preview page (con Suspense boundary por `useSearchParams` en client) ─
export default function BlocksPreviewPage() {
  return (
    <Suspense fallback={null}>
      <BlocksPreviewInner />
    </Suspense>
  );
}

function BlocksPreviewInner() {
  const params = useSearchParams();
  const pathname = usePathname() ?? '/es/internal/blocks-preview';
  const raw = (params.get('scenario') || '').toLowerCase();
  const scenario: Scenario = (SCENARIOS.find((s) => s.id === raw)?.id) ?? DEFAULT_SCENARIO;

  // useMemo para que los mocks no se recreen en cada render (el chart usa
  // useEffect con `revenue`/`ebitda` en deps y no queremos re-animar sin causa).
  const singleExercise = useMemo(
    () => ({
      year: 2024,
      revenue: 12_450_000,
      ebitda: 1_890_000,
      ebitdaMargin: 0.152,
      source: 'Mock · plausible',
      updatedAt: '2024-06-15',
    }),
    [],
  );

  // El stub se recrea cuando cambia el escenario para que la próxima
  // deliberación devuelva el mock correcto. El `key={scenario}` en el bloque
  // fuerza remount y reinicia el estado idle→loading→done.
  const runCommittee = useMemo(() => stubRunCommittee(scenario), [scenario]);

  const alert = (msg: string) => () =>
    // eslint-disable-next-line no-alert
    window.alert(`Mock action: ${msg}`);

  return (
    <div className="min-h-screen bg-surface-base">
      <meta name="robots" content="noindex,nofollow" />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div
          role="alert"
          data-testid="blocks-preview-warning"
          className="rounded-xl border border-warning/40 bg-warning-subtle/40 px-4 py-3 mb-8 text-sm text-warning"
        >
          ⚠️ Página interna de review visual · mock data · no usar en producción.
          Cableado real de estos bloques queda pendiente en HARDENING-037 (layout) y
          HARDENING-038 (proxies Intel).
        </div>

        <header className="mb-6">
          <h1 className="font-display text-h2 font-bold text-text-primary">
            Blocks preview
          </h1>
          <p className="text-body-sm text-text-muted mt-1">
            Aterrizaje aislado · HARDENING-BETA-para-emergent · opción a2.
          </p>
        </header>

        {/* HARDENING-BETA-preview-scenarios · switcher de veredicto Committee. */}
        <div
          data-testid="blocks-preview-scenario-switcher"
          className="mb-10 pb-6 border-b border-border-default"
        >
          <div className="text-caption text-text-muted uppercase tracking-wide mb-2">
            Escenario Committee · mini-fuzz visual del veredicto
          </div>
          <div className="flex gap-2 flex-wrap">
            {SCENARIOS.map((s) => {
              const active = s.id === scenario;
              const nextParams = new URLSearchParams(params.toString());
              nextParams.set('scenario', s.id);
              const href = `${pathname}?${nextParams.toString()}`;
              return (
                <Link
                  key={s.id}
                  href={href}
                  data-testid={`blocks-preview-scenario-${s.id}`}
                  data-active={active ? 'true' : 'false'}
                  scroll={false}
                  className={
                    'inline-flex flex-col gap-0.5 px-4 py-2 rounded-lg border text-sm transition-colors ' +
                    (active
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold'
                      : 'border-border-default bg-surface-elevated text-text-primary hover:bg-surface-muted')
                  }
                >
                  <span>{s.label}</span>
                  <span className="text-caption text-text-muted font-normal">
                    {s.blurb}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Componente 1 · SingleExerciseChart */}
        <section
          data-testid="blocks-preview-single-exercise-chart"
          className="mb-12 pb-12 border-b border-border-default"
        >
          <div className="mb-4 text-caption text-text-muted uppercase tracking-wide">
            components/blocks/financial/SingleExerciseChart · 229 LOC
          </div>
          <SingleExerciseChart {...singleExercise} />
        </section>

        {/* Componente 2 · MarketReadingBlock */}
        <section
          data-testid="blocks-preview-market-reading"
          className="mb-12 pb-12 border-b border-border-default"
        >
          <div className="mb-4 text-caption text-text-muted uppercase tracking-wide">
            components/blocks/market/MarketReadingBlock · 198 LOC
          </div>
          <MarketReadingBlock data={MOCK_MARKET} />
        </section>

        {/* Componente 3 · InvestmentCommitteeBlock */}
        <section
          data-testid="blocks-preview-investment-committee"
          className="mb-12 pb-12 border-b border-border-default"
        >
          <div className="mb-4 text-caption text-text-muted uppercase tracking-wide">
            components/blocks/committee/InvestmentCommitteeBlock · 338 LOC ·
            scenario={scenario}
          </div>
          {/* key={scenario} fuerza remount al cambiar de veredicto — resetea
              state y `runCommittee` recibe el nuevo override. */}
          <InvestmentCommitteeBlock
            key={scenario}
            cif="B28184687"
            defaultLens="neutral"
            runCommittee={runCommittee}
            onExport={alert('export decision_id')}
          />
        </section>

        {/* Componente 4 · OpportunityThesisBlock */}
        <section data-testid="blocks-preview-opportunity-thesis" className="mb-6">
          <div className="mb-4 text-caption text-text-muted uppercase tracking-wide">
            components/blocks/opportunity/OpportunityThesisBlock · 191 LOC
          </div>
          <OpportunityThesisBlock
            data={MOCK_OPPORTUNITY}
            onFollow={alert('follow')}
            onGenerateDoc={alert('generateDoc')}
            onCommittee={alert('committee')}
            onCreateOpportunity={alert('createOpportunity')}
            onSeeSuccession={alert('seeSuccession')}
            onSeeRollup={alert('seeRollup')}
          />
        </section>
      </div>
    </div>
  );
}
