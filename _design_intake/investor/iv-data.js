// arroba.com — Investor Intelligence · datos mock
window.IV_DATA = {
  user: 'Daniel',

  chips: [
    { label: 'Private Equity', icon: 'deal' },
    { label: 'Venture Capital', icon: 'trending' },
    { label: 'Family offices', icon: 'agency' },
    { label: 'Search funds', icon: 'search' },
    { label: 'Fondos de deuda', icon: 'euro' },
    { label: 'Inversores en software', icon: 'layers' },
    { label: 'Capital para expansión', icon: 'trending' },
    { label: 'Comparar tesis de inversión', icon: 'chartBar' },
  ],

  recent: [
    'Meridia Capital · PE',
    'Inversores · software B2B',
    'Family offices · Cataluña',
    'Search funds · industria',
  ],

  kpis: [
    { icon: 'agency', value: '2.106', label: 'Inversores activos', sub: 'En España', delta: '21%', dir: 'up', good: true },
    { icon: 'euro', value: '18.400M€', label: 'Capital disponible', sub: 'Dry powder estimado', delta: '12%', dir: 'up', good: true },
    { icon: 'deal', value: '342', label: 'Operaciones cerradas', sub: 'Últimos 12 meses', delta: '9%', dir: 'up', good: true },
  ],

  opportunities: [
    { icon: 'trending', tint: '#1A8A4A', bg: '#E8F5EE', bd: '#C2E8D0', title: 'Inversores buscando en tu sector', desc: 'Fondos con tesis activa que encajan con tu compañía.' },
    { icon: 'euro',     tint: '#2164E3', bg: '#E8EFFE', bd: '#C0D3FA', title: 'Fondos con dry powder', desc: 'Capital comprometido pendiente de desplegar este año.' },
    { icon: 'agency',   tint: '#7C3AED', bg: '#F1E9FE', bd: '#DDC9F9', title: 'Family offices activos', desc: 'Capital paciente buscando posiciones a largo plazo.' },
    { icon: 'search',   tint: '#D97708', bg: '#FEF3E2', bd: '#FCD9A3', title: 'Search funds en busca', desc: 'Compradores individuales buscando una compañía que dirigir.' },
  ],

  // Inversores más activos — escala sobre 100 (nº operaciones relativo)
  investors: [
    { name: 'Meridia Capital', type: 'Private Equity', ops: '23', value: 96 },
    { name: 'Nazca Capital', type: 'Private Equity', ops: '19', value: 84 },
    { name: 'Kibo Ventures', type: 'Venture Capital', ops: '17', value: 76 },
    { name: 'GED Capital', type: 'Private Equity', ops: '14', value: 64 },
    { name: 'Samaipata', type: 'Venture Capital', ops: '12', value: 56 },
    { name: 'Alantra PE', type: 'Private Equity', ops: '11', value: 50 },
  ],

  // Últimas operaciones de inversión / capital
  deals: [
    { name: 'Cloud Iberia', sector: 'Software', round: 'Serie B', amount: '28M€', investor: 'Kibo Ventures', when: 'Hoy', initial: 'C', color: '#2164E3' },
    { name: 'Quickads', sector: 'Marketing', round: 'Growth', amount: '12M€', investor: 'Samaipata', when: 'Ayer', initial: 'Q', color: '#D97708' },
    { name: 'VetPartners Iberia', sector: 'Veterinaria', round: 'Buyout', amount: '85M€', investor: 'Meridia Capital', when: 'Hace dos días', initial: 'V', color: '#1A8A4A' },
    { name: 'Datatec', sector: 'IT Services', round: 'Minoritaria', amount: '9M€', investor: 'GED Capital', when: 'Hace tres días', initial: 'D', color: '#7C3AED' },
  ],

  footerCount: '2.106',
};
