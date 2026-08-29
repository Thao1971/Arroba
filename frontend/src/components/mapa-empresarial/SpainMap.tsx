'use client';
/**
 * Mapa estilizado de España por CCAA — réplica visual del mock
 * `_design_intake/mapa/mapa-charts.jsx` (`SpainMapDetailed` + `heatColor`).
 *
 * Las formas (`d`) son las mismas del diseño original: no son un mapa
 * geográficamente exacto, son "blobs" estilizados por comunidad autónoma.
 * Baleares se dibuja como 2 puntos, igual que en el mock (nunca tuvo forma
 * propia). Canarias, Ceuta y Melilla tampoco tenían forma en el mock —
 * siguen sin ella aquí; sus datos, si los hay, solo aparecen en el ranking
 * de la derecha, nunca inventados en el mapa.
 *
 * Los `ccaaCode` son los códigos INE reales (`services/geo_catalog.py` de
 * Intel, `CCAA[].code`), que es el mismo valor que Intel devuelve como
 * `geo_id` para el nivel "ccaa" — así el color de cada forma sale siempre
 * de un dato real (`dynamism_score`), nunca de un número de mock.
 */
import type { ReactNode } from 'react';
import type { MarketMapTerritoryCard } from '@/lib/api/client';

const BLOB_REGIONS: { id: string; ccaaCode: string; d: string }[] = [
  { id: 'galicia', ccaaCode: '12', d: 'M40,58 Q26,52 30,40 Q44,36 54,46 Q52,62 40,64 Z' },
  { id: 'asturias', ccaaCode: '03', d: 'M58,44 Q72,40 86,44 Q84,54 66,54 Q58,50 58,44 Z' },
  { id: 'cantabria', ccaaCode: '06', d: 'M88,44 Q98,41 106,46 Q104,54 90,53 Z' },
  { id: 'paisvasco', ccaaCode: '16', d: 'M108,46 Q120,42 128,50 Q124,60 112,58 Q106,52 108,46 Z' },
  { id: 'navarra', ccaaCode: '15', d: 'M130,52 Q140,50 144,62 Q138,72 128,68 Q126,58 130,52 Z' },
  { id: 'aragon', ccaaCode: '02', d: 'M132,70 Q148,68 152,90 Q148,114 134,110 Q126,90 132,70 Z' },
  { id: 'cataluna', ccaaCode: '09', d: 'M154,64 Q176,60 184,80 Q180,102 162,98 Q150,84 154,64 Z' },
  { id: 'castillaln', ccaaCode: '07', d: 'M56,58 Q104,52 126,72 Q124,104 80,108 Q52,96 50,72 Z' },
  { id: 'madrid', ccaaCode: '13', d: 'M92,108 Q110,104 118,116 Q112,130 96,128 Q86,118 92,108 Z' },
  { id: 'rioja', ccaaCode: '17', d: 'M116,62 Q126,60 128,70 Q120,74 114,70 Z' },
  { id: 'extremadura', ccaaCode: '11', d: 'M52,110 Q78,106 84,128 Q78,152 56,148 Q46,128 52,110 Z' },
  { id: 'castillalm', ccaaCode: '08', d: 'M88,116 Q128,110 140,128 Q134,154 96,156 Q82,138 88,116 Z' },
  { id: 'valencia', ccaaCode: '10', d: 'M142,96 Q160,94 162,124 Q154,148 138,142 Q134,116 142,96 Z' },
  { id: 'murcia', ccaaCode: '14', d: 'M132,144 Q148,142 150,160 Q142,172 128,166 Q126,152 132,144 Z' },
  { id: 'andalucia', ccaaCode: '01', d: 'M56,150 Q108,142 130,158 Q126,184 80,190 Q50,176 48,160 Z' },
];
const BALEARES_CCAA_CODE = '04';

// Idéntica a `heatColor` del mock (rgba(232,0,29,…) == --arroba-red).
function heatColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'var(--surface-2)';
  const t = Math.max(0, Math.min(1, (score - 55) / 45));
  return `rgba(232,0,29,${(0.14 + t * 0.82).toFixed(3)})`;
}

export function SpainMap({
  territories,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: {
  territories: MarketMapTerritoryCard[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const byCode = new Map(territories.map((t) => [t.geo_id, t]));

  const renderShape = (ccaaCode: string, node: (fill: string, t: MarketMapTerritoryCard | undefined) => ReactNode) => {
    const t = byCode.get(ccaaCode);
    const fill = heatColor(t?.dynamism_score);
    return node(fill, t);
  };

  return (
    <div>
      <svg width="100%" viewBox="20 30 180 170" style={{ display: 'block', overflow: 'visible' }}>
        {BLOB_REGIONS.map((r) =>
          renderShape(r.ccaaCode, (fill, t) => {
            const isSel = selectedId === r.ccaaCode;
            const isHov = hoveredId === r.ccaaCode;
            const dim = Boolean((hoveredId && !isHov) || (selectedId && !isSel && !isHov));
            return (
              <path
                key={r.id}
                d={r.d}
                fill={fill}
                stroke={isSel ? 'var(--text)' : 'var(--surface)'}
                strokeWidth={isSel ? 2 : 1.4}
                style={{
                  cursor: t ? 'pointer' : 'default',
                  transition: 'opacity .15s, stroke-width .12s',
                  opacity: dim ? 0.4 : 1,
                }}
                onMouseEnter={() => t && onHover(r.ccaaCode)}
                onMouseLeave={() => onHover(null)}
                onClick={() => t && onSelect(r.ccaaCode)}
              />
            );
          })
        )}
        {/* Baleares — puntos, igual que en el mock (nunca tuvo forma propia) */}
        {renderShape(BALEARES_CCAA_CODE, (fill, t) => {
          const isSel = selectedId === BALEARES_CCAA_CODE;
          const isHov = hoveredId === BALEARES_CCAA_CODE;
          const dim = Boolean((hoveredId && !isHov) || (selectedId && !isSel && !isHov));
          return (
            <g
              style={{ cursor: t ? 'pointer' : 'default', opacity: dim ? 0.4 : 1 }}
              onMouseEnter={() => t && onHover(BALEARES_CCAA_CODE)}
              onMouseLeave={() => onHover(null)}
              onClick={() => t && onSelect(BALEARES_CCAA_CODE)}
            >
              <circle cx="186" cy="128" r="4" fill={fill} stroke="var(--surface)" strokeWidth={1.2} />
              <circle cx="195" cy="124" r="3" fill={fill} stroke="var(--surface)" strokeWidth={1.2} />
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-2 mt-2 text-[11px] text-text-muted">
        <span>Bajo</span>
        <div
          className="flex-1 h-1.5 rounded-full"
          style={{ background: 'linear-gradient(to right, rgba(232,0,29,.14), rgba(232,0,29,.96))' }}
        />
        <span>Alto</span>
      </div>
      <p className="text-[10px] text-text-muted text-center mt-1">Índice de dinamismo (Territorios)</p>
    </div>
  );
}
