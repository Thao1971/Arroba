# Parche Fase 0 (Beta): 3 campos dormidos restantes visibles en la Ficha

**Qué añade:** los 3 campos de Fase 0 que ya llegan por API desde el parche de Intel (`Intel-140826/memory/PENDING_FIXES/FASE0_CAMPOS_DORMIDOS_PATCH.md`) pero no tenían hueco visible en Beta — **Cuentas auditadas**, **Modelo de balance** y **Último ejercicio depositado**. Los otros 2 campos de la misma Fase 0 (Domicilio, Situación mercantil) ya se veían solos desde que se aplicó el parche de Intel, sin tocar Beta.

**Dependencia:** requiere que el parche de Intel de Fase 0 esté aplicado (o que `/identity` / `/ficha` ya devuelvan `audited`/`balance_model`/`last_balance_year`); si no, estos 3 campos se ven como `—` (degradado limpio, igual que cualquier campo sin dato) hasta que Intel esté desplegado.

3 archivos:

## 1. `src/lib/companies/intelligence-types.ts`

**Buscar** (final de la interfaz `IdentitySection`):
```typescript
  /** Origen del texto `description`: `official` (Iberinform/objeto social) · `ai` (Nvidia reformula) · `web` (scraping). */
  description_source?: 'official' | 'ai' | 'web' | null;
}
```

**Sustituir por:**
```typescript
  /** Origen del texto `description`: `official` (Iberinform/objeto social) · `ai` (Nvidia reformula) · `web` (scraping). */
  description_source?: 'official' | 'ai' | 'web' | null;
  /** Fase 0 (2026-09-01) · cuentas auditadas, tal cual reporta Iberinform (Intel `identity.audited`). */
  audited?: string | null;
  /** Fase 0 (2026-09-01) · modelo de balance depositado (Intel `identity.balance_model`). */
  balance_model?: string | null;
  /** Fase 0 (2026-09-01) · último ejercicio depositado en el registro (Intel `identity.last_balance_year`). */
  last_balance_year?: string | null;
}
```

## 2. `src/components/company/CompanyFichaF01Client.tsx`

**Buscar** (final de `adaptIdentityFromFicha()`, dentro del objeto `identity` que construye):
```typescript
    description_source: (get('description_source') as 'official' | 'ai' | 'web' | null) ?? null,
  };
  return identity;
```

**Sustituir por:**
```typescript
    description_source: (get('description_source') as 'official' | 'ai' | 'web' | null) ?? null,
    // Fase 0 (2026-09-01) · campos dormidos restantes, passthrough puro (R15).
    audited: (get('audited') as string | null) ?? null,
    balance_model: (get('balance_model') as string | null) ?? null,
    last_balance_year: (get('last_balance_year') as string | null) ?? null,
  };
  return identity;
```

## 3. `src/components/company/perfil/IdentityFieldsGrid.tsx`

**Buscar** (últimos 2 campos del array `fields`, justo antes del cierre):
```typescript
    {
      key: 'corporate-purpose',
      label: 'Objeto social',
      value: nonEmpty(identity.objeto_social),
      tooltip: 'Objeto social declarado en estatutos.',
    },
  ];
```

**Sustituir por:**
```typescript
    {
      key: 'corporate-purpose',
      label: 'Objeto social',
      value: nonEmpty(identity.objeto_social),
      tooltip: 'Objeto social declarado en estatutos.',
    },
    {
      key: 'audited',
      label: 'Cuentas auditadas',
      value: nonEmpty(identity.audited ?? null),
      tooltip: 'Indica si las cuentas depositadas están auditadas, según Iberinform.',
    },
    {
      key: 'balance-model',
      label: 'Modelo de balance',
      value: nonEmpty(identity.balance_model ?? null),
      tooltip: 'Modelo de balance depositado en el Registro Mercantil (normal, PYME, abreviado).',
    },
    {
      key: 'last-balance-year',
      label: 'Último ejercicio depositado',
      value: nonEmpty(identity.last_balance_year ?? null),
      tooltip: 'Último ejercicio con cuentas depositadas en el registro.',
    },
  ];
```

No hace falta tocar el `<dl>` ni el `.map()` de renderizado — al ser un array, las 3 filas nuevas se pintan solas con el mismo estilo (grid de 2/3/4 columnas según ancho) que el resto de campos.

## Notas para Neo

- No toca ningún otro archivo — ni `CompanyFichaLayoutV2.tsx`, ni `CompanyPublicStatus.tsx`, ni el resto de la Ficha.
- Verificar en preview: abrir la Ficha de una empresa con `audited`/`balance_model`/`last_balance_year` disponibles en Intel (tras aplicar su parche de Fase 0) y confirmar que las 3 filas nuevas aparecen en la tarjeta "Identificación" con el dato correcto; y de una empresa sin esos datos, para confirmar que se ven como `—` en cursiva, igual que cualquier otro campo sin dato (no debe romper el grid ni dejar hueco raro).
