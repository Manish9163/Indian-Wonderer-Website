<?php
header('Content-Type: application/json');

try {
    $conn = new PDO('mysql:host=localhost;dbname=indian_wonderer_base', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create travel_passengers table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS travel_passengers (
            id INT PRIMARY KEY AUTO_INCREMENT,
            booking_id INT NOT NULL,
            travel_id INT NOT NULL,
            seat_number VARCHAR(10) NOT NULL,
            passenger_name VARCHAR(100) NOT NULL,
            passenger_email VARCHAR(100) NOT NULL,
            passenger_phone VARCHAR(20) NOT NULL,
            passenger_age INT,
            passenger_gender ENUM('male', 'female', 'other'),
            id_type VARCHAR(50),
            id_number VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES travel_bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (travel_id) REFERENCES travel_options(id),
            INDEX idx_booking_passengers (booking_id),
            INDEX idx_travel_passengers (travel_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    echo json_encode([
        'success' => true,
        'message' => 'Travel passengers table created successfully'
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
