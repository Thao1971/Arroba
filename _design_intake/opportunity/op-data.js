// arroba.com — Oportunidad data
window.OP_DATA = {
  // Nature config — what each opportunity TYPE implies (action, document, advisor focus)
  // Keyed by meta.type. Keeps the entity a "decisión empresarial", not an M&A deal.
  natureConfig: {
    'Buy & Build':           { primary: 'Validar la tesis', doc: 'Generar informe',      docIcon: 'document', actorsLabel: 'Empresas objetivo',   nextAction: 'Crea la shortlist de empresas prioritarias' },
    'Adquisición':           { primary: 'Crear shortlist',  doc: 'Generar informe',      docIcon: 'document', actorsLabel: 'Empresas objetivo',   nextAction: 'Selecciona las compañías a aproximar' },
    'Venta de compañía':     { primary: 'Preparar dossier', doc: 'Generar dossier',      docIcon: 'document', actorsLabel: 'Compradores',         nextAction: 'Prepara el dossier de venta' },
    'Captación de capital':  { primary: 'Preparar presentación', doc: 'Generar presentación', docIcon: 'document', actorsLabel: 'Inversores',     nextAction: 'Prepara la presentación para inversores' },
    'Internacionalización':  { primary: 'Diseñar plan',     doc: 'Generar informe',      docIcon: 'document', actorsLabel: 'Mercados y socios',   nextAction: 'Diseña el plan de entrada al mercado' },
    'Partnership':           { primary: 'Buscar socios',    doc: 'Generar informe',      docIcon: 'document', actorsLabel: 'Socios potenciales',  nextAction: 'Identifica los socios estratégicos' },
    'Crecimiento':           { primary: 'Diseñar plan',     doc: 'Generar informe',      docIcon: 'document', actorsLabel: 'Palancas de crecimiento', nextAction: 'Prioriza las palancas de crecimiento' },
  },

  // The opportunity itself
  meta: {
    id: 'OP-2026-0413',
    title: 'Consolidación regional de agencias de marketing en Levante',
    type: 'Buy & Build',
    status: 'Activa',
    created: '02/06/2026',
    confidence: 82,
    horizon: '24–36 meses',
    valueUpside: '+35% a +60%',
  },

  thesis: 'Siete agencias complementarias en el Levante pueden agruparse en una plataforma regional única. La fragmentación del mercado permite capturar sinergias de costes, cross-selling y poder de negociación. Varios fundadores están próximos a una transición generacional y existen compradores activos buscando plataformas regionales.',

  economics: {
    current: '14,2M€',
    potential: '18,8M€',
    created: '+4,6M€',
  },

  whyNow: [
    '8 compañías muestran señales de relevo generacional',
    '4 compradores han realizado adquisiciones recientes',
    'El sector crece un +8,2% anual, por encima de la media',
  ],

  sources: ['Registro Mercantil', 'BORME', 'Banco de España', 'Contratación Pública'],

  // Section counts (for nav badges)
  counts: { empresas: 7, compradores: 5, inversores: 4, senales: 12, plan: 6 },

  // Empresas relacionadas (target companies)
  empresas: [
    { name: 'Creativa Estratégica', loc: 'Madrid',   revenue: '3,2M€', ebitda: '0,58M€', margin: '18,1%', emp: 23, dealScore: 91, valuation: '4,8M€', role: 'Plataforma', signal: 'Relevo generacional' },
    { name: 'Stratex Media',        loc: 'Valencia',  revenue: '2,1M€', ebitda: '0,45M€', margin: '21,3%', emp: 15, dealScore: 84, valuation: '3,1M€', role: 'Add-on', signal: 'Margen P75+' },
    { name: 'GrowthBase ES',        loc: 'Alicante',  revenue: '3,8M€', ebitda: '0,68M€', margin: '17,8%', emp: 27, dealScore: 63, valuation: '5,2M€', role: 'Expansión geográfica', signal: 'Crecimiento sostenido' },
    { name: 'Mediterránea Ads',     loc: 'Murcia',    revenue: '1,9M€', ebitda: '0,29M€', margin: '15,4%', emp: 14, dealScore: 77, valuation: '2,4M€', role: 'Complemento de servicios', signal: 'Relevo generacional' },
    { name: 'Costa Digital',        loc: 'Alicante',  revenue: '1,4M€', ebitda: '0,22M€', margin: '15,7%', emp: 11, dealScore: 70, valuation: '1,8M€', role: 'Especialista', signal: 'Nicho rentable' },
    { name: 'Levantina Comunicación', loc: 'Castellón', revenue: '1,1M€', ebitda: '0,18M€', margin: '16,4%', emp: 9, dealScore: 66, valuation: '1,4M€', role: 'Add-on', signal: 'Cartera estable' },
    { name: 'Brand&Co Valencia',    loc: 'Valencia',  revenue: '0,9M€', ebitda: '0,14M€', margin: '15,6%', emp: 8, dealScore: 61, valuation: '1,1M€', role: 'Especialista', signal: 'Talento creativo' },
  ],

  // Compradores potenciales
  compradores: [
    { name: 'Grupo MediaCom',          type: 'Corporate',      fit: 91, deals: 7,  ticket: '3–8M€',  last: 'hace 8 meses',  reason: 'Sinergias directas en performance B2B' },
    { name: 'Integrated Media SL',     type: 'Corporate',      fit: 76, deals: 4,  ticket: '2–6M€',  last: 'hace 14 meses', reason: 'Expansión geográfica en Levante' },
    { name: 'Digital Growth Partners', type: 'Private Equity', fit: 84, deals: 14, ticket: '5–15M€', last: 'hace 3 meses',  reason: 'Tesis de consolidación digital activa' },
    { name: 'Levante Capital',         type: 'Private Equity', fit: 72, deals: 9,  ticket: '4–10M€', last: 'hace 6 meses',  reason: 'Foco regional Levante' },
    { name: 'Marcos Herrán',           type: 'Search Fund',    fit: 68, deals: 1,  ticket: '1–3M€',  last: 'primera op.',   reason: 'Busca primera adquisición plataforma' },
  ],

  // Inversores potenciales
  inversores: [
    { name: 'Digital Growth Partners', type: 'Growth Capital',  fit: 88, aum: '420M€', focus: 'Consolidación digital B2B', last: 'hace 3 meses' },
    { name: 'Levante Capital',         type: 'Venture Capital',  fit: 74, aum: '180M€', focus: 'Scale-ups regionales',     last: 'hace 6 meses' },
    { name: 'Mediterráneo FO',         type: 'Family Office',    fit: 71, aum: '95M€',  focus: 'Buy & build sectorial',    last: 'hace 11 meses' },
    { name: 'Iberia Growth Fund',      type: 'Growth Capital',  fit: 65, aum: '310M€', focus: 'Servicios profesionales',   last: 'hace 4 meses' },
  ],

  // Señales relevantes (events)
  senales: [
    { type: 'positive', date: '28/05/2026', family: 'Societario',   label: 'Nuevo administrador en Creativa Estratégica', detail: 'Incorporación de dirección ejecutiva — señal de profesionalización previa a operación.' },
    { type: 'positive', date: '15/05/2026', family: 'Contratación', label: 'Stratex Media gana concurso público 0,8M€',    detail: 'Diversificación de cartera hacia sector público — mejora la calidad de ingresos.' },
    { type: 'warning',  date: '04/05/2026', family: 'Ownership',    label: 'Fundador de GrowthBase supera los 60 años',    detail: 'Sin sucesión identificada — ventana de relevo generacional abierta.' },
    { type: 'positive', date: '22/04/2026', family: 'Financiero',   label: 'Mediterránea Ads cierra 2025 con +24% revenue', detail: 'Crecimiento sostenido por encima de la mediana sectorial.' },
    { type: 'neutral',  date: '10/04/2026', family: 'Mercado',      label: 'Grupo MediaCom adquiere agencia en Sevilla',   detail: 'Comprador activo confirma tesis de consolidación regional.' },
    { type: 'positive', date: '01/04/2026', family: 'Sector',       label: 'Marketing y publicidad crece +8,2% en Q1',     detail: 'El sector mantiene crecimiento por encima de la media nacional.' },
  ],

  // Plan de acción (recommended steps)
  plan: [
    { step: 1, title: 'Validar la tesis', desc: 'Revisa las 7 empresas objetivo y confirma el encaje estratégico de cada una.', status: 'done', owner: 'Arroba ✦' },
    { step: 2, title: 'Crear shortlist', desc: 'Selecciona las 3-4 compañías prioritarias para iniciar aproximación.', status: 'current', owner: 'Tú' },
    { step: 3, title: 'Valorar la plataforma', desc: 'Genera la valoración agregada con sinergias de la plataforma consolidada.', status: 'pending', owner: 'Arroba ✦' },
    { step: 4, title: 'Aproximar compañías objetivo', desc: 'Contacto confidencial con los fundadores vía teaser ciego.', status: 'pending', owner: 'Tú' },
    { step: 5, title: 'Estructurar financiación', desc: 'Conecta con inversores compatibles para el capital del roll-up.', status: 'pending', owner: 'Arroba ✦' },
    { step: 6, title: 'Preparar documentación', desc: 'Genera teaser, cuaderno de venta y documentación segura.', status: 'pending', owner: 'Arroba ✦' },
  ],

  // Actividad feed
  actividad: [
    { actor: 'Arroba ✦', action: 'creó esta oportunidad a partir de la tesis detectada', time: 'hace 2 min', kind: 'create' },
    { actor: 'Arroba ✦', action: 'identificó 7 empresas relacionadas', time: 'hace 2 min', kind: 'auto' },
    { actor: 'Arroba ✦', action: 'detectó 5 compradores y 4 inversores compatibles', time: 'hace 2 min', kind: 'auto' },
    { actor: 'Arroba ✦', action: 'generó el plan de acción recomendado', time: 'hace 2 min', kind: 'auto' },
    { actor: 'Arroba ✦', action: 'marcó "Validar la tesis" como completado', time: 'hace 1 min', kind: 'check' },
  ],

  // Activation sequence steps
  activation: [
    { label: 'Guardando la tesis detectada', detail: 'Consolidación regional · Levante' },
    { label: 'Identificando empresas relacionadas', detail: '7 compañías objetivo' },
    { label: 'Buscando compradores potenciales', detail: '5 compradores compatibles' },
    { label: 'Buscando inversores compatibles', detail: '4 inversores con tesis activa' },
    { label: 'Rastreando señales relevantes', detail: '12 eventos en los últimos 90 días' },
    { label: 'Generando plan de acción', detail: '6 pasos recomendados' },
  ],
};
