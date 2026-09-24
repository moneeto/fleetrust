import crypto from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { zonedLocalToUtc } from '../domain/zoned-time.js';

export interface BookingListFilters {
  from?: string;
  to?: string;
  code?: string;
  idFleetUnit?: number;
  idProfessional?: number;
  status?: string;
}

export function createBookingsRepository(pool: Pool) {
  return {
    async listServices(idAccount: number) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT idService, code, name, durationMinutes, isActive FROM services WHERE idAccount = ? ORDER BY name`,
        [idAccount],
      );
      return rows;
    },
    async createService(idAccount: number, input: { code: string; name: string; durationMinutes: number }) {
      try {
        const [result] = await pool.query<ResultSetHeader>(
          `INSERT INTO services (idAccount, code, name, durationMinutes) VALUES (?, ?, ?, ?)`,
          [idAccount, input.code, input.name, input.durationMinutes],
        );
        return { ok: true as const, id: result.insertId };
      } catch (err) {
        if (isDuplicate(err)) return { ok: false as const, message: 'Ya hay un servicio con ese código.' };
        throw err;
      }
    },
    async list(idAccount: number, filters: BookingListFilters) {
      const where = ['b.idAccount = ?'];
      const params: unknown[] = [idAccount];
      if (filters.from) { where.push('b.startAt >= ?'); params.push(filters.from); }
      if (filters.to) { where.push('b.startAt < ?'); params.push(filters.to); }
      if (filters.code) { where.push('b.code LIKE ?'); params.push(`%${filters.code}%`); }
      if (filters.idFleetUnit) { where.push('b.idFleetUnit = ?'); params.push(filters.idFleetUnit); }
      if (filters.idProfessional) { where.push('b.idProfessional = ?'); params.push(filters.idProfessional); }
      if (filters.status) { where.push('s.code = ?'); params.push(filters.status); }
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT b.idBooking, b.code, b.startAt, b.endAt, b.participantsCount, b.priceTotal, b.contactName, b.contactEmail, b.contactPhone, b.notes,
                s.code AS status, s.color AS statusColor, sv.name AS serviceName, f.name AS unitName, CONCAT(p.surname, ', ', p.name) AS professionalName
         FROM bookings b
         JOIN booking_statuses s ON s.idBookingStatus = b.idBookingStatus
         JOIN services sv ON sv.idService = b.idService
         JOIN fleet_units f ON f.idFleetUnit = b.idFleetUnit
         JOIN professionals p ON p.idProfessional = b.idProfessional
         WHERE ${where.join(' AND ')}
         ORDER BY b.startAt DESC`,
        params,
      );
      return rows;
    },
    async create(idAccount: number, input: {
      idService: number;
      idFleetUnit: number;
      idProfessional: number;
      startLocal: string;
      participantsCount: number;
      contactName: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
      notes: string | null;
      actorId: number;
    }) {
      const [accounts] = await pool.query<RowDataPacket[]>(`SELECT timezone FROM accounts WHERE idAccount = ?`, [idAccount]);
      const timezone = String(accounts[0]?.timezone ?? 'UTC');
      const startAt = zonedLocalToUtc(input.startLocal, timezone);
      const [services] = await pool.query<RowDataPacket[]>(
        `SELECT durationMinutes FROM services WHERE idAccount = ? AND idService = ? AND isActive = 1`,
        [idAccount, input.idService],
      );
      if (services.length === 0) return { ok: false as const, message: 'El servicio no existe.' };
      const endAt = new Date(startAt.getTime() + Number(services[0].durationMinutes) * 60_000);
      const [units] = await pool.query<RowDataPacket[]>(
        `SELECT capacity FROM fleet_units WHERE idAccount = ? AND idFleetUnit = ? AND deletedAt IS NULL AND isActive = 1`,
        [idAccount, input.idFleetUnit],
      );
      if (units.length === 0) return { ok: false as const, message: 'La unidad no está disponible.' };
      if (input.participantsCount > Number(units[0].capacity)) {
        return { ok: false as const, message: `La unidad tiene capacidad para ${units[0].capacity}.` };
      }
      const [professionals] = await pool.query<RowDataPacket[]>(
        `SELECT idProfessional FROM professionals WHERE idAccount = ? AND idProfessional = ? AND deletedAt IS NULL AND isActive = 1`,
        [idAccount, input.idProfessional],
      );
      if (professionals.length === 0) return { ok: false as const, message: 'El profesional no está disponible.' };
      const [overlap] = await pool.query<RowDataPacket[]>(
        `SELECT b.code FROM bookings b
         JOIN booking_statuses s ON s.idBookingStatus = b.idBookingStatus
         WHERE b.idAccount = ? AND s.code IN ('PENDING', 'CONFIRMED')
           AND b.startAt < ? AND b.endAt > ?
           AND (b.idFleetUnit = ? OR b.idProfessional = ?)
         LIMIT 1`,
        [idAccount, endAt, startAt, input.idFleetUnit, input.idProfessional],
      );
      if (overlap.length > 0) {
        return { ok: false as const, message: `Se superpone con la reserva ${overlap[0].code}.` };
      }
      const [status] = await pool.query<RowDataPacket[]>(
        `SELECT idBookingStatus FROM booking_statuses WHERE idAccount = ? AND code = 'CONFIRMED' LIMIT 1`,
        [idAccount],
      );
      if (status.length === 0) return { ok: false as const, message: 'La cuenta no tiene el estado Confirmada.' };
      const code = `R-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO bookings
          (idAccount, code, idService, idFleetUnit, idProfessional, startAt, endAt, participantsCount, idBookingStatus,
           priceTotal, confirmationHash, contactName, contactEmail, contactPhone, notes, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
        [idAccount, code, input.idService, input.idFleetUnit, input.idProfessional, startAt, endAt, input.participantsCount, status[0].idBookingStatus, crypto.randomBytes(16).toString('hex'), input.contactName, input.contactEmail, input.contactPhone, input.notes, input.actorId],
      );
      return { ok: true as const, id: result.insertId, code };
    },
    async cancel(idAccount: number, idBooking: number, input: { reasonCode: string; detail: string | null; actorId: number }) {
      const [reasons] = await pool.query<RowDataPacket[]>(
        `SELECT idCancellationReason, requiresDetail FROM cancellation_reasons WHERE idAccount = ? AND code = ? AND isActive = 1`,
        [idAccount, input.reasonCode],
      );
      if (reasons.length === 0) return { ok: false as const, message: 'Elegí un motivo de cancelación.' };
      if (reasons[0].requiresDetail === 1 && !input.detail?.trim()) {
        return { ok: false as const, message: 'Este motivo pide un detalle.' };
      }
      const [current] = await pool.query<RowDataPacket[]>(
        `SELECT b.idBookingStatus, s.code FROM bookings b
         JOIN booking_statuses s ON s.idBookingStatus = b.idBookingStatus
         WHERE b.idAccount = ? AND b.idBooking = ?`,
        [idAccount, idBooking],
      );
      if (current.length === 0) return { ok: false as const, status: 404, message: 'No se encontró la reserva.' };
      const [target] = await pool.query<RowDataPacket[]>(
        `SELECT idBookingStatus FROM booking_statuses WHERE idAccount = ? AND code = 'CANCELLED'`,
        [idAccount],
      );
      const [allowed] = await pool.query<RowDataPacket[]>(
        `SELECT 1 AS ok FROM booking_status_transitions WHERE idAccount = ? AND idFromStatus = ? AND idToStatus = ?`,
        [idAccount, current[0].idBookingStatus, target[0]?.idBookingStatus],
      );
      if (allowed.length === 0) return { ok: false as const, message: 'Esa reserva no se puede cancelar desde su estado actual.' };
      await pool.query(
        `UPDATE bookings
         SET idBookingStatus = ?, idCancellationReason = ?, cancellationDetail = ?, cancelledAt = UTC_TIMESTAMP(), updatedBy = ?
         WHERE idAccount = ? AND idBooking = ?`,
        [target[0].idBookingStatus, reasons[0].idCancellationReason, input.detail, input.actorId, idAccount, idBooking],
      );
      return { ok: true as const };
    },
    async reasons(idAccount: number) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT code, requiresDetail FROM cancellation_reasons WHERE idAccount = ? AND isActive = 1 ORDER BY sortOrder`,
        [idAccount],
      );
      return rows;
    },
  };
}

function isDuplicate(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'ER_DUP_ENTRY';
}
