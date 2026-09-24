import type { Pool, RowDataPacket } from 'mysql2/promise';

/**
 * Copia deliberada de la parte de esquema de `fleetrust/admin` (no hay
 * paquete compartido). El seed de plataforma lo corre solo el API de admin.
 */
export async function ensureF2Schema(pool: Pool): Promise<void> {
  await addColumnIfMissing(
    pool,
    'audit_log',
    'idSuplantador',
    'ALTER TABLE audit_log ADD COLUMN idSuplantador INT UNSIGNED NULL AFTER idUser',
  );
  await addIndexIfMissing(
    pool,
    'audit_log',
    'ix_audit_log_suplantador',
    'ALTER TABLE audit_log ADD KEY ix_audit_log_suplantador (idSuplantador)',
  );
  await addForeignKeyIfMissing(
    pool,
    'fk_audit_log_suplantador',
    'ALTER TABLE audit_log ADD CONSTRAINT fk_audit_log_suplantador FOREIGN KEY (idSuplantador) REFERENCES users (idUser) ON DELETE SET NULL',
  );
  await addColumnIfMissing(
    pool,
    'refresh_tokens',
    'modoSuplantacion',
    'ALTER TABLE refresh_tokens ADD COLUMN modoSuplantacion TINYINT(1) NOT NULL DEFAULT 0 AFTER tokenHash',
  );
  await addColumnIfMissing(
    pool,
    'refresh_tokens',
    'idSuplantador',
    'ALTER TABLE refresh_tokens ADD COLUMN idSuplantador INT UNSIGNED NULL AFTER modoSuplantacion',
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      idToken INT UNSIGNED NOT NULL AUTO_INCREMENT,
      idUser INT UNSIGNED NOT NULL,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expiresAt DATETIME NOT NULL,
      usedAt DATETIME NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (idToken),
      UNIQUE KEY uq_email_verification_tokens_token (token),
      KEY ix_email_verification_tokens_user (idUser),
      CONSTRAINT fk_email_verification_tokens_user FOREIGN KEY (idUser) REFERENCES users (idUser) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS impersonation_codes (
      idCode INT UNSIGNED NOT NULL AUTO_INCREMENT,
      codeHash VARCHAR(255) NOT NULL,
      idUser INT UNSIGNED NOT NULL,
      idSuplantador INT UNSIGNED NOT NULL,
      expiresAt DATETIME NOT NULL,
      usedAt DATETIME NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (idCode),
      UNIQUE KEY uq_impersonation_codes_hash (codeHash),
      KEY ix_impersonation_codes_user (idUser),
      CONSTRAINT fk_impersonation_codes_user FOREIGN KEY (idUser) REFERENCES users (idUser) ON DELETE CASCADE,
      CONSTRAINT fk_impersonation_codes_suplantador FOREIGN KEY (idSuplantador) REFERENCES users (idUser) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function addColumnIfMissing(pool: Pool, table: string, column: string, ddl: string): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 AS ok FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column],
  );
  if (rows.length === 0) await pool.query(ddl);
}

async function addIndexIfMissing(pool: Pool, table: string, index: string, ddl: string): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 AS ok FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, index],
  );
  if (rows.length === 0) await pool.query(ddl);
}

async function addForeignKeyIfMissing(pool: Pool, name: string, ddl: string): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 AS ok FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY' LIMIT 1`,
    [name],
  );
  if (rows.length === 0) await pool.query(ddl);
}
