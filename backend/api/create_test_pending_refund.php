<?php
/**
 * Create Test Pending Refund
 * This creates a sample pending refund to test the flow
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Find a valid booking to create refund for
    $stmt = $pdo->query("
        SELECT b.id, b.booking_reference, b.total_amount, b.user_id,
               u.first_name, u.last_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.id NOT IN (SELECT booking_id FROM refunds)
        AND b.status IN ('confirmed', 'cancelled')
        LIMIT 1
    ");
    
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking) {
        echo json_encode([
            'success' => false,
            'message' => 'No available bookings to create test refund'
        ], JSON_PRETTY_PRINT);
        exit;
    }
    
    // Create a test pending refund
    $stmt = $pdo->prepare("
        INSERT INTO refunds (
            booking_id, 
            amount, 
            status, 
            method, 
            initiated_at,
            notes
        ) VALUES (?, ?, 'pending', 'bank', NOW(), 'Test pending refund - User requested refund')
    ");
    
    $stmt->execute([
        $booking['id'],
        $booking['total_amount']
    ]);
    
    $refundId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Test pending refund created successfully!',
        'refund' => [
            'refund_id' => $refundId,
            'booking_reference' => $booking['booking_reference'],
            'customer' => $booking['first_name'] . ' ' . $booking['last_name'],
            'amount' => $booking['total_amount'],
            'status' => 'pending',
            'method' => 'bank'
        ],
        'instructions' => [
            'Go to admin panel → Payments section',
            'Look for "Pending Refunds" tab',
            'You should see this refund with [Process] button',
            'Click Process to complete the refund',
            'After processing, it will move to Analytics (history)'
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
