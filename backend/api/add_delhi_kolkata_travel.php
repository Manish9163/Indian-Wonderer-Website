<?php
header('Content-Type: application/json');

try {
    $conn = new PDO('mysql:host=localhost;dbname=indian_wonderer_base', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $travels = [
        // Flights
        [
            'mode' => 'flight',
            'type' => 'Economy - No Meal',
            'from_city' => 'Delhi',
            'to_city' => 'Kolkata',
            'travel_date' => '2026-02-15',
            'travel_time' => '06:00:00',
            'operator_name' => 'Air India',
            'operator_id' => null,
            'vehicle_number' => 'AI-401',
            'seat_class' => 'Economy - No Meal',
            'total_seats' => 180,
            'available_seats' => 45,
            'price' => 4200.00,
            'cost' => 3570.00,
            'tax' => 630.00,
            'total_amount' => 4200.00,
            'status' => 'confirmed',
            'duration' => '2h 15m',
            'amenities' => json_encode(['WiFi', 'In-flight entertainment', 'USB charging'])
        ],
        [
            'mode' => 'flight',
            'type' => 'Economy - With Meal',
            'from_city' => 'Delhi',
            'to_city' => 'Kolkata',
            'travel_date' => '2026-02-15',
            'travel_time' => '09:30:00',
            'operator_name' => 'IndiGo',
            'operator_id' => null,
            'vehicle_number' => '6E-227',
            'seat_class' => 'Economy - With Meal',
            'total_seats' => 186,
            'available_seats' => 62,
            'price' => 5500.00,
            'cost' => 4675.00,
            'tax' => 825.00,
            'total_amount' => 5500.00,
            'status' => 'confirmed',
            'duration' => '2h 20m',
            'amenities' => json_encode(['WiFi', 'Complimentary meal', 'In-flight entertainment', 'USB charging'])
        ],
        [
            'mode' => 'flight',
            'type' => 'Business Class',
            'from_city' => 'Delhi',
            'to_city' => 'Kolkata',
            'travel_date' => '2026-02-15',
            'travel_time' => '14:00:00',
            'operator_name' => 'Vistara',
            'operator_id' => null,
            'vehicle_number' => 'UK-711',
            'seat_class' => 'Business',
            'total_seats' => 20,
            'available_seats' => 8,
            'price' => 12800.00,
            'cost' => 10880.00,
            'tax' => 1920.00,
            'total_amount' => 12800.00,
            'status' => 'confirmed',
            'duration' => '2h 10m',
            'amenities' => json_encode(['Priority check-in', 'Lounge access', 'Gourmet meal', 'WiFi', 'Extra legroom', 'Premium entertainment'])
        ],
        [
            'mode' => 'flight',
            'type' => 'Premium Economy',
            'from_city' => 'Delhi',
            'to_city' => 'Kolkata',
            'travel_date' => '2026-02-15',
            'travel_time' => '18:45:00',
            'operator_name' => 'SpiceJet',
            'operator_id' => null,
            'vehicle_number' => 'SG-141',
            'seat_class' => 'Premium',
            'total_seats' => 36,
            'available_seats' => 18,
            'price' => 7200.00,
            'cost' => 6120.00,
            'tax' => 1080.00,
            'total_amount' => 7200.00,
            'status' => 'confirmed',
            'duration' => '2h 25m',
            'amenities' => json_encode(['Extra legroom', 'Priority boarding', 'Meal included', 'WiFi', 'In-flight entertainment'])
        ],
        // Trains
        [
            'mode' => 'train',
            'type' => 'AC 2 Tier',
            'from_city' => 'Delhi',
            'to_city' => 'Kolkata',
            'travel_date' => '2026-02-15',
            'travel_time' => '16:35:00',
            'operator_name' => 'Rajdhani Express',
            'operator_id' => null,
            'vehicle_number' => '12301',
            'seat_class' => 'AC 2 Tier - With Meal',
            'total_seats' => 48,
            'available_seats' => 22,
            'price' => 2800.00,
            'cost' => 2380.00,
            'tax' => 420.00,
            'total_amount' => 2800.00,
            'status' => 'confirmed',
            'duration' => '17h 10m',
            'amenities' => json_encode(['AC coach', 'Bedding', 'Meals included', 'Charging points', 'Reading light'])
        ],
        [
            'mode' => 'train',
            'type' => 'AC 3 Tier',
            'from_city' => 'Delhi',
            'to_city' => 'Kolkata',
            'travel_date' => '2026-02-15',
            'travel_time' => '22:40:00',
            'operator_name' => 'Poorva Express',
            'operator_id' => null,
            'vehicle_number' => '12303',
            'seat_class' => 'AC 3 Tier - No Meal',
            'total_seats' => 72,
            'available_seats' => 35,
            'price' => 1800.00,
            'cost' => 1530.00,
            'tax' => 270.00,
            'total_amount' => 1800.00,
            'status' => 'confirmed',
            'duration' => '17h 55m',
            'amenities' => json_encode(['AC coach', 'Bedding', 'Charging points', 'Reading light'])
        ],
        [
            'mode' => 'train',
            'type' => 'Sleeper Class',
            'from_city' => 'Delhi',
            'to_city' => 'Kolkata',
            'travel_date' => '2026-02-15',
            'travel_time' => '08:20:00',
            'operator_name' => 'Sealdah Duronto',
            'operator_id' => null,
            'vehicle_number' => '12313',
            'seat_class' => 'Sleeper - No Meal',
            'total_seats' => 80,
            'available_seats' => 42,
            'price' => 850.00,
            'cost' => 722.50,
            'tax' => 127.50,
            'total_amount' => 850.00,
            'status' => 'confirmed',
            'duration' => '18h 30m',
            'amenities' => json_encode(['Fan coach', 'Bedding optional', 'Charging points'])
        ],
        // Buses
        [
            'mode' => 'bus',
            'type' => 'AC Sleeper',
            'from_city' => 'Delhi',
            'to_city' => 'Kolkata',
            'travel_date' => '2026-02-15',
            'travel_time' => '18:00:00',
            'operator_name' => 'Shohag Paribahan',
            'operator_id' => null,
            'vehicle_number' => 'DL-5CAC-9876',
            'seat_class' => 'AC Sleeper - With Snacks',
            'total_seats' => 40,
            'available_seats' => 15,
            'price' => 2200.00,
            'cost' => 1870.00,
            'tax' => 330.00,
            'total_amount' => 2200.00,
            'status' => 'confirmed',
            'duration' => '28h',
            'amenities' => json_encode(['AC', 'Sleeper berths', 'Blanket & pillow', 'Water bottle', 'Snacks', 'Charging points', 'WiFi'])
        ],
        [
            'mode' => 'bus',
            'type' => 'AC Semi Sleeper',
            'from_city' => 'Delhi',
            'to_city' => 'Kolkata',
            'travel_date' => '2026-02-15',
            'travel_time' => '20:30:00',
            'operator_name' => 'Green Line Travels',
            'operator_id' => null,
            'vehicle_number' => 'DL-3CAB-5432',
            'seat_class' => 'AC Semi Sleeper - No Meal',
            'total_seats' => 35,
            'available_seats' => 20,
            'price' => 1800.00,
            'cost' => 1530.00,
            'tax' => 270.00,
            'total_amount' => 1800.00,
            'status' => 'confirmed',
            'duration' => '29h',
            'amenities' => json_encode(['AC', 'Push back seats', 'Blanket', 'Water bottle', 'Charging points'])
        ],
        [
            'mode' => 'bus',
            'type' => 'Non-AC Seater',
            'from_city' => 'Delhi',
            'to_city' => 'Kolkata',
            'travel_date' => '2026-02-15',
            'travel_time' => '19:00:00',
            'operator_name' => 'Royal Cruiser',
            'operator_id' => null,
            'vehicle_number' => 'DL-7C-8765',
            'seat_class' => 'Economy - No Meal',
            'total_seats' => 50,
            'available_seats' => 28,
            'price' => 1200.00,
            'cost' => 1020.00,
            'tax' => 180.00,
            'total_amount' => 1200.00,
            'status' => 'confirmed',
            'duration' => '30h',
            'amenities' => json_encode(['Reclining seats', 'Water bottle', 'Rest stops'])
        ]
    ];

    $sql = "INSERT INTO travel_options (mode, type, from_city, to_city, travel_date, travel_time, 
            operator_name, operator_id, vehicle_number, seat_class, total_seats, available_seats, 
            price, cost, tax, total_amount, status, duration, amenities, is_active) 
            VALUES (:mode, :type, :from_city, :to_city, :travel_date, :travel_time, 
            :operator_name, :operator_id, :vehicle_number, :seat_class, :total_seats, :available_seats, 
            :price, :cost, :tax, :total_amount, :status, :duration, :amenities, 1)";

    $stmt = $conn->prepare($sql);
    
    $count = 0;
    foreach ($travels as $travel) {
        $stmt->execute($travel);
        $count++;
    }

    echo json_encode([
        'success' => true,
        'message' => "Successfully added $count travel options from Delhi to Kolkata",
        'count' => $count,
        'routes' => [
            'flights' => 4,
            'trains' => 3,
            'buses' => 3
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
