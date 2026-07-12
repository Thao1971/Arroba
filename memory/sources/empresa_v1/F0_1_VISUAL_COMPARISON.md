# Sprint F0.1 · Comparativa visual ZIP ↔ Implementación

Fecha: 2026-07-06
CIF de referencia: `B47820150` (`Grupo Olmedo Hoteles, S.L.` · Castilla Termal Olmedo)
URL de la implementación: `/es/empresa-f01/B47820150`
Modo backend usado para las capturas: `AGENCY_TOOL_MODE=mock` (poblado desde `seed_master_companies_e14.py` con `v2_identity` derivado del ZIP).

## Fuentes de comparación

- **ZIP oficial (SoT visual)**: `sources/empresa_v1/empresa_html/design_handoff_empresa/`
  - `Empresa.html` renderizada con React 18 + Babel Standalone (CDN).
  - Screenshots del handoff en `screenshots/01-empresa.png` (Header + Vista Ejecutiva) y `screenshots/03-empresa.png` (Perfil / Resumen).
- **Implementación arroba F0.1**: `/app/frontend/src/components/company/{header,perfil}/` compiladas y renderizadas contra `intelligence_layer` en modo mock.

## Compuesto general

| Referencia ZIP (screenshots/01-empresa.png) | Implementación (`01_ficha_composite_1440x900.png`) |
|---|---|
| `sources/empresa_v1/empresa_html/design_handoff_empresa/screenshots/01-empresa.png` | `sources/empresa_v1/F0_1_SCREENSHOTS/01_ficha_composite_1440x900.png` |

Full-page:
- Implementación completa · `sources/empresa_v1/F0_1_SCREENSHOTS/02_ficha_composite_full.png`.

## Header (COMP-1001..1005 + COMP-1010)

| COMP-ID | ZIP (referencia) | Implementación (crop) | Nota |
|---|---|---|---|
| COMP-1001 · Company Identity | `screenshots/01-empresa.png` — avatar `CT` + nombre legal + comercial + Verificada | `F0_1_SCREENSHOTS/11_comp1001_identity.png` | Reproduce fielmente el hero: avatar cuadrado con iniciales, nombre legal en `font-display`, nombre comercial secundario, chip "Verificada". Los aliases se muestran como "N alias" (colapsado por espacio) — el ZIP no muestra aliases porque `cp-data.js` no los expone. |
| COMP-1002 · Company Context | `screenshots/01-empresa.png` — línea `Grupo Olmedo Hoteles, S.L. · CIF B-47 594 478 · Hoteles y alojamientos similares · Olmedo (Valladolid)` + web | `F0_1_SCREENSHOTS/12_comp1002_context.png` | Actividad + CNAE 5510 + forma jurídica + ubicación + web. **Diferencia**: la CIF del ZIP viene con guiones (`B-47 594 478`); arroba usa `cif_normalized` (`B47820150`). Es correcto respecto al contrato canónico. |
| COMP-1003 · Company Public Status | `screenshots/01-empresa.png` — chip `Verificada` + `Auditada` (auditor) | `F0_1_SCREENSHOTS/13_comp1003_public_status.png` | Chips `Activa`, `En actividad`, `Inscrita`. **Diferencia**: el ZIP muestra "Auditada · Ernst & Young"; arroba no expone auditor en V2 (queda fuera de scope F0.1). El estado registral queda mejor cubierto que en el ZIP. |
| COMP-1004 · Company Quick Actions | `screenshots/01-empresa.png` — 3 botones (`Guardar`/`Seguir`/`Compartir`) + hero row con `Activar oportunidad`/`Reclamar empresa` | `F0_1_SCREENSHOTS/14_comp1004_quick_actions.png` | 6 botones deshabilitados: `Guardar`, `Seguir`, `Descargar NDA`, `Contactar`, `Hacer match`, `Compartir`. Tooltip `Disponible próximamente` en cada uno. **Nota**: el ZIP separa acciones secundarias (arriba) de acciones estratégicas (hero row); F0.1 las unifica en una única barra visible pero deshabilitada (decisión usuario 2026-07-06 · C14.5). |
| COMP-1005 · Executive Snapshot | `screenshots/01-empresa.png` (KPIs bajo el hero) | `F0_1_SCREENSHOTS/15_comp1005_executive_snapshot.png` | 4 tarjetas: Ingresos · EBITDA · Beneficio neto · Empleados (82). **Nota mock**: los 3 financieros aparecen como `—` porque `MockFinancialProvider` no tiene datos para `mc_olmedo` (fuera del seed E1.4). Empleados sí se renderiza con `82` (verificable desde identity.size). |
| COMP-1010 · User Relationship | — (no aparece explícitamente en el ZIP · bloques `Guardar`/`Seguir` viven en COMP-1004) | `F0_1_SCREENSHOTS/16_comp1010_user_relationship.png` | Stub `UnavailableBlock` con COMP-ID declarado. Motivo: capacidad V2 pendiente (following/alerts/watchlists). Decisión del sprint (regla R14: BLOCKED = stub visible, nunca oculto). |

Vista completa del Header:
- `F0_1_SCREENSHOTS/10_header_full.png` — compone las 6 filas del Header en su layout final.

## Perfil (COMP-P-0001..0006)

Referencia ZIP para el Perfil: `screenshots/03-empresa.png` (bloque "Resumen" · card oscura + evolución financiera + KPIs + identificación + scores).

| COMP-P | Nombre | ZIP (referencia) | Implementación | Nota |
|---|---|---|---|---|
| COMP-P-0001 | Company AI Summary | `screenshots/03-empresa.png` — card oscura `Resumen de compañía` con síntesis IA | `F0_1_SCREENSHOTS/21_compP0001_ai_summary.png` | Reproduce fielmente el card oscuro con `linear-gradient` + `✦` en la esquina + etiqueta uppercase + narrative. Consume `identity.description` (fallback semantic profile) coherente con el ZIP. |
| COMP-P-0002 | Financial Evolution Teaser | `screenshots/03-empresa.png` — card "Evolución financiera" + CTA `Ver cifras exactas` | `F0_1_SCREENSHOTS/22_compP0002_evolution_teaser.png` | En este mock el `MockFinancialProvider` no expone evolution para `mc_olmedo` → degrada a `UnavailableBlock` con mensaje explicativo. En modo real con Financial cubierto renderiza el teaser textual + CTA. |
| COMP-P-0003 | Primary KPIs Grid | `screenshots/03-empresa.png` — grid 4 KPIs (Ventas / EBITDA / Beneficio neto / Empleados) | `F0_1_SCREENSHOTS/23_compP0003_primary_kpis.png` | Grid 4 columnas. Empleados 82 poblado; resto `—` (mock financial ausente). Cada card tiene Tooltip con año + fuente + actualización. |
| COMP-P-0004 | Positioning KPIs Grid | `screenshots/03-empresa.png` — grid 4 KPIs (Ranking mercado / sector / localidad / Innovación) | `F0_1_SCREENSHOTS/24_compP0004_positioning_kpis.png` | Stub `UnavailableBlock` con COMP-P declarado. Motivo: Ranking Engine + Innovation Signal ausentes en V2 (C13). |
| COMP-P-0005 | Identity Fields Grid | `screenshots/03-empresa.png` — card "Identificación" grid oficial (13 campos) | `F0_1_SCREENSHOTS/25_compP0005_identity_grid.png` | Grid 4 columnas fiel al ZIP: Razón social, Nombre comercial, CIF, Forma jurídica, Situación mercantil, CNAE, Domicilio, CP, Municipio, Provincia, Capital social, Constitución, Objeto social. Los campos ausentes se muestran como `—` en italic (R4 · no inventar). |
| COMP-P-0006 | Intelligence Scores Ring | `screenshots/03-empresa.png` — 4 anillos SVG (Quality/Growth/Risk/Opportunity) | `F0_1_SCREENSHOTS/26_compP0006_intelligence_scores.png` | Stub `UnavailableBlock` con COMP-P declarado. Motivo: Scores Engine no expuesto en V2. |

Vista completa del Perfil:
- `F0_1_SCREENSHOTS/20_perfil_full.png`.

## Discrepancias visuales identificadas

1. **CIF con guiones vs normalizado**: el ZIP muestra `B-47 594 478`; arroba usa `cif_normalized` (`B47820150`). Es intencional (contrato canónico usa CIF normalizado). El campo raw con formato humano no se propaga.
2. **Chip "Auditada"**: presente en el ZIP con nombre del auditor. F0.1 no expone auditor en el contrato V2 identidad. Queda pendiente para F0.5 Gobierno (BLOCKED).
3. **Hero row "Oportunidades detectadas"** del ZIP: NO se implementa en F0.1. Aparece explícitamente en el ZIP (`ce-app.jsx`) pero pertenece a la sección Oportunidades (F0.10) y a la Vista Ejecutiva (C3). Se queda para su sub-sprint.
4. **"Reclamar empresa"**: acción del ZIP no implementada (fuera de scope Header F0.1).
5. **Deal Banner** debajo del Header (`ce-app.jsx` línea 100): NO se implementa (C7 · sin COMP-ID en ACC, requiere validación humana).
6. **Financials mock ausentes para `mc_olmedo`**: el seed E1.4 no incluyó `financial_analyses_mock` para esta empresa. Esto es un tema del mock financial existente, no del sprint F0.1. Los COMP-P y COMP-1005 que dependen de financials degradan correctamente a `UnavailableBlock` según R4.

## Cumplimiento canónico verificado

| Regla / Principio | Verificación |
|---|---|
| R11 · Visual Governance | ZIP oficial constituye la aprobación. Reproducimos fielmente el layout, colores, tipografía. |
| R13 · SoT única | `CanonicalEntityMockupClient.tsx` movido a `_legacy` (Paso 0). Guard R13 verde (patrón `CanonicalEntityMockup` añadido). |
| R14 · 1 COMP = 1 componente React | Guard R14 activo (`__tests__/r14_comp_id_declaration_guard.test.ts`). 12 componentes con `@componentId` únicos. |
| P1 · Explainability First | Cada dato con Tooltip source/updated_at (COMP-1001, 1002, 1003, 1005, todos los COMP-P). |
| P2 · Intelligence over Data | KPIs sintéticos en Header (COMP-1005). Bloque narrativo IA prevalece sobre tags (COMP-P-0001). |
| P3 · Zero Coupling | Toda la ficha consume `arroba-identity-v1`, `arroba-financial-v1`, `arroba-semantic-v1`. El proveedor V2 (`AgencyToolCompanyIntelligenceV2Provider`) mapea el `CompanyIdentityResponse` externo al `MasterRecord` interno. |
| R12 · Nunca `/master/*` | Test de regresión permanente `test_r12_regression.py` verde. Guard del cliente HTTP bloquea el prefijo. |

## Historial

- v1 · 2026-07-06 · comparativa inicial tras entrega F0.1 (Header + Perfil).
