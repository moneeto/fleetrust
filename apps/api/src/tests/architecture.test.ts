import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, '..');

/**
 * RF-104: "regla de linting o test de arquitectura que falle la compilación
 * si aparece una consulta de negocio que no pase por el repositorio base."
 *
 * `repositories/` es la única capa que puede armar SQL de negocio (RF-103).
 * Se permite además en: `auth/` (login/sesión resuelven usuario ANTES de
 * tener contexto de cuenta — no hay `idAccount` todavía para filtrar) y
 * `permissions/`, `audit/` (tablas de plataforma, sección 5.3: "no llevan
 * `idAccount` como filtro de aislamiento; o son globales, o `idAccount` es
 * su clave de pertenencia" — no son datos de negocio de un cliente).
 * Todo lo demás (sobre todo `routes/`, donde en F3+ va a vivir la lógica de
 * Fleet/Bookings/etc.) tiene prohibido tocar `pool` directamente.
 */
const ALLOWED_RAW_QUERY_DIRS = ['repositories', 'auth', 'permissions', 'audit', 'db.ts', 'db'];

describe('Regla de arquitectura — aislamiento (RF-104)', () => {
  it('ningún archivo fuera de las capas permitidas llama a pool.query/pool.execute', () => {
    const files = globSync(`${SRC_ROOT}/**/*.ts`, {
      exclude: (p: string) => p.includes('node_modules') || p.endsWith('.test.ts'),
    });

    const offenders: string[] = [];

    for (const file of files) {
      const relative = path.relative(SRC_ROOT, file);
      const isAllowed = ALLOWED_RAW_QUERY_DIRS.some(
        (allowed) => relative === allowed || relative.startsWith(`${allowed}/`) || relative.startsWith(`${allowed}\\`),
      );
      if (isAllowed) continue;

      const content = readFileSync(file, 'utf8');
      if (/\bpool\.(query|execute)\s*\(/.test(content)) {
        offenders.push(relative);
      }
    }

    expect(offenders, `Archivos con SQL de negocio fuera de las capas permitidas: ${offenders.join(', ')}`).toEqual([]);
  });
});
