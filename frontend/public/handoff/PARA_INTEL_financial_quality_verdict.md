# PARA INTEL · Solicitud REQ · Ampliar proyección `financial_quality` con campo `verdict`

> ## ✅ RESUELTO · 2026-08-11
>
> Intel entregó el `verdict` **pero NO en `financial_quality`** como se pedía en este documento. Lo colocó en un **bloque paralelo `finances.assessment`** con shape ampliado:
>
> ```json
> "finances.assessment": {
>   "score": 100,
>   "label": "Sólida",
>   "assessment": "Calidad financiera sólida (100/100)...",
>   "verdict": "Perfil financiero sólido y consistente; candidato atractivo para operaciones corporativas.",
>   "strengths": [...],
>   "weaknesses": [],
>   "risks": []
> }
> ```
>
> Arroba consume la nueva ruta (`ficha.finances.assessment.verdict`) en el Hero card "Veredicto de ARROBA" · passthrough puro · gated. El bloque original `financial_quality` mantiene su shape (`score/assessment/strengths/weaknesses/risks`) y sigue alimentando la card "Lectura financiera de ARROBA" de la pestaña Finanzas — sin modificar. Ambos coexisten sin duplicidad funcional. **REQ cerrado.**
>
> Documento histórico preservado tal cual a continuación para trazabilidad.

---

> **Emisor**: Arroba.com (equipo de producto).
> **Destinatario**: Equipo Intelligence Engine.
> **Fecha**: 2026-08-11.
> **Prioridad**: **P2 · no bloqueante para deploy actual** (Arroba desplegará el card en estado `<Empty/>` shell hasta armonización).
> **Sprint objetivo sugerido**: próximo hueco de mantenimiento del agregador `/company/{cif}/ficha` — trabajo mínimo (adición de un campo a la proyección).

---

## 1. Contexto de producto

Arroba consume `GET /api/v1/company/{cif}/ficha` como fuente única para pintar la ficha canónica de empresa. En el bloque `finances.financial_quality` se proyectan hoy 5 campos: `score`, `assessment`, `strengths[]`, `weaknesses[]`, `risks[]`.

Verificación E2E realizada por el equipo Arroba confirma que **Intel posee un campo adicional `verdict`** (prosa Corporate Finance veredictal cualitativa) en su modelo interno, pero **no está incluido en la proyección del agregador**.

## 2. Evidencia · payload actual observado

Endpoint invocado: `GET /api/v1/company/{cif}/ficha` (agregador consumido por Arroba a través de su proxy backend).

Ruta observada: `data.finances.financial_quality`.

Payload real recibido para `B28184687` LABORATORIOS SERVIER (autenticado, 2026-08-11):

```json
{
  "score": 100.0,
  "assessment": "Calidad financiera sólida (100/100). Margen EBITDA moderado del 11.3%. Ingresos al alza (11.7%) interanual. Autonomía financiera (PN/Activo) del 73.5%.",
  "strengths": [
    "Crecimiento de ingresos >10% interanual"
  ],
  "weaknesses": [],
  "risks": []
}
```

Campo `verdict` **ausente en 7 CIFs de la muestra Turno D** (Servier, NCR, OPEL, PROCOLUIDE, FARNELL, IUSTIME, INNOVATIVE): confirmado por curl paralelo sobre cada CIF.

## 3. Petición concreta

**Añadir `verdict: string | null`** en la proyección `financial_quality` del agregador `/company/{cif}/ficha`. Ejemplo de contenido esperado (según especificación del equipo Arroba):

```json
{
  "score": 100.0,
  "assessment": "Calidad financiera sólida (100/100). Margen EBITDA moderado del 11.3%. Ingresos al alza (11.7%) interanual. Autonomía financiera (PN/Activo) del 73.5%.",
  "verdict": "Perfil financiero sólido y consistente; candidato atractivo para operaciones corporativas.",
  "strengths": ["Crecimiento de ingresos >10% interanual"],
  "weaknesses": [],
  "risks": []
}
```

### Distinción clave `assessment` vs `verdict`

- **`assessment`** (existente): prosa **cuantitativa** con métricas concretas (margen EBITDA, crecimiento de ingresos, autonomía financiera, score).
- **`verdict`** (solicitado): prosa **veredictal cualitativa** — juicio sintético sobre el atractivo M&A / perfil financiero global del target, ~1-2 líneas. No repite las métricas; contextualiza.

Ambos campos coexisten sin duplicidad: `assessment` sustenta la "Lectura financiera" (pestaña Finanzas) y `verdict` sustenta el **card "Veredicto de ARROBA" del Hero** (bloque de portada del Resumen).

## 4. Consumidor final en Arroba

- **Card "Veredicto de ARROBA"** del Hero de la ficha canónica, componente `HeroBlock` en `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` línea 312-317.
- Estado actual: `<Empty/>` con copy "Información en preparación · Estamos consolidando este apartado." · comentario TODO in situ referenciando este documento.
- Estado tras armonización: `verdict` viajaría vía passthrough puro (una línea de cableado: `verdict = ficha?.finances?.financial_quality?.verdict ?? null`), pintado como prose CF sobrio, sin comillas envolventes ni decoración (R15).

## 5. Prioridad y no-bloqueo

- **P2 · no bloqueante para deploy actual**.
- **Justificación de la prioridad (superior a P3 `shareholder.type`)**:
  1. **El dato ya existe** en el modelo interno Intel (verificado por Arroba). No requiere trabajo de modelado nuevo.
  2. Es únicamente cambio de **proyección del agregador** (~1 campo).
  3. Cierra la narrativa Corporate Finance de la ficha: "Veredicto" es el copy visible más prominente del Hero, ahora vacío.
- Arroba desplegará el bundle B-2 completo con el card `<Empty/>` como shell.
- Cuando Intel incluya `verdict` en la proyección, Arroba consume automáticamente vía passthrough (turno de trabajo estimado: ~15 min · retirar TODO comment + cablear + un testid + smoke UI).

## 6. Compatibilidad

- Cambio **aditivo**, no destructivo. Consumidores existentes no se ven afectados.
- Arroba consume `financial_quality` como `dict | None` passthrough (Zero Coupling P3). La adición del campo no requiere cambios en el contrato Pydantic interno de Arroba.
- Retrocompatible con ausencia: si Intel entrega `verdict: null` para CIFs donde no lo tenga poblado, el card permanece en `<Empty/>` (rama R15 respetada).

## 7. Preguntas abiertas para Intel

- ¿Está el `verdict` disponible **para todos los CIFs** con `has_financials:true`, o sólo para un subconjunto? Si es subconjunto, ¿cuál es el criterio (score threshold, cobertura de ratios, etc.)?
- ¿Longitud típica esperada? Arroba dimensionará la card para 1-2 líneas (~140-220 caracteres). Si supera, se maneja con truncado UI.
- ¿Hay versiones i18n del `verdict` (EN/ES) o solo español CF?

---

**Contacto Arroba**: main agent E1 / TODO comment en `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx::HeroBlock` líneas 312-317.
