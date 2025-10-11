<?php

header('Content-Type: application/json');

$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200', 'http://127.0.0.1:4200'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:4200';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:4200');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/config.php';
require_once '../config/database.php';
require_once '../config/security.php';
require_once '../classes/ResponseHandler.php';
require_once '../classes/ApiAuth.php';

$response = new ResponseHandler();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $endpoint = $_GET['endpoint'] ?? '';
    $action = $_GET['action'] ?? '';

    $apiAuth = new ApiAuth();

    switch ($endpoint) {
        case 'auth':
            require_once '../api/auth.php';
            $authHandler = new AuthAPI();
            $authHandler->handleRequest($method, $action);
            break;

        case 'tours':
            require_once '../api/tours.php';
            $toursHandler = new ToursAPI();
            $toursHandler->handleRequest($method, $action);
            break;

        case 'bookings':
            require_once '../api/bookings.php';
            $bookingsHandler = new BookingsAPI();
            $bookingsHandler->handleRequest($method, $action);
            break;

        case 'users':
            require_once '../api/users.php';
            $usersHandler = new UsersAPI();
            $usersHandler->handleRequest($method, $action);
            break;

        case 'payments':
            require_once '../api/payments.php';
            $paymentsHandler = new PaymentsAPI();
            $paymentsHandler->handleRequest($method, $action);
            break;

        case 'agents':
            require_once '../api/agents.php';
            $agentsHandler = new AgentsAPI();
            $agentsHandler->handleRequest($method, $action);
            break;

        case 'notifications':
            require_once '../api/notifications.php';
            $notificationsHandler = new NotificationsAPI();
            $notificationsHandler->handleRequest($method, $action);
            break;

        case 'chat':
            require_once '../api/chat.php';
            $chatHandler = new ChatAPI();
            $chatHandler->handleRequest($method, $action);
            break;

        case 'admin':
            require_once '../api/admin.php';
            $adminHandler = new AdminAPI();
            $adminHandler->handleRequest($method, $action);
            break;

        default:
            $response->error('Endpoint not found', 404);
    }

} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    $response->error($e->getMessage(), 500);
}
?>
