import crypto from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { writeAuditLog } from '../audit/audit.repository.js';
import { hashPassword, verifyPassword } from './password.js';
import { signAccessToken } from './jwt.js';
import { generateRefreshTokenValue, hashRefreshToken, revokeAllRefreshTokens, storeRefreshToken } from './refresh-tokens.repository.js';

function newToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export async function acceptInvitation(pool: Pool, token: string, password: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT i.idInvitation, i.idUser FROM invitations i
     JOIN users u ON u.idUser = i.idUser
     WHERE i.token = ? AND i.acceptedAt IS NULL AND i.expiresAt > NOW() AND u.status = 'INVITED'
     LIMIT 1`,
    [token],
  );
  const row = rows[0];
  if (!row) return false;
  const passwordHash = await hashPassword(password);
  await pool.query(
    `UPDATE users SET passwordHash = ?, status = 'ACTIVE', emailVerifiedAt = NOW(), mustChangePassword = 0 WHERE idUser = ?`,
    [passwordHash, row.idUser],
  );
  await pool.query('UPDATE invitations SET acceptedAt = NOW() WHERE idInvitation = ?', [row.idInvitation]);
  return true;
}

export async function requestPasswordReset(pool: Pool, email: string): Promise<{ email: string; token: string } | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT idUser, email, idAccount FROM users WHERE email = ? AND idAccount IS NOT NULL LIMIT 1`,
    [email],
  );
  const user = rows[0];
  if (!user) return null;
  const token = newToken();
  await pool.query(`INSERT INTO password_reset_tokens (idUser, token, expiresAt) VALUES (?, ?, ?)`, [
    user.idUser,
    token,
    new Date(Date.now() + 30 * 60_000),
  ]);
  return { email: user.email as string, token };
}

export async function resetPassword(pool: Pool, token: string, password: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT idToken, idUser FROM password_reset_tokens WHERE token = ? AND usedAt IS NULL AND expiresAt > NOW() LIMIT 1`,
    [token],
  );
  const row = rows[0];
  if (!row) return false;
  await pool.query(`UPDATE users SET passwordHash = ?, mustChangePassword = 0, status = IF(status = 'INVITED', 'ACTIVE', status) WHERE idUser = ?`, [
    await hashPassword(password),
    row.idUser,
  ]);
  await pool.query('UPDATE password_reset_tokens SET usedAt = NOW() WHERE idToken = ?', [row.idToken]);
  await revokeAllRefreshTokens(pool, row.idUser as number);
  return true;
}

export async function verifyEmail(pool: Pool, token: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT t.idToken, t.idUser, t.email FROM email_verification_tokens t
     JOIN users u ON u.idUser = t.idUser AND u.email = t.email
     WHERE t.token = ? AND t.usedAt IS NULL AND t.expiresAt > NOW() LIMIT 1`,
    [token],
  );
  const row = rows[0];
  if (!row) return false;
  await pool.query('UPDATE users SET emailVerifiedAt = NOW() WHERE idUser = ?', [row.idUser]);
  await pool.query('UPDATE email_verification_tokens SET usedAt = NOW() WHERE idToken = ?', [row.idToken]);
  return true;
}

export async function changeOwnPassword(
  pool: Pool,
  params: { idUser: number; currentPassword: string; nextPassword: string },
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT passwordHash FROM users WHERE idUser = ? LIMIT 1',
    [params.idUser],
  );
  const hash = rows[0]?.passwordHash as string | null;
  if (!hash || !(await verifyPassword(params.currentPassword, hash))) return false;
  await pool.query('UPDATE users SET passwordHash = ?, mustChangePassword = 0 WHERE idUser = ?', [
    await hashPassword(params.nextPassword),
    params.idUser,
  ]);
  return true;
}

export async function openImpersonationSession(
  pool: Pool,
  params: { code: string; ip: string | null; userAgent: string | null },
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const codeHash = crypto.createHash('sha256').update(params.code).digest('hex');
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT idCode, idUser, idSuplantador FROM impersonation_codes
     WHERE codeHash = ? AND usedAt IS NULL AND expiresAt > NOW() LIMIT 1`,
    [codeHash],
  );
  const code = rows[0];
  if (!code) return null;
  await pool.query('UPDATE impersonation_codes SET usedAt = NOW() WHERE idCode = ? AND usedAt IS NULL', [code.idCode]);

  const [users] = await pool.query<RowDataPacket[]>(
    'SELECT idUser, idAccount, status FROM users WHERE idUser = ? LIMIT 1',
    [code.idUser],
  );
  const user = users[0];
  if (!user || user.idAccount === null || user.status === 'INACTIVE' || user.status === 'LOCKED') return null;

  const refreshToken = generateRefreshTokenValue();
  await storeRefreshToken(pool, {
    idUser: user.idUser as number,
    tokenHash: hashRefreshToken(refreshToken),
    userAgent: params.userAgent,
    ip: params.ip,
    modoSuplantacion: true,
    idSuplantador: code.idSuplantador as number,
  });
  const accessToken = signAccessToken({
    idUser: user.idUser as number,
    idAccount: user.idAccount as number,
    surface: 'BACKOFFICE',
    modoSuplantacion: true,
    idSuplantador: code.idSuplantador as number,
  });
  await writeAuditLog(pool, {
    idAccount: user.idAccount as number,
    idUser: user.idUser as number,
    idSuplantador: code.idSuplantador as number,
    action: 'impersonation.open',
    entity: 'users',
    idEntity: String(user.idUser),
    ip: params.ip,
    userAgent: params.userAgent,
  });
  return { accessToken, refreshToken };
}
