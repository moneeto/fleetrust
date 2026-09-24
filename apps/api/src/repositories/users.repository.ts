import type { Pool, RowDataPacket } from 'mysql2/promise';
import { AccountScopedRepository } from './base.repository.js';

export interface UserRow extends RowDataPacket {
  idUser: number;
  idAccount: number;
  email: string;
  name: string | null;
  surname: string | null;
  locale: string | null;
}

export type UserWritableFields = Partial<Pick<UserRow, 'name' | 'surname' | 'locale'>>;

export function createUsersRepository(pool: Pool): AccountScopedRepository<UserRow, UserWritableFields> {
  return new AccountScopedRepository<UserRow, UserWritableFields>(pool, 'users', 'idUser');
}
