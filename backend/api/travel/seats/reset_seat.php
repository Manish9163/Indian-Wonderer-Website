<?php
/**
 * Reset Seat API (Admin)
 * Resets booked seats back to available state
 * 
 * POST /backend/api/travel/seats/reset_seat.php
 * Body: {
 *   travel_id: int,
 *   seat_numbers: [array],
 *   admin_id: int
 * }
 */

session_start();

// Set CORS headers
$allowed_origins = [
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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['success' => true]));
}

require_once __DIR__ . '/../../../config/database.php';

class ResetSeatAPI {
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
     * Reset seat(s) to available state
     */
    public function resetSeats() {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        if (!isset($input['travel_id']) || !isset($input['admin_id'])) {
            return $this->error('travel_id and admin_id are required', 400);
        }

        $travel_id = $input['travel_id'];
        $seat_numbers = $input['seat_numbers'] ?? null;
        $admin_id = $input['admin_id'];

        try {
            $this->pdo->beginTransaction();

            if ($seat_numbers && is_array($seat_numbers)) {
                // Reset specific seats
                $reset_count = 0;
                foreach ($seat_numbers as $seat_no) {
                    $stmt = $this->pdo->prepare("
                        UPDATE travel_seats
                        SET is_booked = FALSE, booked_by = NULL, booking_id = NULL
                        WHERE travel_id = :travel_id AND seat_no = :seat_no
                    ");
                    $stmt->execute([
                        ':travel_id' => $travel_id,
                        ':seat_no' => $seat_no
                    ]);
                    $reset_count += $stmt->rowCount();
                }

                $this->pdo->commit();

                return $this->success([
                    'message' => "$reset_count seat(s) reset successfully",
                    'reset_count' => $reset_count,
                    'travel_id' => $travel_id
                ]);
            } else {
                // Reset all seats for this travel (full reset)
                $stmt = $this->pdo->prepare("
                    UPDATE travel_seats
                    SET is_booked = FALSE, booked_by = NULL, booking_id = NULL
                    WHERE travel_id = :travel_id
                ");
                $stmt->execute([':travel_id' => $travel_id]);
                $reset_count = $stmt->rowCount();

                $this->pdo->commit();

                return $this->success([
                    'message' => "All $reset_count seat(s) for travel have been reset",
                    'reset_count' => $reset_count,
                    'travel_id' => $travel_id
                ]);
            }

        } catch (Exception $e) {
            $this->pdo->rollBack();
            return $this->error('Failed to reset seats: ' . $e->getMessage(), 500);
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

// Handle request
try {
    $api = new ResetSeatAPI();
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $api->resetSeats();
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
