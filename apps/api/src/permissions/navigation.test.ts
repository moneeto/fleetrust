import { describe, expect, it } from 'vitest';
import { buildNavigation, type ModuleForMenu, type RouteForMenu } from './navigation.js';

const TODAY = new Date('2026-09-22');

// Módulos ficticios solo para probar la función pura; no representan datos
// sembrados en ninguna base real.
const coreModule: ModuleForMenu = {
  idModule: 1,
  status: 'ACTIVE',
  isCore: true,
  code: 'fleet',
  i18nKey: 'modules.fleet.label',
  icon: 'truck',
  sortOrder: 90,
};

const bookingsModule: ModuleForMenu = {
  idModule: 2,
  status: 'ACTIVE',
  isCore: true,
  code: 'bookings',
  i18nKey: 'modules.bookings.label',
  icon: 'calendar-check',
  sortOrder: 10,
};

describe('buildNavigation', () => {
  it('una ruta sin permiso otorgado no aparece en el menú', () => {
    const routes: RouteForMenu[] = [
      { idModule: 1, path: '/fleet', permissionCode: 'fleet.list', sortOrder: 0, i18nKey: null },
    ];
    const items = buildNavigation([coreModule], [], routes, new Set(), TODAY);
    expect(items).toHaveLength(0);
  });

  it('una ruta con permiso otorgado aparece', () => {
    const routes: RouteForMenu[] = [
      { idModule: 1, path: '/fleet', permissionCode: 'fleet.list', sortOrder: 0, i18nKey: null },
    ];
    const items = buildNavigation([coreModule], [], routes, new Set(['fleet.list']), TODAY);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ moduleCode: 'fleet', path: '/fleet' });
  });

  it('una ruta pública (permissionCode null) aparece con solo tener el módulo disponible', () => {
    const routes: RouteForMenu[] = [
      { idModule: 1, path: '/publica', permissionCode: null, sortOrder: 0, i18nKey: null },
    ];
    const items = buildNavigation([coreModule], [], routes, new Set(), TODAY);
    expect(items).toHaveLength(1);
  });

  it('una ruta de un módulo no disponible no aparece aunque el permiso esté otorgado', () => {
    const nonCoreModule: ModuleForMenu = { ...bookingsModule, isCore: false };
    const routes: RouteForMenu[] = [
      { idModule: 2, path: '/bookings', permissionCode: 'bookings.list', sortOrder: 0, i18nKey: null },
    ];
    const items = buildNavigation([nonCoreModule], [], routes, new Set(['bookings.list']), TODAY);
    expect(items).toHaveLength(0);
  });

  it('CA-306.1: dos usuarios con distintos permisos efectivos reciben árboles distintos', () => {
    const routes: RouteForMenu[] = [
      { idModule: 1, path: '/fleet', permissionCode: 'fleet.list', sortOrder: 0, i18nKey: null },
      { idModule: 2, path: '/bookings', permissionCode: 'bookings.list', sortOrder: 0, i18nKey: null },
    ];
    const modules = [coreModule, bookingsModule];

    const owner = buildNavigation(modules, [], routes, new Set(['fleet.list', 'bookings.list']), TODAY);
    const viewer = buildNavigation(modules, [], routes, new Set(['bookings.list']), TODAY);

    expect(owner.map((i) => i.path)).toEqual(['/bookings', '/fleet']);
    expect(viewer.map((i) => i.path)).toEqual(['/bookings']);
    expect(owner).not.toEqual(viewer);
  });

  it('el orden es por sortOrder de módulo y luego de ruta', () => {
    const routes: RouteForMenu[] = [
      { idModule: 1, path: '/fleet', permissionCode: null, sortOrder: 5, i18nKey: null },
      { idModule: 2, path: '/bookings/2', permissionCode: null, sortOrder: 2, i18nKey: null },
      { idModule: 2, path: '/bookings/1', permissionCode: null, sortOrder: 1, i18nKey: null },
    ];
    const items = buildNavigation([coreModule, bookingsModule], [], routes, new Set(), TODAY);
    expect(items.map((i) => i.path)).toEqual(['/bookings/1', '/bookings/2', '/fleet']);
  });
});
