<?php
session_start();

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

// Extract payment ID if present
$payment_id = isset($path_parts[4]) ? (int)$path_parts[4] : null;
$action = isset($path_parts[5]) ? $path_parts[5] : null;

// Get headers for authentication
$headers = apache_request_headers();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

// Check authentication - allow either token or admin session
$isAuthenticated = false;
if ($token) {
    // Token-based authentication
    $isAuthenticated = true;
} elseif (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    // Admin session authentication
    $isAuthenticated = true;
}

if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authorization required']);
    exit;
}

try {
    switch ($method) {
        case 'GET':
            if ($payment_id) {
                getPayment($conn, $payment_id);
            } else {
                getAllPayments($conn);
            }
            break;
            
        case 'POST':
            if ($action === 'refund') {
                refundPayment($conn, $payment_id);
            } else {
                createPayment($conn);
            }
            break;
            
        case 'PUT':
            updatePayment($conn, $payment_id);
            break;
            
        case 'DELETE':
            deletePayment($conn, $payment_id);
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

function getAllPayments($conn) {
    $query = "SELECT p.*, 
              b.user_id, 
              b.traveler_details,
              t.title as tour_title, 
              u.first_name, 
              u.last_name 
              FROM payments p 
              LEFT JOIN bookings b ON p.booking_id = b.id
              LEFT JOIN tours t ON b.tour_id = t.id
              LEFT JOIN users u ON b.user_id = u.id
              ORDER BY p.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Extract customer name from traveler_details JSON if user info is not available
    foreach ($payments as &$payment) {
        if (empty($payment['first_name']) && !empty($payment['traveler_details'])) {
            $travelerDetails = json_decode($payment['traveler_details'], true);
            if (isset($travelerDetails['primary_contact']['name'])) {
                $nameParts = explode(' ', $travelerDetails['primary_contact']['name'], 2);
                $payment['first_name'] = $nameParts[0];
                $payment['last_name'] = isset($nameParts[1]) ? $nameParts[1] : '';
                $payment['customer_name'] = $travelerDetails['primary_contact']['name'];
            }
        } else if (!empty($payment['first_name'])) {
            $payment['customer_name'] = trim($payment['first_name'] . ' ' . $payment['last_name']);
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $payments,
        'total' => count($payments)
    ]);
}

function getPayment($conn, $payment_id) {
    $query = "SELECT p.*, b.user_id, t.title as tour_title, u.first_name, u.last_name 
              FROM payments p 
              LEFT JOIN bookings b ON p.booking_id = b.id
              LEFT JOIN tours t ON b.tour_id = t.id
              LEFT JOIN users u ON b.user_id = u.id
              WHERE p.id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([$payment_id]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($payment) {
        echo json_encode(['success' => true, 'data' => $payment]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Payment not found']);
    }
}

function createPayment($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required_fields = ['booking_id', 'amount', 'payment_method'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
            return;
        }
    }
    
    $query = "INSERT INTO payments (booking_id, amount, currency, payment_method, payment_status, transaction_id) 
              VALUES (?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([
        $input['booking_id'],
        $input['amount'],
        $input['currency'] ?? 'INR',
        $input['payment_method'],
        $input['payment_status'] ?? 'pending',
        $input['transaction_id'] ?? uniqid('txn_')
    ]);
    
    if ($result) {
        $payment_id = $conn->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Payment created successfully',
            'data' => ['id' => $payment_id]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create payment']);
    }
}

function updatePayment($conn, $payment_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $allowed_fields = ['amount', 'currency', 'payment_method', 'payment_status', 'transaction_id'];
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
    
    $values[] = $payment_id;
    $query = "UPDATE payments SET " . implode(', ', $update_fields) . ", updated_at = NOW() WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    $result = $stmt->execute($values);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Payment updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update payment']);
    }
}

function refundPayment($conn, $payment_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $query = "UPDATE payments SET payment_status = 'refunded', updated_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([$payment_id]);
    
    if ($result) {
        // Log refund reason if provided
        if (isset($input['reason'])) {
            $log_query = "INSERT INTO payment_logs (payment_id, action, reason, created_at) VALUES (?, 'refund', ?, NOW())";
            $log_stmt = $conn->prepare($log_query);
            $log_stmt->execute([$payment_id, $input['reason']]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Payment refunded successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to refund payment']);
    }
}

function deletePayment($conn, $payment_id) {
    $query = "DELETE FROM payments WHERE id = ?";
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([$payment_id]);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Payment deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete payment']);
    }
}
?>
