<?php

session_start();

header('Content-Type: application/json');

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/admin_auth.php';

try {
    $admin = checkAdminAuth();
    
    if (!$admin) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Not authenticated'
        ]);
        exit();
    }
    
    refreshAdminSession();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Session valid',
        'data' => [
            'admin_id' => $admin['admin_id'],
            'email' => $admin['email'],
            'login_time' => $admin['login_time'],
            'session_id' => session_id()
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Admin session check error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Session check failed'
    ]);
}
?>
