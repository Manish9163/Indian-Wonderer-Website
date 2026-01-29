<?php
header('Content-Type: application/json');

try {
    $conn = new PDO('mysql:host=localhost;dbname=indian_wonderer_base', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Popular routes with multiple dates (Feb-April 2026)
    $routes = [
        ['Delhi', 'Mumbai'],
        ['Mumbai', 'Delhi'],
        ['Delhi', 'Bangalore'],
        ['Bangalore', 'Delhi'],
        ['Delhi', 'Kolkata'],
        ['Kolkata', 'Delhi'],
        ['Mumbai', 'Bangalore'],
        ['Bangalore', 'Mumbai'],
        ['Delhi', 'Chennai'],
        ['Chennai', 'Delhi'],
        ['Mumbai', 'Goa'],
        ['Goa', 'Mumbai'],
        ['Delhi', 'Hyderabad'],
        ['Hyderabad', 'Delhi']
    ];

    // Generate dates for next 60 days (Feb-Apr 2026)
    $dates = [];
    $start = strtotime('2026-02-01');
    for ($i = 0; $i < 60; $i++) {
        $dates[] = date('Y-m-d', strtotime("+$i days", $start));
    }

    $travels = [];
    $count = 0;

    // For each route, add options for every 3rd day
    foreach ($routes as $route) {
        list($from, $to) = $route;
        
        foreach ($dates as $i => $date) {
            // Add travel options every 3rd day to avoid too much data
            if ($i % 3 !== 0) continue;
            
            // Calculate base price based on route
            $distance_multiplier = 1.0;
            if (in_array($from, ['Delhi']) && in_array($to, ['Mumbai', 'Bangalore', 'Chennai'])) {
                $distance_multiplier = 1.2;
            } elseif (in_array($from, ['Mumbai']) && in_array($to, ['Delhi', 'Bangalore'])) {
                $distance_multiplier = 1.15;
            }

            // Flight - Economy
            $base_price = 4000 * $distance_multiplier;
            $travels[] = [
                'mode' => 'flight',
                'type' => 'Economy',
                'from_city' => $from,
                'to_city' => $to,
                'travel_date' => $date,
                'travel_time' => '09:00:00',
                'operator_name' => 'IndiGo',
                'vehicle_number' => '6E-' . rand(100, 999),
                'seat_class' => 'Economy',
                'total_seats' => 180,
                'available_seats' => rand(30, 120),
                'price' => round($base_price, 2),
                'cost' => round($base_price * 0.85, 2),
                'tax' => round($base_price * 0.15, 2),
                'total_amount' => round($base_price, 2),
                'status' => 'confirmed',
                'duration' => '2h 30m',
                'amenities' => json_encode(['WiFi', 'In-flight entertainment'])
            ];

            // Flight - Business (select routes only)
            if ($distance_multiplier > 1.1) {
                $business_price = $base_price * 2.5;
                $travels[] = [
                    'mode' => 'flight',
                    'type' => 'Business',
                    'from_city' => $from,
                    'to_city' => $to,
                    'travel_date' => $date,
                    'travel_time' => '14:00:00',
                    'operator_name' => 'Air India',
                    'vehicle_number' => 'AI-' . rand(100, 999),
                    'seat_class' => 'Business',
                    'total_seats' => 20,
                    'available_seats' => rand(5, 15),
                    'price' => round($business_price, 2),
                    'cost' => round($business_price * 0.85, 2),
                    'tax' => round($business_price * 0.15, 2),
                    'total_amount' => round($business_price, 2),
                    'status' => 'confirmed',
                    'duration' => '2h 15m',
                    'amenities' => json_encode(['Lounge access', 'Priority boarding', 'Gourmet meal', 'Extra legroom'])
                ];
            }

            // Train - AC (long distance routes)
            if ($distance_multiplier > 1.05) {
                $train_price = $base_price * 0.6;
                $travels[] = [
                    'mode' => 'train',
                    'type' => 'AC 2 Tier',
                    'from_city' => $from,
                    'to_city' => $to,
                    'travel_date' => $date,
                    'travel_time' => '22:00:00',
                    'operator_name' => 'Rajdhani Express',
                    'vehicle_number' => rand(12000, 12999),
                    'seat_class' => 'AC 2 Tier',
                    'total_seats' => 48,
                    'available_seats' => rand(15, 35),
                    'price' => round($train_price, 2),
                    'cost' => round($train_price * 0.85, 2),
                    'tax' => round($train_price * 0.15, 2),
                    'total_amount' => round($train_price, 2),
                    'status' => 'confirmed',
                    'duration' => '16h 30m',
                    'amenities' => json_encode(['AC coach', 'Bedding', 'Meals included'])
                ];
            }
        }
    }

    // Insert in batches to avoid timeout
    $sql = "INSERT INTO travel_options (mode, type, from_city, to_city, travel_date, travel_time, 
            operator_name, vehicle_number, seat_class, total_seats, available_seats, 
            price, cost, tax, total_amount, status, duration, amenities, is_active) 
            VALUES (:mode, :type, :from_city, :to_city, :travel_date, :travel_time, 
            :operator_name, :vehicle_number, :seat_class, :total_seats, :available_seats, 
            :price, :cost, :tax, :total_amount, :status, :duration, :amenities, 1)
            ON DUPLICATE KEY UPDATE available_seats=VALUES(available_seats)";

    $stmt = $conn->prepare($sql);
    
    foreach ($travels as $travel) {
        $stmt->execute($travel);
        $count++;
    }

    echo json_encode([
        'success' => true,
        'message' => "Successfully added $count travel options for 14 routes across 60 days",
        'count' => $count,
        'date_range' => '2026-02-01 to 2026-03-31',
        'routes' => count($routes)
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
