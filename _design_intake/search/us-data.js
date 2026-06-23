// arroba.com — Universal Search data
window.US_DATA = {
  query: 'Agencias de marketing rentables en Levante con relevo generacional',

  suggestions: [
    'Clínicas dentales con EBITDA > 1M€',
    'Fondos activos en software B2B',
    'Empresas exportadoras de calzado en Alicante',
    'Indra',
  ],

  // What the system understood — interpretation chips
  understood: [
    { type: 'Sector',  label: 'Marketing y publicidad', icon: 'chartBar' },
    { type: 'Zona',    label: 'Comunidad Valenciana + Murcia', icon: 'agency' },
    { type: 'Filtro',  label: 'Margen EBITDA > 12%', icon: 'euro' },
    { type: 'Señal',   label: 'Relevo generacional', icon: 'trending' },
  ],

  // Strategic diagnosis — structured like an analyst's read
  diagnosis: {
    headline: 'He detectado 23 compañías compatibles y una oportunidad clara de consolidación regional en el Levante.',
    blocks: [
      { label: 'Qué está pasando', text: 'El segmento de marketing y publicidad en el Levante crece un 8,2% anual, por encima de la media nacional. Hay actividad compradora relevante: 4 inversores con tesis activa en el sector.' },
      { label: 'Por qué es relevante', text: '8 de las 23 compañías muestran relevo generacional —fundadores mayores de 58 años sin sucesión definida— y 5 superan el percentil 75 de margen del sector. Es una concentración inusual de oportunidad.' },
      { label: 'Qué significa para ti', text: 'Existe una ventana para consolidar o adquirir antes de que el mercado se tensione. Las 3 mejores oportunidades suman un valor estimado de 14,2M€ y son accionables en los próximos 24 meses.' },
    ],
    citations: ['Registro Mercantil', 'Órganos de gobierno', 'Métricas sectoriales'],
    confidence: 'Alta',
  },

  // Detected opportunities — now Strategic Theses (first-class entities, each opens a Canvas)
  opportunities: [
    { id: 'relevo', title: 'Relevo generacional', count: 3, desc: 'Fundadores sin sucesión definida, abiertos a conversaciones.', type: 'Relevo generacional', heat: 'Alta', icon: 'team', whyAppears: '3 fundadores mayores de 60 años sin sucesión identificada',
      canvas: {
        thesis: 'Tres fundadores mayores de 58 años sin sucesión definida controlan agencias rentables. El relevo generacional abre una ventana de adquisición a valoraciones razonables antes de un proceso competitivo.',
        valueAgg: '9,7M€', valuePotential: '12,1M€', valueCreated: '+2,4M€',
        companies: 3, buyers: 4, comparables: 5,
        risks: ['Dependencia del fundador en la transición', 'Posible fuga de talento clave', 'Concentración de clientes'],
        actors: {
          label: 'Empresas objetivo', sub: 'Compañías adquiribles dentro de esta tesis', kind: 'companies',
          items: [
            { name: 'Creativa Estratégica', loc: 'Madrid',   revenue: '3,2M€', ebitda: '0,58M€', dealScore: 91, valuation: '4,8M€', role: 'Plataforma' },
            { name: 'Mediterránea Ads',   loc: 'Murcia',   revenue: '1,9M€', ebitda: '0,29M€', dealScore: 77, valuation: '2,4M€', role: 'Add-on' },
            { name: 'Costa Digital',       loc: 'Alicante', revenue: '1,4M€', ebitda: '0,22M€', dealScore: 70, valuation: '1,8M€', role: 'Especialista' },
          ],
        },
      } },
    { id: 'consolidacion', title: 'Consolidación regional', count: 7, desc: 'Agencias complementarias agrupables en una plataforma única.', type: 'Buy & build', heat: 'Alta', icon: 'layers', recommended: true, whyAppears: '7 compañías complementarias con alta compatibilidad',
      canvas: {
        thesis: 'Siete agencias complementarias en el Levante pueden agruparse en una plataforma regional única. La fragmentación del mercado permite capturar sinergias de costes, cross-selling y poder de negociación.',
        valueAgg: '14,2M€', valuePotential: '18,8M€', valueCreated: '+4,6M€',
        companies: 7, buyers: 5, comparables: 8,
        risks: ['Complejidad de integración', 'Solapamiento de carteras de cliente', 'Coste de capital del roll-up'],
        actors: {
          label: 'Empresas objetivo', sub: 'Compañías que forman la plataforma de consolidación', kind: 'companies',
          items: [
            { name: 'Creativa Estratégica', loc: 'Madrid',   revenue: '3,2M€', ebitda: '0,58M€', dealScore: 91, valuation: '4,8M€', role: 'Plataforma' },
            { name: 'Stratex Media',       loc: 'Valencia', revenue: '2,1M€', ebitda: '0,45M€', dealScore: 84, valuation: '3,1M€', role: 'Add-on' },
            { name: 'GrowthBase ES',       loc: 'Alicante', revenue: '3,8M€', ebitda: '0,68M€', dealScore: 63, valuation: '5,2M€', role: 'Expansión geográfica' },
            { name: 'Mediterránea Ads',   loc: 'Murcia',   revenue: '1,9M€', ebitda: '0,29M€', dealScore: 77, valuation: '2,4M€', role: 'Complemento de servicios' },
          ],
        },
      } },
    { id: 'venta', title: 'Posible venta en 24 meses', count: 4, desc: 'Señales de intención de salida del accionariado.', type: 'Desinversión', heat: 'Media', icon: 'deal', whyAppears: 'Señales de intención de salida en el accionariado',
      canvas: {
        thesis: 'Cuatro compañías muestran señales de intención de salida del accionariado en los próximos 24 meses. Posicionarse temprano como comprador preferente reduce competencia en el proceso.',
        valueAgg: '11,4M€', valuePotential: '13,2M€', valueCreated: '+1,8M€',
        companies: 4, buyers: 3, comparables: 6,
        risks: ['Timing incierto de la operación', 'Expectativas de precio del vendedor'],
        actors: {
          label: 'Compradores potenciales', sub: 'Entidades que podrían adquirir estas compañías', kind: 'buyers',
          items: [
            { name: 'Grupo MediaCom',          type: 'Corporate',      fit: 91, deals: 7,  ticket: '3–8M€' },
            { name: 'Digital Growth Partners', type: 'Private Equity', fit: 84, deals: 14, ticket: '5–15M€' },
            { name: 'Integrated Media SL',     type: 'Corporate',      fit: 76, deals: 4,  ticket: '2–6M€' },
          ],
        },
      } },
    { id: 'capital', title: 'Captación de capital', count: 2, desc: 'Crecimiento limitado por falta de financiación.', type: 'Captación de capital', heat: 'Media', icon: 'trending', whyAppears: 'Crecimiento superior a los recursos disponibles',
      canvas: {
        thesis: 'Dos compañías con fuerte crecimiento están limitadas por falta de financiación. Una entrada de capital minoritario podría acelerar su expansión y generar retorno en 3-5 años.',
        valueAgg: '4,1M€', valuePotential: '6,8M€', valueCreated: '+2,7M€',
        companies: 2, buyers: 2, comparables: 4,
        risks: ['Dilución del fundador', 'Plan de crecimiento por validar'],
        actors: {
          label: 'Inversores compatibles', sub: 'Capital que podría financiar el crecimiento', kind: 'buyers',
          items: [
            { name: 'Digital Growth Partners', type: 'Growth Capital', fit: 88, deals: 14, ticket: '5–15M€' },
            { name: 'Levante Capital',         type: 'Venture Capital', fit: 74, deals: 9,  ticket: '1–5M€' },
          ],
        },
      } },
  ],

  // Multi-entity results — now with triple scoring
  companies: [
    { name: 'Creativa Estratégica', legal: 'Creativa Estratégica S.L.', loc: 'Madrid', sector: 'Madtech',
      revenue: '3,2M€', margin: '18,1%', valuation: '4,8M€', signal: 'Relevo generacional', verified: true,
      encaje: 91, oportunidad: 82, transaccionabilidad: 74, dealScore: 91 },
    { name: 'Stratex Media', legal: 'Stratex Media S.L.', loc: 'Valencia', sector: 'Marketing digital',
      revenue: '2,1M€', margin: '21,3%', valuation: '3,1M€', signal: 'Margen P75+', verified: true,
      encaje: 88, oportunidad: 75, transaccionabilidad: 81, dealScore: 84 },
    { name: 'GrowthBase ES', legal: 'GrowthBase España S.L.', loc: 'Alicante', sector: 'Performance',
      revenue: '3,8M€', margin: '17,8%', valuation: '5,2M€', signal: 'Crecimiento sostenido', verified: false,
      encaje: 79, oportunidad: 70, transaccionabilidad: 58, dealScore: 63 },
    { name: 'Mediterránea Ads', legal: 'Mediterránea Ads S.L.', loc: 'Murcia', sector: 'Publicidad',
      revenue: '1,9M€', margin: '15,4%', valuation: '2,4M€', signal: 'Relevo generacional', verified: true,
      encaje: 84, oportunidad: 67, transaccionabilidad: 77, dealScore: 77 },
  ],

  sectors: [
    { name: 'Marketing y publicidad', cnae: 'CNAE 73', companies: '1.284', growth: '+8,2%', trend: 'up' },
    { name: 'Servicios digitales',    cnae: 'CNAE 62', companies: '3.471', growth: '+12,4%', trend: 'up' },
  ],

  investors: [
    { name: 'Digital Growth Partners', type: 'Private Equity', thesis: 'Consolidación de agencias digitales', deals: 14, fit: 84 },
    { name: 'Grupo MediaCom',          type: 'Corporate',      thesis: 'Expansión en performance B2B',         deals: 7,  fit: 91 },
  ],

  // Strategic recommendation — an investment thesis, not a simple suggestion
  recommendation: {
    title: 'Construir una plataforma regional de agencias de marketing en Levante',
    confidence: 82,
    horizon: '24–36 meses',
    valueUpside: '+35% a +60%',
    motives: [
      'Mercado creciendo por encima de la media',
      'Fragmentación elevada',
      'Fundadores próximos a relevo generacional',
      'Compradores activos en el sector',
      'Sinergias potenciales relevantes',
    ],
    economics: {
      current: '14,2M€',
      potential: '18,8M€',
      created: '+4,6M€',
    },
    sources: ['Registro Mercantil', 'BORME', 'Banco de España', 'Contratación Pública'],
    whyNow: [
      '8 compañías muestran señales de relevo generacional',
      '4 compradores han realizado adquisiciones recientes',
      'El sector crece por encima de la media nacional',
    ],
  },

  // Recommended strategic thesis — the narrative
  thesis: {
    title: 'Consolidación de agencias de marketing en Levante',
    body: 'Existe una oportunidad atractiva para consolidar agencias de marketing en el Levante. La fragmentación sigue siendo elevada, varios fundadores están próximos a una transición generacional y existen compradores activos buscando plataformas regionales. Las mejores oportunidades deberían explorarse durante los próximos 24 meses.',
    window: 'Ventana de actuación: 24 meses',
  },

  // Next best action — Arroba recommends, not just permits
  nextBestAction: {
    action: 'Activar la oportunidad de consolidación regional',
    confidence: 'Alta',
    impact: 'Alto',
  },

  // Detected buyers — making the marketplace contextual, not invisible
  buyersDetected: {
    summary: [
      { type: 'Corporates',   count: 2 },
      { type: 'Fondos',       count: 2 },
      { type: 'Search Fund',  count: 1 },
    ],
    list: [
      { name: 'Grupo MediaCom',          type: 'Corporate',       fit: 91, deals: 7,  ticket: '3–8M€',  last: 'hace 8 meses',  icon: 'agency', whyFit: ['Tamaño compatible', 'Tesis activa en el sector', 'Geografía compatible', 'Operaciones recientes similares'] },
      { name: 'Digital Growth Partners', type: 'Private Equity',  fit: 84, deals: 14, ticket: '5–15M€', last: 'hace 3 meses',  icon: 'team',   whyFit: ['Tesis de consolidación activa', 'Ticket compatible', '14 operaciones previas en el sector'] },
      { name: 'Integrated Media SL',     type: 'Corporate',       fit: 76, deals: 4,  ticket: '2–6M€',  last: 'hace 14 meses', icon: 'agency', whyFit: ['Expansión geográfica en Levante', 'Tamaño compatible'] },
      { name: 'Levante Capital',         type: 'Private Equity',  fit: 72, deals: 9,  ticket: '4–10M€', last: 'hace 6 meses',  icon: 'team',   whyFit: ['Foco regional Levante', 'Tesis sectorial compatible'] },
      { name: 'Marcos Herrán',           type: 'Search Fund',     fit: 68, deals: 1,  ticket: '1–3M€',  last: 'primera op.',   icon: 'user',   whyFit: ['Busca primera adquisición', 'Geografía compatible'] },
    ],
  },

  // entity group counts for the tabs — Oportunidades is now a first-class entity
  groups: [
    { id: 'all',           label: 'Todo',          count: 31 },
    { id: 'opportunities', label: 'Oportunidades', count: 4 },
    { id: 'companies',     label: 'Empresas',      count: 23 },
    { id: 'sectors',       label: 'Sectores',      count: 4 },
    { id: 'investors',     label: 'Inversores',    count: 4 },
  ],

  // Conversation refinement chips
  refine: [
    'Muéstrame solo Madrid',
    'Solo EBITDA superior a 500.000 €',
    'Ahora busca compradores',
    'Genera una shortlist',
  ],
};
