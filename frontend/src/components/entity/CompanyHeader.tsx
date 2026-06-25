'use client';
/**
 * CompanyHeader — smart container for the `/empresa/{cif}` Header module.
 *
 * Owns the data flow + side effects (toggle watchlist, toggle share, fire
 * "coming soon" toasts) and delegates the presentational rendering to the
 * canonical `EntityHeader` base primitive
 * (`@/components/entity/base/EntityHeader`).
 *
 * Architectural shape (E1.5.6):
 *   - Stable testid `company-header` on the root + `company-header-name`,
 *     `company-header-subtitle`, `company-header-score`,
 *     `company-header-actions`, `company-action-{kind}` for actions, and
 *     `company-action-more` for the dropdown — all preserved across the
 *     refactor so existing tests + e1_tester keep passing untouched.
 *   - All entity-specific logic (when share is enabled, what toast appears
 *     for "Solicitar valoración avanzada", etc.) lives here. The base
 *     primitive stays purely presentational.
 *
 * Toast labels follow the canonical phase plan:
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
} from 'lucide-react';
import { useState } from 'react';

import { apiClient, ApiError } from '@/lib/api/client';
import type {
  CompanyHeaderInfo,
  WatchlistVisibility,
} from '@/lib/companies/types';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { notify } from '@/lib/notify';
import { EntityHeader } from './base/EntityHeader';
import type { EntityHeaderAction } from './base/types';

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

  const actions: EntityHeaderAction[] = [
    {
      testId: 'company-action-watchlist',
      label: inWatchlist ? 'En tu cartera' : 'Guardar en cartera',
      icon: inWatchlist ? Bookmark : BookmarkPlus,
      onClick: onToggleWatchlist,
      disabled: busy === 'watchlist',
      active: inWatchlist,
    },
    {
      testId: 'company-action-share',
      label:
        visibility === 'team' ? 'Compartida con equipo' : 'Compartir con equipo',
      icon: Share2,
      onClick: onToggleShare,
      disabled: busy === 'share' || !inWatchlist,
      active: visibility === 'team',
    },
    {
      testId: 'company-action-request-valuation',
      label: 'Solicitar valoración avanzada',
      icon: TrendingUp,
      onClick: () => onComingSoon('Solicitar valoración avanzada', 'E1.8'),
    },
    {
      testId: 'company-action-activate-opportunity',
      label: '✦ Activar oportunidad',
      icon: Sparkles,
      onClick: () => onComingSoon('✦ Activar oportunidad', 'E1.9'),
      primary: true,
    },
    {
      testId: 'company-action-download-memory',
      label: 'Descargar memoria mercantil',
      icon: Download,
      onClick: () =>
        onComingSoon('Descargar memoria mercantil — REQ-008 pendiente'),
    },
    {
      testId: 'company-action-claim',
      label: 'Reclamar empresa',
      icon: Flag,
      onClick: () => onComingSoon('Reclamar empresa'),
    },
  ];

  return (
    <EntityHeader
      entityType="company"
      testId="company-header"
      info={{
        name: info.name,
        initials: info.initials ?? undefined,
        subtitle:
          [info.sector, info.region, info.cif].filter(Boolean).join(' · ') ||
          undefined,
        score: info.score ?? undefined,
        identifier: info.cif ?? undefined,
      }}
      authenticated={authenticated}
      actions={authenticated ? actions : []}
    />
  );
}
