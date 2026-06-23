// arroba.com — Mapa empresarial (Inteligencia Territorial) data
window.MAPA_DATA = {
  national: {
    activas:   '3,31 M',  activasDelta: '+3,2%',
    nuevas:    '+14.307',  nuevasDelta: '+8,6%',
    saldoNeto: '+11.965',  saldoDelta: '+6,1%',
    provincias: 52,
    ccaa: 19,
  },

  aiSummary: 'España mantiene una evolución empresarial positiva. Madrid, Cataluña y Comunidad Valenciana concentran actualmente las mayores oportunidades de mercado. Tecnología y Actividades Profesionales lideran el crecimiento nacional.',

  // Province ranking (Índice de Oportunidad de Mercado)
  provinces: [
    { rank: 1,  name: 'Madrid',    score: 93, activas: '536.000', nuevas: '+14.200', cerradas: '2.100', region: 'Madrid' },
    { rank: 2,  name: 'Barcelona', score: 90, activas: '498.000', nuevas: '+12.800', cerradas: '2.400', region: 'Cataluña' },
    { rank: 3,  name: 'Valencia',  score: 87, activas: '256.000', nuevas: '+7.100',  cerradas: '1.200', region: 'C. Valenciana' },
    { rank: 4,  name: 'Málaga',    score: 85, activas: '178.000', nuevas: '+6.400',  cerradas: '980',   region: 'Andalucía' },
    { rank: 5,  name: 'Sevilla',   score: 83, activas: '164.000', nuevas: '+4.900',  cerradas: '1.050', region: 'Andalucía' },
    { rank: 6,  name: 'Alicante',  score: 81, activas: '152.000', nuevas: '+4.600',  cerradas: '910',   region: 'C. Valenciana' },
    { rank: 7,  name: 'Zaragoza',  score: 79, activas: '98.000',  nuevas: '+2.800',  cerradas: '640',   region: 'Aragón' },
    { rank: 8,  name: 'Bilbao',    score: 78, activas: '112.000', nuevas: '+3.100',  cerradas: '720',   region: 'País Vasco' },
    { rank: 9,  name: 'Murcia',    score: 76, activas: '104.000', nuevas: '+3.300',  cerradas: '810',   region: 'Murcia' },
    { rank: 10, name: 'Palma',     score: 75, activas: '89.000',  nuevas: '+2.900',  cerradas: '690',   region: 'Baleares' },
  ],

  ccaa: [
    { rank: 1, name: 'Madrid',          score: 93 },
    { rank: 2, name: 'Cataluña',        score: 89 },
    { rank: 3, name: 'C. Valenciana',   score: 84 },
    { rank: 4, name: 'Andalucía',       score: 81 },
    { rank: 5, name: 'País Vasco',      score: 78 },
    { rank: 6, name: 'Aragón',          score: 74 },
    { rank: 7, name: 'Galicia',         score: 70 },
    { rank: 8, name: 'Baleares',        score: 73 },
    { rank: 9, name: 'Murcia',          score: 72 },
    { rank: 10,name: 'Castilla y León', score: 68 },
  ],

  sectorsRank: [
    { rank: 1, name: 'Información y Comunicaciones', score: 91 },
    { rank: 2, name: 'Actividades Profesionales',   score: 87 },
    { rank: 3, name: 'Sanidad y Servicios Sociales', score: 83 },
    { rank: 4, name: 'Energía',                      score: 80 },
    { rank: 5, name: 'Construcción',                 score: 76 },
    { rank: 6, name: 'Comercio',                     score: 72 },
    { rank: 7, name: 'Hostelería',                   score: 68 },
    { rank: 8, name: 'Industria',                    score: 71 },
    { rank: 9, name: 'Logística',                    score: 74 },
    { rank: 10,name: 'Agroalimentario',              score: 66 },
  ],

  // Territory ficha (Madrid as default)
  territory: {
    name: 'Madrid',
    activas: '536.000', nuevas: '+14.200', cerradas: '2.100',
    score: 93,
    dims: [
      { label: 'Tamaño empresarial', value: 95 },
      { label: 'Crecimiento',        value: 89 },
      { label: 'Actividad económica', value: 96 },
    ],
    leadSector: 'Información y Comunicaciones',
  },

  // Evolution chart (12 months, thousands)
  evolution: {
    months: ['Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May'],
    nuevas:   [18,16,14,20,17,22,19,24,21,26,23,27],
    cerradas: [9,8,10,9,11,10,12,11,13,11,12,13],
    saldo:    [9,8,4,11,6,12,7,13,8,15,11,14],
  },

  // Sectors that drive Madrid
  driveSectors: [
    { rank: 1, name: 'Información y Comunicaciones', delta: '+14%' },
    { rank: 2, name: 'Actividades Profesionales',   delta: '+11%' },
    { rank: 3, name: 'Construcción',                 delta: '+8%'  },
    { rank: 4, name: 'Comercio al por mayor y menor', delta: '+6%' },
    { rank: 5, name: 'Sanidad y Servicios Sociales', delta: '+6%' },
  ],

  // Emerging sectors in Spain
  emergingSectors: [
    { name: 'IA y Machine Learning', delta: '+32%', icon: 'cpu' },
    { name: 'Ciberseguridad',        delta: '+28%', icon: 'shield' },
    { name: 'Salud Digital',         delta: '+24%', icon: 'health' },
    { name: 'Cloud Computing',       delta: '+22%', icon: 'cloud' },
    { name: 'Fintech',               delta: '+19%', icon: 'euro' },
  ],

  // Sector × Territory opportunity
  sectorTerritory: {
    territory: 'Madrid', sector: 'Tecnología',
    index: 96, concentration: '4,9x',
    borme: '134', contratacion: '€98M', contratacionTrend: 'Creciente',
    tendencia: 'Expansión',
  },

  // Territorial comparator
  comparator: [
    { name: 'Madrid',    score: 93, growth: '+12,4%', activity: 96, lead: 'Tecnología',                emerging: 'IA y Machine Learning', spark: [30,32,34,33,38,40,42,45,44,48] },
    { name: 'Cataluña',  score: 90, growth: '+9,8%',  activity: 94, lead: 'Información y Comunicaciones', emerging: 'Ciberseguridad',        spark: [28,30,29,33,35,34,38,40,42,44] },
    { name: 'Andalucía', score: 88, growth: '+8,6%',  activity: 90, lead: 'Construcción',               emerging: 'Salud Digital',         spark: [26,28,30,29,32,34,36,38,40,42] },
  ],

  sources: [
    { name: 'INE',                 status: 'real' },
    { name: 'BORME',               status: 'real' },
    { name: 'Banco de España',     status: 'real' },
    { name: 'Contratación Pública', status: 'real' },
    { name: 'Iberinform',          status: 'pronto' },
  ],
};
