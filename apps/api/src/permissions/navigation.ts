import { isModuleAvailable, type AccountModuleRow, type ModuleRow } from './resolve-effective-permissions.js';

/**
 * `GET /api/me/navigation` (RF-306): el árbol de menú ya filtrado. El front
 * no decide qué mostrar, solo dibuja lo que esta función devuelve.
 */

export interface ModuleForMenu extends ModuleRow {
  code: string;
  i18nKey: string;
  icon: string | null;
  sortOrder: number;
}

export interface RouteForMenu {
  idModule: number;
  path: string;
  /** `null` solo en rutas explícitamente públicas o de uso general (5.3). */
  permissionCode: string | null;
  sortOrder: number;
  i18nKey: string | null;
}

export interface NavigationItem {
  moduleCode: string;
  moduleI18nKey: string;
  icon: string | null;
  path: string;
  i18nKey: string;
}

export function buildNavigation(
  modules: ModuleForMenu[],
  accountModules: AccountModuleRow[],
  routes: RouteForMenu[],
  effectivePermissions: Set<string>,
  now: Date = new Date(),
): NavigationItem[] {
  const today = now.toISOString().slice(0, 10);
  const moduleById = new Map(modules.map((m) => [m.idModule, m]));
  const accountModuleByModuleId = new Map(accountModules.map((am) => [am.idModule, am]));

  const items = routes
    .filter((route) => {
      const module = moduleById.get(route.idModule);
      if (!module) return false;
      if (!isModuleAvailable(module, accountModuleByModuleId.get(route.idModule), today)) return false;
      // Condición 3 de 8.1: si la ruta exige permiso, tiene que estar en el
      // efectivo. Si no exige (uso general/pública), alcanza con el módulo.
      if (route.permissionCode !== null && !effectivePermissions.has(route.permissionCode)) return false;
      return true;
    })
    .map((route) => {
      const module = moduleById.get(route.idModule)!;
      return {
        moduleCode: module.code,
        moduleI18nKey: module.i18nKey,
        icon: module.icon,
        path: route.path,
        i18nKey: route.i18nKey ?? module.i18nKey,
        _moduleSortOrder: module.sortOrder,
        _routeSortOrder: route.sortOrder,
      };
    })
    .sort((a, b) => a._moduleSortOrder - b._moduleSortOrder || a._routeSortOrder - b._routeSortOrder)
    .map(({ _moduleSortOrder, _routeSortOrder, ...item }) => item);

  return items;
}
