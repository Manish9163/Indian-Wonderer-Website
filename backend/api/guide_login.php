<?php
/**
 * Guide Login API
 * Authenticates guides and returns their profile data
 */

require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$pdo = $database->getConnection();

$email = $_GET['email'] ?? '';

if (empty($email)) {
    echo json_encode([
        'success' => false,
        'message' => 'Email is required'
    ]);
    exit;
}

try {
    // Get guide by email
    $stmt = $pdo->prepare("
        SELECT 
            g.*,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.profile_image
        FROM guides g
        JOIN users u ON g.user_id = u.id
        WHERE u.email = ?
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $guide = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$guide) {
        echo json_encode([
            'success' => false,
            'message' => 'Guide not found'
        ]);
        exit;
    }
    
    // Get guide stats
    $statsStmt = $pdo->prepare("
        SELECT 
            COUNT(CASE WHEN tga.status = 'assigned' THEN 1 END) as active_bookings,
            COUNT(CASE WHEN tga.status = 'completed' THEN 1 END) as completed_tours,
            COALESCE(SUM(CASE WHEN ge.status IN ('earned', 'paid') THEN ge.amount END), 0) as total_earnings
        FROM tour_guide_assignments tga
        LEFT JOIN guide_earnings ge ON tga.id = ge.assignment_id
        WHERE tga.guide_id = ?
    ");
    $statsStmt->execute([$guide['id']]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'guide' => $guide,
        'stats' => $stats,
        'message' => 'Login successful'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
