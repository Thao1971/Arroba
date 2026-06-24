'use client';
import {
  KeyboardEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Plus, ArrowUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCopilot } from './CopilotProvider';
import type { SuggestionChip } from '@/lib/orchestrator';

export interface ComposerHandle {
  focus: () => void;
}

interface ComposerProps {
  chips: readonly SuggestionChip[];
  placeholder?: string;
  showChips?: boolean;
  testId?: string;
}

/**
 * GPT/Claude-style composer. Auto-expanding textarea (1–8 rows). Enter sends.
 * Shift+Enter inserts a newline. Attach slot is decorative (Próximamente).
 */
export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { chips, placeholder = 'Pregunta a Arroba Copilot…', showChips = true, testId = 'copilot-composer' },
  ref
) {
  const { send, loading } = useCopilot();
  const [draft, setDraft] = useState('');
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => taRef.current?.focus(),
  }));

  // auto-grow up to 8 rows.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const max = 24 * 8; // ~ 8 rows
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
  }, [draft]);

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  function submit(textOverride?: string) {
    const t = (textOverride ?? draft).trim();
    if (!t || loading) return;
    setDraft('');
    void send(t);
  }

  return (
    <div className="space-y-3" data-testid={testId}>
      {showChips && chips.length > 0 && (
        <div
          className="flex gap-2 flex-wrap"
          data-testid={`${testId}-chips`}
        >
          {chips.map((c, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => submit(c.payload.query ?? c.label)}
              data-testid={`${testId}-chip-${idx}`}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-border-strong bg-surface text-text text-xs font-medium hover:border-primary hover:text-primary transition-colors"
            >
              <Sparkles size={11} strokeWidth={1.6} className="text-primary" />
              {c.label}
            </button>
          ))}
        </div>
      )}
      <div
        className={cn(
          'flex items-end gap-2 p-1.5 pl-2 rounded-2xl bg-surface border-[1.5px] border-border-strong',
          'focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(232,0,29,0.12)] transition-shadow'
        )}
      >
        <button
          type="button"
          aria-label="Adjuntar (próximamente)"
          title="Próximamente"
          data-testid={`${testId}-attach`}
          className="w-9 h-9 rounded-full border border-border bg-surface text-text-muted shrink-0 hover:bg-surface-2 hover:text-text flex items-center justify-center transition-colors"
        >
          <Plus size={16} strokeWidth={1.6} />
        </button>
        <textarea
          ref={taRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          disabled={loading}
          data-testid={`${testId}-textarea`}
          aria-label="Mensaje al Copilot"
          className="flex-1 resize-none bg-transparent border-none outline-none text-text text-[15px] leading-6 px-1 py-2 placeholder:text-text-subtle disabled:opacity-60"
          style={{ maxHeight: '12rem' }}
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={!draft.trim() || loading}
          data-testid={`${testId}-send`}
          aria-label="Enviar"
          className={cn(
            'w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-opacity',
            !draft.trim() || loading
              ? 'bg-primary/40 text-white cursor-not-allowed'
              : 'bg-primary text-white hover:opacity-90'
          )}
        >
          <ArrowUp size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
});
