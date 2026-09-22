import mysql from 'mysql2/promise';
import { config } from './config.js';

/**
 * Pool de conexión a la base única de Fleetrust (AD1). Este repositorio
 * NUNCA escribe el esquema (AD3): solo lo consume. Ver
 * ../../../ARCHITECTURE.md y ../../../admin/db/init.sql.
 *
 * Igual que en fleetrust-admin, este módulo es la base sobre la que se
 * construye la capa de aislamiento de RF-103/AD6 en F1. Hoy no hay ninguna
 * consulta de negocio en este repositorio, solo el healthcheck.
 */
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function checkDbConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}
