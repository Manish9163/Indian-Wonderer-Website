<?php

require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$pdo = $database->getConnection();

$guideId = $_GET['guide_id'] ?? null;

if (!$guideId) {
    echo json_encode([
        'success' => false,
        'message' => 'Guide ID is required'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            b.id as booking_id,
            b.booking_reference,
            b.travel_date,
            b.number_of_travelers,
            b.total_amount,
            b.status as booking_status,
            b.created_at as booking_date,
            
            t.id as tour_id,
            t.title as tour_name,
            t.destination,
            
            u.id as customer_id,
            u.first_name as customer_first_name,
            u.last_name as customer_last_name,
            CONCAT(u.first_name, ' ', u.last_name) as customer_name,
            u.email as customer_email,
            u.phone as customer_phone,
            
            tga.id as assignment_id,
            tga.status as assignment_status,
            tga.assignment_date,
            tga.completed_date,
            tga.notes as assignment_notes,
            
            ge.amount as earning_amount,
            ge.status as earning_status
            
        FROM tour_guide_assignments tga
        JOIN bookings b ON tga.booking_id = b.id
        JOIN tours t ON b.tour_id = t.id
        JOIN users u ON b.user_id = u.id
        LEFT JOIN guide_earnings ge ON tga.id = ge.assignment_id
        WHERE tga.guide_id = ? 
        AND tga.status != 'completed'
        ORDER BY 
            CASE tga.status
                WHEN 'in_progress' THEN 1
                WHEN 'assigned' THEN 2
                ELSE 3
            END,
            b.travel_date ASC
    ");
    $stmt->execute([$guideId]);
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $activeCount = 0;
    $completedCount = 0;
    $totalEarnings = 0;
    $pendingEarnings = 0;
    
    foreach ($bookings as &$booking) {
        $booking['total_amount'] = floatval($booking['total_amount']);
        $booking['earning_amount'] = floatval($booking['earning_amount'] ?? ($booking['total_amount'] * 0.30));
        $booking['number_of_travelers'] = intval($booking['number_of_travelers']);
        $booking['status'] = $booking['assignment_status'];
        
        if ($booking['assignment_status'] === 'assigned') {
            $activeCount++;
        } elseif ($booking['assignment_status'] === 'completed') {
            $completedCount++;
            if ($booking['earning_status']) {
                $totalEarnings += $booking['earning_amount'];
                if ($booking['earning_status'] === 'earned') {
                    $pendingEarnings += $booking['earning_amount'];
                }
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'bookings' => $bookings,
        'stats' => [
            'active_count' => $activeCount,
            'completed_count' => $completedCount,
            'total_count' => count($bookings),
            'total_earnings' => $totalEarnings,
            'pending_earnings' => $pendingEarnings,
            'paid_earnings' => $totalEarnings - $pendingEarnings
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
