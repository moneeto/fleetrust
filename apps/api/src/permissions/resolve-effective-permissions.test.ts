import { describe, expect, it } from 'vitest';
import {
  isModuleAvailable,
  isModuleContracted,
  resolveEffectivePermissions,
  type AccountModuleRow,
  type ModuleRow,
} from './resolve-effective-permissions.js';

const TODAY = '2026-09-22';

describe('isModuleContracted', () => {
  it('un módulo core está disponible aunque no tenga fila en account_modules', () => {
    expect(isModuleContracted(true, undefined, TODAY)).toBe(true);
  });

  it('un módulo core está disponible aunque su fila esté deshabilitada', () => {
    const am: AccountModuleRow = { idModule: 1, enabled: false, validFrom: null, validTo: null };
    expect(isModuleContracted(true, am, TODAY)).toBe(true);
  });

  it('un módulo no core sin fila en account_modules no está disponible', () => {
    expect(isModuleContracted(false, undefined, TODAY)).toBe(false);
  });

  it('un módulo no core deshabilitado no está disponible', () => {
    const am: AccountModuleRow = { idModule: 1, enabled: false, validFrom: null, validTo: null };
    expect(isModuleContracted(false, am, TODAY)).toBe(false);
  });

  it('habilitado sin fechas (permanente) está disponible', () => {
    const am: AccountModuleRow = { idModule: 1, enabled: true, validFrom: null, validTo: null };
    expect(isModuleContracted(false, am, TODAY)).toBe(true);
  });

  it('habilitado con validFrom futuro todavía no está disponible', () => {
    const am: AccountModuleRow = { idModule: 1, enabled: true, validFrom: '2026-10-01', validTo: null };
    expect(isModuleContracted(false, am, TODAY)).toBe(false);
  });

  it('habilitado con validFrom de hoy ya está disponible (inclusive)', () => {
    const am: AccountModuleRow = { idModule: 1, enabled: true, validFrom: TODAY, validTo: null };
    expect(isModuleContracted(false, am, TODAY)).toBe(true);
  });

  it('habilitado con validTo pasado ya no está disponible', () => {
    const am: AccountModuleRow = { idModule: 1, enabled: true, validFrom: null, validTo: '2026-09-01' };
    expect(isModuleContracted(false, am, TODAY)).toBe(false);
  });

  it('habilitado con validTo de hoy todavía está disponible (inclusive)', () => {
    const am: AccountModuleRow = { idModule: 1, enabled: true, validFrom: null, validTo: TODAY };
    expect(isModuleContracted(false, am, TODAY)).toBe(true);
  });

  it('habilitado dentro del rango validFrom–validTo está disponible', () => {
    const am: AccountModuleRow = {
      idModule: 1,
      enabled: true,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
    };
    expect(isModuleContracted(false, am, TODAY)).toBe(true);
  });
});

describe('isModuleAvailable', () => {
  it('un módulo con status distinto de ACTIVE nunca está disponible, ni siendo core', () => {
    const module: ModuleRow = { idModule: 1, status: 'BETA', isCore: true };
    expect(isModuleAvailable(module, undefined, TODAY)).toBe(false);
  });

  it('un módulo DEPRECATED no está disponible aunque esté contratado', () => {
    const module: ModuleRow = { idModule: 1, status: 'DEPRECATED', isCore: false };
    const am: AccountModuleRow = { idModule: 1, enabled: true, validFrom: null, validTo: null };
    expect(isModuleAvailable(module, am, TODAY)).toBe(false);
  });

  it('un módulo ACTIVE y core está disponible sin importar account_modules', () => {
    const module: ModuleRow = { idModule: 1, status: 'ACTIVE', isCore: true };
    expect(isModuleAvailable(module, undefined, TODAY)).toBe(true);
  });

  it('un módulo ACTIVE, no core y contratado está disponible', () => {
    const module: ModuleRow = { idModule: 1, status: 'ACTIVE', isCore: false };
    const am: AccountModuleRow = { idModule: 1, enabled: true, validFrom: null, validTo: null };
    expect(isModuleAvailable(module, am, TODAY)).toBe(true);
  });

  it('un módulo ACTIVE, no core y no contratado no está disponible', () => {
    const module: ModuleRow = { idModule: 1, status: 'ACTIVE', isCore: false };
    expect(isModuleAvailable(module, undefined, TODAY)).toBe(false);
  });
});

describe('resolveEffectivePermissions', () => {
  it('la falta de contratación prevalece sobre el permiso otorgado por el perfil', () => {
    const modules: ModuleRow[] = [{ idModule: 10, status: 'ACTIVE', isCore: false }];
    const accountModules: AccountModuleRow[] = []; // no contratado
    const grants = [{ idModule: 10, code: 'bookings.list' }];

    const effective = resolveEffectivePermissions(modules, accountModules, grants, new Date(TODAY));
    expect(effective.has('bookings.list')).toBe(false);
  });

  it('un permiso de un módulo core siempre es efectivo si el perfil lo otorga', () => {
    const modules: ModuleRow[] = [{ idModule: 1, status: 'ACTIVE', isCore: true }];
    const grants = [{ idModule: 1, code: 'calendar.view' }];

    const effective = resolveEffectivePermissions(modules, [], grants, new Date(TODAY));
    expect(effective.has('calendar.view')).toBe(true);
  });

  it('un permiso no otorgado por ningún perfil nunca aparece, aunque el módulo esté disponible', () => {
    const modules: ModuleRow[] = [{ idModule: 1, status: 'ACTIVE', isCore: true }];
    const effective = resolveEffectivePermissions(modules, [], [], new Date(TODAY));
    expect(effective.size).toBe(0);
  });

  it('el permiso efectivo es la unión de lo otorgado por varios perfiles (CA-305.1)', () => {
    const modules: ModuleRow[] = [{ idModule: 1, status: 'ACTIVE', isCore: true }];
    // Dos roles distintos otorgan permisos distintos del mismo módulo core:
    // en la práctica esto llega ya "aplanado" desde el loader, pero acá se
    // simula representando cada grant por separado, como si viniera de dos
    // filas de role_permissions de perfiles distintos.
    const grants = [
      { idModule: 1, code: 'bookings.list' },
      { idModule: 1, code: 'bookings.cancel' },
    ];
    const effective = resolveEffectivePermissions(modules, [], grants, new Date(TODAY));
    expect(effective).toEqual(new Set(['bookings.list', 'bookings.cancel']));
  });

  it('grants duplicados (dos perfiles con el mismo permiso) no rompen nada', () => {
    const modules: ModuleRow[] = [{ idModule: 1, status: 'ACTIVE', isCore: true }];
    const grants = [
      { idModule: 1, code: 'bookings.list' },
      { idModule: 1, code: 'bookings.list' },
    ];
    const effective = resolveEffectivePermissions(modules, [], grants, new Date(TODAY));
    expect(effective).toEqual(new Set(['bookings.list']));
  });

  it('módulos distintos se resuelven de forma independiente', () => {
    const modules: ModuleRow[] = [
      { idModule: 1, status: 'ACTIVE', isCore: true },
      { idModule: 2, status: 'ACTIVE', isCore: false },
    ];
    const accountModules: AccountModuleRow[] = [
      { idModule: 2, enabled: false, validFrom: null, validTo: null },
    ];
    const grants = [
      { idModule: 1, code: 'calendar.view' },
      { idModule: 2, code: 'addons.manage' },
    ];
    const effective = resolveEffectivePermissions(modules, accountModules, grants, new Date(TODAY));
    expect(effective.has('calendar.view')).toBe(true);
    expect(effective.has('addons.manage')).toBe(false);
  });
});
