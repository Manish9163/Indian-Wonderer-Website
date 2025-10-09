<?php
// Handle CORS for React frontend and Angular admin panel
$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:4201',
    'http://127.0.0.1:4201'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:4200');
}

header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path_parts = explode('/', trim($request_uri, '/'));

// Extract customer ID if present
$customer_id = isset($path_parts[4]) ? (int)$path_parts[4] : null;

// Get headers for authentication
$headers = apache_request_headers();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

if (!$token) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authorization token required']);
    exit;
}

try {
    switch ($method) {
        case 'GET':
            if ($customer_id) {
                getCustomer($conn, $customer_id);
            } else {
                getAllCustomers($conn);
            }
            break;
            
        case 'POST':
            createCustomer($conn);
            break;
            
        case 'PUT':
            updateCustomer($conn, $customer_id);
            break;
            
        case 'DELETE':
            deleteCustomer($conn, $customer_id);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

function getAllCustomers($conn) {
    $query = "SELECT u.*, 
                     COUNT(DISTINCT b.id) as total_bookings,
                     COALESCE(SUM(p.amount), 0) as total_spent,
                     MAX(b.created_at) as last_booking_date
              FROM users u 
              LEFT JOIN bookings b ON u.id = b.user_id
              LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'completed'
              WHERE u.role = 'customer'
              GROUP BY u.id
              ORDER BY u.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map profile_image to avatar for frontend compatibility
    foreach ($customers as &$customer) {
        $customer['avatar'] = $customer['profile_image'] ?? null;
        $customer['name'] = trim(($customer['first_name'] ?? '') . ' ' . ($customer['last_name'] ?? ''));
        if (empty($customer['name'])) {
            $customer['name'] = $customer['username'];
        }
    }
    
    // Calculate stats
    $stats = [
        'total' => count($customers),
        'active' => count(array_filter($customers, fn($c) => $c['is_active'])),
        'premium' => count(array_filter($customers, fn($c) => ($c['total_spent'] ?? 0) > 10000)),
        'newThisMonth' => count(array_filter($customers, function($c) {
            return isset($c['created_at']) && strtotime($c['created_at']) > strtotime('-30 days');
        }))
    ];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'customers' => $customers,
            'stats' => $stats
        ],
        'total' => count($customers)
    ]);
}

function getCustomer($conn, $customer_id) {
    $query = "SELECT u.*, 
                     COUNT(DISTINCT b.id) as total_bookings,
                     COALESCE(SUM(p.amount), 0) as total_spent,
                     MAX(b.created_at) as last_booking_date
              FROM users u 
              LEFT JOIN bookings b ON u.id = b.user_id
              LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'completed'
              WHERE u.id = ? AND u.role = 'customer'
              GROUP BY u.id";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([$customer_id]);
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($customer) {
        // Map profile_image to avatar for frontend compatibility
        $customer['avatar'] = $customer['profile_image'] ?? null;
        $customer['name'] = trim(($customer['first_name'] ?? '') . ' ' . ($customer['last_name'] ?? ''));
        if (empty($customer['name'])) {
            $customer['name'] = $customer['username'];
        }
        
        // Get customer's bookings
        $bookings_query = "SELECT b.*, t.title as tour_title, t.destination, p.status as payment_status
                          FROM bookings b
                          LEFT JOIN tours t ON b.tour_id = t.id
                          LEFT JOIN payments p ON b.id = p.booking_id
                          WHERE b.user_id = ?
                          ORDER BY b.created_at DESC";
        
        $bookings_stmt = $conn->prepare($bookings_query);
        $bookings_stmt->execute([$customer_id]);
        $customer['bookings'] = $bookings_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $customer]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Customer not found']);
    }
}

function createCustomer($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required_fields = ['username', 'email', 'first_name', 'last_name'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
            return;
        }
    }
    
    // Check if email already exists
    $check_query = "SELECT id FROM users WHERE email = ?";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->execute([$input['email']]);
    
    if ($check_stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email already exists']);
        return;
    }
    
    $query = "INSERT INTO users (username, email, first_name, last_name, phone, date_of_birth, address, city, country, role, password, is_active) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'customer', ?, ?)";
    
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([
        $input['username'],
        $input['email'],
        $input['first_name'],
        $input['last_name'],
        $input['phone'] ?? null,
        $input['date_of_birth'] ?? null,
        $input['address'] ?? null,
        $input['city'] ?? null,
        $input['country'] ?? null,
        password_hash($input['password'] ?? 'defaultpassword', PASSWORD_DEFAULT),
        $input['is_active'] ?? true
    ]);
    
    if ($result) {
        $customer_id = $conn->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Customer created successfully',
            'data' => ['id' => $customer_id]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create customer']);
    }
}

function updateCustomer($conn, $customer_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $allowed_fields = ['username', 'email', 'first_name', 'last_name', 'phone', 'date_of_birth', 'address', 'city', 'country', 'is_active'];
    $update_fields = [];
    $values = [];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $update_fields[] = "$field = ?";
            $values[] = $input[$field];
        }
    }
    
    if (empty($update_fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No valid fields to update']);
        return;
    }
    
    // Check if email already exists for other users
    if (isset($input['email'])) {
        $check_query = "SELECT id FROM users WHERE email = ? AND id != ?";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->execute([$input['email'], $customer_id]);
        
        if ($check_stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Email already exists']);
            return;
        }
    }
    
    $values[] = $customer_id;
    $query = "UPDATE users SET " . implode(', ', $update_fields) . ", updated_at = NOW() WHERE id = ? AND role = 'customer'";
    
    $stmt = $conn->prepare($query);
    $result = $stmt->execute($values);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Customer updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update customer']);
    }
}

function deleteCustomer($conn, $customer_id) {
    try {
        // Start transaction
        $conn->beginTransaction();
        
        // Check if customer has bookings
        $check_query = "SELECT COUNT(*) as booking_count FROM bookings WHERE user_id = ?";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->execute([$customer_id]);
        $result = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['booking_count'] > 0) {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Cannot delete customer with existing bookings. Deactivate instead.']);
            return;
        }
        
        // Delete related activity logs first (to avoid foreign key constraint)
        $delete_logs_query = "DELETE FROM activity_logs WHERE user_id = ?";
        $delete_logs_stmt = $conn->prepare($delete_logs_query);
        $delete_logs_stmt->execute([$customer_id]);
        
        // Delete related reviews if any
        $delete_reviews_query = "DELETE FROM reviews WHERE user_id = ?";
        $delete_reviews_stmt = $conn->prepare($delete_reviews_query);
        $delete_reviews_stmt->execute([$customer_id]);
        
        // Finally, delete the customer
        $query = "DELETE FROM users WHERE id = ? AND role = 'customer'";
        $stmt = $conn->prepare($query);
        $result = $stmt->execute([$customer_id]);
        
        if ($result && $stmt->rowCount() > 0) {
            // Commit transaction
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Customer and related records deleted successfully']);
        } else {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Customer not found or already deleted']);
        }
    } catch (Exception $e) {
        // Rollback on error
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
