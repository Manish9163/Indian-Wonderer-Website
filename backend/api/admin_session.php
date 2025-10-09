<?php

// Start session
session_start();

// Set JSON response header
header('Content-Type: application/json');

// Handle CORS for React frontend
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include admin authentication utilities
require_once '../config/admin_auth.php';

try {
    // Check admin authentication
    $admin = checkAdminAuth();
    
    if (!$admin) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Not authenticated'
        ]);
        exit();
    }
    
    // Refresh session (extend timeout)
    refreshAdminSession();
    
    // Return admin data
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
    // Log error
    error_log("Admin session check error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Session check failed'
    ]);
}
?>
