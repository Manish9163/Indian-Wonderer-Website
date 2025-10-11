<?php


$host = 'localhost';
$dbname = 'indian_wonderer_base';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Fixing Refund Amounts ===\n\n";
    
    echo "Step 1: Checking current refund amounts...\n";
    $stmt = $pdo->query("
        SELECT 
            r.id, 
            r.amount as current_amount,
            b.total_amount as booking_total
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
    ");
    $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($refunds) . " refunds\n";
    foreach ($refunds as $refund) {
        echo "  Refund #{$refund['id']}: Current={$refund['current_amount']}, Should be={$refund['booking_total']}\n";
    }
    
    echo "\nStep 2: Updating refund amounts...\n";
    $updateStmt = $pdo->prepare("
        UPDATE refunds r
        JOIN bookings b ON r.booking_id = b.id
        SET r.amount = b.total_amount
        WHERE r.amount = 0 OR r.amount IS NULL OR r.amount = '0.00'
    ");
    $updateStmt->execute();
    $updated = $updateStmt->rowCount();
    
    echo "✅ Updated {$updated} refund records\n\n";
    
    echo "Step 3: Verifying the fix...\n";
    $stmt = $pdo->query("
        SELECT 
            r.id, 
            r.amount as refund_amount,
            b.total_amount as booking_total
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
    ");
    $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $allFixed = true;
    foreach ($refunds as $refund) {
        $match = ($refund['refund_amount'] == $refund['booking_total']);
        $icon = $match ? '✅' : '❌';
        echo "  {$icon} Refund #{$refund['id']}: ₹{$refund['refund_amount']} (Booking: ₹{$refund['booking_total']})\n";
        if (!$match) $allFixed = false;
    }
    
    echo "\n=== Result ===\n";
    if ($allFixed) {
        echo "✅ SUCCESS! All refund amounts have been fixed!\n";
        echo "You can now refresh your admin panel to see the correct amounts.\n";
    } else {
        echo "⚠️ Some refunds may need manual review.\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
