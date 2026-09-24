import type { Pool } from 'mysql2/promise';
import { z } from 'zod';
import { writeAuditLog } from '../audit/audit.repository.js';
import { requireAccountWritable } from '../auth/require-account-writable.middleware.js';
import { buildNavigation } from '../permissions/navigation.js';
import { loadAccountModules, loadMenuRoutes, loadModulesForMenu } from '../permissions/load-permission-context.js';
import { createUsersRepository } from '../repositories/users.repository.js';
import { createGuardedRouter } from './guarded-router.js';

const updateMeSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  locale: z.enum(['es-AR', 'en-US', 'pt-BR']).optional(),
});

export function createMeRoutes(pool: Pool) {
  const router = createGuardedRouter();
  const usersRepository = createUsersRepository(pool);

  // RF-704 y ficha propia: de uso general, no atada a ningún módulo de negocio.
  router.get('/api/me', { public: true }, async (req, res) => {
    const ctx = req.context!;
    const user = await usersRepository.findById(ctx.idAccount, ctx.idUser);
    if (!user) {
      res.status(404).json({ code: 'me.notFound' });
      return;
    }
    res.json({
      idUser: user.idUser,
      email: user.email,
      name: user.name,
      surname: user.surname,
      locale: user.locale,
      accountStatus: ctx.accountStatus,
      modoSuplantacion: ctx.modoSuplantacion,
      mustChangePassword: ctx.mustChangePassword,
    });
  });

  // RF-704: cambio de idioma con efecto inmediato. Es una escritura, así
  // que respeta RF-107: una cuenta SUSPENDED no puede ni esto.
  router.patch('/api/me', { public: true }, requireAccountWritable, async (req, res) => {
    const ctx = req.context!;
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'me.invalidPayload' });
      return;
    }
    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ code: 'me.emptyPayload' });
      return;
    }

    const before = await usersRepository.findById(ctx.idAccount, ctx.idUser);
    const affected = await usersRepository.update(ctx.idAccount, ctx.idUser, parsed.data);
    if (affected === 0) {
      res.status(404).json({ code: 'me.notFound' });
      return;
    }

    await writeAuditLog(pool, {
      idAccount: ctx.idAccount,
      idUser: ctx.idUser,
      idSuplantador: ctx.idSuplantador,
      action: 'me.update',
      entity: 'users',
      idEntity: String(ctx.idUser),
      beforeJson: before && { name: before.name, locale: before.locale },
      afterJson: parsed.data,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.status(204).end();
  });

  // RF-306: el árbol de menú ya filtrado. El front no decide qué mostrar.
  router.get('/api/me/navigation', { public: true }, async (req, res) => {
    const ctx = req.context!;
    const [modules, accountModules, routes] = await Promise.all([
      loadModulesForMenu(pool),
      loadAccountModules(pool, ctx.idAccount),
      loadMenuRoutes(pool),
    ]);
    const items = buildNavigation(modules, accountModules, routes, ctx.permissions);
    res.json({ items });
  });

  return router.raw;
}
