<?php
session_start();

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
    header('Access-Control-Allow-Origin: http://localhost:3001');
}

header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../config/api_config.php';

function validateUserToken($token) {
    if (!$token) return null;
    
    $decoded = JWTHelper::verify($token);
    
    if (!$decoded) {
        return null;
    }
    
    return $decoded['user_id'] ?? null;
}

$database = new Database();
$conn = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$booking_id = $_GET['id'] ?? $_GET['booking_id'] ?? null;

$requiresAuth = in_array($action, ['admin_list', 'admin_update', 'admin_delete']);

if ($requiresAuth) {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit;
    }
} else {
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
    
    $isUserAuthenticated = false;
    $userId = null;
    
    if (isset($_SESSION['user_id'])) {
        $isUserAuthenticated = true;
        $userId = $_SESSION['user_id'];
    } elseif ($token) {
        $validatedUserId = validateUserToken($token);
        if ($validatedUserId) {
            $isUserAuthenticated = true;
            $userId = $validatedUserId;
        }
    }
    
    if (!$isUserAuthenticated && $method !== 'GET') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authorization required. Please log in.']);
        exit;
    }
    
    if ($method === 'GET' && !$booking_id && !$isUserAuthenticated) {
        echo json_encode(['success' => true, 'data' => ['bookings' => []]]);
        exit;
    }
}

try {
    switch ($method) {
        case 'GET':
            if ($booking_id) {
                getBooking($conn, $booking_id);
            } else {
                getAllBookings($conn);
            }
            break;
            
        case 'POST':
            if ($action === 'cancel') {
                if (!$booking_id) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Booking ID is required']);
                    exit;
                }
                cancelBooking($conn, $booking_id);
            } elseif ($action === 'confirm') {
                confirmBooking($conn, $booking_id);
            } else {
                createBooking($conn);
            }
            break;
            
        case 'PUT':
            if ($action === 'edit') {
                if (!$booking_id) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Booking ID is required']);
                    exit;
                }
                editBooking($conn, $booking_id);
            } else {
                updateBooking($conn, $booking_id);
            }
            break;
            
        case 'DELETE':
            deleteBooking($conn, $booking_id);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

function getAllBookings($conn) {
    $userId = null;
    
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
    } else {
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        if ($token) {
            $userId = validateUserToken($token);
        }
    }
    
    $query = "SELECT b.*, 
                     t.id as tour_id, t.title as tour_title, t.destination, 
                     t.price as tour_price, t.duration_days, t.category, 
                     t.description, t.image_url,
                     u.first_name, u.last_name, u.email,
                     gu.first_name as guide_first_name, gu.last_name as guide_last_name,
                     gu.email as guide_email, gu.phone as guide_phone,
                     g.specialization as guide_specialization, g.rating as guide_rating,
                     tga.status as assignment_status, tga.assignment_date,
                     p.status as payment_status, p.amount as payment_amount,
                     r.id as refund_id, r.amount as refund_amount, r.status as refund_status,
                     r.method as refund_method, r.initiated_at as refund_initiated_at,
                     gc.code as giftcard_code, gc.amount as giftcard_amount, 
                     gc.balance as giftcard_balance, gc.status as giftcard_status,
                     gc.expiry_date as giftcard_expiry
              FROM bookings b 
              LEFT JOIN tours t ON b.tour_id = t.id
              LEFT JOIN users u ON b.user_id = u.id
              LEFT JOIN tour_guide_assignments tga ON b.id = tga.booking_id
              LEFT JOIN guides g ON tga.guide_id = g.id
              LEFT JOIN users gu ON g.user_id = gu.id
              LEFT JOIN payments p ON b.id = p.booking_id
              LEFT JOIN refunds r ON b.id = r.booking_id
              LEFT JOIN gift_cards gc ON b.user_id = gc.user_id AND gc.created_at >= b.updated_at";
    
    if ($userId) {
        $query .= " WHERE b.user_id = :user_id";
    }
    
    $query .= " ORDER BY b.created_at DESC";
    
    $stmt = $conn->prepare($query);
    
    if ($userId) {
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    }
    
    $stmt->execute();
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($bookings as &$booking) {
        if ($booking['traveler_details']) {
            $booking['traveler_details'] = json_decode($booking['traveler_details'], true);
        }
        
        if ($booking['guide_first_name']) {
            $booking['guide_info'] = [
                'name' => $booking['guide_first_name'] . ' ' . $booking['guide_last_name'],
                'email' => $booking['guide_email'],
                'phone' => $booking['guide_phone'],
                'specialization' => $booking['guide_specialization'],
                'rating' => $booking['guide_rating'],
                'assignment_status' => $booking['assignment_status'],
                'assignment_date' => $booking['assignment_date']
            ];
        } else {
            $booking['guide_info'] = null;
        }
        
        if ($booking['tour_id'] && $conn) {
            $itineraryQuery = "SELECT i.id as itinerary_id, i.tour_name, i.total_days,
                                      s.day_number as day, s.title, s.description, 
                                      s.time_schedule, s.location, s.activities
                               FROM itineraries i
                               LEFT JOIN itinerary_schedule s ON i.id = s.itinerary_id
                               WHERE i.tour_id = :tour_id
                               ORDER BY s.day_number ASC";
            $itineraryStmt = $conn->prepare($itineraryQuery);
            $itineraryStmt->bindParam(':tour_id', $booking['tour_id'], PDO::PARAM_INT);
            $itineraryStmt->execute();
            $itineraryData = $itineraryStmt->fetchAll(PDO::FETCH_ASSOC);
            $itinerary = [];
            foreach ($itineraryData as $day) {
                $activities = $day['activities'];
                if (is_string($activities)) {
                    $activities = json_decode($activities, true) ?: [];
                }
                if (!is_array($activities)) {
                    $activities = [$activities];
                }
                $itinerary[] = [
                    'day' => (int)$day['day'],
                    'title' => $day['title'] ?: "Day {$day['day']}",
                    'activities' => $activities,
                    'time_schedule' => $day['time_schedule'],
                    'location' => $day['location'],
                    'description' => $day['description']
                ];
            }
            $booking['itinerary'] = $itinerary;
        } else {
            $booking['itinerary'] = [];
        }
    }
    $stats = [
        'totalBookings' => count($bookings),
        'pendingBookings' => count(array_filter($bookings, fn($b) => $b['status'] === 'pending')),
        'confirmedBookings' => count(array_filter($bookings, fn($b) => $b['status'] === 'confirmed')),
        'cancelledBookings' => count(array_filter($bookings, fn($b) => $b['status'] === 'cancelled')),
        'completedBookings' => count(array_filter($bookings, fn($b) => $b['status'] === 'completed')),
        'totalRevenue' => array_sum(array_column($bookings, 'total_amount'))
    ];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'bookings' => $bookings,
            'stats' => $stats
        ],
        'total' => count($bookings),
        'generated_at' => date('Y-m-d H:i:s')
    ]);
}

function getBooking($conn, $booking_id) {
    $query = "SELECT b.*, t.title as tour_title, t.destination, t.price as tour_price,
                     u.first_name, u.last_name, u.email, u.phone,
                     gu.first_name as guide_first_name, gu.last_name as guide_last_name,
                     gu.email as guide_email, gu.phone as guide_phone,
                     g.specialization as guide_specialization, g.rating as guide_rating,
                     tga.status as assignment_status, tga.assignment_date,
                     p.status as payment_status, p.amount as payment_amount,
                     r.id as refund_id, r.amount as refund_amount, r.status as refund_status,
                     r.method as refund_method, r.initiated_at as refund_initiated_at,
                     gc.code as giftcard_code, gc.amount as giftcard_amount, 
                     gc.balance as giftcard_balance, gc.status as giftcard_status,
                     gc.expiry_date as giftcard_expiry
              FROM bookings b 
              LEFT JOIN tours t ON b.tour_id = t.id
              LEFT JOIN users u ON b.user_id = u.id
              LEFT JOIN tour_guide_assignments tga ON b.id = tga.booking_id
              LEFT JOIN guides g ON tga.guide_id = g.id
              LEFT JOIN users gu ON g.user_id = gu.id
              LEFT JOIN payments p ON b.id = p.booking_id
              LEFT JOIN refunds r ON b.id = r.booking_id
              LEFT JOIN gift_cards gc ON b.user_id = gc.user_id AND gc.created_at >= b.updated_at
              WHERE b.id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([$booking_id]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($booking) {
        if ($booking['traveler_details']) {
            $booking['traveler_details'] = json_decode($booking['traveler_details'], true);
        }
        
        if ($booking['guide_first_name']) {
            $booking['guide_info'] = [
                'name' => $booking['guide_first_name'] . ' ' . $booking['guide_last_name'],
                'email' => $booking['guide_email'],
                'phone' => $booking['guide_phone'],
                'specialization' => $booking['guide_specialization'],
                'rating' => $booking['guide_rating'],
                'assignment_status' => $booking['assignment_status'],
                'assignment_date' => $booking['assignment_date']
            ];
        } else {
            $booking['guide_info'] = null;
        }
        
        echo json_encode(['success' => true, 'data' => $booking]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Booking not found']);
    }
}

function createBooking($conn) {
    global $userId;
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
        return;
    }

    if (isset($input['items']) && is_array($input['items']) && !empty($input['items'])) {
        $firstItem = $input['items'][0];
        $input['tour_id'] = $firstItem['item_id'];
        $input['guests'] = $firstItem['quantity'];
        $input['number_of_travelers'] = $firstItem['quantity'];
        
        if (!isset($input['user_id']) && $userId) {
            $input['user_id'] = $userId;
        }
        
        if (!isset($input['booking_date'])) {
            $input['booking_date'] = date('Y-m-d');
        }
        if (!isset($input['travel_date']) && !isset($input['start_date'])) {
            $input['travel_date'] = date('Y-m-d', strtotime('+1 week'));
            $input['start_date'] = $input['travel_date'];
        }
        
        if (!isset($input['total_amount']) && isset($input['tour_id'])) {
            $tourStmt = $conn->prepare("SELECT price FROM tours WHERE id = ?");
            $tourStmt->execute([$input['tour_id']]);
            $tour = $tourStmt->fetch(PDO::FETCH_ASSOC);
            if ($tour) {
                $input['total_amount'] = $tour['price'] * $input['guests'];
            }
        }
    }

    if (!isset($input['user_id']) && $userId) {
        $input['user_id'] = $userId;
    }

    $required_fields = ['user_id', 'tour_id', 'total_amount'];
    $missing_fields = [];
    
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Missing required fields: ' . implode(', ', $missing_fields),
            'received_data' => array_keys($input)
        ]);
        return;
    }

    if (!isset($input['booking_date'])) {
        $input['booking_date'] = date('Y-m-d');
    }
    if (!isset($input['travel_date'])) {
        $input['travel_date'] = $input['start_date'] ?? date('Y-m-d', strtotime('+1 week'));
    }
    if (!isset($input['guests'])) {
        $input['guests'] = $input['number_of_travelers'] ?? 1;
    }
    
    $query = "INSERT INTO bookings (user_id, tour_id, booking_date, travel_date, number_of_travelers, total_amount, status, payment_status, special_requirements, booking_reference, guide_id) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $booking_reference = 'BK' . date('Ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    
    try {
        $stmt = $conn->prepare($query);
        $result = $stmt->execute([
            $input['user_id'],
            $input['tour_id'],
            $input['booking_date'],
            $input['travel_date'],
            $input['guests'],
            $input['total_amount'],
            $input['status'] ?? 'pending',
            $input['payment_status'] ?? 'pending',
            $input['special_requests'] ?? $input['special_requirements'] ?? null,
            $booking_reference,
            $input['guide_id'] ?? null
        ]);
        
        if ($result) {
            $booking_id = $conn->lastInsertId();
            
            if (isset($input['payment_status']) && $input['payment_status'] === 'paid') {
                try {
                    $payment_query = "INSERT INTO payments (booking_id, amount, payment_date, payment_method, status, transaction_id) 
                                     VALUES (?, ?, NOW(), ?, 'completed', ?)";
                    $payment_stmt = $conn->prepare($payment_query);
                    $transaction_id = 'TXN' . date('YmdHis') . rand(1000, 9999);
                    $payment_method = $input['payment_method'] ?? 'credit_card';
                    
                    $payment_stmt->execute([
                        $booking_id,
                        $input['total_amount'],
                        $payment_method,
                        $transaction_id
                    ]);
                    
                    if (function_exists('logActivity')) {
                        logActivity($input['user_id'], 'Payment recorded', 'payments', $conn->lastInsertId());
                    }
                } catch (PDOException $e) {
                    error_log('Failed to create payment record: ' . $e->getMessage());
                }
            }
            
            if (function_exists('logActivity')) {
                logActivity($input['user_id'], 'Booking created', 'bookings', $booking_id);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Booking created successfully',
                'data' => [
                    'id' => $booking_id,
                    'booking_reference' => $booking_reference
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create booking']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

function updateBooking($conn, $booking_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $allowed_fields = ['travel_date', 'number_of_travelers', 'total_amount', 'status', 'payment_status', 'special_requirements'];
    $update_fields = [];
    $values = [];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $update_fields[] = "$field = ?";
            $values[] = $input[$field];
        }
    }
    
    if (isset($input['start_date'])) {
        $update_fields[] = "travel_date = ?";
        $values[] = $input['start_date'];
    }
    if (isset($input['guests'])) {
        $update_fields[] = "number_of_travelers = ?";
        $values[] = $input['guests'];
    }
    if (isset($input['special_requests'])) {
        $update_fields[] = "special_requirements = ?";
        $values[] = $input['special_requests'];
    }
    
    if (empty($update_fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No valid fields to update']);
        return;
    }
    
    $values[] = $booking_id;
    $query = "UPDATE bookings SET " . implode(', ', $update_fields) . ", updated_at = NOW() WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    $result = $stmt->execute($values);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Booking updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update booking']);
    }
}

function confirmBooking($conn, $booking_id) {
    $query = "UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([$booking_id]);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Booking confirmed successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to confirm booking']);
    }
}

function editBooking($conn, $booking_id) {
    require_once '../services/EmailService.php';
    $emailService = new EmailService();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $check_query = "SELECT b.*, u.email, u.first_name, u.last_name FROM bookings b 
                   LEFT JOIN users u ON b.user_id = u.id WHERE b.id = ?";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->execute([$booking_id]);
    $booking = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Booking not found']);
        return;
    }
    
    if ($booking['status'] === 'cancelled') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cannot edit a cancelled booking']);
        return;
    }
    
    $travel_date = $input['travelDate'] ?? null;
    $number_of_travelers = $input['numberOfTravelers'] ?? null;
    $special_requirements = $input['specialRequirements'] ?? '';
    
    $conn->beginTransaction();
    
    try {
        $update_fields = [];
        $values = [];
        
        if ($travel_date) {
            $update_fields[] = "travel_date = ?";
            $values[] = $travel_date;
        }
        
        if ($number_of_travelers) {
            $update_fields[] = "number_of_travelers = ?";
            $values[] = $number_of_travelers;
            
            if ($number_of_travelers != $booking['number_of_travelers']) {
                $tour_query = "SELECT price FROM tours WHERE id = ?";
                $tour_stmt = $conn->prepare($tour_query);
                $tour_stmt->execute([$booking['tour_id']]);
                $tour = $tour_stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($tour) {
                    $new_total = $tour['price'] * $number_of_travelers;
                    $update_fields[] = "total_amount = ?";
                    $values[] = $new_total;
                }
            }
        }
        
        if ($special_requirements !== null) {
            $update_fields[] = "special_requirements = ?";
            $values[] = $special_requirements;
        }
        
        if ($travel_date && $travel_date !== $booking['travel_date'] || 
            ($number_of_travelers && $number_of_travelers != $booking['number_of_travelers'])) {
            $update_fields[] = "status = ?";
            $values[] = 'pending';
        }
        
        $values[] = $booking_id;
        
        $query = "UPDATE bookings SET " . implode(', ', $update_fields) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute($values);
        
        $log_query = "INSERT INTO booking_logs (booking_id, action, reason, details, created_at) 
                     VALUES (?, 'edit', 'User modification', ?, NOW())";
        $log_stmt = $conn->prepare($log_query);
        $log_details = json_encode([
            'old_date' => $booking['travel_date'],
            'new_date' => $travel_date,
            'old_travelers' => $booking['number_of_travelers'],
            'new_travelers' => $number_of_travelers
        ]);
        $log_stmt->execute([$booking_id, $log_details]);
        
        $conn->commit();
        
        // Send modification email
        $booking_details = [
            'booking_reference' => $booking['booking_reference'],
            'customer_name' => ($booking['first_name'] ?? '') . ' ' . ($booking['last_name'] ?? '')
        ];
        
        $changes = [];
        if ($travel_date && $travel_date !== $booking['travel_date']) {
            $changes['Travel Date'] = [
                'old' => date('d M Y', strtotime($booking['travel_date'])),
                'new' => date('d M Y', strtotime($travel_date))
            ];
        }
        if ($number_of_travelers && $number_of_travelers != $booking['number_of_travelers']) {
            $changes['Number of Travelers'] = [
                'old' => $booking['number_of_travelers'] . ' person(s)',
                'new' => $number_of_travelers . ' person(s)'
            ];
        }
        if ($special_requirements !== $booking['special_requirements']) {
            $changes['Special Requirements'] = [
                'old' => $booking['special_requirements'] ?: 'None',
                'new' => $special_requirements ?: 'None'
            ];
        }
        
        // Attempt to send email (don't fail if email fails)
        try {
            $emailService->sendModificationEmail($booking['email'], $booking_details, $changes);
        } catch (Exception $emailError) {
            error_log("Failed to send modification email: " . $emailError->getMessage());
        }
        
        echo json_encode([
            'success' => true, 
            'message' => 'Booking updated successfully. Our team will confirm the changes within 24 hours.',
            'requires_confirmation' => true
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update booking: ' . $e->getMessage()]);
    }
}

function cancelBooking($conn, $booking_id) {
    require_once '../services/EmailService.php';
    $emailService = new EmailService();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $booking_query = "SELECT b.*, u.email, u.first_name, u.last_name, t.title as tour_name 
                      FROM bookings b 
                      LEFT JOIN users u ON b.user_id = u.id 
                      LEFT JOIN tours t ON b.tour_id = t.id
                      WHERE b.id = ?";
    $booking_stmt = $conn->prepare($booking_query);
    $booking_stmt->execute([$booking_id]);
    $booking = $booking_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Booking not found']);
        return;
    }
    
    if ($booking['status'] === 'cancelled') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Booking already cancelled']);
        return;
    }
    
    $refund_type = $input['refund_type'] ?? 'refund'; 
    $cancellation_reason = $input['cancellation_reason'] ?? '';
    
    $amount = (float)($booking['total_amount'] ?? $booking['total_price'] ?? 0);
    $booking_fee = 500; 
    $refund_amount = max(0, $amount - $booking_fee);
    
    $conn->beginTransaction();
    
    try {
        $query = "UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$booking_id]);
        
        if ($refund_type === 'giftcard') {
            $giftcard_amount = $refund_amount * 1.1;
            $giftcard_code = 'GC-' . strtoupper(substr(md5(uniqid()), 0, 12));
            $expiry_date = date('Y-m-d', strtotime('+1 year'));
            
            $giftcard_query = "INSERT INTO gift_cards (code, user_id, amount, balance, expiry_date, status, created_at) 
                              VALUES (?, ?, ?, ?, ?, 'active', NOW())";
            $giftcard_stmt = $conn->prepare($giftcard_query);
            $giftcard_stmt->execute([$giftcard_code, $booking['user_id'], $giftcard_amount, $giftcard_amount, $expiry_date]);
            
            $refund_message = "Gift card issued: {$giftcard_code} worth ₹{$giftcard_amount}";
        } else {
            $refund_query = "INSERT INTO refunds (booking_id, amount, status, method, initiated_at) 
                            VALUES (?, ?, 'pending', 'bank', NOW())";
            $refund_stmt = $conn->prepare($refund_query);
            $refund_stmt->execute([$booking_id, $refund_amount]);
            
            $refund_message = "Bank refund of ₹{$refund_amount} initiated";
        }
        
        $log_query = "INSERT INTO booking_logs (booking_id, action, reason, details, created_at) 
                     VALUES (?, 'cancel', ?, ?, NOW())";
        $log_stmt = $conn->prepare($log_query);
        $log_details = json_encode([
            'refund_type' => $refund_type,
            'refund_amount' => $refund_type === 'giftcard' ? $giftcard_amount : $refund_amount,
            'booking_fee_deducted' => $booking_fee
        ]);
        $log_stmt->execute([$booking_id, $cancellation_reason, $log_details]);
        
        $conn->commit();
        
        // Send cancellation email
        $booking_details = [
            'booking_reference' => $booking['booking_reference'],
            'customer_name' => ($booking['first_name'] ?? '') . ' ' . ($booking['last_name'] ?? ''),
            'tour_name' => $booking['tour_name'] ?? 'Tour',
            'travel_date' => date('d M Y', strtotime($booking['travel_date'])),
            'travelers' => $booking['number_of_travelers']
        ];
        
        $refund_details = [
            'type' => $refund_type,
            'amount' => $refund_type === 'giftcard' ? $giftcard_amount : $refund_amount,
            'code' => $refund_type === 'giftcard' ? $giftcard_code : null,
            'expiry' => $refund_type === 'giftcard' ? date('Y-m-d', strtotime('+1 year')) : null
        ];
        
        // Attempt to send email (don't fail if email fails)
        try {
            $emailService->sendCancellationEmail($booking['email'], $booking_details, $refund_details);
        } catch (Exception $emailError) {
            error_log("Failed to send cancellation email: " . $emailError->getMessage());
        }
        
        echo json_encode([
            'success' => true, 
            'message' => 'Booking cancelled successfully',
            'refund_type' => $refund_type,
            'refund_amount' => $refund_type === 'giftcard' ? $giftcard_amount : $refund_amount,
            'refund_message' => $refund_message,
            'giftcard_code' => $refund_type === 'giftcard' ? $giftcard_code : null
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to process cancellation: ' . $e->getMessage()]);
    }
}

function deleteBooking($conn, $booking_id) {
    $query = "DELETE FROM bookings WHERE id = ?";
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([$booking_id]);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Booking deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete booking']);
    }
}
?>
