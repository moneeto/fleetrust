import crypto from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { config } from '../config.js';

/** RF-206: refresco rotativo, revocable, por superficie (RF-102.1). */

export function generateRefreshTokenValue(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export async function storeRefreshToken(
  pool: Pool,
  params: {
    idUser: number;
    tokenHash: string;
    userAgent: string | null;
    ip: string | null;
    modoSuplantacion?: boolean;
    idSuplantador?: number | null;
  },
): Promise<void> {
  const expiresAt = new Date(Date.now() + config.auth.refreshTokenTtlDays * 24 * 60 * 60_000);
  await pool.query(
    `INSERT INTO refresh_tokens (idUser, surface, tokenHash, modoSuplantacion, idSuplantador, expiresAt, userAgent, ip)
     VALUES (?, 'BACKOFFICE', ?, ?, ?, ?, ?, ?)`,
    [
      params.idUser,
      params.tokenHash,
      params.modoSuplantacion ? 1 : 0,
      params.idSuplantador ?? null,
      expiresAt,
      params.userAgent,
      params.ip,
    ],
  );
}

interface RefreshTokenRow extends RowDataPacket {
  idToken: number;
  idUser: number;
  expiresAt: string;
  revokedAt: string | null;
  modoSuplantacion: number;
  idSuplantador: number | null;
}

export async function findActiveRefreshToken(pool: Pool, tokenHash: string): Promise<RefreshTokenRow | null> {
  const [rows] = await pool.query<RefreshTokenRow[]>(
    `SELECT idToken, idUser, expiresAt, revokedAt, modoSuplantacion, idSuplantador FROM refresh_tokens
     WHERE tokenHash = ? AND surface = 'BACKOFFICE' AND revokedAt IS NULL AND expiresAt > NOW()
     LIMIT 1`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

/** RF-206/CA-206.1: al cerrar sesión (o rotar), el token queda revocado y reutilizarlo da 401. */
export async function revokeRefreshToken(pool: Pool, tokenHash: string, replacedByTokenHash?: string): Promise<void> {
  await pool.query<ResultSetHeader>(
    `UPDATE refresh_tokens SET revokedAt = NOW(), replacedByTokenHash = ? WHERE tokenHash = ?`,
    [replacedByTokenHash ?? null, tokenHash],
  );
}

export async function revokeAllRefreshTokens(pool: Pool, idUser: number): Promise<void> {
  await pool.query(`UPDATE refresh_tokens SET revokedAt = NOW() WHERE idUser = ? AND revokedAt IS NULL`, [idUser]);
}
