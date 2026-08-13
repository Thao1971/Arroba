'use client';
/**
 * HARDENING-021 · Fase 3 · `<MethodDetails>` — bloque plegable de metodología estática.
 *
 * Portado LITERAL del mockup `ficha-empresa-f01.html`:
 *
 *   .method{border:1px solid var(--n200);border-radius:var(--r-lg);overflow:hidden}
 *   .method summary{cursor:pointer;padding:15px 18px;display:flex;align-items:center;gap:8px;
 *                   font-size:14px;font-weight:700;color:var(--n900)}
 *   .method summary::-webkit-details-marker{display:none}
 *   .method summary .ch{margin-left:auto;color:var(--n400);transition:transform .2s}
 *   .method[open] summary .ch{transform:rotate(180deg)}
 *   .method .mbody{padding:0 18px 18px;font-size:13px;color:var(--n700);line-height:1.6}
 *   .method .formula{background:var(--n100);border-radius:8px;padding:10px 14px;
 *                    font-family:var(--mono,ui-monospace,monospace);font-size:12.5px;
 *                    color:var(--n900);margin:10px 0}
 *
 * CSS ya scopeado bajo `.afk` en `fichaMockupCss.ts` (portado en HARDENING-018 Fase 0).
 *
 * REGLA CRÍTICA: el copy es **método** (fórmula + pasos ordenados), NO dato de empresa.
 * Registro CF de analista a no-financiero, redacción estática. No viola R15 porque
 * describe cómo se calcula, no fabrica valores concretos.
 *
 * NUNCA se usa este componente para "explicar" un valor concreto de la empresa —
 * para eso está `<PorQueEsteValor>` (Fase 3.3) que consume `valuation.hypotheses`
 * del payload real y degrada a `<Empty/>` si Intel no emite.
 *
 * Uso:
 *   <MethodDetails
 *     title="Cómo se calcula la valoración"
 *     formula="EV = múltiplo × EBITDA − deuda neta + caja"
 *     steps={[
 *       "Se toma el EBITDA de los últimos 12 meses o del último ejercicio verificado.",
 *       "Se multiplica por un rango de múltiplos observado en compañías comparables...",
 *       "Se resta la deuda financiera neta para obtener el valor para los accionistas.",
 *     ]}
 *   />
 */

import * as React from 'react';

export function MethodDetails({
  title,
  formula,
  steps,
  defaultOpen = false,
  testid,
}: {
  title: string;
  formula?: string;
  steps: string[];
  defaultOpen?: boolean;
  testid?: string;
}) {
  return (
    <details className="method" open={defaultOpen} data-testid={testid ?? 'method-details'}>
      <summary>
        {title}
        <span className="ch" aria-hidden="true">⌄</span>
      </summary>
      <div className="mbody">
        {formula && (
          <div className="formula" data-testid={testid ? `${testid}-formula` : undefined}>{formula}</div>
        )}
        {steps.length > 0 && (
          <ol data-testid={testid ? `${testid}-steps` : undefined}>
            {steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        )}
      </div>
    </details>
  );
}

/**
 * Copy CF de las metodologías canónicas (Fase 3). Redactado por el agente como
 * prosa estática — no proviene del payload, no describe datos de empresa.
 * Fase 3.4 · registro analista→no-financiero, sin mencionar internos del motor.
 */
export const METHOD_VALORACION = {
  title: 'Cómo se calcula la valoración',
  formula: 'EV = múltiplo × EBITDA − deuda neta + caja',
  steps: [
    'Se toma el EBITDA de los últimos 12 meses o del último ejercicio verificado.',
    'Se multiplica por un rango de múltiplos observado en compañías comparables del mismo sector y tamaño.',
    'Se resta la deuda financiera neta (deuda − caja) para obtener el valor para los accionistas (Equity Value).',
    'Si hay hipótesis específicas —crecimiento superior al sector, márgenes defensivos, sinergias— se detallan en el bloque "¿Por qué este valor?".',
  ],
} as const;

export const METHOD_HHI = {
  title: '¿Cómo se mide la concentración del mercado?',
  formula: 'HHI = Σ(cuota_i)² × 10.000',
  steps: [
    'Se elevan al cuadrado las cuotas de mercado de cada operador y se suman.',
    'El resultado se sitúa en la banda de referencia: por debajo de 1.500 el mercado está fragmentado; entre 1.500 y 2.500, moderadamente concentrado; por encima de 2.500, muy concentrado.',
    'Un mercado fragmentado es terreno fértil para un roll-up; uno concentrado dificulta la entrada y suele exigir sinergias claras para justificar el precio.',
  ],
} as const;

export const METHOD_RANKINGS = {
  title: '¿Cómo se define el universo comparable?',
  steps: [
    'Se seleccionan empresas activas del mismo código CNAE de división y misma banda de tamaño (por empleados o facturación).',
    'Se ordenan por facturación y se calcula la posición absoluta y el percentil de la empresa objetivo.',
    'El percentil describe qué proporción del universo comparable factura menos que la empresa: percentil 94 = la empresa factura más que el 94% de sus comparables.',
  ],
} as const;
