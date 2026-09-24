import { Router, type RequestHandler } from 'express';
import { requirePermission } from '../auth/require-permission.middleware.js';

/**
 * RF-307/CA-307.1: "una ruta de API sin permiso asignado y sin marca
 * explícita de pública debe fallar". En vez de comprobarlo con introspección
 * en runtime, se lo hace imposible en tiempo de compilación: `auth` es una
 * unión discriminada, así que TypeScript no permite registrar una ruta sin
 * elegir `{ permission }` o `{ public: true }`.
 *
 * Cada registro además queda en `getRouteManifest()`, que
 * `tests/api-routes-have-permission.test.ts` cruza contra `module_routes`
 * de la base para detectar catálogo y código desincronizados.
 */

export type RouteAuth = { permission: string } | { public: true };

export interface RouteManifestEntry {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  permission: string | null;
}

const manifest: RouteManifestEntry[] = [];

export function getRouteManifest(): RouteManifestEntry[] {
  return manifest;
}

/** Solo para tests: limpia el manifiesto entre suites que reconstruyen la app. */
export function resetRouteManifestForTests(): void {
  manifest.length = 0;
}

export function createGuardedRouter() {
  const router = Router();

  const define =
    (method: 'get' | 'post' | 'patch' | 'put' | 'delete') =>
    (path: string, auth: RouteAuth, ...handlers: RequestHandler[]) => {
      manifest.push({
        method: method.toUpperCase() as RouteManifestEntry['method'],
        path,
        permission: 'permission' in auth ? auth.permission : null,
      });

      const guards: RequestHandler[] = 'permission' in auth ? [requirePermission(auth.permission)] : [];
      router[method](path, ...guards, ...handlers);
      return router;
    };

  return {
    get: define('get'),
    post: define('post'),
    patch: define('patch'),
    put: define('put'),
    delete: define('delete'),
    raw: router,
  };
}
