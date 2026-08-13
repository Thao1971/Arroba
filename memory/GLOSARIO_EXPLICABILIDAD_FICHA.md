# Glosario de explicabilidad — copy de tooltips de la ficha (CF)

> Fuente de verdad del **copy** de los tooltips (`data-tip`) de la Fase 1. Supera al copy del mockup en utilidad:
> cada definición = **qué es (llano)** + **para qué importa en una operación** + **banda de referencia** si ayuda.
> Una frase, dos máximo. Registro de analista que explica a un no-financiero. Son definiciones de concepto
> (no dato de empresa) → se pueden redactar libremente (no viola R15).

## Rentabilidad y resultado
- **EBITDA** — Beneficio del negocio antes de intereses, impuestos y amortizaciones; aproxima la caja que
  genera la actividad. **Es la base del precio en una venta: el valor suele calcularse como un múltiplo del EBITDA.**
- **Margen EBITDA** — Qué parte de cada euro facturado se convierte en caja operativa (EBITDA / ventas). Es el
  termómetro de la calidad del negocio; cuanto más alto, más rentable y defendible.
- **Resultado neto** — Beneficio final, ya descontados intereses e impuestos. El **margen neto** es ese beneficio
  sobre la facturación.
- **ROE** — Cuánto gana la empresa por cada euro puesto por los accionistas (beneficio / patrimonio neto). Mide
  la rentabilidad para el dueño.
- **ROA** — Beneficio sobre el total de activos: cuánto rinde todo lo que la empresa tiene.
- **ROCE** — Rentabilidad sobre el capital empleado (propio + deuda). Dice si el negocio rinde por encima de lo
  que cuesta financiarlo.

## Valor y precio
- **Enterprise Value (EV)** — Valor de toda la empresa, para accionistas y acreedores (fondos propios + deuda −
  caja). Es lo que "cuesta" el negocio con independencia de cómo esté financiado.
- **Equity Value** — Lo que reciben los accionistas: el valor una vez descontada la deuda. Es el precio de las
  acciones.
- **EV/EBITDA (múltiplo)** — Cuántas veces el EBITDA anual paga un comprador por la empresa. Es la vara con la que
  se compara el precio entre compañías del mismo sector.

## Deuda y solvencia
- **Deuda financiera neta** — Deuda con bancos y mercados menos la caja disponible. Es la deuda "real" que asume
  un comprador.
- **DN / EBITDA** — Años de beneficio operativo que harían falta para pagar la deuda neta. **Por debajo de 3× es
  cómodo; por encima de 4×, tensionado** — encarece o complica una compra.
- **Autonomía financiera (PN / activo)** — Qué parte del balance se financia con recursos propios y no con deuda.
  Cuanto más alta, más sólida y menos dependiente de los bancos.
- **Cobertura de intereses** — Cuántas veces el beneficio operativo cubre los intereses de la deuda (EBIT /
  gastos financieros). Cuanto mayor, más holgura.
- **Ratio de liquidez** — Activo a corto / deuda a corto. Por encima de 1, la empresa puede atender sus pagos
  inmediatos sin apuros.
- **Prueba ácida** — Igual que la liquidez pero sin contar inventario: liquidez más exigente.

## Caja y circulante
- **Flujo de explotación (OCF)** — Caja que genera la actividad ordinaria del negocio, antes de invertir.
- **Free Cash Flow (FCF)** — La caja que sobra tras invertir en el negocio (OCF − capex). Es el dinero realmente
  disponible para pagar deuda, repartir dividendos o reinvertir.
- **Capex** — Inversión en activos fijos (maquinaria, instalaciones, tecnología).
- **DSO — días de cobro** — Días medios que la empresa tarda en cobrar a sus clientes.
- **DPO — días de pago** — Días medios que tarda en pagar a sus proveedores.
- **Ciclo de caja (CCC)** — Días que el dinero está inmovilizado en el circulante (cobro + inventario − pago).
  Cuanto más corto, menos capital atrapado.

## Crecimiento
- **CAGR (3 años)** — Ritmo de crecimiento medio anual de la facturación en los últimos 3 años, ya compuesto.
  Resume la trayectoria en un solo número.

## Posición y mercado
- **Percentil sectorial** — Posición de la empresa frente a las de su sector: percentil 94 = factura más que el
  94% de sus comparables.
- **Posición de mercado / localidad** — Ranking de la empresa dentro de su universo comparable (mismo sector y
  banda de tamaño) y dentro de su territorio.
- **Índice de concentración (HHI)** — Mide cómo de repartido está el mercado. **Bajo (<1.500) = fragmentado**,
  muchos actores pequeños (terreno fértil para un roll-up); **alto (>2.500) = pocos dominan.**

## Señales
- **Impacto** — Cuánto puede mover esta señal el atractivo de la empresa para una operación.
- **Confianza** — Cómo de fiable es la señal según la calidad del dato que la sustenta.

## Procedencia (Fase 2, cuando Intel la emita)
Principio: cuando Arroba calcula, decirlo **y aclarar que parte de dato verificado** — nunca sugerir que se
inventa. Etiquetas de los `.srcdot`:
- `.srcdot.r` → **"Verificado en fuente"** — dato tomado directamente de cuentas o registros oficiales.
- `.srcdot.c` → **"Calculado por Arroba sobre datos verificados"** — métrica que Arroba deriva a partir de datos
  verificados en fuente (no es una estimación al aire).
- **✦** → **"Inferido por Arroba"** — valor deducido cuando no consta el dato directo; léelo con cautela.
