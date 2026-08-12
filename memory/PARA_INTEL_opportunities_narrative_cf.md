# REQ-INTEL · `opportunities[*].reason_narrative_cf` (prosa CF ES)

**Emitido**: 2026-08-13 · turno HARDENING-020-fix
**Prioridad**: P2 (no bloquea el push · frontend construye la prosa localmente con fallback)
**Owner Intel**: pendiente asignación · pipeline `recommendation-intelligence`
**Consumidor Arroba**: `/api/companies/{cif}/opportunities` → componente `Oportunidades` en `CompanyFichaLayoutV2.tsx`

---

## Contexto

El endpoint upstream `recommendation-intelligence/opportunities` emite hoy el campo `reason` como **texto crudo con tokens técnicos y floats**:

```json
{
  "name": "INDUSTRIAS MORERA",
  "recommendation_type": "opportunity",
  "reason": "INDUSTRIAS MORERA es opportunity (rol: acquisition_target) para LABORATORIOS SERVIER: semejanza semántica 0.083638, ajuste financiero 0.3, sector igual, no consolidador.",
  "fit_dimensions": {
    "strategic_fit": { "value": 0.6, "evidence": ["same_sector=True", ...] },
    "financial_fit": { "value": 0.2963, "evidence": [...] },
    "semantic_fit":  { "value": 0.0836, "evidence": [...] }
  }
}
```

Residuos que la UI NO puede mostrar (violan el Canon Narrativa CF §2 · Anexo B):
- `opportunity`, `acquisition_target` (tokens técnicos EN)
- `0.083638`, `0.3` (floats crudos sin banda cualitativa)
- "semejanza semántica" / "ajuste financiero" (jerga de motor, no CF)

## Solución propuesta desde Intel

Emitir un **nuevo campo** en cada `opportunities[i]`:

```json
"reason_narrative_cf": "Objetivo de adquisición del mismo sector con perfil independiente; encaje financiero ajustado y afinidad estratégica ligera."
```

Reglas de composición sugeridas (a criterio de Intel):
- ES castellano CF · prosa cerrada · 1-2 frases.
- Sin tokens técnicos EN (`opportunity`, `acquisition_target`, `same_sector`).
- Sin floats crudos (`0.083638`) — usar bandas cualitativas ("alta", "moderada", "ligera").
- Sin nombre propio del sujeto (`LABORATORIOS SERVIER`) — se sobreentiende por contexto de la ficha.
- Sin ID de rol (`rol: X`) — traducir a prosa.

Ejemplo salida esperada (Servier · INDUSTRIAS MORERA):
- **Actual**: `"INDUSTRIAS MORERA es opportunity (rol: acquisition_target) para LABORATORIOS SERVIER: semejanza semántica 0.083638, ajuste financiero 0.3, sector igual, no consolidador."`
- **Esperado**: `"Objetivo de adquisición del mismo sector con perfil independiente; encaje financiero ajustado y afinidad estratégica ligera."`

## Fallback actual en Arroba

Mientras Intel emite el campo, el frontend construye prosa localmente desde `fit_dimensions` con vocabulario controlado — pero es defensivo (viola parcialmente Zero Coupling porque el frontend interpreta thresholds). Cuando `reason_narrative_cf` esté disponible, se retira el helper local `formatOpportunityReason()` de `CompanyFichaLayoutV2.tsx`.

## Contrato

**Nombre exacto**: `reason_narrative_cf`
**Tipo**: `string | null` (null si Intel no puede componer prosa fiable)
**Ubicación**: `opportunities[i].reason_narrative_cf` (hermano de `reason`, `fit_dimensions`)
**Comportamiento en anon**: DPD passthrough — no revela nombre de la empresa candidata (el nombre ya está en `name`, que es gated en DPD por otra vía). El propio texto no debe contener información privada.

## Aplicable también a

- `/api/companies/{cif}/buyers` → mismo shape `BuyerItem` → añadir `reason_narrative_cf` (mismo criterio).
