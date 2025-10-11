<?php
session_start();

$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:4200',
    'http://127.0.0.1:4200'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
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
$action = $_GET['action'] ?? '';
$guide_id = $_GET['id'] ?? null;

try {
    switch ($method) {
        case 'GET':
            if ($guide_id) {
                getGuide($conn, $guide_id);
            } else {
                getAllGuides($conn);
            }
            break;
            
        case 'POST':
            if ($action === 'assign') {
                assignGuide($conn);
            } else {
                createGuide($conn);
            }
            break;
            
        case 'PUT':
            updateGuide($conn, $guide_id);
            break;
            
        case 'DELETE':
            deleteGuide($conn, $guide_id);
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

function getAllGuides($conn) {
    $status = $_GET['status'] ?? 'all';
    
    $query = "SELECT g.*, 
              u.first_name, u.last_name, u.email, u.phone, u.profile_image,
              COUNT(DISTINCT tga.id) as total_assignments
              FROM guides g
              LEFT JOIN users u ON g.user_id = u.id
              LEFT JOIN tour_guide_assignments tga ON g.id = tga.guide_id
              WHERE g.application_status = 'approved'";
    
    if ($status !== 'all') {
        $query .= " AND g.status = :status";
    }
    
    $query .= " GROUP BY g.id ORDER BY g.rating DESC, g.total_tours DESC";
    
    $stmt = $conn->prepare($query);
    
    if ($status !== 'all') {
        $stmt->bindParam(':status', $status);
    }
    
    $stmt->execute();
    $guides = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($guides as &$guide) {
        $guide['languages'] = json_decode($guide['languages'] ?? '[]', true);
        $guide['availability'] = json_decode($guide['availability'] ?? '[]', true);
        $guide['full_name'] = ($guide['first_name'] ?? '') . ' ' . ($guide['last_name'] ?? '');
    }
    
    echo json_encode([
        'success' => true,
        'data' => $guides,
        'total' => count($guides)
    ]);
}

function getGuide($conn, $guide_id) {
    $query = "SELECT g.*, 
              u.first_name, u.last_name, u.email, u.phone, u.profile_image
              FROM guides g
              LEFT JOIN users u ON g.user_id = u.id
              WHERE g.id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([$guide_id]);
    $guide = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($guide) {
        $guide['languages'] = json_decode($guide['languages'] ?? '[]', true);
        $guide['availability'] = json_decode($guide['availability'] ?? '[]', true);
        $guide['full_name'] = ($guide['first_name'] ?? '') . ' ' . ($guide['last_name'] ?? '');
        
        echo json_encode(['success' => true, 'data' => $guide]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Guide not found']);
    }
}

function assignGuide($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required_fields = ['booking_id', 'guide_id'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
            return;
        }
    }
    
    $check_query = "SELECT status FROM guides WHERE id = ?";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->execute([$input['guide_id']]);
    $guide = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$guide) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Guide not found']);
        return;
    }
    
    $query = "INSERT INTO tour_guide_assignments (booking_id, guide_id, assignment_date, status, notes) 
              VALUES (?, ?, CURDATE(), 'assigned', ?)";
    
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([
        $input['booking_id'],
        $input['guide_id'],
        $input['notes'] ?? null
    ]);
    
    if ($result) {
        $assignment_id = $conn->lastInsertId();
        
        $update_query = "UPDATE guides SET status = 'busy', total_tours = total_tours + 1 WHERE id = ?";
        $update_stmt = $conn->prepare($update_query);
        $update_stmt->execute([$input['guide_id']]);
        
        $booking_update = "UPDATE bookings SET guide_id = ? WHERE id = ?";
        $booking_stmt = $conn->prepare($booking_update);
        $booking_stmt->execute([$input['guide_id'], $input['booking_id']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Guide assigned successfully',
            'data' => ['assignment_id' => $assignment_id]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to assign guide']);
    }
}

function updateGuide($conn, $guide_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $allowed_fields = ['status', 'specialization', 'experience_years', 'languages', 'certification', 'bio', 'rating', 'hourly_rate', 'availability'];
    $update_fields = [];
    $values = [];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $update_fields[] = "$field = ?";
            $values[] = is_array($input[$field]) ? json_encode($input[$field]) : $input[$field];
        }
    }
    
    if (empty($update_fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        return;
    }
    
    $values[] = $guide_id;
    $query = "UPDATE guides SET " . implode(', ', $update_fields) . " WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    $result = $stmt->execute($values);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Guide updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update guide']);
    }
}

function createGuide($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required_fields = ['user_id', 'specialization'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
            return;
        }
    }
    
    $query = "INSERT INTO guides (user_id, specialization, experience_years, languages, certification, bio, hourly_rate, availability, status, application_status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', 'approved')";
    
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([
        $input['user_id'],
        $input['specialization'],
        $input['experience_years'] ?? 0,
        json_encode($input['languages'] ?? []),
        $input['certification'] ?? null,
        $input['bio'] ?? null,
        $input['hourly_rate'] ?? null,
        json_encode($input['availability'] ?? [])
    ]);
    
    if ($result) {
        $guide_id = $conn->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Guide created successfully',
            'data' => ['id' => $guide_id]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create guide']);
    }
}

function deleteGuide($conn, $guide_id) {
    $query = "UPDATE guides SET status = 'inactive', application_status = 'rejected' WHERE id = ?";
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([$guide_id]);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Guide deactivated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to deactivate guide']);
    }
}
?>
