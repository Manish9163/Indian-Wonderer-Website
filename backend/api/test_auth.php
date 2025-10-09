<?php
/**
 * Test Authentication Endpoint
 * Debug what's being received
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? 'NOT FOUND';
$token = str_replace('Bearer ', '', $authHeader);

$response = [
    'headers' => $headers,
    'authHeader' => $authHeader,
    'token' => $token,
    'tokenLength' => strlen($token),
    'session' => $_SESSION,
    'sessionId' => session_id()
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
