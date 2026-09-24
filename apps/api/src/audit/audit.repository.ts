import type { Pool } from 'mysql2/promise';

/**
 * `audit_log` (RNF-04 / "Definición de terminado"): usuario, cuenta, acción,
 * valor anterior y posterior, IP y momento. Tabla de plataforma (5.3): se
 * escribe directo, no pasa por `AccountScopedRepository`.
 */
export interface AuditLogEntry {
  idAccount: number | null;
  idUser: number | null;
  idSuplantador?: number | null;
  action: string;
  entity: string;
  idEntity?: string | null;
  beforeJson?: unknown;
  afterJson?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

export async function writeAuditLog(pool: Pool, entry: AuditLogEntry): Promise<void> {
  await pool.query(
    `INSERT INTO audit_log
       (idAccount, idUser, idSuplantador, action, entity, idEntity, beforeJson, afterJson, ip, userAgent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.idAccount,
      entry.idUser,
      entry.idSuplantador ?? null,
      entry.action,
      entry.entity,
      entry.idEntity ?? null,
      entry.beforeJson === undefined ? null : JSON.stringify(entry.beforeJson),
      entry.afterJson === undefined ? null : JSON.stringify(entry.afterJson),
      entry.ip ?? null,
      entry.userAgent ?? null,
    ],
  );
}
