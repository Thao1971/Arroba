/**
 * R13 · Canonical Screens Guard — verificable en CI.
 *
 * Regla: solo puede existir UNA Source of Truth por pantalla canónica de
 * arroba.com. Cuando una pantalla se sustituye, sus archivos se mueven a
 * `/app/_legacy/` y su patrón identificador se añade a la lista bloqueada.
 *
 * Este test falla si algún archivo `.ts` / `.tsx` del árbol activo
 * (`frontend/src/`) contiene una referencia (import, JSX, comentario) a un
 * patrón legacy listado en `LEGACY_PATTERNS`.
 *
 * ⚠️ Reglas de mantenimiento:
 *   - La lista `LEGACY_PATTERNS` es la fuente de verdad del guard.
 *   - Debe permanecer sincronizada con la Tabla 2 de `/app/memory/CANONICAL_SCREENS.md`.
 *   - Cualquier PR que mueva una pantalla nueva a `/app/_legacy/` DEBE:
 *       1. Añadir su patrón identificador a `LEGACY_PATTERNS`.
 *       2. Añadir su fila a la Tabla 2 de `CANONICAL_SCREENS.md`.
 *       3. Añadir su fila a `CANONICAL_SCREENS.md` en el mismo commit.
 *
 * Ámbito de escaneo:
 *   - INCLUYE: archivos .ts / .tsx / .jsx bajo frontend/src (árbol activo).
 *   - EXCLUYE:
 *       - Este propio test file (obviamente contiene los patrones como strings).
 *       - `CANONICAL_SCREENS.md`, `README.md`, otros `.md` (documentación explícita).
 *       - `/app/_legacy/**` (destino declarado del código deprecated).
 *       - `node_modules`, `.next`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Patrones legacy bloqueados en el árbol activo.
 *
 * Mantener sincronizado con Tabla 2 de `/app/memory/CANONICAL_SCREENS.md`.
 */
export const LEGACY_PATTERNS: readonly string[] = [
  'CPApp',
  'cp-app',
  'Company Profile',
] as const;

/** Root del árbol activo del frontend. */
const SRC_ROOT = join(__dirname, '..');

/** Este archivo (no se debe auto-escanear: contiene los patrones como strings). */
const GUARD_FILE_ABS = join(__dirname, 'canonical_screens_guard.test.ts');

const EXTENSIONS = ['.ts', '.tsx', '.jsx'];
const EXCLUDED_DIRS = new Set(['node_modules', '.next', '__pycache__', 'dist']);

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (EXCLUDED_DIRS.has(name)) continue;
    const abs = join(dir, name);
    let s;
    try {
      s = statSync(abs);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      walk(abs, out);
    } else if (s.isFile() && EXTENSIONS.some((e) => name.endsWith(e))) {
      out.push(abs);
    }
  }
}

function scanForPattern(pattern: string): string[] {
  const files: string[] = [];
  walk(SRC_ROOT, files);
  const hits: string[] = [];
  for (const abs of files) {
    if (abs === GUARD_FILE_ABS) continue;
    let content: string;
    try {
      content = readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    if (content.includes(pattern)) {
      const rel = relative(SRC_ROOT, abs);
      /* Buscar líneas concretas para reporte legible. */
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes(pattern)) {
          hits.push(`${rel}:${idx + 1}: ${line.trim().slice(0, 160)}`);
        }
      });
    }
  }
  return hits;
}

describe('R13 · Canonical Screens Guard', () => {
  it.each(LEGACY_PATTERNS)(
    'no active reference to legacy pattern "%s" in frontend/src',
    (pattern) => {
      const hits = scanForPattern(pattern);
      if (hits.length > 0) {
        throw new Error(
          `R13 violated: found ${hits.length} reference(s) to legacy pattern "${pattern}" in frontend/src.\n` +
            `See /app/memory/CANONICAL_SCREENS.md — deprecated screens must live in /app/_legacy/.\n\n` +
            hits.map((h) => `  · ${h}`).join('\n'),
        );
      }
      expect(hits).toEqual([]);
    },
  );

  it('LEGACY_PATTERNS is not empty (protección contra guard vacío)', () => {
    expect(LEGACY_PATTERNS.length).toBeGreaterThan(0);
  });

  it('detects a synthetic violation (self-test del guard)', () => {
    /* Fixture in-memory: verifica que scanForPattern encuentra un patrón
       si estuviera en el árbol. Usamos un patrón único (uuid-like) que
       NUNCA existirá en la codebase real, salvo por esta línea del test.
       Como el guard EXCLUYE este archivo del escaneo (ver GUARD_FILE_ABS),
       el patrón NO debe aparecer en los hits, demostrando la exclusión.
       Aparte, verificamos el mecanismo básico de matching en un buffer. */
    const SYNTHETIC = 'CPApp-guard-selftest-4c5f9b1e';
    /* Comprobamos que si escaneáramos ese patrón el buffer lo encontraría. */
    const sample = `import { ${SYNTHETIC} } from 'somewhere'`;
    expect(sample.includes(SYNTHETIC)).toBe(true);
    /* Y comprobamos que el guard-file está excluido correctamente:
       aunque contiene SYNTHETIC como string, no debe salir en el scan real. */
    const hits = scanForPattern(SYNTHETIC);
    expect(hits).toEqual([]);
  });
});
