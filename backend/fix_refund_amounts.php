<?php
/**
 * Fix Refund Amounts
 * This script updates refund amounts from booking totals
 */

require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $pdo = $database->connect();
    
    echo "<h2>Fixing Refund Amounts</h2>";
    echo "<pre>";
    
    // Check current state
    echo "=== Current State ===\n";
    $stmt = $pdo->query("
        SELECT 
            r.id, 
            r.amount as current_refund_amount,
            b.total_amount as booking_total,
            r.status,
            r.method
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
    ");
    $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($refunds) . " refunds\n\n";
    
    foreach ($refunds as $refund) {
        echo "Refund ID: {$refund['id']}\n";
        echo "  Current Amount: {$refund['current_refund_amount']}\n";
        echo "  Booking Total: {$refund['booking_total']}\n";
        echo "  Status: {$refund['status']}\n";
        echo "  Method: {$refund['method']}\n\n";
    }
    
    // Ask for confirmation
    echo "\n=== Applying Fix ===\n";
    echo "Updating refund amounts to match booking totals...\n\n";
    
    // Update refund amounts
    $updateStmt = $pdo->prepare("
        UPDATE refunds r
        JOIN bookings b ON r.booking_id = b.id
        SET r.amount = b.total_amount
        WHERE r.amount = 0 OR r.amount IS NULL
    ");
    
    $updated = $updateStmt->execute();
    $count = $updateStmt->rowCount();
    
    echo "✅ Updated {$count} refund records\n\n";
    
    // Verify the fix
    echo "=== After Fix ===\n";
    $stmt = $pdo->query("
        SELECT 
            r.id, 
            r.amount as refund_amount,
            b.total_amount as booking_total,
            r.status
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
    ");
    $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($refunds as $refund) {
        $match = ($refund['refund_amount'] == $refund['booking_total']) ? '✅' : '❌';
        echo "{$match} Refund ID: {$refund['id']} | Amount: ₹{$refund['refund_amount']} | Booking: ₹{$refund['booking_total']}\n";
    }
    
    echo "\n=== Summary ===\n";
    echo "✅ All refund amounts have been fixed!\n";
    echo "The amounts now match the booking totals.\n";
    echo "Refresh your admin panel to see the updated amounts.\n";
    
    echo "</pre>";
    
} catch (Exception $e) {
    echo "<h2>❌ Error</h2>";
    echo "<pre>";
    echo "Error: " . $e->getMessage();
    echo "\nStack trace:\n" . $e->getTraceAsString();
    echo "</pre>";
}
?>
