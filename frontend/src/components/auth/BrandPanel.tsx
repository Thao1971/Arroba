'use client';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

/**
 * Brand side panel for /login and /registro.
 * Port from /app/_design_intake/auth/auth-ui.jsx -> <BrandPanel/>.
 * The original used inline styles + a ✦ glyph; here we keep the same visual
 * hierarchy but with Tailwind classes that read from our tokens (var(--*)).
 */
export function BrandPanel() {
  const t = useTranslations('brandPanel');
  const stats = [
    { n: '3,3M', l: t('statCompanies') },
    { n: '5.000', l: t('statMetrics') },
    { n: '24/7', l: t('statCopilot') },
  ];
  return (
    <aside
      data-testid="auth-brand-panel"
      className="hidden md:flex relative overflow-hidden text-white flex-col justify-between px-10 lg:px-14 py-12"
      style={{ background: '#0C0C0E' }}
    >
      {/* Faded ✦ glyph */}
      <span
        aria-hidden
        className="absolute right-[-60px] top-[-40px] leading-none font-display font-extrabold select-none pointer-events-none"
        style={{
          fontSize: 360,
          color: 'rgba(232,0,29,.09)',
        }}
      >
        ✦
      </span>

      <div className="relative flex items-center">
        {/* HARDENING-030 · logo ARROBA variante blanca (fondo oscuro). */}
        <img src="/brand/logo-white.png" alt="arroba" className="h-9 w-auto" />
      </div>

      <div className="relative max-w-md">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{
            background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.14)',
          }}
        >
          <Sparkles size={12} strokeWidth={1.5} className="text-primary" />
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,.85)' }}>
            {t('tagline')}
          </span>
        </div>
        <h2 className="font-display font-bold text-2xl lg:text-[27px] leading-tight tracking-tight">
          {t('headline')}
        </h2>
        <div className="mt-8 flex gap-8">
          {stats.map((s) => (
            <div key={s.l}>
              <div className="font-display font-extrabold text-2xl tracking-tight">{s.n}</div>
              <div
                className="text-xs mt-1 leading-snug max-w-[110px]"
                style={{ color: 'rgba(255,255,255,.55)' }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative text-xs"
        style={{ color: 'rgba(255,255,255,.4)' }}
      >
        {t('footer')}
      </div>
    </aside>
  );
}
