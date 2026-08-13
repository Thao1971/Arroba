/**
 * HARDENING-021 · Fase 1 · Glosario canónico de explicabilidad (tooltips CF).
 *
 * Fuente de verdad: /app/memory/GLOSARIO_EXPLICABILIDAD_FICHA.md (usuario · 2026-08-13).
 * Registro CF de analista a no-financiero. 1 frase, 2 máximo. Cada entrada:
 *   · definition  →  qué es (llano)
 *   · why_ma      →  para qué importa en una operación (opcional)
 *   · band        →  banda de referencia si ayuda (opcional)
 *
 * REGLA: son definiciones de concepto, NO dato de empresa. R15 se respeta porque
 * el copy es prosa CF genérica del término (no fabrica cifras de la empresa).
 * NUNCA mencionar "Intel", "master_id", ni internos del motor.
 */

export type GlosarioEntry = {
  label: string;
  definition: string;
  why_ma?: string;
  band?: string;
};

/**
 * Devuelve el copy compuesto del tooltip a partir de la entry canónica.
 * Formato: "{definition} {why_ma} {band}" separado por espacios (una línea de prosa).
 */
export function formatGlosarioTooltip(entry: GlosarioEntry): string {
  const parts = [entry.definition];
  if (entry.why_ma) parts.push(entry.why_ma);
  if (entry.band) parts.push(entry.band);
  return parts.join(' ');
}

export const GLOSARIO: Record<string, GlosarioEntry> = {
  // ─── Rentabilidad y resultado ───
  EBITDA: {
    label: 'EBITDA',
    definition: 'Beneficio del negocio antes de intereses, impuestos y amortizaciones; aproxima la caja que genera la actividad.',
    why_ma: 'Es la base del precio en una venta: el valor suele calcularse como un múltiplo del EBITDA.',
  },
  MARGEN_EBITDA: {
    label: 'Margen EBITDA',
    definition: 'Qué parte de cada euro facturado se convierte en caja operativa (EBITDA / ventas).',
    why_ma: 'Es el termómetro de la calidad del negocio; cuanto más alto, más rentable y defendible.',
  },
  RESULTADO_NETO: {
    label: 'Resultado neto',
    definition: 'Beneficio final, ya descontados intereses e impuestos.',
    why_ma: 'El margen neto es ese beneficio sobre la facturación.',
  },
  ROE: {
    label: 'ROE',
    definition: 'Cuánto gana la empresa por cada euro puesto por los accionistas (beneficio / patrimonio neto).',
    why_ma: 'Mide la rentabilidad para el dueño.',
  },
  ROA: {
    label: 'ROA',
    definition: 'Beneficio sobre el total de activos: cuánto rinde todo lo que la empresa tiene.',
  },
  ROCE: {
    label: 'ROCE',
    definition: 'Rentabilidad sobre el capital empleado (propio + deuda).',
    why_ma: 'Dice si el negocio rinde por encima de lo que cuesta financiarlo.',
  },

  // ─── Valor y precio ───
  ENTERPRISE_VALUE: {
    label: 'Enterprise Value (EV)',
    definition: 'Valor de toda la empresa, para accionistas y acreedores (fondos propios + deuda − caja).',
    why_ma: 'Es lo que "cuesta" el negocio con independencia de cómo esté financiado.',
  },
  EQUITY_VALUE: {
    label: 'Equity Value',
    definition: 'Lo que reciben los accionistas: el valor una vez descontada la deuda.',
    why_ma: 'Es el precio de las acciones.',
  },
  EV_EBITDA: {
    label: 'EV/EBITDA (múltiplo)',
    definition: 'Cuántas veces el EBITDA anual paga un comprador por la empresa.',
    why_ma: 'Es la vara con la que se compara el precio entre compañías del mismo sector.',
  },

  // ─── Deuda y solvencia ───
  DEUDA_FINANCIERA_NETA: {
    label: 'Deuda financiera neta',
    definition: 'Deuda con bancos y mercados menos la caja disponible.',
    why_ma: 'Es la deuda "real" que asume un comprador.',
  },
  DN_EBITDA: {
    label: 'DN / EBITDA',
    definition: 'Años de beneficio operativo que harían falta para pagar la deuda neta.',
    band: 'Por debajo de 3× es cómodo; por encima de 4×, tensionado — encarece o complica una compra.',
  },
  AUTONOMIA_FINANCIERA: {
    label: 'Autonomía financiera (PN / activo)',
    definition: 'Qué parte del balance se financia con recursos propios y no con deuda.',
    why_ma: 'Cuanto más alta, más sólida y menos dependiente de los bancos.',
  },
  COBERTURA_INTERESES: {
    label: 'Cobertura de intereses',
    definition: 'Cuántas veces el beneficio operativo cubre los intereses de la deuda (EBIT / gastos financieros).',
    why_ma: 'Cuanto mayor, más holgura.',
  },
  RATIO_LIQUIDEZ: {
    label: 'Ratio de liquidez',
    definition: 'Activo a corto / deuda a corto.',
    band: 'Por encima de 1, la empresa puede atender sus pagos inmediatos sin apuros.',
  },
  PRUEBA_ACIDA: {
    label: 'Prueba ácida',
    definition: 'Igual que la liquidez pero sin contar inventario: liquidez más exigente.',
  },

  // ─── Caja y circulante ───
  OCF: {
    label: 'Flujo de explotación (OCF)',
    definition: 'Caja que genera la actividad ordinaria del negocio, antes de invertir.',
  },
  FCF: {
    label: 'Free Cash Flow (FCF)',
    definition: 'La caja que sobra tras invertir en el negocio (OCF − capex).',
    why_ma: 'Es el dinero realmente disponible para pagar deuda, repartir dividendos o reinvertir.',
  },
  CAPEX: {
    label: 'Capex',
    definition: 'Inversión en activos fijos (maquinaria, instalaciones, tecnología).',
  },
  DSO: {
    label: 'DSO — días de cobro',
    definition: 'Días medios que la empresa tarda en cobrar a sus clientes.',
  },
  DPO: {
    label: 'DPO — días de pago',
    definition: 'Días medios que tarda en pagar a sus proveedores.',
  },
  CICLO_CAJA: {
    label: 'Ciclo de caja (CCC)',
    definition: 'Días que el dinero está inmovilizado en el circulante (cobro + inventario − pago).',
    why_ma: 'Cuanto más corto, menos capital atrapado.',
  },

  // ─── Crecimiento ───
  CAGR_3Y: {
    label: 'CAGR (3 años)',
    definition: 'Ritmo de crecimiento medio anual de la facturación en los últimos 3 años, ya compuesto.',
    why_ma: 'Resume la trayectoria en un solo número.',
  },

  // ─── Posición y mercado ───
  PERCENTIL_SECTORIAL: {
    label: 'Percentil sectorial',
    definition: 'Posición de la empresa frente a las de su sector: percentil 94 = factura más que el 94% de sus comparables.',
  },
  POSICION_MERCADO: {
    label: 'Posición de mercado / localidad',
    definition: 'Ranking de la empresa dentro de su universo comparable (mismo sector y banda de tamaño) y dentro de su territorio.',
  },
  HHI: {
    label: 'Índice de concentración (HHI)',
    definition: 'Mide cómo de repartido está el mercado.',
    band: 'Bajo (<1.500) = fragmentado, muchos actores pequeños (terreno fértil para un roll-up); alto (>2.500) = pocos dominan.',
  },

  // ─── Señales ───
  SIGNAL_IMPACT: {
    label: 'Impacto',
    definition: 'Cuánto puede mover esta señal el atractivo de la empresa para una operación.',
  },
  SIGNAL_CONFIDENCE: {
    label: 'Confianza',
    definition: 'Cómo de fiable es la señal según la calidad del dato que la sustenta.',
  },
};

/**
 * Devuelve la entrada glosario con normalización defensiva. Si `key` no existe,
 * retorna `null` (el consumidor debe ignorar el tooltip o mostrar `data-tip` literal).
 */
export function glosarioLookup(key: string | null | undefined): GlosarioEntry | null {
  if (!key) return null;
  return GLOSARIO[key] ?? null;
}
