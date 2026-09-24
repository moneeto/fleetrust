import type { Pool } from 'mysql2/promise';
import { z } from 'zod';
import type { Mailer } from '../mail/mailer.js';
import { config } from '../config.js';
import {
  acceptInvitation,
  changeOwnPassword,
  openImpersonationSession,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from '../auth/account-access.service.js';
import { login } from '../auth/login.service.js';
import { signAccessToken, verifyAccessToken } from '../auth/jwt.js';
import {
  findActiveRefreshToken,
  generateRefreshTokenValue,
  hashRefreshToken,
  revokeRefreshToken,
  storeRefreshToken,
} from '../auth/refresh-tokens.repository.js';
import type { RowDataPacket } from 'mysql2/promise';
import { createGuardedRouter } from './guarded-router.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ACCESS_COOKIE = 'fleetrust_access';
const REFRESH_COOKIE = 'fleetrust_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
};

export function createAuthRoutes(pool: Pool, mailer: Mailer) {
  const router = createGuardedRouter();

  router.post('/api/auth/login', { public: true }, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'auth.invalidPayload', message: 'Email y contraseña son obligatorios' });
      return;
    }

    const result = await login(pool, {
      email: parsed.data.email,
      password: parsed.data.password,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    if (!result.ok) {
      // CA-201.1: mismo mensaje genérico siempre, sin distinguir el motivo.
      res.status(401).json({ code: 'auth.invalidCredentials', message: 'Email o contraseña incorrectos' });
      return;
    }

    res.cookie(ACCESS_COOKIE, result.accessToken, {
      ...cookieOptions,
      maxAge: config.auth.accessTokenTtlSeconds * 1000,
    });
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      ...cookieOptions,
      maxAge: config.auth.refreshTokenTtlDays * 24 * 60 * 60_000,
    });
    res.json({ readOnly: result.readOnly });
  });

  router.post('/api/auth/refresh', { public: true }, async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!rawToken) {
      res.status(401).json({ code: 'auth.required', message: 'No autenticado' });
      return;
    }

    const currentHash = hashRefreshToken(rawToken);
    const stored = await findActiveRefreshToken(pool, currentHash);
    if (!stored) {
      // RF-206/CA-206.1: reusar un token revocado o vencido siempre es 401.
      res.clearCookie(ACCESS_COOKIE);
      res.clearCookie(REFRESH_COOKIE);
      res.status(401).json({ code: 'auth.invalidRefreshToken', message: 'Sesión vencida' });
      return;
    }

    interface UserRow extends RowDataPacket {
      idUser: number;
      idAccount: number | null;
      status: string;
    }
    const [userRows] = await pool.query<UserRow[]>(
      'SELECT idUser, idAccount, status FROM users WHERE idUser = ? LIMIT 1',
      [stored.idUser],
    );
    const user = userRows[0];
    if (!user || user.idAccount === null || user.status === 'INACTIVE' || user.status === 'LOCKED') {
      await revokeRefreshToken(pool, currentHash);
      res.clearCookie(ACCESS_COOKIE);
      res.clearCookie(REFRESH_COOKIE);
      res.status(401).json({ code: 'auth.invalidSession', message: 'Sesión inválida' });
      return;
    }

    // Rotación: el token viejo queda revocado y reemplazado por uno nuevo.
    const newRawToken = generateRefreshTokenValue();
    const newHash = hashRefreshToken(newRawToken);
    await revokeRefreshToken(pool, currentHash, newHash);
    await storeRefreshToken(pool, {
      idUser: user.idUser,
      tokenHash: newHash,
      userAgent: req.get('user-agent') ?? null,
      ip: req.ip ?? null,
      modoSuplantacion: stored.modoSuplantacion === 1,
      idSuplantador: stored.idSuplantador,
    });

    const accessToken = signAccessToken({
      idUser: user.idUser,
      idAccount: user.idAccount,
      surface: 'BACKOFFICE',
      modoSuplantacion: stored.modoSuplantacion === 1,
      idSuplantador: stored.idSuplantador ?? undefined,
    });
    res.cookie(ACCESS_COOKIE, accessToken, { ...cookieOptions, maxAge: config.auth.accessTokenTtlSeconds * 1000 });
    res.cookie(REFRESH_COOKIE, newRawToken, {
      ...cookieOptions,
      maxAge: config.auth.refreshTokenTtlDays * 24 * 60 * 60_000,
    });
    res.status(204).end();
  });

  router.post('/api/auth/logout', { public: true }, async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (refreshToken) {
      await revokeRefreshToken(pool, hashRefreshToken(refreshToken));
    }
    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE);
    res.status(204).end();
  });

  const passwordSchema = z.object({ password: z.string().min(8).max(200) });

  router.post('/api/auth/accept-invitation', { public: true }, async (req, res) => {
    const parsed = passwordSchema.extend({ token: z.string().min(10) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'auth.invalidPayload' });
      return;
    }
    const ok = await acceptInvitation(pool, parsed.data.token, parsed.data.password);
    if (!ok) {
      res.status(400).json({ code: 'invitation.invalid', message: 'La invitación no es válida o ya venció' });
      return;
    }
    res.status(204).end();
  });

  router.post('/api/auth/forgot-password', { public: true }, async (req, res) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'auth.invalidPayload' });
      return;
    }
    const reset = await requestPasswordReset(pool, parsed.data.email);
    if (reset) {
      const url = `${config.publicUrl}/restablecer?token=${encodeURIComponent(reset.token)}`;
      try {
        await mailer.send({
          to: reset.email,
          subject: 'Restablecer contraseña — Fleetrust',
          text: `Para elegir una contraseña nueva, abrí este enlace (vence en 30 minutos):\n\n${url}`,
        });
      } catch {
        // Misma respuesta que si el email no existe: no se enumera la cuenta.
      }
    }
    res.status(204).end();
  });

  router.post('/api/auth/reset-password', { public: true }, async (req, res) => {
    const parsed = passwordSchema.extend({ token: z.string().min(10) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'auth.invalidPayload' });
      return;
    }
    const ok = await resetPassword(pool, parsed.data.token, parsed.data.password);
    if (!ok) {
      res.status(400).json({ code: 'reset.invalid', message: 'El enlace no es válido o ya venció' });
      return;
    }
    res.status(204).end();
  });

  router.post('/api/auth/verify-email', { public: true }, async (req, res) => {
    const parsed = z.object({ token: z.string().min(10) }).safeParse(req.body);
    if (!parsed.success || !(await verifyEmail(pool, parsed.data.token))) {
      res.status(400).json({ code: 'verify.invalid', message: 'El enlace no es válido o ya venció' });
      return;
    }
    res.status(204).end();
  });

  router.post('/api/auth/change-password', { public: true }, async (req, res) => {
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
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
    if (payload.modoSuplantacion) {
      res.status(403).json({ code: 'impersonation.readOnly', message: 'Estás en modo suplantación: podés mirar, no modificar.' });
      return;
    }
    const parsed = z.object({
      currentPassword: z.string().min(1),
      nextPassword: z.string().min(8).max(200),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'auth.invalidPayload' });
      return;
    }
    const ok = await changeOwnPassword(pool, { idUser: payload.idUser, ...parsed.data });
    if (!ok) {
      res.status(401).json({ code: 'auth.invalidCredentials', message: 'La contraseña actual no coincide' });
      return;
    }
    res.status(204).end();
  });

  router.post('/api/auth/impersonate', { public: true }, async (req, res) => {
    const parsed = z.object({ codigo: z.string().min(10) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'impersonation.invalid' });
      return;
    }
    const session = await openImpersonationSession(pool, {
      code: parsed.data.codigo,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });
    if (!session) {
      res.status(400).json({ code: 'impersonation.invalid', message: 'El código de suplantación no es válido o ya venció' });
      return;
    }
    res.cookie(ACCESS_COOKIE, session.accessToken, { ...cookieOptions, maxAge: config.auth.accessTokenTtlSeconds * 1000 });
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
      ...cookieOptions,
      maxAge: config.auth.refreshTokenTtlDays * 24 * 60 * 60_000,
    });
    res.status(204).end();
  });

  return router.raw;
}
