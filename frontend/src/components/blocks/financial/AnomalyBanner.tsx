'use client';
/**
 * AnomalyBanner — banner condicional cuando el Financial Engine detecta
 * anomalías en los estados financieros (ej. saltos de perímetro,
 * refinanciación, cambio de basis).
 *
 * Se apoya en la primitiva canónica `<Alert variant="warning">` del DS.
 * NO es una primitiva nueva — es un wrapper semántico con testid estable
 * y un slot `action` opcional para abrir el drawer de explicación.
 *
 * Regla R4: NUNCA calcular anomalías en el frontend. El renderer solo
 * pinta lo que el backend expone en `financial-analysis.anomaly`.
 */
import { ReactNode } from 'react';

import { Alert } from '@/components/ds';

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface AnomalyBannerProps {
  /** Título breve del banner. */
  title: string;
  /** Explicación corta (1-2 frases). */
  description?: string;
  /** Severidad reportada por el engine. Default 'medium'. */
  severity?: AnomalySeverity;
  /** Slot para CTAs (ej. "Ver detalles"). */
  action?: ReactNode;
  testId?: string;
}

/**
 * El DS solo expone `warning` y `danger` como variantes semánticas fuertes.
 * Mapeamos severidad:
 *   - low   → info    (informativa, no alarma)
 *   - medium → warning (default)
 *   - high  → danger  (requiere atención)
 */
function severityToAlertVariant(
  s: AnomalySeverity,
): 'info' | 'warning' | 'danger' {
  if (s === 'low') return 'info';
  if (s === 'high') return 'danger';
  return 'warning';
}

export function AnomalyBanner({
  title,
  description,
  severity = 'medium',
  action,
  testId = 'anomaly-banner',
}: AnomalyBannerProps) {
  return (
    <div data-testid={testId} data-severity={severity}>
      <Alert
        variant={severityToAlertVariant(severity)}
        title={title}
        action={action}
      >
        {description}
      </Alert>
    </div>
  );
}
