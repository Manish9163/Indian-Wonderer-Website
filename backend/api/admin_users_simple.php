<?php
// Simple Admin Users API - No authentication required for testing
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
$userId = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    switch ($method) {
        case 'GET':
            if ($userId) {
                // Get single user
                $stmt = $pdo->prepare("SELECT u.*, 
                    COUNT(DISTINCT b.id) as total_bookings
                    FROM users u
                    LEFT JOIN bookings b ON u.id = b.user_id
                    WHERE u.id = ?
                    GROUP BY u.id");
                $stmt->execute([$userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($user) {
                    echo json_encode(['success' => true, 'data' => $user]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'User not found']);
                }
            } else {
                // Get all users
                $stmt = $pdo->query("SELECT u.*, 
                    COUNT(DISTINCT b.id) as total_bookings,
                    CASE WHEN u.is_active = 1 THEN 'active' ELSE 'inactive' END as status
                    FROM users u
                    LEFT JOIN bookings b ON u.id = b.user_id
                    GROUP BY u.id
                    ORDER BY u.created_at DESC");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Calculate stats
                $statsStmt = $pdo->query("SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
                    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
                    COUNT(CASE WHEN role = 'guide' THEN 1 END) as guides,
                    COUNT(CASE WHEN is_active = 1 THEN 1 END) as active,
                    COUNT(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 END) as new_this_month
                    FROM users");
                $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'users' => $users,
                        'stats' => [
                            'totalUsers' => (int)$stats['total'],
                            'customers' => (int)$stats['customers'],
                            'admins' => (int)$stats['admins'],
                            'guides' => (int)$stats['guides'],
                            'activeUsers' => (int)$stats['active'],
                            'newThisMonth' => (int)$stats['new_this_month']
                        ]
                    ],
                    'generated_at' => date('Y-m-d H:i:s')
                ]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $hashedPassword = password_hash($input['password'] ?? 'password123', PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password, first_name, last_name, phone, role, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['username'],
                $input['email'],
                $hashedPassword,
                $input['first_name'] ?? '',
                $input['last_name'] ?? '',
                $input['phone'] ?? '',
                $input['role'] ?? 'customer',
                $input['is_active'] ?? 1
            ]);
            echo json_encode(['success' => true, 'message' => 'User created', 'id' => $pdo->lastInsertId()]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['password']) && !empty($input['password'])) {
                $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET username=?, email=?, password=?, role=?, is_active=? WHERE id=?");
                $stmt->execute([
                    $input['username'],
                    $input['email'],
                    $hashedPassword,
                    $input['role'],
                    $input['is_active'] ?? 1,
                    $userId
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET username=?, email=?, role=?, is_active=? WHERE id=?");
                $stmt->execute([
                    $input['username'],
                    $input['email'],
                    $input['role'],
                    $input['is_active'] ?? 1,
                    $userId
                ]);
            }
            echo json_encode(['success' => true, 'message' => 'User updated']);
            break;
            
        case 'DELETE':
            // Check if user has bookings
            $checkStmt = $pdo->prepare("SELECT COUNT(*) as count FROM bookings WHERE user_id = ?");
            $checkStmt->execute([$userId]);
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result['count'] > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'Cannot delete user with existing bookings. Deactivate instead.']);
            } else {
                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                echo json_encode(['success' => true, 'message' => 'User deleted']);
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
