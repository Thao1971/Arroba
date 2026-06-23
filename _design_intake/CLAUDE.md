# Arroba — Project conventions

## Formato de números y fechas (SIEMPRE)
- **Miles**: separados con punto. Ej: `5.265`, `183.978`, `4.228`.
- **Decimales**: separados con coma. Ej: `4,8M€`, `18,1%`, `2,4%`.
- **Fechas**: formato europeo español DD/MM/AAAA. Ej: `31/05/2026`. Meses abreviados en español (ene, feb, mar…).
- En JS usar `toLocaleString('es-ES')` para números.

## Marca
- Rojo primario: `#E8001D`. Negro: `#0C0C0E`. Neutros cálidos (crema/arena).
- Tipografía: Space Grotesk (display + body).
- Símbolo de IA: `✦` — marca todo lo generado por inteligencia / Copilot / agentes.
- Logo: `uploads/logo.png` (transparente; usar `filter: brightness(0) invert(1)` sobre fondo oscuro).

## Tesis de producto
Arroba es una **plataforma de toma de decisiones**, no un buscador ni una plataforma de datos.
Arquitectura: **ANALIZAR → VALORAR → COMPRAR O VENDER**. Cada fase conduce naturalmente a la siguiente.
Diferencial clave: la única plataforma española que evalúa con casi 5.000 métricas económicas.

## 5 capas de inteligencia (orden de mayor a menor)
1. Economic Intelligence
2. Market Intelligence
3. Company Intelligence
4. Investor Intelligence
5. M&A Intelligence
Cada capa tiene un agente IA especializado.

## Lenguaje
Bilingüe ES/EN, pero la UI de cara a usuario en español claro, sin jerga (evitar BORME/CNMV/DataComex como etiquetas; usar términos que cualquiera entienda).
