'use client';
import { useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'arroba-theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const current = document.documentElement.hasAttribute('data-dark') ? 'dark' : 'light';
    setTheme(current);
    setHydrated(true);
  }, []);

  const apply = useCallback((next: Theme) => {
    if (typeof document === 'undefined') return;
    if (next === 'dark') document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable; swallow */
    }
    setTheme(next);
  }, []);

  const toggle = useCallback(() => {
    apply(theme === 'dark' ? 'light' : 'dark');
  }, [apply, theme]);

  return { theme, toggle, setTheme: apply, hydrated };
}

/* Pre-paint script. Inyectado en <head>. Lee localStorage o prefers-color-scheme
   y aplica [data-dark] ANTES del primer paint. */
export const PRE_PAINT_THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('arroba-theme');if(!s){s=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(s==='dark'){document.documentElement.setAttribute('data-dark','');}}catch(e){}})();`;
