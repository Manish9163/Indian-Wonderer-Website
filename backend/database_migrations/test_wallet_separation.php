<?php
/**
 * Test Wallet Balance Separation
 * Tests if gift card balance and added money balance are properly separated
 */

require_once __DIR__ . '/../config/database.php';

echo "=== Testing Wallet Balance Separation ===\n\n";

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    $userId = 42;
    $userId_int = (int)$userId;
    
    echo "1. Checking Gift Card Balance (from gift_cards table):\n";
    $stmt = $pdo->prepare("
        SELECT id, code, amount, balance, status 
        FROM gift_cards 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    ");
    $stmt->execute([$userId_int]);
    $giftCards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($giftCards) {
        echo "   Found " . count($giftCards) . " gift cards:\n";
        $totalGiftBalance = 0;
        foreach ($giftCards as $gc) {
            echo "   - Code: {$gc['code']}, Amount: ₹{$gc['amount']}, Balance: ₹{$gc['balance']}, Status: {$gc['status']}\n";
            if ($gc['status'] === 'active' || $gc['status'] === 'pending') {
                $totalGiftBalance += $gc['balance'];
            }
        }
        echo "   Total Gift Card Balance (active/pending): ₹{$totalGiftBalance}\n\n";
    } else {
        echo "   No gift cards found for user {$userId_int}\n\n";
    }
    
    echo "2. Checking Added Money Balance (from wallet_transactions):\n";
    $stmt = $pdo->prepare("
        SELECT id, type, amount, description, status, created_at
        FROM wallet_transactions 
        WHERE user_id = ? AND type = 'credit' AND description LIKE '%Added money%'
        ORDER BY created_at DESC
    ");
    $stmt->execute([$userId]);
    $moneyTransactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($moneyTransactions) {
        echo "   Found " . count($moneyTransactions) . " money additions:\n";
        $totalAddedMoney = 0;
        foreach ($moneyTransactions as $mt) {
            echo "   - Amount: ₹{$mt['amount']}, Status: {$mt['status']}, Date: {$mt['created_at']}\n";
            $totalAddedMoney += $mt['amount'];
        }
        echo "   Total Added Money Balance: ₹{$totalAddedMoney}\n\n";
    } else {
        echo "   No money additions found for user {$userId}\n\n";
    }
    
    echo "3. Total Balance Calculation:\n";
    $totalGiftBalance = $giftCards ? array_sum(array_map(function($gc) {
        return ($gc['status'] === 'active' || $gc['status'] === 'pending') ? $gc['balance'] : 0;
    }, $giftCards)) : 0;
    
    $totalAddedMoney = $moneyTransactions ? array_sum(array_map(function($mt) {
        return $mt['amount'];
    }, $moneyTransactions)) : 0;
    
    $totalBalance = $totalGiftBalance + $totalAddedMoney;
    
    echo "   Gift Card Balance: ₹{$totalGiftBalance}\n";
    echo "   Added Money Balance: ₹{$totalAddedMoney}\n";
    echo "   Total Balance: ₹{$totalBalance}\n\n";
    
    echo "4. Testing Wallet API Response:\n";
    $ch = curl_init("http://localhost/fu/backend/api/wallet.php?userId={$userId}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $apiResponse = curl_exec($ch);
    curl_close($ch);
    
    if ($apiResponse) {
        $data = json_decode($apiResponse, true);
        if ($data['success']) {
            echo "   ✓ API Response Success\n";
            echo "   - Total Balance: ₹" . $data['data']['totalBalance'] . "\n";
            echo "   - Gift Card Balance: ₹" . $data['data']['giftCardBalance'] . "\n";
            echo "   - Added Money Balance: ₹" . $data['data']['addedMoneyBalance'] . "\n\n";
            
            // Verify calculations
            if ($data['data']['giftCardBalance'] == $totalGiftBalance &&
                $data['data']['addedMoneyBalance'] == $totalAddedMoney &&
                $data['data']['totalBalance'] == $totalBalance) {
                echo "   ✓ All calculations verified correctly!\n";
            } else {
                echo "   ✗ Calculation mismatch detected\n";
            }
        } else {
            echo "   ✗ API returned error: " . $data['message'] . "\n";
        }
    } else {
        echo "   ✗ Failed to call API\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
?>
