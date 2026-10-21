-- One catalog for experiences and routes. Old tables stay. Reservations keep their old ids.
USE `fleetrust`;

CREATE TABLE IF NOT EXISTS services (
  idService INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(255) DEFAULT NULL,
  title VARCHAR(255) DEFAULT NULL,
  description LONGTEXT,
  image VARCHAR(255) DEFAULT NULL,
  duration VARCHAR(100) DEFAULT NULL,
  durationMinutes INT DEFAULT NULL,
  visibleToClients TINYINT(1) NOT NULL DEFAULT 1,
  minDaysAhead INT NOT NULL DEFAULT 1,
  maxDaysAhead INT NOT NULL DEFAULT 31,
  allowedWeekdays LONGTEXT NOT NULL,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (idService)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS services_prices (
  idService INT NOT NULL,
  passengers INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (idService, passengers)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS services_hours (
  idService INT NOT NULL,
  hour TIME NOT NULL,
  PRIMARY KEY (idService, hour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS services_addons (
  idServiceAddon INT NOT NULL AUTO_INCREMENT,
  idService INT NOT NULL,
  idAddon INT NOT NULL,
  PRIMARY KEY (idServiceAddon),
  KEY services_addons_service (idService),
  KEY services_addons_addon (idAddon)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO services (
  idService, code, title, description, image, duration, durationMinutes,
  visibleToClients, minDaysAhead, maxDaysAhead, allowedWeekdays, deleted
)
SELECT
  idExperience, code, title, description, image, NULL, NULL,
  1, minDaysAhead, maxDaysAhead, allowedWeekdays, deleted
FROM experiences
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.idService = experiences.idExperience);

INSERT INTO services (
  idService, code, title, description, image, duration, durationMinutes,
  visibleToClients, minDaysAhead, maxDaysAhead, allowedWeekdays, deleted
)
SELECT
  idRoute + 100, code, title, description, image, duration, durationMinutes,
  IFNULL(visibleToClients, 1), minDaysAhead, maxDaysAhead, allowedWeekdays, deleted
FROM routes
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.idService = routes.idRoute + 100);

INSERT IGNORE INTO services_prices (idService, passengers, price)
SELECT idExperience, passengers, price FROM experience_prices;

INSERT IGNORE INTO services_prices (idService, passengers, price)
SELECT idRoute + 100, passengers, price FROM route_prices;

INSERT IGNORE INTO services_hours (idService, hour)
SELECT idExperience, hour FROM experience_hours;

INSERT IGNORE INTO services_hours (idService, hour)
SELECT idRoute + 100, hour FROM route_hours;

INSERT INTO services_addons (idService, idAddon)
SELECT ea.idExperience, ea.idAddon
FROM experiences_addons ea
WHERE NOT EXISTS (
  SELECT 1 FROM services_addons sa
  WHERE sa.idService = ea.idExperience AND sa.idAddon = ea.idAddon
);

SET @has_id_service := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'fleetrust' AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'idService'
);
SET @add_id_service := IF(@has_id_service = 0, 'ALTER TABLE reservations ADD COLUMN idService INT NULL', 'SELECT 1');
PREPARE add_id_service_stmt FROM @add_id_service;
EXECUTE add_id_service_stmt;
DEALLOCATE PREPARE add_id_service_stmt;

UPDATE reservations
SET idService = idExperience
WHERE idExperience IS NOT NULL AND idService IS NULL;

UPDATE reservations
SET idService = idRoute + 100
WHERE idService IS NULL AND idRoute IS NOT NULL;

ALTER TABLE services AUTO_INCREMENT = 200;
