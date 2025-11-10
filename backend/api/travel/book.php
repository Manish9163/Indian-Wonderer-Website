<?php
/**
 * Travel Booking API
 * Handles booking creation for travel options (flights, buses, trains)
 * 
 * POST /backend/api/travel/book.php
 */

session_start();

// Output buffering to prevent stray output from breaking JSON responses
ob_start();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../../lib/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// CORS headers
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
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

class TravelBookingAPI {
    private $db;
    
    public function __construct() {
        try {
            $database = new Database();
            $this->db = $database->getConnection();
        } catch (Exception $e) {
            $this->error('Database connection failed: ' . $e->getMessage(), 503);
        }
    }

    /**
     * Create a new travel booking
     */
    public function createBooking() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return $this->error('Only POST method allowed', 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            return $this->error('Invalid JSON input', 400);
        }

        // Validate required fields
        $required_fields = [
            'user_id',
            'travel_id',
            'from_city',
            'to_city',
            'travel_date',
            'mode',
            'operator_name',
            'cost',
            'tax',
            'selected_seats',
            'total_with_seats',
            'passengers'
        ];

        $missing_fields = [];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || (is_string($input[$field]) && trim($input[$field]) === '')) {
                $missing_fields[] = $field;
            }
        }

        if (!empty($missing_fields)) {
            return $this->error('Missing required fields: ' . implode(', ', $missing_fields), 400);
        }

        // Validate passengers array
        if (!is_array($input['passengers']) || empty($input['passengers'])) {
            return $this->error('At least one passenger is required', 400);
        }

        // Validate each passenger has required fields
        $passenger_fields = ['passenger_name', 'passenger_email', 'passenger_phone', 'seat_number'];
        foreach ($input['passengers'] as $idx => $passenger) {
            foreach ($passenger_fields as $field) {
                if (!isset($passenger[$field]) || trim($passenger[$field]) === '') {
                    return $this->error("Passenger " . ($idx + 1) . " is missing field: $field", 400);
                }
            }
        }
        
        // Verify seat count matches passenger count
        $seat_count = is_array($input['selected_seats']) ? count($input['selected_seats']) : 0;
        if (count($input['passengers']) !== $seat_count) {
            return $this->error('Number of passengers (' . count($input['passengers']) . ') must match number of seats (' . $seat_count . ')', 400);
        }

        try {
            // Start transaction
            $this->db->beginTransaction();

            // Generate booking reference
            $booking_reference = 'TB' . date('Ymd') . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT);

            // Insert booking record
            $booking_query = "
                INSERT INTO travel_bookings (
                    user_id,
                    travel_id,
                    mode,
                    from_city,
                    to_city,
                    travel_date,
                    operator_name,
                    vehicle_number,
                    seat_class,
                    base_cost,
                    tax_amount,
                    seat_charges,
                    total_amount,
                    passenger_name,
                    passenger_email,
                    passenger_phone,
                    selected_seats,
                    booking_status,
                    payment_status,
                    booking_reference,
                    created_at
                ) VALUES (
                    :user_id,
                    :travel_id,
                    :mode,
                    :from_city,
                    :to_city,
                    :travel_date,
                    :operator_name,
                    :vehicle_number,
                    :seat_class,
                    :base_cost,
                    :tax_amount,
                    :seat_charges,
                    :total_amount,
                    :passenger_name,
                    :passenger_email,
                    :passenger_phone,
                    :selected_seats,
                    :booking_status,
                    :payment_status,
                    :booking_reference,
                    :created_at
                )
            ";

            $stmt = $this->db->prepare($booking_query);
            
            // Calculate seat charges for multiple passengers
            // Formula: total = (cost + tax) * num_passengers + seat_charges
            // So: seat_charges = total - (cost * num_passengers) - (tax * num_passengers)
            $num_passengers = count($input['passengers']);
            $total_base_cost = $input['cost'] * $num_passengers;
            $total_tax = $input['tax'] * $num_passengers;
            $seat_charges = floatval($input['total_with_seats']) - $total_base_cost - $total_tax;
            
            // Get first passenger's info for the booking record
            $first_passenger = $input['passengers'][0] ?? [];
            
            $stmt->execute([
                ':user_id' => $input['user_id'],
                ':travel_id' => $input['travel_id'],
                ':mode' => $input['mode'],
                ':from_city' => $input['from_city'],
                ':to_city' => $input['to_city'],
                ':travel_date' => $input['travel_date'],
                ':operator_name' => $input['operator_name'],
                ':vehicle_number' => $input['vehicle_number'] ?? null,
                ':seat_class' => $input['seat_class'] ?? null,
                ':base_cost' => $total_base_cost,
                ':tax_amount' => $total_tax,
                ':seat_charges' => $seat_charges,
                ':total_amount' => $input['total_with_seats'],
                ':passenger_name' => $first_passenger['passenger_name'] ?? null,
                ':passenger_email' => $first_passenger['passenger_email'] ?? null,
                ':passenger_phone' => $first_passenger['passenger_phone'] ?? null,
                ':selected_seats' => is_array($input['selected_seats']) 
                    ? json_encode($input['selected_seats']) 
                    : $input['selected_seats'],
                ':booking_status' => 'pending',
                ':payment_status' => $input['payment_status'] ?? 'pending',
                ':booking_reference' => $booking_reference,
                ':created_at' => date('Y-m-d H:i:s')
            ]);

            $booking_id = $this->db->lastInsertId();

            // Insert passenger information
            $passenger_query = "
                INSERT INTO travel_passengers (
                    booking_id,
                    travel_id,
                    seat_number,
                    passenger_name,
                    passenger_email,
                    passenger_phone,
                    passenger_age,
                    passenger_gender,
                    id_type,
                    id_number
                ) VALUES (
                    :booking_id,
                    :travel_id,
                    :seat_number,
                    :passenger_name,
                    :passenger_email,
                    :passenger_phone,
                    :passenger_age,
                    :passenger_gender,
                    :id_type,
                    :id_number
                )
            ";

            $passenger_stmt = $this->db->prepare($passenger_query);
            
            foreach ($input['passengers'] as $passenger) {
                $passenger_stmt->execute([
                    ':booking_id' => $booking_id,
                    ':travel_id' => $input['travel_id'],
                    ':seat_number' => $passenger['seat_number'],
                    ':passenger_name' => $passenger['passenger_name'],
                    ':passenger_email' => $passenger['passenger_email'],
                    ':passenger_phone' => $passenger['passenger_phone'],
                    ':passenger_age' => $passenger['passenger_age'] ?? null,
                    ':passenger_gender' => $passenger['passenger_gender'] ?? null,
                    ':id_type' => $passenger['id_type'] ?? null,
                    ':id_number' => $passenger['id_number'] ?? null
                ]);
            }

            // Mark seats as booked
            if (!empty($input['selected_seats']) && $input['travel_id']) {
                $seats = is_array($input['selected_seats']) 
                    ? $input['selected_seats'] 
                    : json_decode($input['selected_seats'], true);

                if (is_array($seats)) {
                    foreach ($seats as $seat_no) {
                        $seat_update = "
                            UPDATE seats 
                            SET is_booked = 1, booking_id = :booking_id
                            WHERE travel_id = :travel_id AND seat_no = :seat_no
                        ";
                        
                        $seat_stmt = $this->db->prepare($seat_update);
                        $seat_stmt->execute([
                            ':booking_id' => $booking_id,
                            ':travel_id' => $input['travel_id'],
                            ':seat_no' => $seat_no
                        ]);
                    }
                }
            }

            // Commit transaction
            $this->db->commit();

            // Send confirmation email
            $this->sendBookingConfirmationEmail($input, $booking_id, $booking_reference);

            // Return success response
            return $this->success([
                'booking_id' => $booking_id,
                'booking_reference' => $booking_reference,
                'message' => 'Booking created successfully with ' . count($input['passengers']) . ' passenger(s)',
                'status' => 'pending',
                'total_amount' => $input['total_with_seats'],
                'passenger_count' => count($input['passengers'])
            ], 201);

        } catch (Exception $e) {
            // Rollback on error
            $this->db->rollBack();
            error_log('Booking creation error: ' . $e->getMessage());
            return $this->error('Failed to create booking: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get booking details
     */
    public function getBooking($booking_id) {
        if (!$booking_id) {
            return $this->error('Booking ID required', 400);
        }

        try {
            $query = "
                SELECT 
                    id,
                    user_id,
                    travel_id,
                    travel_mode,
                    from_city,
                    to_city,
                    travel_date,
                    operator_name,
                    base_cost,
                    tax_amount,
                    seat_charges,
                    total_amount,
                    selected_seats,
                    booking_status,
                    payment_status,
                    booking_reference,
                    created_at
                FROM travel_bookings
                WHERE id = :id
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute([':id' => $booking_id]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$booking) {
                return $this->error('Booking not found', 404);
            }

            // Decode selected_seats if it's JSON
            if (isset($booking['selected_seats']) && is_string($booking['selected_seats'])) {
                $decoded = json_decode($booking['selected_seats'], true);
                $booking['selected_seats'] = $decoded ?: $booking['selected_seats'];
            }

            return $this->success(['booking' => $booking]);

        } catch (Exception $e) {
            return $this->error('Failed to fetch booking: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get user's bookings
     */
    public function getUserBookings($user_id) {
        if (!$user_id) {
            return $this->error('User ID required', 400);
        }

        try {
            $query = "
                SELECT 
                    id,
                    travel_id,
                    travel_mode,
                    from_city,
                    to_city,
                    travel_date,
                    operator_name,
                    base_cost,
                    tax_amount,
                    seat_charges,
                    total_amount,
                    selected_seats,
                    booking_status,
                    payment_status,
                    booking_reference,
                    created_at
                FROM travel_bookings
                WHERE user_id = :user_id
                ORDER BY created_at DESC
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute([':user_id' => $user_id]);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode selected_seats for each booking
            foreach ($bookings as &$booking) {
                if (isset($booking['selected_seats']) && is_string($booking['selected_seats'])) {
                    $decoded = json_decode($booking['selected_seats'], true);
                    $booking['selected_seats'] = $decoded ?: $booking['selected_seats'];
                }
            }

            return $this->success(['bookings' => $bookings, 'count' => count($bookings)]);

        } catch (Exception $e) {
            return $this->error('Failed to fetch bookings: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Cancel booking
     */
    public function cancelBooking($booking_id) {
        if (!$booking_id) {
            return $this->error('Booking ID required', 400);
        }

        try {
            $this->db->beginTransaction();

            // Get booking details
            $stmt = $this->db->prepare("SELECT travel_id, selected_seats FROM travel_bookings WHERE id = :id");
            $stmt->execute([':id' => $booking_id]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$booking) {
                return $this->error('Booking not found', 404);
            }

            // Free up seats
            if ($booking['travel_id'] && $booking['selected_seats']) {
                $seats = json_decode($booking['selected_seats'], true);
                if (is_array($seats)) {
                    foreach ($seats as $seat_no) {
                        $seat_update = "
                            UPDATE seats 
                            SET is_booked = 0, booking_id = NULL
                            WHERE travel_id = :travel_id AND seat_no = :seat_no
                        ";
                        
                        $seat_stmt = $this->db->prepare($seat_update);
                        $seat_stmt->execute([
                            ':travel_id' => $booking['travel_id'],
                            ':seat_no' => $seat_no
                        ]);
                    }
                }
            }

            // Update booking status
            $update_query = "
                UPDATE travel_bookings 
                SET booking_status = 'cancelled', updated_at = NOW()
                WHERE id = :id
            ";

            $update_stmt = $this->db->prepare($update_query);
            $update_stmt->execute([':id' => $booking_id]);

            $this->db->commit();

            return $this->success(['message' => 'Booking cancelled successfully']);

        } catch (Exception $e) {
            $this->db->rollBack();
            return $this->error('Failed to cancel booking: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Response helpers
     */
    private function success($data, $code = 200) {
        ob_clean(); // Clear any buffered output before sending JSON
        http_response_code($code);
        echo json_encode(['success' => true, 'data' => $data]);
        exit;
    }

    private function error($message, $code = 400) {
        ob_clean(); // Clear any buffered output before sending JSON
        http_response_code($code);
        echo json_encode(['success' => false, 'error' => $message]);
        exit;
    }

    /**
     * Send booking confirmation email using PHPMailer
     */
    private function sendBookingConfirmationEmail($booking_data, $booking_id, $booking_reference) {
        try {
            // Query the database to get the payment status
            $payment_query = "SELECT payment_status, booking_status FROM travel_bookings WHERE id = ?";
            $stmt = $this->db->prepare($payment_query);
            $stmt->execute([$booking_id]);
            $booking_status_info = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $payment_status = $booking_status_info['payment_status'] ?? 'pending';
            
            // Get first passenger email
            $passenger_email = $booking_data['passengers'][0]['passenger_email'] ?? ($booking_data['passenger_email'] ?? null);
            
            if (!$passenger_email) {
                error_log('No email address provided for booking confirmation');
                return false;
            }

            // Get passenger details
            $passengers_info = '';
            if (!empty($booking_data['passengers'])) {
                $passengers_info = '<tr><td colspan="2"><strong>Passengers Traveling:</strong></td></tr>';
                foreach ($booking_data['passengers'] as $idx => $passenger) {
                    $passengers_info .= '
                    <tr>
                        <td>Passenger ' . ($idx + 1) . ':</td>
                        <td>' . htmlspecialchars($passenger['passenger_name']) . ' - Seat: ' . htmlspecialchars($passenger['seat_number']) . '</td>
                    </tr>';
                }
            }

            // Calculate amounts - properly handle multiple passengers
            $base_fare_per_person = floatval($booking_data['cost']);
            $tax_per_person = floatval($booking_data['tax']);
            $num_passengers = count($booking_data['passengers'] ?? []);
            
            // Calculate totals
            // Base Fare = cost × num_passengers (WITHOUT tax)
            // Tax Amount = tax × num_passengers
            // Seat Charges = remaining amount (actual seat prices)
            $total_base_fare = $base_fare_per_person * $num_passengers;
            $total_tax = $tax_per_person * $num_passengers;
            $seat_charges = floatval($booking_data['total_with_seats']) - $total_base_fare - $total_tax;
            $total_amount = floatval($booking_data['total_with_seats']);

            // Prepare email content
            $email_subject = "✈️ Travel Booking Confirmation - Reference: {$booking_reference}";
            
            $email_body = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
                    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                    .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
                    .content { padding: 40px 20px; }
                    .confirmation-box { background: #f0f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
                    .confirmation-box h2 { margin: 0 0 15px 0; color: #1e3a8a; font-size: 18px; }
                    .section-title { color: #333; font-size: 16px; font-weight: 600; margin: 25px 0 15px 0; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
                    .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .info-table tr { border-bottom: 1px solid #eee; }
                    .info-table td { padding: 12px 0; }
                    .info-table td:first-child { font-weight: 600; color: #555; width: 40%; }
                    .info-table td:last-child { color: #333; }
                    .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
                    .price-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .price-table tr { border-bottom: 1px solid #e5e7eb; }
                    .price-table td { padding: 12px 0; }
                    .price-table .label { font-weight: 500; color: #555; }
                    .price-table .amount { text-align: right; color: #333; }
                    .price-table .total-row { background: #f3f4f6; font-weight: 600; border-top: 2px solid #667eea; }
                    .price-table .total-row .amount { color: #667eea; font-size: 18px; }
                    .status-badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
                    .footer a { color: #667eea; text-decoration: none; }
                    .important { color: #d97706; font-weight: 600; }
                    .success-icon { font-size: 48px; }
                </style>
            </head>
            <body>
                <div class='email-container'>
                    <div class='header'>
                        <div class='success-icon'>✅</div>
                        <h1>Booking Confirmed!</h1>
                        <p>Your travel seats have been reserved successfully</p>
                    </div>

                    <div class='content'>
                        <div class='confirmation-box'>
                            <h2>🎉 Thank You for Your Booking!</h2>
                            <p>Your seats have been secured! Please save your booking reference for future communication.</p>
                            <p style='margin: 15px 0; font-size: 16px;'>
                                <strong>Booking Reference:</strong> <span class='highlight'>" . htmlspecialchars($booking_reference) . "</span>
                            </p>
                            <p style='margin: 10px 0; font-size: 14px; color: #666;'>
                                Booking ID: #" . htmlspecialchars($booking_id) . "
                            </p>
                            <p style='margin: 15px 0; text-align: center;'>
                                <a href='http://localhost/fu/backend/api/travel/download_eticket.php?ref=" . htmlspecialchars($booking_reference) . "' style='display: inline-block; background: #667eea; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; font-weight: 600;'>📥 Download E-Ticket</a>
                            </p>
                        </div>

                        <div class='section-title'>✈️ Travel Details</div>
                        <table class='info-table'>
                            <tr>
                                <td>From:</td>
                                <td>" . htmlspecialchars($booking_data['from_city']) . "</td>
                            </tr>
                            <tr>
                                <td>To:</td>
                                <td>" . htmlspecialchars($booking_data['to_city']) . "</td>
                            </tr>
                            <tr>
                                <td>Travel Date:</td>
                                <td>" . date('F j, Y', strtotime($booking_data['travel_date'])) . "</td>
                            </tr>
                            <tr>
                                <td>Mode:</td>
                                <td>
                                    " . ($booking_data['mode'] === 'flight' ? '✈️ Flight' : ($booking_data['mode'] === 'bus' ? '🚌 Bus' : '🚂 Train')) . "
                                </td>
                            </tr>
                            <tr>
                                <td>Operator:</td>
                                <td>" . htmlspecialchars($booking_data['operator_name']) . "</td>
                            </tr>
                            <tr>
                                <td>Seats Reserved:</td>
                                <td>" . htmlspecialchars(implode(', ', $booking_data['selected_seats'])) . "</td>
                            </tr>
                            <tr>
                                <td>Total Passengers:</td>
                                <td>" . count($booking_data['passengers']) . "</td>
                            </tr>
                        </table>

                        <div class='section-title'>👥 Passenger Information</div>
                        <table class='info-table'>
                            " . $passengers_info . "
                        </table>

                        <div class='section-title'>💰 Payment Summary</div>
                        <table class='price-table'>
                            <tr>
                                <td class='label'>Base Fare (" . $num_passengers . " pax):</td>
                                <td class='amount'>₹" . number_format($total_base_fare, 2) . "</td>
                            </tr>
                            <tr>
                                <td class='label'>Tax Amount:</td>
                                <td class='amount'>₹" . number_format($total_tax, 2) . "</td>
                            </tr>
                            <tr>
                                <td class='label'>Seat Charges (" . count($booking_data['selected_seats']) . " seats):</td>
                                <td class='amount'>₹" . number_format($seat_charges, 2) . "</td>
                            </tr>
                            <tr class='total-row'>
                                <td class='label'>Total Amount Payable:</td>
                                <td class='amount'>₹" . number_format($total_amount, 2) . "</td>
                            </tr>
                        </table>

                        <div class='confirmation-box'>
                            <h2 style='margin-top: 0;'>📋 Booking Status</h2>
                            <p>Your booking is confirmed: <span class='status-badge' style='background: #dcfce7; color: #15803d;'>✓ CONFIRMED & PAID</span></p>
                            <p style='color: #15803d; font-size: 14px; margin: 10px 0; font-weight: 600;'>🎉 Payment confirmed! Your booking is completely secure.</p>
                            <p style='color: #666; font-size: 14px; margin: 0;'>Your e-ticket has been generated. Please check your email and save the booking reference for check-in.</p>
                        </div>

                        <div class='section-title'>📱 What's Next?</div>
                        <table class='info-table'>
                            <tr>
                                <td>1️⃣ Download E-Ticket</td>
                                <td>Your e-ticket is attached. Keep it safe for check-in</td>
                            </tr>
                            <tr>
                                <td>2️⃣ Prepare Documents</td>
                                <td>Carry valid ID as per travel regulations</td>
                            </tr>
                            <tr>
                                <td>3️⃣ Arrive Early</td>
                                <td>Arrive 15-30 minutes early for check-in on travel date</td>
                            </tr>
                        </table>

                        <div class='section-title'>❓ Need Help?</div>
                        <table class='info-table'>
                            <tr>
                                <td>📞 Phone:</td>
                                <td><a href='tel:+919876543210' style='color: #667eea; text-decoration: none;'>+91-9876-543-210</a></td>
                            </tr>
                            <tr>
                                <td>💬 WhatsApp:</td>
                                <td><a href='https://wa.me/919876543210' style='color: #667eea; text-decoration: none;'>Available 24/7</a></td>
                            </tr>
                            <tr>
                                <td>✉️ Email:</td>
                                <td><a href='mailto:support@indianwonderer.com' style='color: #667eea; text-decoration: none;'>support@indianwonderer.com</a></td>
                            </tr>
                            <tr>
                                <td>💬 LiveChat:</td>
                                <td>Available on our website</td>
                            </tr>
                        </table>

                        <div style='text-align: center; margin: 30px 0;'>
                            <p style='color: #666; font-size: 13px; margin: 0;'>
                                <strong class='important'>Important:</strong> Your booking is confirmed. We look forward to serving you!
                            </p>
                        </div>
                    </div>

                    <div class='footer'>
                        <p style='margin: 0 0 10px 0;'>© 2025 Indian Wonderer - Your Journey, Our Passion</p>
                        <p style='margin: 0;'>
                            <a href='https://indianwonderer.com'>Visit Website</a> | 
                            <a href='https://indianwonderer.com/bookings'>My Bookings</a> | 
                            <a href='https://indianwonderer.com/support'>Support</a>
                        </p>
                        <p style='margin: 10px 0 0 0; color: #999; font-size: 11px;'>
                            This is an automated email. Please do not reply to this address.
                        </p>
                    </div>
                </div>
            </body>
            </html>";

            // Generate E-Ticket PDF
            $pdfFilePath = null;
            try {
                $pdfServicePath = __DIR__ . '/../../../services/ETicketPDFServiceStyled.php';
                if (file_exists($pdfServicePath)) {
                    require_once $pdfServicePath;
                    $pdfFilePath = ETicketPDFServiceStyled::generateETicket($booking_data, $booking_data['passengers'], $booking_reference);
                } else {
                    error_log("⚠️ PDF Service not found at: {$pdfServicePath}");
                }
            } catch (Exception $pdfError) {
                error_log("⚠️ PDF Generation Warning: " . $pdfError->getMessage());
                // Continue with email even if PDF fails
            }

            // Send email using PHPMailer
            $first_passenger = $booking_data['passengers'][0];
            $config = require __DIR__ . '/../../config/email_config.php';
            
            $mail = new PHPMailer(true);
            
            try {
                // SMTP configuration
                $mail->SMTPDebug = 0;
                $mail->Mailer = 'smtp';
                $mail->Host = $config['smtp_host'];
                $mail->SMTPAuth = $config['smtp_auth'];
                $mail->Username = $config['smtp_username'];
                $mail->Password = $config['smtp_password'];
                $mail->SMTPSecure = $config['smtp_secure'];
                $mail->Port = $config['smtp_port'];
                $mail->Timeout = $config['timeout'];
                $mail->CharSet = 'UTF-8';

                // Set sender and recipient
                $mail->setFrom($config['from_email'], $config['from_name']);
                $mail->addAddress($passenger_email, $first_passenger['passenger_name']);
                $mail->addReplyTo($config['reply_to'], $config['from_name']);

                // Email content
                $mail->isHTML(true);
                $mail->Subject = $email_subject;
                $mail->Body = $email_body;
                $mail->AltBody = strip_tags($email_body);

                // Attach E-Ticket if generated successfully
                error_log("📋 PDF Path: " . ($pdfFilePath ? $pdfFilePath : "NULL"));
                error_log("📋 PDF Exists: " . ($pdfFilePath && file_exists($pdfFilePath) ? "YES" : "NO"));
                
                $attachmentName = null;
                if ($pdfFilePath && file_exists($pdfFilePath)) {
                    $fileExtension = pathinfo($pdfFilePath, PATHINFO_EXTENSION);
                    $attachmentName = 'eticket_' . $booking_reference . '.' . $fileExtension;
                    error_log("📎 Attempting to attach: {$attachmentName} from {$pdfFilePath}");
                    
                    try {
                        $mail->addAttachment($pdfFilePath, $attachmentName);
                        error_log("✅ E-Ticket successfully added to attachment: {$attachmentName}");
                    } catch (Exception $attachError) {
                        error_log("❌ Attachment Error: " . $attachError->getMessage());
                    }
                } else {
                    error_log("⚠️  No PDF to attach - pdfFilePath: " . var_export($pdfFilePath, true));
                }

                // Send email
                error_log("📧 Preparing to send email to: {$passenger_email}");
                $email_sent = $mail->send();

                if ($email_sent) {
                    error_log("✅✅✅ Booking confirmation email SENT to {$passenger_email} for booking {$booking_reference}");
                    if ($attachmentName) {
                        error_log("✅ Email included attachment: {$attachmentName}");
                    }
                    return true;
                } else {
                    error_log("❌ Failed to send booking confirmation email to {$passenger_email}");
                    error_log("❌ PHPMailer Error: " . $mail->ErrorInfo);
                    return false;
                }

            } catch (Exception $e) {
                error_log("❌ PHPMailer Error: " . $mail->ErrorInfo);
                error_log("Exception: " . $e->getMessage());
                return false;
            }

        } catch (Exception $e) {
            error_log('Email initialization error: ' . $e->getMessage());
            return false;
        }
    }
}

// Handle requests
try {
    $api = new TravelBookingAPI();
    $action = $_GET['action'] ?? 'create';
    $user_id = $_GET['user_id'] ?? null;
    $booking_id = $_GET['booking_id'] ?? null;

    switch ($action) {
        case 'create':
            $api->createBooking();
            break;
        case 'get':
            $api->getBooking($booking_id);
            break;
        case 'list':
            $api->getUserBookings($user_id);
            break;
        case 'cancel':
            $api->cancelBooking($booking_id);
            break;
        default:
            $api->createBooking();
    }
} catch (Exception $e) {
    ob_clean(); // Clear any buffered output before sending JSON
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
