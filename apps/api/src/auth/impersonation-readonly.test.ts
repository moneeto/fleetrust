import jwt from 'jsonwebtoken';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { config } from '../config.js';
import { pool } from '../db.js';
import { expireTrialIfDue } from './trial.js';

describe('F2 — suplantación y prueba vencida', () => {
  it('una sesión con modoSuplantacion rechaza la escritura', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    const [account] = await pool.query<ResultSetHeader>(
      `INSERT INTO accounts (code, name, status) VALUES (?, 'Cuenta suplantada', 'ACTIVE')`,
      [`imp-${suffix}`.slice(0, 40)],
    );
    const [user] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (idAccount, email, name, locale, status)
       VALUES (?, ?, 'Suplantado', 'es-AR', 'ACTIVE')`,
      [account.insertId, `imp-${suffix}@example.com`],
    );
    const token = jwt.sign(
      {
        idUser: user.insertId,
        idAccount: account.insertId,
        surface: 'BACKOFFICE',
        modoSuplantacion: true,
        idSuplantador: user.insertId,
      },
      config.auth.jwtSecret,
    );
    const app = createApp(pool, { send: async () => undefined });
    const res = await request(app)
      .patch('/api/me')
      .set('Cookie', [`fleetrust_access=${token}`])
      .send({ name: 'Cambio bloqueado' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('impersonation.readOnly');
  });

  it('un trial con fecha vencida pasa a EXPIRED', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    const [account] = await pool.query<ResultSetHeader>(
      `INSERT INTO accounts (code, name, status, trialEndsAt)
       VALUES (?, 'Trial vencido', 'TRIAL', DATE_SUB(NOW(), INTERVAL 1 DAY))`,
      [`trial-${suffix}`.slice(0, 40)],
    );
    const status = await expireTrialIfDue(pool, account.insertId);
    expect(status).toBe('EXPIRED');
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT status FROM accounts WHERE idAccount = ?',
      [account.insertId],
    );
    expect(rows[0]?.status).toBe('EXPIRED');
  });
});
