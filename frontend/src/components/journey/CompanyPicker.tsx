'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { searchCompanies } from '@/lib/journey/derive';
import type { DemoCompany } from '@/lib/journey/data';
import { Spinner } from '@/components/ds';

export interface CompanyPickerProps {
  hint: string;
  allowFree?: boolean;
  onPick: (c: DemoCompany) => void;
  onFreeText?: (text: string) => void;
}

/** Live-search picker sobre las empresas demo. Port de CompanyPicker (rj-app.jsx). */
export function CompanyPicker({ hint, allowFree, onPick, onFreeText }: CompanyPickerProps) {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'results' | 'empty'>('idle');
  const [results, setResults] = useState<DemoCompany[]>([]);
  const reqRef = useRef(0);

  useEffect(() => {
    if (!q.trim()) {
      setState('idle');
      setResults([]);
      return;
    }
    setState('loading');
    const id = ++reqRef.current;
    const t = setTimeout(() => {
      if (id !== reqRef.current) return;
      const r = searchCompanies(q);
      setResults(r);
      setState(r.length ? 'results' : 'empty');
    }, 380);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div data-testid="journey-company-picker">
      {state !== 'idle' && (
        <div className="mb-3 flex flex-col gap-2">
          {state === 'loading' && (
            <div className="flex items-center gap-2 text-text-muted text-sm py-2 px-3 border border-border rounded-[12px]">
              <Spinner /> Buscando…
            </div>
          )}
          {state === 'results' &&
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onPick(c)}
                data-testid={`journey-company-result-${c.id}`}
                className="flex items-center gap-3 p-3 border-[1.5px] border-border rounded-[12px] bg-surface text-left font-body hover:border-primary transition-colors"
              >
                <div className="w-9 h-9 rounded-[9px] bg-surface-2 border border-border flex items-center justify-center font-bold text-text font-display shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold text-text truncate">{c.name}</div>
                  <div className="text-[11.5px] text-text-muted truncate">
                    {c.razon} · {c.cif} · {c.city}
                  </div>
                </div>
                <ArrowRight size={16} strokeWidth={1.6} className="text-text-subtle shrink-0" />
              </button>
            ))}
          {state === 'empty' && (
            <div className="p-3 border border-border rounded-[12px] text-sm text-text-muted flex items-center justify-between gap-3">
              <span>Sin resultados para «{q}».</span>
              {allowFree && onFreeText && (
                <button
                  type="button"
                  onClick={() => onFreeText(q.trim())}
                  data-testid="journey-company-use-free"
                  className="text-xs font-bold text-primary whitespace-nowrap"
                >
                  Usar «{q}» →
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <div
        className={
          'flex items-center gap-2 px-3.5 py-1.5 rounded-[14px] bg-surface transition-shadow ' +
          (focused
            ? 'border-[1.5px] border-primary shadow-[0_0_0_3px_rgba(232,0,29,0.16)]'
            : 'border-[1.5px] border-border-strong')
        }
      >
        <Search size={17} strokeWidth={1.6} className="text-text-subtle" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
          placeholder="Razón social o CIF…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && allowFree && q.trim() && state !== 'results' && onFreeText) {
              onFreeText(q.trim());
            }
          }}
          data-testid="journey-company-search-input"
          className="flex-1 h-10 bg-transparent border-none outline-none text-[15px] text-text font-body"
        />
      </div>
      <p className="text-[11.5px] text-text-subtle mt-2">{hint} Prueba: «kitchen», «olmedo», «B-47 594 478»…</p>
    </div>
  );
}
