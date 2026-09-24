import type { Pool } from 'mysql2/promise';
import { z } from 'zod';
import { writeAuditLog } from '../audit/audit.repository.js';
import { requireAccountWritable } from '../auth/require-account-writable.middleware.js';
import type { Mailer } from '../mail/mailer.js';
import { config } from '../config.js';
import { createBookingsRepository } from '../repositories/bookings.repository.js';
import { createFleetRepository } from '../repositories/fleet.repository.js';
import { createHoursRepository } from '../repositories/hours.repository.js';
import { createProfessionalsRepository } from '../repositories/professionals.repository.js';
import { createGuardedRouter } from './guarded-router.js';

const dataType = z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT']);
const range = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}/),
  endTime: z.string().regex(/^\d{2}:\d{2}/),
});

export function createOperationsRoutes(pool: Pool, mailer: Mailer) {
  const router = createGuardedRouter();
  const fleet = createFleetRepository(pool);
  const professionals = createProfessionalsRepository(pool);
  const hours = createHoursRepository(pool);
  const bookings = createBookingsRepository(pool);

  router.get('/api/fleet/types', { permission: 'fleet.read' }, async (req, res) => {
    res.json({ items: await fleet.listTypes(req.context!.idAccount) });
  });
  router.post('/api/fleet/types', { permission: 'fleet.configure' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({ code: z.string().min(2).max(50), name: z.string().min(1).max(150) }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'El tipo necesita código y nombre.');
    try {
      const id = await fleet.insertType(req.context!.idAccount, parsed.data);
      res.status(201).json({ id });
    } catch (err) {
      if (duplicate(err)) return fail(res, 'Ya hay un tipo con ese código.');
      throw err;
    }
  });
  router.patch('/api/fleet/types/:idFleetType', { permission: 'fleet.configure' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({ name: z.string().min(1).max(150).optional(), isActive: z.boolean().optional() }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'Datos del tipo inválidos.');
    await fleet.updateType(req.context!.idAccount, Number(req.params.idFleetType), parsed.data);
    res.status(204).end();
  });

  router.get('/api/fleet/attributes', { permission: 'fleet.read' }, async (req, res) => {
    res.json({ items: await fleet.listAttributes(req.context!.idAccount) });
  });
  router.post('/api/fleet/attributes', { permission: 'fleet.configure' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({
      idFleetType: z.number().int().positive().nullable(),
      code: z.string().regex(/^[a-z][a-z0-9]{1,48}$/),
      label: z.string().min(1).max(100),
      dataType,
      options: z.array(z.string().min(1)).nullable(),
      isRequired: z.boolean(),
      unit: z.string().max(20).nullable(),
      showInList: z.boolean(),
    }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'El código del atributo va en minúsculas, sin espacios.');
    if (parsed.data.dataType === 'SELECT' && (!parsed.data.options || parsed.data.options.length === 0)) {
      return fail(res, 'Un atributo de lista necesita al menos una opción.');
    }
    const result = await fleet.insertAttribute(req.context!.idAccount, parsed.data);
    if (!result.ok) return fail(res, result.message);
    res.status(201).json({ id: result.id });
  });
  router.delete('/api/fleet/attributes/:idFleetAttribute', { permission: 'fleet.configure' }, requireAccountWritable, async (req, res) => {
    const affected = await fleet.deleteAttribute(req.context!.idAccount, Number(req.params.idFleetAttribute));
    if (affected === 0) { res.status(404).json({ code: 'notFound', message: 'No se encontró el atributo.' }); return; }
    res.status(204).end();
  });

  router.get('/api/fleet/units', { permission: 'fleet.read' }, async (req, res) => {
    res.json({ items: await fleet.listUnits(req.context!.idAccount) });
  });
  router.post('/api/fleet/units', { permission: 'fleet.write' }, requireAccountWritable, async (req, res) => {
    await saveUnit(req, res, null);
  });
  router.patch('/api/fleet/units/:idFleetUnit', { permission: 'fleet.write' }, requireAccountWritable, async (req, res) => {
    await saveUnit(req, res, Number(req.params.idFleetUnit));
  });
  router.post('/api/fleet/units/:idFleetUnit/deactivate', { permission: 'fleet.write' }, requireAccountWritable, async (req, res) => {
    const id = Number(req.params.idFleetUnit);
    const future = await fleet.futureBookingCount(req.context!.idAccount, 'idFleetUnit', id);
    if (future > 0) {
      res.status(409).json({ code: 'fleet.futureBookings', message: `Tiene ${future} reserva(s) futura(s). Resolvelas antes de darla de baja.`, futureBookings: future, listPath: `/reservas?unit=${id}` });
      return;
    }
    const affected = await fleet.setUnitDeleted(req.context!.idAccount, id, true, req.context!.idUser);
    if (affected === 0) { res.status(404).json({ code: 'notFound', message: 'No se encontró la unidad.' }); return; }
    res.status(204).end();
  });
  router.post('/api/fleet/units/:idFleetUnit/restore', { permission: 'fleet.write' }, requireAccountWritable, async (req, res) => {
    const affected = await fleet.setUnitDeleted(req.context!.idAccount, Number(req.params.idFleetUnit), false, req.context!.idUser);
    if (affected === 0) { res.status(404).json({ code: 'notFound', message: 'No se encontró la unidad.' }); return; }
    res.status(204).end();
  });

  router.get('/api/professionals', { permission: 'professionals.read' }, async (req, res) => {
    res.json({ items: await professionals.list(req.context!.idAccount) });
  });
  router.post('/api/professionals', { permission: 'professionals.write' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({
      name: z.string().min(1).max(150),
      surname: z.string().min(1).max(150),
      phone: z.string().max(50).nullable(),
      createUser: z.boolean(),
      email: z.string().email().nullable(),
    }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'Nombre y apellido son obligatorios.');
    const result = await professionals.create(req.context!.idAccount, { ...parsed.data, actorId: req.context!.idUser, locale: 'es-AR' });
    if (!result.ok) return fail(res, result.message);
    if (result.invitationToken && parsed.data.email) {
      const link = `${config.publicUrl}/invitacion?token=${result.invitationToken}`;
      await mailer.send({
        to: parsed.data.email,
        subject: 'Invitación a Fleetrust',
        text: `Te dieron acceso como profesional. Entrá en ${link} y elegí una contraseña. El acceso es por ${config.publicUrl}.`,
      }).catch(() => undefined);
    }
    res.status(201).json({ id: result.idProfessional, invitationSent: Boolean(result.invitationToken) });
  });
  router.patch('/api/professionals/:idProfessional', { permission: 'professionals.write' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({
      name: z.string().min(1).max(150),
      surname: z.string().min(1).max(150),
      phone: z.string().max(50).nullable(),
      isActive: z.boolean(),
    }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'Datos del profesional inválidos.');
    const affected = await professionals.update(req.context!.idAccount, Number(req.params.idProfessional), { ...parsed.data, actorId: req.context!.idUser });
    if (affected === 0) { res.status(404).json({ code: 'notFound', message: 'No se encontró el profesional.' }); return; }
    res.status(204).end();
  });
  router.post('/api/professionals/:idProfessional/deactivate', { permission: 'professionals.write' }, requireAccountWritable, async (req, res) => {
    const id = Number(req.params.idProfessional);
    const future = await fleet.futureBookingCount(req.context!.idAccount, 'idProfessional', id);
    if (future > 0) {
      res.status(409).json({ code: 'professionals.futureBookings', message: `Tiene ${future} reserva(s) futura(s). Resolvelas antes de darlo de baja.`, futureBookings: future, listPath: `/reservas?professional=${id}` });
      return;
    }
    const affected = await professionals.setDeleted(req.context!.idAccount, id, true, req.context!.idUser);
    if (affected === 0) { res.status(404).json({ code: 'notFound', message: 'No se encontró el profesional.' }); return; }
    res.status(204).end();
  });
  router.post('/api/professionals/:idProfessional/restore', { permission: 'professionals.write' }, requireAccountWritable, async (req, res) => {
    const affected = await professionals.setDeleted(req.context!.idAccount, Number(req.params.idProfessional), false, req.context!.idUser);
    if (affected === 0) { res.status(404).json({ code: 'notFound', message: 'No se encontró el profesional.' }); return; }
    res.status(204).end();
  });
  router.get('/api/professionals/:idProfessional/hours', { permission: 'professionals.read' }, async (req, res) => {
    res.json({ items: await professionals.listHours(req.context!.idAccount, Number(req.params.idProfessional)) });
  });
  router.put('/api/professionals/:idProfessional/hours', { permission: 'professionals.write' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({ ranges: z.array(range) }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'Los horarios del profesional son inválidos.');
    const affected = await professionals.replaceHours(req.context!.idAccount, Number(req.params.idProfessional), parsed.data.ranges);
    if (affected === 0) { res.status(404).json({ code: 'notFound', message: 'No se encontró el profesional.' }); return; }
    res.status(204).end();
  });

  router.get('/api/hours', { permission: 'hours.read' }, async (req, res) => {
    res.json(await hours.get(req.context!.idAccount));
  });
  router.put('/api/hours', { permission: 'hours.write' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({
      slotGranularityMinutes: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(120)]),
      defaultMinLeadMinutes: z.number().int().min(0).nullable(),
      defaultMaxLeadDays: z.number().int().min(0).nullable(),
      ranges: z.array(range),
      confirm: z.boolean().optional(),
    }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'La grilla horaria es inválida. La granularidad puede ser 15, 30, 60 o 120 minutos.');
    const result = await hours.save(req.context!.idAccount, { ...parsed.data, confirm: parsed.data.confirm === true });
    if (!result.ok) {
      res.status(409).json({ code: 'hours.impactsBookings', message: 'El cambio deja reservas fuera de la grilla. Confirmá para aplicarlo.', bookings: result.bookings });
      return;
    }
    res.status(204).end();
  });
  router.get('/api/hours/preview', { permission: 'hours.read' }, async (req, res) => {
    const date = typeof req.query.date === 'string' ? req.query.date : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail(res, 'Indicá una fecha aaaa-mm-dd.');
    res.json({ slots: await hours.preview(req.context!.idAccount, date) });
  });
  router.post('/api/hours/exceptions', { permission: 'hours.write' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      isClosed: z.boolean(),
      startTime: z.string().regex(/^\d{2}:\d{2}/).nullable(),
      endTime: z.string().regex(/^\d{2}:\d{2}/).nullable(),
      label: z.string().max(150).nullable(),
    }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'La excepción necesita una fecha.');
    try {
      const id = await hours.addException(req.context!.idAccount, parsed.data);
      res.status(201).json({ id });
    } catch (err) {
      if (duplicate(err)) return fail(res, 'Ese día ya tiene una excepción.');
      throw err;
    }
  });
  router.delete('/api/hours/exceptions/:idCalendarException', { permission: 'hours.write' }, requireAccountWritable, async (req, res) => {
    const affected = await hours.deleteException(req.context!.idAccount, Number(req.params.idCalendarException));
    if (affected === 0) { res.status(404).json({ code: 'notFound', message: 'No se encontró la excepción.' }); return; }
    res.status(204).end();
  });

  router.get('/api/services', { permission: 'bookings.read' }, async (req, res) => {
    res.json({ items: await bookings.listServices(req.context!.idAccount) });
  });
  router.post('/api/services', { permission: 'bookings.write' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({
      code: z.string().min(2).max(50),
      name: z.string().min(1).max(200),
      durationMinutes: z.number().int().positive(),
    }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'El servicio necesita código, nombre y duración.');
    const result = await bookings.createService(req.context!.idAccount, parsed.data);
    if (!result.ok) return fail(res, result.message);
    res.status(201).json({ id: result.id });
  });
  router.get('/api/bookings/reasons', { permission: 'bookings.read' }, async (req, res) => {
    res.json({ items: await bookings.reasons(req.context!.idAccount) });
  });
  router.get('/api/bookings', { permission: 'bookings.read' }, async (req, res) => {
    res.json({ items: await bookings.list(req.context!.idAccount, readFilters(req.query)) });
  });
  router.post('/api/bookings', { permission: 'bookings.write' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({
      idService: z.number().int().positive(),
      idFleetUnit: z.number().int().positive(),
      idProfessional: z.number().int().positive(),
      startLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
      participantsCount: z.number().int().positive(),
      contactName: z.string().max(150).nullable(),
      contactEmail: z.string().email().nullable(),
      contactPhone: z.string().max(50).nullable(),
      notes: z.string().max(2000).nullable(),
    }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'Faltan datos de la reserva: servicio, unidad, profesional, inicio y participantes.');
    const result = await bookings.create(req.context!.idAccount, { ...parsed.data, actorId: req.context!.idUser });
    if (!result.ok) return fail(res, result.message);
    await writeAuditLog(pool, {
      idAccount: req.context!.idAccount,
      idUser: req.context!.idUser,
      idSuplantador: req.context!.idSuplantador,
      action: 'bookings.create',
      entity: 'bookings',
      idEntity: String(result.id),
      beforeJson: null,
      afterJson: { code: result.code },
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });
    res.status(201).json(result);
  });
  router.post('/api/bookings/:idBooking/cancel', { permission: 'bookings.cancel' }, requireAccountWritable, async (req, res) => {
    const parsed = z.object({ reasonCode: z.string().min(1), detail: z.string().max(500).nullable() }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'Elegí un motivo de cancelación.');
    const result = await bookings.cancel(req.context!.idAccount, Number(req.params.idBooking), { ...parsed.data, actorId: req.context!.idUser });
    if (!result.ok) {
      res.status(result.status ?? 400).json({ code: 'bookings.cancel', message: result.message });
      return;
    }
    res.status(204).end();
  });
  router.get('/api/agenda', { permission: 'agenda.read' }, async (req, res) => {
    const own = await professionals.findByUser(req.context!.idAccount, req.context!.idUser);
    const canSeeAll = req.context!.permissions.has('bookings.read');
    if (!canSeeAll && own === null) {
      res.json({ items: [] });
      return;
    }
    const filters = readFilters(req.query);
    if (!canSeeAll) filters.idProfessional = own ?? undefined;
    res.json({ items: await bookings.list(req.context!.idAccount, filters) });
  });

  return router.raw;

  async function saveUnit(req: { context?: { idAccount: number; idUser: number }; body: unknown; params: Record<string, string> }, res: { status(code: number): { json(body: unknown): void; end(): void } }, id: number | null) {
    const parsed = z.object({
      idFleetType: z.number().int().positive().nullable(),
      code: z.string().min(1).max(50),
      name: z.string().min(1).max(150),
      capacity: z.number().int().positive(),
      externalCode: z.string().max(100).nullable(),
      imageUrl: z.string().max(500).nullable(),
      isActive: z.boolean(),
      metadata: z.record(z.unknown()).nullable(),
    }).safeParse(req.body);
    if (!parsed.success) return fail(res, 'La unidad necesita código, nombre y capacidad.');
    const result = await fleet.saveUnit(req.context!.idAccount, id, { ...parsed.data, actorId: req.context!.idUser });
    if (!result.ok) return fail(res, result.message);
    res.status(id === null ? 201 : 200).json({ id: result.id });
  }
}

function readFilters(query: Record<string, unknown>) {
  const num = (value: unknown) => typeof value === 'string' && value ? Number(value) : undefined;
  return {
    from: typeof query.from === 'string' ? query.from : undefined,
    to: typeof query.to === 'string' ? query.to : undefined,
    code: typeof query.code === 'string' ? query.code : undefined,
    idFleetUnit: num(query.unit),
    idProfessional: num(query.professional),
    status: typeof query.status === 'string' ? query.status : undefined,
  };
}

function fail(res: { status(code: number): { json(body: unknown): void } }, message: string) {
  res.status(400).json({ code: 'invalid', message });
}

function duplicate(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'ER_DUP_ENTRY';
}
