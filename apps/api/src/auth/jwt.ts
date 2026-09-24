import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * El access token solo lleva identidad (RF-102, RF-102.1), nunca permisos:
 * los permisos se resuelven de nuevo en cada request contra la base (ver
 * `auth/session.middleware.ts`), así que un cambio de perfil o de
 * contratación se refleja de inmediato, sin esperar a que el token expire
 * ni necesitar invalidar una caché (RF-309).
 */
export interface AccessTokenPayload {
  idUser: number;
  idAccount: number;
  surface: 'BACKOFFICE';
  modoSuplantacion?: boolean;
  idSuplantador?: number;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.accessTokenTtlSeconds,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.auth.jwtSecret);
  const record = decoded as Record<string, unknown>;
  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof record.idUser !== 'number' ||
    typeof record.idAccount !== 'number' ||
    record.surface !== 'BACKOFFICE'
  ) {
    throw new Error('Payload de access token inválido');
  }
  const modoSuplantacion = record.modoSuplantacion === true;
  if (modoSuplantacion && typeof record.idSuplantador !== 'number') {
    throw new Error('Payload de access token inválido');
  }
  return {
    idUser: record.idUser,
    idAccount: record.idAccount,
    surface: 'BACKOFFICE',
    modoSuplantacion,
    idSuplantador: modoSuplantacion ? (record.idSuplantador as number) : undefined,
  };
}
