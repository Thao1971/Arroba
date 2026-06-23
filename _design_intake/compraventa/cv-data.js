// arroba.com — Home de Compra/Vende · datos mock
window.CV_DATA = {
  user: 'Daniel',

  chips: [
    { label: 'Quiero vender mi empresa', icon: 'tag' },
    { label: 'Buscar empresas en venta', icon: 'search' },
    { label: 'Agencias digitales', icon: 'trending' },
    { label: 'Clínicas veterinarias', icon: 'deal' },
    { label: 'Compradores para mi sector', icon: 'handshake' },
    { label: 'Captar inversión', icon: 'euro' },
    { label: 'Software', icon: 'layers' },
    { label: 'Empresas industriales', icon: 'agency' },
  ],

  recent: [
    'Clínicas veterinarias · 9 targets',
    'Compradores · Making Science',
    'Agencias en venta · Andalucía',
    'Inversores · Software B2B',
  ],

  kpis: [
    { icon: 'deal', value: '1.284', label: 'Oportunidades activas', sub: 'En el mercado', delta: '12%', dir: 'up', good: true },
    { icon: 'handshake', value: '342', label: 'Operaciones cerradas', sub: 'Últimos 12 meses', delta: '9%', dir: 'up', good: true },
    { icon: 'trending', value: '2.106', label: 'Compradores e inversores', sub: 'Activos ahora', delta: '21%', dir: 'up', good: true },
  ],

  opportunities: [
    { icon: 'tag',       tint: '#1A8A4A', bg: '#E8F5EE', bd: '#C2E8D0', title: 'Empresas en venta', desc: 'Compañías que han abierto un proceso de venta.' },
    { icon: 'deal',      tint: '#2164E3', bg: '#E8EFFE', bd: '#C0D3FA', title: 'Oportunidades de consolidación', desc: 'Sectores fragmentados con potencial de buy & build.' },
    { icon: 'handshake', tint: '#7C3AED', bg: '#F1E9FE', bd: '#DDC9F9', title: 'Compradores buscando', desc: 'Corporates y fondos con mandato de compra activo.' },
    { icon: 'euro',      tint: '#D97708', bg: '#FEF3E2', bd: '#FCD9A3', title: 'Inversores con capital disponible', desc: 'Fondos buscando dónde desplegar capital.' },
  ],

  // Sectores con más actividad de M&A — escala sobre 100 (nº operaciones relativo)
  sectors: [
    { name: 'Tecnología y Software', ops: '187', value: 94 },
    { name: 'Salud y Farma', ops: '156', value: 82 },
    { name: 'Servicios B2B', ops: '134', value: 71 },
    { name: 'Veterinaria', ops: '98', value: 62 },
    { name: 'Industria', ops: '87', value: 55 },
    { name: 'Agencias digitales', ops: '74', value: 47 },
  ],

  // Oportunidades recientes en el mercado
  deals: [
    { name: 'Clínica Veterinaria Vallés', sector: 'Veterinaria', tag: 'En venta', tagType: 'venta', when: 'Hoy', initial: 'C', color: '#1A8A4A' },
    { name: 'Kitchen', sector: 'Tecnología y Software', tag: 'Sell-side', tagType: 'venta', when: 'Ayer', initial: 'K', color: '#2164E3' },
    { name: 'Quickads', sector: 'Marketing y Publicidad', tag: 'Capital', tagType: 'capital', when: 'Hace dos días', initial: 'Q', color: '#D97708' },
    { name: 'Grupo VetPartners', sector: 'Veterinaria', tag: 'Comprando', tagType: 'compra', when: 'Hace tres días', initial: 'G', color: '#7C3AED' },
  ],

  footerCount: '1.284',
};
