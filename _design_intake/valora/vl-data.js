// arroba.com — Home de Valora · datos mock
window.VL_DATA = {
  user: 'Daniel',

  // Aproximación gratuita de ejemplo (última valoración rápida del usuario)
  approx: {
    company: 'Grupo Olmedo Hoteles',
    sector: 'Hoteles y alojamientos',
    initial: 'G',
    ebitda: '1,87 M€',
    mult: '7,9x',
    low: '12,4 M€', base: '15,6 M€', high: '19,1 M€',
    conf: 'Media',
  },

  // Próximas mejores acciones (todas consumen créditos → monetización)
  nextActions: [
    { icon: 'valuation', tint: '#E8001D', title: 'Valoración avanzada', desc: 'DCF, comparables, escenarios y sensibilidad.', cost: '75 créditos', href: 'Valoracion Avanzada.html', primary: true },
    { icon: 'document',  tint: '#2164E3', title: 'Descargar informe', desc: 'Informe profesional en PDF, listo para compartir.', cost: '15 créditos', href: 'Valoracion Avanzada.html' },
    { icon: 'chartBar',  tint: '#7C3AED', title: 'Comparar con el sector', desc: 'Posición vs. múltiplos y percentiles del sector.', cost: '8 créditos', href: 'Ficha Sectorial.html' },
    { icon: 'deal',      tint: '#1A8A4A', title: 'Compradores potenciales', desc: 'Quién pagaría más por esta compañía.', cost: '12 créditos', href: 'Compra-Vende.html' },
  ],

  chips: [
    { label: '¿Cuánto vale mi empresa?', icon: 'euro' },
    { label: 'Making Science', icon: 'agency' },
    { label: 'Agencias digitales', icon: 'trending' },
    { label: 'Empresas industriales', icon: 'agency' },
    { label: 'Clínicas veterinarias', icon: 'deal' },
    { label: 'Comparar múltiplos', icon: 'chartBar' },
    { label: 'Software', icon: 'layers' },
    { label: 'Sector salud', icon: 'health' },
  ],

  recent: [
    'Making Science · 7,1x EBITDA',
    'Samy Alliance · 6,2x EBITDA',
    'Havas Media · 5,8x EBITDA',
    'Good Rebels · 5,7x EBITDA',
  ],

  kpis: [
    { icon: 'chartBar', value: '5,6x', label: 'Múltiplo mediano del mercado', sub: 'España', delta: '0,4x', dir: 'up', good: true },
    { icon: 'deal', value: '2.317', label: 'Operaciones comparables', sub: 'Últimos 24 meses', delta: '18%', dir: 'up', good: true },
    { icon: 'euro', value: '18.452', label: 'Valoraciones realizadas', sub: 'Últimos 12 meses', delta: '26%', dir: 'up', good: true },
  ],

  // Valoraciones por sector (rango orientativo de múltiplo)
  sectors: [
    { name: 'Veterinaria', mult: '9,1x', value: 91 },
    { name: 'Software', mult: '8,4x', value: 84 },
    { name: 'Salud', mult: '7,8x', value: 78 },
    { name: 'Servicios B2B', mult: '7,2x', value: 72 },
    { name: 'Industria', mult: '6,3x', value: 63 },
    { name: 'Agencias digitales', mult: '5,6x', value: 56 },
  ],

  valuations: [
    { name: 'Making Science', sector: 'Tecnología y Software', mult: '7,1x EBITDA', when: 'Hoy', initial: 'M', color: '#2164E3' },
    { name: 'Samy Alliance', sector: 'Marketing y Publicidad', mult: '6,2x EBITDA', when: 'Ayer', initial: 'S', color: '#0C0C0E' },
    { name: 'Good Rebels', sector: 'Marketing y Publicidad', mult: '5,7x EBITDA', when: 'Hace dos días', initial: 'G', color: '#1A8A4A' },
    { name: 'Havas Media', sector: 'Marketing y Publicidad', mult: '5,8x EBITDA', when: 'Hace tres días', initial: 'H', color: '#E8001D' },
  ],

  footerCount: '18.452',
};
