<?php
/**
 * Test Pending Refunds Flow
 * This simulates a user requesting a refund
 */

header('Content-Type: text/html');
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    echo "<h2>🔄 Pending Refunds Flow Test</h2>";
    echo "<pre>";
    
    // Check current refunds
    echo "\n=== Current Refunds in Database ===\n";
    $stmt = $pdo->query("
        SELECT 
            r.id,
            r.booking_id,
            r.amount,
            r.status,
            r.method,
            r.initiated_at,
            b.booking_reference,
            u.first_name,
            u.last_name
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
        JOIN users u ON b.user_id = u.id
        ORDER BY r.initiated_at DESC
    ");
    $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Total Refunds: " . count($refunds) . "\n\n";
    
    foreach ($refunds as $refund) {
        echo "Refund ID: {$refund['id']}\n";
        echo "  Status: {$refund['status']}\n";
        echo "  Amount: ₹{$refund['amount']}\n";
        echo "  Customer: {$refund['first_name']} {$refund['last_name']}\n";
        echo "  Booking: {$refund['booking_reference']}\n";
        echo "  Method: {$refund['method']}\n";
        echo "  Requested: {$refund['initiated_at']}\n";
        echo "\n";
    }
    
    // Count by status
    echo "\n=== Refunds by Status ===\n";
    $stmt = $pdo->query("
        SELECT status, COUNT(*) as count 
        FROM refunds 
        GROUP BY status
    ");
    $statusCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($statusCounts as $status) {
        echo "  {$status['status']}: {$status['count']}\n";
    }
    
    echo "\n=== What Shows Where ===\n";
    echo "✅ Pending Refunds (status='pending'):\n";
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM refunds 
        WHERE status = 'pending'
    ");
    $pendingCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "   Count: {$pendingCount}\n";
    echo "   Shows in: Payments > Pending Refunds tab\n";
    echo "   Action: Admin can Process or Reject\n\n";
    
    echo "✅ Completed Refunds (status='completed'):\n";
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM refunds 
        WHERE status = 'completed'
    ");
    $completedCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "   Count: {$completedCount}\n";
    echo "   Shows in: Analytics > Refund Stats (history)\n";
    echo "   Action: View only (already processed)\n\n";
    
    echo "\n=== SIMULATION: New Refund Request ===\n";
    echo "If a user requests a refund now:\n\n";
    
    echo "1. User clicks 'Request Refund' on booking\n";
    echo "2. System creates refund record with status='pending'\n";
    echo "3. Record appears in Payments > Pending Refunds\n";
    echo "4. Admin sees:\n";
    echo "   - Customer name\n";
    echo "   - Booking details\n";
    echo "   - Refund amount\n";
    echo "   - Refund method (bank/giftcard)\n";
    echo "   - [Process] and [Reject] buttons\n";
    echo "5. Admin clicks [Process]\n";
    echo "6. Status changes to 'completed'\n";
    echo "7. Moves to Analytics (history)\n";
    echo "8. Disappears from Pending list\n";
    
    echo "\n=== To Test This Flow ===\n";
    echo "Option 1: Have a user request a refund through the UI\n";
    echo "Option 2: Create a test pending refund manually:\n\n";
    
    echo "SQL Command:\n";
    echo "INSERT INTO refunds (booking_id, amount, status, method, initiated_at)\n";
    echo "SELECT id, total_amount, 'pending', 'bank', NOW()\n";
    echo "FROM bookings\n";
    echo "WHERE id = [valid_booking_id]\n";
    echo "LIMIT 1;\n";
    
    echo "\n=== Current API Endpoints ===\n";
    echo "✅ Get Pending Refunds:\n";
    echo "   URL: /api/admin_refunds.php?action=get_pending\n";
    echo "   Returns: Only refunds with status='pending'\n\n";
    
    echo "✅ Get All Refunds (History):\n";
    echo "   URL: /api/admin_refunds.php?action=get_all\n";
    echo "   Returns: All refunds (pending + completed)\n\n";
    
    echo "✅ Process Refund:\n";
    echo "   URL: /api/admin_refunds.php?action=complete\n";
    echo "   Changes: status='pending' → 'completed'\n\n";
    
    echo "</pre>";
    
} catch (Exception $e) {
    echo "<h2>Error</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
?>
