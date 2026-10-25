/*
SQLyog Ultimate v13.1.1 (64 bit)
MySQL - 10.11.19-MariaDB-ubu2204 : Database - fleetrust
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`fleetrust` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `fleetrust`;

/*Table structure for table `accounts` */

DROP TABLE IF EXISTS `accounts`;

CREATE TABLE `accounts` (
  `idAccount` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  `show_setup_modal` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`idAccount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `addons` */

DROP TABLE IF EXISTS `addons`;

CREATE TABLE `addons` (
  `idAddon` int(11) NOT NULL AUTO_INCREMENT,
  `addon` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `price` double DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `deleted` tinyint(1) NOT NULL DEFAULT 0,
  `idAccount` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idAddon`),
  KEY `idx_addons_account` (`idAccount`),
  CONSTRAINT `fk_addons_account` FOREIGN KEY (`idAccount`) REFERENCES `accounts` (`idAccount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `aircraft_manuals` */

DROP TABLE IF EXISTS `aircraft_manuals`;

CREATE TABLE `aircraft_manuals` (
  `idManual` int(11) NOT NULL AUTO_INCREMENT,
  `idAircraft` int(11) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idManual`),
  KEY `idAircraft` (`idAircraft`),
  CONSTRAINT `aircraftManuals_ibfk_1` FOREIGN KEY (`idAircraft`) REFERENCES `maintenance_aircrafts` (`idAircraft`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `aircraft_manufacturers` */

DROP TABLE IF EXISTS `aircraft_manufacturers`;

CREATE TABLE `aircraft_manufacturers` (
  `idManufacturer` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `country` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idManufacturer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `aircrafts` */

DROP TABLE IF EXISTS `aircrafts`;

CREATE TABLE `aircrafts` (
  `idAircraft` int(11) NOT NULL AUTO_INCREMENT,
  `aircraft` varchar(255) NOT NULL,
  `capacity` int(11) NOT NULL,
  `available` tinyint(1) DEFAULT 1,
  `registrationNumber` varchar(255) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT 0,
  `idAccount` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idAircraft`),
  KEY `idx_aircrafts_account` (`idAccount`),
  CONSTRAINT `fk_aircrafts_account` FOREIGN KEY (`idAccount`) REFERENCES `accounts` (`idAccount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `available_hours` */

DROP TABLE IF EXISTS `available_hours`;

CREATE TABLE `available_hours` (
  `hour` time DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `cancellation_reasons` */

DROP TABLE IF EXISTS `cancellation_reasons`;

CREATE TABLE `cancellation_reasons` (
  `idCancellationReason` int(11) NOT NULL AUTO_INCREMENT,
  `cancellationReason` varchar(255) NOT NULL,
  PRIMARY KEY (`idCancellationReason`),
  UNIQUE KEY `cancellationReasons_cancellationReason_IDX` (`cancellationReason`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `discrepancies_files` */

DROP TABLE IF EXISTS `discrepancies_files`;

CREATE TABLE `discrepancies_files` (
  `idFile` int(11) NOT NULL AUTO_INCREMENT,
  `idDiscrepancy` int(11) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  `isBefore` tinyint(1) DEFAULT NULL,
  `isAfter` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`idFile`),
  KEY `idDiscrepancy` (`idDiscrepancy`),
  CONSTRAINT `discrepanciesFiles_ibfk_1` FOREIGN KEY (`idDiscrepancy`) REFERENCES `work_order_discrepancies` (`idDiscrepancy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `engines` */

DROP TABLE IF EXISTS `engines`;

CREATE TABLE `engines` (
  `idEngine` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkOrder` int(11) DEFAULT NULL,
  `cylinder1` varchar(255) DEFAULT NULL,
  `cylinder3` varchar(255) DEFAULT NULL,
  `cylinder4` varchar(255) DEFAULT NULL,
  `cylinder5` varchar(255) DEFAULT NULL,
  `cylinder2` varchar(255) DEFAULT NULL,
  `cylinder6` varchar(255) DEFAULT NULL,
  `propellerModel` varchar(255) DEFAULT NULL,
  `propellerTSOH` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idEngine`),
  KEY `idWorkOrder` (`idWorkOrder`),
  CONSTRAINT `engines_ibfk_1` FOREIGN KEY (`idWorkOrder`) REFERENCES `work_orders` (`idWorkOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `instagram_posts` */

DROP TABLE IF EXISTS `instagram_posts`;

CREATE TABLE `instagram_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `brand` varchar(32) NOT NULL,
  `permalink` varchar(512) NOT NULL,
  `shortcode` varchar(64) NOT NULL,
  `media_kind` varchar(16) NOT NULL DEFAULT 'p',
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_instagram_brand_shortcode` (`brand`,`shortcode`),
  KEY `idx_instagram_brand_visible` (`brand`,`visible`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `invoices` */

DROP TABLE IF EXISTS `invoices`;

CREATE TABLE `invoices` (
  `idInvoice` int(11) NOT NULL AUTO_INCREMENT,
  `idReservation` int(11) NOT NULL,
  `invoiceDate` datetime DEFAULT NULL,
  `totalValue` decimal(10,2) NOT NULL,
  `invoiceObject` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `CustomerViewUrl` text DEFAULT NULL,
  PRIMARY KEY (`idInvoice`),
  KEY `invoices_ibfk_1` (`idReservation`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`idReservation`) REFERENCES `reservations` (`idReservation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `logs` */

DROP TABLE IF EXISTS `logs`;

CREATE TABLE `logs` (
  `idLog` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) DEFAULT NULL,
  `section` varchar(255) DEFAULT NULL,
  `function` varchar(255) DEFAULT NULL,
  `msg` longtext DEFAULT NULL,
  `logLevel` enum('INFO','ERROR') DEFAULT NULL,
  `idAccount` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idLog`),
  KEY `idUser` (`idUser`),
  KEY `idx_logs_account` (`idAccount`),
  CONSTRAINT `fk_logs_account` FOREIGN KEY (`idAccount`) REFERENCES `accounts` (`idAccount`),
  CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `maintenance_aircrafts` */

DROP TABLE IF EXISTS `maintenance_aircrafts`;

CREATE TABLE `maintenance_aircrafts` (
  `idAircraft` int(11) NOT NULL AUTO_INCREMENT,
  `idManufacturer` int(11) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `registrationNumber` varchar(255) DEFAULT NULL,
  `serialNumber` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idAircraft`),
  KEY `idManufacturer` (`idManufacturer`),
  CONSTRAINT `maintenance_aircrafts_ibfk_1` FOREIGN KEY (`idManufacturer`) REFERENCES `aircraft_manufacturers` (`idManufacturer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `otp_codes` */

DROP TABLE IF EXISTS `otp_codes`;

CREATE TABLE `otp_codes` (
  `idOtp` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `purpose` enum('REGISTER','RESET_PASSWORD') NOT NULL,
  `expiresAt` datetime NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `passwordHash` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idOtp`),
  KEY `idx_otp_email` (`email`,`purpose`,`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `parts_used` */

DROP TABLE IF EXISTS `parts_used`;

CREATE TABLE `parts_used` (
  `idPartUsed` int(11) NOT NULL AUTO_INCREMENT,
  `idDiscrepancy` int(11) DEFAULT NULL,
  `partName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idPartUsed`),
  KEY `idDiscrepancy` (`idDiscrepancy`),
  CONSTRAINT `partsUsed_ibfk_1` FOREIGN KEY (`idDiscrepancy`) REFERENCES `work_order_discrepancies` (`idDiscrepancy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `passengers` */

DROP TABLE IF EXISTS `passengers`;

CREATE TABLE `passengers` (
  `idPassenger` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `idReservation` int(11) NOT NULL,
  PRIMARY KEY (`idPassenger`),
  KEY `passengers_ibfk_1` (`idReservation`),
  CONSTRAINT `passengers_ibfk_1` FOREIGN KEY (`idReservation`) REFERENCES `reservations` (`idReservation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `passkeys` */

DROP TABLE IF EXISTS `passkeys`;

CREATE TABLE `passkeys` (
  `idPasskey` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `credentialId` varchar(512) NOT NULL,
  `publicKey` text NOT NULL,
  `counter` bigint(20) NOT NULL DEFAULT 0,
  `transports` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`idPasskey`),
  UNIQUE KEY `uniq_passkeys_credential` (`credentialId`),
  KEY `idx_passkeys_user` (`idUser`),
  CONSTRAINT `fk_passkeys_user` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `pilots` */

DROP TABLE IF EXISTS `pilots`;

CREATE TABLE `pilots` (
  `idPilot` int(11) NOT NULL AUTO_INCREMENT,
  `pilotName` varchar(255) NOT NULL,
  `pilotPicture` text DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `phoneNumber` varchar(100) DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT 0,
  `idAccount` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idPilot`),
  KEY `idx_pilots_account` (`idAccount`),
  CONSTRAINT `fk_pilots_account` FOREIGN KEY (`idAccount`) REFERENCES `accounts` (`idAccount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `recovery_codes` */

DROP TABLE IF EXISTS `recovery_codes`;

CREATE TABLE `recovery_codes` (
  `idRecovery` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `token` char(64) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`idRecovery`),
  KEY `idx_recovery_token` (`token`,`active`),
  KEY `fk_recovery_user` (`idUser`),
  CONSTRAINT `fk_recovery_user` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `reservations` */

DROP TABLE IF EXISTS `reservations`;

CREATE TABLE `reservations` (
  `idReservation` int(11) NOT NULL AUTO_INCREMENT,
  `codeReservation` bigint(20) DEFAULT NULL,
  `passengers` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `idExperience` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phoneNumber` varchar(255) DEFAULT NULL,
  `deposit` decimal(10,2) DEFAULT NULL,
  `remainingBalance` decimal(10,2) DEFAULT NULL,
  `totalValue` decimal(10,2) DEFAULT NULL,
  `idStatus` int(11) DEFAULT NULL,
  `reservationExpiration` datetime DEFAULT NULL,
  `acceptedTerms` tinyint(1) DEFAULT 0,
  `acceptedTermsTimestamp` timestamp NULL DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `idAircraft` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `confirmationHash` varchar(255) DEFAULT NULL,
  `validatedQR` tinyint(1) DEFAULT 0,
  `validatedDatetime` datetime DEFAULT NULL,
  `idCancellationReason` int(11) DEFAULT NULL,
  `cancellationDetail` varchar(255) DEFAULT NULL,
  `idPilot` int(11) DEFAULT NULL,
  `idService` int(11) DEFAULT NULL,
  `idAccount` int(11) NOT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idReservation`),
  UNIQUE KEY `codeReservation` (`codeReservation`),
  KEY `idStatus` (`idStatus`),
  KEY `reservations_ibfk_1` (`idExperience`),
  KEY `idAircraft` (`idAircraft`),
  KEY `reservations_pilots_FK` (`idPilot`),
  KEY `idx_reservations_account` (`idAccount`),
  CONSTRAINT `fk_reservations_account` FOREIGN KEY (`idAccount`) REFERENCES `accounts` (`idAccount`),
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`idStatus`) REFERENCES `status` (`idStatus`),
  CONSTRAINT `reservations_ibfk_4` FOREIGN KEY (`idAircraft`) REFERENCES `aircrafts` (`idAircraft`),
  CONSTRAINT `reservations_pilots_FK` FOREIGN KEY (`idPilot`) REFERENCES `pilots` (`idPilot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `reservations_addons` */

DROP TABLE IF EXISTS `reservations_addons`;

CREATE TABLE `reservations_addons` (
  `idRel` int(11) NOT NULL AUTO_INCREMENT,
  `idReservation` int(11) DEFAULT NULL,
  `idAddon` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`idRel`),
  KEY `idReservation` (`idReservation`),
  KEY `idAddon` (`idAddon`),
  CONSTRAINT `reservations_addons_ibfk_1` FOREIGN KEY (`idReservation`) REFERENCES `reservations` (`idReservation`),
  CONSTRAINT `reservations_addons_ibfk_2` FOREIGN KEY (`idAddon`) REFERENCES `addons` (`idAddon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `reviews` */

DROP TABLE IF EXISTS `reviews`;

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `stars` tinyint(4) NOT NULL,
  `review` text NOT NULL,
  `target` varchar(32) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_target` (`target`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `roles` */

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `idRole` int(11) NOT NULL AUTO_INCREMENT,
  `role` varchar(255) DEFAULT NULL,
  `code` varchar(16) DEFAULT NULL,
  PRIMARY KEY (`idRole`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `services` */

DROP TABLE IF EXISTS `services`;

CREATE TABLE `services` (
  `idService` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `durationMinutes` int(11) DEFAULT NULL,
  `visibleToClients` tinyint(1) NOT NULL DEFAULT 1,
  `minDaysAhead` int(11) NOT NULL DEFAULT 1,
  `maxDaysAhead` int(11) NOT NULL DEFAULT 31,
  `allowedWeekdays` longtext NOT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT 0,
  `idAccount` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idService`),
  UNIQUE KEY `uniq_services_account_code` (`idAccount`,`code`),
  KEY `idx_services_account` (`idAccount`),
  CONSTRAINT `fk_services_account` FOREIGN KEY (`idAccount`) REFERENCES `accounts` (`idAccount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `services_addons` */

DROP TABLE IF EXISTS `services_addons`;

CREATE TABLE `services_addons` (
  `idServiceAddon` int(11) NOT NULL AUTO_INCREMENT,
  `idService` int(11) NOT NULL,
  `idAddon` int(11) NOT NULL,
  PRIMARY KEY (`idServiceAddon`),
  KEY `services_addons_service` (`idService`),
  KEY `services_addons_addon` (`idAddon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `services_hours` */

DROP TABLE IF EXISTS `services_hours`;

CREATE TABLE `services_hours` (
  `idService` int(11) NOT NULL,
  `hour` time NOT NULL,
  PRIMARY KEY (`idService`,`hour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `services_prices` */

DROP TABLE IF EXISTS `services_prices`;

CREATE TABLE `services_prices` (
  `idService` int(11) NOT NULL,
  `passengers` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idService`,`passengers`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `status` */

DROP TABLE IF EXISTS `status`;

CREATE TABLE `status` (
  `idStatus` int(11) NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL,
  PRIMARY KEY (`idStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `idUser` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `surname` varchar(255) DEFAULT NULL,
  `idRole` int(11) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `resetPassword` tinyint(1) DEFAULT 0,
  `email` varchar(255) DEFAULT NULL,
  `idAccount` int(11) NOT NULL,
  `googleId` varchar(255) DEFAULT NULL,
  `askBiometric` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idUser`),
  UNIQUE KEY `uniq_users_email` (`email`),
  UNIQUE KEY `uniq_users_google` (`googleId`),
  KEY `fk_role` (`idRole`),
  KEY `idx_users_account` (`idAccount`),
  CONSTRAINT `fk_role` FOREIGN KEY (`idRole`) REFERENCES `roles` (`idRole`),
  CONSTRAINT `fk_users_account` FOREIGN KEY (`idAccount`) REFERENCES `accounts` (`idAccount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `work_order_discrepancies` */

DROP TABLE IF EXISTS `work_order_discrepancies`;

CREATE TABLE `work_order_discrepancies` (
  `idDiscrepancy` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkOrder` int(11) DEFAULT NULL,
  `orderNumber` int(11) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `hours` decimal(5,2) DEFAULT NULL,
  `checked` tinyint(1) DEFAULT NULL,
  `idUser` int(11) DEFAULT NULL,
  PRIMARY KEY (`idDiscrepancy`),
  KEY `idWorkOrder` (`idWorkOrder`),
  CONSTRAINT `workOrderDiscrepancies_ibfk_1` FOREIGN KEY (`idWorkOrder`) REFERENCES `work_orders` (`idWorkOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `work_order_info` */

DROP TABLE IF EXISTS `work_order_info`;

CREATE TABLE `work_order_info` (
  `idInfo` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkOrder` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idInfo`),
  KEY `idWorkOrder` (`idWorkOrder`),
  CONSTRAINT `workOrderInfo_ibfk_1` FOREIGN KEY (`idWorkOrder`) REFERENCES `work_orders` (`idWorkOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `work_order_types` */

DROP TABLE IF EXISTS `work_order_types`;

CREATE TABLE `work_order_types` (
  `idType` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `work_orders` */

DROP TABLE IF EXISTS `work_orders`;

CREATE TABLE `work_orders` (
  `idWorkOrder` int(11) NOT NULL AUTO_INCREMENT,
  `numeroWorkOrder` int(11) DEFAULT NULL,
  `createUser` int(11) DEFAULT NULL,
  `createDatetime` datetime DEFAULT NULL,
  `updateUser` int(11) DEFAULT NULL,
  `updateDatetime` datetime DEFAULT NULL,
  `idEstado` int(11) DEFAULT NULL,
  `idType` int(11) DEFAULT NULL,
  `lastInspectionDate` date DEFAULT NULL,
  `date` date DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `preparedBy` varchar(255) DEFAULT NULL,
  `scope` text DEFAULT NULL,
  `inAcordanceWith` text DEFAULT NULL,
  `hasCustomSummary` tinyint(1) DEFAULT NULL,
  `customSummary` text DEFAULT NULL,
  `idAircraft` int(11) DEFAULT NULL,
  `idAccount` int(11) NOT NULL,
  PRIMARY KEY (`idWorkOrder`),
  KEY `workOrders_workOrderTypes_idType_fk` (`idType`),
  KEY `idx_work_orders_account` (`idAccount`),
  CONSTRAINT `fk_work_orders_account` FOREIGN KEY (`idAccount`) REFERENCES `accounts` (`idAccount`),
  CONSTRAINT `workOrders_workOrderTypes_idType_fk` FOREIGN KEY (`idType`) REFERENCES `work_order_types` (`idType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


/* Reference data */

insert into `roles`(`idRole`,`role`,`code`) values
(1,'ADMINISTRATOR','ADM');

insert into `status`(`idStatus`,`status`) values
(1,'In Progress'),
(2,'Awaiting Payment'),
(3,'Confirmed'),
(4,'Cancelled'),
(5,'Manually Cancelled');

insert into `cancellation_reasons`(`idCancellationReason`,`cancellationReason`) values
(1,'Guest cancelled'),
(2,'Weather'),
(3,'Safety decision'),
(4,'Payment not completed'),
(5,'Duplicate or test booking'),
(6,'Aircraft mechanical'),
(7,'Other');

/* Trigger structure for table `reservations` */

DELIMITER $$

/*!50003 DROP TRIGGER*//*!50032 IF EXISTS */ /*!50003 `incrementCodeReservation` */$$

/*!50003 CREATE */ /*!50003 TRIGGER `incrementCodeReservation` BEFORE INSERT ON `reservations` FOR EACH ROW BEGIN
	DECLARE r_codeReservation INTEGER;
    SET r_codeReservation = (SELECT COALESCE(MAX(codeReservation),5000000) + 1 FROM reservations);
    SET NEW.codeReservation = r_codeReservation;
    END */$$


DELIMITER ;

/*!50106 set global event_scheduler = 1*/;

/* Event structure for event `cancel_incomplete_bookings` */

/*!50106 DROP EVENT IF EXISTS `cancel_incomplete_bookings`*/;

DELIMITER $$

/*!50106 CREATE EVENT `cancel_incomplete_bookings` ON SCHEDULE EVERY 1 MINUTE STARTS '2025-12-29 02:34:50' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
	    UPDATE reservations set idStatus = 4 where idStatus = 1 and now() > reservationExpiration;
	END */$$
DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
