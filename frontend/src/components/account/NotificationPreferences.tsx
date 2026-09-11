'use client';
/**
 * COMP-14006 — Notification Preferences (ver ACC_CUENTA_v0.1.md).
 * No existe backend de preferencias de notificación todavía (ni tabla de
 * suscripción por evento, ni servicio de email más allá de un placeholder
 * scaffolded — ver ARCHITECTURE.md `email_service.py`). En vez del
 * EmptyStateBlock genérico que había antes, se deja explícito qué eventos
 * ya se trackean hoy en el producto (FLOWS.md) y que serán la base de esta
 * pantalla — sin fingir que ya son configurables.
 */
import { Bell } from 'lucide-react';
import { Card, Badge } from '@/components/ds';

const EVENTS = [
  'NDA firmada',
  'Interés recibido',
  'Acceso al Data Room',
  'Nuevo match de alta afinidad',
  'Invitación a shortlist',
  'Exclusividad otorgada o perdida',
  'Sugerencias de shortlist automático',
];

export function NotificationPreferences() {
  return (
    <Card data-testid="notification-preferences" header="Notificaciones">
      <div className="flex items-start gap-3 mb-4">
        <Bell size={18} strokeWidth={1.5} className="text-text-subtle mt-0.5 shrink-0" />
        <p className="text-sm text-text-muted">
          Todavía no puedes elegir por qué canal recibir cada aviso — esto llegará en una
          sub-fase posterior. Estos son los eventos que arroba ya registra hoy y que serán la
          base de esta pantalla:
        </p>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {EVENTS.map((e) => (
          <li key={e}>
            <Badge variant="default">{e}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
