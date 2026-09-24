import type { Pool, RowDataPacket } from 'mysql2/promise';

export type AccountLifecycleStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';

/** Si la prueba ya venció, la cuenta pasa a EXPIRED antes de decidir el login. */
export async function expireTrialIfDue(pool: Pool, idAccount: number): Promise<AccountLifecycleStatus | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT status, trialEndsAt FROM accounts WHERE idAccount = ? LIMIT 1',
    [idAccount],
  );
  const row = rows[0];
  if (!row) return null;
  const status = row.status as AccountLifecycleStatus;
  if (status === 'TRIAL' && row.trialEndsAt && new Date(row.trialEndsAt) <= new Date()) {
    await pool.query(`UPDATE accounts SET status = 'EXPIRED' WHERE idAccount = ? AND status = 'TRIAL'`, [idAccount]);
    return 'EXPIRED';
  }
  return status;
}
