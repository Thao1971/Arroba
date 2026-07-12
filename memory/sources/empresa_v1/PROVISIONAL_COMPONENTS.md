# PROVISIONAL_COMPONENTS.md — COMP-P asignados durante Sprint F0.x

Registro autoritativo de los **COMP-IDs provisionales** (rango `COMP-P-0001` a
`COMP-P-9999`) creados durante Sprint F0. Este rango NO puede reutilizarse
para ningún componente futuro no provisional (ver `SPRINT_F0_1_BRIEF.md` ·
"Convención COMP-P").

Cada COMP-P debe:
- Vivir bajo `/app/frontend/src/components/company/**` (regla R14).
- Declarar en JSDoc cabecera:
  ```
  @componentId COMP-P-XXXX
  @status PROVISIONAL
  @section <Sección>
  @source <archivo ZIP · bloque>
  @acc_pending <razón · qué falta en ACC para promover>
  ```
- Migrarse a un COMP-XXXX definitivo cuando el ACC v0.2 formalice la sección
  en un sub-sprint dedicado (rename + baja del COMP-P).

## COMP-P asignados en F0.1 (Perfil · sección "Resumen" del ZIP)

| COMP-P | Nombre | Sección | Motivo provisional | Estado | Endpoint V2 consumido |
|---|---|---|---|---|---|
| `COMP-P-0001` | Company AI Summary | Perfil | ACC declara "6. Perfil" en Índice pero el cuerpo no expone COMP-ID para el resumen narrativo IA (contradicción C2). | PROVISIONAL · READY | `POST /api/v1/semantic-intelligence/profile` (`value_proposition`/`business_model`) |
| `COMP-P-0002` | Financial Evolution Teaser | Perfil | Igual que C2 · teaser narrativo hacia Finanzas sin COMP-ID en ACC. | PROVISIONAL · READY | `POST /api/v1/financial-intelligence/analyze` (`evolution`) |
| `COMP-P-0003` | Primary KPIs Grid | Perfil | Igual que C2 · 4 KPIs de Resumen sin COMP-ID formal. | PROVISIONAL · READY | `POST /api/v1/financial-intelligence/analyze` + `POST /api/v2/company-intelligence/identity` |
| `COMP-P-0004` | Positioning KPIs Grid | Perfil | Igual que C2 + BLOQUEADO por C13 (Ranking Engine ausente V2). | PROVISIONAL · BLOCKED (stub UnavailableBlock) | — |
| `COMP-P-0005` | Identity Fields Grid | Perfil | Igual que C2 · grid oficial de campos sin COMP-ID formal. | PROVISIONAL · READY | `POST /api/v2/company-intelligence/identity` |
| `COMP-P-0006` | Intelligence Scores Ring | Perfil | Igual que C2 + Scores Engine no expuesto V2. | PROVISIONAL · BLOCKED (stub UnavailableBlock) | — |

## Reglas de mantenimiento

1. Cualquier nuevo COMP-P se añade a la tabla **en el mismo commit** que
   introduce el componente.
2. Los COMP-P son consumidos por el guard R14
   (`__tests__/r14_comp_id_declaration_guard.test.ts`), que verifica que cada
   archivo `.tsx` bajo `components/company/**` declara un `@componentId`
   único.
3. Cuando se promueva un COMP-P a COMP-XXXX definitivo:
   - Renombrar el archivo si procede.
   - Cambiar `@componentId COMP-P-XXXX` → `@componentId COMP-YYYY` en el JSDoc.
   - Cambiar `@status PROVISIONAL` → `@status READY`/`BLOCKED` según proceda.
   - Mover la fila de esta tabla al histórico (al final del archivo) con la
     fecha de promoción.
4. **El COMP-P retirado NO puede reasignarse** a otro componente futuro.

## Historial

- v1 · 2026-07-06 · alta inicial de 6 COMP-P para el bloque "Perfil / Resumen"
  del Sprint F0.1.
