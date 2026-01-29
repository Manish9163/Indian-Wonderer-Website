<?php
header('Content-Type: application/json');

try {
    $conn = new PDO('mysql:host=localhost;dbname=indian_wonderer_base', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $tables_created = [];

    // Travel Reviews Table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS travel_reviews (
            id INT PRIMARY KEY AUTO_INCREMENT,
            travel_id INT NOT NULL,
            user_id INT NOT NULL,
            booking_id INT,
            rating DECIMAL(2,1) NOT NULL CHECK (rating BETWEEN 1.0 AND 5.0),
            review_text TEXT,
            cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
            punctuality_rating INT CHECK (punctuality_rating BETWEEN 1 AND 5),
            staff_rating INT CHECK (staff_rating BETWEEN 1 AND 5),
            is_verified BOOLEAN DEFAULT FALSE,
            helpful_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (travel_id) REFERENCES travel_options(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            INDEX idx_travel_reviews (travel_id),
            INDEX idx_rating (rating)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $tables_created[] = 'travel_reviews';

    // Promo Codes Table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS promo_codes (
            id INT PRIMARY KEY AUTO_INCREMENT,
            code VARCHAR(50) UNIQUE NOT NULL,
            description VARCHAR(255),
            discount_type ENUM('percentage', 'flat') NOT NULL,
            discount_value DECIMAL(10,2) NOT NULL,
            min_booking_amount DECIMAL(10,2) DEFAULT 0,
            max_discount DECIMAL(10,2),
            applicable_modes JSON,
            usage_limit INT DEFAULT NULL,
            used_count INT DEFAULT 0,
            valid_from DATE,
            valid_until DATE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_code (code),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $tables_created[] = 'promo_codes';

    // User Travel Preferences
    $conn->exec("
        CREATE TABLE IF NOT EXISTS user_travel_preferences (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT UNIQUE NOT NULL,
            preferred_seat_type VARCHAR(50),
            meal_preference ENUM('veg', 'non-veg', 'vegan', 'jain') DEFAULT 'veg',
            window_seat_preference BOOLEAN DEFAULT FALSE,
            special_assistance ENUM('none', 'wheelchair', 'elderly', 'pregnant', 'infant'),
            frequent_routes JSON,
            notification_preferences JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $tables_created[] = 'user_travel_preferences';

    // Saved Travelers (Co-passengers)
    $conn->exec("
        CREATE TABLE IF NOT EXISTS saved_travelers (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            traveler_name VARCHAR(100) NOT NULL,
            relationship VARCHAR(50),
            email VARCHAR(100),
            phone VARCHAR(20),
            age INT,
            gender ENUM('male', 'female', 'other'),
            id_type VARCHAR(50),
            id_number VARCHAR(100),
            nationality VARCHAR(50) DEFAULT 'Indian',
            is_primary BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_travelers (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $tables_created[] = 'saved_travelers';

    // Travel Insurance
    $conn->exec("
        CREATE TABLE IF NOT EXISTS travel_insurance (
            id INT PRIMARY KEY AUTO_INCREMENT,
            booking_id INT NOT NULL,
            insurance_provider VARCHAR(100) NOT NULL,
            policy_number VARCHAR(100) UNIQUE NOT NULL,
            coverage_amount DECIMAL(10,2) NOT NULL,
            premium_amount DECIMAL(10,2) NOT NULL,
            coverage_type ENUM('basic', 'comprehensive', 'premium') DEFAULT 'basic',
            covered_passengers JSON,
            valid_from DATE NOT NULL,
            valid_until DATE NOT NULL,
            status ENUM('active', 'expired', 'claimed', 'cancelled') DEFAULT 'active',
            terms_conditions TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES travel_bookings(id),
            INDEX idx_booking_insurance (booking_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $tables_created[] = 'travel_insurance';

    // Cancellation Requests
    $conn->exec("
        CREATE TABLE IF NOT EXISTS travel_cancellations (
            id INT PRIMARY KEY AUTO_INCREMENT,
            booking_id INT NOT NULL,
            user_id INT NOT NULL,
            cancellation_reason TEXT,
            cancellation_type ENUM('full', 'partial') DEFAULT 'full',
            cancelled_seats JSON,
            original_amount DECIMAL(10,2) NOT NULL,
            cancellation_charges DECIMAL(10,2) DEFAULT 0,
            refund_amount DECIMAL(10,2) NOT NULL,
            refund_method VARCHAR(50),
            refund_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
            refund_reference VARCHAR(100),
            processed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES travel_bookings(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            INDEX idx_booking_cancel (booking_id),
            INDEX idx_refund_status (refund_status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $tables_created[] = 'travel_cancellations';

    // Price Alerts
    $conn->exec("
        CREATE TABLE IF NOT EXISTS price_alerts (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            from_city VARCHAR(100) NOT NULL,
            to_city VARCHAR(100) NOT NULL,
            mode VARCHAR(20),
            target_price DECIMAL(10,2),
            is_active BOOLEAN DEFAULT TRUE,
            alert_sent BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_alerts (user_id),
            INDEX idx_active_alerts (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $tables_created[] = 'price_alerts';

    // Loyalty Points
    $conn->exec("
        CREATE TABLE IF NOT EXISTS loyalty_points (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT UNIQUE NOT NULL,
            total_points INT DEFAULT 0,
            lifetime_points INT DEFAULT 0,
            tier ENUM('silver', 'gold', 'platinum', 'diamond') DEFAULT 'silver',
            tier_benefits JSON,
            points_expiry_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $tables_created[] = 'loyalty_points';

    // Points Transactions
    $conn->exec("
        CREATE TABLE IF NOT EXISTS loyalty_transactions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            booking_id INT,
            transaction_type ENUM('earned', 'redeemed', 'expired', 'adjusted') NOT NULL,
            points INT NOT NULL,
            description VARCHAR(255),
            balance_after INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (booking_id) REFERENCES travel_bookings(id),
            INDEX idx_user_points (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $tables_created[] = 'loyalty_transactions';

    // Insert sample promo codes
    $conn->exec("
        INSERT IGNORE INTO promo_codes (code, description, discount_type, discount_value, min_booking_amount, max_discount, applicable_modes, valid_from, valid_until, is_active)
        VALUES 
        ('FIRST100', 'First booking discount', 'flat', 100.00, 500.00, 100.00, '[\"flight\",\"bus\",\"train\"]', '2026-01-01', '2026-12-31', 1),
        ('TRAVEL15', '15% off on all bookings', 'percentage', 15.00, 1000.00, 500.00, '[\"flight\",\"bus\",\"train\"]', '2026-01-01', '2026-12-31', 1),
        ('FLIGHT200', 'Flight booking special', 'flat', 200.00, 2000.00, 200.00, '[\"flight\"]', '2026-01-01', '2026-12-31', 1),
        ('BUS50', 'Bus booking discount', 'flat', 50.00, 300.00, 50.00, '[\"bus\"]', '2026-01-01', '2026-12-31', 1),
        ('TRAIN100', 'Train travel discount', 'flat', 100.00, 800.00, 100.00, '[\"train\"]', '2026-01-01', '2026-12-31', 1)
    ");

    echo json_encode([
        'success' => true,
        'message' => 'Enhanced travel features tables created successfully',
        'tables_created' => $tables_created,
        'promo_codes_added' => 5
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
