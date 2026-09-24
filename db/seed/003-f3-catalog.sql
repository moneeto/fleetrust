-- Catálogo de F3: permisos, rutas de menú y de API, estados de reserva.
-- Idempotente. Lo aplica el API al arrancar y, en un volumen nuevo, MySQL
-- al inicializar. Las tablas de negocio ya están en admin/db/init.sql.

CREATE TABLE IF NOT EXISTS `professional_hours` (
  `idProfessionalHour` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `idAccount`            INT UNSIGNED NOT NULL,
  `idProfessional`       INT UNSIGNED NOT NULL,
  `weekday`              TINYINT NOT NULL,
  `startTime`            TIME NOT NULL,
  `endTime`              TIME NOT NULL,
  PRIMARY KEY (`idProfessionalHour`),
  KEY `ix_professional_hours_professional` (`idProfessional`, `weekday`),
  CONSTRAINT `fk_professional_hours_account` FOREIGN KEY (`idAccount`)
    REFERENCES `accounts` (`idAccount`) ON DELETE RESTRICT,
  CONSTRAINT `fk_professional_hours_professional` FOREIGN KEY (`idProfessional`)
    REFERENCES `professionals` (`idProfessional`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `permissions` (`idModule`, `code`, `i18nKey`)
SELECT m.idModule, v.code, v.i18nKey
FROM (
  SELECT 'fleet' AS moduleCode, 'fleet.read' AS code, 'permissions.fleet.read' AS i18nKey UNION ALL
  SELECT 'fleet', 'fleet.write', 'permissions.fleet.write' UNION ALL
  SELECT 'fleet', 'fleet.configure', 'permissions.fleet.configure' UNION ALL
  SELECT 'professionals', 'professionals.read', 'permissions.professionals.read' UNION ALL
  SELECT 'professionals', 'professionals.write', 'permissions.professionals.write' UNION ALL
  SELECT 'hours', 'hours.read', 'permissions.hours.read' UNION ALL
  SELECT 'hours', 'hours.write', 'permissions.hours.write' UNION ALL
  SELECT 'bookings', 'bookings.read', 'permissions.bookings.read' UNION ALL
  SELECT 'bookings', 'bookings.write', 'permissions.bookings.write' UNION ALL
  SELECT 'bookings', 'bookings.cancel', 'permissions.bookings.cancel' UNION ALL
  SELECT 'bookings', 'agenda.read', 'permissions.agenda.read'
) v
JOIN `modules` m ON m.code = v.moduleCode
WHERE NOT EXISTS (SELECT 1 FROM `permissions` p WHERE p.code = v.code);

INSERT INTO `module_routes` (`idModule`, `routeType`, `path`, `httpMethod`, `idPermission`, `showInMenu`, `sortOrder`, `i18nKey`)
SELECT m.idModule, 'UI', v.path, NULL, p.idPermission, 1, v.sortOrder, v.i18nKey
FROM (
  SELECT 'fleet' AS moduleCode, '/flota' AS path, 'fleet.read' AS permissionCode, 40 AS sortOrder, 'fleet' AS i18nKey UNION ALL
  SELECT 'professionals', '/profesionales', 'professionals.read', 50, 'professionals' UNION ALL
  SELECT 'hours', '/horarios', 'hours.read', 60, 'hours' UNION ALL
  SELECT 'bookings', '/reservas', 'bookings.read', 30, 'bookings' UNION ALL
  SELECT 'bookings', '/agenda', 'agenda.read', 35, 'agenda'
) v
JOIN `modules` m ON m.code = v.moduleCode
JOIN `permissions` p ON p.code = v.permissionCode
WHERE NOT EXISTS (
  SELECT 1 FROM `module_routes` mr WHERE mr.routeType = 'UI' AND mr.path = v.path
);

INSERT INTO `module_routes` (`idModule`, `routeType`, `path`, `httpMethod`, `idPermission`, `showInMenu`, `sortOrder`, `i18nKey`)
SELECT m.idModule, 'API', v.path, v.httpMethod, p.idPermission, 0, 0, NULL
FROM (
  SELECT 'fleet' AS moduleCode, 'GET' AS httpMethod, '/api/fleet/types' AS path, 'fleet.read' AS permissionCode UNION ALL
  SELECT 'fleet', 'POST', '/api/fleet/types', 'fleet.configure' UNION ALL
  SELECT 'fleet', 'PATCH', '/api/fleet/types/:idFleetType', 'fleet.configure' UNION ALL
  SELECT 'fleet', 'GET', '/api/fleet/attributes', 'fleet.read' UNION ALL
  SELECT 'fleet', 'POST', '/api/fleet/attributes', 'fleet.configure' UNION ALL
  SELECT 'fleet', 'DELETE', '/api/fleet/attributes/:idFleetAttribute', 'fleet.configure' UNION ALL
  SELECT 'fleet', 'GET', '/api/fleet/units', 'fleet.read' UNION ALL
  SELECT 'fleet', 'POST', '/api/fleet/units', 'fleet.write' UNION ALL
  SELECT 'fleet', 'PATCH', '/api/fleet/units/:idFleetUnit', 'fleet.write' UNION ALL
  SELECT 'fleet', 'POST', '/api/fleet/units/:idFleetUnit/deactivate', 'fleet.write' UNION ALL
  SELECT 'fleet', 'POST', '/api/fleet/units/:idFleetUnit/restore', 'fleet.write' UNION ALL
  SELECT 'professionals', 'GET', '/api/professionals', 'professionals.read' UNION ALL
  SELECT 'professionals', 'POST', '/api/professionals', 'professionals.write' UNION ALL
  SELECT 'professionals', 'PATCH', '/api/professionals/:idProfessional', 'professionals.write' UNION ALL
  SELECT 'professionals', 'POST', '/api/professionals/:idProfessional/deactivate', 'professionals.write' UNION ALL
  SELECT 'professionals', 'POST', '/api/professionals/:idProfessional/restore', 'professionals.write' UNION ALL
  SELECT 'professionals', 'GET', '/api/professionals/:idProfessional/hours', 'professionals.read' UNION ALL
  SELECT 'professionals', 'PUT', '/api/professionals/:idProfessional/hours', 'professionals.write' UNION ALL
  SELECT 'hours', 'GET', '/api/hours', 'hours.read' UNION ALL
  SELECT 'hours', 'PUT', '/api/hours', 'hours.write' UNION ALL
  SELECT 'hours', 'GET', '/api/hours/preview', 'hours.read' UNION ALL
  SELECT 'hours', 'POST', '/api/hours/exceptions', 'hours.write' UNION ALL
  SELECT 'hours', 'DELETE', '/api/hours/exceptions/:idCalendarException', 'hours.write' UNION ALL
  SELECT 'bookings', 'GET', '/api/services', 'bookings.read' UNION ALL
  SELECT 'bookings', 'POST', '/api/services', 'bookings.write' UNION ALL
  SELECT 'bookings', 'GET', '/api/bookings/reasons', 'bookings.read' UNION ALL
  SELECT 'bookings', 'GET', '/api/bookings', 'bookings.read' UNION ALL
  SELECT 'bookings', 'POST', '/api/bookings', 'bookings.write' UNION ALL
  SELECT 'bookings', 'POST', '/api/bookings/:idBooking/cancel', 'bookings.cancel' UNION ALL
  SELECT 'bookings', 'GET', '/api/agenda', 'agenda.read'
) v
JOIN `modules` m ON m.code = v.moduleCode
JOIN `permissions` p ON p.code = v.permissionCode
WHERE NOT EXISTS (
  SELECT 1 FROM `module_routes` mr
  WHERE mr.routeType = 'API' AND mr.path = v.path AND mr.httpMethod = v.httpMethod
);

INSERT INTO `role_permissions` (`idRole`, `idPermission`)
SELECT r.idRole, p.idPermission
FROM `roles` r
JOIN `permissions` p ON (
  (r.code IN ('OWNER', 'ADMIN') AND p.code IN (
    'fleet.read','fleet.write','fleet.configure',
    'professionals.read','professionals.write',
    'hours.read','hours.write',
    'bookings.read','bookings.write','bookings.cancel','agenda.read'
  ))
  OR (r.code = 'OPERATOR' AND p.code IN (
    'fleet.read','fleet.write','professionals.read','hours.read',
    'bookings.read','bookings.write','bookings.cancel','agenda.read'
  ))
  OR (r.code = 'VIEWER' AND p.code IN (
    'fleet.read','professionals.read','hours.read','bookings.read','agenda.read'
  ))
  OR (r.code = 'PROFESSIONAL' AND p.code = 'agenda.read')
)
WHERE r.scope = 'ACCOUNT'
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.idRole = r.idRole AND rp.idPermission = p.idPermission
  );

INSERT INTO `booking_statuses` (`idAccount`, `code`, `i18nKey`, `color`, `sortOrder`, `isDefault`, `isFinal`)
SELECT a.idAccount, v.code, v.i18nKey, v.color, v.sortOrder, v.isDefault, v.isFinal
FROM `accounts` a
JOIN (
  SELECT 'PENDING' AS code, 'bookings.status.pending' AS i18nKey, '#1D6FEA' AS color, 10 AS sortOrder, 0 AS isDefault, 0 AS isFinal UNION ALL
  SELECT 'CONFIRMED', 'bookings.status.confirmed', '#1F8A4C', 20, 1, 0 UNION ALL
  SELECT 'CANCELLED', 'bookings.status.cancelled', '#C0392B', 30, 0, 1 UNION ALL
  SELECT 'COMPLETED', 'bookings.status.completed', '#5C6B7A', 40, 0, 1 UNION ALL
  SELECT 'NO_SHOW', 'bookings.status.noShow', '#C47B00', 50, 0, 1
) v
WHERE NOT EXISTS (
  SELECT 1 FROM `booking_statuses` s WHERE s.idAccount = a.idAccount AND s.code = v.code
);

INSERT INTO `booking_status_transitions` (`idAccount`, `idFromStatus`, `idToStatus`)
SELECT src.idAccount, src.idBookingStatus, dst.idBookingStatus
FROM `booking_statuses` src
JOIN `booking_statuses` dst ON dst.idAccount = src.idAccount
JOIN (
  SELECT 'PENDING' AS fromCode, 'CONFIRMED' AS toCode UNION ALL
  SELECT 'PENDING', 'CANCELLED' UNION ALL
  SELECT 'CONFIRMED', 'CANCELLED' UNION ALL
  SELECT 'CONFIRMED', 'COMPLETED' UNION ALL
  SELECT 'CONFIRMED', 'NO_SHOW'
) v ON v.fromCode = src.code AND v.toCode = dst.code
WHERE NOT EXISTS (
  SELECT 1 FROM `booking_status_transitions` t
  WHERE t.idFromStatus = src.idBookingStatus AND t.idToStatus = dst.idBookingStatus
);

INSERT INTO `cancellation_reasons` (`idAccount`, `code`, `i18nKey`, `requiresDetail`, `isActive`, `sortOrder`)
SELECT a.idAccount, v.code, v.i18nKey, v.requiresDetail, 1, v.sortOrder
FROM `accounts` a
JOIN (
  SELECT 'CLIENT' AS code, 'bookings.reason.client' AS i18nKey, 0 AS requiresDetail, 10 AS sortOrder UNION ALL
  SELECT 'OPERATION', 'bookings.reason.operation', 0, 20 UNION ALL
  SELECT 'OTHER', 'bookings.reason.other', 1, 30
) v
WHERE NOT EXISTS (
  SELECT 1 FROM `cancellation_reasons` r WHERE r.idAccount = a.idAccount AND r.code = v.code
);
