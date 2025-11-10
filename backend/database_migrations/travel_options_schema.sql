/**
 * Travel Options Module - Database Schema
 * Unified table for Flight, Bus, and Train bookings
 * Integrated with Indian Wonderer payment and booking system
 */

-- =====================================================
-- TABLE: travel_options
-- =====================================================
-- Stores all travel bookings (flights, buses, trains)
-- Each booking can be:
-- - Integrated: linked to a tour booking (booking_id not null)
-- - Standalone: independent travel booking

CREATE TABLE IF NOT EXISTS travel_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- User & Booking References
    user_id INT NOT NULL,
    booking_id INT NULL COMMENT 'NULL for standalone, tour booking ID for integrated',
    
    -- Travel Details
    mode ENUM('flight', 'bus', 'train') NOT NULL,
    type ENUM('integrated', 'standalone') NOT NULL DEFAULT 'standalone',
    
    -- Route Information
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    travel_date DATE NOT NULL,
    travel_time TIME NOT NULL,
    
    -- Transport Specific
    operator_name VARCHAR(100) COMMENT 'Airline, bus company, railway',
    vehicle_number VARCHAR(50),
    seat_class VARCHAR(50) COMMENT 'Economy, Business, First for flights; AC, Non-AC for buses; Sleeper, AC for trains',
    seat_numbers VARCHAR(500) COMMENT 'Comma-separated or JSON for multiple passengers',
    
    -- Pricing
    cost DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (cost + tax) STORED,
    
    -- Commission (for agents/partners)
    commission_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Commission percentage',
    commission_amount DECIMAL(10, 2) GENERATED ALWAYS AS (cost * (commission_rate / 100)) STORED,
    
    -- Booking Status
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, confirmed, cancelled, completed',
    payment_status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, completed, failed',
    
    -- Passenger Information
    passenger_name VARCHAR(100) NOT NULL,
    passenger_email VARCHAR(100),
    passenger_phone VARCHAR(20),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    
    -- Indexes for Performance
    INDEX idx_user_id (user_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_type (type),
    INDEX idx_mode (mode),
    INDEX idx_status (status),
    INDEX idx_travel_date (travel_date),
    INDEX idx_created_at (created_at),
    INDEX idx_search (from_city, to_city, travel_date),
    
    -- Unique Constraint for confirmed bookings
    UNIQUE KEY unique_confirmed_seat (booking_id, vehicle_number, seat_numbers)
        WHERE status = 'confirmed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: travel_routes (Master Data)
-- =====================================================
-- Pre-defined routes for quick search and filtering

CREATE TABLE IF NOT EXISTS travel_routes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    mode ENUM('flight', 'bus', 'train') NOT NULL,
    
    distance_km INT,
    duration_hours DECIMAL(5, 2),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_mode (mode),
    INDEX idx_cities (from_city, to_city),
    UNIQUE KEY unique_route (from_city, to_city, mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: travel_operators (Master Data)
-- =====================================================
-- Airline, bus company, and railway operator information

CREATE TABLE IF NOT EXISTS travel_operators (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    name VARCHAR(100) NOT NULL UNIQUE,
    mode ENUM('flight', 'bus', 'train') NOT NULL,
    
    -- Contact & Info
    email VARCHAR(100),
    phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Commission Setup
    default_commission_rate DECIMAL(5, 2) DEFAULT 0.00,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_mode (mode),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Seed Data: Common Routes
-- =====================================================

INSERT INTO travel_routes (from_city, to_city, mode, distance_km, duration_hours) VALUES
-- Flights
('Delhi', 'Mumbai', 'flight', 1400, 2.5),
('Delhi', 'Bangalore', 'flight', 2200, 2.75),
('Mumbai', 'Goa', 'flight', 600, 1.5),
('Bangalore', 'Goa', 'flight', 600, 1.5),
('Delhi', 'Jaipur', 'flight', 240, 1.0),

-- Buses
('Delhi', 'Jaipur', 'bus', 240, 4.0),
('Delhi', 'Agra', 'bus', 206, 3.5),
('Mumbai', 'Pune', 'bus', 150, 2.5),
('Bangalore', 'Mysore', 'bus', 145, 2.5),
('Goa', 'Bangalore', 'bus', 600, 10.0),

-- Trains
('Delhi', 'Agra', 'train', 206, 3.0),
('Delhi', 'Jaipur', 'train', 240, 5.0),
('Mumbai', 'Goa', 'train', 750, 14.0),
('Delhi', 'Varanasi', 'train', 800, 15.0),
('Bangalore', 'Chennai', 'train', 350, 5.5)
ON DUPLICATE KEY UPDATE distance_km=VALUES(distance_km), duration_hours=VALUES(duration_hours);

-- =====================================================
-- Seed Data: Operators
-- =====================================================

INSERT INTO travel_operators (name, mode, email, phone, website, default_commission_rate) VALUES
-- Airlines
('Air India', 'flight', 'info@airindia.in', '+91-1800-180-1407', 'www.airindia.in', 3.00),
('IndiGo', 'flight', 'customer@goindigo.in', '+91-9910-922-888', 'www.goindigo.in', 2.50),
('Spice Jet', 'flight', 'care@spicejet.com', '+91-9876-555-555', 'www.spicejet.com', 2.50),

-- Bus Operators
('Redbus', 'bus', 'support@redbus.in', '+91-44-7170-1111', 'www.redbus.in', 5.00),
('Travels', 'bus', 'info@travels.in', '+91-11-4141-1111', 'www.travels.in', 4.00),
('State Transport', 'bus', 'info@statetransport.in', '+91-22-2345-6789', 'www.statetransport.in', 3.00),

-- Train Operators
('Indian Railways', 'train', 'info@indianrailways.gov.in', '+91-11-2340-3333', 'www.indianrailways.gov.in', 0.00),
('IRCTC', 'train', 'care@irctc.co.in', '+91-11-2340-4444', 'www.irctc.co.in', 1.50)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- =====================================================
-- Sample Query to fetch available flights from Delhi to Mumbai on a date
-- =====================================================
/*
SELECT 
    id,
    mode,
    operator_name,
    from_city,
    to_city,
    travel_date,
    travel_time,
    seat_class,
    cost,
    tax,
    total_amount,
    status
FROM travel_options
WHERE from_city = 'Delhi'
    AND to_city = 'Mumbai'
    AND travel_date = '2024-11-15'
    AND mode = 'flight'
    AND status = 'available'
ORDER BY travel_time ASC;
*/
