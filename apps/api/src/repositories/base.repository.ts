import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

/**
 * Capa de aislamiento estructural (RF-103/AD6/CA-103.1).
 *
 * Ninguna consulta de negocio se escribe fuera de esta clase. `idAccount`
 * SIEMPRE se inyecta acá, tomado del argumento explícito que pasa el
 * llamador — que en el código real solo puede venir de `RequestContext`
 * (ver `context.ts`), nunca de un dato de la petición. Si en algún punto se
 * pasa un `idAccount` distinto en `where`/`data`, esta clase lo pisa: gana
 * siempre el de la cuenta activa.
 *
 * `tests/architecture.test.ts` (RF-104) falla la build si aparece un
 * `pool.query`/`pool.execute` de negocio fuera de `repositories/`.
 */
export class AccountScopedRepository<
  Row extends RowDataPacket,
  Writable extends Record<string, unknown> = Record<string, unknown>,
> {
  constructor(
    protected readonly pool: Pool,
    protected readonly table: string,
    protected readonly pkColumn: string,
  ) {}

  async findMany(idAccount: number, where: Record<string, unknown> = {}): Promise<Row[]> {
    const conditions: string[] = [`\`idAccount\` = ?`];
    const params: unknown[] = [idAccount];

    for (const [column, value] of Object.entries(where)) {
      if (column === 'idAccount') continue; // no se pisa: ver comentario de clase
      conditions.push(`\`${column}\` = ?`);
      params.push(value);
    }

    const sql = `SELECT * FROM \`${this.table}\` WHERE ${conditions.join(' AND ')}`;
    const [rows] = await this.pool.query<Row[]>(sql, params);
    return rows;
  }

  async findById(idAccount: number, id: number | string): Promise<Row | null> {
    const sql = `SELECT * FROM \`${this.table}\` WHERE \`idAccount\` = ? AND \`${this.pkColumn}\` = ? LIMIT 1`;
    const [rows] = await this.pool.query<Row[]>(sql, [idAccount, id]);
    return rows[0] ?? null;
  }

  async insert(idAccount: number, data: Writable): Promise<number> {
    const entries = Object.entries({ ...data, idAccount });
    const columns = entries.map(([column]) => `\`${column}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const params = entries.map(([, value]) => value);

    const sql = `INSERT INTO \`${this.table}\` (${columns}) VALUES (${placeholders})`;
    const [result] = await this.pool.query<ResultSetHeader>(sql, params);
    return result.insertId;
  }

  /**
   * Devuelve la cantidad de filas afectadas. 0 significa "no existía en esta
   * cuenta" — el llamador lo traduce a 404, nunca a 403 (CA-102.1): no hay
   * forma de distinguir desde afuera "no existe" de "es de otra cuenta".
   */
  async update(idAccount: number, id: number | string, data: Writable): Promise<number> {
    const entries = Object.entries(data).filter(([column]) => column !== 'idAccount');
    if (entries.length === 0) return 0;

    const assignments = entries.map(([column]) => `\`${column}\` = ?`).join(', ');
    const params = entries.map(([, value]) => value);

    const sql = `UPDATE \`${this.table}\` SET ${assignments} WHERE \`idAccount\` = ? AND \`${this.pkColumn}\` = ?`;
    const [result] = await this.pool.query<ResultSetHeader>(sql, [...params, idAccount, id]);
    return result.affectedRows;
  }
}
