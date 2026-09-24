import type { RequestHandler } from 'express';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { verifyAccessToken } from './jwt.js';
import { expireTrialIfDue } from './trial.js';
import { loadAccountModules, loadModules, loadRoleGrants } from '../permissions/load-permission-context.js';
import { resolveEffectivePermissions } from '../permissions/resolve-effective-permissions.js';

interface SessionUserRow extends RowDataPacket {
  idUser: number;
  idAccount: number | null;
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  mustChangePassword: number;
}

/**
 * Resuelve el contexto de request en CADA petición, sin caché (RF-309): si
 * a alguien le cambiaron el perfil, le deshabilitaron un módulo o
 * desactivaron el usuario, el efecto es inmediato, no "dentro del minuto".
 * El costo es una consulta extra por request; aceptable en esta escala.
 */
export function createRequireSession(pool: Pool): RequestHandler {
  return async (req, res, next) => {
    const token = req.cookies?.fleetrust_access as string | undefined;
    if (!token) {
      res.status(401).json({ code: 'auth.required', message: 'No autenticado' });
      return;
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      res.status(401).json({ code: 'auth.invalidToken', message: 'Sesión inválida' });
      return;
    }

    // CA-102.3: un token de otra superficie nunca es válido acá.
    if (payload.surface !== 'BACKOFFICE') {
      res.status(401).json({ code: 'auth.wrongSurface', message: 'Sesión inválida' });
      return;
    }

    try {
      const [userRows] = await pool.query<SessionUserRow[]>(
        'SELECT idUser, idAccount, status, mustChangePassword FROM users WHERE idUser = ? LIMIT 1',
        [payload.idUser],
      );
      const user = userRows[0];
      if (!user || user.idAccount === null || user.status === 'INACTIVE' || user.status === 'LOCKED') {
        res.status(401).json({ code: 'auth.invalidSession', message: 'Sesión inválida' });
        return;
      }

      const accountStatus = await expireTrialIfDue(pool, user.idAccount);
      if (!accountStatus || accountStatus === 'CANCELLED' || accountStatus === 'EXPIRED') {
        res.status(401).json({ code: 'auth.invalidSession', message: 'Sesión inválida' });
        return;
      }

      const [modules, accountModules, grants] = await Promise.all([
        loadModules(pool),
        loadAccountModules(pool, user.idAccount),
        loadRoleGrants(pool, user.idUser),
      ]);
      const permissions = resolveEffectivePermissions(modules, accountModules, grants);

      req.context = {
        idAccount: user.idAccount,
        idUser: user.idUser,
        permissions,
        accountStatus,
        surface: 'BACKOFFICE',
        modoSuplantacion: payload.modoSuplantacion === true,
        idSuplantador: payload.idSuplantador ?? null,
        mustChangePassword: user.mustChangePassword === 1,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}
