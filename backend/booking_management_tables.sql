-- Create tables for cancellation and refund management

-- Gift Cards table
CREATE TABLE IF NOT EXISTS `gift_cards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL UNIQUE,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance` decimal(10,2) NOT NULL,
  `expiry_date` date NOT NULL,
  `status` enum('active','used','expired','cancelled') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refunds table
CREATE TABLE IF NOT EXISTS `refunds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `method` enum('bank','upi','card','wallet') DEFAULT 'bank',
  `transaction_id` varchar(100) NULL,
  `initiated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text NULL,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Booking Logs table
CREATE TABLE IF NOT EXISTS `booking_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL,
  `action` enum('create','edit','cancel','confirm','refund','complete') NOT NULL,
  `reason` text NULL,
  `details` json NULL,
  `created_by` int(11) NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign keys if not exists
ALTER TABLE `gift_cards` 
  ADD CONSTRAINT `fk_giftcard_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `refunds` 
  ADD CONSTRAINT `fk_refund_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

ALTER TABLE `booking_logs` 
  ADD CONSTRAINT `fk_log_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;
