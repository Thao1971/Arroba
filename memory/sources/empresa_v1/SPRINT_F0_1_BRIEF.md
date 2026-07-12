# Sprint F0.1 — Header + Perfil de la Ficha de Empresa

## Estado
Pendiente de aprobación del usuario tras entrega del `SPRINT_F0_PLAN.md`. NO se puede empezar hasta que el usuario apruebe el scope concreto de F0.1 con COMP-IDs, endpoints y contradicciones (si las hay).

## Reglas obligatorias (dictadas por el usuario)
1. No modificar el ACC (`sources/empresa_v1/ACC_v0.1.md`).
2. No modificar el ZIP (`sources/empresa_v1/empresa_html/`).
3. No modificar Agency Tool (contrato V2 congelado).
4. No implementar lógica de negocio en el frontend.
5. No simular datos.
6. Si un componente depende de una capacidad todavía no disponible en Agency Tool, dejar el componente stub (con `UnavailableBlock` + COMP-ID declarado) y continuar con el resto.
7. No bloquear el sprint por componentes futuros.

## Entregables obligatorios (dictados por el usuario)
1. Componentes React implementados de Header + Perfil (uno por COMP-ID, cumpliendo R14).
2. Capturas de pantalla de cada componente y de la ficha compuesta.
3. Comparativa visual respecto al ZIP (side-by-side ZIP-original ↔ implementación arroba).
4. Lista de componentes pendientes por dependencia contractual, con COMP-ID y capacidad Agency Tool pendiente.
5. Tests ejecutados (pytest + vitest + guard R13 + nuevo guard R14 si se crea).
6. Incidencias encontradas.

## Regla de detención selectiva
Solo si aparece una contradicción estructural entre el ZIP y el ACC que impida implementar correctamente un componente, detener el desarrollo de ese componente concreto (no del sprint) y documentar la discrepancia para validación humana. Continuar con el resto de componentes de F0.1.

## Cumplimiento canónico obligatorio
- Regla R14 (Un COMP = un componente React) — cada componente React declara su COMP-ID en cabecera JSDoc/comentario.
- Principio P1 (Explainability First) — componentes con inteligencia llevan Tooltip explicativo.
- Principio P2 (Intelligence over Data) — la UI prioriza inteligencia sobre datos brutos.
- Principio P3 (Zero Coupling) — contratos canónicos `arroba-*-v1`. Ningún consumo directo del shape crudo del proveedor.
- Regla R13 (SoT única) — solo un archivo por pantalla. Los componentes de Header + Perfil sustituyen a los anteriores.
- Regla R12 (Nunca `/master/*`) — sigue vigente.
- Regla R11 (Visual Governance) — el ZIP entregado por el usuario constituye la aprobación visual explícita. No requiere lift adicional siempre que la implementación reproduzca fielmente el ZIP.

## Estado de arranque
NO ARRANCAR HASTA APROBACIÓN EXPLÍCITA del usuario tras revisar `SPRINT_F0_PLAN.md`.
