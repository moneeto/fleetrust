/**
 * Decisión de login (RF-101, RF-107, RF-201, RF-102.1), aislada de la base
 * para poder probar cada rama sin fixtures de MySQL. La orquestación real
 * (`login.service.ts`) solo carga estas filas y llama a esta función.
 */

export interface UserAuthRow {
  idUser: number;
  /** `null` = usuario de plataforma. En la superficie BACKOFFICE, siempre deniega (RF-102.1). */
  idAccount: number | null;
  passwordHash: string | null;
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  /** ISO datetime o `null`. */
  lockedUntil: string | null;
}

export interface AccountStatusRow {
  idAccount: number;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
}

export type LoginDecision =
  // Un solo motivo de rechazo hacia afuera: nunca se distingue el porqué en
  // la respuesta (CA-201.1: mismo mensaje que credencial incorrecta).
  | { outcome: 'DENY_GENERIC' }
  | { outcome: 'ALLOW'; readOnly: boolean };

export function evaluateLoginAttempt(params: {
  user: UserAuthRow | null;
  account: AccountStatusRow | null;
  passwordMatches: boolean;
  now: Date;
}): LoginDecision {
  const { user, account, passwordMatches, now } = params;

  if (!user) return { outcome: 'DENY_GENERIC' };
  // RF-102.1: la API de BackOffice solo emite tokens de usuarios con
  // idAccount no nulo. Un usuario de plataforma no puede entrar por aquí.
  if (user.idAccount === null) return { outcome: 'DENY_GENERIC' };
  if (user.status === 'INACTIVE' || user.status === 'LOCKED') return { outcome: 'DENY_GENERIC' };
  if (user.lockedUntil !== null && new Date(user.lockedUntil) > now) return { outcome: 'DENY_GENERIC' };
  if (!passwordMatches) return { outcome: 'DENY_GENERIC' };
  if (!account) return { outcome: 'DENY_GENERIC' };
  // RF-101 corregido (ver ARCHITECTURE.md sección 5): CANCELLED/EXPIRED
  // bloquean por completo; SUSPENDED permite entrar en modo lectura.
  if (account.status === 'CANCELLED' || account.status === 'EXPIRED') return { outcome: 'DENY_GENERIC' };
  if (account.status === 'SUSPENDED') return { outcome: 'ALLOW', readOnly: true };
  return { outcome: 'ALLOW', readOnly: false }; // TRIAL o ACTIVE
}

/** RF-201: al quinto intento fallido consecutivo, la cuenta queda bloqueada. */
export function shouldLockAfterFailedAttempt(failedLoginAttemptsBeforeThisOne: number, maxAttempts: number): boolean {
  return failedLoginAttemptsBeforeThisOne + 1 >= maxAttempts;
}

export function computeLockedUntil(now: Date, lockoutMinutes: number): Date {
  return new Date(now.getTime() + lockoutMinutes * 60_000);
}
