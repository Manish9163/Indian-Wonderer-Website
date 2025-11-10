<?php
/**
 * Book Seat API
 * Reserves seat(s) for a user
 * 
 * POST /backend/api/travel/seats/book_seat.php
 * Body: {
 *   travel_id: int,
 *   booking_id: int,
 *   user_id: int,
 *   seat_numbers: [array of seat numbers like ['1A', '1B']],
 *   total_price: float
 * }
 */

session_start();

// Set CORS headers
$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
}

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['success' => true]));
}

require_once __DIR__ . '/../../../config/database.php';

class BookSeatAPI {
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
     * Book one or multiple seats
     */
    public function bookSeats() {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        $required = ['travel_id', 'booking_id', 'user_id', 'seat_numbers'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                return $this->error("Missing required field: $field", 400);
            }
        }

        $travel_id = $input['travel_id'];
        $booking_id = $input['booking_id'];
        $user_id = $input['user_id'];
        $seat_numbers = $input['seat_numbers'];
        $total_price = $input['total_price'] ?? 0;

        if (!is_array($seat_numbers) || empty($seat_numbers)) {
            return $this->error('seat_numbers must be a non-empty array', 400);
        }

        try {
            $this->pdo->beginTransaction();

            $booked_seats = [];
            $failed_seats = [];

            foreach ($seat_numbers as $seat_no) {
                // Check if seat exists and is available
                $checkStmt = $this->pdo->prepare("
                    SELECT id, is_booked, price FROM travel_seats
                    WHERE travel_id = :travel_id AND seat_no = :seat_no
                    FOR UPDATE
                ");
                $checkStmt->execute([
                    ':travel_id' => $travel_id,
                    ':seat_no' => $seat_no
                ]);
                $seat = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$seat) {
                    $failed_seats[] = ['seat_no' => $seat_no, 'reason' => 'Seat not found'];
                    continue;
                }

                if ($seat['is_booked']) {
                    $failed_seats[] = ['seat_no' => $seat_no, 'reason' => 'Seat already booked'];
                    continue;
                }

                // Book the seat
                $bookStmt = $this->pdo->prepare("
                    UPDATE travel_seats
                    SET is_booked = TRUE, booked_by = :user_id, booking_id = :booking_id
                    WHERE id = :id
                ");
                $bookStmt->execute([
                    ':user_id' => $user_id,
                    ':booking_id' => $booking_id,
                    ':id' => $seat['id']
                ]);

                $booked_seats[] = [
                    'seat_no' => $seat_no,
                    'price' => $seat['price'],
                    'status' => 'booked'
                ];
            }

            // Update travel_options with selected seats
            $selectedSeats = json_encode(array_column($booked_seats, 'seat_no'));
            $updateStmt = $this->pdo->prepare("
                UPDATE travel_options
                SET selected_seats = :seats
                WHERE id = :booking_id
            ");
            $updateStmt->execute([
                ':seats' => $selectedSeats,
                ':booking_id' => $booking_id
            ]);

            $this->pdo->commit();

            if (empty($booked_seats)) {
                return $this->error('No seats could be booked', 400);
            }

            return $this->success([
                'message' => count($booked_seats) . ' seat(s) booked successfully',
                'booked_seats' => $booked_seats,
                'failed_seats' => $failed_seats,
                'total_booked' => count($booked_seats),
                'total_failed' => count($failed_seats),
                'total_price' => $total_price
            ], 201);

        } catch (Exception $e) {
            $this->pdo->rollBack();
            return $this->error('Failed to book seats: ' . $e->getMessage(), 500);
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
    $api = new BookSeatAPI();
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $api->bookSeats();
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
