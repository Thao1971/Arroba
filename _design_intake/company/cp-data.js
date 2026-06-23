// Arroba — Company Profile — DATOS REALES (Iberinform)
// GRUPO OLMEDO HOTELES, S.L. · Castilla Termal Olmedo · ID Iberinform 2296941
window.CP_DATA = {
  company: {
    id: 'comp_olmedohoteles',
    iberinformId: '2296941',
    name: 'Grupo Olmedo Hoteles',
    comercial: 'Castilla Termal Olmedo',
    legal: 'Grupo Olmedo Hoteles, S.L.',
    cif: 'B-47 594 478',
    sector: 'Hoteles y alojamientos similares',
    cnae: '5510',
    subsector: 'Hoteles termales y balnearios',
    forma: 'Sociedad Limitada',
    domicilio: 'Calle Pago de Santi Spiritus, s/n',
    cp: '47410',
    telefono: '983 600 237',
    location: { city: 'Olmedo', province: 'Valladolid', comunidad: 'Castilla y León' },
    capital: '4.929.990,30 €',
    modeloCuentas: 'Normal PGC 2016',
    ultimoEjercicio: '2024',
    employees: 81,
    plantilla: { fijos: 78, temporales: 3, hombres: 23, mujeres: 58 },
    web: 'castillatermal.com',
    webFull: 'https://www.castillatermal.com',
    status: 'Activa',
    verified: true,
    audited: true,
    auditor: 'Ernst & Young, S.L.',
    description: 'Holding del grupo Castilla Termal, especializado en turismo termal y de bienestar en edificios históricos rehabilitados (monasterios y palacios) de Castilla y León, Cantabria y la Comunidad Valenciana. Integra hoteles, balnearios y una embotelladora de agua mineral.',
  },

  // ── SCORES (inferidos por Arroba a partir de datos reales) ──
  scores: [
    { id: 'opportunity', label: 'Opportunity Score', value: 84, color: '#E8001D', hero: true },
    { id: 'quality',     label: 'Quality',           value: 86, color: '#1A8A4A' },
    { id: 'growth',      label: 'Growth',            value: 64, color: '#2164E3' },
    { id: 'risk',        label: 'Risk',              value: 34, color: '#D97708', inverted: true },
    { id: 'ma',          label: 'M&A Readiness',     value: 72, color: '#7C3AED' },
  ],

  valuation: null,

  // ── SEÑALES INFERIDAS por Arroba (ancladas en datos Iberinform 2024) ──
  signals: [
    { type: 'positive', family: 'Rentabilidad', label: 'Margen EBITDA del 29% (individual)',
      detail: 'EBITDA de 1,87M€ sobre ventas de 6,41M€ — muy por encima de la media del sector hotelero',     date: '2024', strength: 0.90 },
    { type: 'positive', family: 'Solvencia',    label: 'Patrimonio neto del 83% del activo',
      detail: 'PN de 32,81M€ sobre 39,57M€ de activo (individual). Solvency Ratio Iberinform 5,85',           date: '2024', strength: 0.82 },
    { type: 'positive', family: 'Auditoría',    label: 'Cuentas auditadas por Ernst & Young',
      detail: 'Auditoría de una Big Four y modelo Normal PGC 2016 — alta fiabilidad de la información',        date: '2024', strength: 0.74 },
    { type: 'positive', family: 'Capital',      label: 'Respaldo inversor: 18,4M€ de prima de emisión',
      detail: 'Fondos propios reforzados con prima de emisión — entrada histórica de capital de inversores',  date: '2024', strength: 0.70 },
    { type: 'neutral',  family: 'Apalancamiento', label: 'Deuda neta / EBITDA de 3,02x',
      detail: 'Deuda financiera neta de 5,65M€ (individual): apalancamiento moderado, con margen de recorrido', date: '2024', strength: 0.50 },
    { type: 'positive', family: 'Estructura',   label: 'Holding con 7 sociedades participadas',
      detail: '26,3M€ en inversiones en empresas del grupo — plataforma de consolidación ya operativa',       date: '2024', strength: 0.66 },
  ],

  ownership: {
    shareholders: [
      { name: 'Promociones y Negocios de Olmedo', role: 'Sociedad patrimonial', stake: 39.74, kind: 'soc' },
      { name: 'Personas físicas',                 role: 'Accionistas individuales', stake: 27.19, kind: 'persona' },
      { name: 'Castilla Termal',                  role: 'Autocartera del grupo', stake: 9.49, kind: 'soc' },
      { name: '3 Gutinver',                       role: 'Sociedad de inversión', stake: 8.58, kind: 'soc' },
      { name: 'Ruralia Europa',                   role: 'Inversor institucional', stake: 5.00, kind: 'fondo' },
      { name: 'La Magdalena 2020',                role: 'Sociedad de inversión', stake: 5.00, kind: 'soc' },
      { name: 'Muggio Holding',                   role: 'Holding inversor', stake: 5.00, kind: 'fondo' },
    ],
    participadas: [
      { name: 'Hotel Burgo de Osma',          stake: 100,   activity: 'Hotel termal · Soria' },
      { name: 'Agua Fuente Palacios',         stake: 100,   activity: 'Embotelladora de agua mineral' },
      { name: 'Hotel Agua de Valbuena',       stake: 100,   activity: 'Hotel termal · Valladolid' },
      { name: 'Hotel Sant Jeroni de Cotalba', stake: 100,   activity: 'Hotel · Valencia' },
      { name: 'Hotel Peñaranda de Duero',     stake: 100,   activity: 'Hotel termal · Burgos' },
      { name: 'Alcarria Termal',              stake: 69.70, activity: 'Balneario · Guadalajara' },
      { name: 'Balneario de Solares',         stake: 51.12, activity: 'Balneario · Cantabria' },
    ],
    consejo: {
      secretario: 'Jesús Gómez Escolar Mazuela',
      miembros: [
        { name: 'Roberto García González',          role: 'Presidente y Consejero Delegado', kind: 'ejecutivo' },
        { name: 'Rocío Hervella Durantez',          role: 'Consejera', kind: 'persona' },
        { name: 'Alejandro Barjau Buj',             role: 'Consejero', kind: 'persona' },
        { name: 'Jaime-Gregorio Huesa Oderiz',      role: 'Consejero', kind: 'persona' },
        { name: 'Javier Solano Rodríguez Losada',   role: 'Consejero', kind: 'persona' },
        { name: 'ADE Capital Sodical SCR',          role: 'Consejero dominical', kind: 'entidad' },
        { name: 'Ruralia Europa',                   role: 'Consejero dominical', kind: 'entidad' },
        { name: 'Muggio Holding',                   role: 'Consejero dominical', kind: 'entidad' },
      ],
    },
    direccion: [
      { name: 'Roberto García González', role: 'Consejero Delegado' },
    ],
    apoderados: [
      { name: 'Ángela Sinovas Mozo' },
      { name: 'Diego Sanz Bailén' },
      { name: 'María del Carmen Arranz Herrero' },
      { name: 'Yaiza Fidalgo Alegre' },
    ],
    auditor: { name: 'Ernst & Young, S.L.', desc: 'Auditoría de cuentas anuales', since: '2024' },
  },
};
