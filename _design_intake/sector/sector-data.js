// arroba.com — Ficha sectorial (Sector Intelligence) data
window.SECTOR_DATA = {
  meta: {
    cnae: 'J',
    name: 'Información y Comunicaciones',
    route: '/sectores/J',
  },

  aiSummary: 'El sector de Información y Comunicaciones es actualmente uno de los tres sectores más dinámicos de España. Presenta un Índice de Oportunidad de 88/100, impulsado principalmente por la concentración de actividad en Madrid y Cataluña, el crecimiento de la contratación pública y la elevada actividad registral observada durante los últimos 12 meses.',

  kpis: [
    { icon: 'target',   value: '88',       label: 'Índice de Oportunidad', delta: '+6 pts', trend: 'up',   hero: true },
    { icon: 'team',     value: '142.380',  label: 'Empresas activas',      delta: '+4,2%',  trend: 'up' },
    { icon: 'trending', value: '76',       label: 'Growth Score',          delta: '+8 pts', trend: 'up' },
    { icon: 'chartBar', value: '81',       label: 'Activity Score',        delta: '+3 pts', trend: 'up' },
    { icon: 'euro',     value: '€2,4 Bn',  label: 'Contratación pública',  delta: '+18%',   trend: 'up' },
    { icon: 'document', value: '8.412',    label: 'Eventos BORME (12m)',   delta: '+11%',   trend: 'up' },
  ],

  evolution: {
    months: ['Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May'],
    creacion: [12,11,9,14,12,16,13,18,15,20,17,21],
    cierres:  [6,5,7,6,8,7,9,7,9,8,9,9],
    saldo:    [6,6,2,8,4,9,4,11,6,12,8,12],
    borme:    [14,13,11,16,15,18,16,20,18,22,20,24],
  },

  // Geo distribution (reuse Spain map regions; sector intensity)
  geo: {
    hoverExample: { name: 'Madrid', index: 96, activas: '115.877', borme: '1.825', concentration: '4,9x' },
    leaders: [
      { rank: 1, name: 'Madrid',       index: 96, concentration: '4,9x', activity: 94 },
      { rank: 2, name: 'Cataluña',     index: 91, concentration: '3,7x', activity: 89 },
      { rank: 3, name: 'Canarias',     index: 84, concentration: '2,1x', activity: 78 },
      { rank: 4, name: 'C. Valenciana', index: 82, concentration: '1,9x', activity: 76 },
      { rank: 5, name: 'País Vasco',   index: 80, concentration: '2,3x', activity: 74 },
    ],
  },

  subsectors: [
    { code: '61', name: 'Telecomunicaciones',             empresas: '12.840', growth: '+3,1%', index: 79 },
    { code: '62', name: 'Programación y consultoría',      empresas: '94.210', growth: '+12,4%', index: 91 },
    { code: '63', name: 'Servicios de información',        empresas: '21.480', growth: '+9,7%',  index: 85 },
    { code: '58', name: 'Edición',                         empresas: '8.940',  growth: '+1,2%',  index: 64 },
    { code: '59', name: 'Cine, vídeo y TV',               empresas: '4.910',  growth: '+5,8%',  index: 72 },
  ],

  featured: [
    { name: 'Indra',      sub: 'Tecnología & Defensa', logo: 'IN' },
    { name: 'Telefónica', sub: 'Telecomunicaciones',   logo: 'TE' },
    { name: 'Amadeus',    sub: 'Travel Tech',          logo: 'AM' },
    { name: 'Minsait',    sub: 'Consultoría IT',       logo: 'MI' },
    { name: 'GMV',        sub: 'Aeroespacial & IT',    logo: 'GM' },
  ],

  ma: [
    { type: 'Adquisición',      target: 'Nexus Digital',   buyer: 'Minsait',      value: '€45M',  date: 'Abr 2025', kind: 'acq' },
    { type: 'Levantamiento',    target: 'Cloud Iberia',    buyer: 'Serie B',      value: '€28M',  date: 'Mar 2025', kind: 'raise' },
    { type: 'Fusión',          target: 'DataCorp + Bitlab', buyer: '—',           value: 'n.d.',  date: 'Feb 2025', kind: 'merge' },
    { type: 'Adquisición',      target: 'SecureNet',       buyer: 'GMV',          value: '€19M',  date: 'Ene 2025', kind: 'acq' },
  ],

  procurement: {
    total: '€2,4 Bn', contracts: '14.280',
    organisms: [
      { name: 'Ministerio de Defensa',          value: '€412M', share: 100 },
      { name: 'SEPE',                           value: '€287M', share: 70 },
      { name: 'Generalitat de Catalunya',       value: '€198M', share: 48 },
      { name: 'Comunidad de Madrid',            value: '€176M', share: 43 },
      { name: 'Sergas',                         value: '€124M', share: 30 },
    ],
  },

  signals: [
    { type: 'up',   text: 'Crecimiento acelerado en creación de empresas', detail: 'Programación y consultoría (CNAE 62) +12,4%', strength: 0.88 },
    { type: 'up',   text: 'Incremento de la contratación pública',         detail: '+18% interanual, liderado por Defensa y SEPE', strength: 0.82 },
    { type: 'up',   text: 'Concentración creciente en Madrid',             detail: 'Concentración 4,9x sobre la media nacional',  strength: 0.71 },
    { type: 'down', text: 'Menor actividad en Andalucía',                  detail: '-4% en altas registrales vs. media nacional', strength: 0.42 },
    { type: 'up',   text: 'Nuevas sociedades mercantiles',                 detail: '+8.412 eventos BORME en 12 meses',            strength: 0.66 },
  ],

  agentPresets: [
    '¿Qué está impulsando este sector?',
    '¿Qué territorios lideran el crecimiento?',
    '¿Qué riesgos existen?',
    '¿Dónde hay oportunidades de compra?',
  ],

  description: 'El sector de Información y Comunicaciones (CNAE J) agrupa la edición, el cine y la televisión, las telecomunicaciones, la programación y consultoría informática y los servicios de información. Es uno de los motores de la economía digital española, con una fuerte concentración en Madrid y Cataluña y un peso creciente de la contratación pública. La programación y consultoría (CNAE 62) representa por sí sola dos tercios del tejido empresarial del sector.',

  // ── Series para la pestaña Gráficos (valores agregados del sector, 6 ejercicios) ──
  graficos: {
    years: ['2019', '2020', '2021', '2022', '2023', '2024'],
    facturacion:   [78.4, 74.1, 82.6, 94.3, 108.7, 121.5],   // Bn€
    margenBruto:   [41.2, 39.8, 43.5, 46.1, 48.9, 51.3],     // %
    ebitda:        [14.6, 12.9, 16.2, 18.7, 21.4, 24.1],     // Bn€
    empleados:     [512, 498, 541, 588, 634, 678],            // miles
    revPorEmp:     [153, 149, 153, 160, 171, 179],            // K€ / empleado
    margenPorEmp:  [63, 60, 66, 74, 84, 92],                  // K€ margen bruto / empleado
    ebitdaPorEmp:  [28.5, 25.9, 30.0, 31.8, 33.8, 35.5],     // K€ EBITDA / empleado
  },

  // Distribución de margen para la pestaña Magnitudes (histogramas con marcadores)
  distMargen: {
    bruto: {
      n: 710,
      aggregated: { val: 38.1, label: '38,1%' },
      median: { val: 52.9, label: '52,9%' },
      buckets: [
        { label: '< 20%', max: 20, count: 90 },
        { label: '20-30%', max: 30, count: 90 },
        { label: '30-40%', max: 40, count: 88 },
        { label: '40-50%', max: 50, count: 62 },
        { label: '50-60%', max: 60, count: 72 },
        { label: '60-70%', max: 70, count: 67 },
        { label: '> 70%', max: 100, count: 234 },
      ],
    },
    ebitda: {
      n: 759,
      aggregated: { val: 5.3, label: '5,3%' },
      median: { val: 6.2, label: '6,2%' },
      buckets: [
        { label: '< 0%', max: 0, count: 92 },
        { label: '0-5%', max: 5, count: 232 },
        { label: '5-10%', max: 10, count: 188 },
        { label: '10-15%', max: 15, count: 108 },
        { label: '15-20%', max: 20, count: 56 },
        { label: '20-30%', max: 30, count: 54 },
        { label: '> 30%', max: 100, count: 40 },
      ],
    },
  },

  // ── Distribuciones de todas las magnitudes (mismo diseño de histograma) ──
  // Colores corporativos arroba (rojo / info / éxito / aviso / morado / teal)
  distributions: [
    { key: 'facturacion', title: 'Facturación', unit: '€', color: '#E8001D', n: 5696,
      aggregated: { val: 7, label: '21,3M€' }, median: { val: 1.2, label: '1,4M€' },
      buckets: [
        { label: '< 1M', max: 1, count: 232 }, { label: '1-5M', max: 5, count: 188 },
        { label: '5-10M', max: 10, count: 96 }, { label: '10-25M', max: 25, count: 72 },
        { label: '25-50M', max: 50, count: 44 }, { label: '50-100M', max: 100, count: 28 },
        { label: '> 100M', max: 9999, count: 36 },
      ] },
    { key: 'margenBruto', title: 'Margen bruto', unit: '%', color: '#2164E3', n: 710,
      aggregated: { val: 38.1, label: '38,1%' }, median: { val: 52.9, label: '52,9%' },
      buckets: [
        { label: '< 20%', max: 20, count: 90 }, { label: '20-30%', max: 30, count: 90 },
        { label: '30-40%', max: 40, count: 88 }, { label: '40-50%', max: 50, count: 62 },
        { label: '50-60%', max: 60, count: 72 }, { label: '60-70%', max: 70, count: 67 },
        { label: '> 70%', max: 100, count: 234 },
      ] },
    { key: 'ebitda', title: 'EBITDA', unit: '€', color: '#1A8A4A', n: 759,
      aggregated: { val: 3, label: '3,9M€' }, median: { val: 0.4, label: '0,3M€' },
      buckets: [
        { label: '< 0', max: 0, count: 92 }, { label: '0-0,5M', max: 0.5, count: 214 },
        { label: '0,5-2M', max: 2, count: 176 }, { label: '2-5M', max: 5, count: 104 },
        { label: '5-15M', max: 15, count: 78 }, { label: '15-30M', max: 30, count: 41 },
        { label: '> 30M', max: 9999, count: 28 },
      ] },
    { key: 'empleados', title: 'Empleados', unit: '', color: '#D97708', n: 6120,
      aggregated: { val: 9, label: '48' }, median: { val: 12, label: '11' },
      buckets: [
        { label: '< 10', max: 10, count: 248 }, { label: '10-25', max: 25, count: 162 },
        { label: '25-50', max: 50, count: 98 }, { label: '50-100', max: 100, count: 64 },
        { label: '100-250', max: 250, count: 42 }, { label: '250-1.000', max: 1000, count: 26 },
        { label: '> 1.000', max: 99999, count: 14 },
      ] },
    { key: 'revPorEmp', title: 'Revenue por empleado', unit: 'K€', color: '#7C3AED', n: 5410,
      aggregated: { val: 120, label: '179K€' }, median: { val: 95, label: '102K€' },
      buckets: [
        { label: '< 50K', max: 50, count: 88 }, { label: '50-100K', max: 100, count: 226 },
        { label: '100-150K', max: 150, count: 198 }, { label: '150-250K', max: 250, count: 132 },
        { label: '250-500K', max: 500, count: 74 }, { label: '> 500K', max: 9999, count: 38 },
      ] },
    { key: 'margenPorEmp', title: 'Margen bruto por empleado', unit: 'K€', color: '#0EA5A5', n: 5288,
      aggregated: { val: 60, label: '92K€' }, median: { val: 48, label: '54K€' },
      buckets: [
        { label: '< 25K', max: 25, count: 96 }, { label: '25-50K', max: 50, count: 214 },
        { label: '50-75K', max: 75, count: 168 }, { label: '75-125K', max: 125, count: 124 },
        { label: '125-250K', max: 250, count: 72 }, { label: '> 250K', max: 9999, count: 34 },
      ] },
    { key: 'ebitdaPorEmp', title: 'EBITDA por empleado', unit: 'K€', color: '#E8001D', n: 5102,
      aggregated: { val: 28, label: '35,5K€' }, median: { val: 18, label: '21K€' },
      buckets: [
        { label: '< 0', max: 0, count: 78 }, { label: '0-15K', max: 15, count: 208 },
        { label: '15-30K', max: 30, count: 196 }, { label: '30-50K', max: 50, count: 118 },
        { label: '50-100K', max: 100, count: 68 }, { label: '> 100K', max: 9999, count: 30 },
      ] },
  ],

  // Distribución de empresas por tramo de facturación
  distribution: [
    { bucket: '< 1M€',     pct: 71, count: '101.090' },
    { bucket: '1–5M€',     pct: 18, count: '25.628' },
    { bucket: '5–20M€',    pct: 7,  count: '9.967' },
    { bucket: '20–100M€',  pct: 3,  count: '4.271' },
    { bucket: '> 100M€',   pct: 1,  count: '1.424' },
  ],

  // Scatter: margen EBITDA (x) vs crecimiento (y) por empresa
  scatter: [
    { name: 'Programación IT', x: 24, y: 34, r: 20, hot: true },
    { name: 'Servicios info.', x: 21, y: 28, r: 15 },
    { name: 'Cine/TV', x: 18, y: 19, r: 10 },
    { name: 'Telecom', x: 32, y: 9, r: 17 },
    { name: 'Edición', x: 14, y: 6, r: 8 },
  ],

  // Joyas ocultas — empresas infravaloradas con alto potencial
  gems: [
    { name: 'Datatec Soluciones', province: 'Madrid',     revenue: '8,4M€',  margin: '27%', cagr: '+31%', opp: 94, why: 'Margen superior a la media con crecimiento sostenido y sin actividad de M&A previa.' },
    { name: 'Cloud Norte',        province: 'País Vasco',  revenue: '5,1M€',  margin: '24%', cagr: '+28%', opp: 91, why: 'Nicho de infraestructura cloud regional, baja competencia y caja saneada.' },
    { name: 'Visualnet',          province: 'C. Valenciana', revenue: '3,9M€', margin: '22%', cagr: '+26%', opp: 88, why: 'Crecimiento acelerado en servicios de información con cartera recurrente.' },
    { name: 'Bitsenda',           province: 'Cataluña',    revenue: '6,7M€',  margin: '21%', cagr: '+24%', opp: 86, why: 'Plataforma SaaS B2B con expansión internacional incipiente.' },
  ],

  // Rankings — top empresas por distintas métricas
  rankings: {
    facturacion: [
      { name: 'Telefónica', value: '€39.300M' }, { name: 'Amadeus', value: '€5.420M' },
      { name: 'Indra', value: '€4.240M' }, { name: 'Cellnex', value: '€3.870M' }, { name: 'Másmóvil', value: '€2.960M' },
    ],
    crecimiento: [
      { name: 'Datatec Soluciones', value: '+31%' }, { name: 'Cloud Norte', value: '+28%' },
      { name: 'Visualnet', value: '+26%' }, { name: 'Bitsenda', value: '+24%' }, { name: 'Nexus Digital', value: '+22%' },
    ],
    margen: [
      { name: 'Amadeus', value: '38%' }, { name: 'Cellnex', value: '34%' },
      { name: 'Datatec Soluciones', value: '27%' }, { name: 'GMV', value: '25%' }, { name: 'Cloud Norte', value: '24%' },
    ],
  },

  // Concentración — cuota acumulada
  concentration: {
    hhi: 1840, hhiLabel: 'Moderada',
    top: [
      { name: 'Telefónica', share: 32 },
      { name: 'Amadeus', share: 11 },
      { name: 'Indra', share: 8 },
      { name: 'Cellnex', share: 6 },
      { name: 'Másmóvil', share: 5 },
    ],
    restShare: 38,
    note: 'Las 5 mayores compañías concentran el 62% de la facturación del sector. El resto se reparte entre más de 142.000 empresas, en su mayoría microempresas de programación y consultoría.',
  },
};
