<?php
/**
 * Travel Admin API
 * Manages travel operators, routes, and bookings
 */

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
    header('Access-Control-Allow-Origin: http://localhost:4200');
}

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['success' => true]));
}

require_once __DIR__ . '/../../config/database.php';

class TravelAdminAPI {
    private $pdo;

    public function __construct() {
        try {
            $database = new Database();
            $this->pdo = $database->getConnection();
        } catch (Exception $e) {
            $this->error('Database connection failed', 503);
        }
    }

    /**
     * Get all operators
     */
    public function getOperators() {
        try {
            $query = "SELECT * FROM travel_operators ORDER BY created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $operators = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $operators
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Add operator
     */
    public function addOperator() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return $this->error('Method not allowed', 405);
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['operator_name']) || empty($data['operator_type'])) {
            return $this->error('Missing required fields', 400);
        }

        try {
            $query = "INSERT INTO travel_operators (operator_name, operator_type, logo_url, rating, is_active)
                     VALUES (?, ?, ?, ?, 1)";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['operator_name'],
                $data['operator_type'],
                $data['logo_url'] ?? null,
                $data['rating'] ?? 0.00
            ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Operator added successfully',
                'operator_id' => $this->pdo->lastInsertId()
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Delete operator
     */
    public function deleteOperator() {
        $id = intval($_GET['id'] ?? 0);

        if (!$id) {
            return $this->error('ID parameter required', 400);
        }

        try {
            $query = "DELETE FROM travel_operators WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Operator deleted successfully'
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get all routes
     */
    public function getRoutes() {
        try {
            $query = "SELECT * FROM travel_routes ORDER BY from_city, to_city";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $routes
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Add route
     */
    public function addRoute() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return $this->error('Method not allowed', 405);
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['from_city']) || empty($data['to_city']) || empty($data['travel_mode'])) {
            return $this->error('Missing required fields', 400);
        }

        try {
            $query = "INSERT INTO travel_routes (from_city, to_city, travel_mode, distance_km, estimated_duration_hours, is_active)
                     VALUES (?, ?, ?, ?, ?, 1)";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['from_city'],
                $data['to_city'],
                $data['travel_mode'],
                $data['distance_km'] ?? null,
                $data['estimated_duration_hours'] ?? null
            ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Route added successfully',
                'route_id' => $this->pdo->lastInsertId()
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Delete route
     */
    public function deleteRoute() {
        $id = intval($_GET['id'] ?? 0);

        if (!$id) {
            return $this->error('ID parameter required', 400);
        }

        try {
            $query = "DELETE FROM travel_routes WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Route deleted successfully'
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get all bookings
     */
    public function getBookings() {
        try {
            $query = "SELECT 
                        to.id,
                        to.booking_id,
                        to.mode,
                        to.operator_name,
                        to.from_city,
                        to.to_city,
                        to.travel_date,
                        to.travel_time,
                        to.total_amount,
                        to.status,
                        (SELECT COUNT(*) FROM travel_seats WHERE travel_id = to.id AND is_booked = 0) as seats_available
                     FROM travel_options to
                     WHERE to.booking_id IS NOT NULL
                     ORDER BY to.travel_date DESC";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $bookings,
                'total' => count($bookings)
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get booking analytics
     */
    public function getAnalytics() {
        try {
            // Total bookings by status
            $status_query = "SELECT status, COUNT(*) as count FROM travel_options WHERE booking_id IS NOT NULL GROUP BY status";
            $status_stmt = $this->pdo->prepare($status_query);
            $status_stmt->execute();
            $status_counts = $status_stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            // Total revenue
            $revenue_query = "SELECT SUM(total_amount) as revenue FROM travel_options WHERE booking_id IS NOT NULL AND status = 'confirmed'";
            $revenue_stmt = $this->pdo->prepare($revenue_query);
            $revenue_stmt->execute();
            $revenue = $revenue_stmt->fetch(PDO::FETCH_ASSOC)['revenue'] ?? 0;

            // Bookings by mode
            $mode_query = "SELECT mode, COUNT(*) as count FROM travel_options WHERE booking_id IS NOT NULL GROUP BY mode";
            $mode_stmt = $this->pdo->prepare($mode_query);
            $mode_stmt->execute();
            $mode_counts = $mode_stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'status' => $status_counts,
                    'revenue' => floatval($revenue),
                    'by_mode' => $mode_counts
                ]
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Error response
     */
    private function error($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message,
            'code' => $code
        ]);
        exit;
    }
}

// Route requests
$action = $_GET['action'] ?? 'get-operators';

$api = new TravelAdminAPI();

switch ($action) {
    case 'get-operators':
        $api->getOperators();
        break;
    case 'add-operator':
        $api->addOperator();
        break;
    case 'delete-operator':
        $api->deleteOperator();
        break;
    case 'get-routes':
        $api->getRoutes();
        break;
    case 'add-route':
        $api->addRoute();
        break;
    case 'delete-route':
        $api->deleteRoute();
        break;
    case 'get-bookings':
        $api->getBookings();
        break;
    case 'get-analytics':
        $api->getAnalytics();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}
?>
