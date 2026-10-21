-- The "for me" booking and the range block use the MANUAL service instead of routes BAS and 000.
USE `fleetrust`;

INSERT INTO services (code, title, durationMinutes, visibleToClients, minDaysAhead, maxDaysAhead, allowedWeekdays)
SELECT 'MANUAL', 'Manual Booking', 60, 0, 0, 365, '[0, 1, 2, 3, 4, 5, 6]'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'MANUAL');

SET @manual := (SELECT idService FROM services WHERE code = 'MANUAL' LIMIT 1);

INSERT IGNORE INTO services_hours (idService, hour)
SELECT @manual, hour FROM available_hours;

INSERT IGNORE INTO services_prices (idService, passengers, price)
SELECT @manual, 1, COALESCE((SELECT value2 FROM routes WHERE code = 'BAS' LIMIT 1), 0);

UPDATE reservations r
JOIN routes ro ON ro.idRoute = r.idRoute
SET r.idService = @manual
WHERE ro.code = '000';

-- Fails if duplicate codes already exist: fix them by hand first.
ALTER TABLE services ADD UNIQUE KEY services_code (code);
