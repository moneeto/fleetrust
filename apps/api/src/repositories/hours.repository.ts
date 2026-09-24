import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { previewSlots, type DayException, type TimeRange } from '../domain/hours-preview.js';
import { zonedParts } from '../domain/zoned-time.js';

export function createHoursRepository(pool: Pool) {
  return {
    async get(idAccount: number) {
      const [account] = await pool.query<RowDataPacket[]>(
        `SELECT timezone, slotGranularityMinutes, defaultMinLeadMinutes, defaultMaxLeadDays FROM accounts WHERE idAccount = ?`,
        [idAccount],
      );
      const [ranges] = await pool.query<RowDataPacket[]>(
        `SELECT idBusinessHour, weekday, startTime, endTime, isActive FROM business_hours WHERE idAccount = ? ORDER BY weekday, startTime`,
        [idAccount],
      );
      const [exceptions] = await pool.query<RowDataPacket[]>(
        `SELECT idCalendarException, date, isClosed, startTime, endTime, label, recurringYearly
         FROM calendar_exceptions WHERE idAccount = ? ORDER BY date`,
        [idAccount],
      );
      return {
        timezone: String(account[0]?.timezone ?? 'UTC'),
        slotGranularityMinutes: Number(account[0]?.slotGranularityMinutes ?? 30),
        defaultMinLeadMinutes: account[0]?.defaultMinLeadMinutes ?? null,
        defaultMaxLeadDays: account[0]?.defaultMaxLeadDays ?? null,
        ranges,
        exceptions,
      };
    },
    async save(idAccount: number, input: {
      slotGranularityMinutes: number;
      defaultMinLeadMinutes: number | null;
      defaultMaxLeadDays: number | null;
      ranges: TimeRange[];
      confirm: boolean;
    }) {
      const current = await this.get(idAccount);
      const impacted = await bookingsOutside(pool, idAccount, current.timezone, input.ranges);
      if (impacted.length > 0 && !input.confirm) {
        return { ok: false as const, bookings: impacted };
      }
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query(
          `UPDATE accounts SET slotGranularityMinutes = ?, defaultMinLeadMinutes = ?, defaultMaxLeadDays = ? WHERE idAccount = ?`,
          [input.slotGranularityMinutes, input.defaultMinLeadMinutes, input.defaultMaxLeadDays, idAccount],
        );
        await conn.query(`DELETE FROM business_hours WHERE idAccount = ?`, [idAccount]);
        for (const range of input.ranges) {
          await conn.query(
            `INSERT INTO business_hours (idAccount, weekday, startTime, endTime) VALUES (?, ?, ?, ?)`,
            [idAccount, range.weekday, range.startTime, range.endTime],
          );
        }
        await conn.commit();
        return { ok: true as const };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
    preview(idAccount: number, date: string) {
      return this.get(idAccount).then((config) => {
        const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
        const exception = exceptionFor(config.exceptions, date);
        return previewSlots(
          config.ranges.map((range) => ({ weekday: Number(range.weekday), startTime: String(range.startTime), endTime: String(range.endTime) })),
          weekday,
          exception,
          config.slotGranularityMinutes,
        );
      });
    },
    async addException(idAccount: number, input: { date: string; isClosed: boolean; startTime: string | null; endTime: string | null; label: string | null }) {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO calendar_exceptions (idAccount, date, isClosed, startTime, endTime, label) VALUES (?, ?, ?, ?, ?, ?)`,
        [idAccount, input.date, input.isClosed ? 1 : 0, input.startTime, input.endTime, input.label],
      );
      return result.insertId;
    },
    async deleteException(idAccount: number, idCalendarException: number) {
      const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM calendar_exceptions WHERE idAccount = ? AND idCalendarException = ?`,
        [idAccount, idCalendarException],
      );
      return result.affectedRows;
    },
  };
}

function exceptionFor(rows: RowDataPacket[], date: string): DayException | null {
  const monthDay = date.slice(5);
  const row = rows.find((item) => String(item.date).slice(0, 10) === date || (item.recurringYearly === 1 && String(item.date).slice(5, 10) === monthDay));
  if (!row) return null;
  return { isClosed: row.isClosed === 1, startTime: row.startTime ? String(row.startTime) : null, endTime: row.endTime ? String(row.endTime) : null };
}

async function bookingsOutside(pool: Pool, idAccount: number, timeZone: string, ranges: TimeRange[]) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.code, b.startAt, b.endAt
     FROM bookings b
     JOIN booking_statuses s ON s.idBookingStatus = b.idBookingStatus
     WHERE b.idAccount = ? AND b.startAt > UTC_TIMESTAMP() AND s.code IN ('PENDING', 'CONFIRMED')`,
    [idAccount],
  );
  return rows.filter((row) => {
    const start = zonedParts(new Date(row.startAt), timeZone);
    const end = zonedParts(new Date(row.endAt), timeZone);
    if (start.date !== end.date) return true;
    return !ranges.some((range) => range.weekday === start.weekday && toMinutes(range.startTime) <= start.minutes && toMinutes(range.endTime) >= end.minutes);
  }).map((row) => ({ code: String(row.code), startAt: new Date(row.startAt).toISOString() }));
}

function toMinutes(value: string): number {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return hour * 60 + minute;
}
