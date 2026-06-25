# arroba.com — Canonical Documentation Pack v1.0

> **Pack distribuible del canon documental de arroba.com.**
> Baseline: `v1.0-canonical-baseline` · congelada el **2026-06-25** tras Sprint 0 + Sprint 0.5.
>
> Este pack contiene la versión canónica de toda la documentación arquitectónica del proyecto: filosofía, ontología, framework UX, specs de motores, auditorías y mapas. **Es un entregable inmutable**.

---

## Estructura del pack

```
canonical_pack_v1.0/
├── README.md                              ← este archivo
│
├── canonical/                             ← documentos canónicos vivos
│   ├── ARROBA_PHILOSOPHY.md               (capa 1 — Blueprint estratégico)
│   ├── ENTITY_MODEL.md                    (capa 3 — ontología, v1.1.0)
│   ├── ENTITY_FRAMEWORK.md                (capa 3 — arquitectura UX, v1.1.0)
│   ├── CANON_INDEX.md                     (meta — índice maestro del canon)
│   ├── ENGINE_ARCHITECTURE.md             (meta — cadena de motores)
│   ├── PRD.md                             (estado — incluye sección baseline)
│   └── CHANGELOG.md                       (estado — incluye entrada baseline)
│
├── specs/                                 ← Sprint 0 — Engines & Specs (capa 4)
│   ├── TRANSACTION_OS_SPEC.md             v1.2.0
│   ├── TRANSACTION_COPILOT_SPEC.md        v1.2.0
│   ├── COPILOTS_SPEC.md                   v1.1.0
│   ├── MEMORY_ENGINE_SPEC.md              v1.1.0
│   ├── AGENTIC_LAYERS_SPEC.md             v1.1.0
│   └── MONETIZATION_SPEC.md               v1.1.0
│
├── audit/                                 ← Sprint 0.5 Ciclo A — auditorías
│   ├── CANON_AUDIT_REPORT.md
│   └── OPEN_ITEMS_CLASSIFICATION.md
│
└── summary/                               ← Sprint 0.5 Ciclo B — consolidación
    ├── SPRINT0_EXECUTIVE_SUMMARY.md
    └── ARCHITECTURE_MAP.md
```

---

## Orden de lectura recomendado

### Para stakeholders (lectura rápida, ~20 min)

1. `summary/SPRINT0_EXECUTIVE_SUMMARY.md` — TL;DR y resumen ejecutivo.
2. `summary/ARCHITECTURE_MAP.md` — mapas visuales de capas, motores y entidades.

### Para arquitectos / product managers (~1-2 h)

1. `canonical/ARROBA_PHILOSOPHY.md` — visión estratégica y principios UX (capas 1+2).
2. `canonical/CANON_INDEX.md` — mapa de las 7 capas canónicas con punteros.
3. `canonical/ENGINE_ARCHITECTURE.md` — cadena de inteligencia end-to-end.
4. `canonical/ENTITY_MODEL.md` + `canonical/ENTITY_FRAMEWORK.md` — capa 3.

### Para ingenieros que implementan un motor concreto

1. `canonical/CANON_INDEX.md` — localizar el spec del motor.
2. El spec correspondiente en `specs/`.
3. `canonical/ENGINE_ARCHITECTURE.md` — contratos con motores vecinos.
4. `canonical/ENTITY_MODEL.md` — entidades que el motor toca.

### Para validar deudas y open items

1. `audit/CANON_AUDIT_REPORT.md` — inventario de contradicciones detectadas.
2. `audit/OPEN_ITEMS_CLASSIFICATION.md` — clasificación G1/G2/G3/G4 con su estado.

---

## Estado de la baseline

- ✅ **6 specs canónicos** producidos en Sprint 0.
- ✅ **2 reportes de auditoría** producidos en Sprint 0.5 Ciclo A.
- ✅ **17 OPENs G1** (inconsistencias intra-spec autocerrables) cerrados en Sprint 0.5 Ciclo B.
- ✅ **9 OPENs G2** (decisiones canónicas pendientes) confirmados y propagados.
- ✅ **Cero contradicciones canon ↔ legacy** verificadas tras propagación.
- ✅ **4 documentos consolidadores nuevos** (CANON_INDEX, ENGINE_ARCHITECTURE, SPRINT0_EXECUTIVE_SUMMARY, ARCHITECTURE_MAP).
- ✅ **Pack distribuible** congelado (este archivo).

**Open items que persisten**: G3 (decisiones de producto pendientes de input humano) y G4 (backlog estratégico). No bloquean el inicio del Sprint 1.

---

## Decisiones canónicas que el pack incorpora

1. **Match pasa a ser una entidad canónica de primer nivel** (decisión G2.M). Materializa el resultado del motor de matching con identidad propia, ciclo de vida observable, score, fit_factors y trazabilidad bidireccional.
2. **Renombre `client → user`** como nombre canónico del actor humano del producto.
3. **Renombre `team_arroba → arroba_team`** como nombre canónico de la entidad organizativa interna.
4. **Fases del journey M&A**: `T1`…`T15` (`TRANSACTION_OS_SPEC.md` §3).
5. **Fases de `Operation.current_phase`**: orden canónico `nda → im → qa → loi → dd → negotiation → spa → closing → integration`.
6. **Capa 7 — Engines & Specs**: incorporada formalmente en `ARROBA_PHILOSOPHY.md` §13 entre *Entity Framework* y *Design System*.
7. **Catálogo de entidades abstraído**: el conjunto de tipos del producto se enumera y evoluciona por declaración, no por cardinalidad.

---

## Regla de jerarquía del canon

```
   Capa 1 (Blueprint) > Capa 2 (UX Blueprint) > Capa 3 (Entity Framework)
        > Capa 4 (Engines & Specs) > Capa 5 (Design System)
        > Capa 6 (Diseños) > Capa 7 (Implementación)
```

En cualquier conflicto entre dos documentos, **prevalece el de la capa superior**. Si el código contradice un spec, se corrige el código.

---

## Cómo evolucionar el canon después de esta baseline

1. Modificar el documento de capa correspondiente.
2. Bumpear su versión (semver: mayor / menor / patch).
3. Añadir entrada en su CHANGELOG interno (al inicio del documento).
4. Si afecta a otros documentos del canon, propagarlo (con su propio bump).
5. Reflejar en `/app/memory/CHANGELOG.md` cuando sea release-relevante.
6. Cuando se acumulen suficientes cambios, ejecutar una nueva auditoría → producir nuevo `CANON_AUDIT_REPORT.md` → propagar → freeze nueva baseline (`v1.x-canonical-baseline`).

---

## Compromiso de inmutabilidad

Este pack (`canonical_pack_v1.0.zip`) es **inmutable**.

- Cualquier modificación del canon **después** del freeze produce una **nueva baseline** (`v1.1-canonical-baseline`, etc.) y un nuevo pack.
- El pack v1.0 se preserva como referencia histórica y como "fuente de verdad" del estado del proyecto al 2026-06-25.

---

## Próximo hito

**Sprint 1 — Identidad + Roles + Planes + Billing.**

Estado: **NO INICIADO**. Requiere aprobación explícita del usuario.

Scope tentativo (sujeto a refinamiento):
- Modelo de usuario, organización y memberships.
- Roles canónicos y permisos.
- Planes (según `MONETIZATION_SPEC.md`) con gating funcional.
- Integración con un proveedor de billing.
- Flujo de upgrade desde locks en la UX.

---

> **Generado por**: Sprint 0.5 Ciclo B — Fase B.7.
> **Idioma**: español.
> **Licencia**: documento interno de arroba.com.
