<?php


header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

$userId = $_GET['user_id'] ?? null;

try {
    if (!$userId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'User ID is required',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    $analytics = [];
    
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_bookings,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
            COALESCE(SUM(total_amount), 0) as total_spent,
            COALESCE(AVG(total_amount), 0) as avg_booking_value
        FROM bookings 
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $bookingStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $analytics['bookings'] = $bookingStats;
    
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_payments,
            COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as successful,
            COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed,
            COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_paid
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        WHERE b.user_id = ?
    ");
    $stmt->execute([$userId]);
    $paymentStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $analytics['payments'] = $paymentStats;
    
    $stmt = $pdo->prepare("
        SELECT 
            t.destination,
            COUNT(*) as visit_count,
            COALESCE(SUM(b.total_amount), 0) as total_spent
        FROM bookings b
        JOIN tours t ON b.tour_id = t.id
        WHERE b.user_id = ?
        GROUP BY t.destination
        ORDER BY visit_count DESC
        LIMIT 5
    ");
    $stmt->execute([$userId]);
    $analytics['favorite_destinations'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as bookings,
            COALESCE(SUM(total_amount), 0) as amount_spent
        FROM bookings
        WHERE user_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
    ");
    $stmt->execute([$userId]);
    $analytics['booking_trends'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT 
            t.category,
            COUNT(*) as count,
            COALESCE(SUM(b.total_amount), 0) as spent
        FROM bookings b
        JOIN tours t ON b.tour_id = t.id
        WHERE b.user_id = ?
        GROUP BY t.category
        ORDER BY count DESC
    ");
    $stmt->execute([$userId]);
    $analytics['categories'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT 
            b.id,
            b.booking_reference,
            b.booking_date,
            b.total_amount,
            b.status,
            t.title as tour_name,
            t.destination,
            t.duration_days
        FROM bookings b
        JOIN tours t ON b.tour_id = t.id
        WHERE b.user_id = ?
        AND b.booking_date > NOW()
        AND b.status IN ('confirmed', 'pending')
        ORDER BY b.booking_date ASC
        LIMIT 5
    ");
    $stmt->execute([$userId]);
    $analytics['upcoming_bookings'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT 
            b.id,
            b.booking_reference,
            b.created_at,
            b.status,
            t.title as tour_name,
            'booking' as activity_type
        FROM bookings b
        JOIN tours t ON b.tour_id = t.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
        LIMIT 10
    ");
    $stmt->execute([$userId]);
    $analytics['recent_activities'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $totalBookings = (int)$bookingStats['total_bookings'];
    $completedBookings = (int)$bookingStats['completed'];
    $totalSpent = (float)$bookingStats['total_spent'];
    
    $loyaltyScore = 0;
    if ($totalBookings > 0) {
        $loyaltyScore += min($totalBookings * 10, 50); 
        $loyaltyScore += min(($completedBookings / max($totalBookings, 1)) * 30, 30); 
        $loyaltyScore += min($totalSpent / 1000, 20); 
    }
    
    $analytics['loyalty'] = [
        'score' => round($loyaltyScore),
        'level' => $loyaltyScore >= 70 ? 'Platinum' : ($loyaltyScore >= 50 ? 'Gold' : ($loyaltyScore >= 30 ? 'Silver' : 'Bronze')),
        'total_bookings' => $totalBookings,
        'completed_bookings' => $completedBookings,
        'total_spent' => $totalSpent
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $analytics,
        'generated_at' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
