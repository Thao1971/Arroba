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
  theme: {
    extend: {
      colors: {
        // ---------- Canonical semantic palette ----------
        'brand-primary':       'var(--brand-primary)',
        'brand-primary-hover': 'var(--brand-primary-hover)',
        'brand-accent':        'var(--brand-accent)',

        'surface-primary':  'var(--surface-primary)',
        'surface-elevated': 'var(--surface-elevated)',
        'surface-muted':    'var(--surface-muted)',

        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        'text-disabled':  'var(--text-disabled)',
        'text-on-brand':  'var(--text-on-brand)',

        'border-default':  'var(--border-default)',
        'border-emphasis': 'var(--border-emphasis)',

        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
        info:    'var(--info)',

        'success-subtle': 'var(--success-subtle)',
        'warning-subtle': 'var(--warning-subtle)',
        'danger-subtle':  'var(--danger-subtle)',
        'info-subtle':    'var(--info-subtle)',

        // ---------- Legacy aliases (kept for retrocompat) ----------
        bg:              'var(--bg)',
        surface:         'var(--surface)',
        'surface-2':     'var(--surface-2)',
        border:          'var(--border)',
        'border-strong': 'var(--border-strong)',
        text:            'var(--text)',
        'text-subtle':   'var(--text-subtle)',
        primary:         'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'arroba-red':    'var(--arroba-red)',
        'arroba-black':  'var(--arroba-black)',
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
      },
      animation: {
        'section-pulse': 'sectionPulse 700ms var(--easing-standard) 1',
        'fade-in-up':    'fadeInUp 250ms var(--easing-out) 1',
      },
    },
    // Keep Tailwind's default breakpoints (sm:640, md:768, lg:1024, xl:1280,
    // 2xl:1536). The DS documents these as canonical.
  },
  plugins: [],
};
export default config;
