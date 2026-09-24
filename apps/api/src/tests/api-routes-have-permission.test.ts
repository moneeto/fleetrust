import { describe, expect, it } from 'vitest';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db.js';
import { createApp } from '../app.js';
import { getRouteManifest, resetRouteManifestForTests } from '../routes/guarded-router.js';

/**
 * CA-307.1: "Existe un test que recorre todas las rutas de API registradas
 * y falla si alguna carece de permiso asociado sin estar marcada
 * explícitamente como pública."
 *
 * La primera mitad (ninguna ruta sin `permission` ni `public: true`) ya es
 * imposible de violar en tiempo de compilación gracias al tipo de
 * `RouteAuth` en `guarded-router.ts`. Este test agrega lo que el tipo NO
 * puede garantizar: que cada código de permiso declarado en el código
 * exista de verdad en el catálogo (`permissions`) sembrado en la base —
 * si alguien tipea mal un código, esto lo detecta.
 */
describe('CA-307.1 — catálogo de rutas de API vs. permisos declarados en código', () => {
  it('toda ruta de API con permiso declarado en código corresponde a un permiso real', async () => {
    resetRouteManifestForTests();
    createApp(pool, { send: async () => undefined }); // registrar rutas puebla el manifiesto

    const manifest = getRouteManifest().filter((r) => r.path.startsWith('/api/'));
    expect(manifest.length).toBeGreaterThan(0);

    const withoutAuthDecision = manifest.filter((r) => r.permission === null && !isKnownPublicAuthRoute(r.path));
    // Rutas de auth (login/logout/refresh) son la única categoría legítima
    // de "pública" en F1; cualquier otra sin permiso es sospechosa.
    expect(withoutAuthDecision.map((r) => r.path)).toEqual([]);

    const permissionCodes = manifest.map((r) => r.permission).filter((code): code is string => code !== null);

    interface Row extends RowDataPacket {
      code: string;
    }
    const [rows] = await pool.query<Row[]>('SELECT code FROM permissions');
    const realCodes = new Set(rows.map((r) => r.code));

    const unknown = permissionCodes.filter((code) => !realCodes.has(code));
    expect(unknown, `Permisos declarados en código que no existen en la tabla permissions: ${unknown.join(', ')}`).toEqual([]);
  });
});

function isKnownPublicAuthRoute(path: string): boolean {
  return path.startsWith('/api/auth/') || path === '/api/me' || path === '/api/me/navigation';
}
