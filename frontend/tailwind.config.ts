import type { Config } from 'tailwindcss';

/**
 * arroba.com — Design System v1.0.0 — Tailwind mapping.
 *
 *  Tailwind utility classes consume the CSS variables defined in
 *  `src/styles/tokens.css`. Components MUST NOT hardcode hex/rgba/px.
 *
 *  Naming convention follows the canonical semantic palette declared in
 *  DESIGN_SYSTEM.md §1 (Nivel 1 — Visual tokens). Legacy aliases (bg,
 *  surface, surface-2, text, text-muted, border, border-strong, primary,
 *  primary-hover, arroba-red, arroba-black) are kept so existing code
 *  keeps building untouched while we migrate.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  // Dark mode driven by [data-dark] on <html>. NO `.dark` class.
  darkMode: ['selector', '[data-dark]'],
  // 2026-09-17 · Fix conflicto con reset `.afk *{margin:0;padding:0}` del CSS
  // del mockup inyectado en <body> tras el CSS global. `important: true`
  // añade `!important` a todas las utilidades Tailwind → ganan al reset
  // sin cambiar orden de importación. NO afecta `style={{...}}` inline
  // (que ya tiene precedencia sobre !important en la mayoría de propiedades
  // salvo animations/transitions con inline; ver PASO 2 grep en el fix).
  important: true,
  theme: {
    extend: {
      colors: {
        // ---------- Canonical semantic palette ----------
        // BUGFIX-2026-08-29 · Daniel: bg-success/60 y clases hermanas se
        // pintaban transparentes (ver detalle en tokens.css §2b). Los
        // tokens solidos usan ahora rgb(var(--x-rgb) / <alpha-value>) en
        // vez de 'var(--x)' para que Tailwind pueda generar variantes de
        // opacidad. Los *-subtle NO cambian: ya son semitransparentes por
        // diseno, un modificador de opacidad encima no tiene sentido ahi.
        'brand-primary':       'rgb(var(--brand-primary-rgb) / <alpha-value>)',
        'brand-primary-hover': 'rgb(var(--brand-primary-hover-rgb) / <alpha-value>)',
        'brand-accent':        'rgb(var(--brand-accent-rgb) / <alpha-value>)',

        'surface-primary':  'rgb(var(--surface-primary-rgb) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated-rgb) / <alpha-value>)',
        'surface-muted':    'rgb(var(--surface-muted-rgb) / <alpha-value>)',

        'text-primary':   'rgb(var(--text-primary-rgb) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
        'text-muted':     'rgb(var(--text-muted-rgb) / <alpha-value>)',
        'text-disabled':  'rgb(var(--text-disabled-rgb) / <alpha-value>)',
        'text-on-brand':  'rgb(var(--text-on-brand-rgb) / <alpha-value>)',

        'border-default':  'rgb(var(--border-default-rgb) / <alpha-value>)',
        'border-emphasis': 'rgb(var(--border-emphasis-rgb) / <alpha-value>)',

        success: 'rgb(var(--success-rgb) / <alpha-value>)',
        warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
        danger:  'rgb(var(--danger-rgb) / <alpha-value>)',
        info:    'rgb(var(--info-rgb) / <alpha-value>)',

        'success-subtle': 'var(--success-subtle)',
        'warning-subtle': 'var(--warning-subtle)',
        'danger-subtle':  'var(--danger-subtle)',
        'info-subtle':    'var(--info-subtle)',

        // ---------- Legacy aliases (kept for retrocompat) ----------
        bg:              'rgb(var(--bg-rgb) / <alpha-value>)',
        surface:         'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-2':     'rgb(var(--surface-2-rgb) / <alpha-value>)',
        border:          'rgb(var(--border-rgb) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong-rgb) / <alpha-value>)',
        text:            'rgb(var(--text-rgb) / <alpha-value>)',
        'text-subtle':   'rgb(var(--text-subtle-rgb) / <alpha-value>)',
        primary:         'rgb(var(--primary-rgb) / <alpha-value>)',
        'primary-hover': 'rgb(var(--primary-hover-rgb) / <alpha-value>)',
        'arroba-red':    'rgb(var(--arroba-red-rgb) / <alpha-value>)',
        'arroba-black':  'rgb(var(--arroba-black-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body:    'var(--font-body)',
        mono:    'var(--font-mono)',
      },
      fontSize: {
        // Canonical type scale
        display: 'var(--text-display)',
        h1:      'var(--text-h1)',
        h2:      'var(--text-h2)',
        h3:      'var(--text-h3)',
        h4:      'var(--text-h4)',
        body:    'var(--text-body)',
        'body-sm': 'var(--text-body-sm)',
        caption: 'var(--text-caption)',
        // Legacy aliases
        xs:   'var(--text-xs)',
        sm:   'var(--text-sm)',
        base: 'var(--text-base)',
        md:   'var(--text-md)',
        lg:   'var(--text-lg)',
        xl:   'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
      },
      lineHeight: {
        display: 'var(--leading-display)',
        h1:      'var(--leading-h1)',
        h2:      'var(--leading-h2)',
        h3:      'var(--leading-h3)',
        h4:      'var(--leading-h4)',
        body:    'var(--leading-body)',
      },
      letterSpacing: {
        display: 'var(--tracking-display)',
        h1:      'var(--tracking-h1)',
        h2:      'var(--tracking-h2)',
        h3:      'var(--tracking-h3)',
        caption: 'var(--tracking-caption)',
      },
      spacing: {
        // Canonical spacing scale (in px values exposed as CSS vars).
        // Override Tailwind's default scale so utilities like `p-4`, `gap-6`
        // resolve to our tokens instead of Tailwind's rem-based defaults.
        1:  'var(--space-1)',
        2:  'var(--space-2)',
        3:  'var(--space-3)',
        4:  'var(--space-4)',
        5:  'var(--space-5)',
        6:  'var(--space-6)',
        8:  'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
        // App Shell sidebar widths (tokens.css §11 -- Layout)
        sb: 'var(--sb-w)',
        'sb-collapsed': 'var(--sb-w-collapsed)',
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        none:  'var(--shadow-none)',
        sm:    'var(--shadow-sm)',
        md:    'var(--shadow-md)',
        lg:    'var(--shadow-lg)',
        xl:    'var(--shadow-xl)',
        focus: 'var(--focus-ring)',
      },
      transitionDuration: {
        fast:   'var(--transition-fast)',
        normal: 'var(--transition-normal)',
        slow:   'var(--transition-slow)',
      },
      transitionTimingFunction: {
        standard:    'var(--easing-standard)',
        emphasized:  'var(--easing-emphasized)',
        out:         'var(--easing-out)',
      },
      zIndex: {
        base:     'var(--z-base)',
        dropdown: 'var(--z-dropdown)',
        sticky:   'var(--z-sticky)',
        overlay:  'var(--z-overlay)',
        modal:    'var(--z-modal)',
        toast:    'var(--z-toast)',
        tooltip:  'var(--z-tooltip)',
      },
      keyframes: {
        sectionPulse: {
          '0%':   { boxShadow: '0 0 0 0 rgba(232, 0, 29, 0.0)' },
          '20%':  { boxShadow: '0 0 0 4px rgba(232, 0, 29, 0.18)' },
          '100%': { boxShadow: '0 0 0 0 rgba(232, 0, 29, 0.0)' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // 2026-09-07 · Daniel: destello más explícito en `FichaLoadingScreen`
        // (icono de cabecera + icono del paso activo). A diferencia de
        // `sectionPulse` (un único disparo, `1` iteración) este es un pulso
        // de sombra EN BUCLE (`infinite`) — se ve como un "latido" continuo
        // mientras algo está realmente en curso, no un aviso puntual.
        iconGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 0, 29, 0.55)' },
          '50%':      { boxShadow: '0 0 0 7px rgba(232, 0, 29, 0)' },
        },
      },
      animation: {
        'section-pulse': 'sectionPulse 700ms var(--easing-standard) 1',
        'fade-in-up':    'fadeInUp 250ms var(--easing-out) 1',
        'icon-glow':     'iconGlow 1600ms ease-in-out infinite',
      },
    },
    // Keep Tailwind's default breakpoints (sm:640, md:768, lg:1024, xl:1280,
    // 2xl:1536). The DS documents these as canonical.
  },
  plugins: [],
};
export default config;
