'use client';
/**
 * COMP-14008 — Plan & Billing (ver ACC_CUENTA_v0.1.md, DA-14004: Stripe).
 * El backend solo tiene un stub de salud (`GET /api/billing/health`, confirma
 * si el SDK de Stripe y las claves están presentes) — no hay Customer,
 * Checkout ni webhooks todavía. Se deja como próximamente en vez de simular
 * un plan o un método de pago que no existe.
 */
import { CreditCard } from 'lucide-react';
import { Card, Badge } from '@/components/ds';

export function PlanBilling() {
  return (
    <Card data-testid="plan-billing" header="Plan y facturación">
      <div className="flex items-start gap-3">
        <CreditCard size={18} strokeWidth={1.5} className="text-text-subtle mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-text-muted mb-2">
            La gestión de plan y facturación (Stripe) todavía no está conectada — el backend
            solo tiene preparado el SDK, sin clientes ni suscripciones reales.
          </p>
          <Badge variant="default">Próximamente</Badge>
        </div>
      </div>
    </Card>
  );
}
