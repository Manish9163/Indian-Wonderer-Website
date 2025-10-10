<?php
/**
 * Test script to verify refund data in database
 * This will help diagnose if the issue is in the database or the API
 */

require_once '../config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $pdo = $database->connect();
    
    echo "<h2>Testing Refund Data Structure</h2>";
    echo "<pre>";
    
    // Test 1: Check refunds table structure
    echo "\n=== TEST 1: Refunds Table Structure ===\n";
    $stmt = $pdo->query("DESCRIBE refunds");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Columns in refunds table:\n";
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']}) - {$col['Null']} - {$col['Key']}\n";
    }
    
    // Test 2: Count total refunds
    echo "\n=== TEST 2: Refund Counts ===\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM refunds");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total refunds in database: {$result['total']}\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as pending FROM refunds WHERE status = 'pending'");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Pending refunds: {$result['pending']}\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as completed FROM refunds WHERE status = 'completed'");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Completed refunds: {$result['completed']}\n";
    
    // Test 3: Check amount field data
    echo "\n=== TEST 3: Amount Field Analysis ===\n";
    $stmt = $pdo->query("
        SELECT 
            id,
            booking_id,
            amount,
            method,
            status,
            CASE 
                WHEN amount IS NULL THEN 'NULL'
                WHEN amount = 0 THEN 'ZERO'
                WHEN amount > 0 THEN 'HAS VALUE'
                ELSE 'UNKNOWN'
            END as amount_status
        FROM refunds
        ORDER BY initiated_at DESC
        LIMIT 10
    ");
    $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Last 10 refunds with amount analysis:\n";
    foreach ($refunds as $refund) {
        echo "  ID: {$refund['id']} | Booking: {$refund['booking_id']} | Amount: {$refund['amount']} | Status: {$refund['amount_status']} | Method: {$refund['method']}\n";
    }
    
    // Test 4: Check the actual query used by API
    echo "\n=== TEST 4: API Query Simulation (Pending Refunds) ===\n";
    $stmt = $pdo->prepare("
        SELECT 
            r.id as refund_id,
            r.amount as refund_amount,
            r.method as refund_method,
            r.status as refund_status,
            r.reason as refund_reason,
            r.notes as admin_notes,
            r.initiated_at as created_at,
            r.completed_at,
            b.id as booking_id,
            b.booking_reference,
            b.total_amount,
            u.id as customer_id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            t.title as tour_name,
            t.start_date as tour_start_date,
            t.end_date as tour_end_date,
            gc.id as giftcard_id,
            gc.code as giftcard_code,
            gc.balance as giftcard_balance,
            gc.amount as giftcard_amount,
            gc.expires_at as giftcard_expires
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
        JOIN users u ON b.user_id = u.id
        LEFT JOIN tours t ON b.tour_id = t.id
        LEFT JOIN gift_cards gc ON gc.booking_id = b.id AND r.method = 'giftcard'
        WHERE r.status = 'pending'
        ORDER BY r.initiated_at DESC
        LIMIT 5
    ");
    $stmt->execute();
    $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Pending refunds as API returns them:\n";
    echo "Count: " . count($refunds) . "\n\n";
    
    foreach ($refunds as $index => $refund) {
        echo "--- Refund #" . ($index + 1) . " ---\n";
        echo "Refund ID: {$refund['refund_id']}\n";
        echo "Refund Amount: " . ($refund['refund_amount'] ?? 'NULL') . "\n";
        echo "Customer: {$refund['first_name']} {$refund['last_name']}\n";
        echo "Email: {$refund['email']}\n";
        echo "Phone: {$refund['phone']}\n";
        echo "Booking: {$refund['booking_reference']}\n";
        echo "Tour: " . ($refund['tour_name'] ?? 'N/A') . "\n";
        echo "Method: {$refund['refund_method']}\n";
        echo "Status: {$refund['refund_status']}\n";
        if ($refund['refund_method'] === 'giftcard') {
            echo "Gift Card Code: " . ($refund['giftcard_code'] ?? 'N/A') . "\n";
            echo "Gift Card Balance: " . ($refund['giftcard_balance'] ?? 'N/A') . "\n";
        }
        echo "\n";
    }
    
    // Test 5: Check for NULL or zero amounts
    echo "\n=== TEST 5: Problem Detection ===\n";
    $stmt = $pdo->query("SELECT COUNT(*) as null_count FROM refunds WHERE amount IS NULL");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Refunds with NULL amount: {$result['null_count']}\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as zero_count FROM refunds WHERE amount = 0");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Refunds with ZERO amount: {$result['zero_count']}\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as valid_count FROM refunds WHERE amount > 0");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Refunds with VALID amount (> 0): {$result['valid_count']}\n";
    
    // Test 6: Check if booking amounts are available
    echo "\n=== TEST 6: Booking Total Amounts ===\n";
    $stmt = $pdo->query("
        SELECT 
            r.id as refund_id,
            r.amount as refund_amount,
            b.total_amount as booking_total
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
        WHERE r.status = 'pending'
        LIMIT 5
    ");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Refund amounts vs Booking totals:\n";
    foreach ($results as $row) {
        echo "  Refund ID: {$row['refund_id']} | Refund Amount: {$row['refund_amount']} | Booking Total: {$row['booking_total']}\n";
    }
    
    echo "\n=== SUMMARY ===\n";
    echo "If you see NULL or 0 amounts above, the issue is in the DATABASE.\n";
    echo "You may need to update the refunds table to populate the amount field.\n";
    echo "The amount should typically match the booking total_amount.\n";
    
    echo "</pre>";
    
} catch (Exception $e) {
    echo "<h2>Error</h2>";
    echo "<pre>";
    echo "Error: " . $e->getMessage();
    echo "</pre>";
}
?>
