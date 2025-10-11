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

$action = $_GET['action'] ?? 'stats';
$userId = $_GET['user_id'] ?? null;

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
}

try {
    switch ($action) {
        case 'stats':
            $stats = [];
            
            if ($userId) {
                // Total bookings
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM bookings WHERE user_id = ?");
                $stmt->execute([$userId]);
                $stats['totalBookings'] = (int)$stmt->fetch()['count'];
                
                // Pending bookings
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status = 'pending'");
                $stmt->execute([$userId]);
                $stats['pendingBookings'] = (int)$stmt->fetch()['count'];
                
                // Completed bookings
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status = 'completed'");
                $stmt->execute([$userId]);
                $stats['completedBookings'] = (int)$stmt->fetch()['count'];
                
                // Total spent
                $stmt = $pdo->prepare("SELECT COALESCE(SUM(p.amount), 0) as total 
                                      FROM payments p 
                                      JOIN bookings b ON p.booking_id = b.id 
                                      WHERE b.user_id = ? AND p.status IN ('paid', 'completed')");
                $stmt->execute([$userId]);
                $stats['totalSpent'] = (float)$stmt->fetch()['total'];
                
                // Upcoming trips
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM bookings 
                                      WHERE user_id = ? 
                                      AND status IN ('confirmed', 'pending') 
                                      AND booking_date > NOW()");
                $stmt->execute([$userId]);
                $stats['upcomingTrips'] = (int)$stmt->fetch()['count'];
                
                // itineraries
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM itineraries WHERE created_by = ?");
                $stmt->execute([$userId]);
                $stats['savedItineraries'] = (int)$stmt->fetch()['count'];
            } else {
                // Guest user or no user ID 
                $stats = [
                    'totalBookings' => 0,
                    'pendingBookings' => 0,
                    'completedBookings' => 0,
                    'totalSpent' => 0,
                    'upcomingTrips' => 0,
                    'savedItineraries' => 0
                ];
            }
            
            echo json_encode([
                'success' => true,
                'data' => $stats,
                'generated_at' => date('Y-m-d H:i:s')
            ]);
            break;
            
        case 'recent':
            //  recent activities 
            $activities = [];
            
            if ($userId) {
                //  recent bookings
                $stmt = $pdo->prepare("
                    SELECT 
                        b.id,
                        b.booking_reference,
                        b.status,
                        b.total_amount,
                        b.created_at,
                        t.title as tour_name,
                        t.destination,
                        'booking' as activity_type
                    FROM bookings b
                    LEFT JOIN tours t ON b.tour_id = t.id
                    WHERE b.user_id = ?
                    ORDER BY b.created_at DESC
                    LIMIT 10
                ");
                $stmt->execute([$userId]);
                $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                //  recent payments
                $stmt = $pdo->prepare("
                    SELECT 
                        p.id,
                        p.amount,
                        p.currency,
                        p.status,
                        p.payment_method,
                        p.created_at,
                        b.booking_reference,
                        'payment' as activity_type
                    FROM payments p
                    JOIN bookings b ON p.booking_id = b.id
                    WHERE b.user_id = ?
                    ORDER BY p.created_at DESC
                    LIMIT 10
                ");
                $stmt->execute([$userId]);
                $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Merge and sort activities
                $activities = array_merge($bookings, $payments);
                usort($activities, function($a, $b) {
                    return strtotime($b['created_at']) - strtotime($a['created_at']);
                });
                
                $activities = array_slice($activities, 0, 10);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $activities,
                'generated_at' => date('Y-m-d H:i:s')
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid action',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
