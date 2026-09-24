/**
 * Motor de resolución de permisos efectivos (sección 8.1 del requerimiento).
 *
 * Puro: no toca la base. Recibe los datos ya cargados (por
 * `permissions/load-permission-context.ts`) y devuelve el conjunto de
 * códigos de permiso que el usuario tiene realmente disponibles.
 *
 * Regla exacta de la sección 8.1 — un usuario accede a una ruta si y solo si:
 *   1. El módulo de la ruta tiene `status = 'ACTIVE'`.
 *   2. El módulo está contratado y vigente para la cuenta (`account_modules`
 *      con `enabled = 1` y fecha dentro de `validFrom`–`validTo`), o el
 *      módulo tiene `isCore = 1`.
 *   3. El permiso de la ruta está otorgado a al menos uno de los perfiles
 *      del usuario.
 *
 * "La falta de contratación prevalece sobre cualquier permiso": un perfil
 * con un permiso de un módulo no disponible no abre ese módulo. Por eso el
 * conjunto de permisos "otorgados por perfil" (paso 3) se filtra siempre
 * contra el conjunto de módulos disponibles (pasos 1+2), nunca al revés.
 */

export interface ModuleRow {
  idModule: number;
  status: 'ACTIVE' | 'BETA' | 'DEPRECATED';
  isCore: boolean;
}

export interface AccountModuleRow {
  idModule: number;
  enabled: boolean;
  /** Formato `YYYY-MM-DD`, o `null`. `validTo` nulo = sin vencimiento. */
  validFrom: string | null;
  validTo: string | null;
}

/** Un permiso otorgado a través de alguno de los perfiles del usuario. */
export interface RoleGrant {
  idModule: number;
  code: string;
}

/**
 * Condición 2 de la sección 8.1, aislada para poder probar cada rama de
 * fecha por separado. `isCore` gana siempre, incluso sin fila en
 * `account_modules` (un módulo núcleo nunca necesita contratarse).
 */
export function isModuleContracted(
  isCore: boolean,
  accountModule: AccountModuleRow | undefined,
  today: string,
): boolean {
  if (isCore) return true;
  if (!accountModule || !accountModule.enabled) return false;
  if (accountModule.validFrom && today < accountModule.validFrom) return false;
  if (accountModule.validTo && today > accountModule.validTo) return false;
  return true;
}

/** Condiciones 1 y 2 combinadas: ¿este módulo está disponible para la cuenta hoy? */
export function isModuleAvailable(
  module: ModuleRow,
  accountModule: AccountModuleRow | undefined,
  today: string,
): boolean {
  if (module.status !== 'ACTIVE') return false;
  return isModuleContracted(module.isCore, accountModule, today);
}

export function resolveEffectivePermissions(
  modules: ModuleRow[],
  accountModules: AccountModuleRow[],
  grants: RoleGrant[],
  now: Date = new Date(),
): Set<string> {
  const today = now.toISOString().slice(0, 10);
  const accountModuleByModuleId = new Map(accountModules.map((am) => [am.idModule, am]));

  const availableModuleIds = new Set(
    modules
      .filter((m) => isModuleAvailable(m, accountModuleByModuleId.get(m.idModule), today))
      .map((m) => m.idModule),
  );

  const effective = new Set<string>();
  for (const grant of grants) {
    if (availableModuleIds.has(grant.idModule)) {
      effective.add(grant.code);
    }
  }
  return effective;
}
