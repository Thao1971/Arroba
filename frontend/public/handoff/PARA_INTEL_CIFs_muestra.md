# PARA INTEL / PM · Petición de CIFs de muestra para B-2

**Fecha**: 2026-08-10
**Origen**: sesión BETA B-2 Fase 0 · Auditoría de endpoints Intel
**Contacto Arroba**: sesión de integración `intelligence_layer` v2

---

## Contexto

Durante la Fase 0 de auditoría B-2 sobre `intel.arroba.com` con `X-API-Key` S2S primary, solo **1 CIF de 5 probados resolvió con datos**. Los otros 4 devuelven consistentemente **HTTP 404** en `POST /api/v1/financial-intelligence/analyze` y `GET /api/v1/company/{cif}/ficha`.

Esto imposibilita validar **estabilidad de schema entre CIFs** — condición previa para cablear con seguridad los nuevos bloques B-2.1..B-2.7 (Rankings, Ownership, Governance, Events, Cash Flow ampliado, Identidad ampliada, Comparativa peer).

---

## CIFs probados y resultado

| CIF | Descripción | HTTP `analyze` | HTTP `/ficha` | Notas |
|---|---|---|---|---|
| **B28184687** | LABORATORIOS SERVIER · pharma · MADRID · CNAE 2120 | **200** | **200** (22.4 KB) | Único CIF válido en la muestra. |
| A08363419 | GRUPO PLANETA-DE AGOSTINI · media · BARCELONA | 404 | 404 | No resuelve. |
| A28017895 | IBERDROLA · utilities · IBEX · VIZCAYA | 404 | 404 | No resuelve. |
| B65076193 | TECHNIP IBERIA · energy engineering · BARCELONA | 404 | 404 | No resuelve. |
| B95758389 | SME microempresa aleatoria | 404 | 404 | No resuelve. |

`recommendation-intelligence/buyers` para Servier devuelve `count: 0` → **no hay buyer_id** para probar `control-synergy/{buyer_id}`, endpoint que también queda sin validar.

---

## Petición concreta

**Necesitamos 5 CIFs reales del `master_companies` de Intel**, confirmados como enriquecidos, cubriendo el siguiente mix:

1. **1 gran cotizada** (IBEX o Continuo español) — para validar `is_listed=true`, `listed_market`, ownership dispersa.
2. **1 mid-cap no cotizada** — mid-market industrial o servicios con estructura de propiedad familiar/PE.
3. **1 SME industrial** (facturación 10-50 M€) — sector manufacturero, con officers y BORME activos.
4. **1 SME servicios** (facturación 5-30 M€) — sector servicios profesionales o TIC.
5. **1 microempresa** (facturación <5 M€) — para validar el límite bajo de cobertura y el silencio elegante (`available: false`) en secciones no cubiertas.

Para cada CIF, confirmar que:

- `POST /api/v1/financial-intelligence/analyze` con `{"identifier": "<cif>"}` → **HTTP 200** con `has_financials: true`.
- `GET /api/v1/company/{cif}/ficha` → **HTTP 200** con `identity + finances + ranking + ownership + governance + events`.
- `POST /api/v1/recommendation-intelligence/buyers` → al menos **1 CIF con `count > 0`** para poder probar `GET /api/v1/company/{cif}/control-synergy/{buyer_id}`.

---

## Diagnóstico solicitado

- ¿Los 4 CIFs que fallan (`A08363419`, `A28017895`, `B65076193`, `B95758389`) **no están en el master** de Intel, o hay un bug de resolución en el lookup? Ejemplo: Iberdrola (A28017895) es una compañía cotizada española conocida — si no está en master es un gap importante de cobertura; si es bug de lookup es crítico.
- ¿Existe alguna variante de CIF (con o sin dígito de control, con o sin ceros a la izquierda) que Intel espere y Arroba no está enviando? Los 4 CIFs se enviaron literales como aparecen en el registro mercantil.
- ¿Hay un endpoint público para consultar la cobertura del master (ej. `GET /api/v1/master/coverage` o similar) que Arroba pueda usar para pre-filtrar CIFs válidos antes de llamar a `analyze`?

---

## Impacto

Sin CIFs adicionales enriquecidos:

- **B-2.1 Rankings** (esta sub-fase, ya en curso): cableable con Servier únicamente. Otros CIFs mostrarán la 2.ª fila kgrid vacía. UX degradado.
- **B-2.4 Refactor a agregador `ficha`**: cableable pero validado en 1 solo CIF.
- **B-2.2/B-2.3 Ownership+Governance**: cableable con Servier. Sin verificar la degradación DPD (persona física vs jurídica) en otros CIFs.
- **B-2.5 Cash Flow** (en `analyze.statements.cash_flow`): cableable con Servier.
- **B-2.7 Control-synergy**: bloqueado hasta CIF con `buyers.count > 0`.

Arroba continuará avanzando con Servier en sub-fases B-2.1..B-2.5. Si Intel/PM proporciona la muestra ampliada, Arroba podrá cerrar la validación de schema y desbloquear B-2.7.

---

## Tono y siguiente paso

Petición formal a Intel/PM, sin urgencia crítica pero **bloqueante para la validación exhaustiva** de B-2 antes de deploy a `beta.arroba.com`. Cualquier lista mínima (aunque solo 2-3 CIFs adicionales) desatasca la Fase 0 ampliada.

**Responder a**: agente Arroba BETA · sesión 2026-08-10 · fichero `/app/memory/PARA_INTEL_CIFs_muestra.md`.

---

*Documento generado 2026-08-10 al arrancar B-2.1 · Autor: agente Arroba. Hermanos: `/app/memory/PARA_BETA_B2_FASE0_AUDIT.md`, `/app/memory/PLAN_BETA_ficha_HANDOFF.md`.*
