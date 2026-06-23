# arroba.com — Frontend (Next.js 14)

Next.js 14 (App Router) + TypeScript estricto + Tailwind + next-intl + lucide-react.

## Arrancar (dev)

```bash
cd /app/frontend
yarn install
yarn dev   # http://localhost:3000
```

## Scripts

```bash
yarn dev       # next dev en :3000
yarn build     # build de producción
yarn start     # next start en :3000
yarn lint      # next lint (eslint)
yarn typecheck # tsc --noEmit
yarn format    # prettier --write .
yarn test      # vitest run
yarn test:watch
```

## Estructura

```
src/
  app/
    [locale]/                  next-intl con localePrefix: 'never' (URLs sin /es)
      (public)/                segmento público
        page.tsx               landing mínima
      (authenticated)/         segmento auth (placeholder en E0.2)
        design-system/page.tsx showcase tokens + primitives + WCAG
  components/
    ds/                        primitives canónicos
    blocks/                    Block Library — vacío, se llena en E1
  lib/
    format.ts                  helpers es-ES + tests
    search-neutral.ts          NFD ascii-fold + tests
    tokens.ts                  tokens en TS (solo programatico)
    theme.ts                   useTheme + script preset
    contrast.ts                WCAG ratio calc
    cn.ts                      clsx + tailwind-merge
  styles/
    tokens.css                 ☛ SINGLE SOURCE OF TRUTH de tokens
  messages/
    es.json                    ES nativo
    en.json                    EN placeholders [EN] ...
  i18n/
    config.ts                  locales + defaultLocale
    request.ts                 next-intl request loader
middleware.ts                  next-intl middleware (localePrefix: 'never')
```

## Tokens

Toda combinación de color, fuente, radio y spacing se resuelve por `var(--*)` desde `src/styles/tokens.css`. Tailwind expone aliases sobre esas variables (`tailwind.config.ts`). **Ningún componente debe contener un hex ni una familia tipográfica literal**.

Dark mode: atributo `[data-dark]` en `<html>`. Persistencia en `localStorage` (`arroba-theme`). Sin FOUC gracias al script inline en `<head>`.

## Especificación visual (referencia perpetua)

Los prototipos HTML+JSX en `/app/_design_intake/` son la **fuente de verdad visual y conductual** de cada workspace. **NO** se importan en producción. Cada vez que se construya un bloque o pantalla en E1+, se consulta el HTML/JSX equivalente.

## i18n

- Locales `['es', 'en']`, default `es`.
- `localePrefix: 'never'` → URLs sin prefijo de locale.
- Idioma persistido en cookie `NEXT_LOCALE`. `LocaleSwitcher` la actualiza y refresca.
- `en.json` contiene los mismos keys que `es.json` con prefijo `[EN]` (TODO: translate en E2+).

## A11y

- Tap targets mínimo 44×44 (`--tap-target-min`).
- `focus-visible` con anillo rojo de marca (`--focus-ring`).
- ConfidenceBadge combina icono ✩ + texto + color + porcentaje (color nunca es portador único).
- Modo monocromo en `/design-system` para QA visual.
