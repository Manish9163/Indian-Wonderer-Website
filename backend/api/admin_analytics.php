<?php

require_once '../config/database.php';
require_once '../config/api_config.php';

$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200            FROM bookings b
            GROUP BY period
            ORDER BY period DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $dateFormat, PDO::PARAM_STR);
        $stmt->bindValue(2, (int)$period, PDO::PARAM_INT);
        $stmt->execute();tp://127.0.0.1:4200'];
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

class AdvancedAnalyticsAPI {
    private $pdo;
    
    public function __construct() {
        $database = new Database();
        $this->pdo = $database->getConnection();
    }
    

    public function handleRequest() {
        $action = $_GET['action'] ?? 'dashboard';
        
        try {
            switch ($action) {
                case 'dashboard':
                    $this->getDashboardAnalytics();
                    break;
                case 'revenue':
                    $this->getRevenueAnalytics();
                    break;
                case 'tours':
                    $this->getTourAnalytics();
                    break;
                case 'customers':
                    $this->getCustomerAnalytics();
                    break;
                case 'bookings':
                    $this->getBookingAnalytics();
                    break;
                case 'performance':
                    $this->getPerformanceAnalytics();
                    break;
                case 'trends':
                    $this->getTrendAnalytics();
                    break;
                case 'export':
                    $this->exportAnalytics();
                    break;
                default:
                    throw new Exception('Invalid analytics action');
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'ANALYTICS_ERROR'
            ]);
        }
    }

    private function getDashboardAnalytics() {
        $timeframe = $_GET['timeframe'] ?? '30'; // days
        $startDate = date('Y-m-d', strtotime("-{$timeframe} days"));
        
        $overview = $this->getOverviewMetrics($startDate);
        
        $revenue = $this->getRevenueMetrics($startDate);
        
        $tourPerformance = $this->getTourPerformanceMetrics($startDate);
        
        $customers = $this->getCustomerMetrics($startDate);
        
        $bookingTrends = $this->getBookingTrends($startDate);
        
        $topDestinations = $this->getTopDestinations($startDate);
        
        $recentActivities = $this->getRecentActivities(10);
        
        $refunds = $this->getRefundAnalytics($startDate);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'timeframe' => $timeframe,
                'overview' => $overview,
                'revenue' => $revenue,
                'tour_performance' => $tourPerformance,
                'customers' => $customers,
                'booking_trends' => $bookingTrends,
                'top_destinations' => $topDestinations,
                'recent_activities' => $recentActivities,
                'refunds' => $refunds,
                'generated_at' => date('Y-m-d H:i:s')
            ]
        ]);
    }
    

    private function getOverviewMetrics($startDate) {
        $stmt = $this->pdo->prepare("
            SELECT 
                (SELECT COUNT(*) FROM tours WHERE is_active = 1) as active_tours,
                (SELECT COUNT(*) FROM users WHERE role = 'customer' AND is_active = 1) as total_customers,
                (SELECT COUNT(*) FROM bookings WHERE created_at >= ?) as new_bookings,
                (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
                (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND created_at >= ?) as confirmed_bookings,
                (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets,
                (SELECT COUNT(*) FROM reviews WHERE status = 'pending') as pending_reviews,
                (SELECT COUNT(*) FROM guides WHERE status = 'available') as available_guides
        ");
        $stmt->execute([$startDate, $startDate]);
        
        $metrics = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $previousPeriodStart = date('Y-m-d', strtotime("-" . (2 * intval($_GET['timeframe'] ?? 30)) . " days"));
        
        $stmt = $this->pdo->prepare("
            SELECT 
                (SELECT COUNT(*) FROM bookings WHERE created_at BETWEEN ? AND ?) as prev_bookings,
                (SELECT COUNT(*) FROM users WHERE role = 'customer' AND created_at BETWEEN ? AND ?) as prev_customers
        ");
        $stmt->execute([$previousPeriodStart, $startDate, $previousPeriodStart, $startDate]);
        $previousMetrics = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $metrics['booking_growth'] = $previousMetrics['prev_bookings'] > 0 ? 
            round((($metrics['new_bookings'] - $previousMetrics['prev_bookings']) / $previousMetrics['prev_bookings']) * 100, 2) : 0;
        
        $metrics['customer_growth'] = $previousMetrics['prev_customers'] > 0 ? 
            round((($metrics['total_customers'] - $previousMetrics['prev_customers']) / $previousMetrics['prev_customers']) * 100, 2) : 0;
        
        return $metrics;
    }

    private function getRevenueMetrics($startDate) {
        $stmt = $this->pdo->prepare("
            SELECT 
                SUM(CASE WHEN b.status = 'confirmed' AND b.created_at >= ? THEN b.total_amount ELSE 0 END) as current_revenue,
                SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN b.status = 'pending' THEN b.total_amount ELSE 0 END) as pending_revenue,
                AVG(CASE WHEN b.status = 'confirmed' AND b.created_at >= ? THEN b.total_amount END) as avg_booking_value,
                COUNT(CASE WHEN b.status = 'confirmed' AND b.created_at >= ? THEN 1 END) as paid_bookings,
                (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled' AND created_at >= ?) as cancelled_count,
                (SELECT SUM(amount) FROM refunds WHERE status = 'pending') as pending_refunds,
                (SELECT SUM(amount) FROM refunds WHERE status = 'completed') as completed_refunds,
                (SELECT SUM(amount) FROM refunds WHERE initiated_at >= ?) as recent_refunds,
                (SELECT SUM(amount) FROM gift_cards WHERE status = 'active' AND created_at >= ?) as gift_cards_issued
            FROM bookings b
        ");
        $stmt->execute([$startDate, $startDate, $startDate, $startDate, $startDate, $startDate]);
        $revenue = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $revenue['net_revenue'] = floatval($revenue['current_revenue']) - floatval($revenue['recent_refunds'] ?? 0);
        $revenue['refund_rate'] = $revenue['paid_bookings'] > 0 ? 
            round(($revenue['cancelled_count'] / ($revenue['paid_bookings'] + $revenue['cancelled_count'])) * 100, 2) : 0;
        
        $stmt = $this->pdo->prepare("
            SELECT 
                DATE(created_at) as date,
                SUM(total_amount) as daily_revenue,
                COUNT(*) as daily_bookings
            FROM bookings 
            WHERE status = 'confirmed' AND created_at >= ?
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        ");
        $stmt->execute([$startDate]);
        $revenue['daily_revenue'] = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
        
        return $revenue;
    }
    
    private function getTourPerformanceMetrics($startDate) {
        $stmt = $this->pdo->prepare("
            SELECT 
                t.id, t.title, t.destination, t.price,
                COUNT(b.id) as total_bookings,
                COUNT(CASE WHEN b.created_at >= ? THEN 1 END) as recent_bookings,
                SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END) as revenue,
                AVG(r.rating) as avg_rating,
                COUNT(r.id) as review_count,
                (COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) * 100.0 / NULLIF(COUNT(b.id), 0)) as conversion_rate
            FROM tours t
            LEFT JOIN bookings b ON t.id = b.tour_id
            LEFT JOIN reviews r ON t.id = r.tour_id AND r.status = 'approved'
            WHERE t.is_active = 1
            GROUP BY t.id
            ORDER BY recent_bookings DESC, revenue DESC
            LIMIT 10
        ");
        $stmt->execute([$startDate]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    

    private function getCustomerMetrics($startDate) {
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(CASE WHEN created_at >= ? THEN 1 END) as new_customers,
                COUNT(*) as total_customers,
                COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_customers,
                (SELECT COUNT(DISTINCT user_id) FROM bookings WHERE created_at >= ?) as booking_customers,
                (SELECT COUNT(DISTINCT user_id) FROM bookings WHERE status = 'confirmed' AND created_at >= ?) as paying_customers
            FROM users 
            WHERE role = 'customer'
        ");
        $stmt->execute([$startDate, $startDate, $startDate]);
        $customerMetrics = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $this->pdo->prepare("
            SELECT 
                u.id, u.first_name, u.last_name, u.email,
                COUNT(b.id) as total_bookings,
                SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END) as total_spent,
                MAX(b.created_at) as last_booking
            FROM users u
            JOIN bookings b ON u.id = b.user_id
            WHERE u.role = 'customer'
            GROUP BY u.id
            ORDER BY total_spent DESC
            LIMIT 10
        ");
        $stmt->execute();
        $customerMetrics['top_customers'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $customerMetrics;
    }

    private function getBookingTrends($startDate) {
        $stmt = $this->pdo->prepare("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
                SUM(total_amount) as total_value
            FROM bookings
            WHERE created_at >= ?
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        ");
        $stmt->execute([$startDate]);
        
        return array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    private function getTopDestinations($startDate) {
        $stmt = $this->pdo->prepare("
            SELECT 
                t.destination,
                COUNT(b.id) as bookings,
                SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END) as revenue,
                AVG(r.rating) as avg_rating,
                COUNT(DISTINCT t.id) as tour_count
            FROM tours t
            LEFT JOIN bookings b ON t.id = b.tour_id AND b.created_at >= ?
            LEFT JOIN reviews r ON t.id = r.tour_id AND r.status = 'approved'
            WHERE t.is_active = 1
            GROUP BY t.destination
            ORDER BY bookings DESC, revenue DESC
            LIMIT 10
        ");
        $stmt->execute([$startDate]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    

    private function getRecentActivities($limit = 10) {
        $stmt = $this->pdo->prepare("
            SELECT 
                b.id,
                b.booking_reference,
                b.created_at,
                b.status,
                b.total_amount as amount,
                b.number_of_travelers,
                u.first_name,
                u.last_name,
                u.email as customer_email,
                t.title as tour_name,
                CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                CASE 
                    WHEN b.status = 'confirmed' THEN 'Booking confirmed'
                    WHEN b.status = 'pending' THEN 'New booking received'
                    WHEN b.status = 'cancelled' THEN 'Booking cancelled'
                    WHEN b.status = 'completed' THEN 'Tour completed'
                    ELSE 'Booking activity'
                END as activity_type
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN tours t ON b.tour_id = t.id
            ORDER BY b.created_at DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    

    private function getRevenueAnalytics() {
        $timeframe = $_GET['timeframe'] ?? 'month';
        $period = $_GET['period'] ?? '12';
        
        $dateFormat = match($timeframe) {
            'day' => '%Y-%m-%d',
            'week' => '%Y-%u',
            'year' => '%Y',
            default => '%Y-%m'
        };
        
        $stmt = $this->pdo->prepare("
            SELECT 
                DATE_FORMAT(b.created_at, ?) as period,
                SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END) as revenue,
                COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
                AVG(CASE WHEN b.status = 'confirmed' THEN b.total_amount END) as avg_booking_value,
                SUM(CASE WHEN b.status = 'pending' THEN b.total_amount ELSE 0 END) as pending_revenue
            FROM bookings b
            GROUP BY period
            ORDER BY period DESC
            LIMIT ?
        ");
        $stmt->execute([$dateFormat, (int)$period]);
        $revenueByPeriod = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
        
        $stmt = $this->pdo->prepare("
            SELECT 
                t.category,
                SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END) as revenue,
                COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as bookings,
                AVG(CASE WHEN b.status = 'confirmed' THEN b.total_amount END) as avg_value
            FROM tours t
            JOIN bookings b ON t.id = b.tour_id
            WHERE t.category != ''
            GROUP BY t.category
            ORDER BY revenue DESC
        ");
        $stmt->execute();
        $revenueByCategory = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $stmt = $this->pdo->prepare("
            SELECT 
                p.payment_method,
                SUM(p.amount) as total_amount,
                COUNT(*) as transaction_count,
                AVG(p.amount) as avg_transaction
            FROM payments p
            WHERE p.status = 'completed'
            GROUP BY p.payment_method
            ORDER BY total_amount DESC
        ");
        $stmt->execute();
        $revenueByPaymentMethod = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'timeframe' => $timeframe,
                'period' => $period,
                'revenue_by_period' => $revenueByPeriod,
                'revenue_by_category' => $revenueByCategory,
                'revenue_by_payment_method' => $revenueByPaymentMethod
            ]
        ]);
    }
    

    private function getTourAnalytics() {
        $stmt = $this->pdo->prepare("
            SELECT 
                t.*,
                COUNT(DISTINCT b.id) as total_bookings,
                COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
                COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
                COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
                SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END) as total_revenue,
                AVG(CASE WHEN b.status = 'confirmed' THEN b.total_amount END) as avg_booking_value,
                AVG(r.rating) as avg_rating,
                COUNT(DISTINCT r.id) as review_count,
                SUM(CASE WHEN b.status = 'confirmed' THEN b.number_of_travelers ELSE 0 END) as total_travelers,
                (t.max_capacity * COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END)) as capacity_utilization
            FROM tours t
            LEFT JOIN bookings b ON t.id = b.tour_id
            LEFT JOIN reviews r ON t.id = r.tour_id AND r.status = 'approved'
            GROUP BY t.id
            ORDER BY total_revenue DESC
        ");
        $stmt->execute();
        $tourMetrics = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($tourMetrics as &$tour) {
            $tour['conversion_rate'] = $tour['total_bookings'] > 0 ? 
                round(($tour['confirmed_bookings'] / $tour['total_bookings']) * 100, 2) : 0;
            $tour['cancellation_rate'] = $tour['total_bookings'] > 0 ? 
                round(($tour['cancelled_bookings'] / $tour['total_bookings']) * 100, 2) : 0;
            $tour['occupancy_rate'] = $tour['max_capacity'] > 0 ? 
                round(($tour['total_travelers'] / ($tour['max_capacity'] * max(1, $tour['confirmed_bookings']))) * 100, 2) : 0;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $tourMetrics
        ]);
    }
    

    private function getRefundAnalytics($startDate) {
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(r.id) as total_refunds,
                SUM(r.amount) as total_refund_amount,
                COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_refunds_count,
                SUM(CASE WHEN r.status = 'pending' THEN r.amount END) as pending_refunds_amount,
                COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_refunds_count,
                SUM(CASE WHEN r.status = 'completed' THEN r.amount END) as completed_refunds_amount,
                COUNT(CASE WHEN r.initiated_at >= ? THEN 1 END) as recent_refunds_count,
                SUM(CASE WHEN r.initiated_at >= ? THEN r.amount END) as recent_refunds_amount,
                AVG(r.amount) as avg_refund_amount
            FROM refunds r
        ");
        $stmt->execute([$startDate, $startDate]);
        $refundStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(gc.id) as total_giftcards,
                SUM(gc.amount) as total_giftcard_amount,
                COUNT(CASE WHEN gc.status = 'active' THEN 1 END) as active_giftcards,
                SUM(CASE WHEN gc.status = 'active' THEN gc.balance END) as active_balance,
                COUNT(CASE WHEN gc.created_at >= ? THEN 1 END) as recent_giftcards,
                SUM(CASE WHEN gc.created_at >= ? THEN gc.amount END) as recent_giftcard_amount,
                AVG(gc.amount) as avg_giftcard_amount
            FROM gift_cards gc
        ");
        $stmt->execute([$startDate, $startDate]);
        $giftcardStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $this->pdo->prepare("
            SELECT 
                r.id as refund_id,
                r.amount as refund_amount,
                r.method as refund_method,
                r.initiated_at,
                b.id as booking_id,
                b.booking_reference,
                u.first_name,
                u.last_name,
                u.email,
                t.title as tour_name
            FROM refunds r
            JOIN bookings b ON r.booking_id = b.id
            JOIN users u ON b.user_id = u.id
            LEFT JOIN tours t ON b.tour_id = t.id
            WHERE r.status = 'pending'
            ORDER BY r.initiated_at DESC
            LIMIT 50
        ");
        $stmt->execute();
        $pendingRefunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $stmt = $this->pdo->prepare("
            SELECT 
                DATE(initiated_at) as date,
                COUNT(*) as refund_count,
                SUM(amount) as refund_amount
            FROM refunds
            WHERE initiated_at >= ?
            GROUP BY DATE(initiated_at)
            ORDER BY date DESC
        ");
        $stmt->execute([$startDate]);
        $refundTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'stats' => $refundStats,
            'giftcards' => $giftcardStats,
            'pending_refunds' => $pendingRefunds,
            'trends' => $refundTrends
        ];
    }
    

    private function exportAnalytics() {
        $format = $_GET['format'] ?? 'json';
        $type = $_GET['type'] ?? 'dashboard';
        
        $data = [];
        switch ($type) {
            case 'tours':
                $this->getTourAnalytics();
                return;
            case 'revenue':
                $this->getRevenueAnalytics();
                return;
            default:
                $this->getDashboardAnalytics();
                return;
        }
    }
}

$api = new AdvancedAnalyticsAPI();
$api->handleRequest();
