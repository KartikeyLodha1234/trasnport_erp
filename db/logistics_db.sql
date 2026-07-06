-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 06, 2026 at 12:59 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `logistics_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `city`
--

CREATE TABLE `city` (
  `city_id` int NOT NULL,
  `city_name` varchar(255) NOT NULL,
  `state` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `pin_code` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `client`
--

CREATE TABLE `client` (
  `client_id` int NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `vehicles` int DEFAULT '0',
  `status` varchar(20) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_profiles`
--

CREATE TABLE `company_profiles` (
  `id` int NOT NULL,
  `company_name` varchar(100) NOT NULL,
  `owner_name` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `pan_number` varchar(10) DEFAULT NULL,
  `address` text,
  `city` varchar(50) NOT NULL,
  `state` varchar(50) NOT NULL,
  `pincode` varchar(6) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `company_profiles`
--

INSERT INTO `company_profiles` (`id`, `company_name`, `owner_name`, `phone`, `gstin`, `pan_number`, `address`, `city`, `state`, `pincode`, `created_at`, `updated_at`) VALUES
(1, 'Transport', '', '', '', '', '', '', '', '', '2026-07-06 12:59:12', '2026-07-06 12:59:12'),
(2, 'ABC Transport', 'Rahul Sharma', '9876543210', 'GSTIN12345', 'PAN12345', '123 Main Road, Andheri', 'Mumbai', 'Maharashtra', '400001', '2026-07-06 12:59:12', '2026-07-06 12:59:12'),
(3, 'XYZ Logistics', 'Priya Patel', '9876543211', 'GSTIN67890', 'PAN67890', '456 Park Street', 'Delhi', 'Delhi', '110001', '2026-07-06 12:59:12', '2026-07-06 12:59:12'),
(4, 'Transport', '', '', '', '', '', '', '', '', '2026-07-06 12:59:25', '2026-07-06 12:59:25'),
(5, 'ABC Transport', 'Rahul Sharma', '9876543210', 'GSTIN12345', 'PAN12345', '123 Main Road, Andheri', 'Mumbai', 'Maharashtra', '400001', '2026-07-06 12:59:25', '2026-07-06 12:59:25'),
(6, 'XYZ Logistics', 'Priya Patel', '9876543211', 'GSTIN67890', 'PAN67890', '456 Park Street', 'Delhi', 'Delhi', '110001', '2026-07-06 12:59:25', '2026-07-06 12:59:25');

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `id` int NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `dob` date DEFAULT NULL,
  `experience` int NOT NULL,
  `license_number` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `account_number` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ifsc_code` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bank_branch` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `aadhar_card` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pan_card` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `medical_report` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `police_verification` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `license_file_path` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `police_file_path` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bank_file_path` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `medical_file_path` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `aadhar_file_path` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `wallet_balance` decimal(10,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `drivers`
--

INSERT INTO `drivers` (`id`, `full_name`, `email`, `phone`, `password`, `dob`, `experience`, `license_number`, `bank_name`, `account_number`, `ifsc_code`, `bank_branch`, `aadhar_card`, `pan_card`, `medical_report`, `police_verification`, `license_file_path`, `police_file_path`, `bank_file_path`, `medical_file_path`, `aadhar_file_path`, `created_at`, `wallet_balance`) VALUES
(4, 'ayush jain', 'ayush@gmail.com', '7894561230', 'ayush@gmail.com', NULL, 9, 'RJ-06-2026-0012', 'airtel', '7894561230', '7894561230', 'airtel', '9638527410', 'abcd4908l', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782371146564-aa.jfif', NULL, NULL, NULL, NULL, '2026-06-25 07:05:46', 0.00),
(5, 'krish dixit', 'krish@gmail.com', '9001111442', 'krish@gmail.com', '1998-06-18', 1, 'RJ-06-2026-0016', 'airtel', '9001111442', '9001111442', 'jaipur', '75321468077', 'abcd12345l', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782375332464-aa.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782375332464-images.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782375332464-bank.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782375332464-medical.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782375332464-addhar.jfif', '2026-06-25 08:15:32', 0.00),
(6, 'kamlesh', 'kamlesh@gmail.com', '9090604010', 'kamlesh@gmail.com', '1978-06-09', 15, 'RJ-06-2026-0023', 'kotak', '909090905060', 'SBIN0001234', 'jaipur', '852963741035', 'xcxdcsdfsgv32154564v', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782377681175-aa.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782377681175-images.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782377681175-bank.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782377681175-medical.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782377681175-addhar.jfif', '2026-06-25 08:54:41', 0.00),
(7, 'anurag', 'anurag.sharma@gmail.com', '7891050002', 'anurag.sharma@gmail.com', '1970-09-09', 20, 'RJ06-2022020', 'sbi', '123154541612318421698751', 'SBIN0001255', 'jaipur', '2971-8974-1318', '15456465', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782381252736-aa.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782381252736-images.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782381252736-bank.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782381252736-medical.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782381252736-addhar.jfif', '2026-06-25 09:54:12', 0.00),
(8, 'yash', 'yash@gmail.com', '8305517777', 'yash@gmail.com', '1975-07-17', 9, 'RJ-06-2026-0542', 'union', '741085209630', 'inoin06060', 'jaipur', '2971-8974-1318', '15456465', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782382113401-aa.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782382113401-images.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782382113401-bank.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782382113401-medical.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782382113401-addhar.jfif', '2026-06-25 10:08:33', 0.00),
(9, 'Aman', 'aman@gmail.com', '8945612370', 'aman@gmail.com', '1999-01-03', 3, 'RJ06-2022001', 'sbi', 'ama@gmail.com', 'SBIN0001234', 'jaipur', 'ama@gmail.com', '15456465', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782458006455-aa.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782458006455-images.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782458006455-medical.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782458006455-bank.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782458006455-addhar.jfif', '2026-06-26 07:13:26', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `lrs`
--

CREATE TABLE `lrs` (
  `id` bigint UNSIGNED NOT NULL,
  `lr_number` varchar(50) NOT NULL,
  `booking_date` varchar(15) NOT NULL,
  `branch_id` bigint UNSIGNED DEFAULT NULL,
  `from_city` varchar(100) NOT NULL,
  `to_city` varchar(100) NOT NULL,
  `consignor_id` bigint UNSIGNED NOT NULL,
  `consignee_id` bigint UNSIGNED NOT NULL,
  `goods_desc` varchar(255) NOT NULL,
  `packages` int DEFAULT '0',
  `weight` decimal(10,2) DEFAULT '0.00',
  `weight_type` enum('kg','ton') DEFAULT 'kg',
  `invoice_no` varchar(100) DEFAULT NULL,
  `invoice_value` decimal(12,2) DEFAULT '0.00',
  `eway_bill` varchar(12) DEFAULT NULL,
  `payment_type` enum('paid','topay','tbb') NOT NULL,
  `freight_amount` decimal(10,2) NOT NULL,
  `loading_charges` decimal(10,2) DEFAULT '0.00',
  `unloading_charges` decimal(10,2) DEFAULT '0.00',
  `other_charges` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `gst_applicable` tinyint(1) DEFAULT '0',
  `gst_type` enum('igst','cgst_sgst') DEFAULT 'igst',
  `cgst_amount` decimal(10,2) DEFAULT '0.00',
  `sgst_amount` decimal(10,2) DEFAULT '0.00',
  `igst_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_logs`
--

CREATE TABLE `maintenance_logs` (
  `id` int NOT NULL,
  `vehicle_id` int NOT NULL,
  `maintenance_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `service_date` date DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT '0.00',
  `status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'In Progress',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `maintenance_logs`
--

INSERT INTO `maintenance_logs` (`id`, `vehicle_id`, `maintenance_type`, `category`, `description`, `service_date`, `cost`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Preventive', 'Breakdown', 'cdc', '5555-05-01', 4564312.00, 'Completed', '2026-06-27 06:18:56', '2026-06-27 06:23:53');

-- --------------------------------------------------------

--
-- Table structure for table `operators`
--

CREATE TABLE `operators` (
  `operator_id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'operator',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `operators`
--

INSERT INTO `operators` (`operator_id`, `username`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'admin', 'admin@cargomax.com', '$2b$10$hashedstring...', 'admin', '2026-06-26 08:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `driver_id` int NOT NULL,
  `shipment_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `checkpoint` varchar(255) DEFAULT NULL,
  `upi_id` varchar(255) DEFAULT NULL,
  `upi_ref` varchar(255) DEFAULT NULL,
  `note` text,
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  `paid_by` varchar(255) DEFAULT 'admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipments`
--

CREATE TABLE `shipments` (
  `id` int NOT NULL,
  `tracking_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `destination` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `client` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `weight` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `driver_id` int DEFAULT NULL,
  `vehicle_id` int DEFAULT NULL,
  `eta` datetime DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'Loading',
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `challan_number` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pickup_location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `delivery_location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `freight_charge` decimal(10,2) DEFAULT '0.00',
  `gst` decimal(5,2) DEFAULT '0.00',
  `payment_mode` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'cash'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shipments`
--

INSERT INTO `shipments` (`id`, `tracking_id`, `destination`, `client`, `weight`, `driver_id`, `vehicle_id`, `eta`, `status`, `notes`, `created_at`, `updated_at`, `challan_number`, `pickup_location`, `delivery_location`, `freight_charge`, `gst`, `payment_mode`) VALUES
(1, 'TRK-0001', 'udaipur', 'kartikey', '50', 9, 1, '2026-06-23 14:41:00', 'Delivered', 'ok', '2026-06-27 06:43:03', '2026-06-27 10:03:55', NULL, NULL, NULL, 0.00, 0.00, 'cash'),
(2, 'TRK-0002', 'jodhpur', 'aun', '90', 8, 1, '2026-06-29 15:49:00', 'Delivered', '', '2026-06-27 08:19:37', '2026-06-27 10:03:55', NULL, NULL, NULL, 0.00, 0.00, 'cash'),
(3, 'TRK-0003', 'jaipur', '', NULL, 4, 1, '2026-06-30 03:08:00', 'In Transit', 'xsxs', '2026-06-27 08:38:11', '2026-06-27 13:04:15', NULL, NULL, NULL, 0.00, 0.00, 'cash'),
(4, 'TRK-0004', 'jaipur', 'kamalesh', '12000', 7, 1, '0000-00-00 00:00:00', 'In Transit', '', '2026-06-27 08:44:34', '2026-06-27 10:03:55', NULL, NULL, NULL, 0.00, 0.00, 'cash'),
(5, 'TRK-0005', 'kolkata', 'ok', '10000', 6, 1, '0000-00-00 00:00:00', 'Delayed', '', '2026-06-27 08:48:04', '2026-06-27 10:03:55', NULL, NULL, NULL, 0.00, 0.00, 'cash'),
(6, 'TRK-2026-0006', 'delhi', 'rajesh', NULL, 4, 1, '0000-00-00 00:00:00', 'Delivered', '', '2026-06-27 13:01:11', '2026-06-27 13:04:32', NULL, NULL, NULL, 0.00, 0.00, 'cash'),
(7, 'TRK-2026-0007', 'kota', 'you', NULL, 4, 1, '0000-00-00 00:00:00', 'In Transit', '', '2026-06-27 13:04:59', '2026-06-27 13:04:59', NULL, NULL, NULL, 0.00, 0.00, 'cash'),
(8, 'TRK-2026-0008', 'udaipur', 'kartikey', '', 8, 1, '2026-06-29 09:55:00', 'delivered', 'sas', '2026-06-29 09:55:37', '2026-06-29 09:57:12', 'CHL-20260629-4992', 'udaipur', '', 0.00, 0.00, 'cash');

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `time` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_logs`
--

INSERT INTO `system_logs` (`id`, `type`, `title`, `description`, `time`, `created_at`) VALUES
(1, 'dispatch', '🚚 New Shipment Created', 'Shipment #1 dispatched to Mumbai', '2 mins ago', '2026-06-27 07:10:55'),
(2, 'delivered', '✅ Shipment Delivered', 'Shipment #2 successfully delivered to Delhi', '15 mins ago', '2026-06-27 07:10:55'),
(3, 'alert', '⚠️ Route Alert', 'Heavy traffic on NH-48, delays expected', '1 hour ago', '2026-06-27 07:10:55'),
(4, 'maintenance', '🔧 Vehicle Maintenance', 'VH-203 service completed at workshop', '2 hours ago', '2026-06-27 07:10:55'),
(5, 'dispatch', '📦 Shipment Dispatched', 'Shipment #3 assigned to Rajesh Kumar', '3 hours ago', '2026-06-27 07:10:55'),
(6, 'delivered', '✅ Delivery Confirmed', 'Shipment #4 delivered to Bangalore warehouse', '5 hours ago', '2026-06-27 07:10:55'),
(7, 'alert', '⚠️ Weather Alert', 'Rain expected in Mumbai region', '6 hours ago', '2026-06-27 07:10:55'),
(8, 'dispatch', '🚚 New Shipment Created', 'Shipment #5 dispatched to Chennai Port', '8 hours ago', '2026-06-27 07:10:55'),
(9, 'maintenance', '🔧 Tire Replacement', 'VH-201 tires replaced', '1 day ago', '2026-06-27 07:10:55'),
(10, 'delivered', '✅ Shipment Delivered', 'Shipment #6 delivered to Hyderabad', '1 day ago', '2026-06-27 07:10:55'),
(11, 'dispatch', '🚚 New Shipment Created', 'Shipment #3 dispatched to jaipur', '02:08 pm', '2026-06-27 08:38:11'),
(12, 'dispatch', '✏️ Shipment Updated', 'Shipment #2 status changed to Delivered', '02:11 pm', '2026-06-27 08:41:42'),
(13, 'dispatch', '✏️ Shipment Updated', 'Shipment #1 status changed to Delivered', '02:14 pm', '2026-06-27 08:44:05'),
(14, 'dispatch', '✏️ Shipment Updated', 'Shipment #2 status changed to Delivered', '02:14 pm', '2026-06-27 08:44:14'),
(15, 'dispatch', '🚚 New Shipment Created', 'Shipment #4 dispatched to jaipur', '02:14 pm', '2026-06-27 08:44:34'),
(16, 'dispatch', '🚚 New Shipment Created', 'Shipment #5 dispatched to kolkata', '02:18 pm', '2026-06-27 08:48:04'),
(17, 'dispatch', '🚚 New Shipment Created', 'Shipment #6 dispatched to delhi', '06:31 pm', '2026-06-27 13:01:11'),
(18, 'dispatch', '✏️ Shipment Updated', 'Shipment #3 status changed to In Transit', '06:34 pm', '2026-06-27 13:04:15'),
(19, 'dispatch', '✏️ Shipment Updated', 'Shipment #6 status changed to Delivered', '06:34 pm', '2026-06-27 13:04:32'),
(20, 'dispatch', '🚚 New Shipment Created', 'Shipment #7 dispatched to kota', '06:34 pm', '2026-06-27 13:04:59'),
(21, 'dispatch', '🚚 New Shipment Created', 'Shipment #undefined dispatched to udaipur', '03:25 pm', '2026-06-29 09:55:37');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int NOT NULL,
  `transaction_id` varchar(50) NOT NULL,
  `user_id` int DEFAULT NULL,
  `driver_id` int DEFAULT NULL,
  `shipment_id` int DEFAULT NULL,
  `type` enum('credit','debit','refund','payment') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('pending','completed','failed','processing') DEFAULT 'pending',
  `payment_method` enum('cash','card','upi','bank_transfer','wallet') DEFAULT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `transaction_id`, `user_id`, `driver_id`, `shipment_id`, `type`, `amount`, `description`, `status`, `payment_method`, `reference`, `metadata`, `created_at`, `updated_at`) VALUES
(1, 'TXN-DEMO-001', NULL, 4, NULL, 'credit', 5000.00, 'Initial wallet credit', 'completed', 'wallet', NULL, NULL, '2026-07-06 05:56:18', '2026-07-06 05:56:18'),
(2, 'TXN-DEMO-002', NULL, 5, NULL, 'credit', 2500.00, 'Payment received for shipment #TRK-0001', 'completed', 'upi', NULL, NULL, '2026-07-06 05:56:18', '2026-07-06 05:56:18'),
(3, 'TXN-DEMO-003', NULL, 6, NULL, 'debit', 1200.00, 'Service charge deduction', 'completed', 'wallet', NULL, NULL, '2026-07-06 05:56:18', '2026-07-06 05:56:18'),
(4, 'TXN-DEMO-004', NULL, 7, NULL, 'credit', 7500.00, 'Freight payment', 'pending', 'bank_transfer', NULL, NULL, '2026-07-06 05:56:18', '2026-07-06 05:56:18'),
(5, 'TXN-DEMO-005', NULL, 8, NULL, 'credit', 3500.00, 'Payment for delivery', 'completed', 'cash', NULL, NULL, '2026-07-06 05:56:18', '2026-07-06 05:56:18'),
(6, 'TXN-DEMO-006', NULL, 9, NULL, 'debit', 500.00, 'Penalty for delay', 'completed', 'wallet', NULL, NULL, '2026-07-06 05:56:18', '2026-07-06 05:56:18');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int NOT NULL,
  `vehicle_id` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `year` varchar(4) COLLATE utf8mb4_general_ci NOT NULL,
  `license_plate` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `puc_certificate_number` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `puc_expiry_date` date DEFAULT NULL,
  `upload_puc_document_copy_file_path` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `vehicle_id`, `type`, `company_name`, `year`, `license_plate`, `puc_certificate_number`, `puc_expiry_date`, `upload_puc_document_copy_file_path`, `notes`, `created_at`) VALUES
(1, 'TRK001', 'mini', 'KAMLESH', '2022', 'PUR', '13153jnl', NULL, NULL, 's', '2026-06-26 06:52:02');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `city`
--
ALTER TABLE `city`
  ADD PRIMARY KEY (`city_id`);

--
-- Indexes for table `client`
--
ALTER TABLE `client`
  ADD PRIMARY KEY (`client_id`);

--
-- Indexes for table `company_profiles`
--
ALTER TABLE `company_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_name` (`company_name`),
  ADD KEY `idx_city` (`city`),
  ADD KEY `idx_state` (`state`);

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `lrs`
--
ALTER TABLE `lrs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `lr_number` (`lr_number`),
  ADD KEY `idx_lr_number` (`lr_number`),
  ADD KEY `idx_booking_date` (`booking_date`);

--
-- Indexes for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicle_id` (`vehicle_id`);

--
-- Indexes for table `operators`
--
ALTER TABLE `operators`
  ADD PRIMARY KEY (`operator_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `driver_id` (`driver_id`),
  ADD KEY `shipment_id` (`shipment_id`);

--
-- Indexes for table `shipments`
--
ALTER TABLE `shipments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `driver_id` (`driver_id`),
  ADD KEY `vehicle_id` (`vehicle_id`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD KEY `driver_id` (`driver_id`),
  ADD KEY `shipment_id` (`shipment_id`),
  ADD KEY `idx_transaction_id` (`transaction_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `city`
--
ALTER TABLE `city`
  MODIFY `city_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `client`
--
ALTER TABLE `client`
  MODIFY `client_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_profiles`
--
ALTER TABLE `company_profiles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `lrs`
--
ALTER TABLE `lrs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `operators`
--
ALTER TABLE `operators`
  MODIFY `operator_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipments`
--
ALTER TABLE `shipments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  ADD CONSTRAINT `maintenance_logs_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `shipments`
--
ALTER TABLE `shipments`
  ADD CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `shipments_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
