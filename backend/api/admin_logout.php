<?php

// Start session
session_start();

// Set JSON response header
header('Content-Type: application/json');

// Handle CORS for React frontend
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
    // Check if there's an active admin session
    $admin = checkAdminAuth();
    
    if (!$admin) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No active admin session to logout'
        ]);
        exit();
    }
    
    // Log the logout activity
    logAdminActivity('admin_logout', [
        'logout_method' => 'api_request'
    ]);
    
    // Destroy the admin session
    destroyAdminSession();
    
    // Log successful logout
    error_log("Admin logout successful: {$admin['email']} from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Logout successful'
    ]);
    
} catch (Exception $e) {
    // Log error
    error_log("Admin logout error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred during logout'
    ]);
}
?>
