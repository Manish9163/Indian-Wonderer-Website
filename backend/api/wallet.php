<?php
/**
 * Wallet API - Full Implementation
 * Handles balance checks, payments, and database operations
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Database connection using config
    require_once __DIR__ . '/../config/database.php';
    
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        // Force error if database is unavailable
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed. Check database configuration.',
            'debug' => 'Check error_log for details'
        ]);
        exit;
    }
    
    $useMockData = false;
    
    // Get parameters from GET, POST, or JSON
    $requestMethod = $_SERVER['REQUEST_METHOD'];
    
    // Parse POST body if JSON
    $postData = [];
    if ($requestMethod === 'POST' && $_SERVER['CONTENT_TYPE'] === 'application/json') {
        $postData = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $postData = $_POST;
    }
    
    // Get userId and action from either GET or POST
    $userId = $_GET['userId'] ?? $postData['userId'] ?? null;
    $action = $_GET['action'] ?? $postData['action'] ?? 'get';
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID required']);
        exit;
    }
    
    // Ensure wallet table exists
    if (!$useMockData) {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS wallets (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id VARCHAR(255) UNIQUE NOT NULL,
                total_balance DECIMAL(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id VARCHAR(255) NOT NULL,
                type ENUM('credit', 'debit') NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                description VARCHAR(255),
                booking_id VARCHAR(255),
                status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }
    
    if ($action === 'balance') {
        // Get wallet balance
        if ($useMockData) {
            $totalBalance = 10000; // Mock balance
        } else {
            $stmt = $pdo->prepare("SELECT total_balance FROM wallets WHERE user_id = ?");
            $stmt->execute([$userId]);
            $wallet = $stmt->fetch();
            
            if (!$wallet) {
                // Create wallet if doesn't exist
                $pdo->prepare("INSERT INTO wallets (user_id, total_balance) VALUES (?, ?)")
                    ->execute([$userId, 10000]); // Start with 10000
                $totalBalance = 10000;
            } else {
                $totalBalance = (float)$wallet['total_balance'];
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'totalBalance' => $totalBalance
            ]
        ]);
    } 
    elseif ($action === 'check-balance') {
        // Check if user has enough balance for payment
        $amount = $_GET['amount'] ?? $postData['amount'] ?? 0;
        
        if ($useMockData) {
            $totalBalance = 10000;
        } else {
            $stmt = $pdo->prepare("SELECT total_balance FROM wallets WHERE user_id = ?");
            $stmt->execute([$userId]);
            $wallet = $stmt->fetch();
            
            if (!$wallet) {
                $pdo->prepare("INSERT INTO wallets (user_id, total_balance) VALUES (?, ?)")
                    ->execute([$userId, 10000]);
                $totalBalance = 10000;
            } else {
                $totalBalance = (float)$wallet['total_balance'];
            }
        }
        
        $hasEnough = $totalBalance >= (float)$amount;
        
        echo json_encode([
            'success' => true,
            'hasEnough' => $hasEnough,
            'currentBalance' => $totalBalance,
            'requiredAmount' => (float)$amount,
            'shortfall' => max(0, (float)$amount - $totalBalance)
        ]);
    }
    elseif ($action === 'use-for-booking') {
        // Deduct from wallet for booking payment
        $amount = $postData['amount'] ?? 0;
        $bookingId = $postData['bookingId'] ?? null;
        
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid amount']);
            exit;
        }
        
        if ($useMockData) {
            // Mock: just return success
            echo json_encode([
                'success' => true,
                'message' => 'Payment successful from wallet',
                'transactionId' => 'txn_' . uniqid(),
                'newBalance' => 10000 - $amount
            ]);
            exit;
        }
        
        // Check balance first
        $stmt = $pdo->prepare("SELECT total_balance FROM wallets WHERE user_id = ?");
        $stmt->execute([$userId]);
        $wallet = $stmt->fetch();
        
        if (!$wallet) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Wallet not found']);
            exit;
        }
        
        $currentBalance = (float)$wallet['total_balance'];
        
        if ($currentBalance < (float)$amount) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Not enough money to proceed the payment, add money to proceed',
                'currentBalance' => $currentBalance,
                'requiredAmount' => (float)$amount,
                'shortfall' => (float)$amount - $currentBalance
            ]);
            exit;
        }
        
        // Deduct from wallet
        $newBalance = $currentBalance - (float)$amount;
        $pdo->prepare("UPDATE wallets SET total_balance = ? WHERE user_id = ?")
            ->execute([$newBalance, $userId]);
        
        // Record transaction (with fallback if booking_id column doesn't exist)
        try {
            $pdo->prepare("
                INSERT INTO wallet_transactions 
                (user_id, type, amount, description, booking_id, status) 
                VALUES (?, 'debit', ?, ?, ?, 'completed')
            ")->execute([$userId, $amount, "Booking Payment - $bookingId", $bookingId]);
        } catch (Exception $e) {
            // If booking_id column doesn't exist, try without it
            try {
                $pdo->prepare("
                    INSERT INTO wallet_transactions 
                    (user_id, type, amount, description, status) 
                    VALUES (?, 'debit', ?, ?, 'completed')
                ")->execute([$userId, $amount, "Booking Payment - $bookingId"]);
            } catch (Exception $e2) {
                // Log but don't fail the payment
                error_log("Failed to record transaction: " . $e2->getMessage());
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Payment successful from wallet',
            'transactionId' => 'txn_' . uniqid(),
            'newBalance' => $newBalance
        ]);
    }
    elseif ($action === 'add-money') {
        // Add money to wallet
        $amount = $postData['amount'] ?? 0;
        
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid amount']);
            exit;
        }
        
        if ($useMockData) {
            echo json_encode([
                'success' => true,
                'message' => 'Money added successfully',
                'newBalance' => 10000 + $amount
            ]);
            exit;
        }
        
        // Ensure wallet exists
        $pdo->prepare("INSERT IGNORE INTO wallets (user_id, total_balance) VALUES (?, ?)")
            ->execute([$userId, 0]);
        
        // Add money
        $pdo->prepare("UPDATE wallets SET total_balance = total_balance + ? WHERE user_id = ?")
            ->execute([$amount, $userId]);
        
        // Record transaction
        $pdo->prepare("
            INSERT INTO wallet_transactions 
            (user_id, type, amount, description, status) 
            VALUES (?, 'credit', ?, ?, 'completed')
        ")->execute([$userId, $amount, 'Added money to wallet']);
        
        echo json_encode([
            'success' => true,
            'message' => 'Money added successfully',
            'newBalance' => $amount // This should fetch real balance
        ]);
    }
    elseif ($action === 'transactions') {
        // Get transaction history
        if ($useMockData) {
            $transactions = [
                [
                    'id' => '1',
                    'type' => 'credit',
                    'amount' => 10000,
                    'description' => 'Initial balance',
                    'status' => 'completed',
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ];
        } else {
            $stmt = $pdo->prepare("
                SELECT id, type, amount, description, status, created_at 
                FROM wallet_transactions 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 50
            ");
            $stmt->execute([$userId]);
            $transactions = $stmt->fetchAll();
        }
        
        echo json_encode([
            'success' => true,
            'data' => $transactions ?: []
        ]);
    }
    else {
        // Default: Get wallet data with separated gift card and added money balances
        if ($useMockData) {
            $mockWallet = [
                'walletId' => 'w_' . substr(md5($userId), 0, 8),
                'userId' => $userId,
                'totalBalance' => 10000,
                'giftCardBalance' => 5000,
                'addedMoneyBalance' => 5000,
                'lastUpdated' => date('Y-m-d H:i:s'),
                'transactions' => []
            ];
            echo json_encode(['success' => true, 'data' => $mockWallet]);
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT * FROM wallets WHERE user_id = ?");
        $stmt->execute([$userId]);
        $wallet = $stmt->fetch();
        
        if (!$wallet) {
            $pdo->prepare("INSERT INTO wallets (user_id, total_balance) VALUES (?, ?)")
                ->execute([$userId, 0]);
            $wallet = ['total_balance' => 0];
        }
        
        // Calculate gift card balance from gift_cards table
        $giftCardBalance = 0;
        try {
            // Convert VARCHAR user_id to INT for gift_cards lookup
            $userId_int = is_numeric($userId) ? (int)$userId : null;
            if ($userId_int) {
                $stmt = $pdo->prepare("
                    SELECT COALESCE(SUM(balance), 0) as total_balance 
                    FROM gift_cards 
                    WHERE user_id = ? AND status IN ('active', 'pending')
                ");
                $stmt->execute([$userId_int]);
                $giftResult = $stmt->fetch();
                $giftCardBalance = (float)($giftResult['total_balance'] ?? 0);
            }
        } catch (Exception $e) {
            error_log("Error calculating gift card balance: " . $e->getMessage());
            $giftCardBalance = 0;
        }
        
        // Calculate added money balance from wallet_transactions (money_added type)
        $addedMoneyBalance = 0;
        try {
            $stmt = $pdo->prepare("
                SELECT COALESCE(SUM(amount), 0) as total_added 
                FROM wallet_transactions 
                WHERE user_id = ? AND type = 'credit' AND description LIKE '%Added money%'
            ");
            $stmt->execute([$userId]);
            $moneyResult = $stmt->fetch();
            $addedMoneyBalance = (float)($moneyResult['total_added'] ?? 0);
        } catch (Exception $e) {
            error_log("Error calculating added money balance: " . $e->getMessage());
            $addedMoneyBalance = 0;
        }
        
        // Total balance is sum of gift card + added money
        $totalBalance = $giftCardBalance + $addedMoneyBalance;
        
        // Update wallet total_balance if it doesn't match
        if ((float)$wallet['total_balance'] != $totalBalance) {
            $pdo->prepare("UPDATE wallets SET total_balance = ? WHERE user_id = ?")
                ->execute([$totalBalance, $userId]);
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'walletId' => 'w_' . substr(md5($userId), 0, 8),
                'userId' => $userId,
                'totalBalance' => $totalBalance,
                'giftCardBalance' => $giftCardBalance,
                'addedMoneyBalance' => $addedMoneyBalance,
                'lastUpdated' => date('Y-m-d H:i:s')
            ]
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
?>
