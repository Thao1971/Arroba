/**
 * R14 · Guard automatizado — verifica que todo componente React bajo
 * `components/company/**` (excepto contenedores de layout explícitos y
 * módulos utilitarios `_lib/` o `lib/`) declara su `@componentId` en el JSDoc
 * de cabecera.
 *
 * Formato válido:
 *   - `@componentId COMP-1001` para componentes del ACC.
 *   - `@componentId COMP-P-0001` para provisionales (convención F0.1).
 *
 * Excepciones (contenedores de layout · NO cuentan como COMP-XXXX del ACC):
 *   - `header/CompanyHeader.tsx`
 *   - `perfil/CompanyPerfil.tsx`
 *   - `finanzas/CompanyFinanzas.tsx` (F0.2)
 *   - `CompanyFichaF01Client.tsx`
 * Se listan explícitamente en `LAYOUT_CONTAINERS`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = join(__dirname, '..');
const COMPANY_ROOT = join(SRC_ROOT, 'components/company');
const EXTENSIONS = ['.tsx'];
const EXCLUDED_DIRS = new Set(['_lib', 'lib', 'layout', '__pycache__', 'node_modules']);
const LAYOUT_CONTAINERS = new Set<string>([
  'perfil/CompanyPerfil.tsx',
  'finanzas/CompanyFinanzas.tsx',
  'CompanyFichaF01Client.tsx',
]);
const COMP_ID_REGEX = /@componentId\s+(COMP(?:-P)?-[A-Z0-9]+)/;

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
    } else if (
      s.isFile() &&
      EXTENSIONS.some((e) => name.endsWith(e)) &&
      !name.endsWith('.test.tsx')
    ) {
      out.push(abs);
    }
  }
}

describe('R14 · Un COMP = un componente React (Sprint F0.1)', () => {
  it('cada .tsx bajo components/company/{header,perfil,...} declara @componentId', () => {
    const files: string[] = [];
    walk(COMPANY_ROOT, files);
    const offenders: Array<{ file: string; reason: string }> = [];
    for (const abs of files) {
      const rel = relative(COMPANY_ROOT, abs).replace(/\\/g, '/');
      if (LAYOUT_CONTAINERS.has(rel)) continue;
      const src = readFileSync(abs, 'utf-8');
      const match = COMP_ID_REGEX.exec(src);
      if (!match) {
        offenders.push({
          file: rel,
          reason:
            'No declara @componentId en JSDoc. Añade `@componentId COMP-XXXX` o `@componentId COMP-P-XXXX` en la cabecera del archivo.',
        });
      }
    }
    if (offenders.length > 0) {
      const list = offenders
        .map((o) => `  ${o.file}: ${o.reason}`)
        .join('\n');
      throw new Error(`R14 VIOLATION (${offenders.length}):\n${list}`);
    }
    expect(offenders).toEqual([]);
  });

  it('cada @componentId es único dentro de components/company/', () => {
    const files: string[] = [];
    walk(COMPANY_ROOT, files);
    const byId = new Map<string, string[]>();
    for (const abs of files) {
      const rel = relative(COMPANY_ROOT, abs).replace(/\\/g, '/');
      if (LAYOUT_CONTAINERS.has(rel)) continue;
      const src = readFileSync(abs, 'utf-8');
      const match = COMP_ID_REGEX.exec(src);
      if (!match) continue;
      const id = match[1];
      if (!id) continue;
      byId.set(id, [...(byId.get(id) ?? []), rel]);
    }
    const dupes = [...byId.entries()].filter(([, list]) => list.length > 1);
    if (dupes.length > 0) {
      const summary = dupes
        .map(([id, list]) => `  ${id}: ${list.join(', ')}`)
        .join('\n');
      throw new Error(`R14 VIOLATION · IDs duplicados:\n${summary}`);
    }
    expect(dupes).toEqual([]);
  });
});
