# HARDENING-037 — Puntos de extensión de la ficha (refactor ligero del monolito)

Objetivo: que montar una sección nueva = **añadir una entrada a un registro**, sin volver a editar `CompanyFichaLayoutV2.tsx`. Migración **incremental**: las secciones existentes se quedan como están; el registro solo gestiona las nuevas.

⚠️ El monolito vivo (bundle 25) va por delante de mi copia → **Beta aplica el edit contra SU fichero**. El registro es fichero NUEVO (seguro).

## Fichero nuevo (incluido, tsc=0)
`frontend/src/components/company/layout/sectionRegistry.tsx` — define `FichaSectionContext`, `SectionEntry`, `EXTENSION_SECTIONS` (mercado, oportunidades, comité con su `render`) y `getSection(id)`. Importa los 4 blocks ya aterrizados (bundle 25).

## Edit quirúrgico en `CompanyFichaLayoutV2.tsx` (lo aplica Beta)
1. **Import**: `import { getSection, type FichaSectionContext } from './sectionRegistry';`
2. **Nav** (`NAV[]`): 
   - `comite` y `mercado` → `ready: true`.
   - **Eliminar** las entradas `sucesion` y `sector` (Oportunidades las absorbe).
   - `oportunidades` se mantiene.
3. **Construir el contexto** una vez, con los datos/callbacks que ya tiene el componente:
   ```tsx
   const ctx: FichaSectionContext = {
     cif, anon,
     market: props.market ?? null,              // del bloque market que ya agrega sector+geo+concentración+posición
     opportunity: props.opportunityThesis ?? null,
     runCommittee: (c, lens) => apiClient.company.committee(c, lens),  // HARDENING-038
     onExportCommittee: (id) => apiClient.company.committeeExport(id),
     committeeDefaultLens: 'neutral',
   };
   ```
4. **Render**: ANTES del switch inline actual, añadir el punto de extensión:
   ```tsx
   const entry = getSection(active);
   if (entry?.render) {
     return <section className="panel on">{anon ? <Gate what={entry.label} /> : entry.render(ctx)}</section>;
   }
   ```
5. **Quitar** del render inline: la rama `active === 'oportunidades' && <Oportunidades .../>` (ahora la sirve el registro) y las entradas `mercado`/`comite`/`sucesion`/`sector` de la lista `[...].includes(active) && <Pending/>`.

Resultado: el resto del monolito intacto; a partir de ahora una sección nueva = 1 entrada en `EXTENSION_SECTIONS`.

## Dependencia
- Los `render` de comité/mercado/oportunidades muestran datos reales cuando **HARDENING-038** (proxies Intel) esté cableado. Sin él, degradan con elegancia (comité=botón sin datos; mercado/oportunidades=tarjetas vacías) — nunca rompen.
- Verificar tras aplicar: `tsc`, `build`, vitest, y smoke de las pestañas mercado/oportunidades/comité en la ficha.
