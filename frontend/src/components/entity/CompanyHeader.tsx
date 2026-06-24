'use client';
/**
 * CompanyHeader — sticky-ish header for `/empresa/{cif}`.
 *
 * Renders the company avatar (initials), name, CIF + sector + region, and
 * (for authenticated users) a row of typed actions that talk to the
 * `apiClient.companies.*` SDK or fire "coming soon" toasts.
 *
 * Action toast labels follow the canonical phase plan:
 *   - "Solicitar valoración avanzada" → "Próximamente: E1.8"
 *   - "✦ Activar oportunidad"          → "Próximamente: E1.9"
 *   - "Descargar memoria mercantil"    → "Próximamente — REQ-008 pendiente"
 *   - "Reclamar empresa"               → "Próximamente"
 */
import {
  BookmarkPlus,
  Bookmark,
  Share2,
  Sparkles,
  TrendingUp,
  Download,
  Flag,
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';

import { apiClient, ApiError } from '@/lib/api/client';
import type {
  CompanyHeaderInfo,
  WatchlistVisibility,
} from '@/lib/companies/types';
import { cn } from '@/lib/cn';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { notify } from '@/lib/notify';

export interface CompanyHeaderProps {
  cif: string;
  info: CompanyHeaderInfo;
  authenticated: boolean;
  initialInWatchlist: boolean;
  initialVisibility: WatchlistVisibility | null;
}

export function CompanyHeader({
  cif,
  info,
  authenticated,
  initialInWatchlist,
  initialVisibility,
}: CompanyHeaderProps) {
  const { activeOrgId } = useActiveOrg();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [visibility, setVisibility] = useState<WatchlistVisibility | null>(
    initialVisibility,
  );
  const [busy, setBusy] = useState<string | null>(null);

  const requireOrgOrToast = () => {
    if (!activeOrgId) {
      notify({
        kind: 'info',
        text: 'Selecciona una organización para guardar empresas.',
      });
      return false;
    }
    return true;
  };

  const onToggleWatchlist = async () => {
    if (!authenticated || !requireOrgOrToast()) return;
    setBusy('watchlist');
    try {
      const r = await apiClient.companies.toggleWatchlist(cif, activeOrgId!);
      setInWatchlist(r.saved);
      setVisibility(r.visibility);
      notify({
        kind: 'success',
        text: r.saved
          ? 'Guardada en tu cartera de empresas.'
          : 'Quitada de tu cartera.',
      });
    } catch (e) {
      notify({
        kind: 'error',
        text:
          e instanceof ApiError ? e.detail : 'No se pudo actualizar la cartera.',
      });
    } finally {
      setBusy(null);
    }
  };

  const onToggleShare = async () => {
    if (!authenticated || !requireOrgOrToast() || !inWatchlist) {
      if (authenticated && activeOrgId && !inWatchlist) {
        notify({
          kind: 'info',
          text: 'Primero guárdala en tu cartera para compartirla con tu equipo.',
        });
      }
      return;
    }
    setBusy('share');
    try {
      const r = await apiClient.companies.toggleShare(cif, activeOrgId!);
      setVisibility(r.visibility);
      notify({
        kind: 'success',
        text:
          r.visibility === 'team'
            ? 'Empresa compartida con tu equipo.'
            : 'Empresa marcada como privada.',
      });
    } catch (e) {
      notify({
        kind: 'error',
        text:
          e instanceof ApiError ? e.detail : 'No se pudo actualizar el share.',
      });
    } finally {
      setBusy(null);
    }
  };

  const onComingSoon = (label: string, version?: string) => {
    notify({
      kind: 'info',
      text: version ? `${label} — Próximamente: ${version}` : `${label} — Próximamente`,
    });
  };

  return (
    <header
      data-testid="company-header"
      className="rounded-2xl border border-border bg-surface p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start"
    >
      {/* Avatar */}
      <div
        aria-hidden
        className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-bg border border-border flex items-center justify-center"
      >
        <span className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-text">
          {info.initials}
        </span>
      </div>

      {/* Identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 flex-wrap">
          <h1
            className="font-display font-bold text-3xl md:text-4xl tracking-tight text-text leading-tight min-w-0"
            data-testid="company-header-name"
          >
            {info.name}
          </h1>
          {info.score != null && (
            <span
              data-testid="company-header-score"
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mt-2"
            >
              Score {info.score}
            </span>
          )}
        </div>
        <p
          className="mt-2 text-sm md:text-base text-text-muted"
          data-testid="company-header-subtitle"
        >
          {[info.sector, info.region, info.cif].filter(Boolean).join(' · ')}
        </p>

        {/* Actions row (only authenticated) */}
        {authenticated && (
          <div
            className="mt-5 flex flex-wrap gap-2"
            data-testid="company-header-actions"
          >
            <ActionButton
              testId="company-action-watchlist"
              onClick={onToggleWatchlist}
              disabled={busy === 'watchlist'}
              icon={inWatchlist ? Bookmark : BookmarkPlus}
              active={inWatchlist}
              label={inWatchlist ? 'En tu cartera' : 'Guardar en cartera'}
            />
            <ActionButton
              testId="company-action-share"
              onClick={onToggleShare}
              disabled={busy === 'share' || !inWatchlist}
              icon={Share2}
              active={visibility === 'team'}
              label={
                visibility === 'team' ? 'Compartida con equipo' : 'Compartir con equipo'
              }
            />
            <ActionButton
              testId="company-action-request-valuation"
              onClick={() =>
                onComingSoon('Solicitar valoración avanzada', 'E1.8')
              }
              icon={TrendingUp}
              label="Solicitar valoración avanzada"
            />
            <ActionButton
              testId="company-action-activate-opportunity"
              onClick={() => onComingSoon('✦ Activar oportunidad', 'E1.9')}
              icon={Sparkles}
              label="✦ Activar oportunidad"
              primary
            />
            <ActionButton
              testId="company-action-download-memory"
              onClick={() =>
                onComingSoon('Descargar memoria mercantil — REQ-008 pendiente')
              }
              icon={Download}
              label="Descargar memoria mercantil"
            />
            <ActionButton
              testId="company-action-claim"
              onClick={() => onComingSoon('Reclamar empresa')}
              icon={Flag}
              label="Reclamar empresa"
            />
            <button
              type="button"
              aria-label="Más acciones"
              data-testid="company-action-more"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border bg-bg text-text-muted hover:bg-surface transition-colors"
            >
              <MoreHorizontal size={16} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

interface ActionButtonProps {
  testId: string;
  onClick: () => void;
  disabled?: boolean;
  icon: typeof Bookmark;
  label: string;
  active?: boolean;
  primary?: boolean;
}

function ActionButton({
  testId,
  onClick,
  disabled,
  icon: Icon,
  label,
  active,
  primary,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        primary
          ? 'bg-primary text-white border-primary hover:bg-primary/90'
          : active
          ? 'bg-primary/10 text-primary border-primary/40 hover:bg-primary/15'
          : 'bg-bg text-text border-border hover:bg-surface',
      )}
    >
      <Icon size={14} strokeWidth={1.8} />
      {label}
    </button>
  );
}
