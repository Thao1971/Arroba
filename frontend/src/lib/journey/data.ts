/**
 * Registration Journey — catálogo + tipos.
 *
 * Port directo de /app/_design_intake/registro/rj-data.js a TypeScript.
 * El contenido es **scripted** (no LLM): el orquestador sigue la conversación
 * paso a paso. La interactividad de empresas usa la lista de demo de abajo
 * (cinco empresas demo); el proveedor de datos real entra en E1.2+.
 */

export type IntentId = 'comprar' | 'vender' | 'financiar' | 'explorar';
export type AboutId = 'empresa' | 'invierto' | 'asesor' | 'empezando';

export interface IntentOption {
  id: IntentId;
  title: string;
  desc: string;
  icon: 'target' | 'handshake' | 'trend' | 'compass';
  entity: string | null;
}

export interface AboutOption {
  id: AboutId;
  title: string;
  desc: string;
  icon: 'building' | 'trend' | 'users' | 'compass';
}

export interface DemoCompany {
  id: string;
  name: string;
  razon: string;
  cif: string;
  forma: string;
  sector: string;
  city: string;
  province: string;
  cnae: string;
  web: string;
  revenue: string;
  ebitda: string;
  employees: number;
  desc: string;
}

export type StepType = 'single' | 'multi';

export interface BranchStep {
  id: string;
  type: StepType;
  field: 'objetivo' | 'plazo';
  q: string;
  hint?: string;
  chips: readonly string[];
}

export interface Flow {
  entity: string;
  vehicleQ?: string;
  vehicleHint?: string;
  companyQ?: string;
  companyHint?: string;
  steps: readonly BranchStep[];
}

export const INTENTS: readonly IntentOption[] = [
  { id: 'comprar', title: 'Comprar empresas', desc: 'Quiero crecer mediante adquisiciones.', icon: 'target', entity: 'Tesis de Inversión' },
  { id: 'vender', title: 'Vender una empresa', desc: 'Quiero explorar una operación.', icon: 'handshake', entity: 'Oportunidad potencial' },
  { id: 'financiar', title: 'Conseguir financiación', desc: 'Quiero impulsar el crecimiento.', icon: 'trend', entity: 'Caso de Capital' },
  { id: 'explorar', title: 'Solo explorar', desc: 'Todavía no tengo algo concreto en mente.', icon: 'compass', entity: null },
];

export const ABOUT_OPTIONS: readonly AboutOption[] = [
  { id: 'empresa', title: 'Tengo una empresa', desc: 'Una cadena de panaderías, una agencia o una empresa industrial.', icon: 'building' },
  { id: 'invierto', title: 'Invierto en empresas', desc: 'Family office, fondo o search fund.', icon: 'trend' },
  { id: 'asesor', title: 'Soy asesor y trabajo para clientes', desc: 'M&A, corporate finance o consultoría.', icon: 'users' },
  { id: 'empezando', title: 'Estoy empezando', desc: 'Aún estoy explorando qué puedo hacer en arroba.', icon: 'compass' },
];

export const COMPANIES_DEMO: readonly DemoCompany[] = [
  { id: 'kitchen', name: 'Kitchen', razon: 'Kitchen Studio, S.L.', cif: 'B-86 540 112', forma: 'Sociedad Limitada', sector: 'Tecnología y software', city: 'Madrid', province: 'Madrid', cnae: '6201', web: 'kitchen.studio', revenue: '5,4M€', ebitda: '1,1M€', employees: 47, desc: 'Estudio de producto digital y desarrollo de software a medida para grandes marcas.' },
  { id: 'olmedo', name: 'Grupo Olmedo Hoteles', razon: 'Grupo Olmedo Hoteles, S.L.', cif: 'B-47 594 478', forma: 'Sociedad Limitada', sector: 'Hoteles y turismo termal', city: 'Olmedo', province: 'Valladolid', cnae: '5510', web: 'castillatermal.com', revenue: '32,0M€', ebitda: '8,2M€', employees: 81, desc: 'Holding hotelero especializado en turismo termal.' },
  { id: 'munoz', name: 'Muñoz Comunicación', razon: 'Muñoz Comunicación, S.L.', cif: 'B-85 412 003', forma: 'Sociedad Limitada', sector: 'Marketing y publicidad', city: 'Madrid', province: 'Madrid', cnae: '7311', web: 'munozcomunicacion.es', revenue: '4,2M€', ebitda: '0,76M€', employees: 38, desc: 'Agencia independiente de comunicación y publicidad.' },
  { id: 'pena', name: 'Construcciones Peña y Asociados', razon: 'Construcciones Peña y Asociados, S.A.', cif: 'A-47 118 562', forma: 'Sociedad Anónima', sector: 'Construcción', city: 'Valladolid', province: 'Valladolid', cnae: '4121', web: 'construccionespena.es', revenue: '18,6M€', ebitda: '2,4M€', employees: 142, desc: 'Constructora familiar con foco en obra civil.' },
  { id: 'quickads', name: 'Quickads', razon: 'Quickads Technologies, S.L.', cif: 'B-67 220 945', forma: 'Sociedad Limitada', sector: 'Tecnología y software', city: 'Barcelona', province: 'Barcelona', cnae: '6201', web: 'quickads.io', revenue: '3,1M€', ebitda: '0,4M€', employees: 29, desc: 'Plataforma SaaS de generación y optimización de anuncios con IA.' },
];

export const FLOWS: Record<Exclude<IntentId, 'explorar'>, Flow> = {
  comprar: {
    entity: 'Tesis de Inversión',
    vehicleQ: '¿Desde qué empresa o vehículo te gustaría realizar las adquisiciones?',
    vehicleHint: 'Busca tu empresa por nombre o CIF, o escríbelo si aún no la tienes.',
    steps: [
      { id: 'objetivo', type: 'single', field: 'objetivo', q: '¿Cuál es tu principal objetivo?', chips: ['Reforzar mi negocio actual', 'Incorporar nuevos servicios o capacidades', 'Entrar en nuevos sectores', 'Expandirme geográficamente', 'Aprovechar oportunidades especiales'] },
      { id: 'plazo', type: 'single', field: 'plazo', q: '¿En qué plazo te gustaría realizar una adquisición?', chips: ['Ahora', 'En los próximos 12 meses', 'Más adelante'] },
    ],
  },
  vender: {
    entity: 'Oportunidad potencial',
    companyQ: 'Indícame la razón social o el CIF de tu empresa.',
    companyHint: 'Construiré su ficha automáticamente a partir de nuestra base de datos.',
    steps: [
      { id: 'objetivo', type: 'multi', field: 'objetivo', q: '¿Qué te gustaría hacer con esta empresa?', hint: 'Puedes elegir varias.', chips: ['Conocer cuánto vale', 'Explorar una posible venta', 'Incorporar un socio', 'Buscar financiación', 'Prepararla para crecer', 'Fusionarla con otra empresa'] },
      { id: 'plazo', type: 'single', field: 'plazo', q: '¿En qué plazo te planteas una operación?', chips: ['Ahora', 'En los próximos 12 meses', 'Más adelante'] },
    ],
  },
  financiar: {
    entity: 'Caso de Capital',
    companyQ: 'Indícame la razón social o el CIF de tu empresa.',
    companyHint: 'Construiré su ficha automáticamente a partir de nuestra base de datos.',
    steps: [
      { id: 'objetivo', type: 'multi', field: 'objetivo', q: '¿Para qué te gustaría conseguir financiación?', hint: 'Puedes elegir varias.', chips: ['Crecer', 'Comprar empresas', 'Internacionalizar', 'Lanzar nuevos productos', 'Reforzar la estructura financiera'] },
      { id: 'plazo', type: 'single', field: 'plazo', q: '¿En qué plazo te gustaría conseguir financiación?', chips: ['Ahora', 'En los próximos 12 meses', 'Más adelante'] },
    ],
  },
};

export const PLAZO_LONG: Record<string, string> = {
  Ahora: 'de forma inmediata',
  'En los próximos 12 meses': 'en los próximos 12 meses',
  'Más adelante': 'más adelante',
};
