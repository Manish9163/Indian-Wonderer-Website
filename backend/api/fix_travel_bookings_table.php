<?php
header('Content-Type: application/json');

try {
    $conn = new PDO('mysql:host=localhost;dbname=indian_wonderer_base', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Add missing columns to travel_bookings table
    $alterations = [
        "ADD COLUMN travel_id INT NOT NULL AFTER user_id",
        "ADD COLUMN booking_reference VARCHAR(50) UNIQUE AFTER user_id",
        "ADD COLUMN vehicle_number VARCHAR(50) AFTER operator_name",
        "ADD COLUMN seat_class VARCHAR(50) AFTER vehicle_number",
        "ADD COLUMN base_cost DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER seat_class",
        "ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0 AFTER base_cost",
        "ADD COLUMN seat_charges DECIMAL(10,2) DEFAULT 0 AFTER tax_amount",
        "ADD COLUMN passenger_email VARCHAR(100) AFTER passenger_name",
        "ADD COLUMN passenger_phone VARCHAR(20) AFTER passenger_email",
        "ADD COLUMN selected_seats JSON AFTER passenger_phone",
        "ADD COLUMN booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'confirmed' AFTER selected_seats",
        "ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' AFTER booking_status",
        "ADD COLUMN payment_id VARCHAR(100) AFTER payment_status",
        "ADD COLUMN payment_method VARCHAR(50) AFTER payment_id",
        "ADD COLUMN booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER payment_method",
        "ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
        "ADD INDEX idx_travel_bookings (travel_id)",
        "ADD INDEX idx_booking_status (booking_status)",
        "ADD INDEX idx_travel_date (travel_date)"
    ];

    $added = [];
    $skipped = [];
    
    foreach ($alterations as $alteration) {
        try {
            $conn->exec("ALTER TABLE travel_bookings $alteration");
            $added[] = $alteration;
        } catch (PDOException $e) {
            // Column/index might already exist
            $skipped[] = [
                'alteration' => $alteration,
                'error' => $e->getMessage()
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Travel bookings table updated',
        'added' => count($added),
        'skipped' => count($skipped),
        'details' => [
            'added' => $added,
            'skipped' => $skipped
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
