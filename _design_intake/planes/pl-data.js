// arroba.com — Página de Planes · datos
window.PL = {
  billing: [
    { id: 'mensual',   label: 'Mensual',   factor: 1,    off: 0,  note: 'facturación mensual' },
    { id: 'semestral', label: 'Semestral', factor: 0.95, off: 5,  note: 'facturación semestral' },
    { id: 'anual',     label: 'Anual',     factor: 0.90, off: 10, note: 'facturación anual' },
  ],

  pillars: [
    { big: '3,3M', label: 'Compañías' },
    { big: 'Valoraciones', label: 'Automáticas' },
    { big: 'Compra y Venta', label: 'de Empresas' },
    { big: '24/7', label: 'Copiloto IA' },
  ],

  plans: [
    {
      id: 'profesional',
      name: 'Profesional',
      base: 390, perUser: false,
      price: '390 €', unit: '/mes',
      credits: '100 créditos incluidos cada mes',
      tagline: 'Para quienes gestionan sus propias operaciones.',
      desc: 'Pensado para empresarios, CEOs, search funds e inversores que trabajan sobre una única tesis o un número reducido de operaciones.',
      featuresHead: null,
      features: [
        'Más de 3,3 millones de compañías españolas',
        'Información financiera',
        'Rangos de valoración',
        'Comparables',
        'Copiloto arroba',
        'Casos estratégicos',
        'Proceso completo de M&A',
      ],
      featured: false,
    },
    {
      id: 'advisor',
      name: 'Advisor',
      base: 390, perUser: false,
      price: '390 €', unit: '/mes',
      credits: '100 créditos incluidos cada mes',
      tagline: 'Para quienes trabajan para terceros.',
      desc: 'Diseñado para boutiques de M&A, corporate finance, brokers y consultores. Permite gestionar simultáneamente varios clientes y hasta tres mandatos activos.',
      featuresHead: 'Todo lo incluido en Profesional, más:',
      features: [
        'Hasta tres mandatos activos',
        'Gestión de clientes',
        'Pipeline de operaciones',
        'Espacios privados',
        'Data Rooms',
        'Seguimiento por mandato',
        'Compartir información con clientes',
      ],
      featured: false,
    },
    {
      id: 'organizacion',
      name: 'Organización',
      base: 290, perUser: true, from: true,
      price: 'Desde 290 €', unit: '/usuario/mes',
      aux: 'Mínimo 3 usuarios',
      credits: '100 créditos por usuario y mes',
      tagline: 'Para equipos y firmas.',
      desc: 'Pensado para fondos, holdings y grupos empresariales con varios profesionales trabajando simultáneamente.',
      featuresHead: 'Todo lo incluido en Advisor, más:',
      features: [
        'Usuarios múltiples',
        'Analistas y administradores',
        'Roles y permisos',
        'Espacios compartidos',
        'Historial común',
        'Trabajo colaborativo',
        'Administración centralizada',
      ],
      featured: false,
    },
  ],

  shared: [
    { icon: 'agency', t: 'Más de 3,3 millones de compañías españolas' },
    { icon: 'chartBar', t: 'Información financiera histórica' },
    { icon: 'euro', t: 'Rangos de valoración' },
    { icon: 'layers', t: 'Comparables de mercado' },
    { icon: 'spark', t: 'Copiloto arroba' },
    { icon: 'target', t: 'Casos estratégicos' },
    { icon: 'handshake', t: 'Compra' },
    { icon: 'tag', t: 'Venta' },
    { icon: 'euro', t: 'Levantamiento de capital' },
  ],

  fees: [
    { pct: '1%', name: 'Finder Fee', text: 'Se aplica cuando comprador y vendedor alcanzan un acuerdo preliminar y aceptan una oferta indicativa (IOI), decidiendo continuar hacia la fase de Due Diligence.', who: 'Aplicable tanto al comprador como al vendedor.' },
    { pct: '2%', name: 'Success Fee', text: 'Se aplica cuando la operación se completa utilizando las herramientas, asistentes de inteligencia artificial y Data Rooms de arroba. El Success Fee sustituye al Finder Fee, por lo que solo se cobra uno de ellos.', who: 'Aplicable tanto al comprador como al vendedor.' },
    { pct: '15%', name: 'Revenue Share para Advisors', text: 'Si trabajas para terceros mediante mandatos de compra, venta o levantamiento de capital, arroba participa con un 15% de los honorarios generados por ese mandato.', who: 'Así alineamos nuestros incentivos con los tuyos.' },
  ],

  creditsUses: [
    'Valoraciones avanzadas',
    'Informes estratégicos con IA',
    'Matching de oportunidades',
    'Procesos transaccionales',
    'Data Rooms',
    'Análisis complejos',
  ],

  faq: [
    { q: '¿Tengo que cambiar de plan cuando crezca?', a: 'No. Los planes no son mejores ni peores. Cada uno está pensado para una forma distinta de trabajar.' },
    { q: '¿Puedo cambiar de plan?', a: 'Sí, cuando quieras y sin coste.' },
    { q: '¿Hay permanencia?', a: 'No. Cancela cuando quieras.' },
    { q: '¿Los créditos caducan?', a: 'No. Se acumulan mientras tu suscripción esté activa.' },
    { q: '¿Puedo comprar créditos adicionales?', a: 'Sí, en cualquier momento desde tu espacio.' },
  ],
};
