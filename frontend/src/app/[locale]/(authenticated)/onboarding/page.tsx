'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  Handshake,
  TrendingUp,
  Compass,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/contexts/auth-context';
import { CopilotBubble, UserBubble, Typing } from '@/components/journey/Bubbles';
import { AnswerCard, Chip, ProgressDots } from '@/components/journey/Answers';
import { CompanyPicker } from '@/components/journey/CompanyPicker';
import { CompanyConfirm } from '@/components/journey/CompanyConfirm';
import { ValidationStep } from '@/components/journey/ValidationStep';
import { Card } from '@/components/ds';
import {
  INTENTS,
  ABOUT_OPTIONS,
  FLOWS,
  type IntentId,
  type MockCompany,
} from '@/lib/journey/data';
import type { JourneyState } from '@/lib/journey/derive';
import { apiClient, ApiError } from '@/lib/api/client';
import { isValidSpanishTaxId } from '@/lib/validators';

const INTENT_ICONS = { target: Target, handshake: Handshake, trend: TrendingUp, compass: Compass } as const;
const ABOUT_ICONS = { building: Building2, trend: TrendingUp, users: Users, compass: Compass } as const;

type Stage =
  | 'intent'
  | 'about'
  | 'vehicle'
  | 'company'
  | 'explore_name'
  | 'confirm'
  | 'branch'
  | 'validation'
  | 'success';

type Msg = { role: 'copilot' | 'user'; text: string };

const TYPING_DELAY = 700;

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingInner />
    </RequireAuth>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const { refresh, memberships } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [waiting, setWaiting] = useState(true);
  const [stage, setStage] = useState<Stage>('intent');
  const [branchIdx, setBranchIdx] = useState(0);
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [state, setState] = useState<JourneyState>({ intent: null, about: null });
  const [pending, setPending] = useState<MockCompany | null>(null);
  const [exploreName, setExploreName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxIdError, setTaxIdError] = useState<string | null>(null);
  const [taxId, setTaxId] = useState('');
  const [country, setCountry] = useState('ES');
  const scroller = useRef<HTMLDivElement | null>(null);
  const introFired = useRef(false);

  // If the user already has memberships, send them away from /onboarding —
  // EXCEPT once we've reached the in-flow success screen, where we want the
  // user to read the confirmation before navigating to /organizaciones.
  useEffect(() => {
    if (stage === 'success') return;
    if (memberships && memberships.length > 0) {
      router.replace('/organizaciones');
    }
  }, [memberships, router, stage]);

  const pushCopilot = useCallback(
    (text: string) => setMsgs((m) => [...m, { role: 'copilot', text }]),
    []
  );
  const pushUser = useCallback(
    (text: string) => setMsgs((m) => [...m, { role: 'user', text }]),
    []
  );

  const copilotThen = useCallback(
    (text: string, fn?: () => void, delay = TYPING_DELAY) => {
      setWaiting(true);
      window.setTimeout(() => {
        pushCopilot(text);
        setWaiting(false);
        fn?.();
      }, delay);
    },
    [pushCopilot]
  );

  // Intro + Q1
  useEffect(() => {
    if (introFired.current) return;
    introFired.current = true;
    const t1 = window.setTimeout(() => {
      pushCopilot(
        'Hola, soy Arroba Copilot ✦. Voy a hacerte unas preguntas para entender qué te gustaría hacer y preparar tu espacio de trabajo. Podrás completar lo que falte más adelante.'
      );
      const t2 = window.setTimeout(() => {
        pushCopilot('Para empezar, ¿qué te gustaría hacer?');
        setWaiting(false);
      }, 900);
      // store handle on closure
      return () => window.clearTimeout(t2);
    }, 350);
    return () => window.clearTimeout(t1);
  }, [pushCopilot]);

  // Auto-scroll on every message change
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgs, waiting, stage, branchIdx, multiSel]);

  const stepIdx = useMemo(() => {
    return (
      { intent: 0, about: 1, vehicle: 2, company: 2, explore_name: 2, confirm: 2, branch: 2, validation: 3, success: 3 } as Record<
        Stage,
        number
      >
    )[stage];
  }, [stage]);

  // === STAGE HANDLERS ===
  function chooseIntent(it: (typeof INTENTS)[number]) {
    pushUser(it.title);
    setState((s) => ({ ...s, intent: it.id }));
    copilotThen('Cuéntame un poco sobre ti, así ajusto lo que te propongo.', () => setStage('about'));
  }

  function chooseAbout(ab: (typeof ABOUT_OPTIONS)[number]) {
    pushUser(ab.title);
    setState((s) => ({ ...s, about: ab.id }));
    const intent = state.intent;
    if (intent === 'explorar') {
      copilotThen(
        'Perfecto. Te dejo explorar libremente. Antes, dime con qué nombre llamamos a tu espacio.',
        () => setStage('explore_name')
      );
      return;
    }
    if (intent === 'comprar') {
      const f = FLOWS.comprar;
      copilotThen(`Voy a preparar tu Tesis de Inversión. ${f.vehicleQ}`, () => setStage('vehicle'));
    } else if (intent === 'vender' || intent === 'financiar') {
      const f = FLOWS[intent];
      const entityLabel = f.entity;
      copilotThen(`Voy a preparar tu ${entityLabel}. ${f.companyQ}`, () => setStage('company'));
    }
  }

  function pickCompany(c: MockCompany) {
    pushUser(c.name);
    setPending(c);
    copilotThen(
      'He localizado esta empresa en nuestra base de datos. Confírmame que es la tuya antes de seguir.',
      () => setStage('confirm')
    );
  }
  function confirmCompany(c: MockCompany) {
    pushUser('Sí, es esta');
    setState((s) => ({
      ...s,
      company: { id: c.id, name: c.name, cif: c.cif, razon: c.razon, sector: c.sector, city: c.city },
    }));
    setPending(null);
    const intent = state.intent;
    if (!intent || intent === 'explorar') return;
    const firstStep = FLOWS[intent].steps[0];
    if (firstStep) {
      copilotThen(`Perfecto. Ya estoy construyendo su ficha. ${firstStep.q}`, () => {
        setStage('branch');
        setBranchIdx(0);
      });
    }
  }
  function rejectCompany() {
    pushUser('No, buscar otra');
    setPending(null);
    const intent = state.intent;
    if (!intent || intent === 'explorar') return;
    const f = FLOWS[intent];
    const q = intent === 'comprar' ? f.vehicleQ : f.companyQ;
    copilotThen(`Sin problema. ${q}`, () => setStage(intent === 'comprar' ? 'vehicle' : 'company'));
  }
  function freeVehicle(text: string) {
    pushUser(text);
    setState((s) => ({ ...s, vehicle: text, company: { name: text, free: true } }));
    const intent = state.intent;
    if (!intent || intent === 'explorar') return;
    const firstStep = FLOWS[intent].steps[0];
    if (firstStep) {
      copilotThen(`Anotado: ${text}. ${firstStep.q}`, () => {
        setStage('branch');
        setBranchIdx(0);
      });
    }
  }

  function answerBranch(value: string | string[], displayText: string, field: 'objetivo' | 'plazo') {
    pushUser(displayText);
    setState((s) => ({ ...s, [field]: value }));
    setMultiSel([]);
    const intent = state.intent;
    if (!intent || intent === 'explorar') return;
    const steps = FLOWS[intent].steps;
    if (branchIdx < steps.length - 1) {
      const next = steps[branchIdx + 1];
      if (next) copilotThen(next.q, () => setBranchIdx(branchIdx + 1));
    } else {
      copilotThen('Gracias. Con esto ya puedo preparar tu resumen.', () => setStage('validation'));
    }
  }

  function submitExploreName() {
    const name = exploreName.trim() || 'Mi espacio personal';
    pushUser(name);
    setState((s) => ({ ...s, vehicle: name, company: { name, free: true } }));
    copilotThen('Perfecto. Voy a crear tu espacio.', () => setStage('validation'));
  }

  // === COMMIT ===
  async function commit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setTaxIdError(null);
    const taxIdNorm = taxId.trim();
    if (taxIdNorm && !isValidSpanishTaxId(taxIdNorm)) {
      setTaxIdError('Formato de CIF/NIF/NIE no válido.');
      setSubmitting(false);
      return;
    }
    const legalName =
      state.company?.razon || state.company?.name || state.vehicle || 'Mi espacio personal';
    try {
      await apiClient.organizations.create({
        legal_name: legalName,
        tax_id: taxIdNorm === '' ? null : taxIdNorm.toUpperCase(),
        country,
      });
      // setStage BEFORE refresh: otherwise the SWR revalidation flips
      // memberships.length to >0 and the redirect-effect kicks in before
      // the success screen has rendered.
      setStage('success');
      void refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'organization_duplicate_tax_id' || err.code === 'duplicate_tax_id') {
          setTaxIdError('Ya existe una organización con ese CIF/NIF.');
        } else {
          setError('No hemos podido crear tu espacio. Vuelve a intentarlo.');
        }
      } else {
        setError('No hemos podido crear tu espacio. Vuelve a intentarlo.');
      }
      setSubmitting(false);
    }
  }

  const intent = state.intent;
  const branchStep =
    stage === 'branch' && intent && intent !== 'explorar'
      ? FLOWS[intent].steps[branchIdx]
      : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-bg">
      <div className="sticky top-14 z-10 border-b border-border bg-bg/85 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-3 flex justify-end">
          {stage !== 'success' && <ProgressDots total={4} current={stepIdx} />}
        </div>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto">
        <div
          className="max-w-2xl mx-auto px-6 pt-8 pb-24 flex flex-col gap-6"
          data-testid="journey-thread"
        >
          {msgs.map((m, i) =>
            m.role === 'copilot' ? (
              <CopilotBubble key={i} fadeIn={i === msgs.length - 1}>
                {m.text}
              </CopilotBubble>
            ) : (
              <UserBubble key={i}>{m.text}</UserBubble>
            )
          )}
          {waiting && <Typing />}

          {!waiting && (
            <div className="pl-11 animate-[journeyIn_.4s_ease_both]">
              {stage === 'intent' && (
                <div className="flex flex-col gap-2.5" data-testid="journey-intent-list">
                  {INTENTS.map((it) => (
                    <AnswerCard
                      key={it.id}
                      icon={INTENT_ICONS[it.icon]}
                      title={it.title}
                      desc={it.desc}
                      onClick={() => chooseIntent(it)}
                      testId={`journey-intent-${it.id}`}
                    />
                  ))}
                </div>
              )}

              {stage === 'about' && (
                <div className="flex flex-col gap-2.5" data-testid="journey-about-list">
                  {ABOUT_OPTIONS.map((ab) => (
                    <AnswerCard
                      key={ab.id}
                      icon={ABOUT_ICONS[ab.icon]}
                      title={ab.title}
                      desc={ab.desc}
                      onClick={() => chooseAbout(ab)}
                      testId={`journey-about-${ab.id}`}
                    />
                  ))}
                </div>
              )}

              {stage === 'vehicle' && intent === 'comprar' && (
                <CompanyPicker
                  hint={FLOWS.comprar.vehicleHint ?? ''}
                  allowFree
                  onPick={pickCompany}
                  onFreeText={freeVehicle}
                />
              )}

              {stage === 'company' && intent && intent !== 'comprar' && intent !== 'explorar' && (
                <CompanyPicker
                  hint={FLOWS[intent].companyHint ?? ''}
                  onPick={pickCompany}
                />
              )}

              {stage === 'explore_name' && (
                <ExploreNameInput
                  value={exploreName}
                  setValue={setExploreName}
                  onSubmit={submitExploreName}
                />
              )}

              {stage === 'confirm' && pending && (
                <CompanyConfirm
                  company={pending}
                  onConfirm={() => confirmCompany(pending)}
                  onReject={rejectCompany}
                />
              )}

              {branchStep && branchStep.type === 'single' && (
                <ChipRow
                  chips={branchStep.chips}
                  onPick={(c) => answerBranch(c, c, branchStep.field)}
                />
              )}
              {branchStep && branchStep.type === 'multi' && (
                <MultiChips
                  chips={branchStep.chips}
                  sel={multiSel}
                  setSel={setMultiSel}
                  hint={branchStep.hint}
                  onSend={() =>
                    answerBranch([...multiSel], multiSel.join(' · '), branchStep.field)
                  }
                />
              )}

              {stage === 'validation' && (
                <ValidationStep
                  state={state}
                  updateState={(patch) => setState((s) => ({ ...s, ...patch }))}
                  taxId={taxId}
                  setTaxId={setTaxId}
                  country={country}
                  setCountry={setCountry}
                  onCommit={commit}
                  submitting={submitting}
                  error={error}
                  taxIdError={taxIdError}
                />
              )}

              {stage === 'success' && <SuccessStep onContinue={() => router.replace('/organizaciones')} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChipRow({ chips, onPick }: { chips: readonly string[]; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="journey-chip-row">
      {chips.map((c) => (
        <Chip key={c} onClick={() => onPick(c)} testId={`journey-chip-${slugify(c)}`}>
          {c}
        </Chip>
      ))}
    </div>
  );
}

function MultiChips({
  chips,
  sel,
  setSel,
  onSend,
  hint,
}: {
  chips: readonly string[];
  sel: string[];
  setSel: (fn: (s: string[]) => string[]) => void;
  onSend: () => void;
  hint?: string;
}) {
  const toggle = (c: string) =>
    setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));
  const enabled = sel.length > 0;
  return (
    <div data-testid="journey-multi-chip">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Chip
            key={c}
            active={sel.includes(c)}
            onClick={() => toggle(c)}
            testId={`journey-chip-${slugify(c)}`}
          >
            {c}
          </Chip>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={onSend}
          disabled={!enabled}
          data-testid="journey-multi-continue"
          className={
            'inline-flex items-center gap-1.5 px-5 h-10 rounded-full text-[13.5px] font-bold font-body transition-colors ' +
            (enabled
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'bg-surface-2 text-text-subtle cursor-not-allowed')
          }
        >
          Continuar <ArrowRight size={14} strokeWidth={1.6} />
        </button>
        {hint && <span className="text-xs text-text-subtle">{hint}</span>}
      </div>
    </div>
  );
}

function ExploreNameInput({
  value,
  setValue,
  onSubmit,
}: {
  value: string;
  setValue: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Card data-testid="journey-explore-card">
      <label className="text-sm font-semibold text-text font-body block mb-2">
        Nombre de tu espacio
      </label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Mi espacio personal"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
        data-testid="journey-explore-name-input"
        className="w-full h-12 px-3 rounded-[11px] bg-surface text-text border-[1.5px] border-border-strong outline-none text-[15px] font-body focus:border-primary focus:shadow-[0_0_0_3px_rgba(232,0,29,0.15)] transition-shadow"
      />
      <button
        type="button"
        onClick={onSubmit}
        data-testid="journey-explore-continue"
        className="mt-4 inline-flex items-center gap-2 h-11 px-5 rounded-[12px] bg-primary text-white font-body text-sm font-bold hover:bg-primary-hover transition-colors"
      >
        Continuar <ArrowRight size={16} strokeWidth={1.6} />
      </button>
    </Card>
  );
}

function SuccessStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      className="animate-[journeyIn_.4s_ease_both] text-center max-w-md mx-auto"
      data-testid="journey-success"
    >
      <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={28} strokeWidth={2.2} className="text-success" />
      </div>
      <h2 className="font-display font-bold text-2xl mb-2">Tu espacio está listo</h2>
      <p className="text-text-muted leading-relaxed mb-6">
        He guardado tu espacio en tus organizaciones. Cuando quieras, podemos seguir afinando los
        detalles.
      </p>
      <button
        type="button"
        onClick={onContinue}
        data-testid="journey-success-continue"
        className="inline-flex items-center gap-2 h-12 px-5 rounded-[12px] bg-primary text-white font-body text-sm font-bold hover:bg-primary-hover transition-colors"
      >
        Entrar en mis organizaciones <ArrowRight size={16} strokeWidth={1.6} />
      </button>
    </div>
  );
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
