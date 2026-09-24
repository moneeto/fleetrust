import { describe, expect, it } from 'vitest';
import {
  computeLockedUntil,
  evaluateLoginAttempt,
  shouldLockAfterFailedAttempt,
  type AccountStatusRow,
  type UserAuthRow,
} from './evaluate-login-attempt.js';

const NOW = new Date('2026-09-22T10:00:00Z');

const activeUser: UserAuthRow = {
  idUser: 1,
  idAccount: 100,
  passwordHash: 'hash',
  status: 'ACTIVE',
  lockedUntil: null,
};

const activeAccount: AccountStatusRow = { idAccount: 100, status: 'ACTIVE' };

describe('evaluateLoginAttempt', () => {
  it('usuario inexistente: rechazo genérico', () => {
    const d = evaluateLoginAttempt({ user: null, account: null, passwordMatches: false, now: NOW });
    expect(d.outcome).toBe('DENY_GENERIC');
  });

  it('usuario de plataforma (idAccount null) nunca entra por BackOffice (RF-102.1)', () => {
    const platformUser: UserAuthRow = { ...activeUser, idAccount: null };
    const d = evaluateLoginAttempt({ user: platformUser, account: null, passwordMatches: true, now: NOW });
    expect(d.outcome).toBe('DENY_GENERIC');
  });

  it('usuario INACTIVE: rechazo genérico aunque la contraseña sea correcta (CA-201.1)', () => {
    const user: UserAuthRow = { ...activeUser, status: 'INACTIVE' };
    const d = evaluateLoginAttempt({ user, account: activeAccount, passwordMatches: true, now: NOW });
    expect(d.outcome).toBe('DENY_GENERIC');
  });

  it('usuario LOCKED (bloqueo permanente de estado): rechazo genérico', () => {
    const user: UserAuthRow = { ...activeUser, status: 'LOCKED' };
    const d = evaluateLoginAttempt({ user, account: activeAccount, passwordMatches: true, now: NOW });
    expect(d.outcome).toBe('DENY_GENERIC');
  });

  it('usuario con lockedUntil en el futuro: rechazo genérico aunque la contraseña sea correcta', () => {
    const user: UserAuthRow = { ...activeUser, lockedUntil: '2026-09-22T10:05:00Z' };
    const d = evaluateLoginAttempt({ user, account: activeAccount, passwordMatches: true, now: NOW });
    expect(d.outcome).toBe('DENY_GENERIC');
  });

  it('lockedUntil ya vencido no bloquea', () => {
    const user: UserAuthRow = { ...activeUser, lockedUntil: '2026-09-22T09:59:00Z' };
    const d = evaluateLoginAttempt({ user, account: activeAccount, passwordMatches: true, now: NOW });
    expect(d.outcome).toBe('ALLOW');
  });

  it('contraseña incorrecta: rechazo genérico', () => {
    const d = evaluateLoginAttempt({ user: activeUser, account: activeAccount, passwordMatches: false, now: NOW });
    expect(d.outcome).toBe('DENY_GENERIC');
  });

  it('cuenta inexistente (dato corrupto): rechazo genérico', () => {
    const d = evaluateLoginAttempt({ user: activeUser, account: null, passwordMatches: true, now: NOW });
    expect(d.outcome).toBe('DENY_GENERIC');
  });

  it('cuenta CANCELLED: rechazo genérico total', () => {
    const account: AccountStatusRow = { idAccount: 100, status: 'CANCELLED' };
    const d = evaluateLoginAttempt({ user: activeUser, account, passwordMatches: true, now: NOW });
    expect(d.outcome).toBe('DENY_GENERIC');
  });

  it('cuenta EXPIRED (trial vencido): rechazo genérico total', () => {
    const account: AccountStatusRow = { idAccount: 100, status: 'EXPIRED' };
    const d = evaluateLoginAttempt({ user: activeUser, account, passwordMatches: true, now: NOW });
    expect(d.outcome).toBe('DENY_GENERIC');
  });

  it('cuenta SUSPENDED: permite login en modo lectura (RF-107/CA-107.1)', () => {
    const account: AccountStatusRow = { idAccount: 100, status: 'SUSPENDED' };
    const d = evaluateLoginAttempt({ user: activeUser, account, passwordMatches: true, now: NOW });
    expect(d).toEqual({ outcome: 'ALLOW', readOnly: true });
  });

  it('cuenta ACTIVE: permite login sin restricciones', () => {
    const d = evaluateLoginAttempt({ user: activeUser, account: activeAccount, passwordMatches: true, now: NOW });
    expect(d).toEqual({ outcome: 'ALLOW', readOnly: false });
  });

  it('cuenta TRIAL: permite login sin restricciones', () => {
    const account: AccountStatusRow = { idAccount: 100, status: 'TRIAL' };
    const d = evaluateLoginAttempt({ user: activeUser, account, passwordMatches: true, now: NOW });
    expect(d).toEqual({ outcome: 'ALLOW', readOnly: false });
  });
});

describe('shouldLockAfterFailedAttempt', () => {
  it('no bloquea antes del quinto intento', () => {
    expect(shouldLockAfterFailedAttempt(0, 5)).toBe(false);
    expect(shouldLockAfterFailedAttempt(3, 5)).toBe(false);
  });

  it('bloquea justo en el quinto intento consecutivo (CA-201.2)', () => {
    expect(shouldLockAfterFailedAttempt(4, 5)).toBe(true);
  });
});

describe('computeLockedUntil', () => {
  it('calcula 15 minutos hacia adelante', () => {
    const until = computeLockedUntil(NOW, 15);
    expect(until.toISOString()).toBe('2026-09-22T10:15:00.000Z');
  });
});
