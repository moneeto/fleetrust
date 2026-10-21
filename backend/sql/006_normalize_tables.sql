-- Drop the pre-services catalog. Rename mixed-case tables to snake_case.
USE `fleetrust`;

ALTER TABLE reservations DROP FOREIGN KEY reservations_ibfk_1;

DROP TABLE IF EXISTS experiences_addons;
DROP TABLE IF EXISTS experience_hours;
DROP TABLE IF EXISTS experience_prices;
DROP TABLE IF EXISTS route_hours;
DROP TABLE IF EXISTS route_prices;
DROP TABLE IF EXISTS experiences;
DROP TABLE IF EXISTS availablehours;

RENAME TABLE
  aircraftmanuals TO aircraft_manuals,
  aircraftmanufacturers TO aircraft_manufacturers,
  cancellationReasons TO cancellation_reasons,
  partsused TO parts_used,
  reservationsAddons TO reservations_addons,
  workorderdiscrepancies TO work_order_discrepancies,
  workorderinfo TO work_order_info,
  workordertypes TO work_order_types;
