-- Real-time Guide Tracking System
-- Database schema for live location tracking and tour monitoring

USE indian_wonderer_base;

-- Guide location tracking table
CREATE TABLE IF NOT EXISTS `guide_locations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `guide_id` INT(11) NOT NULL,
  `booking_id` INT(11) NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `accuracy` DECIMAL(10, 2) DEFAULT NULL COMMENT 'GPS accuracy in meters',
  `speed` DECIMAL(10, 2) DEFAULT NULL COMMENT 'Speed in km/h',
  `heading` DECIMAL(10, 2) DEFAULT NULL COMMENT 'Direction in degrees',
  `altitude` DECIMAL(10, 2) DEFAULT NULL COMMENT 'Altitude in meters',
  `battery_level` INT(3) DEFAULT NULL COMMENT 'Battery percentage',
  `is_active` BOOLEAN DEFAULT TRUE,
  `recorded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `guide_id` (`guide_id`),
  KEY `booking_id` (`booking_id`),
  KEY `recorded_at` (`recorded_at`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tour sessions table (track when tours start/end)
CREATE TABLE IF NOT EXISTS `tour_sessions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `booking_id` INT(11) NOT NULL,
  `guide_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `tour_id` INT(11) NOT NULL,
  `status` ENUM('scheduled', 'started', 'paused', 'resumed', 'completed', 'cancelled') DEFAULT 'scheduled',
  `start_location_lat` DECIMAL(10, 8) DEFAULT NULL,
  `start_location_lng` DECIMAL(11, 8) DEFAULT NULL,
  `end_location_lat` DECIMAL(10, 8) DEFAULT NULL,
  `end_location_lng` DECIMAL(11, 8) DEFAULT NULL,
  `total_distance` DECIMAL(10, 2) DEFAULT 0 COMMENT 'Total distance traveled in km',
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `scheduled_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_id` (`booking_id`),
  KEY `guide_id` (`guide_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `started_at` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tour checkpoints/waypoints table
CREATE TABLE IF NOT EXISTS `tour_checkpoints` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tour_session_id` INT(11) NOT NULL,
  `checkpoint_name` VARCHAR(200) NOT NULL,
  `checkpoint_description` TEXT DEFAULT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `planned_arrival` TIMESTAMP NULL DEFAULT NULL,
  `actual_arrival` TIMESTAMP NULL DEFAULT NULL,
  `departure_time` TIMESTAMP NULL DEFAULT NULL,
  `duration_minutes` INT(11) DEFAULT NULL,
  `status` ENUM('pending', 'reached', 'completed', 'skipped') DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `photos` JSON DEFAULT NULL COMMENT 'Array of photo URLs',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tour_session_id` (`tour_session_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Real-time notifications table
CREATE TABLE IF NOT EXISTS `tracking_notifications` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `booking_id` INT(11) NOT NULL,
  `notification_type` ENUM('tour_started', 'checkpoint_reached', 'tour_paused', 'tour_resumed', 'tour_completed', 'guide_message', 'emergency') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `data` JSON DEFAULT NULL COMMENT 'Additional notification data',
  `is_read` BOOLEAN DEFAULT FALSE,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `booking_id` (`booking_id`),
  KEY `is_read` (`is_read`),
  KEY `sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guide-to-customer chat messages
CREATE TABLE IF NOT EXISTS `tour_chat_messages` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `booking_id` INT(11) NOT NULL,
  `sender_type` ENUM('guide', 'customer') NOT NULL,
  `sender_id` INT(11) NOT NULL,
  `message` TEXT NOT NULL,
  `message_type` ENUM('text', 'image', 'location', 'audio') DEFAULT 'text',
  `media_url` VARCHAR(500) DEFAULT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `sender_id` (`sender_id`),
  KEY `is_read` (`is_read`),
  KEY `sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Emergency alerts table
CREATE TABLE IF NOT EXISTS `emergency_alerts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `booking_id` INT(11) NOT NULL,
  `guide_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `alert_type` ENUM('sos', 'medical', 'accident', 'breakdown', 'weather', 'other') NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('active', 'acknowledged', 'resolved', 'cancelled') DEFAULT 'active',
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `guide_id` (`guide_id`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign keys
ALTER TABLE `guide_locations` 
  ADD CONSTRAINT `fk_gl_guide` FOREIGN KEY (`guide_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_gl_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

ALTER TABLE `tour_sessions` 
  ADD CONSTRAINT `fk_ts_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ts_guide` FOREIGN KEY (`guide_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ts_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE;

ALTER TABLE `tour_checkpoints` 
  ADD CONSTRAINT `fk_tc_session` FOREIGN KEY (`tour_session_id`) REFERENCES `tour_sessions` (`id`) ON DELETE CASCADE;

ALTER TABLE `tracking_notifications` 
  ADD CONSTRAINT `fk_tn_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tn_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

ALTER TABLE `tour_chat_messages` 
  ADD CONSTRAINT `fk_tcm_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

ALTER TABLE `emergency_alerts` 
  ADD CONSTRAINT `fk_ea_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ea_guide` FOREIGN KEY (`guide_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ea_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX idx_gl_latest ON guide_locations (booking_id, recorded_at DESC);
CREATE INDEX idx_ts_active ON tour_sessions (status, started_at DESC);
CREATE INDEX idx_tcm_unread ON tour_chat_messages (booking_id, is_read);

-- Insert sample tour session for testing (optional)
-- INSERT INTO tour_sessions (booking_id, guide_id, user_id, tour_id, status, scheduled_at) 
-- VALUES (1, 1, 1, 1, 'scheduled', NOW());
