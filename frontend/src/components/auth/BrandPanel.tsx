'use client';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import useSWR from 'swr';
import { swrFetcher, ApiError } from '@/lib/api/client';
import type { PlatformStats } from '@/lib/api/types';
import { formatNumber } from '@/lib/format';
import { GlobeAnimation } from './GlobeAnimation';

/**
 * Brand side panel for /login and /registro.
 * Port from /app/_design_intake/auth/auth-ui.jsx -> <BrandPanel/>.
 * The original used inline styles + a ✦ glyph; here we keep the same visual
 * hierarchy but with Tailwind classes that read from our tokens (var(--*)).
 *
 * HARDENING-XXX · adds the Cloudflare-login-style animated globe
 * (dash.cloudflare.com/login), rebuilt on Canvas 2D since this repo has no
 * network path to install a WebGL lib — see GlobeAnimation.tsx. Spain is
 * the hero marker; a few European/Iberoamerican hubs orbit it with animated
 * arcs to read as "global network, Spain at the centre".
 *
 * 2026-09-11, revisión de Daniel: (1) el logo se retira de este panel —
 * vive ahora en AuthShell, sobre el formulario — y no se sustituye por nada
 * aquí. (2) el globo estaba demasiado pegado/cortado abajo; ahora centrado
 * verticalmente y algo más grande. (3) el stat de "copiloto de inteligencia"
 * se retira (solo compañías + métricas) y el número de compañías pasa de
 * "3,3M" (objetivo de arquitectura para la cobertura nacional completa, no
 * el dato real de hoy) a 24.992 — el recuento REAL verificado en producción
 * (Atlas, ingestión Iberinform, confirmado 2026-09-05 en
 * project_iberinform_full_ingestion.md). "Casi 5.000" métricas económicas
 * se deja igual: es la misma cifra ya usada, tal cual, en la Home pública
 * (`(public)/page.tsx`), no un número inventado aquí.
 *
 * 2026-09-11, ronda 3 (feedback de Daniel sobre el preview): (a) al quitar
 * el logo de este panel el titular quedó pegado al borde superior — ver el
 * spacer añadido más abajo, que reintroduce el hueco que el logo dejaba en
 * el flex `justify-between` (comparar con `_design_intake/auth/auth-ui.jsx`,
 * donde el logo era el primer hijo y el bloque de texto quedaba más
 * centrado). (b) la estrellita del pill ya usa el icono `Sparkles` con
 * `text-primary` (rojo de marca) — correcto en este componente real; el
 * preview HTML estático que vio Daniel usaba un carácter suelto sin color
 * propio, de ahí que se viera blanco solo en esa maqueta, no aquí.
 *
 * 2026-09-11, ronda 4 (Daniel: "cablea también Señales del mercado"): el
 * stat "5.000 métricas económicas" no tenía ningún dato real detrás (ver
 * investigación en project_login_globo_animado.md / MANIFEST.md — no existe
 * ningún catálogo que produzca ese número, ni en Beta ni en Intel). En vez
 * de perseguir un número real para esa métrica concreta (viviría solo en
 * Intel, sin proxy hoy), se sustituye por "señales del mercado", que SÍ
 * tiene ya un pipeline real y en vivo: el mismo `GET /api/platform/stats`
 * que usa `MetricsBlock.tsx` en la Home (`signals_detected`, con toggle
 * mock/real vía `agency_tool_mode` y proxy a Intel — ver
 * `backend/src/modules/platform/router.py` +
 * `agency_tool_adapter/service.py::get_platform_stats()`). Ambos stats de
 * este panel pasan a ser AHORA en vivo (antes "24.992" era texto estático,
 * aunque correcto en el momento de escribirlo): se piden con SWR (mismo
 * patrón que `MetricsBlock`) y, mientras no haya respuesta o si el fetch
 * falla, se muestran los últimos valores reales conocidos como fallback —
 * el login nunca debe bloquearse ni mostrar un hueco vacío por esto (mismo
 * principio que "Beta nunca debe hard-fallar el home público").
 */
// Últimos valores reales conocidos (ver JSDoc arriba) — fallback mientras
// carga el fetch en vivo o si `/api/platform/stats` no responde. Nunca
// bloquea ni deja el panel de login vacío.
const FALLBACK_COMPANIES = '24.992';
const FALLBACK_SIGNALS = '6.159';

export function BrandPanel() {
  const t = useTranslations('brandPanel');
  const { data } = useSWR<PlatformStats, ApiError>('/api/platform/stats', swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  const stats = [
    {
      n: data ? formatNumber(data.companies_analyzed) : FALLBACK_COMPANIES,
      l: t('statCompanies'),
    },
    {
      n: data ? formatNumber(data.signals_detected) : FALLBACK_SIGNALS,
      l: t('statSignals'),
    },
  ];
  return (
    <aside
      data-testid="auth-brand-panel"
      className="hidden md:flex relative overflow-hidden text-white flex-col justify-between px-10 lg:px-14 py-12 order-2"
      style={{ background: '#0C0C0E' }}
    >
      {/* Faded ✦ glyph */}
      <span
        aria-hidden
        className="absolute right-[-60px] top-[-40px] leading-none font-display font-extrabold select-none pointer-events-none z-0"
        style={{
          fontSize: 360,
          color: 'rgba(232,0,29,.09)',
        }}
      >
        ✦
      </span>

      {/* Animated globe — Spain highlighted, connected to a handful of hubs.
          Centered in the panel (not bottom-anchored), sits behind the copy. */}
      <div
        className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
        data-testid="auth-brand-globe"
      >
        <GlobeAnimation className="relative w-[135%] max-w-[680px] aspect-square translate-y-[6%] opacity-95" />
      </div>

      {/* Preserves the vertical rhythm the logo used to occupy in this flex
          column (see JSDoc above) — no longer a logo, just a layout spacer. */}
      <div aria-hidden className="relative z-0 h-6 shrink-0" />

      <div className="relative z-10 max-w-md">
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
        className="relative z-10 text-xs"
        style={{ color: 'rgba(255,255,255,.4)' }}
      >
        {t('footer')}
      </div>
    </aside>
  );
}
