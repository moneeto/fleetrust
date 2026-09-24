import type { RequestHandler } from 'express';

/** RF-307: el middleware exige el permiso de la ruta de API invocada. */
export function requirePermission(code: string): RequestHandler {
  return (req, res, next) => {
    if (!req.context) {
      res.status(401).json({ code: 'auth.required', message: 'No autenticado' });
      return;
    }
    if (!req.context.permissions.has(code)) {
      res.status(403).json({ code: 'auth.forbidden', message: 'No tenés permiso para esta acción' });
      return;
    }
    next();
  };
}
