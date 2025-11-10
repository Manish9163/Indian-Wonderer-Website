<?php
/**
 * Travel API Configuration Management Endpoint
 * Secure API key management with admin authentication
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../services/TravelAPIKeyManager.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Verify admin access
    $auth = new AuthMiddleware();
    if (!$auth->isAdmin()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $db = Database::getInstance();
    $manager = new TravelAPIKeyManager($db);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    switch ($method) {
        case 'GET':
            handleGet($manager, $action);
            break;

        case 'POST':
            handlePost($manager, $action);
            break;

        case 'PUT':
            handlePut($manager, $action);
            break;

        case 'DELETE':
            handleDelete($manager, $action);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function handleGet($manager, $action) {
    switch ($action) {
        case 'all':
            $configs = $manager->getAllConfigurations();
            echo json_encode(['success' => true, 'data' => $configs]);
            break;

        case 'by-mode':
            $mode = $_GET['mode'] ?? '';
            if (empty($mode)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Mode parameter required']);
                return;
            }
            $configs = $manager->getConfigurationsByMode($mode);
            echo json_encode(['success' => true, 'data' => $configs]);
            break;

        case 'single':
            $provider = $_GET['provider'] ?? '';
            if (empty($provider)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Provider parameter required']);
                return;
            }
            $config = $manager->getConfiguration($provider);
            if ($config) {
                // Mask sensitive data
                $config['api_key'] = !empty($config['api_key']) ? substr($config['api_key'], 0, 4) . '****' : null;
                $config['client_secret'] = !empty($config['client_secret']) ? substr($config['client_secret'], 0, 4) . '****' : null;
                echo json_encode(['success' => true, 'data' => $config]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Configuration not found']);
            }
            break;

        case 'stats':
            $stats = $manager->getStatistics();
            echo json_encode(['success' => true, 'data' => $stats]);
            break;

        case 'test':
            $provider = $_GET['provider'] ?? '';
            if (empty($provider)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Provider parameter required']);
                return;
            }
            $result = $manager->testAPIConnection($provider);
            http_response_code($result['success'] ? 200 : 400);
            echo json_encode($result);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Unknown action']);
    }
}

function handlePost($manager, $action) {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'save') {
        $provider = $data['provider_name'] ?? '';
        if (empty($provider)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Provider name required']);
            return;
        }

        $result = $manager->saveConfiguration($provider, $data);
        http_response_code($result['success'] ? 201 : 400);
        echo json_encode($result);
    } else if ($action === 'test') {
        $provider = $data['provider_name'] ?? '';
        if (empty($provider)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Provider name required']);
            return;
        }

        $result = $manager->testAPIConnection($provider);
        http_response_code($result['success'] ? 200 : 400);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
    }
}

function handlePut($manager, $action) {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'toggle') {
        $provider = $data['provider_name'] ?? '';
        $enabled = $data['enabled'] ?? false;

        if (empty($provider)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Provider name required']);
            return;
        }

        $result = $manager->toggleAPI($provider, $enabled);
        http_response_code($result['success'] ? 200 : 400);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
    }
}

function handleDelete($manager, $action) {
    $provider = $_GET['provider'] ?? '';

    if (empty($provider)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Provider parameter required']);
        return;
    }

    $result = $manager->deleteConfiguration($provider);
    http_response_code($result['success'] ? 200 : 400);
    echo json_encode($result);
}
