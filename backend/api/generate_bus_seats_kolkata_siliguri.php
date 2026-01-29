<?php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

set_time_limit(300); // 5 minutes

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Get Kolkata-Siliguri travel options that don't have seats
    $query = "SELECT t.id, t.mode, t.total_seats, t.seat_class 
              FROM travel_options t
              WHERE t.from_city = 'Kolkata' 
              AND t.to_city = 'Siliguri'
              AND t.mode = 'bus'
              AND NOT EXISTS (
                  SELECT 1 FROM seats ts WHERE ts.travel_id = t.id
              )
              LIMIT 500";
    
    $stmt = $pdo->query($query);
    $travels = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $totalGenerated = 0;
    
    foreach ($travels as $travel) {
        generateSeatsForTravel($pdo, $travel);
        $totalGenerated++;
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Generated seats for $totalGenerated Kolkata-Siliguri bus travels",
        'travels_processed' => count($travels)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function generateSeatsForTravel($pdo, $travel) {
    $travelId = $travel['id'];
    $totalSeats = (int)$travel['total_seats'];
    $mode = $travel['mode'];
    
    $seats = [];
    
    if ($mode === 'bus') {
        // Bus seat layout: typically 2+2 or 2+1 configuration
        $seatsPerRow = 4; // 2+2 configuration
        $rows = ceil($totalSeats / $seatsPerRow);
        
        $seatLabels = ['A', 'B', 'C', 'D'];
        $seatNum = 1;
        
        for ($row = 1; $row <= $rows && $seatNum <= $totalSeats; $row++) {
            for ($col = 0; $col < $seatsPerRow && $seatNum <= $totalSeats; $col++) {
                $seatNo = $row . $seatLabels[$col];
                
                // Determine seat type
                if ($col === 0 || $col === 3) {
                    $seatType = 'window';
                } else {
                    $seatType = 'aisle';
                }
                
                // Base price variation
                $priceMultiplier = 1.0;
                if ($seatType === 'window') $priceMultiplier = 1.1;
                if ($row <= 2) $priceMultiplier *= 0.95; // Front seats slightly cheaper
                
                $basePrice = 50;
                $price = round($basePrice * $priceMultiplier, 2);
                
                $seats[] = [
                    'travel_id' => $travelId,
                    'seat_no' => $seatNo,
                    'seat_type' => $seatType,
                    'row_number' => $row,
                    'column_letter' => $seatLabels[$col],
                    'is_booked' => (rand(1, 100) > 70) ? 1 : 0, // 30% booked
                    'price' => $price
                ];
                
                $seatNum++;
            }
        }
    }
    
    // Batch insert seats
    if (!empty($seats)) {
        $placeholders = [];
        $params = [];
        
        foreach ($seats as $seat) {
            $placeholders[] = "(?, ?, ?, ?, ?, ?, ?)";
            $params = array_merge($params, [
                $seat['travel_id'],
                $seat['seat_no'],
                $seat['seat_type'],
                $seat['row_number'],
                $seat['column_letter'],
                $seat['is_booked'],
                $seat['price']
            ]);
        }
        
        $sql = "INSERT INTO seats 
                (travel_id, seat_no, seat_type, row_number, column_letter, is_booked, price) 
                VALUES " . implode(', ', $placeholders);
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }
}
