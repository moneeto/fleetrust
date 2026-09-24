import crypto from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface ProfessionalRow extends RowDataPacket {
  idProfessional: number;
  idUser: number | null;
  name: string;
  surname: string;
  phone: string | null;
  photoUrl: string | null;
  isActive: number;
  email: string | null;
  deletedAt: Date | null;
}

export function createProfessionalsRepository(pool: Pool) {
  return {
    async list(idAccount: number) {
      const [rows] = await pool.query<ProfessionalRow[]>(
        `SELECT p.idProfessional, p.idUser, p.name, p.surname, p.phone, p.photoUrl, p.isActive, p.deletedAt, u.email
         FROM professionals p
         LEFT JOIN users u ON u.idUser = p.idUser
         WHERE p.idAccount = ?
         ORDER BY p.surname, p.name`,
        [idAccount],
      );
      return rows;
    },
    async findByUser(idAccount: number, idUser: number) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT idProfessional FROM professionals WHERE idAccount = ? AND idUser = ? AND deletedAt IS NULL LIMIT 1`,
        [idAccount, idUser],
      );
      return rows[0] ? Number(rows[0].idProfessional) : null;
    },
    async create(idAccount: number, input: {
      name: string;
      surname: string;
      phone: string | null;
      createUser: boolean;
      email: string | null;
      actorId: number;
      locale: string;
    }): Promise<{ ok: true; idProfessional: number; invitationToken: string | null } | { ok: false; message: string }> {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        let idUser: number | null = null;
        let invitationToken: string | null = null;
        if (input.createUser) {
          if (!input.email) {
            await conn.rollback();
            return { ok: false, message: 'Para crear el usuario hace falta un email.' };
          }
          const [dup] = await conn.query<RowDataPacket[]>(`SELECT idUser FROM users WHERE email = ? LIMIT 1`, [input.email]);
          if (dup.length > 0) {
            await conn.rollback();
            return { ok: false, message: 'Ese email no está disponible.' };
          }
          const [user] = await conn.query<ResultSetHeader>(
            `INSERT INTO users (idAccount, email, name, surname, phone, locale, status) VALUES (?, ?, ?, ?, ?, ?, 'INVITED')`,
            [idAccount, input.email, input.name, input.surname, input.phone, input.locale],
          );
          idUser = user.insertId;
          await conn.query(
            `INSERT INTO user_roles (idUser, idRole)
             SELECT ?, idRole FROM roles WHERE idAccount = ? AND code = 'PROFESSIONAL'`,
            [idUser, idAccount],
          );
          invitationToken = crypto.randomBytes(32).toString('base64url');
          await conn.query(
            `INSERT INTO invitations (idAccount, idUser, token, expiresAt, createdBy) VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY), ?)`,
            [idAccount, idUser, invitationToken, input.actorId],
          );
        }
        const [created] = await conn.query<ResultSetHeader>(
          `INSERT INTO professionals (idAccount, idUser, name, surname, phone, createdBy) VALUES (?, ?, ?, ?, ?, ?)`,
          [idAccount, idUser, input.name, input.surname, input.phone, input.actorId],
        );
        await conn.commit();
        return { ok: true, idProfessional: created.insertId, invitationToken };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
    async update(idAccount: number, idProfessional: number, input: { name: string; surname: string; phone: string | null; isActive: boolean; actorId: number }) {
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE professionals SET name = ?, surname = ?, phone = ?, isActive = ?, updatedBy = ?
         WHERE idAccount = ? AND idProfessional = ? AND deletedAt IS NULL`,
        [input.name, input.surname, input.phone, input.isActive ? 1 : 0, input.actorId, idAccount, idProfessional],
      );
      return result.affectedRows;
    },
    async setDeleted(idAccount: number, idProfessional: number, deleted: boolean, actorId: number) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [result] = await conn.query<ResultSetHeader>(
          `UPDATE professionals SET deletedAt = ${deleted ? 'UTC_TIMESTAMP()' : 'NULL'}, isActive = ?, updatedBy = ?
           WHERE idAccount = ? AND idProfessional = ?`,
          [deleted ? 0 : 1, actorId, idAccount, idProfessional],
        );
        if (deleted && result.affectedRows > 0) {
          await conn.query(
            `UPDATE users u
             JOIN professionals p ON p.idUser = u.idUser
             SET u.status = 'INACTIVE'
             WHERE p.idAccount = ? AND p.idProfessional = ?`,
            [idAccount, idProfessional],
          );
        }
        await conn.commit();
        return result.affectedRows;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
    async listHours(idAccount: number, idProfessional: number) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT weekday, startTime, endTime FROM professional_hours WHERE idAccount = ? AND idProfessional = ? ORDER BY weekday, startTime`,
        [idAccount, idProfessional],
      );
      return rows;
    },
    async replaceHours(idAccount: number, idProfessional: number, ranges: { weekday: number; startTime: string; endTime: string }[]) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [owned] = await conn.query<RowDataPacket[]>(
          `SELECT idProfessional FROM professionals WHERE idAccount = ? AND idProfessional = ? AND deletedAt IS NULL`,
          [idAccount, idProfessional],
        );
        if (owned.length === 0) {
          await conn.rollback();
          return 0;
        }
        await conn.query(`DELETE FROM professional_hours WHERE idAccount = ? AND idProfessional = ?`, [idAccount, idProfessional]);
        for (const range of ranges) {
          await conn.query(
            `INSERT INTO professional_hours (idAccount, idProfessional, weekday, startTime, endTime) VALUES (?, ?, ?, ?, ?)`,
            [idAccount, idProfessional, range.weekday, range.startTime, range.endTime],
          );
        }
        await conn.commit();
        return 1;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
  };
}
