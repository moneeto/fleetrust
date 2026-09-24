import type { RequestHandler } from 'express';

/** RF-107/CA-107.1: cuenta SUSPENDED permite login y lectura, pero ninguna escritura.
 *  RF-410: una sesión suplantada tampoco escribe. RF-208: hay que cambiar la contraseña antes. */
export const requireAccountWritable: RequestHandler = (req, res, next) => {
  if (req.context?.modoSuplantacion) {
    res.status(403).json({
      code: 'impersonation.readOnly',
      message: 'Estás en modo suplantación: podés mirar, no modificar.',
    });
    return;
  }
  if (req.context?.mustChangePassword) {
    res.status(403).json({
      code: 'auth.mustChangePassword',
      message: 'Tenés que cambiar la contraseña antes de seguir.',
    });
    return;
  }
  if (req.context?.accountStatus === 'SUSPENDED') {
    res.status(403).json({
      code: 'account.readOnly',
      message: 'La cuenta está suspendida. Contactá a tu administrador para reactivarla.',
    });
    return;
  }
  next();
};
