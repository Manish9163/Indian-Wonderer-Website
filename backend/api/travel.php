<?php
/**
 * Travel Options API
 * Handles all CRUD operations for flights, buses, and trains
 * 
 * Endpoints:
 * GET /backend/api/travel.php?action=search&from=city&to=city&date=YYYY-MM-DD&mode=flight
 * GET /backend/api/travel.php?action=get&id=booking_id
 * POST /backend/api/travel.php?action=create
 * PUT /backend/api/travel.php?action=update&id=booking_id
 * DELETE /backend/api/travel.php?action=delete&id=booking_id
 */

session_start();

// Set CORS headers
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

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['success' => true]));
}

require_once __DIR__ . '/../config/database.php';

class TravelBookingsAPI {
    private $pdo;
    private $conn;

    public function __construct() {
        try {
            $database = new Database();
            $this->pdo = $database->getConnection();
            $this->conn = $this->pdo;
        } catch (Exception $e) {
            $this->error('Database connection failed: ' . $e->getMessage(), 503);
        }
    }

    /**
     * Search for available travel options from database
     * GET ?action=search&from=city&to=city&date=YYYY-MM-DD&mode=flight|bus|train
     */
    public function search() {
        $from_city = $_GET['from'] ?? null;
        $to_city = $_GET['to'] ?? null;
        $travel_date = $_GET['date'] ?? null;
        $mode = $_GET['mode'] ?? null;

        if (!$from_city || !$to_city || !$travel_date) {
            return $this->error('Missing required parameters: from, to, date', 400);
        }

        try {
            // Validate date format
            $date_obj = DateTime::createFromFormat('Y-m-d', $travel_date);
            if (!$date_obj || $date_obj->format('Y-m-d') !== $travel_date) {
                return $this->error('Invalid date format. Use YYYY-MM-DD', 400);
            }

            // Build dynamic query - search from real database
            $query = "SELECT 
                id, mode, operator_name, vehicle_number, seat_class,
                from_city, to_city, travel_date, travel_time,
                cost, tax, total_amount, status, operator_id
            FROM travel_options
            WHERE LOWER(from_city) = LOWER(:from_city) 
                AND LOWER(to_city) = LOWER(:to_city) 
                AND DATE(travel_date) = :travel_date
                AND status IN ('confirmed', 'pending')";

            $params = [
                ':from_city' => $from_city,
                ':to_city' => $to_city,
                ':travel_date' => $travel_date
            ];

            if ($mode && $mode !== 'all') {
                $query .= " AND mode = :mode";
                $params[':mode'] = $mode;
            }

            $query .= " ORDER BY travel_time ASC LIMIT 100";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format results
            foreach ($results as &$result) {
                $result['cost'] = (float)$result['cost'];
                $result['tax'] = (float)$result['tax'];
                $result['total_amount'] = (float)$result['total_amount'];
            }

            if (empty($results)) {
                return $this->success([
                    'count' => 0,
                    'results' => [],
                    'message' => 'No travels available for this route on this date'
                ]);
            }

            return $this->success([
                'count' => count($results),
                'results' => $results,
                'route' => "$from_city → $to_city",
                'date' => $travel_date
            ]);

        } catch (Exception $e) {
            return $this->error('Search failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get single travel booking
     * GET ?action=get&id=booking_id
     */
    public function getBooking() {
        $id = $_GET['id'] ?? null;

        if (!$id) {
            return $this->error('Booking ID required', 400);
        }

        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM travel_options 
                WHERE id = :id
            ");
            $stmt->execute([':id' => $id]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$booking) {
                return $this->error('Booking not found', 404);
            }

            return $this->success($booking);

        } catch (Exception $e) {
            return $this->error('Failed to fetch booking: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create new travel booking
     * POST with JSON body
     */
    public function createBooking() {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        $required = ['user_id', 'mode', 'from_city', 'to_city', 'travel_date', 'travel_time', 
                     'operator_name', 'cost', 'passenger_name'];
        
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                return $this->error("Missing required field: $field", 400);
            }
        }

        try {
            // Calculate commission
            $commission_rate = $input['commission_rate'] ?? 0;
            $cost = (float)$input['cost'];
            $commission_amount = ($cost * $commission_rate) / 100;

            $query = "
                INSERT INTO travel_options (
                    user_id, booking_id, mode, type, from_city, to_city, 
                    travel_date, travel_time, operator_name, vehicle_number, 
                    seat_class, cost, tax, commission_rate, passenger_name, 
                    passenger_email, passenger_phone, status, payment_status
                ) VALUES (
                    :user_id, :booking_id, :mode, :type, :from_city, :to_city,
                    :travel_date, :travel_time, :operator_name, :vehicle_number,
                    :seat_class, :cost, :tax, :commission_rate, :passenger_name,
                    :passenger_email, :passenger_phone, :status, :payment_status
                )
            ";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':user_id' => $input['user_id'],
                ':booking_id' => $input['booking_id'] ?? null,
                ':mode' => $input['mode'],
                ':type' => $input['booking_id'] ? 'integrated' : 'standalone',
                ':from_city' => $input['from_city'],
                ':to_city' => $input['to_city'],
                ':travel_date' => $input['travel_date'],
                ':travel_time' => $input['travel_time'],
                ':operator_name' => $input['operator_name'],
                ':vehicle_number' => $input['vehicle_number'] ?? null,
                ':seat_class' => $input['seat_class'] ?? null,
                ':cost' => $cost,
                ':tax' => $input['tax'] ?? 0,
                ':commission_rate' => $commission_rate,
                ':passenger_name' => $input['passenger_name'],
                ':passenger_email' => $input['passenger_email'] ?? null,
                ':passenger_phone' => $input['passenger_phone'] ?? null,
                ':status' => 'pending',
                ':payment_status' => 'pending'
            ]);

            $booking_id = $this->pdo->lastInsertId();

            return $this->success([
                'id' => $booking_id,
                'message' => 'Travel booking created successfully',
                'booking' => [
                    'id' => $booking_id,
                    'status' => 'pending',
                    'total_amount' => $cost + ($input['tax'] ?? 0),
                    'commission_amount' => $commission_amount
                ]
            ], 201);

        } catch (Exception $e) {
            return $this->error('Failed to create booking: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update travel booking
     * PUT ?action=update&id=booking_id with JSON body
     */
    public function updateBooking() {
        $id = $_GET['id'] ?? null;

        if (!$id) {
            return $this->error('Booking ID required', 400);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        try {
            // Build dynamic update query
            $updates = [];
            $params = [':id' => $id];

            $allowed_fields = ['status', 'payment_status', 'seat_class', 'seat_numbers', 'notes'];

            foreach ($allowed_fields as $field) {
                if (isset($input[$field])) {
                    $updates[] = "$field = :$field";
                    $params[":$field"] = $input[$field];
                }
            }

            if (empty($updates)) {
                return $this->error('No fields to update', 400);
            }

            $query = "UPDATE travel_options SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);

            return $this->success([
                'id' => $id,
                'message' => 'Booking updated successfully'
            ]);

        } catch (Exception $e) {
            return $this->error('Failed to update booking: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete travel booking (soft delete by changing status)
     * DELETE ?action=delete&id=booking_id
     */
    public function deleteBooking() {
        $id = $_GET['id'] ?? null;

        if (!$id) {
            return $this->error('Booking ID required', 400);
        }

        try {
            // Soft delete by marking as cancelled
            $stmt = $this->pdo->prepare("
                UPDATE travel_options 
                SET status = 'cancelled' 
                WHERE id = :id
            ");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                return $this->error('Booking not found', 404);
            }

            return $this->success([
                'id' => $id,
                'message' => 'Booking cancelled successfully'
            ]);

        } catch (Exception $e) {
            return $this->error('Failed to delete booking: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get user's travel bookings
     * GET ?action=my-bookings&user_id=user_id
     */
    public function getUserBookings() {
        $user_id = $_GET['user_id'] ?? null;

        if (!$user_id) {
            return $this->error('User ID required', 400);
        }

        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM travel_options 
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 100
            ");
            $stmt->execute([':user_id' => $user_id]);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->success([
                'count' => count($bookings),
                'bookings' => $bookings
            ]);

        } catch (Exception $e) {
            return $this->error('Failed to fetch bookings: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get analytics/stats
     * GET ?action=stats&type=integrated|standalone|all
     */
    public function getStats() {
        $type = $_GET['type'] ?? 'all';

        try {
            $query = "SELECT 
                mode,
                COUNT(*) as total_bookings,
                SUM(cost) as total_revenue,
                SUM(commission_amount) as total_commission,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings
            FROM travel_options
            WHERE 1=1";

            $params = [];

            if ($type !== 'all') {
                $query .= " AND type = :type";
                $params[':type'] = $type;
            }

            $query .= " GROUP BY mode";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->success($stats);

        } catch (Exception $e) {
            return $this->error('Failed to fetch stats: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Response helpers
     */
    private function success($data, $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        exit;
    }

    private function error($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit;
    }
}

// Route requests
try {
    $api = new TravelBookingsAPI();
    $action = $_GET['action'] ?? 'search';

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            switch ($action) {
                case 'search':
                    $api->search();
                    break;
                case 'get':
                    $api->getBooking();
                    break;
                case 'my-bookings':
                    $api->getUserBookings();
                    break;
                case 'stats':
                    $api->getStats();
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Action not found']);
                    break;
            }
            break;

        case 'POST':
            if ($action === 'create') {
                $api->createBooking();
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid POST action']);
            }
            break;

        case 'PUT':
            if ($action === 'update') {
                $api->updateBooking();
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid PUT action']);
            }
            break;

        case 'DELETE':
            if ($action === 'delete') {
                $api->deleteBooking();
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid DELETE action']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
