// arroba.com — Public home mock data (matched to reference layout)
window.HOME_DATA = {
  // Hero example chips
  examples: ['Inditex', 'Clínicas dentales en Madrid', 'Transporte en Valencia', 'Grupo Soledad', 'SaaS B2B'],

  // Panorama card — 4 mini KPIs
  panorama: [
    { label: 'Empresas activas', value: '3.386.432', delta: '+0,8%', sub: 'vs. mes anterior', trend: 'up',   icon: 'agency' },
    { label: 'Nuevas empresas',  value: '12.458',    delta: '+6,3%', sub: 'vs. mes anterior', trend: 'up',   icon: 'trending' },
    { label: 'Empresas cerradas', value: '8.721',    delta: '+4,1%', sub: 'vs. mes anterior', trend: 'down', icon: 'close' },
    { label: 'IPC (abr. 2024)',  value: '3,4%',      delta: '-0,2pp', sub: 'vs. mar. 2024',   trend: 'down', icon: 'euro' },
  ],

  // Panorama — 12-month evolution lines
  evolution: {
    months: ['May','Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr'],
    activas:  [21.2,21.4,21.5,21.6,21.8,21.9,22.0,22.1,22.3,22.4,22.5,22.6], // thousands (scaled)
    nuevas:   [11.8,12.1,11.6,12.4,12.0,12.6,12.2,12.8,12.5,13.0,12.7,12.46],
    cerradas: [8.2,8.0,8.4,8.1,8.6,8.3,8.7,8.5,8.9,8.6,8.8,8.72],
  },

  // Panorama — sectores más dinámicos
  dynamicSectors: [
    { rank: 1, name: 'Actividades profesionales', delta: '+12,4%' },
    { rank: 2, name: 'Tecnología e informática',  delta: '+10,1%' },
    { rank: 3, name: 'Salud y servicios sociales', delta: '+8,7%' },
    { rank: 4, name: 'Construcción',               delta: '+7,3%' },
    { rank: 5, name: 'Energía',                    delta: '+6,2%' },
  ],

  // Row of 7 macro KPI cards
  macroKpis: [
    { value: '3,38M+', label: 'Empresas activas',     delta: '+0,8%',  sub: 'vs. mes anterior', trend: 'up',   icon: 'agency' },
    { value: '12.458', label: 'Nuevas empresas',      delta: '+6,3%',  sub: 'vs. mes anterior', trend: 'up',   icon: 'trending' },
    { value: '8.721',  label: 'Empresas cerradas',    delta: '+4,1%',  sub: 'vs. mes anterior', trend: 'down', icon: 'close' },
    { value: '2.156',  label: 'Concursos acreedores', delta: '+3,7%',  sub: 'vs. mes anterior', trend: 'down', icon: 'warning' },
    { value: '3,4%',   label: 'IPC (abr. 2024)',      delta: '-0,2pp', sub: 'vs. mar. 2024',    trend: 'up',   icon: 'euro' },
    { value: '2,4%',   label: 'Crecimiento PIB 2024e', delta: '+0,3pp', sub: 'vs. 2023',         trend: 'up',   icon: 'chartBar' },
    { value: '11,2%',  label: 'Tasa de paro',         delta: '-0,4pp', sub: 'vs. mar. 2024',    trend: 'up',   icon: 'team' },
  ],

  // Mapa — top provincias
  provinces: [
    { rank: 1, name: 'Madrid',    value: '2.341', activity: 96 },
    { rank: 2, name: 'Barcelona', value: '1.987', activity: 88 },
    { rank: 3, name: 'Valencia',  value: '1.256', activity: 72 },
    { rank: 4, name: 'Alicante',  value: '876',   activity: 61 },
    { rank: 5, name: 'Málaga',    value: '812',   activity: 58 },
  ],

  // Empresas en venta destacadas
  forSale: [
    { name: 'Empresa logística',  city: 'Valencia',  price: '4,2M€',  sector: 'Logística',  ebitda: '850K', revenue: '6,3M' },
    { name: 'Clínica dental',     city: 'Madrid',    price: '1,1M€',  sector: 'Salud',      ebitda: '280K', revenue: '620K' },
    { name: 'Taller industrial',  city: 'Barcelona', price: '750K€',  sector: 'Industrial', ebitda: '180K', revenue: '1,2M' },
  ],

  // Últimas valoraciones
  valuations: [
    { type: 'Empresa de software',  city: 'Madrid',  value: '3,2M€', time: 'Hoy' },
    { type: 'Comercio al por mayor', city: 'Sevilla', value: '1,8M€', time: 'Ayer' },
    { type: 'Consultora estratégica', city: 'Barcelona', value: '950K€', time: 'Ayer' },
  ],

  // Sectores en tendencia (sparklines)
  trendSectors: [
    { name: 'Tecnología e informática', delta: '+10,1%', spark: [30,32,31,35,34,38,40,42,45,48], icon: 'chartLine' },
    { name: 'Salud y servicios sociales', delta: '+8,7%', spark: [28,30,29,32,34,33,37,39,41,44], icon: 'verified' },
    { name: 'Energías renovables',      delta: '+7,6%', spark: [25,27,30,28,33,35,34,38,40,43], icon: 'trending' },
    { name: 'Logística y transporte',   delta: '+6,4%', spark: [32,31,34,33,36,38,37,40,42,44], icon: 'deal' },
    { name: 'Agroalimentario',          delta: '+5,3%', spark: [30,32,31,34,36,35,38,37,40,42], icon: 'layers' },
  ],

  // Red empresarial (mini graph)
  network: {
    nodes: [
      { id: 'grupo', x: 50, y: 50, r: 22, type: 'group' },
      { id: 'c1', x: 26, y: 26, r: 14, type: 'company' },
      { id: 'c2', x: 76, y: 30, r: 13, type: 'company' },
      { id: 'c3', x: 80, y: 68, r: 12, type: 'company' },
      { id: 'c4', x: 22, y: 70, r: 13, type: 'company' },
      { id: 'p1', x: 50, y: 16, r: 8,  type: 'person' },
      { id: 'p2', x: 50, y: 86, r: 8,  type: 'person' },
      { id: 'c5', x: 92, y: 48, r: 9,  type: 'company' },
      { id: 'c6', x: 10, y: 46, r: 9,  type: 'company' },
    ],
    edges: [
      ['grupo','c1'],['grupo','c2'],['grupo','c3'],['grupo','c4'],
      ['p1','c1'],['p1','grupo'],['p2','c4'],['c2','c5'],['c4','c6'],
    ],
  },

  // Footer data sources
  sources: ['INE', 'Registradores', 'Banco de España', 'CNMV', 'datacomex', 'ICAC'],
};
