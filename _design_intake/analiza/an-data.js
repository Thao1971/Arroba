// arroba.com — Home de Analiza · datos mock
window.AN_DATA = {
  user: 'Daniel',

  chips: [
    { label: 'Empresas industriales en Valencia', icon: 'agency' },
    { label: 'Sector salud', icon: 'health' },
    { label: 'Agencias digitales', icon: 'trending' },
    { label: 'Empresas de IA', icon: 'layers' },
    { label: '¿Cuánto vale mi sector?', icon: 'euro' },
    { label: 'Consolidación veterinaria', icon: 'deal' },
    { label: 'Empresas con crecimiento >20%', icon: 'chartBar' },
  ],

  recent: ['Havas Media', 'Veterinarias en Madrid', 'Agencias creativas', 'Empresas de IA'],

  kpis: [
    { icon: 'agency', value: '3,31M', label: 'Empresas activas', sub: 'España', delta: '2,4%', dir: 'up', good: true },
    { icon: 'trending', value: '+14.307', label: 'Nuevas empresas', sub: 'Último mes', delta: '8,7%', dir: 'up', good: true },
    { icon: 'close', value: '+2.100', label: 'Empresas cerradas', sub: 'Último mes', delta: '3,1%', dir: 'up', good: false },
  ],

  opportunities: [
    { icon: 'deal',     tint: '#1A8A4A', bg: '#E8F5EE', bd: '#C2E8D0', title: 'Consolidación en clínicas veterinarias', desc: 'Alta actividad de M&A y múltiplos al alza.' },
    { icon: 'chartBar', tint: '#2164E3', bg: '#E8EFFE', bd: '#C0D3FA', title: 'Empresas industriales con fuerte crecimiento', desc: 'Sectores exportadores con buena tracción.' },
    { icon: 'health',   tint: '#7C3AED', bg: '#F1E9FE', bd: '#DDC9F9', title: 'Sector salud con elevada actividad M&A', desc: 'Interés creciente de fondos y corporates.' },
    { icon: 'agency',   tint: '#D97708', bg: '#FEF3E2', bd: '#FCD9A3', title: 'Agencias digitales en Andalucía', desc: 'Oportunidades de consolidación regional.' },
  ],

  sectors: [
    { name: 'Salud', value: 92 },
    { name: 'Tecnología y Software', value: 87 },
    { name: 'Energía', value: 78 },
    { name: 'Servicios Industriales', value: 74 },
    { name: 'Veterinaria', value: 71 },
    { name: 'Retail', value: 68 },
  ],

  companies: [
    { name: 'Havas Media', sector: 'Marketing y Publicidad', when: 'Hoy, 11:23', initial: 'H', color: '#E8001D' },
    { name: 'Samy Alliance', sector: 'Marketing y Publicidad', when: 'Ayer, 17:08', initial: 'S', color: '#0C0C0E' },
    { name: 'Making Science', sector: 'Tecnología y Software', when: 'Ayer, 10:32', initial: 'M', color: '#2164E3' },
    { name: 'Sngular', sector: 'Tecnología y Software', when: '2 días atrás', initial: 'S', color: '#7C3AED' },
    { name: 'Good Rebels', sector: 'Marketing y Publicidad', when: '3 días atrás', initial: 'G', color: '#1A8A4A' },
    { name: 'Publicis España', sector: 'Marketing y Publicidad', when: '3 días atrás', initial: 'P', color: '#D97708' },
  ],

  footerCount: '5.265',
};
