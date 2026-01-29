<?php
header('Content-Type: application/json');

try {
    $conn = new PDO('mysql:host=localhost;dbname=indian_wonderer_base', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if travel_bookings table exists
    $tables = $conn->query("SHOW TABLES LIKE 'travel_bookings'")->fetchAll();
    
    if (empty($tables)) {
        // Create travel_bookings table
        $conn->exec("
            CREATE TABLE IF NOT EXISTS travel_bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_reference VARCHAR(50) UNIQUE NOT NULL,
                user_id INT NOT NULL,
                travel_id INT NOT NULL,
                mode VARCHAR(20) NOT NULL,
                from_city VARCHAR(100) NOT NULL,
                to_city VARCHAR(100) NOT NULL,
                travel_date DATE NOT NULL,
                operator_name VARCHAR(100) NOT NULL,
                vehicle_number VARCHAR(50),
                seat_class VARCHAR(50),
                base_cost DECIMAL(10,2) NOT NULL,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                seat_charges DECIMAL(10,2) DEFAULT 0,
                total_amount DECIMAL(10,2) NOT NULL,
                passenger_name VARCHAR(100) NOT NULL,
                passenger_email VARCHAR(100) NOT NULL,
                passenger_phone VARCHAR(20) NOT NULL,
                selected_seats JSON,
                booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
                payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
                payment_id VARCHAR(100),
                payment_method VARCHAR(50),
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (travel_id) REFERENCES travel_options(id),
                INDEX idx_user_bookings (user_id),
                INDEX idx_travel_bookings (travel_id),
                INDEX idx_booking_status (booking_status),
                INDEX idx_travel_date (travel_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create travel_booking_passengers table for multiple passengers per booking
        $conn->exec("
            CREATE TABLE IF NOT EXISTS travel_booking_passengers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                passenger_name VARCHAR(100) NOT NULL,
                passenger_email VARCHAR(100) NOT NULL,
                passenger_phone VARCHAR(20) NOT NULL,
                seat_number VARCHAR(10) NOT NULL,
                age INT,
                gender ENUM('male', 'female', 'other'),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES travel_bookings(id) ON DELETE CASCADE,
                INDEX idx_booking_passengers (booking_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        echo json_encode([
            'success' => true, 
            'message' => 'Travel booking tables created successfully',
            'tables_created' => ['travel_bookings', 'travel_booking_passengers']
        ]);
    } else {
        echo json_encode([
            'success' => true, 
            'message' => 'Travel booking tables already exist',
            'exists' => true
        ]);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
