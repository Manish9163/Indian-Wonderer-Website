<?php
/**
 * Travel Booking Payment API
 * Handles payment processing for travel bookings
 * Integrates with existing Indian Wonderer wallet and payment system
 */

session_start();

// CORS Headers
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
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['success' => true]));
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/api_config.php';

class TravelPaymentAPI {
    private $pdo;
    private $user_id;

    public function __construct() {
        try {
            $database = new Database();
            $this->pdo = $database->getConnection();
            
            // Get user from session or token
            $this->user_id = $_SESSION['user_id'] ?? null;
            if (!$this->user_id) {
                $headers = getallheaders();
                $auth_header = $headers['Authorization'] ?? '';
                if (preg_match('/Bearer\s+(\d+)/', $auth_header, $matches)) {
                    $this->user_id = intval($matches[1]);
                }
            }
        } catch (Exception $e) {
            $this->error('Database connection failed', 503);
        }
    }

    /**
     * Process travel booking payment
     */
    public function processPayment() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return $this->error('Method not allowed', 405);
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$this->user_id) {
            return $this->error('Authentication required', 401);
        }

        // Validate required fields
        $required_fields = ['travel_id', 'seats', 'amount', 'payment_method'];
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                return $this->error("Missing required field: $field", 400);
            }
        }

        $travel_id = intval($data['travel_id']);
        $seats = is_array($data['seats']) ? $data['seats'] : [$data['seats']];
        $total_amount = floatval($data['amount']);
        $payment_method = $data['payment_method']; // 'wallet', 'card', 'upi'
        $reference_id = $data['reference_id'] ?? null;

        try {
            $this->pdo->beginTransaction();

            // Verify travel exists
            $travel_query = "SELECT * FROM travel_options WHERE id = ?";
            $travel_stmt = $this->pdo->prepare($travel_query);
            $travel_stmt->execute([$travel_id]);
            $travel = $travel_stmt->fetch(PDO::FETCH_ASSOC);

            if (!$travel) {
                throw new Exception('Travel option not found');
            }

            // Verify all seats are available
            $placeholders = implode(',', array_fill(0, count($seats), '?'));
            $seat_query = "SELECT * FROM travel_seats WHERE travel_id = ? AND id IN ($placeholders) AND is_booked = 0";
            $params = array_merge([$travel_id], $seats);
            $seat_stmt = $this->pdo->prepare($seat_query);
            $seat_stmt->execute($params);
            $available_seats = $seat_stmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($available_seats) !== count($seats)) {
                throw new Exception('Some seats are no longer available');
            }

            // Create payment record
            $payment_query = "INSERT INTO payments (user_id, amount, payment_method, reference_id, status, created_at) 
                             VALUES (?, ?, ?, ?, 'completed', NOW())";
            $payment_stmt = $this->pdo->prepare($payment_query);
            $payment_stmt->execute([$this->user_id, $total_amount, $payment_method, $reference_id]);
            $payment_id = $this->pdo->lastInsertId();

            // Create travel booking
            $booking_id = 'TRAVEL' . $travel_id . 'USR' . $this->user_id . 'PAY' . $payment_id;
            $booking_query = "INSERT INTO travel_options (user_id, booking_id, mode, type, operator_id, from_city, to_city, 
                             travel_date, travel_time, operator_name, seat_class, cost, tax, commission_rate, total_amount, status)
                             SELECT user_id, ?, mode, type, operator_id, from_city, to_city, travel_date, travel_time, 
                             operator_name, seat_class, cost, tax, commission_rate, total_amount, 'confirmed'
                             FROM travel_options WHERE id = ?";
            $booking_stmt = $this->pdo->prepare($booking_query);
            $booking_stmt->execute([$booking_id, $travel_id]);

            // Book all seats
            $book_seat_query = "UPDATE travel_seats SET is_booked = 1, booked_by = ?, booking_id = ? WHERE id = ? AND travel_id = ?";
            $book_seat_stmt = $this->pdo->prepare($book_seat_query);

            foreach ($seats as $seat_id) {
                $book_seat_stmt->execute([$this->user_id, $booking_id, $seat_id, $travel_id]);
            }

            // Update wallet (deduct amount)
            if ($payment_method === 'wallet') {
                $wallet_query = "UPDATE wallet SET balance = balance - ? WHERE user_id = ? AND balance >= ?";
                $wallet_stmt = $this->pdo->prepare($wallet_query);
                if (!$wallet_stmt->execute([$total_amount, $this->user_id, $total_amount])) {
                    throw new Exception('Insufficient wallet balance');
                }

                // Create wallet transaction record
                $wallet_trans_query = "INSERT INTO wallet_transactions (user_id, type, amount, description, status, created_at)
                                      VALUES (?, 'debit', ?, ?, 'completed', NOW())";
                $wallet_trans_stmt = $this->pdo->prepare($wallet_trans_query);
                $wallet_trans_stmt->execute([$this->user_id, $total_amount, "Travel booking: $booking_id"]);
            }

            $this->pdo->commit();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Payment processed successfully',
                'data' => [
                    'payment_id' => $payment_id,
                    'booking_id' => $booking_id,
                    'amount' => $total_amount,
                    'status' => 'completed',
                    'seats_booked' => count($seats),
                    'travel_date' => $travel['travel_date'],
                    'operator_name' => $travel['operator_name']
                ]
            ]);

        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Get booking details
     */
    public function getBooking() {
        $booking_id = $_GET['booking_id'] ?? null;

        if (!$booking_id) {
            return $this->error('booking_id parameter required', 400);
        }

        if (!$this->user_id) {
            return $this->error('Authentication required', 401);
        }

        try {
            $query = "SELECT tb.*, ts.seat_no, ts.price, ts.seat_type 
                     FROM travel_options tb
                     LEFT JOIN travel_seats ts ON tb.id = ts.travel_id
                     WHERE tb.booking_id = ? AND tb.user_id = ?";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$booking_id, $this->user_id]);
            $booking = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($booking)) {
                return $this->error('Booking not found', 404);
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'booking_id' => $booking[0]['booking_id'],
                    'travel_date' => $booking[0]['travel_date'],
                    'travel_time' => $booking[0]['travel_time'],
                    'operator_name' => $booking[0]['operator_name'],
                    'from_city' => $booking[0]['from_city'],
                    'to_city' => $booking[0]['to_city'],
                    'mode' => $booking[0]['mode'],
                    'total_amount' => $booking[0]['total_amount'],
                    'status' => $booking[0]['status'],
                    'seats' => array_map(function($b) {
                        return [
                            'seat_no' => $b['seat_no'],
                            'seat_type' => $b['seat_type'],
                            'price' => $b['price']
                        ];
                    }, $booking),
                    'booking_date' => $booking[0]['created_at'] ?? date('Y-m-d H:i:s')
                ]
            ]);

        } catch (Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get user's travel bookings
     */
    public function getUserBookings() {
        if (!$this->user_id) {
            return $this->error('Authentication required', 401);
        }

        try {
            $query = "SELECT DISTINCT 
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
                        COUNT(DISTINCT ts.id) as seats_booked
                     FROM travel_options to
                     LEFT JOIN travel_seats ts ON to.id = ts.travel_id AND ts.booked_by = ?
                     WHERE to.user_id = ?
                     GROUP BY to.id
                     ORDER BY to.travel_date DESC";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$this->user_id, $this->user_id]);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'bookings' => $bookings,
                    'total' => count($bookings)
                ]
            ]);

        } catch (Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Cancel booking (with refund)
     */
    public function cancelBooking() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return $this->error('Method not allowed', 405);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $booking_id = $data['booking_id'] ?? null;

        if (!$booking_id) {
            return $this->error('booking_id required', 400);
        }

        if (!$this->user_id) {
            return $this->error('Authentication required', 401);
        }

        try {
            $this->pdo->beginTransaction();

            // Get booking details
            $query = "SELECT * FROM travel_options WHERE booking_id = ? AND user_id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$booking_id, $this->user_id]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$booking) {
                throw new Exception('Booking not found');
            }

            if ($booking['status'] === 'cancelled') {
                throw new Exception('Booking is already cancelled');
            }

            // Update booking status
            $cancel_query = "UPDATE travel_options SET status = 'cancelled', updated_at = NOW() WHERE booking_id = ?";
            $cancel_stmt = $this->pdo->prepare($cancel_query);
            $cancel_stmt->execute([$booking_id]);

            // Release seats
            $release_query = "UPDATE travel_seats SET is_booked = 0, booked_by = NULL WHERE booking_id = ?";
            $release_stmt = $this->pdo->prepare($release_query);
            $release_stmt->execute([$booking_id]);

            // Process refund (90% refund policy)
            $refund_amount = $booking['total_amount'] * 0.9;
            $refund_query = "UPDATE wallet SET balance = balance + ? WHERE user_id = ?";
            $refund_stmt = $this->pdo->prepare($refund_query);
            $refund_stmt->execute([$refund_amount, $this->user_id]);

            // Record refund transaction
            $refund_trans_query = "INSERT INTO wallet_transactions (user_id, type, amount, description, status, created_at)
                                  VALUES (?, 'credit', ?, ?, 'completed', NOW())";
            $refund_trans_stmt = $this->pdo->prepare($refund_trans_query);
            $refund_trans_stmt->execute([$this->user_id, $refund_amount, "Refund for cancelled booking: $booking_id"]);

            $this->pdo->commit();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Booking cancelled successfully',
                'data' => [
                    'booking_id' => $booking_id,
                    'refund_amount' => $refund_amount,
                    'refund_percentage' => 90,
                    'status' => 'cancelled'
                ]
            ]);

        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->error($e->getMessage(), 400);
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
$action = $_GET['action'] ?? 'process';

$api = new TravelPaymentAPI();

switch ($action) {
    case 'process':
        $api->processPayment();
        break;
    case 'get-booking':
        $api->getBooking();
        break;
    case 'get-bookings':
        $api->getUserBookings();
        break;
    case 'cancel':
        $api->cancelBooking();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}
?>
