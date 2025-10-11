<?php

session_start();

$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4200',
    'http://127.0.0.1:4200'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';
$user_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (in_array($action, ['all', 'guides', 'pending-guides', 'approve-guide', 'reject-guide', 'stats'])) {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit;
    }
}

try {
    switch ($method) {
        case 'GET':
            handleGet($db, $action, $user_id);
            break;
        case 'POST':
            handlePost($db, $action);
            break;
        case 'PUT':
            handlePut($db, $action, $user_id);
            break;
        case 'DELETE':
            handleDelete($db, $user_id);
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

function handleGet($db, $action, $user_id) {
    switch ($action) {
        case 'all':
            getAllUsers($db);
            break;
        case 'single':
            getUser($db, $user_id);
            break;
        case 'guides':
            getAllGuides($db);
            break;
        case 'pending-guides':
            getPendingGuides($db);
            break;
        case 'stats':
            getUserStats($db);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}

function handlePost($db, $action) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    switch ($action) {
        case 'create':
            createUser($db, $data);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}

function handlePut($db, $action, $user_id) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    switch ($action) {
        case 'approve-guide':
            approveGuide($db, $user_id);
            break;
        case 'reject-guide':
            rejectGuide($db, $user_id, $data);
            break;
        default:
            updateUser($db, $user_id, $data);
            break;
    }
}

function handleDelete($db, $user_id) {
    deleteUser($db, $user_id);
}

function getAllUsers($db) {
    try {
        $query = "SELECT id, username, email, first_name, last_name, phone, role, 
                         profile_image, is_active, email_verified, created_at 
                  FROM users 
                  ORDER BY created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'data' => $users,
            'total' => count($users)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch users']);
    }
}

function getUser($db, $user_id) {
    try {
        $query = "SELECT id, username, email, first_name, last_name, phone, role, 
                         profile_image, is_active, email_verified, created_at 
                  FROM users 
                  WHERE id = ?";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        if ($user) {
            echo json_encode(['success' => true, 'data' => $user]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch user']);
    }
}

function getAllGuides($db) {
    try {
        $query = "SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, 
                         u.profile_image, u.is_active, u.email_verified, u.created_at,
                         g.specialties, g.languages, g.experience_years, g.status, g.rating,
                         (SELECT COUNT(*) FROM tour_guide_assignments WHERE guide_id = u.id) as total_tours
                  FROM users u
                  LEFT JOIN guides g ON u.id = g.user_id
                  WHERE u.role = 'guide'
                  ORDER BY u.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $guides = $stmt->fetchAll();
        
        foreach ($guides as &$guide) {
            $guide['specialties'] = $guide['specialties'] ? json_decode($guide['specialties']) : [];
            $guide['languages'] = $guide['languages'] ? json_decode($guide['languages']) : [];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $guides,
            'total' => count($guides)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch guides']);
    }
}

function getPendingGuides($db) {
    try {
        $query = "SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, 
                         u.profile_image, u.is_active, u.email_verified, u.created_at,
                         g.specialties, g.languages, g.experience_years, g.bio, g.certifications
                  FROM users u
                  LEFT JOIN guides g ON u.id = g.user_id
                  WHERE u.role = 'guide' AND (g.status = 'pending' OR g.status IS NULL)
                  ORDER BY u.created_at ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $guides = $stmt->fetchAll();
        
        foreach ($guides as &$guide) {
            $guide['specialties'] = $guide['specialties'] ? json_decode($guide['specialties']) : [];
            $guide['languages'] = $guide['languages'] ? json_decode($guide['languages']) : [];
            $guide['certifications'] = $guide['certifications'] ? json_decode($guide['certifications']) : [];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $guides,
            'total' => count($guides)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch pending guides']);
    }
}

function approveGuide($db, $guide_id) {
    try {
        $db->beginTransaction();
        
        $query = "INSERT INTO guides (user_id, status, approved_at) 
                  VALUES (?, 'approved', NOW()) 
                  ON DUPLICATE KEY UPDATE 
                  status = 'approved', approved_at = NOW()";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$guide_id]);
        
        logActivity($db, null, 'APPROVE_GUIDE', 'guides', $guide_id, null, ['status' => 'approved']);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Guide approved successfully'
        ]);
    } catch (PDOException $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to approve guide']);
    }
}

function rejectGuide($db, $guide_id, $data) {
    try {
        $reason = isset($data['reason']) ? $data['reason'] : 'No reason provided';
        
        $db->beginTransaction();
        
        $query = "INSERT INTO guides (user_id, status, rejection_reason, rejected_at) 
                  VALUES (?, 'rejected', ?, NOW()) 
                  ON DUPLICATE KEY UPDATE 
                  status = 'rejected', rejection_reason = ?, rejected_at = NOW()";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$guide_id, $reason, $reason]);
        
        logActivity($db, null, 'REJECT_GUIDE', 'guides', $guide_id, null, ['status' => 'rejected', 'reason' => $reason]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Guide rejected successfully'
        ]);
    } catch (PDOException $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to reject guide']);
    }
}

function createUser($db, $data) {
    try {
        $required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
                return;
            }
        }
        
        $query = "SELECT id FROM users WHERE email = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email already exists']);
            return;
        }
        
        $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $query = "INSERT INTO users (username, email, password, first_name, last_name, phone, role, profile_image, is_active) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($query);
        $success = $stmt->execute([
            $data['username'],
            $data['email'],
            $hashed_password,
            $data['first_name'],
            $data['last_name'],
            $data['phone'] ?? null,
            $data['role'],
            $data['profile_image'] ?? null,
            $data['is_active'] ?? true
        ]);
        
        if ($success) {
            $user_id = $db->lastInsertId();
            logActivity($db, null, 'CREATE_USER', 'users', $user_id, null, $data);
            
            echo json_encode([
                'success' => true,
                'message' => 'User created successfully',
                'data' => ['id' => $user_id]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create user']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function updateUser($db, $user_id, $data) {
    try {
        $allowed_fields = ['username', 'email', 'first_name', 'last_name', 'phone', 'role', 'profile_image', 'is_active', 'email_verified'];
        $update_fields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowed_fields)) {
                $update_fields[] = "$key = ?";
                $values[] = $value;
            }
        }
        
        if (empty($update_fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No valid fields to update']);
            return;
        }
        
        $values[] = $user_id;
        $query = "UPDATE users SET " . implode(', ', $update_fields) . " WHERE id = ?";
        
        $stmt = $db->prepare($query);
        $success = $stmt->execute($values);
        
        if ($success) {
            logActivity($db, null, 'UPDATE_USER', 'users', $user_id, null, $data);
            echo json_encode(['success' => true, 'message' => 'User updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update user']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function deleteUser($db, $user_id) {
    try {
        $query = "DELETE FROM users WHERE id = ? AND role != 'admin'";
        $stmt = $db->prepare($query);
        $success = $stmt->execute([$user_id]);
        
        if ($success && $stmt->rowCount() > 0) {
            logActivity($db, null, 'DELETE_USER', 'users', $user_id, null, null);
            echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found or cannot delete admin']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete user']);
    }
}

function getUserStats($db) {
    try {
        $stats = [];
        
        $query = "SELECT role, COUNT(*) as count FROM users GROUP BY role";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $role_stats = $stmt->fetchAll();
        
        $stats['by_role'] = [];
        foreach ($role_stats as $stat) {
            $stats['by_role'][$stat['role']] = $stat['count'];
        }
        
        $query = "SELECT COUNT(*) as count FROM users u 
                  LEFT JOIN guides g ON u.id = g.user_id 
                  WHERE u.role = 'guide' AND (g.status = 'pending' OR g.status IS NULL)";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $stats['pending_guides'] = $stmt->fetch()['count'];
        
        $query = "SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $stats['recent_registrations'] = $stmt->fetch()['count'];
        
        echo json_encode([
            'success' => true,
            'data' => $stats
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch user statistics']);
    }
}
?>
