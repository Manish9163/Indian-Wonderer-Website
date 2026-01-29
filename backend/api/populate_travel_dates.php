<?php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Get existing travel options (templates)
    $stmt = $pdo->query("SELECT * FROM travel_options WHERE travel_date >= '2026-02-10' AND travel_date <= '2026-02-20' LIMIT 50");
    $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($templates)) {
        echo json_encode(['success' => false, 'error' => 'No template data found']);
        exit;
    }
    
    // Generate dates for next 90 days starting from today
    $startDate = new DateTime('2026-01-29');
    $endDate = new DateTime('2026-04-29'); // 3 months
    $interval = new DateInterval('P1D');
    $dateRange = new DatePeriod($startDate, $interval, $endDate);
    
    $insertCount = 0;
    $batchSize = 100;
    $values = [];
    
    foreach ($dateRange as $date) {
        $travelDate = $date->format('Y-m-d');
        
        // Check if data already exists for this date
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM travel_options WHERE travel_date = ?");
        $checkStmt->execute([$travelDate]);
        $count = $checkStmt->fetchColumn();
        
        if ($count > 0) {
            continue; // Skip if data already exists
        }
        
        // Create travel options for this date using templates
        foreach ($templates as $template) {
            // Vary the price slightly for each date (±10%)
            $priceVariation = rand(-10, 10) / 100;
            $newCost = round($template['cost'] * (1 + $priceVariation), 2);
            $newTax = round($template['tax'] * (1 + $priceVariation), 2);
            $newTotalAmount = $newCost + $newTax;
            
            // Vary available seats
            $availableSeats = rand((int)($template['total_seats'] * 0.3), $template['total_seats']);
            
            $values[] = [
                'mode' => $template['mode'],
                'type' => $template['type'],
                'from_city' => $template['from_city'],
                'to_city' => $template['to_city'],
                'travel_date' => $travelDate,
                'travel_time' => $template['travel_time'],
                'operator_name' => $template['operator_name'],
                'operator_id' => $template['operator_id'],
                'vehicle_number' => $template['vehicle_number'],
                'seat_class' => $template['seat_class'],
                'total_seats' => $template['total_seats'],
                'available_seats' => $availableSeats,
                'price' => $newTotalAmount,
                'cost' => $newCost,
                'tax' => $newTax,
                'total_amount' => $newTotalAmount,
                'status' => 'confirmed',
                'duration' => $template['duration'],
                'amenities' => $template['amenities']
            ];
            
            // Insert in batches
            if (count($values) >= $batchSize) {
                insertBatch($pdo, $values);
                $insertCount += count($values);
                $values = [];
            }
        }
    }
    
    // Insert remaining values
    if (!empty($values)) {
        insertBatch($pdo, $values);
        $insertCount += count($values);
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Successfully populated $insertCount travel options for 90 days",
        'templates_used' => count($templates),
        'dates_covered' => iterator_count(new DatePeriod($startDate, $interval, $endDate))
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function insertBatch($pdo, $values) {
    if (empty($values)) return;
    
    $placeholders = [];
    $params = [];
    
    foreach ($values as $value) {
        $placeholders[] = "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $params = array_merge($params, [
            $value['mode'],
            $value['type'],
            $value['from_city'],
            $value['to_city'],
            $value['travel_date'],
            $value['travel_time'],
            $value['operator_name'],
            $value['operator_id'],
            $value['vehicle_number'],
            $value['seat_class'],
            $value['total_seats'],
            $value['available_seats'],
            $value['price'],
            $value['cost'],
            $value['tax'],
            $value['total_amount'],
            $value['status'],
            $value['duration'],
            $value['amenities']
        ]);
    }
    
    $sql = "INSERT INTO travel_options 
            (mode, type, from_city, to_city, travel_date, travel_time, operator_name, operator_id, 
             vehicle_number, seat_class, total_seats, available_seats, price, cost, tax, total_amount, 
             status, duration, amenities) 
            VALUES " . implode(', ', $placeholders);
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
}
