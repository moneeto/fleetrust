/*
SQLyog Ultimate v13.1.1 (64 bit)
MySQL - 10.4.32-MariaDB : Database - fleetrust
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

/*Table structure for table `aircraftmanuals` */

DROP TABLE IF EXISTS `aircraftmanuals`;

CREATE TABLE `aircraftmanuals` (
  `idManual` int(11) NOT NULL AUTO_INCREMENT,
  `idAircraft` int(11) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idManual`),
  KEY `idAircraft` (`idAircraft`),
  CONSTRAINT `aircraftManuals_ibfk_1` FOREIGN KEY (`idAircraft`) REFERENCES `aircrafts` (`idAircraft`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `aircraftmanuals` */

/*Table structure for table `aircraftmanufacturers` */

DROP TABLE IF EXISTS `aircraftmanufacturers`;

CREATE TABLE `aircraftmanufacturers` (
  `idManufacturer` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `country` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idManufacturer`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `aircraftmanufacturers` */

/*Table structure for table `aircrafts` */

DROP TABLE IF EXISTS `aircrafts`;

CREATE TABLE `aircrafts` (
  `idAircraft` int(11) NOT NULL AUTO_INCREMENT,
  `idManufacturer` int(11) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `registrationNumber` varchar(255) DEFAULT NULL,
  `serialNumber` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idAircraft`),
  KEY `idManufacturer` (`idManufacturer`),
  CONSTRAINT `aircrafts_ibfk_1` FOREIGN KEY (`idManufacturer`) REFERENCES `aircraftmanufacturers` (`idManufacturer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `aircrafts` */

/*Table structure for table `availablehours` */

DROP TABLE IF EXISTS `availablehours`;

CREATE TABLE `availablehours` (
  `hour` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `availablehours` */

/*Table structure for table `discrepanciesfiles` */

DROP TABLE IF EXISTS `discrepanciesfiles`;

CREATE TABLE `discrepanciesfiles` (
  `idFile` int(11) NOT NULL AUTO_INCREMENT,
  `idDiscrepancy` int(11) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  `isBefore` tinyint(1) DEFAULT NULL,
  `isAfter` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`idFile`),
  KEY `idDiscrepancy` (`idDiscrepancy`),
  CONSTRAINT `discrepanciesFiles_ibfk_1` FOREIGN KEY (`idDiscrepancy`) REFERENCES `workorderdiscrepancies` (`idDiscrepancy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `discrepanciesfiles` */

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
  CONSTRAINT `engines_ibfk_1` FOREIGN KEY (`idWorkOrder`) REFERENCES `workorders` (`idWorkOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `engines` */

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `instagram_posts` */

/*Table structure for table `logs` */

DROP TABLE IF EXISTS `logs`;

CREATE TABLE `logs` (
  `idLog` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) DEFAULT NULL,
  `section` varchar(255) DEFAULT NULL,
  `function` varchar(255) DEFAULT NULL,
  `msg` longtext DEFAULT NULL,
  `logLevel` enum('INFO','ERROR') DEFAULT NULL,
  PRIMARY KEY (`idLog`),
  KEY `idUser` (`idUser`),
  CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `logs` */

/*Table structure for table `partsused` */

DROP TABLE IF EXISTS `partsused`;

CREATE TABLE `partsused` (
  `idPartUsed` int(11) NOT NULL AUTO_INCREMENT,
  `idDiscrepancy` int(11) DEFAULT NULL,
  `partName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idPartUsed`),
  KEY `idDiscrepancy` (`idDiscrepancy`),
  CONSTRAINT `partsUsed_ibfk_1` FOREIGN KEY (`idDiscrepancy`) REFERENCES `workorderdiscrepancies` (`idDiscrepancy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `partsused` */

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `reviews` */

/*Table structure for table `roles` */

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `idRole` int(11) NOT NULL AUTO_INCREMENT,
  `role` varchar(255) DEFAULT NULL,
  `code` varchar(16) DEFAULT NULL,
  PRIMARY KEY (`idRole`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `roles` */

insert  into `roles`(`idRole`,`role`,`code`) values 
(4,'ADMINSITRATOR','ADM');

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `idUser` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `surname` varchar(255) DEFAULT NULL,
  `idRole` int(11) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `resetPassword` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`idUser`),
  KEY `fk_role` (`idRole`),
  CONSTRAINT `fk_role` FOREIGN KEY (`idRole`) REFERENCES `roles` (`idRole`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `users` */

insert  into `users`(`idUser`,`username`,`password`,`name`,`surname`,`idRole`,`active`,`resetPassword`) values 
(4,'jpalmeyro','$2a$12$We3M.RHLI02fSbPQCdp0K.5TZZwH2jfxc.g8rqsUzSoIvzhPtG2z.','joako','palmeyro',4,1,0);

/*Table structure for table `workorderdiscrepancies` */

DROP TABLE IF EXISTS `workorderdiscrepancies`;

CREATE TABLE `workorderdiscrepancies` (
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
  CONSTRAINT `workOrderDiscrepancies_ibfk_1` FOREIGN KEY (`idWorkOrder`) REFERENCES `workorders` (`idWorkOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `workorderdiscrepancies` */

/*Table structure for table `workorderinfo` */

DROP TABLE IF EXISTS `workorderinfo`;

CREATE TABLE `workorderinfo` (
  `idInfo` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkOrder` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idInfo`),
  KEY `idWorkOrder` (`idWorkOrder`),
  CONSTRAINT `workOrderInfo_ibfk_1` FOREIGN KEY (`idWorkOrder`) REFERENCES `workorders` (`idWorkOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `workorderinfo` */

/*Table structure for table `workorders` */

DROP TABLE IF EXISTS `workorders`;

CREATE TABLE `workorders` (
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
  PRIMARY KEY (`idWorkOrder`),
  KEY `workOrders_workOrderTypes_idType_fk` (`idType`),
  CONSTRAINT `workOrders_workOrderTypes_idType_fk` FOREIGN KEY (`idType`) REFERENCES `workordertypes` (`idType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `workorders` */

/*Table structure for table `workordertypes` */

DROP TABLE IF EXISTS `workordertypes`;

CREATE TABLE `workordertypes` (
  `idType` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `workordertypes` */

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
