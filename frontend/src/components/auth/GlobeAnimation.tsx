'use client';
import { useEffect, useRef } from 'react';

/**
 * Cloudflare/Stripe-style rotating dotted globe, hand-rolled with Canvas 2D
 * (no external dependency — this environment can't reach the npm registry
 * from the user's machine, and a ~5KB WebGL lib like `cobe` wasn't
 * installable). Renders a low-fidelity continent silhouette as a field of
 * dots, with Spain called out as the hero marker (bigger, brand red,
 * pulsing) and a handful of European/Iberoamerican hubs connected to it by
 * animated flight-path arcs.
 *
 * Respects prefers-reduced-motion: renders a single static, Spain-facing
 * frame and skips the animation loop entirely.
 */

type Vec3 = [number, number, number];

const TAU = Math.PI * 2;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function latLonToVec3(latDeg: number, lonDeg: number): Vec3 {
  const lat = toRad(latDeg);
  const lon = toRad(lonDeg);
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
}

function vec3ToLatLon([x, y, z]: Vec3): [number, number] {
  const lat = Math.asin(Math.max(-1, Math.min(1, y)));
  const lon = Math.atan2(x, z);
  return [(lat * 180) / Math.PI, (lon * 180) / Math.PI];
}

function fibonacciSphere(samples: number): Vec3[] {
  const points: Vec3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push([Math.cos(theta) * radius, y, Math.sin(theta) * radius]);
  }
  return points;
}

// Very low-fidelity continent outlines (lon, lat) — just enough for the dot
// field to read as "a world map" at this scale. Iberia gets a little extra
// room so Spain's marker unambiguously sits on land.
const LAND_POLYGONS: [number, number][][] = [
  // North America
  [
    [-168, 68], [-155, 71], [-130, 71], [-95, 66], [-83, 58], [-80, 45], [-66, 45],
    [-60, 28], [-81, 25], [-97, 18], [-105, 20], [-110, 22], [-117, 32], [-124, 40],
    [-124, 49], [-135, 58], [-155, 60], [-168, 68],
  ],
  // Central America land bridge
  [[-92, 16], [-84, 10], [-77, 8], [-80, 18], [-92, 16]],
  // South America
  [
    [-79, 9], [-61, 10], [-51, 4], [-35, -5], [-38, -13], [-42, -23], [-49, -29],
    [-58, -35], [-68, -55], [-72, -45], [-71, -30], [-78, -15], [-81, -4], [-79, 9],
  ],
  // Europe incl. Iberia and Scandinavia
  [
    [-9.5, 43.8], [-9.5, 37], [-6, 36], [3, 38], [3, 42.5], [7, 44], [13, 45.5],
    [13, 54], [8, 58], [11, 63], [25, 70], [30, 60], [40, 66], [30, 50], [24, 42],
    [15, 40], [19, 40], [27, 36], [23, 35], [15, 37], [9, 44], [-1.5, 49], [-5, 48],
    [-9.5, 43.8],
  ],
  // Africa
  [
    [-17, 35], [-6, 36], [10, 37], [33, 31], [35, 12], [43, 12], [51, 12], [42, -1],
    [40, -16], [35, -24], [27, -33], [18, -35], [13, -28], [12, -6], [9, 4], [-4, 5],
    [-11, 7], [-17, 15], [-17, 35],
  ],
  // Middle East / Central Asia
  [
    [27, 36], [36, 41], [48, 41], [55, 45], [60, 55], [70, 55], [80, 50], [75, 42],
    [80, 36], [73, 32], [68, 25], [62, 25], [57, 26], [50, 30], [44, 37], [36, 36],
    [27, 36],
  ],
  // Asia (broad)
  [
    [60, 55], [70, 60], [90, 73], [110, 75], [140, 73], [170, 68], [178, 64],
    [160, 55], [140, 55], [130, 46], [122, 40], [118, 32], [108, 22], [100, 10],
    [95, 20], [92, 22], [97, 28], [105, 30], [110, 38], [122, 50], [105, 52],
    [90, 50], [80, 50], [70, 55], [60, 55],
  ],
  // Indochina
  [[92, 22], [100, 7], [104, 1], [108, 10], [105, 20], [97, 25], [92, 22]],
  // Indian subcontinent
  [[68, 24], [77, 8], [80, 13], [88, 22], [92, 26], [85, 28], [73, 32], [68, 24]],
  // Japan (small blob)
  [[130, 32], [141, 36], [142, 41], [131, 34], [130, 32]],
  // Great Britain & Ireland
  [[-10, 51], [-8, 55], [-3, 59], [0, 52], [-5, 50], [-10, 51]],
  // Australia
  [
    [113, -22], [122, -18], [136, -12], [143, -14], [153, -27], [150, -37],
    [140, -38], [131, -32], [115, -34], [113, -26], [113, -22],
  ],
];

function pointInPolygon(lon: number, lat: number, poly: [number, number][]) {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = poly[i];
    const pj = poly[j];
    if (!pi || !pj) continue;
    const [xi, yi] = pi;
    const [xj, yj] = pj;
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isLand(latDeg: number, lonDeg: number) {
  for (const poly of LAND_POLYGONS) {
    if (pointInPolygon(lonDeg, latDeg, poly)) return true;
  }
  return false;
}

function rotateY([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

function rotateX([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.max(-1, Math.min(1, dot));
  const theta = Math.acos(dot) * t;
  const rel: Vec3 = [b[0] - a[0] * dot, b[1] - a[1] * dot, b[2] - a[2] * dot];
  const len = Math.sqrt(rel[0] ** 2 + rel[1] ** 2 + rel[2] ** 2) || 1;
  const relN: Vec3 = [rel[0] / len, rel[1] / len, rel[2] / len];
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  return [a[0] * ct + relN[0] * st, a[1] * ct + relN[1] * st, a[2] * ct + relN[2] * st];
}

const SPAIN: Vec3 = latLonToVec3(40.2, -3.7);

const HUBS: { name: string; pos: Vec3 }[] = [
  { name: 'Londres', pos: latLonToVec3(51.5, -0.1) },
  { name: 'París', pos: latLonToVec3(48.9, 2.35) },
  { name: 'Fráncfort', pos: latLonToVec3(50.1, 8.7) },
  { name: 'Milán', pos: latLonToVec3(45.5, 9.2) },
  { name: 'Lisboa', pos: latLonToVec3(38.7, -9.1) },
  { name: 'Ciudad de México', pos: latLonToVec3(19.4, -99.1) },
];

export function GlobeAnimation({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dots = fibonacciSphere(4200)
      .map((p) => ({ p, ll: vec3ToLatLon(p) }))
      .filter(({ ll }) => isLand(ll[0], ll[1]))
      .map(({ p }) => p);

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = 0;
    let R = 0;

    function resize() {
      if (!wrap || !canvas) return;
      size = wrap.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      R = (size / 2) * 0.8;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let phi = toRad(8); // start with Spain roughly facing the viewer
    const theta = toRad(-12);
    let raf = 0;
    const start = performance.now();

    function project(v: Vec3, cx: number, cy: number): [number, number, number] {
      const r = rotateX(rotateY(v, phi), theta);
      return [cx + r[0] * R, cy - r[1] * R, r[2]];
    }

    function frame(now: number) {
      if (!canvas || !ctx || size === 0) return;
      const t = (now - start) / 1000;
      if (!reduceMotion) phi += 0.0016;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const s = size / 380;

      // Soft red atmosphere glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.28);
      glow.addColorStop(0, 'rgba(232,0,29,0.10)');
      glow.addColorStop(1, 'rgba(232,0,29,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.28, 0, TAU);
      ctx.fill();

      // Sphere base — barely-there volume
      const base = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      base.addColorStop(0, 'rgba(255,255,255,0.05)');
      base.addColorStop(1, 'rgba(255,255,255,0.015)');
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();

      // Land dots
      for (const p of dots) {
        const [sx, sy, sz] = project(p, cx, cy);
        if (sz < 0.02) continue;
        const depth = (sz + 1) / 2;
        const r = 0.9 * (0.4 + 0.6 * depth) * s;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, TAU);
        ctx.fillStyle = `rgba(255,255,255,${(0.14 + 0.34 * depth).toFixed(3)})`;
        ctx.fill();
      }

      // Arcs from Spain to each hub, plus a travelling pulse along each
      HUBS.forEach((hub, i) => {
        const steps = 48;
        let drawing = false;
        ctx.beginPath();
        for (let step = 0; step <= steps; step++) {
          const tt = step / steps;
          const mid = slerp(SPAIN, hub.pos, tt);
          const lift = 1 + 0.22 * Math.sin(Math.PI * tt);
          const lifted: Vec3 = [mid[0] * lift, mid[1] * lift, mid[2] * lift];
          const [sx, sy, sz] = project(lifted, cx, cy);
          if (sz < 0.03) {
            drawing = false;
            continue;
          }
          if (!drawing) {
            ctx.moveTo(sx, sy);
            drawing = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        }
        ctx.strokeStyle = 'rgba(232,0,29,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (!reduceMotion) {
          const pulseT = (t * 0.22 + i * 0.16) % 1;
          const mid = slerp(SPAIN, hub.pos, pulseT);
          const lift = 1 + 0.22 * Math.sin(Math.PI * pulseT);
          const lifted: Vec3 = [mid[0] * lift, mid[1] * lift, mid[2] * lift];
          const [sx, sy, sz] = project(lifted, cx, cy);
          if (sz > 0.03) {
            ctx.beginPath();
            ctx.arc(sx, sy, 1.8 * s, 0, TAU);
            ctx.fillStyle = 'rgba(255,90,100,0.95)';
            ctx.fill();
          }
        }

        // Hub marker
        const [hx, hy, hz] = project(hub.pos, cx, cy);
        if (hz > 0.02) {
          ctx.beginPath();
          ctx.arc(hx, hy, 1.6 * s, 0, TAU);
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fill();
        }
      });

      // Spain — the hero marker, pulsing
      const [px, py, pz] = project(SPAIN, cx, cy);
      if (pz > 0.02) {
        const pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.4);
        const ringR = (3.2 + pulse * 5) * s;
        ctx.beginPath();
        ctx.arc(px, py, ringR, 0, TAU);
        ctx.strokeStyle = `rgba(232,0,29,${(0.4 - pulse * 0.3).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, 3.2 * s, 0, TAU);
        ctx.fillStyle = '#E8001D';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, 5.2 * s, 0, TAU);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (!reduceMotion) raf = requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      frame(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
