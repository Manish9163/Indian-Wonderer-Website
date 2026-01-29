<?php
header('Content-Type: application/json');

try {
    $conn = new PDO('mysql:host=localhost;dbname=indian_wonderer_base', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check current columns
    $stmt = $conn->query("DESCRIBE travel_options");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Current columns:\n";
    print_r($columns);
    echo "\n\n";

    // Add missing columns
    $alterations = [];
    
    if (!in_array('vehicle_number', $columns)) {
        $alterations[] = "ADD COLUMN vehicle_number VARCHAR(100) NULL AFTER operator_name";
    }
    
    if (!in_array('seat_class', $columns)) {
        $alterations[] = "ADD COLUMN seat_class VARCHAR(100) NULL AFTER vehicle_number";
    }
    
    if (!in_array('operator_id', $columns)) {
        $alterations[] = "ADD COLUMN operator_id INT NULL AFTER operator_name";
    }
    
    if (!in_array('cost', $columns)) {
        $alterations[] = "ADD COLUMN cost DECIMAL(10,2) NULL AFTER price";
    }
    
    if (!in_array('tax', $columns)) {
        $alterations[] = "ADD COLUMN tax DECIMAL(10,2) NULL AFTER cost";
    }
    
    if (!in_array('total_amount', $columns)) {
        $alterations[] = "ADD COLUMN total_amount DECIMAL(10,2) NULL AFTER tax";
    }
    
    if (!in_array('status', $columns)) {
        $alterations[] = "ADD COLUMN status VARCHAR(50) DEFAULT 'confirmed' AFTER total_amount";
    }
    
    if (!empty($alterations)) {
        $sql = "ALTER TABLE travel_options " . implode(", ", $alterations);
        echo "Executing: $sql\n\n";
        $conn->exec($sql);
        echo "Table structure updated successfully!\n";
    } else {
        echo "All required columns already exist!\n";
    }
    
    // Update existing records with default values
    $conn->exec("UPDATE travel_options SET 
        vehicle_number = CONCAT(mode, '-', FLOOR(1000 + RAND() * 9000)),
        seat_class = CASE 
            WHEN type LIKE '%No Meal%' THEN 'Economy - No Meal'
            WHEN type LIKE '%Meal%' THEN 'Economy - With Meal'
            WHEN type LIKE '%Premium%' THEN 'Premium'
            WHEN type LIKE '%Business%' THEN 'Business'
            ELSE 'Economy'
        END,
        cost = price * 0.85,
        tax = price * 0.15,
        total_amount = price,
        status = 'confirmed'
        WHERE vehicle_number IS NULL OR seat_class IS NULL");
    
    echo "\nExisting records updated with default values!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
