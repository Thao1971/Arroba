'use client';
/**
 * @componentId COMP-1004
 * @status READY (visual sin contrato · acciones deshabilitadas)
 * @section Header
 * @source ce-app.jsx (botones "Guardar", "Seguir", "Compartir", "Descargar NDA", "Contactar", "Hacer match")
 * @endpoints — (F0.1: acciones sensibles sin contrato V2)
 * @acc ACC_v0.1.md §4.4 · Company Quick Actions
 *
 * COMP-1004 Company Quick Actions — barra de acciones rápidas del Header.
 *
 * Contradicción C14.5 (acciones sensibles): las acciones "Descargar NDA",
 * "Contactar", "Hacer match", "Añadir a watchlist" NO tienen contrato Agency
 * Tool V2. Se renderizan **visibles pero deshabilitadas** con `Tooltip`
 * explicativo "Disponible próximamente" (decisión del usuario 2026-07-06 · F0.1).
 *
 * Contradicción C14.2 (créditos): no se consume ningún crédito en F0.1. Si el
 * contrato futuro incluye créditos, esta barra los mostrará en un contador
 * dedicado a la derecha (hoy sin renderizar).
 */
import {
  Bookmark,
  Bell,
  Share2,
  FileDown,
  Mail,
  Handshake,
} from 'lucide-react';
import { Tooltip } from '@/components/ds';
import { cn } from '@/lib/cn';
import { HEADER_TESTIDS } from '../_lib/testids';

export interface CompanyQuickActionsProps {
  /** CIF activo (para logs futuros; hoy no se usa). */
  cif?: string;
}

interface QuickAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  reason: string;
}

const ACTIONS: QuickAction[] = [
  {
    key: 'watchlist',
    label: 'Guardar',
    icon: <Bookmark size={14} aria-hidden />,
    disabled: true,
    reason:
      'Disponible próximamente · pendiente contrato Agency Tool V2 para watchlists.',
  },
  {
    key: 'follow',
    label: 'Seguir',
    icon: <Bell size={14} aria-hidden />,
    disabled: true,
    reason:
      'Disponible próximamente · pendiente contrato Agency Tool V2 para alertas.',
  },
  {
    key: 'nda',
    label: 'Descargar NDA',
    icon: <FileDown size={14} aria-hidden />,
    disabled: true,
    reason: 'Disponible próximamente · acción sensible sin contrato V2 (C14.5).',
  },
  {
    key: 'contact',
    label: 'Contactar',
    icon: <Mail size={14} aria-hidden />,
    disabled: true,
    reason: 'Disponible próximamente · acción sensible sin contrato V2 (C14.5).',
  },
  {
    key: 'match',
    label: 'Hacer match',
    icon: <Handshake size={14} aria-hidden />,
    disabled: true,
    reason: 'Disponible próximamente · acción sensible sin contrato V2 (C14.5).',
  },
  {
    key: 'share',
    label: 'Compartir',
    icon: <Share2 size={14} aria-hidden />,
    disabled: true,
    reason: 'Disponible próximamente · pendiente flujo estándar arroba.',
  },
];

export function CompanyQuickActions(_props: CompanyQuickActionsProps) {
  return (
    <section
      data-testid={HEADER_TESTIDS.quickActions}
      className="flex items-center gap-2 flex-wrap"
      aria-label="Acciones rápidas de la empresa"
    >
      {ACTIONS.map((action) => (
        <Tooltip
          key={action.key}
          content={{
            title: action.label,
            description: action.reason,
          }}
        >
          <button
            type="button"
            disabled={action.disabled}
            aria-disabled={action.disabled}
            data-testid={`${HEADER_TESTIDS.quickActions}-${action.key}`}
            className={cn(
              'inline-flex items-center gap-1.5',
              'text-body-sm font-semibold',
              'px-3 py-2 rounded-lg border',
              'transition-colors duration-fast',
              action.disabled
                ? 'border-border-default bg-surface-muted text-text-muted cursor-not-allowed opacity-70'
                : 'border-border-emphasis bg-surface-elevated text-text-primary hover:bg-surface-muted',
            )}
          >
            {action.icon}
            {action.label}
          </button>
        </Tooltip>
      ))}
      {/* Placeholder reservado para contador de créditos (C14.2 · sin contrato). */}
      <div
        data-testid={`${HEADER_TESTIDS.quickActions}-credits-slot`}
        aria-hidden
        className="w-0 h-0 invisible"
      />
    </section>
  );
}
