<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$bookingId = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    switch ($method) {
        case 'GET':
            if ($bookingId) {
                $stmt = $pdo->prepare("SELECT b.*, 
                    COALESCE(
                        NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
                        JSON_UNQUOTE(JSON_EXTRACT(b.traveler_details, '$.primary_contact.name')),
                        'Unknown Customer'
                    ) as customer_name,
                    COALESCE(
                        u.email,
                        JSON_UNQUOTE(JSON_EXTRACT(b.traveler_details, '$.primary_contact.email'))
                    ) as customer_email,
                    COALESCE(
                        u.phone,
                        JSON_UNQUOTE(JSON_EXTRACT(b.traveler_details, '$.primary_contact.phone'))
                    ) as customer_phone,
                    t.title as tour_name,
                    t.destination as tour_destination,
                    t.price as tour_price,
                    p.status as payment_status,
                    p.amount as payment_amount,
                    p.payment_method
                    FROM bookings b
                    LEFT JOIN users u ON b.user_id = u.id
                    LEFT JOIN tours t ON b.tour_id = t.id
                    LEFT JOIN payments p ON b.id = p.booking_id
                    WHERE b.id = ?");
                $stmt->execute([$bookingId]);
                $booking = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($booking) {
                    $booking['customer_name'] = trim($booking['customer_name'] ?? '');
                    if (empty($booking['customer_name'])) {
                        $booking['customer_name'] = $booking['customer_email'] ?? 'Unknown Customer';
                    }
                    if (empty($booking['tour_name'])) {
                        $booking['tour_name'] = 'Unknown Tour';
                    }
                    
                    echo json_encode(['success' => true, 'data' => $booking]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Booking not found']);
                }
            } else {
                $stmt = $pdo->query("SELECT b.*, 
                    COALESCE(
                        NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
                        JSON_UNQUOTE(JSON_EXTRACT(b.traveler_details, '$.primary_contact.name')),
                        'Unknown Customer'
                    ) as customer_name,
                    COALESCE(
                        u.email,
                        JSON_UNQUOTE(JSON_EXTRACT(b.traveler_details, '$.primary_contact.email'))
                    ) as customer_email,
                    COALESCE(
                        u.phone,
                        JSON_UNQUOTE(JSON_EXTRACT(b.traveler_details, '$.primary_contact.phone'))
                    ) as customer_phone,
                    t.title as tour_name,
                    t.destination as tour_destination,
                    p.status as payment_status,
                    p.amount as payment_amount,
                    r.id as refund_id, r.amount as refund_amount, r.status as refund_status,
                    r.method as refund_method, r.initiated_at as refund_initiated_at,
                    gc.code as giftcard_code, gc.amount as giftcard_amount, 
                    gc.balance as giftcard_balance, gc.status as giftcard_status
                    FROM bookings b
                    LEFT JOIN users u ON b.user_id = u.id
                    LEFT JOIN tours t ON b.tour_id = t.id
                    LEFT JOIN payments p ON b.id = p.booking_id
                    LEFT JOIN refunds r ON b.id = r.booking_id
                    LEFT JOIN gift_cards gc ON b.user_id = gc.user_id AND gc.created_at >= b.updated_at
                    ORDER BY b.created_at DESC");
                $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($bookings as &$booking) {
                    $booking['customer_name'] = trim($booking['customer_name'] ?? '');
                    
                    if (empty($booking['customer_name'])) {
                        $booking['customer_name'] = $booking['customer_email'] ?? 'Unknown Customer';
                    }
                    
                    if (empty($booking['tour_name'])) {
                        $booking['tour_name'] = 'Unknown Tour';
                    }
                }
                unset($booking); 
                
                $statsStmt = $pdo->query("SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COALESCE(SUM(total_amount), 0) as total_revenue
                    FROM bookings");
                $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'bookings' => $bookings,
                        'stats' => [
                            'totalBookings' => (int)$stats['total'],
                            'pendingBookings' => (int)$stats['pending'],
                            'confirmedBookings' => (int)$stats['confirmed'],
                            'cancelledBookings' => (int)$stats['cancelled'],
                            'completedBookings' => (int)$stats['completed'],
                            'totalRevenue' => (float)$stats['total_revenue']
                        ]
                    ],
                    'generated_at' => date('Y-m-d H:i:s')
                ]);
            }
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['status'])) {
                $stmt = $pdo->prepare("UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$input['status'], $bookingId]);
                echo json_encode(['success' => true, 'message' => 'Booking status updated']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Status is required']);
            }
            break;
            
        case 'DELETE':
            if (!$bookingId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Booking ID is required']);
                break;
            }
            
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("DELETE FROM tour_guide_assignments WHERE booking_id = ?");
                $stmt->execute([$bookingId]);
                
                $stmt = $pdo->prepare("DELETE FROM payments WHERE booking_id = ?");
                $stmt->execute([$bookingId]);
                
                
                $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
                $stmt->execute([$bookingId]);
                
                if ($stmt->rowCount() === 0) {
                    $pdo->rollBack();
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Booking not found']);
                    break;
                }
                
                $pdo->commit();
                echo json_encode(['success' => true, 'message' => 'Booking and all related records deleted successfully']);
            } catch (PDOException $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
