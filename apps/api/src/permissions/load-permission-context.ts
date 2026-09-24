import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { AccountModuleRow, ModuleRow, RoleGrant } from './resolve-effective-permissions.js';
import type { ModuleForMenu, RouteForMenu } from './navigation.js';

/**
 * Carga desde la base los datos que necesita el motor puro de permisos.
 *
 * `modules`, `permissions`, `roles`, `role_permissions`, `user_roles` y
 * `account_modules` son tablas de plataforma (sección 5.3 del
 * requerimiento): "no llevan `idAccount` como filtro de aislamiento; o son
 * globales, o `idAccount` es su clave de pertenencia". No son datos de
 * negocio de un cliente (eso son Fleet, Bookings, etc., que arrancan en
 * F3), así que consultarlas directamente acá no viola RF-103/AD6 — la regla
 * de arquitectura de `tests/architecture.test.ts` documenta exactamente
 * esta distinción.
 */
export async function loadModules(pool: Pool): Promise<ModuleRow[]> {
  interface Row extends RowDataPacket {
    idModule: number;
    status: 'ACTIVE' | 'BETA' | 'DEPRECATED';
    isCore: number;
  }
  const [rows] = await pool.query<Row[]>('SELECT idModule, status, isCore FROM modules');
  return rows.map((r) => ({ idModule: r.idModule, status: r.status, isCore: Boolean(r.isCore) }));
}

export async function loadAccountModules(pool: Pool, idAccount: number): Promise<AccountModuleRow[]> {
  interface Row extends RowDataPacket {
    idModule: number;
    enabled: number;
    validFrom: string | null;
    validTo: string | null;
  }
  const [rows] = await pool.query<Row[]>(
    'SELECT idModule, enabled, validFrom, validTo FROM account_modules WHERE idAccount = ?',
    [idAccount],
  );
  return rows.map((r) => ({
    idModule: r.idModule,
    enabled: Boolean(r.enabled),
    validFrom: r.validFrom,
    validTo: r.validTo,
  }));
}

/** Unión de los permisos otorgados por TODOS los perfiles del usuario (RF-305). */
export async function loadRoleGrants(pool: Pool, idUser: number): Promise<RoleGrant[]> {
  interface Row extends RowDataPacket {
    idModule: number;
    code: string;
  }
  const [rows] = await pool.query<Row[]>(
    `SELECT DISTINCT p.idModule AS idModule, p.code AS code
     FROM user_roles ur
     JOIN role_permissions rp ON rp.idRole = ur.idRole
     JOIN permissions p ON p.idPermission = rp.idPermission
     WHERE ur.idUser = ?`,
    [idUser],
  );
  return rows.map((r) => ({ idModule: r.idModule, code: r.code }));
}

export async function loadModulesForMenu(pool: Pool): Promise<ModuleForMenu[]> {
  interface Row extends RowDataPacket {
    idModule: number;
    status: 'ACTIVE' | 'BETA' | 'DEPRECATED';
    isCore: number;
    code: string;
    i18nKey: string;
    icon: string | null;
    sortOrder: number;
  }
  const [rows] = await pool.query<Row[]>(
    'SELECT idModule, status, isCore, code, i18nKey, icon, sortOrder FROM modules',
  );
  return rows.map((r) => ({
    idModule: r.idModule,
    status: r.status,
    isCore: Boolean(r.isCore),
    code: r.code,
    i18nKey: r.i18nKey,
    icon: r.icon,
    sortOrder: r.sortOrder,
  }));
}

/** RF-306: solo rutas de UI marcadas para aparecer en el menú. */
export async function loadMenuRoutes(pool: Pool): Promise<RouteForMenu[]> {
  interface Row extends RowDataPacket {
    idModule: number;
    path: string;
    permissionCode: string | null;
    sortOrder: number;
    i18nKey: string | null;
  }
  const [rows] = await pool.query<Row[]>(
    `SELECT mr.idModule AS idModule, mr.path AS path, p.code AS permissionCode,
            mr.sortOrder AS sortOrder, mr.i18nKey AS i18nKey
     FROM module_routes mr
     LEFT JOIN permissions p ON p.idPermission = mr.idPermission
     WHERE mr.routeType = 'UI' AND mr.showInMenu = 1`,
  );
  return rows.map((r) => ({
    idModule: r.idModule,
    path: r.path,
    permissionCode: r.permissionCode,
    sortOrder: r.sortOrder,
    i18nKey: r.i18nKey,
  }));
}
