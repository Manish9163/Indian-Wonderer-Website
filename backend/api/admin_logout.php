<?php

session_start();

header('Content-Type: application/json');

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No active admin session to logout'
        ]);
        exit();
    }
    
    logAdminActivity('admin_logout', [
        'logout_method' => 'api_request'
    ]);
    
    destroyAdminSession();
    
    error_log("Admin logout successful: {$admin['email']} from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Logout successful'
    ]);
    
} catch (Exception $e) {
    error_log("Admin logout error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred during logout'
    ]);
}
?>
