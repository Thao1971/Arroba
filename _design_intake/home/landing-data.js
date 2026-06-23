// arroba.com — Landing (public, unregistered) data
window.LANDING = {
  // Hero — turned toward the user
  hero: {
    title: '¿Qué quieres hacer con tu compañía?',
    subtitle: 'Analiza mercados, valora empresas y descubre oportunidades para crecer, comprar, vender o atraer inversión desde una única plataforma.',
    placeholders: [
      '¿Cuánto vale mi empresa?',
      'Quiero vender mi compañía',
      'Quiero comprar una empresa',
      'Cómo está mi empresa frente a la competencia',
      'Empresas industriales en Valencia',
      'Oportunidades de consolidación en salud',
    ],
  },
  examples: ['¿Cuánto vale mi empresa?', 'Quiero comprar una empresa', 'Empresas industriales en Valencia', 'Oportunidades de consolidación en salud'],

  // Opportunity engine — the differentiator
  opportunities: [
    { title: 'Relevo generacional',   desc: 'Fundadores sin sucesión definida', icon: 'team' },
    { title: 'Consolidación regional', desc: 'Compañías agrupables en una plataforma', icon: 'layers' },
    { title: 'Captación de capital',   desc: 'Crecimiento limitado por financiación', icon: 'trending' },
    { title: 'Venta potencial',        desc: 'Señales de salida del accionariado', icon: 'deal' },
    { title: 'Crecimiento acelerado',  desc: 'Compañías superando a su sector', icon: 'chartBar' },
    { title: 'Actores relevantes',     desc: 'Quién puede materializar la operación', icon: 'agency' },
  ],

  // Agent-ready access
  agentReady: {
    title: 'Diseñada para personas, equipos y agentes de IA.',
    text: 'Arroba está preparada para ser utilizada por usuarios humanos, equipos profesionales y agentes de IA autorizados mediante web, API y MCP.',
    access: [
      { name: 'Web humana',     desc: 'La plataforma completa en tu navegador', icon: 'user' },
      { name: 'API estructurada', desc: 'Integra la inteligencia en tus sistemas', icon: 'document' },
      { name: 'MCP para agentes', desc: 'Acceso para agentes de IA autorizados', icon: 'agency' },
    ],
  },

  // The three movements of the decision platform
  movements: [
    {
      n: '01', id: 'analizar', label: 'Analizar', verb: 'Entender',
      desc: 'Cruza 5 capas de inteligencia sobre cualquier empresa, sector o territorio. Financieros, señales, ownership, contratación pública y comercio exterior — en una sola ficha.',
      points: ['Ficha 360° de cada compañía', 'Scores de oportunidad y riesgo', 'Señales detectadas por IA'],
      tone: 'dark',
    },
    {
      n: '02', id: 'valorar', label: 'Valorar', verb: 'Poner precio',
      desc: 'El análisis se convierte en un número. Valoración indicativa por múltiplos y comparables reales del sector, con cada palanca trazada a los datos que acabas de ver.',
      points: ['Rango de valor explicado', 'Múltiplos sectoriales reales', 'Drivers que mueven el precio'],
      tone: 'hinge',
    },
    {
      n: '03', id: 'transaccionar', label: 'Comprar o vender', verb: 'Actuar',
      desc: 'El precio te lleva a una contraparte. Compradores e inversores que encajan con la tesis, con su match score, y el primer paso de la operación sin salir de la plataforma.',
      points: ['Compradores por encaje', 'Teaser y NDA en un clic', 'Del análisis al deal'],
      tone: 'red',
    },
  ],

  // Data scale — proof of depth (animated counters), plain language
  scale: [
    { value: 5265,   label: 'Empresas',                    sub: 'Cuentas P&G, balances y órganos de gobierno' },
    { value: 4228,   label: 'Métricas económicas',          sub: 'Macro, sectoriales y territoriales' },
    { value: 39721,  label: 'Movimientos societarios',       sub: 'Constituciones, ceses y ampliaciones' },
    { value: 2090,   label: 'Inversores y fondos',           sub: 'Compradores con su tesis de inversión' },
    { value: 88,     label: 'Sectores analizados',           sub: 'Con scores de oportunidad y riesgo' },
    { value: 61706,  label: 'Empresas con contratos públicos', sub: 'Proveedoras del sector público' },
  ],

  // 5 intelligence layers, ordered by breadth (each with a specialised agent)
  layers: [
    { name: 'Economic Intelligence',  icon: 'chartLine', href: 'Analiza.html',                 desc: 'Casi 5.000 métricas económicas que dan contexto a cada cifra.' },
    { name: 'Market Intelligence',    icon: 'chartBar',  href: 'Ficha Sectorial.html',          desc: 'Sectores, mercados y tendencias en tiempo real.' },
    { name: 'Company Intelligence',   icon: 'agency',    href: 'Company Profile.html',          desc: 'Cuentas P&G, balances, órganos de gobierno y propiedad de cada empresa.' },
    { name: 'Investor Intelligence',  icon: 'team',      href: 'Investor Intelligence.html',    desc: 'Fondos, family offices y compradores corporativos.' },
    { name: 'M&A Intelligence',       icon: 'deal',      href: 'M&A Intelligence.html',         desc: 'Oportunidades, matching y operaciones del mercado.' },
  ],

  // The differentiator — helps you decide
  moat: {
    eyebrow: 'La diferencia',
    title: 'La única plataforma que ayuda a decidir',
    body: 'Arroba conecta empresas, sectores, mercados y operaciones para ayudarte a tomar mejores decisiones. No sustituye tu criterio: te proporciona contexto, señales y oportunidades para decidir con mayor confianza — cruzando cerca de 5.000 métricas económicas que sitúan cada compañía en su contexto real.',
    stats: [
      { v: '4.228',  l: 'Métricas económicas' },
      { v: '88',     l: 'Sectores cruzados' },
      { v: 'Única',  l: 'plataforma así en España' },
    ],
  },

  sources: [
    { name: 'INE',                 img: 'uploads/logo-ine.png' },
    { name: 'BOE · BORME',         img: 'uploads/logo-boe.png' },
    { name: 'Banco de España',     img: 'uploads/logo-bde.png' },
    { name: 'CNMV',                img: 'uploads/logo-cnmv.png' },
    { name: 'Registradores',       img: 'uploads/logo-registradores.png' },
    { name: 'Comercio Exterior',   img: 'uploads/logo-comercio.png' },
    { name: 'Contratación Pública', img: 'uploads/logo-contratacion.png' },
  ],
};
