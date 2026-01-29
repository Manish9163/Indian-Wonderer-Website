<?php
header('Content-Type: application/json');

try {
    $conn = new PDO('mysql:host=localhost;dbname=indian_wonderer_base', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if seats table exists
    $tables = $conn->query("SHOW TABLES LIKE 'seats'")->fetchAll();
    
    if (empty($tables)) {
        echo json_encode(['exists' => false, 'message' => 'Seats table does not exist']);
        
        // Create seats table
        $conn->exec("
            CREATE TABLE IF NOT EXISTS seats (
                id INT PRIMARY KEY AUTO_INCREMENT,
                travel_id INT NOT NULL,
                seat_no VARCHAR(10) NOT NULL,
                seat_type VARCHAR(50) DEFAULT 'economy',
                row_number INT NOT NULL,
                column_letter VARCHAR(5),
                is_booked BOOLEAN DEFAULT FALSE,
                booked_by INT NULL,
                booking_id INT NULL,
                price DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_seat (travel_id, seat_no),
                FOREIGN KEY (travel_id) REFERENCES travel_options(id) ON DELETE CASCADE,
                FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_travel_seats (travel_id),
                INDEX idx_booked (is_booked)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        echo json_encode(['success' => true, 'message' => 'Seats table created successfully']);
    } else {
        echo json_encode(['exists' => true, 'message' => 'Seats table already exists']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
