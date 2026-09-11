'use client';
/**
 * COMP-14009 — Privacy & Data (ver ACC_CUENTA_v0.1.md).
 * No hay endpoint de exportación/eliminación de datos personales ni de
 * historial de consentimientos todavía. Próximamente honesto.
 */
import { ShieldCheck } from 'lucide-react';
import { Card, Badge } from '@/components/ds';

export function PrivacyData() {
  return (
    <Card data-testid="privacy-data" header="Privacidad y datos">
      <div className="flex items-start gap-3">
        <ShieldCheck size={18} strokeWidth={1.5} className="text-text-subtle mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-text-muted mb-2">
            Exportar tus datos, eliminarlos o consultar tu historial de consentimientos (NDAs
            firmadas, documentos del Data Room accedidos) todavía no está disponible desde aquí.
          </p>
          <Badge variant="default">Próximamente</Badge>
        </div>
      </div>
    </Card>
  );
}
