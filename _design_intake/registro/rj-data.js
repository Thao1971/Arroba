// Arroba — Registration Journey Engine · datos del flujo
// El registro es una conversación con Arroba Copilot ✦ (< 60s). Ramifica por intención.
window.RJ = {
  intro: 'Hola, soy Arroba Copilot ✦. Voy a hacerte unas preguntas para entender qué te gustaría hacer y preparar tu espacio de trabajo. No te preocupes si todavía no tienes todas las respuestas: podrás completarlas más adelante.',

  // PREGUNTA 1 — intención (crea la entidad)
  intents: [
    { id: 'comprar',  title: 'Comprar empresas',       desc: 'Quiero crecer mediante adquisiciones.', icon: 'target',    entity: 'Tesis de Inversión' },
    { id: 'vender',   title: 'Vender una empresa',      desc: 'Quiero explorar una operación.',        icon: 'handshake', entity: 'Oportunidad potencial' },
    { id: 'financiar',title: 'Conseguir financiación',  desc: 'Quiero impulsar el crecimiento.',       icon: 'trend',     entity: 'Caso de Capital' },
    { id: 'explorar', title: 'Solo explorar',           desc: 'Todavía no tengo algo concreto en mente.', icon: 'compass', entity: null },
  ],

  // PREGUNTA 2 — sobre ti
  about: [
    { id: 'empresa',   title: 'Tengo una empresa',                desc: 'Una cadena de panaderías, una agencia o una empresa industrial.', icon: 'building' },
    { id: 'invierto',  title: 'Invierto en empresas',             desc: 'Family office, fondo o search fund.', icon: 'trend' },
    { id: 'asesor',    title: 'Soy asesor y trabajo para clientes', desc: 'M&A, corporate finance o consultoría.', icon: 'users' },
    { id: 'empezando', title: 'Estoy empezando',                  desc: 'Aún estoy explorando qué puedo hacer en arroba.', icon: 'compass' },
  ],

  // Empresas mock (buscador por nombre o CIF, normaliza acentos/ñ)
  companies: [
    { id: 'kitchen', name: 'Kitchen', razon: 'Kitchen Studio, S.L.', cif: 'B-86 540 112', forma: 'Sociedad Limitada', sector: 'Tecnología y software', city: 'Madrid', province: 'Madrid', cnae: '6201', web: 'kitchen.studio', revenue: '5,4M€', ebitda: '1,1M€', employees: 47, desc: 'Estudio de producto digital y desarrollo de software a medida para grandes marcas, con ingresos recurrentes por mantenimiento y evolución de plataformas.' },
    { id: 'olmedo', name: 'Grupo Olmedo Hoteles', razon: 'Grupo Olmedo Hoteles, S.L.', cif: 'B-47 594 478', forma: 'Sociedad Limitada', sector: 'Hoteles y turismo termal', city: 'Olmedo', province: 'Valladolid', cnae: '5510', web: 'castillatermal.com', revenue: '32,0M€', ebitda: '8,2M€', employees: 81, desc: 'Holding hotelero especializado en turismo termal en edificios históricos rehabilitados. Opera la marca Castilla Termal.' },
    { id: 'munoz', name: 'Muñoz Comunicación', razon: 'Muñoz Comunicación, S.L.', cif: 'B-85 412 003', forma: 'Sociedad Limitada', sector: 'Marketing y publicidad', city: 'Madrid', province: 'Madrid', cnae: '7311', web: 'munozcomunicacion.es', revenue: '4,2M€', ebitda: '0,76M€', employees: 38, desc: 'Agencia independiente de comunicación y publicidad con cartera de clientes recurrente en gran consumo, banca y sector público.' },
    { id: 'pena', name: 'Construcciones Peña y Asociados', razon: 'Construcciones Peña y Asociados, S.A.', cif: 'A-47 118 562', forma: 'Sociedad Anónima', sector: 'Construcción', city: 'Valladolid', province: 'Valladolid', cnae: '4121', web: 'construccionespena.es', revenue: '18,6M€', ebitda: '2,4M€', employees: 142, desc: 'Constructora familiar con foco en obra civil y edificación no residencial en Castilla y León.' },
    { id: 'quickads', name: 'Quickads', razon: 'Quickads Technologies, S.L.', cif: 'B-67 220 945', forma: 'Sociedad Limitada', sector: 'Tecnología y software', city: 'Barcelona', province: 'Barcelona', cnae: '6201', web: 'quickads.io', revenue: '3,1M€', ebitda: '0,4M€', employees: 29, desc: 'Plataforma SaaS de generación y optimización de anuncios con IA, con fuerte crecimiento y base de clientes internacional.' },
  ],

  // Ramas por intención → preguntas que construyen la entidad
  flows: {
    comprar: {
      entity: 'Tesis de Inversión',
      vehicleQ: '¿Desde qué empresa o vehículo te gustaría realizar las adquisiciones?',
      vehicleHint: 'Busca tu empresa por nombre o CIF, o escríbelo si aún no la tienes.',
      steps: [
        { id: 'objetivo', type: 'single', field: 'objetivo', q: '¿Cuál es tu principal objetivo?',
          chips: ['Reforzar mi negocio actual', 'Incorporar nuevos servicios o capacidades', 'Entrar en nuevos sectores', 'Expandirme geográficamente', 'Aprovechar oportunidades especiales'] },
        { id: 'plazo', type: 'single', field: 'plazo', q: '¿En qué plazo te gustaría realizar una adquisición?',
          chips: ['Ahora', 'En los próximos 12 meses', 'Más adelante'] },
      ],
    },
    vender: {
      entity: 'Oportunidad potencial',
      companyQ: 'Indícame la razón social o el CIF de tu empresa.',
      companyHint: 'Construiré su ficha automáticamente a partir de nuestra base de datos.',
      steps: [
        { id: 'objetivo', type: 'multi', field: 'objetivo', q: '¿Qué te gustaría hacer con esta empresa?', hint: 'Puedes elegir varias.',
          chips: ['Conocer cuánto vale', 'Explorar una posible venta', 'Incorporar un socio', 'Buscar financiación', 'Prepararla para crecer', 'Fusionarla con otra empresa'] },
        { id: 'plazo', type: 'single', field: 'plazo', q: '¿En qué plazo te planteas una operación?',
          chips: ['Ahora', 'En los próximos 12 meses', 'Más adelante'] },
      ],
    },
    financiar: {
      entity: 'Caso de Capital',
      companyQ: 'Indícame la razón social o el CIF de tu empresa.',
      companyHint: 'Construiré su ficha automáticamente a partir de nuestra base de datos.',
      steps: [
        { id: 'objetivo', type: 'multi', field: 'objetivo', q: '¿Para qué te gustaría conseguir financiación?', hint: 'Puedes elegir varias.',
          chips: ['Crecer', 'Comprar empresas', 'Internacionalizar', 'Lanzar nuevos productos', 'Reforzar la estructura financiera'] },
        { id: 'plazo', type: 'single', field: 'plazo', q: '¿En qué plazo te gustaría conseguir financiación?',
          chips: ['Ahora', 'En los próximos 12 meses', 'Más adelante'] },
      ],
    },
  },
};
