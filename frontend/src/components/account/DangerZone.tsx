'use client';
/**
 * COMP-14010 — Danger Zone (ver ACC_CUENTA_v0.1.md).
 * No existe endpoint de eliminación de cuenta en el backend. En vez de un
 * botón que no hace nada, se ofrece la vía manual real: contactar a
 * soporte. Se sustituye por autoservicio cuando exista el endpoint.
 */
import { Trash2 } from 'lucide-react';
import { Card, Button } from '@/components/ds';

export function DangerZone() {
  return (
    <Card data-testid="danger-zone" className="border-danger/30" header="Zona de peligro">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted mb-1">
            Eliminar tu cuenta no es todavía autoservicio — el backend no tiene un endpoint para
            ello.
          </p>
          <p className="text-xs text-text-subtle">
            Escríbenos y lo gestionamos manualmente, comprobando antes que no seas el único
            administrador de una organización con operaciones activas.
          </p>
        </div>
        <a href="mailto:soporte@arroba.com?subject=Eliminar%20mi%20cuenta">
          <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} strokeWidth={1.75} />}>
            Solicitar por email
          </Button>
        </a>
      </div>
    </Card>
  );
}
