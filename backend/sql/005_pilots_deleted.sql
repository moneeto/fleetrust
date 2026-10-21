-- Pilots list filters and soft-deletes on this column. The table did not have it yet.
USE `fleetrust`;

ALTER TABLE pilots ADD COLUMN deleted TINYINT(1) NOT NULL DEFAULT 0;
