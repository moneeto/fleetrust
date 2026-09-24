import type { Pool, RowDataPacket } from 'mysql2/promise';
import { validateMetadata, type FleetAttributeDef, type FleetDataType } from '../domain/fleet-metadata.js';

export interface FleetTypeRow extends RowDataPacket {
  idFleetType: number;
  code: string;
  name: string;
  isActive: number;
  sortOrder: number;
}

export interface FleetAttributeRow extends RowDataPacket {
  idFleetAttribute: number;
  idFleetType: number | null;
  code: string;
  label: string;
  dataType: FleetDataType;
  options: string[] | string | null;
  isRequired: number;
  unit: string | null;
  showInList: number;
  sortOrder: number;
}

export interface FleetUnitRow extends RowDataPacket {
  idFleetUnit: number;
  idFleetType: number | null;
  code: string;
  name: string;
  capacity: number;
  externalCode: string | null;
  imageUrl: string | null;
  isActive: number;
  metadata: Record<string, unknown> | string | null;
  deletedAt: Date | null;
}

export function createFleetRepository(pool: Pool) {
  return {
    listTypes(idAccount: number) {
      return pool.query<FleetTypeRow[]>(
        `SELECT idFleetType, code, name, isActive, sortOrder FROM fleet_types WHERE idAccount = ? ORDER BY sortOrder, name`,
        [idAccount],
      ).then(([rows]) => rows);
    },
    async insertType(idAccount: number, input: { code: string; name: string }) {
      const [result] = await pool.query<import('mysql2/promise').ResultSetHeader>(
        `INSERT INTO fleet_types (idAccount, code, name) VALUES (?, ?, ?)`,
        [idAccount, input.code, input.name],
      );
      return result.insertId;
    },
    updateType(idAccount: number, idFleetType: number, input: { name?: string; isActive?: boolean }) {
      return pool.query(
        `UPDATE fleet_types SET name = COALESCE(?, name), isActive = COALESCE(?, isActive) WHERE idAccount = ? AND idFleetType = ?`,
        [input.name ?? null, input.isActive === undefined ? null : input.isActive ? 1 : 0, idAccount, idFleetType],
      );
    },
    listAttributes(idAccount: number) {
      return pool.query<FleetAttributeRow[]>(
        `SELECT idFleetAttribute, idFleetType, code, label, dataType, options, isRequired, unit, showInList, sortOrder
         FROM fleet_attributes WHERE idAccount = ? ORDER BY sortOrder, label`,
        [idAccount],
      ).then(([rows]) => rows.map(normalizeAttribute));
    },
    async insertAttribute(idAccount: number, input: {
      idFleetType: number | null;
      code: string;
      label: string;
      dataType: FleetDataType;
      options: string[] | null;
      isRequired: boolean;
      unit: string | null;
      showInList: boolean;
    }) {
      const [dup] = await pool.query<RowDataPacket[]>(
        `SELECT idFleetAttribute FROM fleet_attributes
         WHERE idAccount = ? AND code = ? AND ((idFleetType IS NULL AND ? IS NULL) OR idFleetType = ?)`,
        [idAccount, input.code, input.idFleetType, input.idFleetType],
      );
      if (dup.length > 0) return { ok: false as const, message: 'Ya existe un atributo con ese código para ese tipo.' };
      const [result] = await pool.query<import('mysql2/promise').ResultSetHeader>(
        `INSERT INTO fleet_attributes
          (idAccount, idFleetType, code, label, dataType, options, isRequired, unit, showInList)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [idAccount, input.idFleetType, input.code, input.label, input.dataType, input.options ? JSON.stringify(input.options) : null, input.isRequired ? 1 : 0, input.unit, input.showInList ? 1 : 0],
      );
      return { ok: true as const, id: result.insertId };
    },
    async deleteAttribute(idAccount: number, idFleetAttribute: number) {
      const [result] = await pool.query<import('mysql2/promise').ResultSetHeader>(
        `DELETE FROM fleet_attributes WHERE idAccount = ? AND idFleetAttribute = ?`,
        [idAccount, idFleetAttribute],
      );
      return result.affectedRows;
    },
    listUnits(idAccount: number) {
      return pool.query<FleetUnitRow[]>(
        `SELECT idFleetUnit, idFleetType, code, name, capacity, externalCode, imageUrl, isActive, metadata, deletedAt
         FROM fleet_units WHERE idAccount = ? ORDER BY name`,
        [idAccount],
      ).then(([rows]) => rows);
    },
    async saveUnit(idAccount: number, idFleetUnit: number | null, input: {
      idFleetType: number | null;
      code: string;
      name: string;
      capacity: number;
      externalCode: string | null;
      imageUrl: string | null;
      isActive: boolean;
      metadata: unknown;
      actorId: number;
    }) {
      const defs = await this.listAttributes(idAccount);
      const checked = validateMetadata(defs.map(toDef), input.idFleetType, input.metadata ?? {});
      if (!checked.ok) return checked;
      const metadata = JSON.stringify(checked.value);
      try {
        if (idFleetUnit === null) {
          const [result] = await pool.query<import('mysql2/promise').ResultSetHeader>(
            `INSERT INTO fleet_units
              (idAccount, idFleetType, code, name, capacity, externalCode, imageUrl, isActive, metadata, createdBy)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [idAccount, input.idFleetType, input.code, input.name, input.capacity, input.externalCode, input.imageUrl, input.isActive ? 1 : 0, metadata, input.actorId],
          );
          return { ok: true as const, id: result.insertId };
        }
        const [result] = await pool.query<import('mysql2/promise').ResultSetHeader>(
          `UPDATE fleet_units
           SET idFleetType = ?, code = ?, name = ?, capacity = ?, externalCode = ?, imageUrl = ?, isActive = ?, metadata = ?, updatedBy = ?
           WHERE idAccount = ? AND idFleetUnit = ? AND deletedAt IS NULL`,
          [input.idFleetType, input.code, input.name, input.capacity, input.externalCode, input.imageUrl, input.isActive ? 1 : 0, metadata, input.actorId, idAccount, idFleetUnit],
        );
        if (result.affectedRows === 0) return { ok: false as const, message: 'No se encontró la unidad.' };
        return { ok: true as const, id: idFleetUnit };
      } catch (err) {
        if (isDuplicate(err)) return { ok: false as const, message: 'Ya hay una unidad con ese código.' };
        throw err;
      }
    },
    async futureBookingCount(idAccount: number, column: 'idFleetUnit' | 'idProfessional', id: number) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total
         FROM bookings b
         JOIN booking_statuses s ON s.idBookingStatus = b.idBookingStatus
         WHERE b.idAccount = ? AND b.\`${column}\` = ? AND b.startAt > UTC_TIMESTAMP()
           AND s.code IN ('PENDING', 'CONFIRMED')`,
        [idAccount, id],
      );
      return Number(rows[0]?.total ?? 0);
    },
    async setUnitDeleted(idAccount: number, idFleetUnit: number, deleted: boolean, actorId: number) {
      const [result] = await pool.query<import('mysql2/promise').ResultSetHeader>(
        `UPDATE fleet_units SET deletedAt = ${deleted ? 'UTC_TIMESTAMP()' : 'NULL'}, isActive = ?, updatedBy = ?
         WHERE idAccount = ? AND idFleetUnit = ?`,
        [deleted ? 0 : 1, actorId, idAccount, idFleetUnit],
      );
      return result.affectedRows;
    },
  };
}

function normalizeAttribute(row: FleetAttributeRow): FleetAttributeDef & { idFleetAttribute: number; unit: string | null; showInList: boolean; sortOrder: number } {
  const options = typeof row.options === 'string' ? JSON.parse(row.options) as string[] : row.options;
  return {
    idFleetAttribute: row.idFleetAttribute,
    idFleetType: row.idFleetType,
    code: row.code,
    label: row.label,
    dataType: row.dataType,
    options,
    isRequired: row.isRequired === 1,
    unit: row.unit,
    showInList: row.showInList === 1,
    sortOrder: row.sortOrder,
  };
}

function toDef(row: ReturnType<typeof normalizeAttribute>): FleetAttributeDef {
  return row;
}

function isDuplicate(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'ER_DUP_ENTRY';
}
