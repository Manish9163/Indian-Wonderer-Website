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
    
    // Bus operators for Kolkata to Siliguri route
    $busOperators = [
        ['name' => 'Royal Cruiser', 'type' => 'AC Sleeper', 'seats' => 40, 'base_price' => 800],
        ['name' => 'Shyamoli Paribahan', 'type' => 'AC Semi-Sleeper', 'seats' => 45, 'base_price' => 650],
        ['name' => 'Green Line', 'type' => 'Non-AC Seater', 'seats' => 50, 'base_price' => 500],
        ['name' => 'Volvo Multi-Axle', 'type' => 'AC Sleeper', 'seats' => 36, 'base_price' => 950],
        ['name' => 'North Bengal Express', 'type' => 'AC Seater', 'seats' => 48, 'base_price' => 700],
        ['name' => 'Siliguri Travels', 'type' => 'AC Semi-Sleeper', 'seats' => 40, 'base_price' => 750],
    ];
    
    // Departure times
    $departureTimes = ['06:00:00', '09:30:00', '14:00:00', '18:30:00', '21:00:00', '23:00:00'];
    
    // Amenities
    $amenitiesOptions = [
        json_encode(['WiFi', 'Charging Point', 'Reading Light', 'Blanket']),
        json_encode(['Charging Point', 'Water Bottle', 'Reading Light']),
        json_encode(['WiFi', 'Charging Point', 'Entertainment', 'Snacks']),
        json_encode(['Charging Point', 'Blanket', 'Pillow']),
    ];
    
    // Generate dates for next 90 days
    $startDate = new DateTime('2026-01-29');
    $endDate = new DateTime('2026-04-29');
    $interval = new DateInterval('P1D');
    $dateRange = new DatePeriod($startDate, $interval, $endDate);
    
    $insertCount = 0;
    $values = [];
    $batchSize = 100;
    
    foreach ($dateRange as $date) {
        $travelDate = $date->format('Y-m-d');
        
        // Create multiple bus options per day
        foreach ($busOperators as $operator) {
            foreach ($departureTimes as $idx => $time) {
                // Not all operators run at all times
                if (rand(0, 100) < 70) { // 70% chance operator runs at this time
                    
                    // Calculate price with slight variation
                    $priceVariation = rand(-50, 100);
                    $cost = $operator['base_price'] + $priceVariation;
                    $tax = round($cost * 0.05, 2); // 5% tax
                    $totalAmount = $cost + $tax;
                    
                    // Random available seats
                    $availableSeats = rand((int)($operator['seats'] * 0.2), $operator['seats']);
                    
                    // Vehicle number
                    $vehicleNumber = 'WB-' . rand(10, 99) . '-' . chr(rand(65, 90)) . '-' . rand(1000, 9999);
                    
                    $values[] = [
                        'mode' => 'bus',
                        'type' => $operator['type'],
                        'from_city' => 'Kolkata',
                        'to_city' => 'Siliguri',
                        'travel_date' => $travelDate,
                        'travel_time' => $time,
                        'operator_name' => $operator['name'],
                        'vehicle_number' => $vehicleNumber,
                        'seat_class' => $operator['type'],
                        'total_seats' => $operator['seats'],
                        'available_seats' => $availableSeats,
                        'price' => $totalAmount,
                        'cost' => $cost,
                        'tax' => $tax,
                        'total_amount' => $totalAmount,
                        'status' => 'confirmed',
                        'duration' => '10h 30m',
                        'amenities' => $amenitiesOptions[array_rand($amenitiesOptions)]
                    ];
                    
                    if (count($values) >= $batchSize) {
                        insertBatch($pdo, $values);
                        $insertCount += count($values);
                        $values = [];
                    }
                }
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
        'message' => "Successfully added $insertCount bus travel options for Kolkata → Siliguri route",
        'route' => 'Kolkata → Siliguri',
        'mode' => 'bus',
        'operators' => count($busOperators),
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
            null, // operator_id
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
