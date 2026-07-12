# ARROBA — Referencias Visuales Canónicas (v1)

> DEPRECADO 2026-07-06. Superseded por /app/memory/sources/empresa_v1/empresa_html/ (SoT visual) + /app/memory/sources/empresa_v1/ACC_v0.1.md (SoT funcional). Mantenido por trazabilidad histórica.


> Nota canónica: los principios (P1 Explainability First, P2 Intelligence over Data, P3 Zero Coupling) y reglas (R11, R12, R13) referenciados en este documento están formalizados en 'ARROBA_ARCHITECTURAL_PRINCIPLES.md'. Puerta de entrada al canon: 'ARROBA_CANON.md'.


## Regla general
Existen DOS referencias visuales SEPARADAS. No se pueden mezclar. No se puede volver al layout antiguo de una columna bajo ninguna circunstancia (regla R13).

## 1. Layout de Ficha de Empresa (referencia ESTRUCTURAL)
La estructura de pantalla debe tomar como referencia la ficha de empresa canónica:
- Layout de 3 columnas
- Navegación izquierda
- Contenido central
- Deal Panel derecho
- Header de entidad
- Composer flotante
- Archivo de referencia único: `/app/frontend/src/components/mockups/entity-canonical/CanonicalEntityMockupClient.tsx`
- PROHIBIDO usar el layout antiguo de una columna (`CPApp`, `cp-app.jsx`, cualquier archivo bajo `/app/_legacy/`).

## 2. Arroba Copilot (referencia del COMPOSER)
Para el composer / Arroba Copilot, tomar como referencia el que aparece en la página de Valora:
- Barra flotante inferior
- Estilo ancho y limpio
- Botón `+` a la izquierda
- Placeholder conversacional
- Acciones sugeridas encima
- Botón de envío circular a la derecha

## Resumen operativo
- Ficha de empresa = referencia ESTRUCTURAL (layout 3 columnas).
- Valora = referencia del ARROBA COPILOT (composer flotante inferior).
- No mezclar la referencia del composer con el layout antiguo de una columna.
- No mezclar el layout de ficha con otras plantillas.

## Estado
- Registrado durante fase de análisis previa a ARROBA Matching v1.0.
- Debe respetarse en TODA implementación futura (B.6.f Hito 1 en adelante, y en cualquier reconstrucción bajo el nuevo canon Matching).
