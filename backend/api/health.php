<?php
/**
 * Health Check Endpoint
 * Simple endpoint to verify API connectivity without authentication
 */

// Handle CORS for React frontend and Angular admin panel
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
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit();
}

// Database connection check
try {
    require_once '../config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    $dbConnected = $db !== null;
    $dbStatus = $dbConnected ? 'connected' : 'disconnected';
    
} catch (Exception $e) {
    $dbConnected = false;
    $dbStatus = 'error: ' . $e->getMessage();
}

// Return health status
$response = [
    'success' => true,
    'message' => 'API is healthy',
    'data' => [
        'status' => 'online',
        'timestamp' => date('Y-m-d H:i:s'),
        'server' => 'PHP/' . phpversion(),
        'database' => [
            'connected' => $dbConnected,
            'status' => $dbStatus
        ],
        'endpoints' => [
            'tours' => '/fu/backend/api/tours.php',
            'bookings' => '/fu/backend/api/bookings.php',
            'users' => '/fu/backend/api/users.php',
            'admin_login' => '/fu/backend/api/admin_login.php',
            'admin_dashboard' => '/fu/backend/api/admin_dashboard.php'
        ]
    ],
    'timestamp' => date('Y-m-d H:i:s')
];

http_response_code(200);
echo json_encode($response);
