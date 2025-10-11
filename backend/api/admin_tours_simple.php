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
$tourId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action = isset($_GET['action']) ? $_GET['action'] : null;

try {
    if ($method === 'POST' && $action === 'assign_guide') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['guide_id']) || !isset($input['booking_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'guide_id and booking_id are required']);
            exit;
        }
        
        $checkStmt = $pdo->prepare("SELECT id FROM tour_guide_assignments WHERE guide_id = ? AND booking_id = ?");
        $checkStmt->execute([$input['guide_id'], $input['booking_id']]);
        
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'This guide is already assigned to this booking']);
            exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO tour_guide_assignments (guide_id, booking_id, assignment_date, status) 
            VALUES (?, ?, ?, 'assigned')");
        $stmt->execute([
            $input['guide_id'],
            $input['booking_id'],
            $input['assigned_date'] ?? date('Y-m-d')
        ]);
        $updateGuideStmt = $pdo->prepare("UPDATE guides SET status = 'busy' WHERE id = ?");
        $updateGuideStmt->execute([$input['guide_id']]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Guide assigned to booking successfully',
            'assignment_id' => $pdo->lastInsertId()
        ]);
        exit;
    }
    
    switch ($method) {
        case 'GET':
            if ($tourId) {
                $stmt = $pdo->prepare("SELECT t.*, 
                    COUNT(DISTINCT b.id) as booking_count,
                    AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating ELSE 0 END) as avg_rating
                    FROM tours t
                    LEFT JOIN bookings b ON t.id = b.tour_id
                    LEFT JOIN reviews r ON t.id = r.tour_id
                    WHERE t.id = ?
                    GROUP BY t.id");
                $stmt->execute([$tourId]);
                $tour = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($tour) {
                    echo json_encode(['success' => true, 'data' => $tour]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Tour not found']);
                }
            } else {
                $stmt = $pdo->query("SELECT t.*, 
                    COUNT(DISTINCT b.id) as booking_count,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    CASE WHEN t.is_active = 1 THEN 'active' ELSE 'inactive' END as status
                    FROM tours t
                    LEFT JOIN bookings b ON t.id = b.tour_id
                    LEFT JOIN reviews r ON t.id = r.tour_id
                    GROUP BY t.id
                    ORDER BY t.created_at DESC");
                $tours = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $stats = [
                    'totalTours' => count($tours),
                    'activeTours' => count(array_filter($tours, fn($t) => $t['is_active'])),
                    'totalBookings' => array_sum(array_column($tours, 'booking_count')),
                    'avgRating' => count($tours) > 0 ? round(array_sum(array_column($tours, 'avg_rating')) / count($tours), 1) : 0
                ];
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'tours' => $tours,
                        'stats' => $stats
                    ],
                    'generated_at' => date('Y-m-d H:i:s')
                ]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO tours (title, description, destination, price, duration_days, category, difficulty_level, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['title'],
                $input['description'],
                $input['destination'],
                $input['price'],
                $input['duration_days'],
                $input['category'] ?? 'adventure',
                $input['difficulty_level'] ?? 'moderate',
                $input['is_active'] ?? 1
            ]);
            echo json_encode(['success' => true, 'message' => 'Tour created', 'id' => $pdo->lastInsertId()]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE tours SET title=?, description=?, destination=?, price=?, duration_days=?, is_active=? WHERE id=?");
            $stmt->execute([
                $input['title'],
                $input['description'],
                $input['destination'],
                $input['price'],
                $input['duration_days'],
                $input['is_active'] ?? 1,
                $tourId
            ]);
            echo json_encode(['success' => true, 'message' => 'Tour updated']);
            break;
            
        case 'DELETE':
            $checkStmt = $pdo->prepare("SELECT COUNT(*) as booking_count FROM bookings WHERE tour_id = ?");
            $checkStmt->execute([$tourId]);
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result['booking_count'] > 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Cannot delete tour with existing bookings',
                    'details' => "This tour has {$result['booking_count']} booking(s). Please cancel/delete bookings first or deactivate the tour instead.",
                    'booking_count' => $result['booking_count'],
                    'suggestion' => 'deactivate'
                ]);
            } else {
                $stmt = $pdo->prepare("DELETE FROM tours WHERE id = ?");
                $stmt->execute([$tourId]);
                echo json_encode(['success' => true, 'message' => 'Tour deleted successfully']);
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
