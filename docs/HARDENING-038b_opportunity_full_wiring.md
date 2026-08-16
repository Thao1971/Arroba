# HARDENING-038b · Opportunity full wiring (server-side fetch)

## Contexto

`HARDENING-038` aterrizó los proxies JWT hacia los motores Intel:
`succession-profile`, `rollup-thesis`, `investment-decision/analyze`,
`market-reading`, `committee-export`. En la primera iteración el layout
usa un adapter MVP (`opportunityToThesisView`) que **sólo consume**
`props.opportunity` del payload principal → los campos `sell.*` (sucesión)
y `buy.*` (roll-up) quedan como `undefined` explícito.

Ese diseño respeta R15 (empty honesto) pero deja el bloque
`OpportunityThesisBlock` renderizando sólo la parte narrativa. Para el
value drop completo del feature hay que enriquecer el shape con los
payloads de `succession_profile` y `rollup_thesis`.

## Diseño ratificado (opción 3c)

**Server-side fetch en el data-loader parent**, no client-side.

Razón: el data-loader del `page.tsx` de la ficha ya orquesta los fetches
al agregador Intel (`/ficha`, taxonomy, etc.). Añadir `succession` +
`rollup` allí mantiene:
- Un único punto de latencia (paralelo con los otros fetches).
- Cache TTL homogéneo (los proxies ya cachean 1h en memoria).
- Sin waterfall en el cliente (el bloque recibe data completa de una).
- Auth JWT server-side (la sesión ya está resuelta en el loader).

## Prerrequisito bloqueante

**Intel debe confirmar** que `signal-intelligence/succession-profile/{cif}`
y `investment-intelligence/rollup-thesis?cnae_code=...` están **desplegados
y estables** en Intel dev y Intel Prod. Sin esto, el fetch degrada a
`upstream_unavailable` 502 y el bloque queda peor que hoy (con spinner
eterno o error visible en vez del narrative-only actual).

Confirmar por Slack/mail con el equipo Intel antes de abrir el ticket.

## Ficheros a tocar (spec)

### Backend (ya listo, no toca)

- `src/modules/copilot/intel_ficha_proxies.py` · funciones ya expuestas.
- `src/modules/companies/router.py` · 5 rutas ya registradas.

### Frontend (nuevo)

1. **`src/app/[locale]/(ficha)/empresa-f01/[cif]/page.tsx`** (o donde
   viva el data-loader server component):
   - Añadir a los fetches paralelos:
     ```ts
     const [succession, rollup] = await Promise.all([
       fetchJson(`${BACKEND}/api/companies/${cif}/succession`, { headers: authHeaders }).catch(() => null),
       fetchJson(`${BACKEND}/api/companies/${cif}/rollup`, { headers: authHeaders }).catch(() => null),
     ]);
     ```
   - Pasar como props al layout: `<CompanyFichaLayoutV2 ... succession={succession} rollup={rollup} />`.

2. **`src/components/company/layout/adapters.ts`**:
   - Extender `opportunityToThesisView(opportunity, succession?, rollup?)`.
   - Mapear:
     - `sell.successionScore` ← `succession.score`.
     - `sell.note` ← `succession.summary` o `succession.narrative`.
     - `sell.attractiveness` ← `succession.attractiveness` (`'Alta'|'Media'|'Baja'`).
     - `buy.viable` ← `rollup.viable` o derivar de `rollup.targets.length > 0`.
     - `buy.note` ← `rollup.narrative` o `rollup.thesis`.
     - `buy.targets` ← `rollup.targets.map(t => ({ name: t.name, fit: t.fit_score }))`.
   - Mantener `undefined` para campos sin fuente incluso con Intel activo.

3. **`src/components/company/layout/CompanyFichaLayoutV2.tsx`**:
   - Aceptar props `succession?` y `rollup?` (opcionales, retrocompatibles).
   - Pasarlas al adapter: `opportunityToThesisView(opportunity, succession, rollup)`.

### Tests

- Unit test del adapter con los 3 shapes (sólo opportunity · +succession · +rollup completo).
- Vitest: verificar que `<OpportunityThesisBlock>` renderiza los 3 sub-bloques cuando `sell` y `buy` están poblados.

### Verificación E2E

- Smoke: pestaña Oportunidades muestra `sell` con score numérico + `buy.viable` con targets.
- Regresión: sin `succession`/`rollup` (cuando el fetch falla o devuelve `null`), el bloque sigue mostrando solo `thesis + detected` (comportamiento MVP actual).

## Estimación

- 2-4 horas netas (adapter extendido + edit data-loader + tests).
- Bundle +1 unidad.

## Activación

Abrir el ticket cuando el equipo Intel confirme motores desplegados. Antes,
el fichero de esta doc queda como memoria del plan.
