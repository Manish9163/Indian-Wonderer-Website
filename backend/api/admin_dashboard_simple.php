<?php
// Simple Admin Dashboard API - No authentication required for testing
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Get total tours
    $toursStmt = $pdo->query("SELECT COUNT(*) as count, COUNT(CASE WHEN is_active = 1 THEN 1 END) as active FROM tours");
    $toursData = $toursStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get total customers
    $customersStmt = $pdo->query("SELECT COUNT(*) as count, COUNT(CASE WHEN is_active = 1 THEN 1 END) as active FROM users WHERE role = 'customer'");
    $customersData = $customersStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get bookings stats
    $bookingsStmt = $pdo->query("SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM bookings");
    $bookingsData = $bookingsStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get revenue stats
    $revenueStmt = $pdo->query("SELECT 
        COALESCE(SUM(CASE WHEN p.status IN ('paid', 'completed') THEN p.amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN p.status IN ('paid', 'completed') AND MONTH(p.payment_date) = MONTH(CURDATE()) THEN p.amount ELSE 0 END), 0) as monthly_revenue,
        COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) as pending_revenue
        FROM bookings b
        LEFT JOIN payments p ON b.id = p.booking_id");
    $revenueData = $revenueStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get recent bookings
    $recentBookingsStmt = $pdo->query("SELECT 
        b.id,
        b.booking_reference,
        b.status,
        b.total_amount,
        b.travel_date,
        b.created_at,
        u.username as customer_name,
        u.email as customer_email,
        t.title as tour_name,
        t.destination
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN tours t ON b.tour_id = t.id
        ORDER BY b.created_at DESC
        LIMIT 10");
    $recentBookings = $recentBookingsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recent customers
    $recentCustomersStmt = $pdo->query("SELECT 
        id, username as name, email, created_at as joinDate
        FROM users 
        WHERE role = 'customer'
        ORDER BY created_at DESC
        LIMIT 5");
    $recentCustomers = $recentCustomersStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get popular tours
    $popularToursStmt = $pdo->query("SELECT 
        t.id,
        t.title,
        t.destination,
        t.price,
        t.image_url,
        COUNT(b.id) as booking_count
        FROM tours t
        LEFT JOIN bookings b ON t.id = b.tour_id
        WHERE t.is_active = 1
        GROUP BY t.id
        ORDER BY booking_count DESC
        LIMIT 5");
    $popularTours = $popularToursStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $response = [
        'success' => true,
        'data' => [
            'stats' => [
                'totalTours' => (int)$toursData['count'],
                'activeTours' => (int)$toursData['active'],
                'totalCustomers' => (int)$customersData['count'],
                'activeCustomers' => (int)$customersData['active'],
                'totalBookings' => (int)$bookingsData['total'],
                'pendingBookings' => (int)$bookingsData['pending'],
                'confirmedBookings' => (int)$bookingsData['confirmed'],
                'cancelledBookings' => (int)$bookingsData['cancelled'],
                'completedBookings' => (int)$bookingsData['completed'],
                'totalRevenue' => (float)$revenueData['total_revenue'],
                'monthlyRevenue' => (float)$revenueData['monthly_revenue'],
                'pendingRevenue' => (float)$revenueData['pending_revenue']
            ],
            'recentBookings' => $recentBookings,
            'recentCustomers' => $recentCustomers,
            'popularTours' => $popularTours
        ],
        'generated_at' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
