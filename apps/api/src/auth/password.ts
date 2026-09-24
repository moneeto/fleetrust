import bcrypt from 'bcryptjs';

/** RF-201: costo de bcrypt 12 o superior. */
const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Hash "señuelo" contra el que se compara cuando el email no existe, para
 * que el tiempo de respuesta no delate si el usuario existe o no
 * (CA-210.2). Se genera una sola vez, en frío, no en cada request.
 */
export const DECOY_HASH = bcrypt.hashSync('decoy-password-never-matches', COST);
