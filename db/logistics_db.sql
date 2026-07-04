-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 30, 2026 at 08:49 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `dob` date DEFAULT NULL,
  `experience` int(11) NOT NULL,
  `license_number` varchar(100) NOT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `bank_branch` varchar(100) DEFAULT NULL,
  `aadhar_card` varchar(20) DEFAULT NULL,
  `pan_card` varchar(20) DEFAULT NULL,
  `medical_report` varchar(255) DEFAULT NULL,
  `police_verification` varchar(255) DEFAULT NULL,
  `license_file_path` varchar(255) DEFAULT NULL,
  `police_file_path` varchar(255) DEFAULT NULL,
  `bank_file_path` varchar(255) DEFAULT NULL,
  `medical_file_path` varchar(255) DEFAULT NULL,
  `aadhar_file_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `drivers`
--

INSERT INTO `drivers` (`id`, `full_name`, `email`, `phone`, `password`, `dob`, `experience`, `license_number`, `bank_name`, `account_number`, `ifsc_code`, `bank_branch`, `aadhar_card`, `pan_card`, `medical_report`, `police_verification`, `license_file_path`, `police_file_path`, `bank_file_path`, `medical_file_path`, `aadhar_file_path`, `created_at`) VALUES
(4, 'ayush jain', 'ayush@gmail.com', '7894561230', 'ayush@gmail.com', NULL, 9, 'RJ-06-2026-0012', 'airtel', '7894561230', '7894561230', 'airtel', '9638527410', 'abcd4908l', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782371146564-aa.jfif', NULL, NULL, NULL, NULL, '2026-06-25 07:05:46'),
(5, 'krish dixit', 'krish@gmail.com', '9001111442', 'krish@gmail.com', '1998-06-18', 1, 'RJ-06-2026-0016', 'airtel', '9001111442', '9001111442', 'jaipur', '75321468077', 'abcd12345l', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782375332464-aa.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782375332464-images.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782375332464-bank.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782375332464-medical.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782375332464-addhar.jfif', '2026-06-25 08:15:32'),
(6, 'kamlesh', 'kamlesh@gmail.com', '9090604010', 'kamlesh@gmail.com', '1978-06-09', 15, 'RJ-06-2026-0023', 'kotak', '909090905060', 'SBIN0001234', 'jaipur', '852963741035', 'xcxdcsdfsgv32154564v', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782377681175-aa.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782377681175-images.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782377681175-bank.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782377681175-medical.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782377681175-addhar.jfif', '2026-06-25 08:54:41'),
(7, 'anurag', 'anurag.sharma@gmail.com', '7891050002', 'anurag.sharma@gmail.com', '1970-09-09', 20, 'RJ06-2022020', 'sbi', '123154541612318421698751', 'SBIN0001255', 'jaipur', '2971-8974-1318', '15456465', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782381252736-aa.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782381252736-images.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782381252736-bank.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782381252736-medical.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782381252736-addhar.jfif', '2026-06-25 09:54:12'),
(8, 'yash', 'yash@gmail.com', '8305517777', 'yash@gmail.com', '1975-07-17', 9, 'RJ-06-2026-0542', 'union', '741085209630', 'inoin06060', 'jaipur', '2971-8974-1318', '15456465', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782382113401-aa.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782382113401-images.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782382113401-bank.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782382113401-medical.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782382113401-addhar.jfif', '2026-06-25 10:08:33'),
(9, 'Aman', 'aman@gmail.com', '8945612370', 'aman@gmail.com', '1999-01-03', 3, 'RJ06-2022001', 'sbi', 'ama@gmail.com', 'SBIN0001234', 'jaipur', 'ama@gmail.com', '15456465', 'Approved', 'Approved', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782458006455-aa.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782458006455-images.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782458006455-medical.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782458006455-bank.jfif', 'https://my-fleet-bucket.s3.amazonaws.com/drivers/1782458006455-addhar.jfif', '2026-06-26 07:13:26');

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_logs`
--

CREATE TABLE `maintenance_logs` (
  `id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `maintenance_type` varchar(50) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `service_date` date DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'In Progress',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
  `operator_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) DEFAULT 'operator',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `operators`
--

INSERT INTO `operators` (`operator_id`, `username`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'admin', 'admin@cargomax.com', '$2b$10$hashedstring...', 'admin', '2026-06-26 08:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `shipments`
--

CREATE TABLE `shipments` (
  `id` int(11) NOT NULL,
  `tracking_id` varchar(50) DEFAULT NULL,
  `destination` varchar(255) NOT NULL,
  `client` varchar(255) DEFAULT NULL,
  `weight` varchar(50) DEFAULT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `eta` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Loading',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `challan_number` varchar(50) DEFAULT NULL,
  `pickup_location` varchar(255) DEFAULT NULL,
  `delivery_location` varchar(255) DEFAULT NULL,
  `freight_charge` decimal(10,2) DEFAULT 0.00,
  `gst` decimal(5,2) DEFAULT 0.00,
  `payment_mode` varchar(50) DEFAULT 'cash'
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
  `id` int(11) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `time` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
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
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `vehicle_id` varchar(100) NOT NULL,
  `type` varchar(255) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `year` varchar(4) NOT NULL,
  `license_plate` varchar(50) NOT NULL,
  `puc_certificate_number` varchar(100) NOT NULL,
  `puc_expiry_date` date DEFAULT NULL,
  `upload_puc_document_copy_file_path` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
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
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

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
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `operators`
--
ALTER TABLE `operators`
  MODIFY `operator_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `shipments`
--
ALTER TABLE `shipments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  ADD CONSTRAINT `maintenance_logs_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shipments`
--
ALTER TABLE `shipments`
  ADD CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `shipments_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
