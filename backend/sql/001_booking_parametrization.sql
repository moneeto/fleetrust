-- Booking parametrization: per-experience / per-route passengers, dates and hours.
-- Same schema as frassi-tours-landing/backend/sql/001_booking_parametrization.sql

ALTER TABLE experiences
  ADD COLUMN minDaysAhead INT NOT NULL DEFAULT 1,
  ADD COLUMN maxDaysAhead INT NOT NULL DEFAULT 31,
  ADD COLUMN allowedWeekdays JSON NOT NULL DEFAULT (CAST('[0,1,2,3,4,5,6]' AS JSON));

ALTER TABLE routes
  ADD COLUMN minDaysAhead INT NOT NULL DEFAULT 1,
  ADD COLUMN maxDaysAhead INT NOT NULL DEFAULT 31,
  ADD COLUMN allowedWeekdays JSON NOT NULL DEFAULT (CAST('[0,1,2,3,4,5,6]' AS JSON));

CREATE TABLE IF NOT EXISTS experience_prices (
  idExperience INT NOT NULL,
  passengers INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (idExperience, passengers),
  CONSTRAINT fk_experience_prices_experience
    FOREIGN KEY (idExperience) REFERENCES experiences(idExperience)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS route_prices (
  idRoute INT NOT NULL,
  passengers INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (idRoute, passengers),
  CONSTRAINT fk_route_prices_route
    FOREIGN KEY (idRoute) REFERENCES routes(idRoute)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS experience_hours (
  idExperience INT NOT NULL,
  hour TIME NOT NULL,
  PRIMARY KEY (idExperience, hour),
  CONSTRAINT fk_experience_hours_experience
    FOREIGN KEY (idExperience) REFERENCES experiences(idExperience)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS route_hours (
  idRoute INT NOT NULL,
  hour TIME NOT NULL,
  PRIMARY KEY (idRoute, hour),
  CONSTRAINT fk_route_hours_route
    FOREIGN KEY (idRoute) REFERENCES routes(idRoute)
    ON DELETE CASCADE
);

INSERT IGNORE INTO experience_prices (idExperience, passengers, price)
SELECT idExperience, 2, value2
FROM experiences
WHERE value2 IS NOT NULL;

INSERT IGNORE INTO experience_prices (idExperience, passengers, price)
SELECT idExperience, 3, value3
FROM experiences
WHERE value3 IS NOT NULL;

INSERT IGNORE INTO route_prices (idRoute, passengers, price)
SELECT idRoute, 2, value2
FROM routes
WHERE value2 IS NOT NULL;

INSERT IGNORE INTO route_prices (idRoute, passengers, price)
SELECT idRoute, 3, value3
FROM routes
WHERE value3 IS NOT NULL;

INSERT IGNORE INTO experience_hours (idExperience, hour)
SELECT e.idExperience, a.hour
FROM experiences e
CROSS JOIN availableHours a
WHERE a.active = 1
  AND e.code <> 'SUN';

INSERT IGNORE INTO experience_hours (idExperience, hour)
SELECT e.idExperience, a.hour
FROM experiences e
INNER JOIN availableHours a ON TIME_FORMAT(a.hour, '%H:%i') = '19:30'
WHERE e.code = 'SUN';

INSERT IGNORE INTO route_hours (idRoute, hour)
SELECT r.idRoute, a.hour
FROM routes r
CROSS JOIN availableHours a
WHERE a.active = 1;
