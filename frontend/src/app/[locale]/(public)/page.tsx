'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  LineChart,
  Scale,
  Handshake,
  Users,
  TrendingUp,
  Building,
  Layers,
  BarChart3,
  ShieldCheck,
  Briefcase,
  Globe,
  Code2,
  Bot,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {
  HeroBlock,
  CTABlock,
  MetricsBlock,
  FeatureCardBlock,
} from '@/components/blocks';
import { useCopilot } from '@/components/copilot';
import { PublicFooter } from '@/components/home/PublicFooter';
import { CopilotDemoTeaser } from '@/components/home/CopilotDemoTeaser';

const HERO_PLACEHOLDERS = [
  '¿Cuánto vale mi empresa?',
  'Quiero vender mi compañía',
  'Quiero comprar una empresa',
  'Cómo está mi empresa frente a la competencia',
  'Empresas industriales en Valencia',
];

const MOVEMENTS = [
  {
    id: 'analizar',
    rank: '01',
    icon: LineChart,
    title: 'Analizar',
    description: 'Cruza 5 capas de inteligencia sobre cualquier empresa, sector o territorio. Financieros, señales, ownership, contratación pública y comercio exterior — en una sola ficha.',
    bullets: ['Ficha 360° de cada compañía', 'Scores de oportunidad y riesgo', 'Señales detectadas por IA'] as const,
    tone: 'default' as const,
  },
  {
    id: 'valorar',
    rank: '02',
    icon: Scale,
    title: 'Valorar',
    description: 'El análisis se convierte en un número. Valoración indicativa por múltiplos y comparables reales del sector, con cada palanca trazada a los datos que acabas de ver.',
    bullets: ['Rango de valor explicado', 'Múltiplos sectoriales reales', 'Drivers que mueven el precio'] as const,
    tone: 'dark' as const,
  },
  {
    id: 'compraventa',
    rank: '03',
    icon: Handshake,
    title: 'Comprar o vender',
    description: 'El precio te lleva a una contraparte. Compradores e inversores que encajan con la tesis, con su match score, y el primer paso de la operación sin salir de la plataforma.',
    bullets: ['Compradores por encaje', 'Teaser y NDA en un clic', 'Del análisis al deal'] as const,
    tone: 'accent' as const,
  },
];

const INTELLIGENCE_LAYERS = [
  { id: 'economic', icon: LineChart, title: 'Economic Intelligence', description: 'Casi 5.000 métricas económicas que dan contexto a cada cifra.' },
  { id: 'market', icon: BarChart3, title: 'Market Intelligence', description: 'Sectores, mercados y tendencias en tiempo real.' },
  { id: 'company', icon: Building, title: 'Company Intelligence', description: 'Cuentas P&G, balances, órganos de gobierno y propiedad de cada empresa.' },
  { id: 'investor', icon: Users, title: 'Investor Intelligence', description: 'Fondos, family offices y compradores corporativos.' },
  { id: 'ma', icon: Briefcase, title: 'M&A Intelligence', description: 'Oportunidades, matching y operaciones del mercado.' },
];

const OPPORTUNITY_PATTERNS = [
  { id: 'relevo', icon: Users, title: 'Relevo generacional', description: 'Fundadores sin sucesión definida.' },
  { id: 'consolidacion', icon: Layers, title: 'Consolidación regional', description: 'Compañías agrupables en una plataforma.' },
  { id: 'capital', icon: TrendingUp, title: 'Captación de capital', description: 'Crecimiento limitado por financiación.' },
  { id: 'venta', icon: Handshake, title: 'Venta potencial', description: 'Señales de salida del accionariado.' },
  { id: 'crecimiento', icon: BarChart3, title: 'Crecimiento acelerado', description: 'Compañías superando a su sector.' },
  { id: 'actores', icon: ShieldCheck, title: 'Actores relevantes', description: 'Quién puede materializar la operación.' },
];

const AGENT_READY = [
  { id: 'web', icon: Globe, title: 'Web humana', description: 'La plataforma completa en tu navegador.' },
  { id: 'api', icon: Code2, title: 'API estructurada', description: 'Integra la inteligencia en tus sistemas.' },
  { id: 'mcp', icon: Bot, title: 'MCP para agentes', description: 'Acceso para agentes de IA autorizados.' },
];

export default function HomePage() {
  const { isAuthenticated, isLoading, memberships } = useAuth();
  const router = useRouter();

  // Authenticated users get routed to the private dashboard (Sprint 1 · F5).
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    router.replace(
      memberships && memberships.length === 0 ? '/onboarding' : '/inicio',
    );
  }, [isAuthenticated, isLoading, memberships, router]);

  return (
    <div data-testid="public-home">
      {/* ======= HERO ======= */}
      <section className="px-6 pt-16 md:pt-24 pb-12 max-w-6xl mx-auto">
        <HeroBlock
          eyebrow="ARROBA · DECISION INTELLIGENCE"
          title={<>¿Qué quieres hacer con tu compañía?</>}
          subtitle={
            <>
              Analiza mercados, valora empresas y descubre oportunidades para
              crecer, comprar, vender o atraer inversión desde una única
              plataforma.
            </>
          }
          actions={
            <>
              <Link
                href="/registro"
                data-testid="home-hero-cta-register"
                className="inline-flex items-center gap-2 h-12 px-5 rounded-[12px] bg-primary text-white font-body text-sm font-bold hover:bg-primary-hover transition-colors"
              >
                Crear cuenta <ArrowRight size={16} strokeWidth={1.6} />
              </Link>
              <Link
                href="/login"
                data-testid="home-hero-cta-explore"
                className="inline-flex items-center h-12 px-5 rounded-[12px] border-[1.5px] border-border-strong bg-surface text-text font-body text-sm font-semibold hover:bg-surface-2 transition-colors"
              >
                Acceder
              </Link>
            </>
          }
        >
          <HeroSearchTeaser />
        </HeroBlock>
      </section>

      {/* ======= 3 movements (Analizar / Valorar / Comprar-Vender) ======= */}
      <section className="px-6 pb-16 max-w-6xl mx-auto" data-testid="home-movements">
        <SectionHeader
          eyebrow="Los 3 movimientos"
          title="De entender, a poner precio, a actuar."
        />
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {MOVEMENTS.map((m) => (
            <FeatureCardBlock
              key={m.id}
              rank={m.rank}
              icon={m.icon}
              title={m.title}
              description={m.description}
              bullets={m.bullets}
              tone={m.tone}
              testId={`home-movement-${m.id}`}
            />
          ))}
        </div>
      </section>

      {/* ======= MetricsBlock (data mode) ======= */}
      <section className="px-6 py-16 border-y border-border bg-surface" data-testid="home-stats">
        <div className="max-w-6xl mx-auto">
          <MetricsBlock
            mode="data"
            eyebrow="LA ESCALA DEL DATO"
            title="Casi 5.000 métricas económicas, miles de empresas, una sola plataforma."
            testId="home-metrics"
          />
          <p className="text-center text-xs text-text-subtle mt-6">
            Datos agregados en tiempo real desde arroba.com
          </p>
        </div>
      </section>

      {/* ======= 5 intelligence layers ======= */}
      <section className="px-6 py-16 max-w-6xl mx-auto" data-testid="home-layers">
        <SectionHeader
          eyebrow="5 capas de inteligencia"
          title="Una compañía no se entiende sin su contexto."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {INTELLIGENCE_LAYERS.map((l) => (
            <FeatureCardBlock
              key={l.id}
              icon={l.icon}
              title={l.title}
              description={l.description}
              testId={`home-layer-${l.id}`}
            />
          ))}
          <div className="rounded-2xl bg-surface-2 border border-border p-6 md:p-7 flex flex-col justify-center items-start text-text-muted">
            <Sparkles size={18} strokeWidth={1.5} className="text-primary mb-3" />
            <p className="text-sm leading-relaxed">
              Cada capa lleva un agente de IA especializado. El Copilot orquesta
              entre capas según lo que estés haciendo.
            </p>
          </div>
        </div>
      </section>

      {/* ======= Differentiator banner ======= */}
      <section className="px-6 py-12 max-w-6xl mx-auto" data-testid="home-moat">
        <HeroBlock
          variant="banner"
          tone="dark"
          eyebrow="La diferencia"
          title={<>La única plataforma que ayuda a decidir.</>}
          subtitle={
            <>
              Arroba conecta empresas, sectores, mercados y operaciones para
              ayudarte a tomar mejores decisiones. No sustituye tu criterio: te
              proporciona contexto, señales y oportunidades para decidir con
              mayor confianza — cruzando cerca de 5.000 métricas económicas que
              sitúan cada compañía en su contexto real.
            </>
          }
          testId="home-moat-hero"
        />
      </section>

      {/* ======= Opportunity engine ======= */}
      <section className="px-6 py-16 max-w-6xl mx-auto" data-testid="home-opportunities">
        <SectionHeader
          eyebrow="Opportunity Engine"
          title="6 patrones, miles de oportunidades."
          subtitle="No buscamos empresas: detectamos situaciones donde el cruce de capas dispara una decisión."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {OPPORTUNITY_PATTERNS.map((o) => (
            <FeatureCardBlock
              key={o.id}
              icon={o.icon}
              title={o.title}
              description={o.description}
              testId={`home-opportunity-${o.id}`}
            />
          ))}
        </div>
      </section>

      {/* ======= Copilot demo ======= */}
      <section className="px-6 py-16 max-w-5xl mx-auto" data-testid="home-copilot-section">
        <SectionHeader
          eyebrow="EL COPILOT"
          title="Una conversación. Una decisión."
          subtitle="Te muestro cómo el Copilot orquesta capas, señales y oportunidades en pocos segundos."
        />
        <div className="mt-8">
          <CopilotDemoTeaser />
        </div>
        <p className="text-center text-xs text-text-subtle mt-5">
          Demo determinista pre-grabada. El Copilot real con IA conversacional
          completa entra en E1.3.
        </p>
      </section>

      {/* ======= Agent-ready ======= */}
      <section className="px-6 py-16 max-w-6xl mx-auto" data-testid="home-agent-ready">
        <SectionHeader
          eyebrow="Agent-ready"
          title="Diseñada para personas, equipos y agentes de IA."
          subtitle="Arroba está preparada para ser utilizada por usuarios humanos, equipos profesionales y agentes de IA autorizados mediante web, API y MCP."
        />
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {AGENT_READY.map((a) => (
            <FeatureCardBlock
              key={a.id}
              icon={a.icon}
              title={a.title}
              description={a.description}
              testId={`home-agent-${a.id}`}
            />
          ))}
        </div>
      </section>

      {/* ======= Final CTA ======= */}
      <section className="px-6 py-16 max-w-5xl mx-auto" data-testid="home-final-cta">
        <CTABlock
          title="Del dato a la decisión, sin salir de la plataforma."
          body="Empieza tu cuenta, define tu primera operación y deja que el Copilot te abra el camino."
          actions={[
            { label: 'Crear cuenta', href: '/registro', variant: 'primary', testId: 'home-final-cta-register' },
            { label: 'Acceder', href: '/login', variant: 'secondary', testId: 'home-final-cta-login' },
          ]}
        />
      </section>

      <PublicFooter />
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="text-center max-w-2xl mx-auto">
      {eyebrow && (
        <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-primary mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-text-muted leading-relaxed">{subtitle}</p>
      )}
    </header>
  );
}

/**
 * Buscador del hero — funcional. Cablea al Copilot canónico (mismo flujo que el
 * dock/barra inferior): `useCopilot().send()` resuelve un CIF puro a su ficha,
 * resuelve una entidad por nombre → navega a `/empresa/{cif}`, o pinta los
 * resultados de la búsqueda en la barra. Sin lógica paralela: reutiliza el
 * orquestador cliente y el skill público `/api/copilot/skills/search`.
 */
function HeroSearchTeaser() {
  const { openDock, send, loading } = useCopilot();
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);

  // Placeholder rotativo: da vida y sugiere los tipos de consulta soportados.
  useEffect(() => {
    const id = setInterval(
      () => setPhIdx((i) => (i + 1) % HERO_PLACEHOLDERS.length),
      3200,
    );
    return () => clearInterval(id);
  }, []);

  function submit() {
    const q = query.trim();
    if (!q) return;
    openDock();
    void send(q);
  }

  return (
    <form
      data-testid="home-hero-search-teaser"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="mx-auto max-w-xl flex items-center gap-2 px-4 h-14 rounded-[14px] border-[1.5px] border-border-strong bg-surface shadow-sm transition-colors focus-within:border-primary"
    >
      <Compass size={18} strokeWidth={1.6} className="text-text-subtle shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={HERO_PLACEHOLDERS[phIdx]}
        aria-label="Buscar empresas, sectores o territorios"
        data-testid="home-hero-search-input"
        className="flex-1 h-full bg-transparent border-none outline-none text-[15px] text-text font-body placeholder:text-text-subtle"
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        data-testid="home-hero-search-submit"
        aria-label="Buscar"
        className="inline-flex items-center justify-center h-9 w-9 rounded-[10px] bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <ArrowRight size={16} strokeWidth={1.8} />
      </button>
    </form>
  );
}
