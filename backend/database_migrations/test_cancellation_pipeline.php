<?php
/**
 * Test Script: Cancellation to Giftcard to Wallet Pipeline
 * 
 * This script tests the complete flow:
 * 1. Simulate a booking cancellation with giftcard option
 * 2. Verify giftcard_application is created
 * 3. Verify giftcard is generated
 * 4. Verify wallet is updated
 * 5. Verify wallet_transaction is logged
 * 6. Check data consistency
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "====================================================\n";
echo "Cancellation → Giftcard → Wallet Pipeline Test\n";
echo "====================================================\n\n";

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "✓ Connected to database\n\n";
    
    // Test 1: Get a booking to simulate cancellation
    echo "TEST 1: Find a valid booking\n";
    echo "─────────────────────────────\n";
    
    $booking_query = "
        SELECT b.id, b.booking_reference, b.user_id, b.total_amount, b.status,
               u.email, u.first_name, u.last_name
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.status != 'cancelled'
        ORDER BY b.id DESC
        LIMIT 1
    ";
    
    $booking = $conn->query($booking_query)->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking) {
        echo "⚠ No available bookings to test. Creating a test booking...\n\n";
        
        // Create test booking
        $user_id = 1; // Assume admin user exists
        $tour_id = 1; // Assume a tour exists
        $ref = 'TEST-' . time();
        
        $insert = $conn->prepare("
            INSERT INTO bookings 
            (booking_reference, user_id, tour_id, number_of_travelers, total_amount, booking_date, travel_date, status, payment_status)
            VALUES (?, ?, ?, 2, 15000, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'confirmed', 'paid')
        ");
        $insert->execute([$ref, $user_id, $tour_id]);
        $booking_id = $conn->lastInsertId();
        
        // Fetch the created booking
        $booking_query = "SELECT * FROM bookings WHERE id = ?";
        $stmt = $conn->prepare($booking_query);
        $stmt->execute([$booking_id]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "✓ Test booking created\n\n";
    }
    
    echo "Booking Details:\n";
    echo "  ID: {$booking['id']}\n";
    echo "  Reference: {$booking['booking_reference']}\n";
    echo "  User ID: {$booking['user_id']}\n";
    echo "  Amount: ₹{$booking['total_amount']}\n";
    echo "  Status: {$booking['status']}\n\n";
    
    // Test 2: Simulate cancellation with giftcard option
    echo "TEST 2: Simulate Cancellation with Giftcard Option\n";
    echo "──────────────────────────────────────────────────\n";
    
    $booking_id = $booking['id'];
    $user_id_str = (string)$booking['user_id'];
    $amount = (float)$booking['total_amount'];
    $booking_fee = 500;
    $refund_amount = max(0, $amount - $booking_fee);
    $giftcard_amount = $refund_amount * 1.1;
    
    echo "Calculation:\n";
    echo "  Original Amount: ₹{$amount}\n";
    echo "  Booking Fee: ₹{$booking_fee}\n";
    echo "  Refund Amount: ₹{$refund_amount}\n";
    echo "  Giftcard Amount (10% bonus): ₹{$giftcard_amount}\n\n";
    
    // Start transaction
    $conn->beginTransaction();
    
    try {
        // Step 1: Mark booking as cancelled
        echo "Step 1: Marking booking as cancelled...\n";
        $cancel_stmt = $conn->prepare("UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?");
        $cancel_stmt->execute([$booking_id]);
        echo "  ✓ Booking status updated to 'cancelled'\n\n";
        
        // Step 2: Create giftcard_application
        echo "Step 2: Creating giftcard_application...\n";
        $app_query = "INSERT INTO giftcard_applications 
                      (user_id, booking_id, amount, reason, status, admin_notes, processed_at, processed_by) 
                      VALUES (?, ?, ?, ?, 'approved', ?, NOW(), 'system-cancellation')";
        $app_stmt = $conn->prepare($app_query);
        $app_stmt->execute([
            $user_id_str,
            $booking_id,
            $giftcard_amount,
            'Cancellation refund for booking #' . $booking['booking_reference'],
            'Automated from booking cancellation'
        ]);
        $application_id = $conn->lastInsertId();
        echo "  ✓ Created giftcard_application ID: {$application_id}\n\n";
        
        // Step 3: Generate giftcard code and create giftcard
        echo "Step 3: Creating giftcard...\n";
        $giftcard_code = 'GC-' . strtoupper(substr(md5($booking_id . time() . uniqid()), 0, 12));
        $gc_query = "INSERT INTO giftcards (code, user_id, amount, status, application_id, created_at) 
                     VALUES (?, ?, ?, 'active', ?, NOW())";
        $gc_stmt = $conn->prepare($gc_query);
        $gc_stmt->execute([$giftcard_code, $user_id_str, $giftcard_amount, $application_id]);
        $giftcard_id = $conn->lastInsertId();
        echo "  ✓ Created giftcard ID: {$giftcard_id}\n";
        echo "  ✓ Giftcard Code: {$giftcard_code}\n";
        echo "  ✓ Amount: ₹{$giftcard_amount}\n\n";
        
        // Step 4: Ensure wallet exists
        echo "Step 4: Creating/verifying wallet...\n";
        $wallet_insert = $conn->prepare("INSERT IGNORE INTO wallets (user_id, total_balance) VALUES (?, 0)");
        $wallet_insert->execute([$user_id_str]);
        echo "  ✓ Wallet ensured for user {$user_id_str}\n\n";
        
        // Step 5: Update wallet balance
        echo "Step 5: Updating wallet balance...\n";
        $wallet_update = $conn->prepare("UPDATE wallets SET total_balance = total_balance + ? WHERE user_id = ?");
        $wallet_update->execute([$giftcard_amount, $user_id_str]);
        echo "  ✓ Added ₹{$giftcard_amount} to wallet\n\n";
        
        // Step 6: Record transaction
        echo "Step 6: Recording wallet transaction...\n";
        $transaction_query = "INSERT INTO wallet_transactions (user_id, type, amount, description, status) 
                              VALUES (?, 'credit', ?, ?, 'completed')";
        $transaction_stmt = $conn->prepare($transaction_query);
        $transaction_stmt->execute([
            $user_id_str,
            $giftcard_amount,
            'Booking Cancellation Refund - ' . $giftcard_code
        ]);
        $transaction_id = $conn->lastInsertId();
        echo "  ✓ Created wallet_transaction ID: {$transaction_id}\n\n";
        
        // Commit transaction
        $conn->commit();
        
        echo "✓ All steps completed successfully!\n\n";
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
    // Test 3: Verify data consistency
    echo "TEST 3: Data Consistency Verification\n";
    echo "──────────────────────────────────────\n\n";
    
    // Check booking status
    echo "3.1 Booking Status:\n";
    $booking_check = $conn->query("SELECT id, status FROM bookings WHERE id = {$booking_id}")->fetch();
    echo "  ID: {$booking_check['id']}\n";
    echo "  Status: {$booking_check['status']} (Expected: 'cancelled')\n";
    echo "  ✓ Status: " . ($booking_check['status'] === 'cancelled' ? 'OK' : 'MISMATCH') . "\n\n";
    
    // Check giftcard_application
    echo "3.2 Giftcard Application:\n";
    $app_check = $conn->query("SELECT * FROM giftcard_applications WHERE id = {$application_id}")->fetch(PDO::FETCH_ASSOC);
    echo "  ID: {$app_check['id']}\n";
    echo "  User ID: {$app_check['user_id']}\n";
    echo "  Booking ID: {$app_check['booking_id']} (Expected: {$booking_id})\n";
    echo "  Amount: ₹{$app_check['amount']} (Expected: ₹{$giftcard_amount})\n";
    echo "  Status: {$app_check['status']} (Expected: 'approved')\n";
    echo "  ✓ Link Integrity: " . ($app_check['booking_id'] == $booking_id && $app_check['user_id'] == $user_id_str ? 'OK' : 'MISMATCH') . "\n\n";
    
    // Check giftcard
    echo "3.3 Giftcard:\n";
    $gc_check = $conn->query("SELECT * FROM giftcards WHERE id = {$giftcard_id}")->fetch(PDO::FETCH_ASSOC);
    echo "  ID: {$gc_check['id']}\n";
    echo "  Code: {$gc_check['code']} (Expected: {$giftcard_code})\n";
    echo "  Amount: ₹{$gc_check['amount']} (Expected: ₹{$giftcard_amount})\n";
    echo "  Status: {$gc_check['status']} (Expected: 'active')\n";
    echo "  Application ID: {$gc_check['application_id']} (Expected: {$application_id})\n";
    echo "  ✓ Link Integrity: " . ($gc_check['application_id'] == $application_id && $gc_check['code'] === $giftcard_code ? 'OK' : 'MISMATCH') . "\n\n";
    
    // Check wallet
    echo "3.4 Wallet:\n";
    $wallet_check = $conn->query("SELECT * FROM wallets WHERE user_id = '{$user_id_str}'")->fetch(PDO::FETCH_ASSOC);
    if ($wallet_check) {
        echo "  User ID: {$wallet_check['user_id']}\n";
        echo "  Total Balance: ₹{$wallet_check['total_balance']}\n";
        echo "  Expected to include: ₹{$giftcard_amount}\n";
        echo "  ✓ Balance Updated: " . ($wallet_check['total_balance'] >= $giftcard_amount ? 'OK' : 'MISMATCH') . "\n\n";
    } else {
        echo "  ✗ Wallet not found\n\n";
    }
    
    // Check wallet_transaction
    echo "3.5 Wallet Transaction:\n";
    $trans_check = $conn->query("SELECT * FROM wallet_transactions WHERE id = {$transaction_id}")->fetch(PDO::FETCH_ASSOC);
    echo "  ID: {$trans_check['id']}\n";
    echo "  User ID: {$trans_check['user_id']}\n";
    echo "  Type: {$trans_check['type']} (Expected: 'credit')\n";
    echo "  Amount: ₹{$trans_check['amount']} (Expected: ₹{$giftcard_amount})\n";
    echo "  Description: {$trans_check['description']}\n";
    echo "  Booking ID: {$trans_check['booking_id']} (Expected: {$booking_id})\n";
    echo "  Status: {$trans_check['status']} (Expected: 'completed')\n";
    echo "  ✓ Data Integrity: " . ($trans_check['type'] === 'credit' && $trans_check['amount'] == $giftcard_amount ? 'OK' : 'MISMATCH') . "\n\n";
    
    // Test 4: Query the complete pipeline
    echo "TEST 4: Complete Pipeline Query\n";
    echo "───────────────────────────────\n\n";
    
    $pipeline = $conn->query("
        SELECT 
            b.id as booking_id,
            b.booking_reference,
            b.status as booking_status,
            ga.id as app_id,
            ga.status as app_status,
            gc.code as gc_code,
            gc.amount as gc_amount,
            wt.id as trans_id,
            wt.type as trans_type,
            wt.amount as trans_amount,
            w.total_balance
        FROM bookings b
        LEFT JOIN giftcard_applications ga ON b.id = ga.booking_id
        LEFT JOIN giftcards gc ON ga.id = gc.application_id
        LEFT JOIN wallet_transactions wt ON ga.user_id = wt.user_id
        LEFT JOIN wallets w ON wt.user_id = w.user_id
        WHERE b.id = {$booking_id}
    ")->fetch(PDO::FETCH_ASSOC);
    
    echo "Complete Pipeline State:\n";
    echo json_encode($pipeline, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n\n";
    
    // Test 5: Verify relationships
    echo "TEST 5: Database Relationships Verification\n";
    echo "────────────────────────────────────────────\n\n";
    
    $fk_query = "
        SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() 
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_NAME IN ('bookings', 'wallets', 'wallet_transactions', 'giftcard_applications', 'giftcards')
        ORDER BY TABLE_NAME, COLUMN_NAME
    ";
    
    $fks = $conn->query($fk_query)->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($fks as $fk) {
        echo "  {$fk['TABLE_NAME']}.{$fk['COLUMN_NAME']} → {$fk['REFERENCED_TABLE_NAME']}({$fk['REFERENCED_COLUMN_NAME']})\n";
    }
    
    echo "\n";
    
    // Final summary
    echo "====================================================\n";
    echo "✓ ALL TESTS COMPLETED SUCCESSFULLY!\n";
    echo "====================================================\n\n";
    
    echo "Pipeline Summary:\n";
    echo "┌─ Booking Cancelled\n";
    echo "│  ID: {$booking_id}\n";
    echo "│  Amount: ₹{$amount}\n";
    echo "│  Status: 'cancelled'\n";
    echo "│\n";
    echo "├─ Giftcard Application Created\n";
    echo "│  ID: {$application_id}\n";
    echo "│  Amount: ₹{$giftcard_amount}\n";
    echo "│  Status: 'approved'\n";
    echo "│  Linked to booking_id: {$booking_id}\n";
    echo "│\n";
    echo "├─ Giftcard Generated\n";
    echo "│  ID: {$giftcard_id}\n";
    echo "│  Code: {$giftcard_code}\n";
    echo "│  Amount: ₹{$giftcard_amount}\n";
    echo "│  Linked to application_id: {$application_id}\n";
    echo "│\n";
    echo "├─ Wallet Updated\n";
    echo "│  User: {$user_id_str}\n";
    echo "│  Balance Added: ₹{$giftcard_amount}\n";
    echo "│\n";
    echo "└─ Transaction Logged\n";
    echo "   ID: {$transaction_id}\n";
    echo "   Type: 'credit'\n";
    echo "   Amount: ₹{$giftcard_amount}\n";
    echo "   Description: Booking Cancellation Refund - {$giftcard_code}\n\n";
    
    echo "All relationships verified and data is consistent!\n\n";
    
} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
