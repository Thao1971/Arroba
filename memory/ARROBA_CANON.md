# ARROBA — Canon (puerta de entrada única)

## Rol
Este documento no contiene canon. Este documento **indica dónde vive el canon**. Es el punto de entrada obligatorio para cualquier agente, humano o proceso que necesite consultar la Source of Truth de arroba.com.

Su objetivo es:
1. Enumerar los documentos que forman el canon vivo.
2. Declarar la Source of Truth para cada ámbito del producto.
3. Fijar el orden de precedencia cuando dos documentos entren en conflicto.

## Source of Truth de la Ficha de Empresa (Sprint F0)

A partir de 2026-07-06 la Ficha de Empresa tiene una única SoT compuesta por:
- **SoT visual (estructura, layout, UX)**: `/app/memory/sources/empresa_v1/empresa_html/`
- **SoT funcional (comportamiento, contratos)**: `/app/memory/sources/empresa_v1/ACC_v0.1.md`
- **SoT contrato Agency Tool (V2)**: `/app/memory/sources/empresa_v1/ARROBA_V2_INTEGRATION_GUIDE.md` + `/app/memory/sources/empresa_v1/arroba.v2.json`

Cualquier documento previo relativo a la Ficha de Empresa queda DEPRECADO. Consultar los banners al inicio de esos archivos.

## Documentos que forman el canon vivo

| Documento | Ruta | Ámbito |
|---|---|---|
| Blueprint Estratégico | `/app/_design_intake/uploads/Arroba Com Blueprint Estrategico Arquitectonico V1.docx` (fuente original) + reflejado en `ARROBA_PHILOSOPHY.md` | Visión estratégica y filosofía del producto |
| Principios Arquitectónicos | `/app/memory/ARROBA_ARCHITECTURAL_PRINCIPLES.md` | P1 Explainability First, P2 Intelligence over Data, P3 Zero Coupling + R11, R12, R13 |
| UX Blueprint | `/app/memory/ARROBA_PHILOSOPHY.md §12` (embebido) | Principios de experiencia de usuario |
| Entity Model | `/app/memory/ENTITY_MODEL.md` | Modelo de dominio |
| Entity Framework | `/app/memory/ENTITY_FRAMEWORK.md` | Ontología UX |
| Engine Architecture | `/app/memory/ENGINE_ARCHITECTURE.md` | Cadena de motores |
| Specs de motores (Sprint 0) | `/app/memory/specs/*.md` | Contratos internos de cada motor |
| Design System | `/app/memory/DESIGN_SYSTEM.md` + `/app/frontend/src/components/ds/` + `/app/frontend/src/styles/tokens.css` | Tokens, primitivas, page patterns |
| Contrato Agency Tool | `/app/memory/AGENCY_TOOL_CONTRACT_v1.md` | Contrato externo v1 |
| Plan Consumer Integration | `/app/memory/ARROBA_CONSUMER_INTEGRATION_PLAN_v1.md` | Plan operativo migración a `arroba.v1` |
| Integration Pack | `/app/memory/ARROBA_INTEGRATION_PACK_v1.md` | Documento autosuficiente para la integración |
| Pantallas canónicas | `/app/memory/CANONICAL_SCREENS.md` | Registro autoritativo de pantallas activas y legacy |
| Referencias visuales | `/app/memory/ARROBA_UI_VISUAL_REFERENCES.md` | Referencias visuales canónicas (ficha empresa 3-col + composer Valora) |
| PRD | `/app/memory/PRD.md` | Estado vivo del desarrollo del producto |
| Changelog | `/app/memory/CHANGELOG.md` | Registro cronológico de cambios |
| Index navegable | `/app/memory/CANON_INDEX.md` | Índice navegable del conocimiento |

## Source of Truth por ámbito

| Ámbito | Source of Truth |
|---|---|
| Visión estratégica | Blueprint Estratégico (docx original + `ARROBA_PHILOSOPHY.md`) |
| Principios y reglas arquitectónicas | `ARROBA_ARCHITECTURAL_PRINCIPLES.md` |
| Modelo de dominio | `ENTITY_MODEL.md` |
| Motores y contratos internos | `ENGINE_ARCHITECTURE.md` + `specs/` |
| Design System (tokens, primitivas, patterns) | `DESIGN_SYSTEM.md` + carpeta `ds/` |
| Contrato con proveedores externos | `AGENCY_TOOL_CONTRACT_v1.md` + `ARROBA_INTEGRATION_PACK_v1.md` |
| Estado vivo del producto | `PRD.md` |
| Planificación viva | `PRD.md` |
| Registro autoritativo de pantallas | `CANONICAL_SCREENS.md` |
| Referencias visuales | `ARROBA_UI_VISUAL_REFERENCES.md` |
| Puerta de entrada al conocimiento | `ARROBA_CANON.md` (este archivo) |
| Índice navegable | `CANON_INDEX.md` |
| Ficha de Empresa (visual) | `sources/empresa_v1/empresa_html/` |
| Ficha de Empresa (funcional) | `sources/empresa_v1/ACC_v0.1.md` |
| Contrato Agency Tool (V2) | `sources/empresa_v1/ARROBA_V2_INTEGRATION_GUIDE.md` + `sources/empresa_v1/arroba.v2.json` |

## Orden de precedencia (jerarquía canónica)

Cuando dos documentos del canon entren en conflicto, prevalece el de mayor jerarquía en esta lista:

1. **Blueprint Estratégico**
2. **Principios Arquitectónicos** (`ARROBA_ARCHITECTURAL_PRINCIPLES.md`)
3. **UX Blueprint** (`ARROBA_PHILOSOPHY.md §12`)
4. **Design System** (`DESIGN_SYSTEM.md` + `ds/` + `tokens.css`)
5. **PRD** (`PRD.md`)
6. **Implementación** (código en `/app/frontend/` y `/app/backend/`)

En caso de conflicto se resuelve moviéndose desde el nivel más alto hacia el más bajo. La implementación nunca dicta canon a niveles superiores.

## Documentos que NO forman parte del canon vivo

| Documento | Ruta | Motivo |
|---|---|---|
| Roadmap obsoleto | `/app/memory/ROADMAP.md` (archivado bajo `_legacy/memory/`) | Superseded por `PRD.md` |
| Snapshot histórico Sprint 0 | `/app/memory/canonical_pack_v1.0/` | Snapshot congelado 2026-06-25. No consultar como fuente activa. |
| DOCX duplicados en `_design_intake/uploads/` | Varios | Pendiente de consolidación documental posterior. |

## Regla de uso
Cualquier agente que necesite conocer el canon debe comenzar por este archivo (`ARROBA_CANON.md`) para localizar la Source of Truth correcta antes de consultar cualquier otro documento.

## Historial
- v1 · 2026-07-06 · creación inicial tras decisión canónica del usuario.
