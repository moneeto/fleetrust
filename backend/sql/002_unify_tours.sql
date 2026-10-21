-- Import frassi-tours into the backoffice database (fleetrust).
-- Keeps the maintenance aircraft registry under maintenance_aircrafts.
USE `fleetrust`;

DROP PROCEDURE IF EXISTS rename_maint_aircrafts;
DELIMITER $$
CREATE PROCEDURE rename_maint_aircrafts()
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'aircrafts'
      AND COLUMN_NAME = 'model'
  ) THEN
    RENAME TABLE aircrafts TO maintenance_aircrafts;
  END IF;
END$$
DELIMITER ;
CALL rename_maint_aircrafts();
DROP PROCEDURE rename_maint_aircrafts;

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
USE `fleetrust`;

/*Table structure for table `addons` */

DROP TABLE IF EXISTS `addons`;

CREATE TABLE `addons` (
  `idAddon` int NOT NULL AUTO_INCREMENT,
  `addon` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `price` double DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`idAddon`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `addons` */

insert  into `addons`(`idAddon`,`addon`,`description`,`price`,`active`) values 
(4,'Champagne',NULL,42,1),
(5,'Flowers',NULL,50,1),
(6,'Chocolate ',NULL,15,1),
(7,'Decoration ',NULL,35,1),
(8,'Pilot message',NULL,15,1),
(9,'Extra photo session',NULL,50,1),
(10,'Certificate',NULL,15,1),
(11,'Sunset Hour',NULL,115,1);

/*Table structure for table `aircrafts` */

DROP TABLE IF EXISTS `aircrafts`;

CREATE TABLE `aircrafts` (
  `idAircraft` int NOT NULL AUTO_INCREMENT,
  `aircraft` varchar(255) NOT NULL,
  `capacity` int NOT NULL,
  `available` tinyint(1) DEFAULT '1',
  `registrationNumber` varchar(255) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`idAircraft`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `aircrafts` */

insert  into `aircrafts`(`idAircraft`,`aircraft`,`capacity`,`available`,`registrationNumber`,`deleted`) values 
(1,'Cessna 172RG',3,0,'N949SM',1),
(3,'Piper Arrow PA28R200',3,1,'N1095X',0),
(4,'Piper Archer PA28-181',3,0,'N8503E',0),
(5,'Cessna 172K',3,1,'N851LW',0),
(6,'Cessna 172 M',3,0,'N64524',0),
(7,'Tecnam 210 ',3,0,'N512VA',0);

/*Table structure for table `availableHours` */

DROP TABLE IF EXISTS `availableHours`;

CREATE TABLE `availableHours` (
  `hour` time DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `availableHours` */

insert  into `availableHours`(`hour`,`active`) values 
('07:00:00',0),
('08:00:00',0),
('09:00:00',0),
('10:00:00',0),
('11:00:00',1),
('12:00:00',1),
('13:00:00',1),
('14:00:00',1),
('15:00:00',1),
('16:00:00',1),
('17:00:00',1),
('18:00:00',1),
('19:00:00',1),
('20:00:00',1),
('21:00:00',1),
('22:00:00',1),
('23:00:00',1),
('00:00:00',0),
('07:30:00',0),
('08:30:00',0),
('09:30:00',0),
('10:30:00',1),
('11:30:00',1),
('12:30:00',1),
('13:30:00',1),
('14:30:00',1),
('15:30:00',1),
('16:30:00',1),
('17:30:00',1),
('18:30:00',1),
('19:30:00',1),
('20:30:00',1),
('21:30:00',1),
('22:30:00',1);

/*Table structure for table `cancellationReasons` */

DROP TABLE IF EXISTS `cancellationReasons`;

CREATE TABLE `cancellationReasons` (
  `idCancellationReason` int NOT NULL AUTO_INCREMENT,
  `cancellationReason` varchar(255) NOT NULL,
  PRIMARY KEY (`idCancellationReason`),
  UNIQUE KEY `cancellationReasons_cancellationReason_IDX` (`cancellationReason`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `cancellationReasons` */

insert  into `cancellationReasons`(`idCancellationReason`,`cancellationReason`) values 
(6,'Aircraft mechanical'),
(5,'Duplicate or test booking'),
(1,'Guest cancelled'),
(7,'Other'),
(4,'Payment not completed'),
(3,'Safety decision'),
(2,'Weather');

/*Table structure for table `experience_hours` */

DROP TABLE IF EXISTS `experience_hours`;

CREATE TABLE `experience_hours` (
  `idExperience` int NOT NULL,
  `hour` time NOT NULL,
  PRIMARY KEY (`idExperience`,`hour`),
  CONSTRAINT `fk_experience_hours_experience` FOREIGN KEY (`idExperience`) REFERENCES `experiences` (`idExperience`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `experience_hours` */

insert  into `experience_hours`(`idExperience`,`hour`) values 
(1,'10:30:00'),
(1,'11:00:00'),
(1,'11:30:00'),
(1,'12:00:00'),
(1,'12:30:00'),
(1,'13:00:00'),
(1,'13:30:00'),
(1,'14:00:00'),
(1,'14:30:00'),
(1,'15:00:00'),
(1,'15:30:00'),
(1,'16:00:00'),
(1,'16:30:00'),
(1,'17:00:00'),
(1,'17:30:00'),
(1,'18:00:00'),
(1,'18:30:00'),
(1,'19:00:00'),
(1,'19:30:00'),
(1,'20:00:00'),
(1,'20:30:00'),
(1,'21:00:00'),
(1,'21:30:00'),
(1,'22:00:00'),
(1,'22:30:00'),
(1,'23:00:00'),
(2,'10:30:00'),
(2,'11:00:00'),
(2,'11:30:00'),
(2,'12:00:00'),
(2,'12:30:00'),
(2,'13:00:00'),
(2,'13:30:00'),
(2,'14:00:00'),
(2,'14:30:00'),
(2,'15:00:00'),
(2,'15:30:00'),
(2,'16:00:00'),
(2,'16:30:00'),
(2,'17:00:00'),
(2,'17:30:00'),
(2,'18:00:00'),
(2,'18:30:00'),
(2,'19:00:00'),
(2,'19:30:00'),
(2,'20:00:00'),
(2,'20:30:00'),
(2,'21:00:00'),
(2,'21:30:00'),
(2,'22:00:00'),
(2,'22:30:00'),
(2,'23:00:00'),
(3,'19:30:00'),
(4,'10:30:00'),
(4,'11:00:00'),
(4,'11:30:00'),
(4,'12:00:00'),
(4,'12:30:00'),
(4,'13:00:00'),
(4,'13:30:00'),
(4,'14:00:00'),
(4,'14:30:00'),
(4,'15:00:00'),
(4,'15:30:00'),
(4,'16:00:00'),
(4,'16:30:00'),
(4,'17:00:00'),
(4,'17:30:00'),
(4,'18:00:00'),
(4,'18:30:00'),
(4,'19:00:00'),
(4,'19:30:00'),
(4,'20:00:00'),
(4,'20:30:00'),
(4,'21:00:00'),
(4,'21:30:00'),
(4,'22:00:00'),
(4,'22:30:00'),
(4,'23:00:00');

/*Table structure for table `experience_prices` */

DROP TABLE IF EXISTS `experience_prices`;

CREATE TABLE `experience_prices` (
  `idExperience` int NOT NULL,
  `passengers` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`idExperience`,`passengers`),
  CONSTRAINT `fk_experience_prices_experience` FOREIGN KEY (`idExperience`) REFERENCES `experiences` (`idExperience`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `experience_prices` */

insert  into `experience_prices`(`idExperience`,`passengers`,`price`) values 
(1,2,450.00),
(1,3,520.00),
(2,2,460.00),
(2,3,530.00),
(3,2,470.00),
(3,3,560.00),
(4,2,600.00);

/*Table structure for table `experiences` */

DROP TABLE IF EXISTS `experiences`;

CREATE TABLE `experiences` (
  `idExperience` int NOT NULL AUTO_INCREMENT,
  `code` varchar(255) DEFAULT NULL,
  `value2` double(10,0) DEFAULT NULL,
  `value3` double(10,0) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` longtext,
  `minDaysAhead` int NOT NULL DEFAULT '1',
  `maxDaysAhead` int NOT NULL DEFAULT '31',
  `allowedWeekdays` longtext NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  PRIMARY KEY (`idExperience`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `experiences` */

insert  into `experiences`(`idExperience`,`code`,`value2`,`value3`,`image`,`title`,`description`,`minDaysAhead`,`maxDaysAhead`,`allowedWeekdays`) values 
(1,'BRTH',450,520,'experience-1.jpg','Birthday Celebration Flight','Celebrate your birthday in the sky with a unique experience you’ll never forget. Whether it’s your first flight or your favorite tradition, we make it special from start to finish.\r\nIncludes: \r\n- Birthday banner & personalized announcement \r\n- Drink per passenger \r\n- Frassi Tours gift \r\n- In-flight photo session \r\n- Personalized flight certificate \r\n',1,31,'[0, 1, 2, 3, 4, 5, 6]'),
(2,'WEDD',460,530,'experience-3.png','Anniversary & Honeymoon Flight','Celebrate love from above. Whether it’s your anniversary or honeymoon, this experience is designed to create memories that last forever.\r\nIncludes: \r\n- Private premium flight \r\n- Romantic ambiance \r\n- Chocolates & refreshments \r\n- In-flight photo session \r\n- Champagne \r\n',1,31,'[0, 1, 2, 3, 4, 5, 6]'),
(3,'SUN',470,560,'experience-4.png','Sunset Flight Experience','Watch the sun set over Miami from the sky. Golden hour lighting, ocean views, and a private aircraft create the most unforgettable experience we offer. This is our most requested flight... and for a reason...\r\nIncludes: \r\n- Golden hour scenic flight \r\n- Complimentary drinks \r\n- Premium photo opportunities \r\n- Relaxed, Quiet atmosphere',1,31,'[0, 1, 2, 3, 4, 5, 6]'),
(4,'PROP',600,NULL,'experience-2.jpg','Romantic Proposal Experience','The perfect moment deserves the perfect setting. Propose in the sky with a breathtaking view of Miami as your backdrop. We help you plan every detail so you can focus on the moment that matters.\r\nIncludes: \r\n- Private premium flight \r\n- Romantic Pre-setup coordination \r\n- Champagne on board \r\n- Bouquet of flowers \r\n- In-flight photo & video coverage \r\n- Personalized proposal certificate',1,31,'[0, 1, 2, 3, 4, 5, 6]');

/*Table structure for table `experiences_addons` */

DROP TABLE IF EXISTS `experiences_addons`;

CREATE TABLE `experiences_addons` (
  `idExperienceAddon` int NOT NULL AUTO_INCREMENT,
  `idExperience` int NOT NULL,
  `idAddon` int NOT NULL,
  PRIMARY KEY (`idExperienceAddon`),
  KEY `experiences_addons_experiences_FK` (`idExperience`),
  KEY `experiences_addons_addons_FK` (`idAddon`),
  CONSTRAINT `experiences_addons_addons_FK` FOREIGN KEY (`idAddon`) REFERENCES `addons` (`idAddon`),
  CONSTRAINT `experiences_addons_experiences_FK` FOREIGN KEY (`idExperience`) REFERENCES `experiences` (`idExperience`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `experiences_addons` */

insert  into `experiences_addons`(`idExperienceAddon`,`idExperience`,`idAddon`) values 
(1,2,4),
(2,2,6),
(3,3,11);

/*Table structure for table `invoices` */

DROP TABLE IF EXISTS `invoices`;

CREATE TABLE `invoices` (
  `idInvoice` int NOT NULL AUTO_INCREMENT,
  `idReservation` int NOT NULL,
  `invoiceDate` datetime DEFAULT NULL,
  `totalValue` decimal(10,2) NOT NULL,
  `invoiceObject` text,
  `description` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `CustomerViewUrl` text,
  PRIMARY KEY (`idInvoice`),
  KEY `invoices_ibfk_1` (`idReservation`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`idReservation`) REFERENCES `reservations` (`idReservation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `invoices` */

/*Table structure for table `passengers` */

DROP TABLE IF EXISTS `passengers`;

CREATE TABLE `passengers` (
  `idPassenger` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `idReservation` int NOT NULL,
  PRIMARY KEY (`idPassenger`),
  KEY `passengers_ibfk_1` (`idReservation`),
  CONSTRAINT `passengers_ibfk_1` FOREIGN KEY (`idReservation`) REFERENCES `reservations` (`idReservation`)
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `passengers` */

insert  into `passengers`(`idPassenger`,`name`,`lastname`,`idReservation`) values 
(1,'Fausto','Rugiero',1),
(2,'Fausto ','Rugiero',1),
(3,'Fausto','Rugiero',2),
(4,'Fausto ','Rugiero',2),
(5,'Ayrton','Frassi Vieira',9),
(6,'Ayrton','Frassi Vieira',9),
(7,'Ayrton','Frassi',10),
(8,'Ayrton','Frassi',10),
(9,'Ayrton','Frassi',12),
(10,'Ayrton','Frassi',12),
(11,'Ayrton','Frassi Vieira',13),
(12,'Ayrton','Frassi Vieira',13),
(13,'Ayrton','Frassi',14),
(14,'Ayrton','Frassi',14),
(15,'Ayrton','Frassi',15),
(16,'Ayrton','Frassi',15),
(17,'Ayrton','Frassi',17),
(18,'Ayrton','Frassi',17),
(19,'Ayrton','Frassi Vieira',18),
(20,'Ayrton','Frassi Vieira',18),
(21,'Ayrton','Frassi Vieira',18),
(22,'Ayrton','Frassi',24),
(23,'Ayrton','Frassi',24),
(24,'Ayrton','Frassi',26),
(25,'Ayrton','Frassi',26),
(26,'Joaquin','Palmeyro',33),
(27,'Joaquin','Palmeyro',33),
(28,'Joaquin','Palmeyro',34),
(29,'Joaquin','Palmeyro',34),
(30,'Joaquin','Palmeyro',37),
(31,'Joaquin','Palmeyro',37),
(32,'Joaquin','Palmeyro',43),
(33,'Joaquin','Palmeyro',43),
(34,'Joaquin','Palmeyro',44),
(35,'Joaquin','Palmeyro',44),
(36,'Fausto','Rugiero',45),
(37,'Joaco','Palmeyro',45),
(38,'Fausto','Rugiero',46),
(39,'Joaco','Palmeyro',46),
(40,'Fausto','Rugiero',52),
(41,'Fausto ','Rugiero',52),
(42,'Joaquin','Palmeyro',55),
(43,'Vaslen','penna',55),
(44,'Joaquin','Palmeyro',56),
(45,'Val','penan',56),
(46,'a','a',57),
(47,'b','b',57),
(48,'a','a',58),
(49,'b','b',58),
(50,'a','a',59),
(51,'b','b',59),
(52,'a','a',60),
(53,'b','b',60),
(54,'Joaquin','Palmeyro',61),
(55,'Julian','Alvarez',61),
(56,'Laying','Low',62),
(57,'Laying','Low',62),
(58,'Joaquin','Palmeyro',64),
(59,'Joaquin','Palmeyro',64),
(60,'Joaquin','Palmeyro',68),
(61,'Joaquin','Palmeyro',68),
(62,'Joaquin','Palmeyro',69),
(63,'Joaquin','Palmeyro',69),
(64,'Joaquin','Palmeyro',69),
(65,'prueba','prueba',70),
(66,'prueba','prueba',70),
(67,'1234 Perlita Ave.','Tandil',71),
(68,'Joaquin','Palmeyro',71),
(69,'joako','joako',74),
(70,'joako','joako',74),
(71,'1234 Perlita Ave.','Tandil',75),
(72,'Joaquin','Palmeyro',75),
(73,'1234 Perlita Ave.','Tandil',91),
(74,'hola','puto',91),
(75,'hola','puto',95),
(76,'hola','puto',95),
(77,'test discovery flighttest discovery flight','test discovery flight',96),
(78,'hola','puto',98),
(79,'hola','puto',98);

/*Table structure for table `pilots` */

DROP TABLE IF EXISTS `pilots`;

CREATE TABLE `pilots` (
  `idPilot` int NOT NULL AUTO_INCREMENT,
  `pilotName` varchar(255) NOT NULL,
  `pilotPicture` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `phoneNumber` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idPilot`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `pilots` */

insert  into `pilots`(`idPilot`,`pilotName`,`pilotPicture`,`active`,`phoneNumber`) values 
(1,'asdasd','0096fd58a5460027271b2b1003986baf-1788398458830.png',1,'asdasd'),
(2,'Picardía 2','0096fd58a5460027271b2b1003986baf-1788731000666.png',1,'+54 2489 664455'),
(3,'Moneeto','7-1788821211266.jpg',1,'1157975825'),
(4,'Luni','7-1788919697078.jpg',1,'123456789');

/*Table structure for table `reservations` */

DROP TABLE IF EXISTS `reservations`;

CREATE TABLE `reservations` (
  `idReservation` int NOT NULL AUTO_INCREMENT,
  `codeReservation` bigint DEFAULT NULL,
  `passengers` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `idRoute` int DEFAULT NULL,
  `idExperience` int DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phoneNumber` varchar(255) DEFAULT NULL,
  `deposit` decimal(10,2) DEFAULT NULL,
  `remainingBalance` decimal(10,2) DEFAULT NULL,
  `totalValue` decimal(10,2) DEFAULT NULL,
  `idStatus` int DEFAULT NULL,
  `reservationExpiration` datetime DEFAULT NULL,
  `acceptedTerms` tinyint(1) DEFAULT '0',
  `acceptedTermsTimestamp` timestamp NULL DEFAULT NULL,
  `notes` longtext,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `idAircraft` int DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `confirmationHash` varchar(255) DEFAULT NULL,
  `validatedQR` tinyint(1) DEFAULT '0',
  `validatedDatetime` datetime DEFAULT NULL,
  `idCancellationReason` int DEFAULT NULL,
  `cancellationDetail` varchar(255) DEFAULT NULL,
  `idPilot` int DEFAULT NULL,
  PRIMARY KEY (`idReservation`),
  UNIQUE KEY `codeReservation` (`codeReservation`),
  KEY `idStatus` (`idStatus`),
  KEY `idRoute` (`idRoute`),
  KEY `reservations_ibfk_1` (`idExperience`),
  KEY `idAircraft` (`idAircraft`),
  KEY `reservations_pilots_FK` (`idPilot`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`idExperience`) REFERENCES `experiences` (`idExperience`),
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`idStatus`) REFERENCES `status` (`idStatus`),
  CONSTRAINT `reservations_ibfk_3` FOREIGN KEY (`idRoute`) REFERENCES `routes` (`idRoute`),
  CONSTRAINT `reservations_ibfk_4` FOREIGN KEY (`idAircraft`) REFERENCES `aircrafts` (`idAircraft`),
  CONSTRAINT `reservations_pilots_FK` FOREIGN KEY (`idPilot`) REFERENCES `pilots` (`idPilot`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `reservations` */

insert  into `reservations`(`idReservation`,`codeReservation`,`passengers`,`name`,`lastname`,`idRoute`,`idExperience`,`email`,`phoneNumber`,`deposit`,`remainingBalance`,`totalValue`,`idStatus`,`reservationExpiration`,`acceptedTerms`,`acceptedTermsTimestamp`,`notes`,`startDate`,`endDate`,`idAircraft`,`createdAt`,`updatedAt`,`confirmationHash`,`validatedQR`,`validatedDatetime`,`idCancellationReason`,`cancellationDetail`,`idPilot`) values 
(1,5000001,2,'Fausto','Rugiero',3,NULL,'faustorugieroo@gmail.com','3489636463',50.00,345.00,395.00,2,'2026-03-06 20:55:51',1,'2026-03-06 20:41:07',NULL,'2026-03-18 10:00:00','2026-03-18 11:00:00',1,'2026-03-06 20:40:51','2026-03-06 20:41:08',NULL,0,NULL,NULL,NULL,NULL),
(2,5000002,2,'Fausto','Rugiero',3,NULL,'faustorugieroo@gmail.com','3489636463',50.00,345.00,395.00,2,'2026-03-06 20:57:23',1,'2026-03-06 20:42:35',NULL,'2026-03-06 19:30:00','2026-03-06 20:30:00',1,'2026-03-06 20:42:23','2026-03-06 20:42:36',NULL,0,NULL,NULL,NULL,NULL),
(3,5000003,2,NULL,NULL,2,NULL,NULL,NULL,50.00,100.00,150.00,4,'2026-03-07 23:10:42',0,NULL,NULL,'2026-03-08 18:00:00','2026-03-08 19:00:00',1,'2026-03-07 22:55:42','2026-03-07 23:10:50',NULL,0,NULL,NULL,NULL,NULL),
(4,5000004,2,NULL,NULL,2,NULL,NULL,NULL,50.00,100.00,150.00,4,'2026-03-16 16:51:09',0,NULL,NULL,'2026-03-16 15:30:00','2026-03-16 16:30:00',1,'2026-03-16 16:36:09','2026-03-16 16:51:50',NULL,0,NULL,NULL,NULL,NULL),
(5,5000005,2,NULL,NULL,3,NULL,NULL,NULL,50.00,270.00,320.00,4,'2026-03-16 18:24:54',0,NULL,NULL,'2026-03-17 08:00:00','2026-03-17 09:00:00',1,'2026-03-16 18:09:54','2026-03-16 18:25:50',NULL,0,NULL,NULL,NULL,NULL),
(6,5000006,2,NULL,NULL,2,NULL,NULL,NULL,50.00,100.00,150.00,4,'2026-03-19 00:12:21',0,NULL,NULL,'2026-03-19 09:30:00','2026-03-19 10:30:00',1,'2026-03-18 23:57:21','2026-03-19 00:12:50',NULL,0,NULL,NULL,NULL,NULL),
(7,5000007,3,NULL,NULL,1,NULL,NULL,NULL,50.00,85.00,135.00,4,'2026-03-19 17:43:08',0,NULL,NULL,'2026-03-20 07:30:00','2026-03-20 08:30:00',1,'2026-03-19 17:28:08','2026-03-19 17:43:50',NULL,0,NULL,NULL,NULL,NULL),
(8,5000008,2,NULL,NULL,3,NULL,NULL,NULL,50.00,345.00,395.00,4,'2026-04-07 17:12:43',0,NULL,NULL,'2026-04-07 15:30:00','2026-04-07 16:30:00',1,'2026-04-07 16:57:43','2026-04-07 17:12:50',NULL,0,NULL,NULL,NULL,NULL),
(9,5000009,2,'Ayrton','Frassi',3,NULL,'ayrtonfrassi1997@gmail.com','13053399112',50.00,270.00,320.00,4,'2026-04-07 20:02:33',1,'2026-04-07 19:47:51',NULL,'2026-04-10 08:00:00','2026-04-10 09:00:00',1,'2026-04-07 19:47:33','2026-04-08 19:47:53',NULL,0,NULL,NULL,NULL,NULL),
(10,5000010,2,'Ayrton','Frassi Vieira',2,NULL,'ayrtonfrassi1997@gmail.com','+543053399112',50.00,135.00,185.00,3,'2026-04-07 21:50:39',0,NULL,'flores','2026-04-07 19:00:00','2026-04-07 20:00:00',1,'2026-04-07 21:35:39','2026-04-07 21:35:47',NULL,0,NULL,NULL,NULL,NULL),
(11,5000011,2,NULL,NULL,3,NULL,NULL,NULL,50.00,270.00,320.00,4,'2026-04-09 22:29:18',0,NULL,NULL,'2026-04-09 22:30:00','2026-04-09 23:30:00',1,'2026-04-09 22:14:18','2026-04-09 22:29:50',NULL,0,NULL,NULL,NULL,NULL),
(12,5000012,2,'Ayrton','Frassi Vieira',3,NULL,'ayrtonfrassi1997@gmail.com','+543053399112',50.00,270.00,320.00,4,'2026-04-10 18:50:14',1,'2026-04-10 18:35:32',NULL,'2026-04-10 17:30:00','2026-04-10 18:30:00',1,'2026-04-10 18:35:14','2026-04-11 18:35:33',NULL,0,NULL,NULL,NULL,NULL),
(13,5000013,2,'Ayrton','Frassi',3,NULL,'ayrtonfrassi1997@gmail.com','13053399112',50.00,270.00,320.00,4,'2026-04-14 16:41:30',1,'2026-04-14 16:26:53',NULL,'2026-04-14 17:30:00','2026-04-14 18:30:00',1,'2026-04-14 16:26:30','2026-04-15 16:26:53',NULL,0,NULL,NULL,NULL,NULL),
(14,5000014,2,'Ayrton','Frassi',3,NULL,'ayrtonfrassi1997@gmail.com','13053399112',50.00,270.00,320.00,4,'2026-04-15 15:57:48',1,'2026-04-15 15:43:09',NULL,'2026-04-15 15:30:00','2026-04-15 16:30:00',1,'2026-04-15 15:42:48','2026-04-16 15:43:10',NULL,0,NULL,NULL,NULL,NULL),
(15,5000015,2,'Ayrton','Frassi',2,NULL,'ayrtonfrassi1997@gmail.com','13053399112',50.00,100.00,150.00,4,'2026-04-19 19:43:58',1,'2026-04-19 19:29:10',NULL,'2026-04-20 08:00:00','2026-04-20 09:00:00',1,'2026-04-19 19:28:58','2026-04-19 19:29:34',NULL,0,NULL,NULL,NULL,NULL),
(16,5000016,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-04-19 19:45:41',0,NULL,NULL,'2026-04-23 14:00:00','2026-04-23 15:00:00',1,'2026-04-19 19:30:41','2026-04-19 19:45:50',NULL,0,NULL,NULL,NULL,NULL),
(17,5000017,2,'AYRTON','FRASSI',3,NULL,'info@frassiaviation.com','13053399112',50.00,305.00,355.00,4,'2026-04-19 19:45:47',0,NULL,'Leo tiene miedo','2026-04-23 14:00:00','2026-04-23 15:00:00',3,'2026-04-19 19:30:47','2026-04-20 01:15:52',NULL,0,NULL,NULL,NULL,NULL),
(18,5000018,3,'Ayrton','Frassi',2,NULL,'ayrtonfrassi1997@gmail.com','13053399112',50.00,135.00,185.00,4,'2026-04-19 19:57:04',1,'2026-04-19 19:42:12',NULL,'2026-04-19 18:30:00','2026-04-19 19:30:00',1,'2026-04-19 19:42:04','2026-04-19 19:42:31',NULL,0,NULL,NULL,NULL,NULL),
(19,5000019,2,NULL,NULL,2,NULL,NULL,NULL,50.00,100.00,150.00,4,'2026-04-19 22:52:26',0,NULL,NULL,'2026-05-01 17:30:00','2026-05-01 18:30:00',1,'2026-04-19 22:37:26','2026-04-19 22:37:31',NULL,0,NULL,NULL,NULL,NULL),
(20,5000020,2,NULL,NULL,2,NULL,NULL,NULL,50.00,100.00,150.00,4,'2026-04-19 23:02:31',0,NULL,NULL,'2026-04-20 17:30:00','2026-04-20 18:30:00',1,'2026-04-19 22:47:31','2026-04-19 23:02:50',NULL,0,NULL,NULL,NULL,NULL),
(21,5000021,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0.00,0.00,3,NULL,0,NULL,'Maintenance\n','2026-04-19 07:00:00','2026-05-10 07:00:00',3,'2026-04-20 01:15:55','2026-04-20 02:23:41',NULL,0,NULL,NULL,NULL,NULL),
(22,5000022,2,NULL,NULL,3,NULL,NULL,NULL,50.00,270.00,320.00,4,'2026-04-20 02:40:00',0,NULL,NULL,'2026-04-22 09:30:00','2026-04-22 10:30:00',5,'2026-04-20 02:25:00','2026-04-20 02:40:50',NULL,0,NULL,NULL,NULL,NULL),
(23,5000023,2,NULL,NULL,3,NULL,NULL,NULL,50.00,420.00,470.00,4,'2026-04-20 02:51:32',0,NULL,NULL,'2026-04-20 18:30:00','2026-04-20 19:30:00',5,'2026-04-20 02:36:32','2026-04-20 02:51:50',NULL,0,NULL,NULL,NULL,NULL),
(24,5000024,2,'Ayrton','Frassi',1,NULL,'ayrtonfrassi1997@gmail.com','13053399112',50.00,50.00,100.00,2,'2026-04-20 02:54:24',1,'2026-04-20 02:39:36',NULL,'2026-04-23 13:00:00','2026-04-23 14:00:00',5,'2026-04-20 02:39:24','2026-04-20 02:39:36',NULL,0,NULL,NULL,NULL,NULL),
(25,5000025,2,NULL,NULL,2,NULL,NULL,NULL,50.00,100.00,150.00,4,'2026-04-20 05:12:14',0,NULL,NULL,'2026-04-20 13:30:00','2026-04-20 14:30:00',5,'2026-04-20 04:57:14','2026-04-20 05:12:50',NULL,0,NULL,NULL,NULL,NULL),
(26,5000026,2,'Ayrton','Frassi',2,NULL,'ayrtonfrassi1997@gmail.com','13053399112',50.00,100.00,150.00,4,'2026-04-21 20:16:30',1,'2026-04-21 20:01:49',NULL,'2026-04-21 20:00:00','2026-04-21 21:00:00',5,'2026-04-21 20:01:30','2026-04-22 20:01:50',NULL,0,NULL,NULL,NULL,NULL),
(27,5000027,1,'','',2,NULL,'','',50.00,135.00,185.00,3,'2026-04-21 20:19:01',0,NULL,NULL,'2026-04-23 16:00:00','2026-04-23 17:00:00',5,'2026-04-21 20:04:01','2026-04-21 20:04:02',NULL,0,NULL,NULL,NULL,NULL),
(28,5000028,2,NULL,NULL,2,NULL,NULL,NULL,50.00,100.00,150.00,4,'2026-04-22 00:06:53',0,NULL,NULL,'2026-04-21 22:30:00','2026-04-21 23:30:00',5,'2026-04-21 23:51:53','2026-04-22 00:07:50',NULL,0,NULL,NULL,NULL,NULL),
(29,5000029,2,NULL,NULL,2,NULL,NULL,NULL,50.00,100.00,150.00,4,'2026-04-22 18:16:41',0,NULL,NULL,'2026-04-22 19:30:00','2026-04-22 20:30:00',5,'2026-04-22 18:01:41','2026-04-22 18:16:50',NULL,0,NULL,NULL,NULL,NULL),
(30,5000030,2,NULL,NULL,1,NULL,NULL,NULL,50.00,50.00,100.00,4,'2026-04-25 01:25:35',0,NULL,NULL,'2026-04-25 10:00:00','2026-04-25 11:00:00',5,'2026-04-25 01:10:35','2026-04-25 01:25:50',NULL,0,NULL,NULL,NULL,NULL),
(31,5000031,3,NULL,NULL,3,NULL,NULL,NULL,50.00,380.00,430.00,4,'2026-05-01 03:03:43',0,NULL,NULL,'2026-05-02 07:00:00','2026-05-02 08:00:00',5,'2026-05-01 02:48:43','2026-05-01 03:03:50',NULL,0,NULL,NULL,NULL,NULL),
(32,5000032,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-05-01 03:30:56',0,NULL,NULL,'2026-05-01 07:00:00','2026-05-01 08:00:00',5,'2026-05-01 03:15:56','2026-05-01 03:31:50',NULL,0,NULL,NULL,NULL,NULL),
(33,5000033,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,305.00,355.00,2,'2026-05-01 03:32:21',1,'2026-05-01 03:17:45',NULL,'2026-05-01 08:00:00','2026-05-01 09:00:00',5,'2026-05-01 03:17:21','2026-05-01 03:17:47',NULL,0,NULL,NULL,NULL,NULL),
(34,5000034,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,305.00,445.00,2,'2026-05-01 03:33:03',1,'2026-05-01 03:18:16',NULL,'2026-05-01 09:00:00','2026-05-01 10:00:00',5,'2026-05-01 03:18:04','2026-05-01 03:18:17',NULL,0,NULL,NULL,NULL,NULL),
(35,5000035,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-05-01 03:37:49',0,NULL,NULL,'2026-05-01 10:00:00','2026-05-01 11:00:00',5,'2026-05-01 03:22:49','2026-05-01 03:37:50',NULL,0,NULL,NULL,NULL,NULL),
(36,5000036,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-05-01 03:41:38',0,NULL,NULL,'2026-05-01 19:30:00','2026-05-01 20:30:00',5,'2026-05-01 03:26:38','2026-05-01 03:27:11',NULL,0,NULL,NULL,NULL,NULL),
(37,5000037,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,305.00,470.00,2,'2026-05-01 03:43:38',1,'2026-05-01 03:29:11',NULL,'2026-05-01 19:30:00','2026-05-01 20:30:00',5,'2026-05-01 03:28:38','2026-05-01 03:29:13',NULL,0,NULL,NULL,NULL,NULL),
(38,5000038,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-05-01 03:56:09',0,NULL,NULL,'2026-05-02 19:30:00','2026-05-02 20:30:00',5,'2026-05-01 03:41:10','2026-05-01 03:56:50',NULL,0,NULL,NULL,NULL,NULL),
(39,5000039,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-05-01 03:57:47',0,NULL,NULL,'2026-05-01 18:30:00','2026-05-01 19:30:00',5,'2026-05-01 03:42:47','2026-05-01 03:57:50',NULL,0,NULL,NULL,NULL,NULL),
(40,5000040,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-05-01 04:00:13',0,NULL,NULL,'2026-05-01 21:00:00','2026-05-01 22:00:00',5,'2026-05-01 03:45:13','2026-05-01 04:00:50',NULL,0,NULL,NULL,NULL,NULL),
(41,5000041,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-05-01 04:02:02',0,NULL,NULL,'2026-05-03 19:30:00','2026-05-03 20:30:00',5,'2026-05-01 03:47:02','2026-05-01 04:02:50',NULL,0,NULL,NULL,NULL,NULL),
(42,5000042,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-05-01 04:06:58',0,NULL,NULL,'2026-05-01 07:00:00','2026-05-01 08:00:00',5,'2026-05-01 03:51:58','2026-05-01 04:07:50',NULL,0,NULL,NULL,NULL,NULL),
(43,5000043,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,305.00,355.00,2,'2026-05-01 04:48:29',1,'2026-05-01 04:33:40',NULL,'2026-05-01 18:30:00','2026-05-01 19:30:00',5,'2026-05-01 04:33:30','2026-05-01 04:33:42',NULL,0,NULL,NULL,NULL,NULL),
(44,5000044,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,305.00,355.00,2,'2026-05-01 04:50:36',1,'2026-05-01 04:35:48',NULL,'2026-05-01 21:00:00','2026-05-01 22:00:00',5,'2026-05-01 04:35:37','2026-05-01 04:35:50',NULL,0,NULL,NULL,NULL,NULL),
(45,5000045,2,'Fausto','Rugiero',1,NULL,'faustorugieroo@gmail.com','3489636463',50.00,70.00,120.00,2,'2026-05-08 23:39:51',1,'2026-05-08 23:25:10',NULL,'2026-05-16 22:00:00','2026-05-16 23:00:00',3,'2026-05-08 23:24:49','2026-05-08 23:25:10',NULL,0,NULL,NULL,NULL,NULL),
(46,5000046,2,'Fausto','Rugiero',3,NULL,'faustorugieroo@gmail.com','3489636463',50.00,305.00,355.00,3,'2026-05-08 23:42:59',1,'2026-05-08 23:28:15',NULL,'2026-05-08 21:30:00','2026-05-08 22:30:00',5,'2026-05-08 23:27:57','2026-05-08 23:28:39','elEMfIlTbM',0,NULL,NULL,NULL,NULL),
(47,5000047,2,NULL,NULL,1,NULL,NULL,NULL,50.00,70.00,120.00,4,'2026-05-09 00:03:39',0,NULL,NULL,'2026-05-09 19:30:00','2026-05-09 20:30:00',5,'2026-05-08 23:48:37','2026-05-08 23:48:40',NULL,0,NULL,NULL,NULL,NULL),
(48,5000048,2,NULL,NULL,1,NULL,NULL,NULL,50.00,70.00,120.00,4,'2026-05-09 00:03:57',0,NULL,NULL,'2026-05-09 19:30:00','2026-05-09 20:30:00',5,'2026-05-08 23:48:55','2026-05-09 00:04:50',NULL,0,NULL,NULL,NULL,NULL),
(49,5000049,2,NULL,NULL,1,NULL,NULL,NULL,50.00,70.00,120.00,4,'2026-05-09 00:12:29',0,NULL,NULL,'2026-05-08 22:30:00','2026-05-08 23:30:00',5,'2026-05-08 23:57:27','2026-05-09 00:01:48',NULL,0,NULL,NULL,NULL,NULL),
(50,5000050,2,NULL,NULL,1,NULL,NULL,NULL,50.00,70.00,120.00,4,'2026-05-09 00:16:54',0,NULL,NULL,'2026-05-15 08:30:00','2026-05-15 09:30:00',3,'2026-05-09 00:01:53','2026-05-09 00:05:21',NULL,0,NULL,NULL,NULL,NULL),
(51,5000051,2,NULL,NULL,1,NULL,NULL,NULL,50.00,70.00,120.00,4,'2026-05-09 00:21:06',0,NULL,NULL,'2026-05-15 19:30:00','2026-05-15 20:30:00',3,'2026-05-09 00:06:06','2026-05-09 00:06:12',NULL,0,NULL,NULL,NULL,NULL),
(52,5000052,2,'Fausto','Rugiero',3,NULL,'faustorugieroo@gmail.com','3489636463',50.00,305.00,355.00,3,'2026-05-09 00:50:30',1,'2026-05-09 00:35:47',NULL,'2026-05-09 17:30:00','2026-05-09 18:30:00',5,'2026-05-09 00:35:30','2026-05-09 00:36:20','Xy78hZbXsv',0,NULL,NULL,NULL,NULL),
(53,5000053,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-05-13 02:08:05',0,NULL,NULL,'2026-05-16 19:30:00','2026-05-16 20:30:00',3,'2026-05-13 01:53:05','2026-05-13 02:08:50',NULL,0,NULL,NULL,NULL,NULL),
(54,5000054,2,NULL,NULL,3,NULL,NULL,NULL,50.00,305.00,355.00,4,'2026-05-13 02:09:44',0,NULL,NULL,'2026-05-14 19:30:00','2026-05-14 20:30:00',3,'2026-05-13 01:54:44','2026-05-13 02:09:50',NULL,0,NULL,NULL,NULL,NULL),
(55,5000055,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,305.00,520.00,2,'2026-05-13 02:38:54',1,'2026-05-13 02:24:16',NULL,'2026-05-13 19:30:00','2026-05-13 20:30:00',3,'2026-05-13 02:23:54','2026-05-13 02:24:17',NULL,0,NULL,NULL,NULL,NULL),
(56,5000056,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,305.00,520.00,2,'2026-05-13 03:10:02',1,'2026-05-13 02:55:19',NULL,'2026-05-13 19:30:00','2026-05-13 20:30:00',5,'2026-05-13 02:55:02','2026-05-13 02:55:21',NULL,0,NULL,NULL,NULL,NULL),
(57,5000057,2,'a','a',3,NULL,'palmeyrojoaquin@gmail.com','123456789',50.00,305.00,520.00,2,'2026-05-14 01:50:05',1,'2026-05-14 01:35:33',NULL,'2026-05-14 19:30:00','2026-05-14 20:30:00',3,'2026-05-14 01:35:06','2026-05-14 01:35:34',NULL,0,NULL,NULL,NULL,NULL),
(58,5000058,2,'a','a',3,NULL,'palmeyrojoaquin@gmail.com','123456789',50.00,305.00,485.00,3,'2026-05-14 02:38:33',1,'2026-05-14 02:23:50',NULL,'2026-05-14 19:30:00','2026-05-14 20:30:00',5,'2026-05-14 02:23:33','2026-05-14 02:24:16','TjqAnlVASJ',0,NULL,NULL,NULL,NULL),
(59,5000059,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,305.00,505.00,2,'2026-05-14 02:49:10',1,'2026-05-14 02:34:24',NULL,'2026-05-15 19:30:00','2026-05-15 20:30:00',3,'2026-05-14 02:34:10','2026-05-14 02:34:26',NULL,0,NULL,NULL,NULL,NULL),
(60,5000060,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,305.00,495.00,3,'2026-05-14 02:53:38',1,'2026-05-14 02:38:54',NULL,'2026-05-14 10:30:00','2026-05-14 11:30:00',3,'2026-05-14 02:38:39','2026-05-17 22:31:52','cLYEYVIV0B',0,'2026-05-17 22:03:03',NULL,NULL,NULL),
(61,5000061,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,305.00,520.00,3,'2026-05-17 23:56:35',1,'2026-05-17 23:42:01',NULL,'2026-05-18 19:30:00','2026-05-18 20:30:00',3,'2026-05-17 23:41:36','2026-05-17 23:42:41','goe18RPyiE',0,NULL,NULL,NULL,NULL),
(62,5000062,2,'TEST','TEST',2,NULL,'a@a.com','12347',50.00,140.00,205.00,2,'2026-07-21 01:49:55',1,'2026-07-21 01:39:38',NULL,'2026-07-21 07:00:00','2026-07-21 08:00:00',3,'2026-07-21 01:34:55','2026-07-21 01:39:39',NULL,0,NULL,NULL,NULL,NULL),
(63,5000063,2,NULL,NULL,2,NULL,NULL,NULL,50.00,140.00,190.00,4,'2026-07-21 01:54:58',0,NULL,NULL,'2026-07-21 19:00:00','2026-07-21 20:00:00',3,'2026-07-21 01:39:58','2026-07-21 01:55:50',NULL,0,NULL,NULL,NULL,NULL),
(64,5000064,2,'Joaquin','Palmeyro',3,2,'palmeyrojoaquin@gmail.com','+541112345678',50.00,410.00,500.00,2,'2026-08-04 14:08:55',1,'2026-08-04 13:54:23',NULL,'2026-08-04 18:30:00','2026-08-04 19:30:00',3,'2026-08-04 13:53:55','2026-08-04 13:54:24',NULL,0,NULL,NULL,NULL,NULL),
(65,5000065,2,NULL,NULL,3,3,NULL,NULL,50.00,420.00,470.00,4,'2026-08-04 14:12:01',0,NULL,NULL,'2026-08-04 19:30:00','2026-08-04 20:30:00',3,'2026-08-04 13:57:01','2026-08-04 14:12:50',NULL,0,NULL,NULL,NULL,NULL),
(66,5000066,2,NULL,NULL,3,3,NULL,NULL,50.00,420.00,470.00,4,'2026-08-04 14:15:15',0,NULL,NULL,'2026-08-04 19:30:00','2026-08-04 20:30:00',5,'2026-08-04 14:00:15','2026-08-04 14:15:50',NULL,0,NULL,NULL,NULL,NULL),
(67,5000067,2,NULL,NULL,3,3,NULL,NULL,50.00,420.00,470.00,4,'2026-08-04 14:17:44',0,NULL,NULL,'2026-08-05 19:30:00','2026-08-05 20:30:00',3,'2026-08-04 14:02:44','2026-08-04 14:17:50',NULL,0,NULL,NULL,NULL,NULL),
(68,5000068,2,'Joaquin','Palmeyro',3,3,'palmeyrojoaquin@gmail.com','+541112345678',50.00,420.00,485.00,3,'2026-08-04 14:22:06',1,'2026-08-04 14:07:25',NULL,'2026-08-05 19:30:00','2026-08-05 20:30:00',5,'2026-08-04 14:07:06','2026-08-04 14:07:59','5L6WmpuCTW',0,NULL,NULL,NULL,NULL),
(69,5000069,3,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,380.00,430.00,3,'2026-08-09 21:50:20',0,NULL,'Vuela con serine (?','2026-08-10 07:00:00','2026-08-10 08:00:00',3,'2026-08-09 21:35:22','2026-08-09 21:35:32',NULL,0,NULL,NULL,NULL,NULL),
(70,5000070,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,380.00,430.00,3,'2026-08-09 21:51:50',0,NULL,'es maniaca, maniaca bailandooooo','2026-08-10 07:30:00','2026-08-10 08:30:00',3,'2026-08-09 21:36:51','2026-08-09 21:37:20',NULL,0,NULL,NULL,NULL,NULL),
(71,5000071,2,'Joaquin','Palmeyro',3,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,380.00,430.00,3,'2026-08-09 21:53:30',0,NULL,'asdasdasd','2026-08-09 07:00:00','2026-08-09 08:00:00',3,'2026-08-09 21:38:31','2026-08-09 21:38:43',NULL,0,NULL,NULL,NULL,NULL),
(72,5000072,2,NULL,NULL,3,3,NULL,NULL,50.00,420.00,470.00,4,'2026-08-09 23:00:41',0,NULL,NULL,'2026-08-09 19:30:00','2026-08-09 20:30:00',3,'2026-08-09 22:45:42','2026-08-09 23:00:50',NULL,0,NULL,NULL,NULL,NULL),
(73,5000073,3,NULL,NULL,3,NULL,NULL,NULL,50.00,380.00,430.00,4,'2026-08-09 23:03:02',0,NULL,NULL,'2026-08-10 19:30:00','2026-08-10 20:30:00',3,'2026-08-09 22:48:02','2026-08-09 23:03:50',NULL,0,NULL,NULL,NULL,NULL),
(74,5000074,2,'Joaquin','Palmeyro',3,4,'palmeyrojoaquin@gmail.com','+541112345678',50.00,550.00,600.00,3,'2026-08-09 23:53:58',0,NULL,'123','2026-08-09 07:30:00','2026-08-09 08:30:00',5,'2026-08-09 23:38:59','2026-08-09 23:39:11','u7BmiQIg5V',0,NULL,NULL,NULL,NULL),
(75,5000075,2,'Joaquin','Palmeyro',3,4,'palmeyrojoaquin@gmail.com','+541112345678',50.00,550.00,600.00,3,'2026-08-10 00:11:45',0,NULL,'08 am vuela serine','2026-08-09 08:00:00','2026-08-09 09:00:00',3,'2026-08-09 23:56:46','2026-08-09 23:58:21','sfa0m1gL4s',1,'2026-08-09 23:58:21',NULL,NULL,NULL),
(76,5000076,3,NULL,NULL,3,3,NULL,NULL,50.00,510.00,560.00,4,'2026-08-10 00:27:12',0,NULL,NULL,'2026-08-10 19:30:00','2026-08-10 20:30:00',3,'2026-08-10 00:12:13','2026-08-10 00:27:50',NULL,0,NULL,NULL,NULL,NULL),
(77,5000077,2,NULL,NULL,3,1,NULL,NULL,50.00,400.00,450.00,4,'2026-08-10 00:28:03',0,NULL,NULL,'2026-08-10 07:00:00','2026-08-10 08:00:00',5,'2026-08-10 00:13:03','2026-08-10 00:28:50',NULL,0,NULL,NULL,NULL,NULL),
(78,5000078,2,NULL,NULL,3,1,NULL,NULL,50.00,400.00,450.00,4,'2026-08-10 00:33:32',0,NULL,NULL,'2026-08-09 22:30:00','2026-08-09 23:30:00',3,'2026-08-10 00:18:33','2026-08-10 00:33:50',NULL,0,NULL,NULL,NULL,NULL),
(79,5000079,3,NULL,NULL,3,1,NULL,NULL,50.00,470.00,520.00,4,'2026-08-10 00:44:54',0,NULL,NULL,'2026-08-10 22:00:00','2026-08-10 23:00:00',3,'2026-08-10 00:29:56','2026-08-10 00:45:50',NULL,0,NULL,NULL,NULL,NULL),
(80,5000080,2,NULL,NULL,3,1,NULL,NULL,50.00,400.00,450.00,4,'2026-08-10 00:54:10',0,NULL,NULL,'2026-08-09 23:00:00','2026-08-10 00:00:00',3,'2026-08-10 00:39:11','2026-08-10 00:54:50',NULL,0,NULL,NULL,NULL,NULL),
(81,5000081,2,NULL,NULL,3,2,NULL,NULL,50.00,410.00,460.00,4,'2026-08-10 01:00:54',0,NULL,NULL,'2026-08-10 08:00:00','2026-08-10 09:00:00',5,'2026-08-10 00:45:56','2026-08-10 00:46:03',NULL,0,NULL,NULL,NULL,NULL),
(82,5000082,3,NULL,NULL,3,2,NULL,NULL,50.00,480.00,530.00,4,'2026-08-10 01:07:38',0,NULL,NULL,'2026-08-09 23:00:00','2026-08-10 00:00:00',5,'2026-08-10 00:52:38','2026-08-10 01:07:50',NULL,0,NULL,NULL,NULL,NULL),
(83,5000083,2,NULL,NULL,3,2,NULL,NULL,50.00,410.00,460.00,4,'2026-08-10 01:07:54',0,NULL,NULL,'2026-08-10 17:30:00','2026-08-10 18:30:00',3,'2026-08-10 00:52:55','2026-08-10 01:08:50',NULL,0,NULL,NULL,NULL,NULL),
(84,5000084,1,'','',2,NULL,'','',50.00,195.00,245.00,3,'2026-08-13 20:13:59',0,NULL,'for serine','2026-08-13 07:00:00','2026-08-13 08:00:00',3,'2026-08-13 19:59:00','2026-08-13 19:59:00','U59HKGz9XH',0,NULL,NULL,NULL,NULL),
(85,5000085,1,'','',5,NULL,'','',50.00,-50.00,0.00,3,'2026-08-13 23:11:04',0,NULL,'to thiago','2026-08-14 07:30:00','2026-08-14 08:30:00',3,'2026-08-13 22:56:04','2026-08-13 22:56:05','58bu17U0QG',0,NULL,NULL,NULL,NULL),
(86,5000086,NULL,NULL,NULL,5,NULL,NULL,NULL,0.00,0.00,0.00,4,NULL,0,NULL,'maintenance','2026-08-29 07:00:00','2026-09-05 07:00:00',5,'2026-08-29 18:59:27','2026-08-30 16:58:35',NULL,0,NULL,7,'PAssenger died',NULL),
(87,5000087,NULL,NULL,NULL,5,NULL,NULL,NULL,0.00,0.00,0.00,3,NULL,0,NULL,NULL,'2026-08-30 07:00:00','2026-09-02 07:00:00',3,'2026-08-29 19:04:45','2026-09-06 21:29:47',NULL,0,NULL,NULL,NULL,NULL),
(88,5000088,2,NULL,NULL,3,2,NULL,NULL,50.00,410.00,460.00,4,'2026-09-07 03:57:07',0,NULL,NULL,'2026-09-07 11:30:00','2026-09-07 12:30:00',3,'2026-09-07 03:42:08','2026-09-07 03:57:50',NULL,0,NULL,NULL,NULL,NULL),
(89,5000089,3,NULL,NULL,3,3,NULL,NULL,50.00,510.00,560.00,4,'2026-09-07 22:18:21',0,NULL,NULL,'2026-09-08 19:30:00','2026-09-08 20:30:00',3,'2026-09-07 22:03:21','2026-09-07 22:18:50',NULL,0,NULL,NULL,NULL,NULL),
(90,5000090,2,NULL,NULL,3,2,NULL,NULL,50.00,410.00,460.00,4,'2026-09-07 22:19:03',0,NULL,NULL,'2026-09-08 10:00:00','2026-09-08 11:00:00',3,'2026-09-07 22:04:03','2026-09-07 22:19:50',NULL,0,NULL,NULL,NULL,NULL),
(91,5000091,2,'hola','puto',2,NULL,'asfasf@gmail.com','+541112345678',50.00,140.00,190.00,3,'2026-09-07 23:11:45',0,NULL,'jljlk','2026-09-08 15:00:00','2026-09-08 16:00:00',3,'2026-09-07 22:56:45','2026-09-07 22:56:53','fssac5amVR',0,NULL,NULL,NULL,NULL),
(92,5000092,1,'','',2,NULL,'','',50.00,195.00,245.00,3,'2026-09-07 23:13:10',0,NULL,'ljlkjlkj\n','2026-09-08 11:30:00','2026-09-08 12:30:00',5,'2026-09-07 22:58:10','2026-09-07 22:58:11','HCVhiS5CX1',0,NULL,NULL,NULL,NULL),
(93,5000093,NULL,NULL,NULL,5,NULL,NULL,NULL,0.00,0.00,0.00,5,NULL,0,NULL,NULL,'2026-09-08 07:00:00','2026-09-12 07:00:00',6,'2026-09-09 01:44:07','2026-09-09 02:14:59',NULL,0,NULL,2,NULL,4),
(94,5000094,2,NULL,NULL,3,2,NULL,NULL,50.00,410.00,460.00,4,'2026-09-09 02:17:08',0,NULL,NULL,'2026-09-09 10:00:00','2026-09-09 11:00:00',3,'2026-09-09 02:02:10','2026-09-09 02:17:50',NULL,0,NULL,NULL,NULL,NULL),
(95,5000095,2,'hola','puto',1,NULL,'asfasf@gmail.com','+541112345678',50.00,70.00,212.00,2,'2026-09-21 21:25:01',1,'2026-09-21 21:10:12',NULL,'2026-09-22 12:30:00','2026-09-22 13:30:00',3,'2026-09-21 21:10:01','2026-09-21 21:10:14',NULL,0,NULL,NULL,NULL,NULL),
(96,5000096,1,'test discovery flight','test discovery flight',6,NULL,'palmeyrojoaquin@gmail.com','+541112345678',50.00,100.00,192.00,3,'2026-09-22 00:01:50',1,'2026-09-21 23:47:07',NULL,'2026-09-22 12:30:00','2026-09-22 13:30:00',5,'2026-09-21 23:46:50','2026-09-21 23:47:45','FrUDBSWBIN',0,NULL,NULL,NULL,NULL),
(97,5000097,2,NULL,NULL,3,2,NULL,NULL,50.00,410.00,460.00,4,'2026-10-01 23:55:45',0,NULL,NULL,'2026-10-02 12:30:00','2026-10-02 13:30:00',3,'2026-10-01 23:40:48','2026-10-01 23:55:50',NULL,0,NULL,NULL,NULL,NULL),
(98,5000098,2,'hola','puto',3,2,'asfasf@gmail.com','+541112345678',50.00,410.00,460.00,3,'2026-10-02 00:01:34',0,NULL,'guachooo','2026-10-03 11:30:00','2026-10-03 12:30:00',3,'2026-10-01 23:46:37','2026-10-01 23:46:47','gdcsPORBxE',0,NULL,NULL,NULL,3);

/*Table structure for table `reservationsAddons` */

DROP TABLE IF EXISTS `reservationsAddons`;

CREATE TABLE `reservationsAddons` (
  `idRel` int NOT NULL AUTO_INCREMENT,
  `idReservation` int DEFAULT NULL,
  `idAddon` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`idRel`),
  KEY `idReservation` (`idReservation`),
  KEY `idAddon` (`idAddon`),
  CONSTRAINT `reservationsAddons_ibfk_1` FOREIGN KEY (`idReservation`) REFERENCES `reservations` (`idReservation`),
  CONSTRAINT `reservationsAddons_ibfk_2` FOREIGN KEY (`idAddon`) REFERENCES `addons` (`idAddon`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `reservationsAddons` */

insert  into `reservationsAddons`(`idRel`,`idReservation`,`idAddon`,`quantity`,`price`) values 
(1,34,4,1,NULL),
(2,34,5,1,NULL),
(3,37,11,1,NULL),
(4,55,5,1,NULL),
(5,55,11,1,NULL),
(6,56,5,1,NULL),
(7,56,11,1,NULL),
(8,57,5,1,NULL),
(9,57,11,1,NULL),
(10,58,6,1,NULL),
(11,58,11,1,NULL),
(12,59,7,1,NULL),
(13,59,11,1,NULL),
(14,60,4,1,NULL),
(15,60,5,2,NULL),
(16,61,6,1,NULL),
(17,61,7,1,NULL),
(18,61,11,1,NULL),
(19,62,6,1,NULL),
(20,64,4,1,NULL),
(21,68,10,1,NULL),
(22,95,4,1,0.00),
(23,95,5,1,0.00),
(24,96,4,1,42.00);

/*Table structure for table `route_hours` */

DROP TABLE IF EXISTS `route_hours`;

CREATE TABLE `route_hours` (
  `idRoute` int NOT NULL,
  `hour` time NOT NULL,
  PRIMARY KEY (`idRoute`,`hour`),
  CONSTRAINT `fk_route_hours_route` FOREIGN KEY (`idRoute`) REFERENCES `routes` (`idRoute`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `route_hours` */

insert  into `route_hours`(`idRoute`,`hour`) values 
(1,'10:30:00'),
(1,'11:00:00'),
(1,'11:30:00'),
(1,'12:00:00'),
(1,'12:30:00'),
(1,'13:00:00'),
(1,'13:30:00'),
(1,'14:00:00'),
(1,'14:30:00'),
(1,'15:00:00'),
(1,'15:30:00'),
(1,'16:00:00'),
(1,'16:30:00'),
(1,'17:00:00'),
(1,'17:30:00'),
(1,'18:00:00'),
(1,'18:30:00'),
(1,'19:00:00'),
(1,'19:30:00'),
(1,'20:00:00'),
(1,'20:30:00'),
(1,'21:00:00'),
(1,'21:30:00'),
(1,'22:00:00'),
(1,'22:30:00'),
(1,'23:00:00'),
(2,'10:30:00'),
(2,'11:00:00'),
(2,'11:30:00'),
(2,'12:00:00'),
(2,'12:30:00'),
(2,'13:00:00'),
(2,'13:30:00'),
(2,'14:00:00'),
(2,'14:30:00'),
(2,'15:00:00'),
(2,'15:30:00'),
(2,'16:00:00'),
(2,'16:30:00'),
(2,'17:00:00'),
(2,'17:30:00'),
(2,'18:00:00'),
(2,'18:30:00'),
(2,'19:00:00'),
(2,'19:30:00'),
(2,'20:00:00'),
(2,'20:30:00'),
(2,'21:00:00'),
(2,'21:30:00'),
(2,'22:00:00'),
(2,'22:30:00'),
(2,'23:00:00'),
(3,'10:30:00'),
(3,'11:00:00'),
(3,'11:30:00'),
(3,'12:00:00'),
(3,'12:30:00'),
(3,'13:00:00'),
(3,'13:30:00'),
(3,'14:00:00'),
(3,'14:30:00'),
(3,'15:00:00'),
(3,'15:30:00'),
(3,'16:00:00'),
(3,'16:30:00'),
(3,'17:00:00'),
(3,'17:30:00'),
(3,'18:00:00'),
(3,'18:30:00'),
(3,'19:00:00'),
(3,'19:30:00'),
(3,'20:00:00'),
(3,'20:30:00'),
(3,'21:00:00'),
(3,'21:30:00'),
(3,'22:00:00'),
(3,'22:30:00'),
(3,'23:00:00'),
(5,'10:30:00'),
(5,'11:00:00'),
(5,'11:30:00'),
(5,'12:00:00'),
(5,'12:30:00'),
(5,'13:00:00'),
(5,'13:30:00'),
(5,'14:00:00'),
(5,'14:30:00'),
(5,'15:00:00'),
(5,'15:30:00'),
(5,'16:00:00'),
(5,'16:30:00'),
(5,'17:00:00'),
(5,'17:30:00'),
(5,'18:00:00'),
(5,'18:30:00'),
(5,'19:00:00'),
(5,'19:30:00'),
(5,'20:00:00'),
(5,'20:30:00'),
(5,'21:00:00'),
(5,'21:30:00'),
(5,'22:00:00'),
(5,'22:30:00'),
(5,'23:00:00'),
(6,'10:30:00'),
(6,'11:00:00'),
(6,'11:30:00'),
(6,'12:00:00'),
(6,'12:30:00'),
(6,'13:00:00'),
(6,'13:30:00'),
(6,'14:00:00'),
(6,'14:30:00'),
(6,'15:00:00'),
(6,'15:30:00'),
(6,'16:00:00'),
(6,'16:30:00'),
(6,'17:00:00'),
(6,'17:30:00'),
(6,'18:00:00'),
(6,'18:30:00'),
(6,'19:00:00'),
(6,'19:30:00'),
(6,'20:00:00'),
(6,'20:30:00'),
(6,'21:00:00'),
(6,'21:30:00'),
(6,'22:00:00'),
(6,'22:30:00'),
(6,'23:00:00');

/*Table structure for table `route_prices` */

DROP TABLE IF EXISTS `route_prices`;

CREATE TABLE `route_prices` (
  `idRoute` int NOT NULL,
  `passengers` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`idRoute`,`passengers`),
  CONSTRAINT `fk_route_prices_route` FOREIGN KEY (`idRoute`) REFERENCES `routes` (`idRoute`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `route_prices` */

insert  into `route_prices`(`idRoute`,`passengers`,`price`) values 
(1,2,120.00),
(1,3,155.00),
(2,2,190.00),
(2,3,245.00),
(3,2,355.00),
(3,3,430.00),
(5,2,0.00),
(5,3,0.00),
(6,1,150.00);

/*Table structure for table `routes` */

DROP TABLE IF EXISTS `routes`;

CREATE TABLE `routes` (
  `idRoute` int NOT NULL AUTO_INCREMENT,
  `value2` decimal(10,2) DEFAULT NULL,
  `value3` decimal(10,2) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text,
  `image` varchar(255) DEFAULT NULL,
  `durationMinutes` int DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `mapImage` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `visibleToClients` tinyint DEFAULT NULL,
  `minDaysAhead` int NOT NULL DEFAULT '1',
  `maxDaysAhead` int NOT NULL DEFAULT '31',
  `allowedWeekdays` longtext NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  PRIMARY KEY (`idRoute`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `routes` */

insert  into `routes`(`idRoute`,`value2`,`value3`,`code`,`title`,`description`,`image`,`durationMinutes`,`duration`,`mapImage`,`visibleToClients`,`minDaysAhead`,`maxDaysAhead`,`allowedWeekdays`) values 
(1,120.00,155.00,'INT','Intro Flight','Your first step into the sky — designed for comfort, confidence, and control. Perfect for first-time flyers, people with fear of flying or vertigo  children and sensory-friendly experiences\r\nThis flight stays over the airport, allowing a smooth and controlled experience.\r\nYou can choose to land at any time (or continue if you feel comfortable)','intro-flight.jpg',15,'15 minutes',NULL,1,1,31,'[0, 1, 2, 3, 4, 5, 6]'),
(2,190.00,245.00,'BAS','Coastal Experience Flight','Take off from the airport and fly toward the coastline, where the ocean opens up in front of you.  Enjoy a smooth scenic route with views of the beach, water, and city from above.\r\nPerfect for first scenic experience, couples and everybody who want a short but memorable flights','basic.png',30,'20 - 30 minutes',NULL,1,1,31,'[0, 1, 2, 3, 4, 5, 6]'),
(3,355.00,430.00,'PRE','Premium Air Tour','Discover Miami like never before with a private one-hour scenic flight along the coastline, skyline, and iconic landmarks. This is not just a flight — it’s a premium experience designed for comfort, safety, and unforgettable views.\r\nIncludes:\r\n- Private aircraft \r\n- Professional pilot \r\n- Scenic Miami route \r\n- Photo opportunities \r\n','premium.png',60,'45 - 60 minutes',NULL,1,1,31,'[0, 1, 2, 3, 4, 5, 6]'),
(5,0.00,0.00,'000','Manual Booking / Pilot',NULL,NULL,30,NULL,NULL,0,1,31,'[0, 1, 2, 3, 4, 5, 6]'),
(6,150.00,150.00,'DIS','Discovery Flight','Introductory Flight Lesson: Learn the basics of flying with an FAA-certified flight instructor. \r\nYour experience includes a preflight briefing, aircraft familiarization, and hands-on flight instruction from the student pilot seat. \r\nDesigned for one prospective student.','discoveryflight.jpg',45,'45 minutes',NULL,1,1,31,'[0, 1, 2, 3, 4, 5, 6]');

/*Table structure for table `status` */

DROP TABLE IF EXISTS `status`;

CREATE TABLE `status` (
  `idStatus` int NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL,
  PRIMARY KEY (`idStatus`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `status` */

insert  into `status`(`idStatus`,`status`) values 
(1,'In Progress'),
(2,'Awaiting Payment'),
(3,'Confirmed'),
(4,'Cancelled'),
(5,'Manually Cancelled');

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
