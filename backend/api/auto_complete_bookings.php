<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

try {
    $stmt = $pdo->query("
        SELECT 
            b.id as booking_id,
            b.booking_reference,
            b.travel_date,
            b.status as booking_status,
            t.duration_days,
            tga.id as assignment_id,
            tga.guide_id,
            tga.status as assignment_status,
            g.user_id,
            u.first_name,
            u.last_name,
            DATE_ADD(b.travel_date, INTERVAL t.duration_days DAY) as end_date,
            DATEDIFF(NOW(), DATE_ADD(b.travel_date, INTERVAL t.duration_days DAY)) as days_past_end
        FROM bookings b
        INNER JOIN tours t ON b.tour_id = t.id
        LEFT JOIN tour_guide_assignments tga ON b.id = tga.booking_id
        LEFT JOIN guides g ON tga.guide_id = g.id
        LEFT JOIN users u ON g.user_id = u.id
        WHERE b.status IN ('pending', 'confirmed')
        AND tga.id IS NOT NULL
        AND DATE_ADD(b.travel_date, INTERVAL t.duration_days DAY) < CURDATE()
        AND tga.status != 'completed'
    ");
    
    $expiredBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $completedCount = 0;
    $completedDetails = [];
    
    $pdo->beginTransaction();
    
    foreach ($expiredBookings as $booking) {
        try {
            $updateBooking = $pdo->prepare("UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE id = ?");
            $updateBooking->execute([$booking['booking_id']]);
            
            $updateAssignment = $pdo->prepare("UPDATE tour_guide_assignments SET status = 'completed', notes = CONCAT(COALESCE(notes, ''), '\nAuto-completed on ', NOW()) WHERE id = ?");
            $updateAssignment->execute([$booking['assignment_id']]);
            
            $checkActiveStmt = $pdo->prepare("
                SELECT COUNT(*) as active_count 
                FROM tour_guide_assignments tga
                INNER JOIN bookings b ON tga.booking_id = b.id
                WHERE tga.guide_id = ? 
                AND tga.status IN ('assigned', 'confirmed')
                AND b.status IN ('pending', 'confirmed')
            ");
            $checkActiveStmt->execute([$booking['guide_id']]);
            $activeCheck = $checkActiveStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($activeCheck['active_count'] == 0) {
                $updateGuide = $pdo->prepare("UPDATE guides SET status = 'available' WHERE id = ?");
                $updateGuide->execute([$booking['guide_id']]);
            }
            
            $completedCount++;
            $completedDetails[] = [
                'booking_id' => $booking['booking_id'],
                'booking_reference' => $booking['booking_reference'],
                'guide_name' => trim($booking['first_name'] . ' ' . $booking['last_name']),
                'travel_date' => $booking['travel_date'],
                'end_date' => $booking['end_date'],
                'days_past_end' => (int)$booking['days_past_end'],
                'guide_status_updated' => $activeCheck['active_count'] == 0 ? 'available' : 'busy'
            ];
            
        } catch (Exception $e) {
            error_log("Error completing booking {$booking['booking_id']}: " . $e->getMessage());
        }
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => "Auto-completed {$completedCount} expired booking(s)",
        'completed_count' => $completedCount,
        'total_checked' => count($expiredBookings),
        'completed_bookings' => $completedDetails,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
