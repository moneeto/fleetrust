import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db.js';
import { AccountScopedRepository } from './base.repository.js';

interface UserRow extends RowDataPacket {
  idUser: number;
  idAccount: number;
  email: string;
  name: string | null;
}

/**
 * CA-103.1 pide una suite que, con dos cuentas sembradas, verifique que
 * ninguna ve datos de la otra. Todavía no hay tablas de negocio (Fleet,
 * Bookings, etc. son F3+), así que se prueba contra `users`, que es real,
 * ya existe y tiene `idAccount`. Cuando exista la primera tabla de negocio,
 * este mismo patrón se repite contra ella — no se reescribe el mecanismo.
 */
describe('AccountScopedRepository — aislamiento entre cuentas', () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  const repo = new AccountScopedRepository<UserRow>(pool, 'users', 'idUser');

  let idAccountA: number;
  let idAccountB: number;
  let idUserA: number;
  let idUserB: number;

  beforeAll(async () => {
    const [accA] = await pool.query(
      `INSERT INTO accounts (code, name, status, defaultLocale, timezone, currency)
       VALUES (?, ?, 'ACTIVE', 'es-AR', 'America/Argentina/Buenos_Aires', 'ARS')`,
      [`test-a-${suffix}`, 'Cuenta de prueba A'],
    );
    idAccountA = (accA as { insertId: number }).insertId;

    const [accB] = await pool.query(
      `INSERT INTO accounts (code, name, status, defaultLocale, timezone, currency)
       VALUES (?, ?, 'ACTIVE', 'es-AR', 'America/Argentina/Buenos_Aires', 'ARS')`,
      [`test-b-${suffix}`, 'Cuenta de prueba B'],
    );
    idAccountB = (accB as { insertId: number }).insertId;

    const [usrA] = await pool.query(
      `INSERT INTO users (idAccount, email, name, status) VALUES (?, ?, 'Usuario A', 'ACTIVE')`,
      [idAccountA, `usuario-a-${suffix}@test.fleetrust.io`],
    );
    idUserA = (usrA as { insertId: number }).insertId;

    const [usrB] = await pool.query(
      `INSERT INTO users (idAccount, email, name, status) VALUES (?, ?, 'Usuario B', 'ACTIVE')`,
      [idAccountB, `usuario-b-${suffix}@test.fleetrust.io`],
    );
    idUserB = (usrB as { insertId: number }).insertId;
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM users WHERE idUser IN (?, ?)`, [idUserA, idUserB]);
    await pool.query(`DELETE FROM accounts WHERE idAccount IN (?, ?)`, [idAccountA, idAccountB]);
  });

  it('findMany de la cuenta A nunca incluye filas de la cuenta B', async () => {
    const rowsA = await repo.findMany(idAccountA);
    expect(rowsA.map((r) => r.idUser)).toContain(idUserA);
    expect(rowsA.map((r) => r.idUser)).not.toContain(idUserB);
  });

  it('findById con el id de un usuario de otra cuenta devuelve null, no los datos', async () => {
    // Simula CA-102.1: alguien de la cuenta A intenta leer un id que existe,
    // pero es de la cuenta B. La capa de aislamiento debe responder "no
    // existe", nunca los datos ni una distinción entre 403/404.
    const row = await repo.findById(idAccountA, idUserB);
    expect(row).toBeNull();
  });

  it('un idAccount inyectado en el "where" nunca gana sobre el idAccount real', async () => {
    // CA-102.2: si algo intentara pasar un idAccount ajeno como filtro, la
    // clase lo descarta y usa siempre el idAccount con el que se la invocó.
    const rows = await repo.findMany(idAccountA, { idAccount: idAccountB } as never);
    expect(rows.every((r) => r.idAccount === idAccountA)).toBe(true);
  });

  it('update con el id de un usuario de otra cuenta no afecta ninguna fila', async () => {
    const affected = await repo.update(idAccountA, idUserB, { name: 'Hackeado' });
    expect(affected).toBe(0);

    const stillB = await repo.findById(idAccountB, idUserB);
    expect(stillB?.name).toBe('Usuario B');
  });
});
