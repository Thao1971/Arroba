# Arroba — Design System

## Contexto del Producto

**Arroba** es una plataforma privada de M&A (fusiones y adquisiciones) para agencias digitales del ecosistema Madtech (Marketing + Advertising + Data + Tech). Permite a compradores y vendedores conectar de forma privada, gestionar deal flows, realizar due diligence y cerrar operaciones.

- **URL:** https://beta.arroba.com
- **Idioma principal:** Español
- **Audiencia:** Fundadores de agencias digitales, fondos de PE/VC, buyers estratégicos en España y Latam
- **Mood:** Premium, confidencial, de confianza — como un club privado para operaciones de alto valor

## Fuentes del Sistema de Diseño

- Meta tags de https://beta.arroba.com (theme-color: #000000)
- ⚠️ **Logo pendiente** — el usuario lo entregará próximamente
- ⚠️ **Codebase pendiente** — proyecto en Cowork, acceso pendiente

---

## CONTENT FUNDAMENTALS

- **Idioma:** Español (España/Latam neutro)
- **Tono:** Profesional, directo, sin florituras. No usa emoji. No usa lenguaje de startup hype.
- **Casing:** Sentence case en UI, Title Case solo en nombres propios y CTAs principales
- **Voz:** 2ª persona ("Tu portfolio", "Gestiona tus operaciones") — cercano pero profesional
- **Números:** Valores en €M o $M para valoraciones; porcentajes para márgenes y crecimientos
- **Ejemplos de copy:** "Acceso privado al mercado", "Ver deal", "Solicitar NDA", "Enviar oferta no vinculante", "Fase de due diligence"

---

## VISUAL FOUNDATIONS

### Colores
- Fondo base: negro cálido (#080808) con ligero undertone warm
- Superficies: escala de grises oscuros con calidad cálida
- Acento primario: amber/oro cálido (oklch 0.76 0.12 52) — connota valor y deal-making
- Acento secundario: azul frío (oklch 0.66 0.11 232) — datos, analytics, trust
- Semánticos: verde éxito, rojo error, amarillo warning

### Tipografía
- Display/Headings: **Space Grotesk** — geométrico, moderno, distintivo
- Body: **DM Sans** — limpio, legible, profesional
- Mono: **JetBrains Mono** — para datos financieros, valores, métricas

### Backgrounds
- Fondos sólidos oscuros; sin gradientes agresivos
- Sutiles ruidos/texturas en superficies elevadas (opcional, vía CSS noise)
- Sin imágenes full-bleed en la app; sí en landing

### Cards y contenedores
- Border: 1px solid con color de borde tenue
- Fondo: surface ligeramente más claro que el bg
- Border radius: 8px (default), 12px (cards grandes), 4px (chips/badges)
- Sombra: drop-shadow sutil, no de color

### Animaciones
- Duración: 120–180ms para micro-interacciones, 240ms para modales
- Easing: ease-out para entradas, ease-in para salidas
- Sin bounces; sin animaciones decorativas. Funcionales únicamente.

### Hover states
- Botones: ligeramente más claros (opacity 0.9 en oscuro)
- Cards: borde más visible + ligera elevación de background
- Links: color acento

### Iconografía
- ⚠️ **Sistema pendiente de confirmación** — se asume Lucide Icons (stroke, 1.5px, size 16–20px)
- Sin emoji en la interfaz
- Sin SVGs decorativos propios

### Imágenes
- En la app: avatares de empresa (logo de la agencia), sin fotografías de personas
- Tono cálido, desaturado cuando hay imágenes
- Placeholders con patrón rayado

---

## VISUAL FOUNDATIONS — Espaciado y Grid

- Grid: 12 columnas, gutter 24px, margin 32px (desktop); 4 cols, 16px (mobile)
- Escala de espaciado: 4px base (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px)
- Tamaño mínimo de target táctil: 44px

---

## Archivos disponibles

| Archivo | Descripción |
|---|---|
| `colors_and_type.css` | CSS vars de colores, tipografía, espaciado, radios, sombras |
| `preview/` | Tarjetas del Design System tab |
| `ui_kits/app/index.html` | UI Kit principal — app Arroba |
| `assets/` | Assets de marca (logo pendiente) |
| `SKILL.md` | Instrucciones para agentes AI |
