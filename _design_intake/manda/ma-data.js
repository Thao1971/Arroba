// arroba.com — M&A Intelligence · datos mock
window.MA_DATA = {
  user: 'Daniel',

  chips: [
    { label: 'Operaciones recientes', icon: 'deal' },
    { label: 'Múltiplos por sector', icon: 'chartBar' },
    { label: 'Compradores activos', icon: 'handshake' },
    { label: 'Procesos abiertos', icon: 'layers' },
    { label: 'Consolidación veterinaria', icon: 'trending' },
    { label: 'M&A en software', icon: 'agency' },
    { label: 'Levantamientos de capital', icon: 'euro' },
    { label: 'Comparar operaciones', icon: 'search' },
  ],

  recent: [
    'M&A · software B2B',
    'Múltiplos · alimentación',
    'Buyouts · 2026',
    'Consolidación · clínicas',
  ],

  kpis: [
    { icon: 'deal', value: '1.847', label: 'Operaciones (12m)', sub: 'Cerradas en España', delta: '14%', dir: 'up', good: true },
    { icon: 'chartBar', value: '7,4x', label: 'Múltiplo mediano', sub: 'EV/EBITDA', delta: '0,3x', dir: 'up', good: true },
    { icon: 'euro', value: '23.600M€', label: 'Volumen transaccionado', sub: 'Últimos 12 meses', delta: '19%', dir: 'up', good: true },
  ],

  opportunities: [
    { icon: 'trending', tint: '#1A8A4A', bg: '#E8F5EE', bd: '#C2E8D0', title: 'Sectores en consolidación', desc: 'Mercados fragmentados con buy & build acelerándose.' },
    { icon: 'handshake', tint: '#2164E3', bg: '#E8EFFE', bd: '#C0D3FA', title: 'Compradores en búsqueda activa', desc: 'Corporates y fondos con mandato de compra abierto.' },
    { icon: 'layers',   tint: '#7C3AED', bg: '#F1E9FE', bd: '#DDC9F9', title: 'Procesos de venta abiertos', desc: 'Compañías que han iniciado un proceso formal.' },
    { icon: 'chartBar', tint: '#D97708', bg: '#FEF3E2', bd: '#FCD9A3', title: 'Expansión de múltiplos', desc: 'Sectores donde el precio de las operaciones sube.' },
  ],

  // Sectores con más actividad M&A — escala sobre 100
  sectors: [
    { name: 'Tecnología y Software', ops: '312', value: 96 },
    { name: 'Salud y Farma', ops: '241', value: 82 },
    { name: 'Servicios B2B', ops: '198', value: 70 },
    { name: 'Energía', ops: '167', value: 60 },
    { name: 'Alimentación', ops: '154', value: 55 },
    { name: 'Veterinaria', ops: '121', value: 44 },
  ],

  // Últimas operaciones de M&A
  deals: [
    { name: 'Minsait → Nexus Digital', sector: 'Software', type: 'Adquisición', mult: '11,2x', value: '45M€', when: 'Hoy', initial: 'N', color: '#2164E3', kind: 'acq' },
    { name: 'VetPartners → Clínica Vallés', sector: 'Veterinaria', type: 'Buy & build', mult: '9,4x', value: '18M€', when: 'Ayer', initial: 'V', color: '#1A8A4A', kind: 'acq' },
    { name: 'Kitchen', sector: 'Tecnología', type: 'Sell-side', mult: '8,2x', value: '8,2M€', when: 'Hace dos días', initial: 'K', color: '#7C3AED', kind: 'sale' },
    { name: 'GMV → SecureNet', sector: 'Ciberseguridad', type: 'Adquisición', mult: '10,1x', value: '19M€', when: 'Hace tres días', initial: 'S', color: '#D97708', kind: 'acq' },
  ],

  footerCount: '1.847',
};
