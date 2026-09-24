import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'mysql2/promise';

const catalogPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../db/seed/003-f3-catalog.sql',
);

/** Permisos, menú y estados de reserva de F3. Idempotente. */
export async function ensureF3Catalog(pool: Pool): Promise<void> {
  const sql = readFileSync(catalogPath, 'utf8');
  const statements = sql
    .split(/;\s*\n/)
    .map((statement) => statement.replace(/--[^\n]*/g, '').trim())
    .filter((statement) => statement.length > 0);
  for (const statement of statements) {
    await pool.query(statement);
  }
}
