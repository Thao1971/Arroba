// Arroba Design System — Token Definitions
window.ARROBA = {
  colors: {
    brand: {
      red:      '#E8001D',
      redLight: '#FF1A35',
      redDark:  '#B5001A',
      black:    '#0C0C0E',
      white:    '#FFFFFF',
    },
    neutral: [
      { step: '50',  hex: '#FAFAF8', label: 'white-warm' },
      { step: '100', hex: '#F4F4F0' },
      { step: '200', hex: '#E8E8E2' },
      { step: '300', hex: '#D4D4CC' },
      { step: '400', hex: '#ADADAA' },
      { step: '500', hex: '#858580', label: 'mid' },
      { step: '600', hex: '#636360' },
      { step: '700', hex: '#4A4A47' },
      { step: '800', hex: '#2E2E2C' },
      { step: '900', hex: '#1A1A18' },
      { step: '950', hex: '#0C0C0E', label: 'black-warm' },
    ],
    semantic: [
      { key: 'success', base: '#1A8A4A', light: '#E8F5EE', label: 'Success' },
      { key: 'warning', base: '#D97708', light: '#FEF3E2', label: 'Warning' },
      { key: 'error',   base: '#E8001D', light: '#FDE8EA', label: 'Error' },
      { key: 'info',    base: '#2164E3', light: '#E8EFFE', label: 'Info' },
    ],
    palettes: [
      {
        id: 'rojo-puro', name: 'Rojo Puro',
        desc: 'Alto contraste · Fuerza de marca',
        bg: '#FAFAF8', surface: '#FFFFFF', text: '#0C0C0E', accent: '#E8001D',
      },
      {
        id: 'midnight', name: 'Midnight',
        desc: 'Premium oscuro · Data-forward',
        bg: '#0C0C0E', surface: '#1A1A18', text: '#FAFAF8', accent: '#FF1A35',
      },
      {
        id: 'warm-stone', name: 'Warm Stone',
        desc: 'Cálido y sofisticado',
        bg: '#F5F3EE', surface: '#FAFAF8', text: '#1A1A14', accent: '#E8001D',
      },
    ],
  },

  typography: {
    // Familia adoptada en todo el producto: Space Grotesk (display + cuerpo).
    // Figuras tabulares para datos financieros. Las otras son exploraciones archivadas.
    pairs: [
      {
        id: 'geometric', name: 'Space Grotesk', adopted: true,
        display: "'Space Grotesk', system-ui, sans-serif",
        body:    "'Space Grotesk', system-ui, sans-serif",
        desc:    'Sistema actual · Moderno · Legibilidad numérica',
      },
      {
        id: 'editorial', name: 'Editorial (archivada)',
        display: "'Playfair Display', Georgia, serif",
        body:    "'DM Sans', system-ui, sans-serif",
        desc:    'Exploración · Elegante · Premium',
      },
      {
        id: 'technical', name: 'Technical (archivada)',
        display: "'Barlow Condensed', system-ui, sans-serif",
        body:    "'Barlow', system-ui, sans-serif",
        desc:    'Exploración · Estructurado · Datos',
      },
    ],
    scale: [
      { name: 'Display',  size: '72px', weight: 700, lh: 1.05, usage: 'Heroes, portadas' },
      { name: 'H1',       size: '48px', weight: 700, lh: 1.1,  usage: 'Títulos de página' },
      { name: 'H2',       size: '36px', weight: 600, lh: 1.15, usage: 'Secciones principales' },
      { name: 'H3',       size: '28px', weight: 600, lh: 1.2,  usage: 'Subsecciones' },
      { name: 'H4',       size: '22px', weight: 600, lh: 1.25, usage: 'Cards, panels' },
      { name: 'H5',       size: '18px', weight: 600, lh: 1.3,  usage: 'Componentes' },
      { name: 'Body LG',  size: '18px', weight: 400, lh: 1.6,  usage: 'Texto destacado' },
      { name: 'Body',     size: '15px', weight: 400, lh: 1.6,  usage: 'Cuerpo general' },
      { name: 'Body SM',  size: '13px', weight: 400, lh: 1.5,  usage: 'Metadatos, secundario' },
      { name: 'Caption',  size: '11px', weight: 500, lh: 1.4,  usage: 'Labels, caps' },
    ],
  },

  spacing: [
    { name: 'space-1',  px: 4,  usage: 'Micro · icon gaps' },
    { name: 'space-2',  px: 8,  usage: 'XS · tight groups' },
    { name: 'space-3',  px: 12, usage: 'SM · inline padding' },
    { name: 'space-4',  px: 16, usage: 'MD · base unit' },
    { name: 'space-5',  px: 20, usage: 'LG · card padding' },
    { name: 'space-6',  px: 24, usage: 'XL · panels' },
    { name: 'space-8',  px: 32, usage: '2XL · sections' },
    { name: 'space-10', px: 40, usage: '3XL · layout gaps' },
    { name: 'space-12', px: 48, usage: '4XL · hero padding' },
    { name: 'space-16', px: 64, usage: '5XL · page sections' },
    { name: 'space-20', px: 80, usage: '6XL · hero sections' },
  ],

  radius: [
    { name: 'radius-none', value: '0px',     usage: 'Tables, sharp edges' },
    { name: 'radius-sm',   value: '4px',     usage: 'Badges, chips' },
    { name: 'radius-md',   value: '8px',     usage: 'Inputs, buttons' },
    { name: 'radius-lg',   value: '12px',    usage: 'Cards' },
    { name: 'radius-xl',   value: '16px',    usage: 'Modals, panels' },
    { name: 'radius-2xl',  value: '24px',    usage: 'Large surfaces' },
    { name: 'radius-full', value: '9999px',  usage: 'Pills, avatars' },
  ],

  shadows: [
    { name: 'shadow-xs', value: '0 1px 2px rgba(12,12,14,.06)',                              usage: 'Hairline lift' },
    { name: 'shadow-sm', value: '0 1px 2px rgba(12,12,14,.06), 0 1px 3px rgba(12,12,14,.04)',usage: 'Subtle' },
    { name: 'shadow-md', value: '0 4px 6px rgba(12,12,14,.04), 0 2px 4px rgba(12,12,14,.06)',usage: 'Cards' },
    { name: 'shadow-lg', value: '0 10px 15px rgba(12,12,14,.06), 0 4px 6px rgba(12,12,14,.04)', usage: 'Dropdowns' },
    { name: 'shadow-xl', value: '0 20px 25px rgba(12,12,14,.08), 0 10px 10px rgba(12,12,14,.04)', usage: 'Modals' },
    { name: 'focus-ring','value': '0 0 0 3px rgba(232,0,29,.22)',                             usage: 'Focus state' },
  ],

  cssVars: `/* Arroba Design System — CSS Custom Properties */

:root {
  /* Brand */
  --arroba-red:        #E8001D;
  --arroba-red-light:  #FF1A35;
  --arroba-red-dark:   #B5001A;
  --arroba-black:      #0C0C0E;

  /* Neutral */
  --neutral-50:  #FAFAF8;
  --neutral-100: #F4F4F0;
  --neutral-200: #E8E8E2;
  --neutral-300: #D4D4CC;
  --neutral-400: #ADADAA;
  --neutral-500: #858580;
  --neutral-600: #636360;
  --neutral-700: #4A4A47;
  --neutral-800: #2E2E2C;
  --neutral-900: #1A1A18;
  --neutral-950: #0C0C0E;

  /* Semantic */
  --color-success:       #1A8A4A;
  --color-success-light: #E8F5EE;
  --color-warning:       #D97708;
  --color-warning-light: #FEF3E2;
  --color-error:         #E8001D;
  --color-error-light:   #FDE8EA;
  --color-info:          #2164E3;
  --color-info-light:    #E8EFFE;

  /* Semantic aliases (light mode) */
  --bg:           #FAFAF8;
  --surface:      #FFFFFF;
  --surface-2:    #F4F4F0;
  --border:       #E8E8E2;
  --border-strong:#D4D4CC;
  --text:         #0C0C0E;
  --text-muted:   #636360;
  --text-subtle:  #ADADAA;
  --primary:      #E8001D;
  --primary-hover:#C50019;

  /* Typography — Space Grotesk como familia única (display + cuerpo) */
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body:    'Space Grotesk', system-ui, sans-serif;

  /* Spacing */
  --space-1:  4px;  --space-2:  8px;  --space-3:  12px;
  --space-4:  16px; --space-5:  20px; --space-6:  24px;
  --space-8:  32px; --space-10: 40px; --space-12: 48px;
  --space-16: 64px; --space-20: 80px;

  /* Radius */
  --radius-sm:   4px;  --radius-md:   8px;   --radius-lg:  12px;
  --radius-xl:   16px; --radius-2xl:  24px;  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(12,12,14,.06), 0 1px 3px rgba(12,12,14,.04);
  --shadow-md: 0 4px 6px rgba(12,12,14,.04), 0 2px 4px rgba(12,12,14,.06);
  --shadow-lg: 0 10px 15px rgba(12,12,14,.06), 0 4px 6px rgba(12,12,14,.04);
  --shadow-xl: 0 20px 25px rgba(12,12,14,.08), 0 10px 10px rgba(12,12,14,.04);
  --focus-ring: 0 0 0 3px rgba(232,0,29,.22);
}

/* Dark mode: activado por la presencia del atributo [data-dark] */
[data-dark] {
  --bg:           #0C0C0E;
  --surface:      #1A1A18;
  --surface-2:    #242422;
  --border:       #2E2E2C;
  --border-strong:#4A4A47;
  --text:         #FAFAF8;
  --text-muted:   #ADADAA;
  --text-subtle:  #636360;
  /* El rojo de marca NO se aclara en oscuro: se mantiene #E8001D */
  --primary:      #E8001D;
  --primary-hover:#FF1A35;
}`,
};
