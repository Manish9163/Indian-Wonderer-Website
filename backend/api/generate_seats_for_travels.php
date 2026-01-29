<?php
header('Content-Type: application/json');

try {
    $conn = new PDO('mysql:host=localhost;dbname=indian_wonderer_base', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get all travel options that need seats
    $stmt = $conn->query("
        SELECT id, mode, total_seats, available_seats, price, seat_class 
        FROM travel_options 
        WHERE is_active = 1
    ");
    $travels = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalSeatsCreated = 0;
    $travelsProcessed = 0;

    foreach ($travels as $travel) {
        $travel_id = $travel['id'];
        $mode = $travel['mode'];
        $total_seats = $travel['total_seats'];
        $available_seats = $travel['available_seats'];
        $base_price = $travel['price'];
        $seat_class = $travel['seat_class'];

        // Check if seats already exist for this travel
        $checkStmt = $conn->prepare("SELECT COUNT(*) FROM seats WHERE travel_id = ?");
        $checkStmt->execute([$travel_id]);
        $existingCount = $checkStmt->fetchColumn();

        if ($existingCount > 0) {
            continue; // Skip if seats already exist
        }

        $seats = [];
        $booked_seats_count = $total_seats - $available_seats;

        switch ($mode) {
            case 'flight':
                $seats = generateFlightSeats($total_seats, $booked_seats_count, $base_price, $seat_class);
                break;
            case 'train':
                $seats = generateTrainSeats($total_seats, $booked_seats_count, $base_price, $seat_class);
                break;
            case 'bus':
                $seats = generateBusSeats($total_seats, $booked_seats_count, $base_price, $seat_class);
                break;
            default:
                $seats = generateBusSeats($total_seats, $booked_seats_count, $base_price, $seat_class);
        }

        // Insert seats
        $insertStmt = $conn->prepare("
            INSERT INTO seats (travel_id, seat_no, seat_type, row_number, column_letter, is_booked, price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($seats as $seat) {
            $insertStmt->execute([
                $travel_id,
                $seat['seat_no'],
                $seat['seat_type'],
                $seat['row_number'],
                $seat['column_letter'],
                $seat['is_booked'] ? 1 : 0,
                $seat['price']
            ]);
            $totalSeatsCreated++;
        }

        $travelsProcessed++;
    }

    echo json_encode([
        'success' => true,
        'message' => "Successfully created seats for all travel options",
        'travels_processed' => $travelsProcessed,
        'total_seats_created' => $totalSeatsCreated
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}

function generateFlightSeats($total_seats, $booked_count, $base_price, $seat_class) {
    $seats = [];
    $columns = ['A', 'B', 'C', 'D', 'E', 'F']; // 3-3 configuration
    $seats_per_row = 6;
    $rows = ceil($total_seats / $seats_per_row);
    
    $seat_num = 1;
    for ($row = 1; $row <= $rows && $seat_num <= $total_seats; $row++) {
        foreach ($columns as $col) {
            if ($seat_num > $total_seats) break;
            
            $is_booked = $seat_num <= $booked_count;
            $seat_type = 'economy';
            $price_multiplier = 1.0;
            
            // Window and aisle seats cost more
            if (in_array($col, ['A', 'F'])) {
                $seat_type = 'window';
                $price_multiplier = 1.1;
            } elseif (in_array($col, ['C', 'D'])) {
                $seat_type = 'aisle';
                $price_multiplier = 1.05;
            }
            
            // Business/Premium class pricing
            if (stripos($seat_class, 'business') !== false) {
                $price_multiplier *= 2.5;
            } elseif (stripos($seat_class, 'premium') !== false) {
                $price_multiplier *= 1.5;
            }
            
            $seats[] = [
                'seat_no' => $row . $col,
                'seat_type' => $seat_type,
                'row_number' => $row,
                'column_letter' => $col,
                'is_booked' => $is_booked,
                'price' => round($base_price * $price_multiplier / $total_seats, 2)
            ];
            
            $seat_num++;
        }
    }
    
    return $seats;
}

function generateTrainSeats($total_seats, $booked_count, $base_price, $seat_class) {
    $seats = [];
    $berth_types = ['lower', 'middle', 'upper', 'side_lower', 'side_upper'];
    
    // AC tiers have different configurations
    $compartments = ceil($total_seats / 8); // 8 berths per compartment
    
    $seat_num = 1;
    for ($comp = 1; $comp <= $compartments && $seat_num <= $total_seats; $comp++) {
        foreach ($berth_types as $index => $berth) {
            if ($seat_num > $total_seats) break;
            
            $is_booked = $seat_num <= $booked_count;
            $price_multiplier = 1.0;
            
            // Lower berths are preferred (cost more)
            if ($berth === 'lower' || $berth === 'side_lower') {
                $price_multiplier = 1.15;
            } elseif ($berth === 'middle') {
                $price_multiplier = 0.95;
            } elseif ($berth === 'upper' || $berth === 'side_upper') {
                $price_multiplier = 0.9;
            }
            
            $seats[] = [
                'seat_no' => $comp . chr(65 + $index), // 1A, 1B, 1C, etc.
                'seat_type' => $berth,
                'row_number' => $comp,
                'column_letter' => chr(65 + $index),
                'is_booked' => $is_booked,
                'price' => round($base_price * $price_multiplier / $total_seats, 2)
            ];
            
            $seat_num++;
        }
    }
    
    return $seats;
}

function generateBusSeats($total_seats, $booked_count, $base_price, $seat_class) {
    $seats = [];
    $columns = ['A', 'B', 'C', 'D']; // 2-2 configuration for most buses
    
    // Sleeper buses have different layout
    $is_sleeper = stripos($seat_class, 'sleeper') !== false;
    
    if ($is_sleeper) {
        $columns = ['L', 'U']; // Lower and Upper berths
    }
    
    $seats_per_row = count($columns);
    $rows = ceil($total_seats / $seats_per_row);
    
    $seat_num = 1;
    for ($row = 1; $row <= $rows && $seat_num <= $total_seats; $row++) {
        foreach ($columns as $col) {
            if ($seat_num > $total_seats) break;
            
            $is_booked = $seat_num <= $booked_count;
            $seat_type = $is_sleeper ? ($col === 'L' ? 'lower_berth' : 'upper_berth') : 'seater';
            $price_multiplier = 1.0;
            
            // Window seats cost more
            if (!$is_sleeper && in_array($col, ['A', 'D'])) {
                $seat_type = 'window';
                $price_multiplier = 1.08;
            }
            
            // Lower berths preferred
            if ($is_sleeper && $col === 'L') {
                $price_multiplier = 1.12;
            }
            
            $seats[] = [
                'seat_no' => $row . $col,
                'seat_type' => $seat_type,
                'row_number' => $row,
                'column_letter' => $col,
                'is_booked' => $is_booked,
                'price' => round($base_price * $price_multiplier / $total_seats, 2)
            ];
            
            $seat_num++;
        }
    }
    
    return $seats;
}
