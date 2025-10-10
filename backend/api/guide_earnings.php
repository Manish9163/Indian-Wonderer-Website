<?php
/**
 * Guide Earnings API
 * Returns earnings data for a specific guide
 */

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
    // Get total earnings
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(amount), 0) as total_earnings,
            COALESCE(SUM(CASE WHEN status = 'earned' THEN amount ELSE 0 END), 0) as pending_earnings,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_earnings,
            COUNT(*) as total_tours
        FROM guide_earnings
        WHERE guide_id = ?
    ");
    $stmt->execute([$guideId]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get today's earnings
    $todayStmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as today_earnings
        FROM guide_earnings
        WHERE guide_id = ?
        AND DATE(earned_date) = CURDATE()
    ");
    $todayStmt->execute([$guideId]);
    $today = $todayStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get this month's earnings
    $monthStmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as month_earnings
        FROM guide_earnings
        WHERE guide_id = ?
        AND YEAR(earned_date) = YEAR(CURDATE())
        AND MONTH(earned_date) = MONTH(CURDATE())
    ");
    $monthStmt->execute([$guideId]);
    $month = $monthStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get earnings history
    $historyStmt = $pdo->prepare("
        SELECT 
            ge.*,
            b.booking_reference,
            t.title as tour_name,
            b.travel_date
        FROM guide_earnings ge
        JOIN bookings b ON ge.booking_id = b.id
        JOIN tours t ON b.tour_id = t.id
        WHERE ge.guide_id = ?
        ORDER BY ge.earned_date DESC
        LIMIT 50
    ");
    $historyStmt->execute([$guideId]);
    $history = $historyStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format history
    foreach ($history as &$item) {
        $item['amount'] = floatval($item['amount']);
        $item['commission_rate'] = floatval($item['commission_rate']);
    }
    
    echo json_encode([
        'success' => true,
        'total_earnings' => floatval($summary['total_earnings']),
        'pending_earnings' => floatval($summary['pending_earnings']),
        'paid_earnings' => floatval($summary['paid_earnings']),
        'today_earnings' => floatval($today['today_earnings']),
        'month_earnings' => floatval($month['month_earnings']),
        'total_tours' => intval($summary['total_tours']),
        'history' => $history
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
