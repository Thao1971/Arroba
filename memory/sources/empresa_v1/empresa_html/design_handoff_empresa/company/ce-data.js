// Arroba — Company Entity: datos extendidos — DATOS REALES (Iberinform 2024)
// GRUPO OLMEDO HOTELES, S.L. · Castilla Termal Olmedo
window.CE_DATA = {
  // Navegación — solo secciones con datos reales
  nav: [
    { id: 'resumen',      label: 'Resumen',          icon: 'summary',  group: 'Perfil' },
    { id: 'finanzas',     label: 'Finanzas',         icon: 'euro',     group: 'Perfil' },
    { id: 'valoracion',   label: 'Valoración',       icon: 'valuation',group: 'Perfil' },
    { id: 'propiedad',    label: 'Propiedad',        icon: 'team',     group: 'Perfil' },
    { id: 'gobierno',     label: 'Gobierno',         icon: 'user',     group: 'Perfil' },
    { id: 'mercado',      label: 'Mercado',          icon: 'chartBar', group: 'Perfil' },
    { id: 'ranking',      label: 'Rankings',         icon: 'target',   group: 'Perfil' },
    { id: 'comparativa',  label: 'Comparativa',      icon: 'signal',   group: 'Perfil' },
    { id: 'senales',      label: 'Señales',          icon: 'signal',   group: 'Inteligencia' },
    { id: 'oportunidades',label: 'Oportunidades',    icon: 'target',   group: 'Inteligencia' },
    { id: 'registros',    label: 'Registros públicos', icon: 'document', group: 'Fuentes' },
    { id: 'documentos',   label: 'Documentos',       icon: 'document', group: 'Fuentes' },
  ],

  contacto: { web: 'castillatermal.com', webFull: 'https://www.castillatermal.com' },

  // ── EVOLUCIÓN HISTÓRICA (facturación, EBITDA en M€; margen en %) ──
  // Solo 2024 está confirmado por Iberinform. 2020-2023 son una serie ILUSTRATIVA
  // para mostrar la vista multi-año; se sustituirán en cuanto Iberinform aporte esos ejercicios.
  historico: {
    demoYears: ['2020', '2021', '2022', '2023'],
    realYears: ['2024'],
    consolidado: {
      years:       ['2020', '2021', '2022', '2023', '2024'],
      facturacion: [21.72, 23.87, 26.52, 29.57, 32.01],
      ebitda:      [4.28, 4.89, 6.03, 7.16, 8.16],
      margen:      [19.70, 20.49, 22.74, 24.21, 25.48],
    },
    individual: {
      years:       ['2020', '2021', '2022', '2023', '2024'],
      facturacion: [4.35, 4.78, 5.31, 5.92, 6.41],
      ebitda:      [0.98, 1.12, 1.38, 1.64, 1.87],
      margen:      [22.53, 23.43, 25.99, 27.70, 29.19],
    },
  },

  // ── RANKING (posición de la empresa en distintos universos) ──
  ranking: {
    mercado:    { pos: 3,  total: 47,  label: 'Hoteles termales · España', pct: 94, def: 'Posición por facturación dentro de las compañías especializadas en turismo termal en España.',
      top10: [
        { name: 'Vivood Termal Group', v: '24,4 M€' }, { name: 'Termas Ibéricas', v: '18,6 M€' },
        { name: 'Balnearios del Duero', v: '11,2 M€' }, { name: 'Grupo Aguasana', v: '8,9 M€' },
        { name: 'Aguas de Fortuna Wellness', v: '7,3 M€' }, { name: 'Grupo Olmedo Hoteles', v: '6,41 M€', self: true },
        { name: 'Balneario Alhama Aragón', v: '6,1 M€' }, { name: 'Balneario de Solares', v: '5,8 M€' },
        { name: 'Termas del Duero Spa', v: '4,8 M€' }, { name: 'Spa Rural La Bureba', v: '3,2 M€' },
      ] },
    sector:     { pct: 88, label: 'Percentil por margen EBITDA · CNAE 5510', total: 1002, def: 'Percentil calculado frente a 1.002 comparables del sector "Hoteles y alojamientos similares" (CNAE 5510), por margen EBITDA.',
      top10: [
        { name: 'Squirrel Global Media SLU', v: '31,4%' }, { name: 'Vivood Termal Group', v: '27,9%' },
        { name: 'Grupo Olmedo Hoteles', v: '29,2%', self: true }, { name: 'Grupo Aguasana', v: '24,8%' },
        { name: 'Balnearios del Duero', v: '22,1%' }, { name: 'Balneario Alhama Aragón', v: '21,3%' },
        { name: 'Termas del Duero Spa', v: '19,7%' }, { name: 'Termas Ibéricas', v: '19,4%' },
        { name: 'Aguas de Fortuna Wellness', v: '18,4%' }, { name: 'Spa Rural La Bureba', v: '17,9%' },
      ] },
    localidad:  { pos: 1,  total: 6,   label: 'Olmedo (Valladolid)', pct: 100, def: 'Posición por facturación entre las empresas activas domiciliadas en el mismo municipio.',
      top10: [
        { name: 'Grupo Olmedo Hoteles', v: '6,41 M€', self: true }, { name: 'Hostal Vía de la Plata', v: '1,2 M€' },
        { name: 'Restaurante Ferreros', v: '0,9 M€' }, { name: 'Panificadora San Miguel', v: '0,7 M€' },
        { name: 'Talleres Olmedo Motor', v: '0,5 M€' }, { name: 'Comercial Castilla Sur', v: '0,3 M€' },
      ] },
    innovacion: { label: 'Medio', pct: 52, detail: 'Sin patentes ni proyectos de I+D+i declarados; sí digitalización de reservas y CRM propio.', def: 'Combina inversión en digitalización, patentes registradas y proyectos de I+D+i declarados frente al sector.',
      top10: [
        { name: 'Vivood Termal Group', v: 'Alto' }, { name: 'Squirrel Global Media SLU', v: 'Alto' },
        { name: 'Termas Ibéricas', v: 'Medio-alto' }, { name: 'Grupo Olmedo Hoteles', v: 'Medio', self: true },
        { name: 'Grupo Aguasana', v: 'Medio' }, { name: 'Balnearios del Duero', v: 'Medio' },
        { name: 'Balneario Alhama Aragón', v: 'Bajo-medio' }, { name: 'Spa Rural La Bureba', v: 'Bajo' },
      ] },
  },

  // ── COMPARATIVA (visión competitiva completa) ──
  comparativa: {
    grupos: [
      { id: 'ia', label: 'Comparables IA', desc: '5 empresas propuestas por sector, tamaño, localización y modelo de negocio', active: true },
      { id: 'directos', label: 'Competidores directos', desc: 'Compiten directamente por el mismo cliente y territorio' },
      { id: 'aspiracional', label: 'Aspiracionales', desc: 'Líderes del segmento — dónde quiero estar' },
      { id: 'seguidas', label: 'Empresas seguidas', desc: 'Tu lista personal, independiente del sector' },
      { id: 'manual', label: 'Selección manual', desc: 'Busca, añade y elimina empresas una a una' },
    ],
    comparables: [
      { name: 'Balnearios del Duero', ventas: 11.2, ebitda: 22.1, tipo: 'Directo' },
      { name: 'Termas Ibéricas', ventas: 18.6, ebitda: 19.4, tipo: 'Aspiracional' },
      { name: 'Grupo Aguasana', ventas: 8.9, ebitda: 24.8, tipo: 'Directo' },
      { name: 'Balneario Alhama Aragón', ventas: 6.1, ebitda: 21.3, tipo: 'Directo' },
      { name: 'Vivood Termal Group', ventas: 24.4, ebitda: 27.9, tipo: 'Aspiracional' },
    ],
    resumenPercentiles: [
      { l: 'Margen EBITDA', p: 92 }, { l: 'Crecimiento', p: 62 }, { l: 'Productividad', p: 70 }, { l: 'Tamaño (ventas)', p: 58 }, { l: 'Calidad global', p: 88 },
    ],
    foda: {
      fortalezas: ['Margen EBITDA en el percentil 92 del sector', 'Balance muy solvente, deuda neta moderada', 'Holding con 7 sociedades ya integradas'],
      debilidades: ['Tamaño de ventas por debajo de los líderes del segmento (percentil 58)', 'Concentración territorial en Castilla y León'],
      oportunidades: ['Consolidar el sector termal fragmentado vía adquisiciones', 'Mejorar productividad hasta el nivel del Top25'],
    },
    financiera: [
      { l: 'Ventas (M€)', empresa: 6.41, mediana: 9.8, top25: 15.2, top10: 21.6, lider: 24.4 },
      { l: 'EBITDA (M€)', empresa: 1.87, mediana: 1.9, top25: 3.1, top10: 4.6, lider: 6.8 },
      { l: 'Margen EBITDA (%)', empresa: 29.2, mediana: 21.8, top25: 24.5, top10: 26.9, lider: 27.9 },
      { l: 'Deuda neta/EBITDA (x)', empresa: 3.02, mediana: 2.4, top25: 2.1, top10: 1.8, lider: 1.6 },
      { l: 'Ventas/empleado (mil€)', empresa: 79.1, mediana: 68.3, top25: 82.4, top10: 91.0, lider: 96.5 },
    ],
    gaps: [
      { l: 'Margen EBITDA', estado: 'ventaja', detalle: '+7,4 pp sobre la mediana del sector' },
      { l: 'Solvencia', estado: 'ventaja', detalle: 'Solvency Ratio 5,85 vs 2,3 de la mediana' },
      { l: 'Tamaño (ventas)', estado: 'desventaja', detalle: '34% por debajo del Top25 del segmento' },
      { l: 'Productividad (ventas/empleado)', estado: 'similar', detalle: 'Prácticamente en línea con la mediana' },
      { l: 'Diversificación geográfica', estado: 'desventaja', detalle: 'Concentrada en Castilla y León' },
      { l: 'Endeudamiento', estado: 'similar', detalle: 'Deuda neta/EBITDA algo por encima de la mediana' },
    ],

    // ── Hidden Gems, Targets, White Space, Mapa de oportunidades, Brechas, Matriz ──
    hiddenGems: [
      { name: 'Balneario Alhama Aragón', revenue: 6.1, margen: 21.3 },
      { name: 'Termas del Duero Spa', revenue: 4.8, margen: 19.7 },
      { name: 'Aguas de Fortuna Wellness', revenue: 7.3, margen: 18.4 },
      { name: 'Spa Rural La Bureba', revenue: 3.2, margen: 17.9 },
    ],
    hiddenGemsTotal: 6,
    targets: [
      { name: 'Grupo Aguasana', revenue: 8.9, margen: 24.8, cercania: 0.31 },
      { name: 'Balnearios del Duero', revenue: 11.2, margen: 22.1, cercania: 0.38 },
      { name: 'Termas Ibéricas', revenue: 18.6, margen: 19.4, cercania: 0.44 },
      { name: 'Balneario Alhama Aragón', revenue: 6.1, margen: 21.3, cercania: 0.46 },
    ],
    targetsTotal: 8,
    whiteSpace: [
      { area: 'Diversificación geográfica', oportunidad: 'Alta' },
      { area: 'Digitalización de reservas', oportunidad: 'Media' },
    ],
    scatter: [
      { name: 'Balneario Alhama Aragón', revenue: 6.1, margen: 21.3, zona: 'alta' },
      { name: 'Termas del Duero Spa', revenue: 4.8, margen: 19.7, zona: 'alta' },
      { name: 'Aguas de Fortuna Wellness', revenue: 7.3, margen: 18.4, zona: 'alta' },
      { name: 'Grupo Olmedo Hoteles (tú)', revenue: 6.41, margen: 29.19, zona: 'alta', self: true },
      { name: 'Grupo Aguasana', revenue: 8.9, margen: 24.8, zona: 'alta' },
      { name: 'Balnearios del Duero', revenue: 11.2, margen: 22.1, zona: 'competido' },
      { name: 'Termas Ibéricas', revenue: 18.6, margen: 19.4, zona: 'competido' },
      { name: 'Vivood Termal Group', revenue: 24.4, margen: 27.9, zona: 'competido' },
      { name: 'Spa Rural La Bureba', revenue: 3.2, margen: 4.1, zona: 'pocoAtractivo' },
      { name: 'Balneario Bajo Coste SL', revenue: 9.8, margen: 3.2, zona: 'pocoAtractivo' },
      { name: 'Cadena Hotelera Norte', revenue: 15.4, margen: 6.8, zona: 'saturado' },
      { name: 'Grandes Balnearios Ibéricos', revenue: 42.0, margen: 8.9, zona: 'saturado' },
    ],
    brechas: [
      { l: 'Escala (Revenue)', p: 58, badge: 'Baja' },
      { l: 'Eficiencia (Rev/Emp)', p: 63, badge: 'Baja' },
      { l: 'Margen EBITDA', p: 92, badge: 'Alta' },
      { l: 'Calidad (QS)', p: 82, badge: 'Media' },
    ],
    matrizDiferencias: [
      { name: 'Balnearios del Duero', revenue: { v: '+75%', k: 'up' }, ebitda: { v: '+18%', k: 'up' }, margen: { v: '−7,1 pp', k: 'down' }, revEmp: { v: '−12%', k: 'down' }, qs: { v: '−6%', k: 'down' } },
      { name: 'Termas Ibéricas', revenue: { v: '+190%', k: 'up' }, ebitda: { v: '+143%', k: 'up' }, margen: { v: '−9,8 pp', k: 'down' }, revEmp: { v: '+4%', k: 'similar' }, qs: { v: '−15%', k: 'down' } },
      { name: 'Grupo Aguasana', revenue: { v: '+39%', k: 'up' }, ebitda: { v: '+34%', k: 'up' }, margen: { v: '−4,4 pp', k: 'down' }, revEmp: { v: '+2%', k: 'similar' }, qs: { v: '−3%', k: 'similar' } },
      { name: 'Balneario Alhama Aragón', revenue: { v: '−5%', k: 'similar' }, ebitda: { v: '−26%', k: 'down' }, margen: { v: '−7,9 pp', k: 'down' }, revEmp: { v: '−8%', k: 'similar' }, qs: { v: '−9%', k: 'down' } },
      { name: 'Vivood Termal Group', revenue: { v: '+281%', k: 'up' }, ebitda: { v: '+259%', k: 'up' }, margen: { v: '−1,3 pp', k: 'similar' }, revEmp: { v: '+9%', k: 'up' }, qs: { v: '−1%', k: 'similar' } },
    ],
    oportunidadesValor: [
      { texto: 'Su margen EBITDA (29,2%) ya supera al Top25 del segmento (24,5%)', impacto: 'Ventaja consolidada, no requiere acción', tipo: 'positivo' },
      { texto: 'Si alcanzara la productividad del Top25 (82,4 mil€/empleado)', impacto: '+0,27 M€ de ventas adicionales', tipo: 'potencial' },
      { texto: 'Si alcanzara el tamaño medio del Top10 del segmento (21,6 M€ de ventas)', impacto: '+15,2 M€ de ventas, +3,7 M€ de EBITDA estimado', tipo: 'potencial' },
    ],
    conclusiones: {
      mejor: 'La rentabilidad: margen EBITDA del 29,2%, muy por encima de cualquier comparable del segmento termal.',
      preocupa: 'El tamaño relativo: opera a una escala menor que los líderes del segmento, lo que puede limitar el poder de negociación frente a grandes touroperadores.',
      potencial: 'Ganar tamaño mediante adquisiciones — el sector termal español está fragmentado y la compañía ya tiene la estructura de holding para absorberlas.',
      aprender: ['Vivood Termal Group', 'Termas Ibéricas'],
      adquirir: ['Balneario Alhama Aragón', 'Grupo Aguasana'],
    },
  },

  // ── MERCADO radar (scores inferidos por Arroba sobre datos reales) ──
  radar: [
    { l: 'Calidad', e: 86, s: 58, p: 'P88', def: 'Combina margen EBITDA, solvencia y rentabilidad en una nota de 0 a 100.', formula: 'Margen + Solvencia + Rentabilidad (ponderados)', src: 'Cuentas auditadas 2024' },
    { l: 'Crecimiento', e: 64, s: 54, p: 'P62', def: 'Evolución de ingresos del grupo frente a la mediana del sector hotelero termal.', formula: 'CAGR ingresos 3 años vs. sector', src: 'Cuentas consolidadas + sector' },
    { l: 'Margen EBITDA', e: 91, s: 60, p: 'P92', def: 'EBITDA sobre ventas, normalizado por subsector.', formula: 'EBITDA / Ventas = 25,48% (consolidado)', src: 'Cuentas 2024' },
    { l: 'Productividad', e: 72, s: 61, p: 'P70', def: 'Ingresos y EBITDA por empleado frente al sector.', formula: 'Ingresos y EBITDA / 81 empleados', src: 'Cuentas + plantilla' },
    { l: 'Salud financiera', e: 89, s: 57, p: 'P90', def: 'Solidez del balance: cuánto del activo se financia con recursos propios.', formula: 'PN / Activo = 82,91% · Solvency Ratio 5,85', src: 'Balance 2024' },
  ],

  aiSummary: 'Grupo Olmedo Hoteles (marca Castilla Termal) es un holding hotelero de turismo termal con un margen EBITDA del 29% en individual y del 25% en consolidado, muy por encima de la media del sector. Su balance es excepcionalmente sólido —patrimonio neto del 83% del activo individual y Solvency Ratio Iberinform de 5,85— y sus cuentas están auditadas por Ernst & Young. Con 7 sociedades participadas (26,3M€ invertidos en el grupo) y un accionariado que combina familia, sociedades patrimoniales e inversores institucionales, es una plataforma idónea para consolidar el segmento termal o captar capital de expansión.',

  // ── FINANZAS REALES 2024 ──
  finanzas: {
    individual: {
      ventas: '6,41M€', ebitda: '1,87M€', margen: '29,19%', neto: '2,45M€', activo: '39,57M€', patrimonio: '32,81M€',
      kpis: [
        { l: 'Ventas', v: '6,41M€', raw: '6.406.136,74 €', kind: 'rec' },
        { l: 'EBITDA', v: '1,87M€', raw: '1.869.925,04 €', kind: 'calc' },
        { l: 'Margen EBITDA', v: '29,19%', kind: 'calc' },
        { l: 'Beneficio neto', v: '2,45M€', raw: '2.453.587,23 €', kind: 'rec' },
      ],
      pyg: [
        { label: 'Importe neto de la cifra de negocio', val: '6,41M€', bold: true, src: 'rec' },
        { label: 'Aprovisionamientos', val: '−1,40M€', src: 'rec' },
        { label: 'Gastos de personal', val: '−1,94M€', src: 'rec' },
        { label: 'Otros gastos de explotación', val: '−1,30M€', src: 'rec' },
        { label: 'EBITDA', val: '1,87M€', bold: true, accent: true, src: 'calc', note: '29,19% margen' },
        { label: 'Amortización del inmovilizado', val: '−0,41M€', src: 'rec' },
        { label: 'Resultado de explotación (EBIT)', val: '1,46M€', bold: true, src: 'rec' },
        { label: 'Resultado financiero', val: '+1,36M€', src: 'rec' },
        { label: 'Resultado antes de impuestos', val: '2,81M€', bold: true, src: 'rec' },
        { label: 'Impuesto sobre beneficios', val: '−0,36M€', src: 'calc' },
        { label: 'Resultado del ejercicio', val: '2,45M€', bold: true, accent: true, src: 'rec' },
      ],
      balance: {
        activo: [
          { label: 'Activo no corriente', val: '31,93M€', bold: true },
          { label: 'Inmovilizado material', val: '5,56M€', sub: true },
          { label: 'Inversiones en empresas del grupo (L/P)', val: '26,30M€', sub: true },
          { label: 'Inmovilizado intangible', val: '0,02M€', sub: true },
          { label: 'Activo corriente', val: '7,64M€', bold: true },
          { label: 'Inversiones financieras (C/P)', val: '6,95M€', sub: true },
          { label: 'Tesorería', val: '0,21M€', sub: true },
          { label: 'Existencias', val: '0,12M€', sub: true },
          { label: 'Total activo', val: '39,57M€', bold: true, accent: true },
        ],
        pasivo: [
          { label: 'Patrimonio neto', val: '32,81M€', bold: true, accent: true },
          { label: 'Capital', val: '4,93M€', sub: true },
          { label: 'Prima de emisión', val: '18,37M€', sub: true },
          { label: 'Reservas', val: '7,29M€', sub: true },
          { label: 'Resultado del ejercicio', val: '2,45M€', sub: true },
          { label: 'Dividendo a cuenta', val: '−0,90M€', sub: true },
          { label: 'Subvenciones', val: '0,67M€', sub: true },
          { label: 'Pasivo no corriente', val: '5,37M€', bold: true },
          { label: 'Deudas con entidades de crédito (L/P)', val: '5,14M€', sub: true },
          { label: 'Pasivo corriente', val: '1,39M€', bold: true },
          { label: 'Deudas a corto plazo', val: '0,71M€', sub: true },
          { label: 'Acreedores comerciales', val: '0,64M€', sub: true },
          { label: 'Total patrimonio neto y pasivo', val: '39,57M€', bold: true, accent: true },
        ],
      },
      ratiosIberinform: [
        { group: 'Rating y solvencia', items: [
          { label: 'Rating Iberinform', value: '7 / 10' },
          { label: 'Solvency', value: '10 / 10' },
          { label: 'Límite de crédito', value: '2.710.000 €' },
          { label: 'Solvency Ratio', value: '5,85' },
        ]},
        { group: 'Endeudamiento', items: [
          { label: 'Debt Ratio', value: '17,09%' },
          { label: 'Quality of Debt', value: '20,62%' },
          { label: 'Interest Coverage', value: '10,58x' },
          { label: 'Plazo medio de pago', value: '41,53 días' },
        ]},
      ],
      kpisArroba: [
        { label: 'Deuda financiera bruta', value: '5,85M€', raw: '5.853.099,42 €' },
        { label: 'Caja', value: '0,21M€', raw: '206.671,86 €' },
        { label: 'Deuda financiera neta', value: '5,65M€', raw: '5.646.427,56 €' },
        { label: 'Deuda neta / EBITDA', value: '3,02x' },
        { label: 'Fondo de maniobra', value: '6,25M€', raw: '6.250.732,13 €' },
        { label: 'Patrimonio neto / Activo', value: '82,91%' },
        { label: 'Pasivo / Activo', value: '17,09%' },
      ],
    },
    consolidado: {
      ventas: '32,01M€', ebitda: '8,16M€', margen: '25,48%', neto: '3,13M€', activo: '66,26M€', patrimonio: '38,00M€',
      kpis: [
        { l: 'Ventas', v: '32,01M€', raw: '32.012.473 €', kind: 'rec' },
        { l: 'EBITDA', v: '8,16M€', raw: '8.155.990 €', kind: 'rec' },
        { l: 'Margen EBITDA', v: '25,48%', kind: 'calc' },
        { l: 'Beneficio neto', v: '3,13M€', raw: '3.132.227 €', kind: 'rec' },
      ],
      pyg: [
        { label: 'Importe neto de la cifra de negocio', val: '32,01M€', bold: true, src: 'rec' },
        { label: 'EBITDA', val: '8,16M€', bold: true, accent: true, src: 'rec', note: '25,48% margen' },
        { label: 'Resultado de explotación (EBIT)', val: '4,88M€', bold: true, src: 'rec' },
        { label: 'Resultado antes de impuestos', val: '4,12M€', bold: true, src: 'rec' },
        { label: 'Resultado del ejercicio', val: '3,13M€', bold: true, accent: true, src: 'rec' },
      ],
      balance: {
        activo: [
          { label: 'Total activo', val: '66,26M€', bold: true, accent: true },
        ],
        pasivo: [
          { label: 'Patrimonio neto', val: '38,00M€', bold: true, accent: true },
          { label: 'Pasivo no corriente', val: '20,42M€', bold: true },
          { label: 'Deuda bancaria (L/P)', val: '18,73M€', sub: true },
          { label: 'Pasivo corriente', val: '7,83M€', bold: true },
          { label: 'Deuda bancaria (C/P)', val: '3,73M€', sub: true },
        ],
      },
      ratiosIberinform: null,
      kpisArroba: [
        { label: 'Deuda bancaria total', value: '22,46M€', raw: '22.459.390 €' },
        { label: 'Deuda bancaria / EBITDA', value: '2,75x' },
      ],
    },
  },

  // ── OPORTUNIDADES (inferidas por Arroba sobre datos reales) ──
  oportunidades: [
    { type: 'Buy & Build', title: 'Plataforma de consolidación del turismo termal', conf: 84, value: 'Alto', heat: 'Alta', desc: 'Holding con 7 participadas y 26,3M€ invertidos en el grupo: base idónea para seguir integrando hoteles y balnearios.', origin: ['Holding ya operativo', 'Margen EBITDA P90+', 'Sector termal fragmentado', '7 participadas integradas'] },
    { type: 'Captación de capital', title: 'Capital de expansión para nuevas aperturas', conf: 71, value: 'Medio', heat: 'Media', desc: 'Deuda neta/EBITDA de 3,02x y balance sólido: capacidad para financiar aperturas con un inversor de hotelería o infraestructuras.', origin: ['Apalancamiento moderado (3,02x)', 'Solvency Ratio 5,85', 'Inversores de hotelería activos'] },
    { type: 'Entrada de socio', title: 'Encaje para un grupo hotelero estratégico', conf: 66, value: 'Medio', heat: 'Media', desc: 'Activos inmobiliarios singulares y rentabilidad superior a la media, atractivos para un operador del segmento de bienestar.', origin: ['Activos inmobiliarios singulares', 'Rentabilidad P90+', 'Prima de emisión histórica 18,4M€'] },
  ],

  // ── REGISTROS PÚBLICOS ──
  borme: [
    { date: '2024', act: 'Nombramientos', detail: 'Consejo de administración — Roberto García González (Presidente y Consejero Delegado)' },
    { date: '2024', act: 'Apoderamientos', detail: 'Ángela Sinovas, Diego Sanz, María del Carmen Arranz, Yaiza Fidalgo' },
    { date: '2024', act: 'Auditoría', detail: 'Ernst & Young, S.L. como auditor de cuentas' },
  ],
  cuentas: [
    { ejercicio: '2024', tipo: 'Cuentas anuales (individual)', estado: 'Auditadas', auditor: 'Ernst & Young' },
    { ejercicio: '2024', tipo: 'Cuentas consolidadas', estado: 'Auditadas', auditor: 'Ernst & Young' },
  ],

  // ── DOCUMENTOS ──
  documentos: [
    { name: 'Informe ejecutivo', desc: 'Resumen de 1 página de la compañía', icon: 'document' },
    { name: 'Informe financiero', desc: 'Cuenta de resultados, balance y ratios — individual y consolidado', icon: 'chartBar' },
    { name: 'Aproximación de valor', desc: 'Rango orientativo por múltiplos comparables, sin coste', icon: 'valuation' },
    { name: 'Memoria Mercantil', desc: 'Cuentas anuales oficiales depositadas en el Registro Mercantil', icon: 'document', premium: true, credits: '8,5 créditos' },
    { name: 'Rating de morosidad', desc: 'Probabilidad de impago, incidencias y comportamiento de pago frente al sector', icon: 'signal', premium: true, credits: '8,5 créditos' },
    { name: 'Valoración avanzada', desc: 'Informe profesional con DCF, comparables, escenarios y sensibilidad', icon: 'valuation', premium: true, credits: '75 créditos' },
  ],
};
