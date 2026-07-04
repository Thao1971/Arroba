'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  DEMO_INTRO_CARDS,
  DEMO_INTRO_COPILOT,
  DEMO_INTRO_USER,
  DEMO_SCRIPT,
  type DemoCard,
  type DemoTurn,
} from './copilot-demo-script';

/**
 * Demo del Copilot embebida en la home pública. Visualmente imita el dock
 * global (E1.3) pero usa un guion determinístico (sin LLM). El shape de
 * cada "turn" replica el protocolo Copilot/Skill futuro para que el
 * cambio a LLM real sea trivial.
 *
 * SIN dependencia de backend. Renderiza inline (no docked).
 */
interface Message {
  role: 'user' | 'copilot';
  text: string;
  cards?: readonly DemoCard[];
  citation?: string;
}

const INTRO: Message[] = [
  { role: 'user', text: DEMO_INTRO_USER },
  { role: 'copilot', text: DEMO_INTRO_COPILOT, cards: DEMO_INTRO_CARDS },
];

export function CopilotDemoTeaser() {
  const [messages, setMessages] = useState<Message[]>(INTRO);
  const [usedChips, setUsedChips] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages, typing]);

  function trigger(turn: DemoTurn) {
    if (typing || usedChips.has(turn.chip_id)) return;
    setUsedChips((s) => new Set(s).add(turn.chip_id));
    setMessages((m) => [...m, { role: 'user', text: turn.user_message }]);
    setTyping(true);
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: 'copilot',
          text: turn.copilot_response,
          cards: turn.cards,
          citation: turn.citation,
        },
      ]);
      setTyping(false);
    }, 850);
  }

  function reset() {
    setMessages(INTRO);
    setUsedChips(new Set());
    setTyping(false);
  }

  return (
    <section
      data-testid="copilot-demo-teaser"
      className="rounded-2xl border border-border bg-surface overflow-hidden"
    >
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-surface-2">
        <div className="flex items-center gap-2.5">
          <CopilotMark />
          <div>
            <p className="font-display font-semibold text-sm leading-tight">Arroba Copilot</p>
            <p className="text-[11px] text-text-subtle leading-tight">Demo · respuestas pre-grabadas</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          data-testid="copilot-demo-reset"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text"
        >
          <RotateCcw size={13} strokeWidth={1.6} /> Reiniciar demo
        </button>
      </header>

      <div
        ref={scroller}
        className="max-h-[420px] overflow-y-auto px-5 py-5 space-y-5 bg-bg"
        data-testid="copilot-demo-thread"
      >
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end" data-testid="copilot-demo-user-message">
              <div className="max-w-[80%] bg-primary text-white text-sm font-medium px-4 py-2 rounded-[15px_15px_5px_15px]">
                {m.text}
              </div>
            </div>
          ) : (
            <CopilotMessage key={i} message={m} />
          )
        )}
        {typing && <TypingRow />}
      </div>

      <footer className="border-t border-border bg-surface-2 px-4 py-3">
        <p className="text-[11px] text-text-subtle mb-2 font-semibold tracking-wider uppercase">
          Sugerencias
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_SCRIPT.map((turn) => {
            const used = usedChips.has(turn.chip_id);
            return (
              <button
                key={turn.chip_id}
                type="button"
                onClick={() => trigger(turn)}
                disabled={used || typing}
                data-testid={`copilot-demo-chip-${turn.chip_id}`}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 h-9 rounded-full border-[1.5px] text-xs font-medium transition-colors',
                  used
                    ? 'opacity-40 cursor-not-allowed border-border bg-surface text-text-subtle'
                    : 'border-border-strong bg-surface text-text hover:border-primary hover:text-primary'
                )}
              >
                {turn.chip_label}
                {!used && <Send size={11} strokeWidth={1.6} />}
              </button>
            );
          })}
        </div>
      </footer>
    </section>
  );
}

function CopilotMessage({ message }: { message: Message }) {
  return (
    <div className="flex gap-3" data-testid="copilot-demo-copilot-message">
      <CopilotMark size={28} />
      <div className="flex-1 min-w-0 space-y-2.5">
        <p className="text-sm text-text leading-relaxed">{renderRich(message.text)}</p>
        {message.cards && (
          <div className="grid sm:grid-cols-2 gap-2" data-testid="copilot-demo-cards">
            {message.cards.map((c, i) => (
              <article
                key={i}
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-xs"
              >
                <p className="font-display font-semibold text-text mb-0.5">{c.title}</p>
                <p className="text-text-muted leading-snug">{c.body}</p>
                {c.meta && (
                  <p className="mt-1 text-[10px] text-text-subtle font-mono inline-flex items-center gap-1">
                    {c.meta}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
        {message.citation && (
          <p className="text-[11px] text-text-subtle italic">{message.citation}</p>
        )}
      </div>
    </div>
  );
}

function TypingRow() {
  return (
    <div className="flex gap-3 items-center" data-testid="copilot-demo-typing">
      <CopilotMark size={28} />
      <div className="flex gap-1 px-1 py-2.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 150}ms` }}
            className="block w-1.5 h-1.5 rounded-full bg-text-subtle animate-[journeyBounce_1s_infinite_ease-in-out]"
          />
        ))}
      </div>
    </div>
  );
}

function CopilotMark({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-[9px] flex items-center justify-center flex-shrink-0"
    >
      <div
        className="w-full h-full rounded-[9px] flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)' }}
      >
        <Sparkles size={size * 0.45} strokeWidth={1.5} className="text-primary" />
      </div>
    </div>
  );
}

/** Minimal **bold** rendering. No full markdown parser needed for the demo. */
function renderRich(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}
