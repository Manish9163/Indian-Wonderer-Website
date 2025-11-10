<?php
/**
 * Test Wallet Balance with Mock Data
 * Creates test gift cards and money transactions to verify separation works
 */

require_once __DIR__ . '/../config/database.php';

echo "=== Testing Wallet Balance Separation with Mock Data ===\n\n";

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    $testUserId = '1';  // Use valid user ID
    $testUserId_int = 1;
    
    echo "1. Creating test data for user {$testUserId}:\n\n";
    
    // Create wallet
    $pdo->prepare("INSERT IGNORE INTO wallets (user_id, total_balance) VALUES (?, 0)")
        ->execute([$testUserId]);
    echo "   ✓ Wallet created\n";
    
    // Create 2 gift cards
    $pdo->prepare("
        INSERT INTO gift_cards (code, user_id, amount, balance, expiry_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', NOW())
    ")->execute(['GC-TEST001', $testUserId_int, 5000, 5000, '2025-12-31']);
    echo "   ✓ Gift Card 1 created: GC-TEST001 with ₹5000\n";
    
    $pdo->prepare("
        INSERT INTO gift_cards (code, user_id, amount, balance, expiry_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', NOW())
    ")->execute(['GC-TEST002', $testUserId_int, 3000, 3000, '2025-12-31']);
    echo "   ✓ Gift Card 2 created: GC-TEST002 with ₹3000\n";
    
    // Add money transactions
    $pdo->prepare("
        INSERT INTO wallet_transactions (user_id, type, amount, description, status, created_at)
        VALUES (?, 'credit', ?, 'Added money to wallet', 'completed', NOW())
    ")->execute([$testUserId, 2000]);
    echo "   ✓ Money Added 1: ₹2000\n";
    
    $pdo->prepare("
        INSERT INTO wallet_transactions (user_id, type, amount, description, status, created_at)
        VALUES (?, 'credit', ?, 'Added money to wallet', 'completed', NOW())
    ")->execute([$testUserId, 1000]);
    echo "   ✓ Money Added 2: ₹1000\n\n";
    
    echo "2. Test Results:\n";
    echo "   Expected Gift Card Balance: ₹8000 (5000 + 3000)\n";
    echo "   Expected Added Money Balance: ₹3000 (2000 + 1000)\n";
    echo "   Expected Total Balance: ₹11000\n\n";
    
    echo "3. Querying from Database:\n";
    
    // Check gift cards
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(balance), 0) as total_balance 
        FROM gift_cards 
        WHERE user_id = ? AND status IN ('active', 'pending')
    ");
    $stmt->execute([$testUserId_int]);
    $giftResult = $stmt->fetch();
    $giftCardBalance = (float)$giftResult['total_balance'];
    echo "   ✓ Gift Card Balance from DB: ₹{$giftCardBalance}\n";
    
    // Check added money
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as total_added 
        FROM wallet_transactions 
        WHERE user_id = ? AND type = 'credit' AND description LIKE '%Added money%'
    ");
    $stmt->execute([$testUserId]);
    $moneyResult = $stmt->fetch();
    $addedMoneyBalance = (float)$moneyResult['total_added'];
    echo "   ✓ Added Money Balance from DB: ₹{$addedMoneyBalance}\n";
    
    $totalBalance = $giftCardBalance + $addedMoneyBalance;
    echo "   ✓ Total Balance from DB: ₹{$totalBalance}\n\n";
    
    echo "4. Testing API Endpoint:\n";
    $ch = curl_init("http://localhost/fu/backend/api/wallet.php?userId={$testUserId}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $apiResponse = curl_exec($ch);
    curl_close($ch);
    
    if ($apiResponse) {
        $data = json_decode($apiResponse, true);
        if ($data['success']) {
            echo "   ✓ API returned success\n";
            echo "   - Gift Card Balance: ₹" . $data['data']['giftCardBalance'] . "\n";
            echo "   - Added Money Balance: ₹" . $data['data']['addedMoneyBalance'] . "\n";
            echo "   - Total Balance: ₹" . $data['data']['totalBalance'] . "\n\n";
            
            // Verify
            if ($data['data']['giftCardBalance'] == 8000 &&
                $data['data']['addedMoneyBalance'] == 3000 &&
                $data['data']['totalBalance'] == 11000) {
                echo "   ✅ ALL TESTS PASSED - Balance separation working correctly!\n";
            } else {
                echo "   ❌ VERIFICATION FAILED\n";
                echo "      Expected: GC=8000, Money=3000, Total=11000\n";
                echo "      Got: GC=" . $data['data']['giftCardBalance'] . ", Money=" . $data['data']['addedMoneyBalance'] . ", Total=" . $data['data']['totalBalance'] . "\n";
            }
        } else {
            echo "   ✗ API Error: " . $data['message'] . "\n";
        }
    } else {
        echo "   ✗ Failed to call API\n";
    }
    
    echo "\n5. Cleaning up test data:\n";
    $pdo->prepare("DELETE FROM gift_cards WHERE code LIKE 'GC-TEST%'")->execute();
    echo "   ✓ Test gift cards deleted\n";
    
    $pdo->prepare("DELETE FROM wallet_transactions WHERE user_id = ? AND description LIKE '%Added money%'", [$testUserId])->execute();
    echo "   ✓ Test transactions deleted\n";
    
    $pdo->prepare("DELETE FROM wallets WHERE user_id = ?")->execute([$testUserId]);
    echo "   ✓ Test wallet deleted\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
?>
