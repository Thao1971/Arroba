// arroba.com — Workbench Engine (Mis Oportunidades) · datos mock
// Responde a una sola pregunta: "¿Qué requiere mi atención ahora?"
// Formato España: miles con punto, decimales con coma.

window.WB_DATA = {
  user: 'Ana',
  userFull: 'Ana Martín',

  // ── LEFT RAIL · contexto personal (estilo Notion) ──
  rail: {
    oportunidades: [
      { id: 'atencion',    label: 'Requieren atención', n: 4, accent: true },
      { id: 'activas',     label: 'Activas',            n: 4 },
      { id: 'proceso',     label: 'En proceso',         n: 3 },
      { id: 'negociacion', label: 'Negociación',        n: 1 },
      { id: 'completadas', label: 'Completadas',        n: 2 },
    ],
    tipos: [
      { id: 'compra',   label: 'Compra',   n: 2, icon: 'deal' },
      { id: 'venta',    label: 'Venta',    n: 1, icon: 'euro' },
      { id: 'capital',  label: 'Capital',  n: 1, icon: 'trending' },
      { id: 'mandatos', label: 'Mandatos', n: 1, icon: 'layers' },
    ],
    favoritos: [
      { label: 'Kitchen · Sell-Side', icon: 'bookmark' },
      { label: 'Clínica Veterinaria Vallés', icon: 'bookmark' },
    ],
    reciente: [
      { label: 'Data Room · Vallés', when: 'hace 25 min' },
      { label: 'Oferta Kitchen', when: 'hace 1 h' },
      { label: 'Mandato IMU', when: 'ayer' },
    ],
    seguimiento: [
      { id: 'empresas',     label: 'Empresas',     n: 12, icon: 'agency' },
      { id: 'compradores',  label: 'Compradores',  n: 6,  icon: 'deal' },
      { id: 'inversores',   label: 'Inversores',   n: 4,  icon: 'euro' },
      { id: 'sectores',     label: 'Sectores',     n: 3,  icon: 'signal' },
    ],
  },

  // ── COPILOT RAIL · Arroba Copilot ✦ (Chief of Staff) ──
  copilot: {
    working: [
      'Due Diligence · Vallés',
      'Oferta · Kitchen',
      'Capital · Quickads',
      'Mandato · IMU',
    ],
    nextActions: [
      { txt: 'NDA pendiente de firma', opp: 'IMU', urgent: true },
      { txt: 'Reunión con Meridia mañana', opp: 'Quickads' },
      { txt: 'Documento pendiente de subir', opp: 'Kitchen' },
      { txt: 'Respuesta pendiente de envío', opp: 'Vallés', urgent: true },
    ],
    team: [
      { who: 'Fernando', avatar: 'F', what: 'actualizó la valoración', when: 'hace 2 h' },
      { who: 'Juan', avatar: 'J', what: 'respondió preguntas del Data Room', when: 'hace 4 h' },
      { who: 'María', avatar: 'M', what: 'subió documentación', when: 'ayer' },
    ],
    memoria: [
      { type: 'Conversación', label: 'Estrategia de salida · Kitchen', when: 'hace 1 h' },
      { type: 'Documento', label: 'Cuaderno de venta · IMU', when: 'ayer' },
      { type: 'Análisis', label: 'Comparables veterinaria', when: 'ayer' },
    ],
    quickActions: [
      { label: 'Nueva oportunidad', icon: 'trending' },
      { label: 'Nueva valoración', icon: 'euro' },
      { label: 'Nueva búsqueda', icon: 'signal' },
      { label: 'Nuevo mandato', icon: 'deal' },
    ],
  },

  // Resumen del trabajo del Copilot mientras el usuario no estaba
  briefing: {
    nuevasOportunidades: 3,
    senales: 2,
    compradores: 1,
  },

  // ── PRIORIDADES · trabajo que requiere atención ahora ──
  // Cada escenario es una tarjeta. La primera se muestra expandida.
  priorities: [
    {
      id: 'pr-dd',
      scenario: 'duediligence',
      priority: 'alta',
      opp: 'Compra · Clínica Veterinaria Vallés',
      icon: 'document',
      headline: 'Nueva pregunta de due diligence recibida',
      timeAgo: 'hace 25 min',
      copilot: 'He localizado la documentación relacionada y preparado una propuesta de respuesta.',
      action: 'Continuar proceso',
      detail: {
        kind: 'qa',
        question: '¿Cuál es la concentración de los cinco principales clientes?',
        from: 'Comprador · Grupo VetPartners',
        docs: [
          'Cuenta de resultados 2024',
          'Informe comercial',
          'Anexo de clientes',
          'Respuesta similar anterior',
        ],
        answer: 'La concentración de los cinco principales clientes representa aproximadamente un 31% de los ingresos de la compañía, con el primer cliente por debajo del 9%. La cartera muestra baja rotación y contratos recurrentes de carácter anual.',
        confidence: 'alta',
      },
    },
    {
      id: 'pr-oferta',
      scenario: 'oferta',
      priority: 'alta',
      opp: 'Kitchen · Sell-Side',
      icon: 'euro',
      headline: 'Nueva oferta indicativa recibida',
      timeAgo: 'hace 1 h',
      copilot: 'He comparado esta oferta con operaciones similares del sector.',
      action: 'Revisar oferta',
      detail: {
        kind: 'oferta',
        valuation: '8,2M€',
        valuationNote: 'Valoración preliminar de la oferta',
        bench: 'En línea con el rango de comparables (7,5x–9,1x EBITDA). Ligeramente por encima de la mediana sectorial.',
        terms: [
          { l: 'Múltiplo implícito', v: '8,4x EBITDA' },
          { l: 'Estructura', v: '80% caja · 20% earn-out' },
          { l: 'Comprador', v: 'Fondo · mid-market' },
        ],
      },
    },
    {
      id: 'pr-dataroom',
      scenario: 'dataroom',
      priority: 'alta',
      opp: 'Compra · Clínica Veterinaria Vallés',
      icon: 'layers',
      headline: '7 nuevas preguntas en el Data Room',
      timeAgo: 'hace 3 h',
      copilot: 'He localizado los documentos relacionados y preparado borradores. 2 preguntas podrían representar riesgos.',
      action: 'Abrir Data Room',
      detail: {
        kind: 'dataroom',
        stats: [
          { l: 'Preguntas nuevas', v: '7', c: '#2164E3' },
          { l: 'Posibles riesgos', v: '2', c: '#D97708' },
          { l: 'Borradores listos', v: '5', c: '#1A8A4A' },
        ],
        risks: [
          'Litigio laboral mencionado en el anexo legal sin resolución documentada.',
          'Un contrato clave con cliente vence en 4 meses sin renovación firmada.',
        ],
      },
    },
    {
      id: 'pr-capital',
      scenario: 'capital',
      priority: 'media',
      opp: 'Capital · Quickads',
      icon: 'trending',
      headline: 'Un inversor ha solicitado una reunión',
      timeAgo: 'hace 5 h',
      copilot: 'He resumido su tesis de inversión y preparado los puntos clave para la conversación.',
      action: 'Preparar reunión',
      detail: {
        kind: 'reunion',
        investor: 'Meridia Growth Partners',
        thesis: 'Fondo growth con foco en software B2B ibérico. Tickets de 3–10M€, posiciones minoritarias y horizonte de 5–7 años.',
        points: [
          'Encaje con tu objetivo de capital para internacionalización',
          'Han liderado 4 rondas similares en los últimos 18 meses',
          'Suelen pedir un puesto en el consejo',
        ],
      },
    },
    {
      id: 'pr-advisor',
      scenario: 'advisor',
      priority: 'media',
      opp: 'Mandato · IMU',
      icon: 'deal',
      headline: 'IMU requiere tu atención',
      timeAgo: 'ayer',
      copilot: 'Tres compradores han abierto el teaser. Uno solicita información adicional. He preparado una propuesta de respuesta.',
      action: 'Continuar mandato',
      detail: {
        kind: 'mandato',
        stats: [
          { l: 'Teaser abierto', v: '3', c: '#2164E3' },
          { l: 'Solicitan info', v: '1', c: '#E8001D' },
          { l: 'NDA firmados', v: '2', c: '#1A8A4A' },
        ],
        note: 'El comprador interesado es un grupo industrial del sector con encaje del 88%. La propuesta de respuesta incluye el cuaderno de venta y la documentación financiera resumida.',
      },
    },
    {
      id: 'pr-team',
      scenario: 'team',
      priority: 'media',
      opp: 'Compra · Clínica Veterinaria Vallés',
      icon: 'team',
      headline: 'Tu equipo ha avanzado el proceso',
      timeAgo: 'ayer',
      copilot: 'Hay cambios del equipo y una aprobación pendiente de tu revisión.',
      action: 'Revisar cambios',
      detail: {
        kind: 'team',
        items: [
          { who: 'Fernando', avatar: 'F', what: 'ha actualizado la valoración', when: 'hace 2 h' },
          { who: 'Juan', avatar: 'J', what: 'ha respondido 3 preguntas del Data Room', when: 'hace 4 h' },
        ],
        approval: 'Aprobación pendiente: envío de la oferta indicativa revisada.',
      },
    },
  ],

  // ── FEED DINÁMICO ──
  feed: [
    { type: 'comprador', icon: 'deal', txt: 'Nuevo comprador compatible para Kitchen', detail: 'Grupo industrial del sector · encaje 88%', when: 'hace 40 min', action: 'Ver compatibilidad' },
    { type: 'senal', icon: 'signal', txt: 'Sube el múltiplo medio en SaaS B2B', detail: '8,6x EBITDA · +0,4x en el trimestre', when: 'hace 2 h', action: 'Explorar' },
    { type: 'oportunidad', icon: 'trending', txt: 'Nueva oportunidad de consolidación detectada', detail: 'Clínicas veterinarias en Aragón · 9 targets', when: 'hace 3 h', action: 'Explorar' },
    { type: 'empresa', icon: 'agency', txt: 'Una empresa guardada ha abierto proceso de venta', detail: 'Cárnicas del Valle · ahora en venta', when: 'ayer', action: 'Revisar' },
    { type: 'recomendacion', icon: 'plan', txt: 'Recomendación: solicita la valoración avanzada de Kitchen', detail: 'Reforzaría tu posición ante la oferta recibida', when: 'ayer', action: 'Ver' },
  ],

  // ── OPORTUNIDADES ACTIVAS · siempre cards, nunca tabla ──
  opportunities: [
    {
      id: 'op-vet', name: 'Compra · Clínica Veterinaria Vallés', type: 'Adquisición',
      stage: 'Due diligence', stagePct: 70, priority: 'alta',
      nextAction: 'Responder pregunta de due diligence',
      participants: ['AM', 'F', 'J'], lastActivity: 'hace 25 min',
    },
    {
      id: 'op-kitchen', name: 'Kitchen · Sell-Side', type: 'Venta de compañía',
      stage: 'Ofertas indicativas', stagePct: 55, priority: 'alta',
      nextAction: 'Revisar oferta de 8,2M€',
      participants: ['AM', 'F'], lastActivity: 'hace 1 h',
    },
    {
      id: 'op-quickads', name: 'Capital · Quickads', type: 'Captación de capital',
      stage: 'Conversaciones con inversores', stagePct: 35, priority: 'media',
      nextAction: 'Preparar reunión con Meridia',
      participants: ['AM'], lastActivity: 'hace 5 h',
    },
    {
      id: 'op-imu', name: 'Mandato · IMU', type: 'Advisor · Sell-Side',
      stage: 'Difusión del teaser', stagePct: 45, priority: 'media',
      nextAction: 'Responder solicitud de información',
      participants: ['AM', 'J'], lastActivity: 'ayer',
    },
  ],
};
