-- Remaining mixed-case table names.
USE `fleetrust`;

RENAME TABLE
  availableHours TO available_hours,
  discrepanciesfiles TO discrepancies_files,
  workorders TO work_orders;
