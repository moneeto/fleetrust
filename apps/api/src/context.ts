/**
 * Contexto de request autenticada (RF-102).
 *
 * `idAccount` sale siempre del token de sesión, nunca de un parámetro, una
 * cabecera o el cuerpo de la petición. Este tipo es la única forma en la que
 * el resto del código conoce la cuenta activa: no existe ningún otro camino
 * legítimo para obtenerla.
 */
export interface RequestContext {
  idAccount: number;
  idUser: number;
  /** Códigos de permiso efectivos del usuario (unión de sus perfiles, 8.1). */
  permissions: Set<string>;
  /** Estado de la cuenta en el momento de resolver la sesión (RF-107/EXPIRED). */
  accountStatus: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  surface: 'BACKOFFICE';
  modoSuplantacion: boolean;
  idSuplantador: number | null;
  mustChangePassword: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}
