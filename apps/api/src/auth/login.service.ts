import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { config } from '../config.js';
import { writeAuditLog } from '../audit/audit.repository.js';
import { DECOY_HASH, verifyPassword } from './password.js';
import {
  computeLockedUntil,
  evaluateLoginAttempt,
  shouldLockAfterFailedAttempt,
  type AccountStatusRow,
  type UserAuthRow,
} from './evaluate-login-attempt.js';
import { expireTrialIfDue } from './trial.js';
import { signAccessToken } from './jwt.js';
import { generateRefreshTokenValue, hashRefreshToken, storeRefreshToken } from './refresh-tokens.repository.js';

export type LoginServiceResult =
  | { ok: false }
  | {
      ok: true;
      accessToken: string;
      refreshToken: string;
      idUser: number;
      idAccount: number;
      readOnly: boolean;
    };

interface UserRow extends RowDataPacket {
  idUser: number;
  idAccount: number | null;
  passwordHash: string | null;
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  lockedUntil: string | null;
  failedLoginAttempts: number;
}

export async function login(
  pool: Pool,
  params: { email: string; password: string; ip: string | null; userAgent: string | null },
): Promise<LoginServiceResult> {
  const now = new Date();

  const [userRows] = await pool.query<UserRow[]>(
    `SELECT idUser, idAccount, passwordHash, status, lockedUntil, failedLoginAttempts
     FROM users WHERE email = ? LIMIT 1`,
    [params.email],
  );
  const userRow = userRows[0] ?? null;

  // CA-210.2: se compara siempre contra algo (real o señuelo), para que el
  // tiempo de respuesta no delate si el email existe.
  const passwordMatches = await verifyPassword(params.password, userRow?.passwordHash ?? DECOY_HASH);

  let account: AccountStatusRow | null = null;
  if (userRow?.idAccount != null) {
    const status = await expireTrialIfDue(pool, userRow.idAccount);
    account = status ? { idAccount: userRow.idAccount, status } : null;
  }

  const user: UserAuthRow | null = userRow && {
    idUser: userRow.idUser,
    idAccount: userRow.idAccount,
    passwordHash: userRow.passwordHash,
    status: userRow.status,
    lockedUntil: userRow.lockedUntil,
  };
  const accountStatus: AccountStatusRow | null = account && { idAccount: account.idAccount, status: account.status };

  const decision = evaluateLoginAttempt({ user, account: accountStatus, passwordMatches, now });

  if (decision.outcome === 'DENY_GENERIC') {
    if (userRow) await registerFailedAttempt(pool, userRow, now, params.ip, params.userAgent);
    return { ok: false };
  }

  // ALLOW: éxito. Se resetea el contador de intentos fallidos.
  await pool.query<ResultSetHeader>(
    `UPDATE users SET failedLoginAttempts = 0, lockedUntil = NULL, lastLoginAt = ? WHERE idUser = ?`,
    [now, userRow!.idUser],
  );

  const accessToken = signAccessToken({
    idUser: userRow!.idUser,
    idAccount: userRow!.idAccount!,
    surface: 'BACKOFFICE',
  });
  const refreshToken = generateRefreshTokenValue();
  await storeRefreshToken(pool, {
    idUser: userRow!.idUser,
    tokenHash: hashRefreshToken(refreshToken),
    userAgent: params.userAgent,
    ip: params.ip,
  });

  await writeAuditLog(pool, {
    idAccount: userRow!.idAccount,
    idUser: userRow!.idUser,
    action: 'auth.login',
    entity: 'users',
    idEntity: String(userRow!.idUser),
    ip: params.ip,
    userAgent: params.userAgent,
  });

  return {
    ok: true,
    accessToken,
    refreshToken,
    idUser: userRow!.idUser,
    idAccount: userRow!.idAccount!,
    readOnly: decision.readOnly,
  };
}

async function registerFailedAttempt(
  pool: Pool,
  userRow: UserRow,
  now: Date,
  ip: string | null,
  userAgent: string | null,
): Promise<void> {
  const willLock = shouldLockAfterFailedAttempt(userRow.failedLoginAttempts, config.auth.maxFailedLoginAttempts);
  const lockedUntil = willLock ? computeLockedUntil(now, config.auth.lockoutMinutes) : null;

  await pool.query<ResultSetHeader>(
    `UPDATE users SET failedLoginAttempts = failedLoginAttempts + 1, lockedUntil = COALESCE(?, lockedUntil)
     WHERE idUser = ?`,
    [lockedUntil, userRow.idUser],
  );

  await writeAuditLog(pool, {
    idAccount: userRow.idAccount,
    idUser: userRow.idUser,
    action: willLock ? 'auth.loginLocked' : 'auth.loginFailed',
    entity: 'users',
    idEntity: String(userRow.idUser),
    afterJson: willLock ? { lockedUntil } : undefined,
    ip,
    userAgent,
  });
}
