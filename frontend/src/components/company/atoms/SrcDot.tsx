/**
 * HARDENING-021 · Fase 2 · `<SrcDot>` marker de procedencia por métrica.
 *
 * Portado LITERAL del mockup `ficha-empresa-f01.html` (líneas 535-536):
 *   .srcdot{width:7px;height:7px;border-radius:50%;flex-shrink:0;cursor:help}
 *   .srcdot.r{background:var(--ok)}    → verificado en fuente
 *   .srcdot.c{background:var(--n300)}  → calculado sobre datos verificados
 *
 * CSS scopeado bajo `.afk` en `fichaMockupCss.ts`. Los tooltips consumen el
 * sistema `<Tip>` global (HARDENING-021 Fase 1 · atomic `Tip.tsx`).
 *
 * REGLA R15: si `type` es `null`/`undefined` → NO renderiza nada. La ausencia
 * de procedencia es información válida.
 *
 * Copy CF canónico (glosario Fase 2 aprobado por el usuario):
 *   verified   → "Verificado en fuente"
 *   calculated → "Calculado por Arroba sobre datos verificados"
 *   inferred   → "Inferido por Arroba"  (latente · Intel aún no emite hoy)
 */

import * as React from 'react';
import type { ProvenanceValue } from '@/lib/companies/provenance';

const TOOLTIP_COPY: Record<ProvenanceValue, string> = {
  verified: 'Verificado en fuente',
  calculated: 'Calculado por Arroba sobre datos verificados',
  inferred: 'Inferido por Arroba',
};

const CLASS_BY_TYPE: Record<ProvenanceValue, string> = {
  verified: 'srcdot r',
  calculated: 'srcdot c',
  inferred: 'srcdot i',
};

export function SrcDot({ type }: { type: ProvenanceValue | null | undefined }) {
  if (!type) return null;
  // 'inferred' se representa como un pequeño ✦ (mockup línea 732 · latente hoy).
  if (type === 'inferred') {
    return (
      <span
        className="ihint"
        data-tip={TOOLTIP_COPY[type]}
        tabIndex={0}
        style={{ verticalAlign: 'middle' }}
      >
        ✦
      </span>
    );
  }
  return (
    <span
      className={CLASS_BY_TYPE[type]}
      data-tip={TOOLTIP_COPY[type]}
      tabIndex={0}
      role="img"
      aria-label={TOOLTIP_COPY[type]}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
}
