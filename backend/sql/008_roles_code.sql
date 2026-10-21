-- Login reads roles.code (ADM for the administrator). The init dump did not have the column.
USE `fleetrust`;

ALTER TABLE roles ADD COLUMN IF NOT EXISTS code varchar(16) DEFAULT NULL;

UPDATE roles SET code = 'ADM' WHERE code IS NULL AND role LIKE 'ADMIN%';
