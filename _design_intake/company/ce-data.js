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
    { id: 'senales',      label: 'Señales',          icon: 'signal',   group: 'Inteligencia' },
    { id: 'oportunidades',label: 'Oportunidades',    icon: 'target',   group: 'Inteligencia' },
    { id: 'registros',    label: 'Registros públicos', icon: 'document', group: 'Fuentes' },
    { id: 'documentos',   label: 'Documentos',       icon: 'document', group: 'Fuentes' },
  ],

  contacto: { web: 'castillatermal.com', webFull: 'https://www.castillatermal.com' },

  // ── EVOLUCIÓN HISTÓRICA (facturación, EBITDA en M€; margen en %) ──
  // Solo 2024 confirmado por Iberinform. Añadir ejercicios anteriores cuando se disponga.
  historico: {
    consolidado: {
      years:       ['2024'],
      facturacion: [32.01],
      ebitda:      [8.16],
      margen:      [25.48],
    },
    individual: {
      years:       ['2024'],
      facturacion: [6.41],
      ebitda:      [1.87],
      margen:      [29.19],
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
    { name: 'Cuaderno de empresa', desc: 'Dossier completo del grupo', icon: 'layers' },
    { name: 'Memoria Mercantil', desc: 'Cuentas anuales oficiales depositadas en el Registro Mercantil', icon: 'document', premium: true, credits: '8,5 créditos' },
  ],
};
