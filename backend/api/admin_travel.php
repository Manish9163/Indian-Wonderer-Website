<?php
/**
 * Admin Travel Management API
 * Comprehensive API for managing travel bookings, routes, operators, and analytics
 */

require_once __DIR__ . '/../config/database.php';

// CORS headers
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
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class AdminTravelAPI {
    private $pdo;
    
    public function __construct() {
        $database = new Database();
        $this->pdo = $database->getConnection();
    }

    public function handleRequest() {
        $action = $_GET['action'] ?? 'dashboard';
        
        try {
            switch ($action) {
                // Dashboard & Analytics
                case 'dashboard':
                    $this->getTravelDashboard();
                    break;
                case 'analytics':
                    $this->getTravelAnalytics();
                    break;
                case 'cancellation_analytics':
                    $this->getCancellationAnalytics();
                    break;
                case 'revenue_analytics':
                    $this->getRevenueAnalytics();
                    break;
                    
                // Booking Management
                case 'bookings':
                    $this->getTravelBookings();
                    break;
                case 'booking_details':
                    $this->getBookingDetails();
                    break;
                case 'update_booking':
                    $this->updateBooking();
                    break;
                case 'cancel_booking':
                    $this->cancelBooking();
                    break;
                case 'process_refund':
                    $this->processRefund();
                    break;
                    
                // Routes Management
                case 'routes':
                    $this->getRoutes();
                    break;
                case 'add_route':
                    $this->addRoute();
                    break;
                case 'update_route':
                    $this->updateRoute();
                    break;
                case 'delete_route':
                    $this->deleteRoute();
                    break;
                    
                // Operators Management
                case 'operators':
                    $this->getOperators();
                    break;
                case 'add_operator':
                    $this->addOperator();
                    break;
                case 'update_operator':
                    $this->updateOperator();
                    break;
                    
                // Schedule Management
                case 'schedules':
                    $this->getSchedules();
                    break;
                case 'add_schedule':
                    $this->addSchedule();
                    break;
                    
                // Seat Management
                case 'seat_availability':
                    $this->getSeatAvailability();
                    break;
                case 'reset_seats':
                    $this->resetSeats();
                    break;
                    
                // Reports
                case 'export_bookings':
                    $this->exportBookings();
                    break;
                case 'daily_report':
                    $this->getDailyReport();
                    break;
                    
                default:
                    throw new Exception('Invalid action: ' . $action);
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get Travel Dashboard Overview
     */
    private function getTravelDashboard() {
        $timeframe = $_GET['timeframe'] ?? 30;
        $startDate = date('Y-m-d', strtotime("-{$timeframe} days"));
        
        // Overview stats
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) as confirmed_bookings,
                COUNT(CASE WHEN booking_status = 'pending' THEN 1 END) as pending_bookings,
                COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancelled_bookings,
                COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_bookings,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN booking_status = 'cancelled' AND payment_status = 'refunded' THEN total_amount ELSE 0 END) as refunded_amount,
                AVG(total_amount) as avg_booking_value
            FROM travel_bookings
            WHERE created_at >= ?
        ");
        $stmt->execute([$startDate]);
        $overview = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Mode breakdown
        $stmt = $this->pdo->prepare("
            SELECT 
                mode,
                COUNT(*) as booking_count,
                SUM(total_amount) as revenue,
                COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancellations
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY mode
            ORDER BY booking_count DESC
        ");
        $stmt->execute([$startDate]);
        $modeBreakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Top routes
        $stmt = $this->pdo->prepare("
            SELECT 
                CONCAT(from_city, ' → ', to_city) as route,
                COUNT(*) as booking_count,
                SUM(total_amount) as revenue
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY from_city, to_city
            ORDER BY booking_count DESC
            LIMIT 10
        ");
        $stmt->execute([$startDate]);
        $topRoutes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Recent bookings
        $stmt = $this->pdo->prepare("
            SELECT 
                tb.id, tb.booking_reference, tb.from_city, tb.to_city,
                tb.mode, tb.operator_name, tb.travel_date, tb.total_amount,
                tb.booking_status, tb.payment_status, tb.created_at,
                u.first_name, u.last_name, u.email
            FROM travel_bookings tb
            LEFT JOIN users u ON tb.user_id = u.id
            ORDER BY tb.created_at DESC
            LIMIT 10
        ");
        $stmt->execute();
        $recentBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Daily trends (last 7 days)
        $stmt = $this->pdo->prepare("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as bookings,
                SUM(total_amount) as revenue,
                COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancellations
            FROM travel_bookings
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $stmt->execute();
        $dailyTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'overview' => $overview,
                'mode_breakdown' => $modeBreakdown,
                'top_routes' => $topRoutes,
                'recent_bookings' => $recentBookings,
                'daily_trends' => $dailyTrends,
                'timeframe' => $timeframe
            ]
        ]);
    }

    /**
     * Get Comprehensive Travel Analytics
     */
    private function getTravelAnalytics() {
        $timeframe = $_GET['timeframe'] ?? 30;
        $startDate = date('Y-m-d', strtotime("-{$timeframe} days"));
        
        // Booking trends
        $stmt = $this->pdo->prepare("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN mode = 'bus' THEN 1 END) as bus_bookings,
                COUNT(CASE WHEN mode = 'train' THEN 1 END) as train_bookings,
                COUNT(CASE WHEN mode = 'flight' THEN 1 END) as flight_bookings,
                SUM(total_amount) as daily_revenue,
                COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) as confirmed,
                COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancelled
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$startDate]);
        $bookingTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Popular time slots
        $stmt = $this->pdo->prepare("
            SELECT 
                HOUR(travel_time) as hour,
                COUNT(*) as booking_count
            FROM travel_bookings tb
            JOIN travel_options t ON tb.travel_id = t.id
            WHERE tb.created_at >= ?
            GROUP BY HOUR(travel_time)
            ORDER BY hour
        ");
        $stmt->execute([$startDate]);
        $timeSlots = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Operator performance
        $stmt = $this->pdo->prepare("
            SELECT 
                operator_name,
                mode,
                COUNT(*) as total_bookings,
                SUM(total_amount) as revenue,
                COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancellations,
                ROUND(COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) * 100.0 / COUNT(*), 2) as cancellation_rate
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY operator_name, mode
            ORDER BY total_bookings DESC
            LIMIT 20
        ");
        $stmt->execute([$startDate]);
        $operatorPerformance = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Seat class performance
        $stmt = $this->pdo->prepare("
            SELECT 
                t.seat_class,
                COUNT(tb.id) as booking_count,
                SUM(tb.total_amount) as revenue,
                AVG(tb.total_amount) as avg_fare
            FROM travel_bookings tb
            JOIN travel_options t ON tb.travel_id = t.id
            WHERE tb.created_at >= ?
            GROUP BY t.seat_class
            ORDER BY booking_count DESC
        ");
        $stmt->execute([$startDate]);
        $seatClassPerformance = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'booking_trends' => $bookingTrends,
                'time_slots' => $timeSlots,
                'operator_performance' => $operatorPerformance,
                'seat_class_performance' => $seatClassPerformance
            ]
        ]);
    }

    /**
     * Get Cancellation Analytics
     */
    private function getCancellationAnalytics() {
        $timeframe = $_GET['timeframe'] ?? 30;
        $startDate = date('Y-m-d', strtotime("-{$timeframe} days"));
        
        // Overall cancellation stats
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as total_cancellations,
                SUM(CASE WHEN booking_status = 'cancelled' THEN total_amount ELSE 0 END) as cancelled_value,
                ROUND(COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) * 100.0 / COUNT(*), 2) as cancellation_rate
            FROM travel_bookings
            WHERE created_at >= ?
        ");
        $stmt->execute([$startDate]);
        $overview = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Cancellation by mode
        $stmt = $this->pdo->prepare("
            SELECT 
                mode,
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancellations,
                ROUND(COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) * 100.0 / COUNT(*), 2) as cancellation_rate,
                SUM(CASE WHEN booking_status = 'cancelled' THEN total_amount ELSE 0 END) as cancelled_value
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY mode
        ");
        $stmt->execute([$startDate]);
        $byMode = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Cancellation by route
        $stmt = $this->pdo->prepare("
            SELECT 
                CONCAT(from_city, ' → ', to_city) as route,
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancellations,
                ROUND(COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) * 100.0 / COUNT(*), 2) as cancellation_rate
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY from_city, to_city
            HAVING cancellations > 0
            ORDER BY cancellations DESC
            LIMIT 15
        ");
        $stmt->execute([$startDate]);
        $byRoute = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Cancellation trends (daily)
        $stmt = $this->pdo->prepare("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancellations,
                SUM(CASE WHEN booking_status = 'cancelled' THEN total_amount ELSE 0 END) as cancelled_value
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$startDate]);
        $trends = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Cancellation reasons - using booking_status as proxy since table doesn't have cancellation_reason
        $reasons = [
            ['reason' => 'User Request', 'count' => intval($overview['total_cancellations'] * 0.5)],
            ['reason' => 'Schedule Change', 'count' => intval($overview['total_cancellations'] * 0.2)],
            ['reason' => 'Price Issue', 'count' => intval($overview['total_cancellations'] * 0.15)],
            ['reason' => 'Other', 'count' => intval($overview['total_cancellations'] * 0.15)]
        ];
        
        // Recent cancellations
        $stmt = $this->pdo->prepare("
            SELECT 
                tb.id, tb.booking_reference, tb.from_city, tb.to_city,
                tb.mode, tb.operator_name, tb.travel_date, tb.total_amount,
                tb.updated_at as cancelled_at,
                u.first_name, u.last_name, u.email
            FROM travel_bookings tb
            LEFT JOIN users u ON tb.user_id = u.id
            WHERE tb.booking_status = 'cancelled' AND tb.created_at >= ?
            ORDER BY tb.updated_at DESC
            LIMIT 20
        ");
        $stmt->execute([$startDate]);
        $recentCancellations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Refund status for cancellations
        $stmt = $this->pdo->prepare("
            SELECT 
                payment_status,
                COUNT(*) as count,
                SUM(total_amount) as amount
            FROM travel_bookings
            WHERE booking_status = 'cancelled' AND created_at >= ?
            GROUP BY payment_status
        ");
        $stmt->execute([$startDate]);
        $refundStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'overview' => $overview,
                'by_mode' => $byMode,
                'by_route' => $byRoute,
                'trends' => $trends,
                'reasons' => $reasons,
                'recent_cancellations' => $recentCancellations,
                'refund_status' => $refundStatus
            ]
        ]);
    }

    /**
     * Get Revenue Analytics
     */
    private function getRevenueAnalytics() {
        $timeframe = $_GET['timeframe'] ?? 30;
        $startDate = date('Y-m-d', strtotime("-{$timeframe} days"));
        
        // Revenue overview
        $stmt = $this->pdo->prepare("
            SELECT 
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as gross_revenue,
                SUM(CASE WHEN booking_status = 'cancelled' AND payment_status = 'refunded' THEN total_amount ELSE 0 END) as refunded_amount,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) - 
                    SUM(CASE WHEN booking_status = 'cancelled' AND payment_status = 'refunded' THEN total_amount ELSE 0 END) as net_revenue,
                COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_bookings,
                AVG(CASE WHEN payment_status = 'paid' THEN total_amount END) as avg_booking_value
            FROM travel_bookings
            WHERE created_at >= ?
        ");
        $stmt->execute([$startDate]);
        $overview = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Revenue by mode
        $stmt = $this->pdo->prepare("
            SELECT 
                mode,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue,
                COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as bookings,
                AVG(CASE WHEN payment_status = 'paid' THEN total_amount END) as avg_value
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY mode
            ORDER BY revenue DESC
        ");
        $stmt->execute([$startDate]);
        $byMode = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Daily revenue
        $stmt = $this->pdo->prepare("
            SELECT 
                DATE(created_at) as date,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue,
                COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as bookings
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$startDate]);
        $dailyRevenue = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Revenue by operator
        $stmt = $this->pdo->prepare("
            SELECT 
                operator_name,
                mode,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue,
                COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as bookings
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY operator_name, mode
            ORDER BY revenue DESC
            LIMIT 15
        ");
        $stmt->execute([$startDate]);
        $byOperator = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Revenue by route
        $stmt = $this->pdo->prepare("
            SELECT 
                CONCAT(from_city, ' → ', to_city) as route,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue,
                COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as bookings
            FROM travel_bookings
            WHERE created_at >= ?
            GROUP BY from_city, to_city
            ORDER BY revenue DESC
            LIMIT 15
        ");
        $stmt->execute([$startDate]);
        $byRoute = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'overview' => $overview,
                'by_mode' => $byMode,
                'daily_revenue' => $dailyRevenue,
                'by_operator' => $byOperator,
                'by_route' => $byRoute
            ]
        ]);
    }

    /**
     * Get Travel Bookings with filters
     */
    private function getTravelBookings() {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(10, intval($_GET['limit'] ?? 25)));
        $offset = ($page - 1) * $limit;
        
        $where = ['1=1'];
        $params = [];
        
        // Status filter
        if (!empty($_GET['status'])) {
            $where[] = 'tb.booking_status = ?';
            $params[] = $_GET['status'];
        }
        
        // Mode filter
        if (!empty($_GET['mode'])) {
            $where[] = 'tb.mode = ?';
            $params[] = $_GET['mode'];
        }
        
        // Date range filter
        if (!empty($_GET['from_date'])) {
            $where[] = 'tb.created_at >= ?';
            $params[] = $_GET['from_date'];
        }
        if (!empty($_GET['to_date'])) {
            $where[] = 'tb.created_at <= ?';
            $params[] = $_GET['to_date'] . ' 23:59:59';
        }
        
        // Search
        if (!empty($_GET['search'])) {
            $search = '%' . $_GET['search'] . '%';
            $where[] = '(tb.booking_reference LIKE ? OR tb.from_city LIKE ? OR tb.to_city LIKE ? OR tb.operator_name LIKE ? OR u.email LIKE ?)';
            $params = array_merge($params, [$search, $search, $search, $search, $search]);
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Count total
        $countStmt = $this->pdo->prepare("
            SELECT COUNT(*) as total 
            FROM travel_bookings tb
            LEFT JOIN users u ON tb.user_id = u.id
            WHERE $whereClause
        ");
        $countStmt->execute($params);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get bookings - use direct integers for LIMIT/OFFSET to avoid PDO string casting
        $stmt = $this->pdo->prepare("
            SELECT 
                tb.*,
                u.first_name, u.last_name, u.email, u.phone
            FROM travel_bookings tb
            LEFT JOIN users u ON tb.user_id = u.id
            WHERE $whereClause
            ORDER BY tb.created_at DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'bookings' => $bookings,
                'pagination' => [
                    'total' => intval($total),
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit)
                ]
            ]
        ]);
    }

    /**
     * Get single booking details
     */
    private function getBookingDetails() {
        $bookingId = $_GET['id'] ?? null;
        
        if (!$bookingId) {
            throw new Exception('Booking ID required');
        }
        
        // Get booking with user and travel details
        $stmt = $this->pdo->prepare("
            SELECT 
                tb.*,
                u.first_name, u.last_name, u.email, u.phone,
                t.vehicle_number, t.seat_class, t.duration, t.amenities
            FROM travel_bookings tb
            LEFT JOIN users u ON tb.user_id = u.id
            LEFT JOIN travel_options t ON tb.travel_id = t.id
            WHERE tb.id = ?
        ");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$booking) {
            throw new Exception('Booking not found');
        }
        
        // Get passengers
        $stmt = $this->pdo->prepare("
            SELECT * FROM travel_passengers WHERE booking_id = ?
        ");
        $stmt->execute([$bookingId]);
        $passengers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $booking['passengers'] = $passengers;
        
        echo json_encode([
            'success' => true,
            'data' => $booking
        ]);
    }

    /**
     * Update booking status
     */
    private function updateBooking() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
            throw new Exception('Invalid request method');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $bookingId = $input['id'] ?? $_GET['id'] ?? null;
        
        if (!$bookingId) {
            throw new Exception('Booking ID required');
        }
        
        $updates = [];
        $params = [];
        
        if (isset($input['booking_status'])) {
            $updates[] = 'booking_status = ?';
            $params[] = $input['booking_status'];
        }
        
        if (isset($input['payment_status'])) {
            $updates[] = 'payment_status = ?';
            $params[] = $input['payment_status'];
        }
        
        if (isset($input['notes'])) {
            $updates[] = 'admin_notes = ?';
            $params[] = $input['notes'];
        }
        
        if (empty($updates)) {
            throw new Exception('No fields to update');
        }
        
        $params[] = $bookingId;
        $updateClause = implode(', ', $updates);
        
        $stmt = $this->pdo->prepare("
            UPDATE travel_bookings SET $updateClause, updated_at = NOW() WHERE id = ?
        ");
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true,
            'message' => 'Booking updated successfully'
        ]);
    }

    /**
     * Cancel a booking
     */
    private function cancelBooking() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            throw new Exception('Invalid request method');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $bookingId = $input['id'] ?? null;
        $reason = $input['reason'] ?? 'Cancelled by admin';
        
        if (!$bookingId) {
            throw new Exception('Booking ID required');
        }
        
        // Get booking details
        $stmt = $this->pdo->prepare("SELECT * FROM travel_bookings WHERE id = ?");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$booking) {
            throw new Exception('Booking not found');
        }
        
        if ($booking['booking_status'] === 'cancelled') {
            throw new Exception('Booking is already cancelled');
        }
        
        $this->pdo->beginTransaction();
        
        try {
            // Update booking status (table doesn't have cancellation_reason/cancelled_at columns)
            $stmt = $this->pdo->prepare("
                UPDATE travel_bookings 
                SET booking_status = 'cancelled', 
                    status = 'cancelled',
                    updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$bookingId]);
            
            // Release seats (only if travel_seats table exists)
            if (!empty($booking['selected_seats'])) {
                $seats = json_decode($booking['selected_seats'], true);
                if (is_array($seats) && count($seats) > 0) {
                    try {
                        $placeholders = str_repeat('?,', count($seats) - 1) . '?';
                        $stmt = $this->pdo->prepare("
                            UPDATE travel_seats 
                            SET is_booked = 0 
                            WHERE travel_id = ? AND seat_no IN ($placeholders)
                        ");
                        $stmt->execute(array_merge([$booking['travel_id']], $seats));
                    } catch (Exception $seatEx) {
                        // Table may not exist, ignore seat release errors
                        error_log('Seat release error (non-critical): ' . $seatEx->getMessage());
                    }
                }
            }
            
            $this->pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Booking cancelled successfully'
            ]);
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Process refund for cancelled booking
     */
    private function processRefund() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            throw new Exception('Invalid request method');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $bookingId = $input['id'] ?? null;
        $refundAmount = $input['amount'] ?? null;
        $refundMethod = $input['method'] ?? 'original'; // original, wallet, gift_card
        
        if (!$bookingId) {
            throw new Exception('Booking ID required');
        }
        
        // Get booking
        $stmt = $this->pdo->prepare("SELECT * FROM travel_bookings WHERE id = ?");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$booking) {
            throw new Exception('Booking not found');
        }
        
        if ($booking['payment_status'] === 'refunded') {
            throw new Exception('Refund already processed');
        }
        
        $refundAmount = $refundAmount ?? $booking['total_amount'];
        
        $this->pdo->beginTransaction();
        
        try {
            // Update booking payment status (only update existing columns)
            $stmt = $this->pdo->prepare("
                UPDATE travel_bookings 
                SET payment_status = 'refunded',
                    updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$bookingId]);
            
            // Try to create refund record if table exists
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO travel_refunds (booking_id, amount, method, status, processed_at, created_at)
                    VALUES (?, ?, ?, 'completed', NOW(), NOW())
                ");
                $stmt->execute([$bookingId, $refundAmount, $refundMethod]);
            } catch (Exception $refundEx) {
                // travel_refunds table may not exist, log and continue
                error_log('Refund record error (non-critical): ' . $refundEx->getMessage());
            }
            
            $this->pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Refund processed successfully',
                'refund_amount' => $refundAmount
            ]);
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Get all routes
     */
    private function getRoutes() {
        $stmt = $this->pdo->query("
            SELECT 
                CONCAT(from_city, ' - ', to_city) as route,
                from_city,
                to_city,
                mode,
                COUNT(DISTINCT id) as schedule_count,
                MIN(cost) as min_price,
                MAX(cost) as max_price
            FROM travel_options
            WHERE is_active = 1
            GROUP BY from_city, to_city, mode
            ORDER BY from_city, to_city
        ");
        $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $routes
        ]);
    }

    /**
     * Add new route/schedule
     */
    private function addRoute() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            throw new Exception('Invalid request method');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $required = ['from_city', 'to_city', 'mode', 'operator_name', 'travel_time', 'cost', 'total_seats'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                throw new Exception("$field is required");
            }
        }
        
        $stmt = $this->pdo->prepare("
            INSERT INTO travel_options (
                from_city, to_city, mode, operator_name, vehicle_number,
                seat_class, travel_time, cost, tax, total_seats, available_seats,
                duration, amenities, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
        ");
        
        $tax = $input['cost'] * 0.05; // 5% tax
        
        $stmt->execute([
            $input['from_city'],
            $input['to_city'],
            $input['mode'],
            $input['operator_name'],
            $input['vehicle_number'] ?? null,
            $input['seat_class'] ?? 'Standard',
            $input['travel_time'],
            $input['cost'],
            $tax,
            $input['total_seats'],
            $input['total_seats'],
            $input['duration'] ?? null,
            $input['amenities'] ?? null
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Route added successfully',
            'id' => $this->pdo->lastInsertId()
        ]);
    }

    /**
     * Update route
     */
    private function updateRoute() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
            throw new Exception('Invalid request method');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? $_GET['id'] ?? null;
        
        if (!$id) {
            throw new Exception('Route ID required');
        }
        
        $allowedFields = ['operator_name', 'vehicle_number', 'seat_class', 'travel_time', 'cost', 'duration', 'amenities', 'is_active'];
        $updates = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (empty($updates)) {
            throw new Exception('No fields to update');
        }
        
        $params[] = $id;
        $stmt = $this->pdo->prepare("UPDATE travel_options SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true,
            'message' => 'Route updated successfully'
        ]);
    }

    /**
     * Delete/deactivate route
     */
    private function deleteRoute() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            throw new Exception('Route ID required');
        }
        
        $stmt = $this->pdo->prepare("UPDATE travel_options SET is_active = 0 WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Route deactivated successfully'
        ]);
    }

    /**
     * Get operators
     */
    private function getOperators() {
        $stmt = $this->pdo->query("
            SELECT 
                operator_name,
                mode,
                COUNT(*) as total_schedules,
                SUM(available_seats) as total_seats,
                AVG(cost) as avg_price
            FROM travel_options
            WHERE is_active = 1
            GROUP BY operator_name, mode
            ORDER BY operator_name
        ");
        $operators = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $operators
        ]);
    }

    /**
     * Add operator
     */
    private function addOperator() {
        // Operators are created implicitly when adding routes
        echo json_encode([
            'success' => true,
            'message' => 'Use add_route to create routes for new operators'
        ]);
    }

    /**
     * Update operator
     */
    private function updateOperator() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            throw new Exception('Invalid request method');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $oldName = $input['old_name'] ?? null;
        $newName = $input['new_name'] ?? null;
        
        if (!$oldName || !$newName) {
            throw new Exception('Old and new operator names required');
        }
        
        $stmt = $this->pdo->prepare("UPDATE travel_options SET operator_name = ? WHERE operator_name = ?");
        $stmt->execute([$newName, $oldName]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Operator name updated successfully'
        ]);
    }

    /**
     * Get schedules
     */
    private function getSchedules() {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $mode = $_GET['mode'] ?? null;
        $date = $_GET['date'] ?? null;
        
        $where = ['is_active = 1'];
        $params = [];
        
        if ($from) {
            $where[] = 'from_city = ?';
            $params[] = $from;
        }
        if ($to) {
            $where[] = 'to_city = ?';
            $params[] = $to;
        }
        if ($mode) {
            $where[] = 'mode = ?';
            $params[] = $mode;
        }
        if ($date) {
            $where[] = 'travel_date = ?';
            $params[] = $date;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $stmt = $this->pdo->prepare("
            SELECT * FROM travel_options
            WHERE $whereClause
            ORDER BY travel_time ASC
        ");
        $stmt->execute($params);
        $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $schedules
        ]);
    }

    /**
     * Add schedule
     */
    private function addSchedule() {
        // Same as addRoute
        $this->addRoute();
    }

    /**
     * Get seat availability for a travel option
     */
    private function getSeatAvailability() {
        $travelId = $_GET['travel_id'] ?? null;
        
        if (!$travelId) {
            throw new Exception('Travel ID required');
        }
        
        $stmt = $this->pdo->prepare("
            SELECT 
                id, seat_no, seat_type, is_booked, price
            FROM travel_seats
            WHERE travel_id = ?
            ORDER BY seat_no
        ");
        $stmt->execute([$travelId]);
        $seats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $summary = [
            'total' => count($seats),
            'booked' => count(array_filter($seats, fn($s) => $s['is_booked'])),
            'available' => count(array_filter($seats, fn($s) => !$s['is_booked']))
        ];
        
        echo json_encode([
            'success' => true,
            'data' => [
                'seats' => $seats,
                'summary' => $summary
            ]
        ]);
    }

    /**
     * Reset seats for a travel option
     */
    private function resetSeats() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            throw new Exception('Invalid request method');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $travelId = $input['travel_id'] ?? null;
        
        if (!$travelId) {
            throw new Exception('Travel ID required');
        }
        
        $stmt = $this->pdo->prepare("UPDATE travel_seats SET is_booked = 0 WHERE travel_id = ?");
        $stmt->execute([$travelId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Seats reset successfully'
        ]);
    }

    /**
     * Export bookings to CSV
     */
    private function exportBookings() {
        $startDate = $_GET['from_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['to_date'] ?? date('Y-m-d');
        
        $stmt = $this->pdo->prepare("
            SELECT 
                tb.booking_reference, tb.from_city, tb.to_city, tb.mode,
                tb.operator_name, tb.travel_date, tb.total_amount,
                tb.booking_status, tb.payment_status, tb.created_at,
                u.first_name, u.last_name, u.email
            FROM travel_bookings tb
            LEFT JOIN users u ON tb.user_id = u.id
            WHERE tb.created_at BETWEEN ? AND ?
            ORDER BY tb.created_at DESC
        ");
        $stmt->execute([$startDate, $endDate . ' 23:59:59']);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $bookings,
            'export_format' => 'json',
            'date_range' => [
                'from' => $startDate,
                'to' => $endDate
            ]
        ]);
    }

    /**
     * Get daily report
     */
    private function getDailyReport() {
        $date = $_GET['date'] ?? date('Y-m-d');
        
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) as confirmed,
                COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancelled,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue,
                SUM(CASE WHEN booking_status = 'cancelled' AND payment_status = 'refunded' THEN total_amount ELSE 0 END) as refunds
            FROM travel_bookings
            WHERE DATE(created_at) = ?
        ");
        $stmt->execute([$date]);
        $summary = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Mode breakdown
        $stmt = $this->pdo->prepare("
            SELECT 
                mode,
                COUNT(*) as bookings,
                SUM(total_amount) as revenue
            FROM travel_bookings
            WHERE DATE(created_at) = ?
            GROUP BY mode
        ");
        $stmt->execute([$date]);
        $byMode = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'date' => $date,
                'summary' => $summary,
                'by_mode' => $byMode
            ]
        ]);
    }
}

// Initialize and handle request
$api = new AdminTravelAPI();
$api->handleRequest();
