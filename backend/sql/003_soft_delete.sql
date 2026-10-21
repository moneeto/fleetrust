-- Logical delete. Rows stay so existing reservations keep their references.
USE `fleetrust`;

ALTER TABLE experiences ADD COLUMN deleted TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE routes ADD COLUMN deleted TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE addons ADD COLUMN deleted TINYINT(1) NOT NULL DEFAULT 0;
