'use client';
import { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';

/**
 * OrgSwitcher — header dropdown to switch the active org.
 *
 * Variants:
 *   - 0 memberships: returns null (OnboardingGuard will redirect first anyway).
 *   - 1 membership: renders a static label (no dropdown).
 *   - 2+ memberships: renders a clickable dropdown with check marks.
 */
export function OrgSwitcher() {
  const { activeOrgId, setActiveOrgId, availableOrgs } = useActiveOrg();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
    return undefined;
  }, [open]);

  if (availableOrgs.length === 0) return null;

  const active = availableOrgs.find((o) => o.org_id === activeOrgId) ?? availableOrgs[0];
  const label = active?.legal_name ?? active?.org_id ?? '—';

  if (availableOrgs.length === 1) {
    return (
      <div
        data-testid="org-switcher-static"
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-text-muted text-xs"
        title={label}
      >
        <Building2 size={13} strokeWidth={1.6} className="text-text-subtle" />
        <span className="truncate max-w-[160px]">{label}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="org-switcher-button"
        aria-haspopup="menu"
        aria-expanded={open}
        className="hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors text-xs font-medium"
      >
        <Building2 size={14} strokeWidth={1.6} className="text-text-subtle" />
        <span className="truncate max-w-[160px]">{label}</span>
        <ChevronDown size={12} strokeWidth={1.6} className="text-text-subtle" />
      </button>
      {open && (
        <div
          role="menu"
          data-testid="org-switcher-menu"
          className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-surface shadow-lg overflow-hidden z-50"
        >
          <div className="px-3 py-2 border-b border-border text-[11px] uppercase tracking-wider text-text-subtle">
            Organización activa
          </div>
          {availableOrgs.map((o) => {
            const isActive = o.org_id === activeOrgId;
            return (
              <button
                key={o.org_id}
                type="button"
                onClick={() => {
                  setActiveOrgId(o.org_id);
                  setOpen(false);
                }}
                data-testid={`org-switcher-item-${o.org_id}`}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors',
                  isActive ? 'bg-surface-2 text-text' : 'text-text-muted hover:bg-surface-2 hover:text-text',
                )}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <Building2 size={14} strokeWidth={1.6} className="text-text-subtle shrink-0" />
                  <span className="truncate">{o.legal_name ?? o.org_id}</span>
                </span>
                {isActive && <Check size={14} strokeWidth={2} className="text-success" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
