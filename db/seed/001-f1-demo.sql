-- Datos semilla de F1 — SOLO para desarrollo y pruebas manuales.
--
-- No es una migración (el esquema lo versiona fleetrust-admin, AD3) ni datos
-- reales de cliente (eso lo crea RF-403 desde admin.fleetrust.io en F2).
-- Es la cuenta que el plan de entrega pide para F1: "se crea una cuenta por
-- SQL, un usuario entra por app.fleetrust.io y ve un menú construido desde
-- la base". Corre una sola vez, sobre la base ya inicializada con
-- ../../../admin/db/init.sql.
--
-- Contraseña de los dos usuarios: Fleetrust2026!  (bcrypt, costo 12)
--
-- No se siembra ningún permiso ni module_routes todavía: los 9 módulos de
-- negocio recién tienen pantallas a partir de F3 (Fleet/Professionals/
-- Hours/Bookings), F4 (Book Dates) y F5 (Calendar). Por eso, con este seed,
-- el menú de `GET /api/me/navigation` sale vacío para cualquier perfil —
-- es el resultado correcto para F1, no un bug: no hay nada de negocio para
-- mostrar todavía. El motor de permisos y de menú están probados a fondo
-- en `permissions/*.test.ts` con fixtures propios.

-- -----------------------------------------------------------------------------
-- 1. Catálogo de módulos (RF-301): los 9 de negocio de la sección 10/11.
-- -----------------------------------------------------------------------------
INSERT INTO `modules` (`code`, `i18nKey`, `icon`, `isCore`, `sortOrder`, `status`, `description_i18nKey`) VALUES
  ('calendar',      'modules.calendar.label',      'calendar',       1, 10, 'ACTIVE', 'modules.calendar.description'),
  ('book-dates',    'modules.bookDates.label',     'calendar-plus',  1, 20, 'ACTIVE', 'modules.bookDates.description'),
  ('bookings',      'modules.bookings.label',      'clipboard-list', 1, 30, 'ACTIVE', 'modules.bookings.description'),
  ('fleet',         'modules.fleet.label',         'truck',          1, 40, 'ACTIVE', 'modules.fleet.description'),
  ('professionals', 'modules.professionals.label', 'user',           1, 50, 'ACTIVE', 'modules.professionals.description'),
  ('hours',         'modules.hours.label',         'clock',          1, 60, 'ACTIVE', 'modules.hours.description'),
  ('addons',        'modules.addons.label',        'plus-circle',    0, 70, 'ACTIVE', 'modules.addons.description'),
  ('reports',       'modules.reports.label',       'bar-chart',      0, 80, 'ACTIVE', 'modules.reports.description'),
  ('clients',       'modules.clients.label',       'users',          0, 90, 'ACTIVE', 'modules.clients.description');

-- -----------------------------------------------------------------------------
-- 2. Cuenta demo (equivalente a lo que RF-403 automatiza desde F2).
-- -----------------------------------------------------------------------------
INSERT INTO `accounts`
  (`code`, `name`, `status`, `defaultLocale`, `timezone`, `currency`, `firstDayOfWeek`)
VALUES
  ('demo', 'Cuenta demo Fleetrust', 'ACTIVE', 'es-AR', 'America/Argentina/Buenos_Aires', 'ARS', 1);

SET @idAccountDemo = (SELECT `idAccount` FROM `accounts` WHERE `code` = 'demo');

-- Los 6 módulos núcleo no necesitan fila en account_modules (isCore=1 basta,
-- ver 8.1). Se deja constancia igual, a modo de "contratado explícito",
-- porque así lo va a hacer RF-403 en F2 al dar de alta un cliente real.
INSERT INTO `account_modules` (`idAccount`, `idModule`, `enabled`)
SELECT @idAccountDemo, `idModule`, 1 FROM `modules` WHERE `isCore` = 1;

-- -----------------------------------------------------------------------------
-- 3. Perfiles de sistema de la cuenta demo (RF-304). Se crean por cuenta,
--    no se comparte una fila global entre cuentas: cada cuenta tiene su
--    propia copia para poder tener su propio role_permissions.
-- -----------------------------------------------------------------------------
INSERT INTO `roles` (`idAccount`, `scope`, `code`, `name`, `description`, `isSystem`) VALUES
  (@idAccountDemo, 'ACCOUNT', 'OWNER',        'Propietario',  'Todos los permisos de la cuenta',        1),
  (@idAccountDemo, 'ACCOUNT', 'ADMIN',        'Administrador','Gestión operativa de la cuenta',         1),
  (@idAccountDemo, 'ACCOUNT', 'OPERATOR',     'Operador',     'Uso diario, sin configuración',          1),
  (@idAccountDemo, 'ACCOUNT', 'VIEWER',       'Solo lectura', 'Consulta únicamente',                    1),
  (@idAccountDemo, 'ACCOUNT', 'PROFESSIONAL', 'Profesional',  'Consulta de su propia agenda únicamente',1);

-- -----------------------------------------------------------------------------
-- 4. Usuarios demo. Contraseña para los dos: Fleetrust2026!
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`idAccount`, `email`, `emailVerifiedAt`, `passwordHash`, `name`, `surname`, `locale`, `status`)
VALUES
  (@idAccountDemo, 'owner@demo.fleetrust.io', NOW(), '$2a$12$Dozj7JuH9Ybvib.XVUFW6uKjRzzS1YMiWhTh2LikOkWHeVpVWoamy', 'Ana', 'Propietaria', 'es-AR', 'ACTIVE'),
  (@idAccountDemo, 'operador@demo.fleetrust.io', NOW(), '$2a$12$sBAapzw7uzxEZ63Xa7lR3.iEfLvEGruLY.OqsH3atjAQNozIcOayO', 'Beto', 'Operador', 'es-AR', 'ACTIVE');

INSERT INTO `user_roles` (`idUser`, `idRole`)
SELECT u.`idUser`, r.`idRole`
FROM `users` u JOIN `roles` r ON r.`idAccount` = u.`idAccount`
WHERE u.`email` = 'owner@demo.fleetrust.io' AND r.`code` = 'OWNER';

INSERT INTO `user_roles` (`idUser`, `idRole`)
SELECT u.`idUser`, r.`idRole`
FROM `users` u JOIN `roles` r ON r.`idAccount` = u.`idAccount`
WHERE u.`email` = 'operador@demo.fleetrust.io' AND r.`code` = 'OPERATOR';
