<?php
/**
 * Gift Card API
 * Handles gift card applications and admin processing
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
    require_once __DIR__ . '/../config/database.php';
    
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed'
        ]);
        exit;
    }

    // Create necessary tables
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS giftcard_applications (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(255) NOT NULL,
            booking_id INT,
            amount DECIMAL(10, 2) NOT NULL,
            reason VARCHAR(255),
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            admin_notes VARCHAR(500),
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP NULL,
            processed_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES wallets(user_id) ON DELETE CASCADE,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
        )
    ");

    // Note: Using gift_cards table (primary giftcard table)
    // giftcards table has been deleted and consolidated into gift_cards

    // Get parameters
    $requestMethod = $_SERVER['REQUEST_METHOD'];

    // Parse JSON body if POST
    $postData = [];
    if ($requestMethod === 'POST' && strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
        $postData = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $postData = $_POST;
    }

    // Get action and userId from GET, POST, or JSON body
    $action = $_GET['action'] ?? $postData['action'] ?? null;
    $userId = $_GET['userId'] ?? $postData['userId'] ?? null;

    // ========== USER ACTIONS ==========
    
    if ($action === 'apply') {
        // User applies for gift card
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID required']);
            exit;
        }

        $amount = $postData['amount'] ?? 0;
        $reason = $postData['reason'] ?? null;

        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid amount']);
            exit;
        }

        // Check if user already has pending application
        $stmt = $pdo->prepare("
            SELECT id FROM giftcard_applications 
            WHERE user_id = ? AND status = 'pending'
        ");
        $stmt->execute([$userId]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'You already have a pending gift card application'
            ]);
            exit;
        }

        // Create application
        $stmt = $pdo->prepare("
            INSERT INTO giftcard_applications (user_id, booking_id, amount, reason)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$userId, null, $amount, $reason]);

        echo json_encode([
            'success' => true,
            'message' => 'Gift card application submitted successfully',
            'applicationId' => $pdo->lastInsertId()
        ]);
        exit;
    }

    elseif ($action === 'get-status') {
        // Get user's gift card application status
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID required']);
            exit;
        }

        $stmt = $pdo->prepare("
            SELECT id, amount, reason, status, applied_at, processed_at, admin_notes
            FROM giftcard_applications
            WHERE user_id = ?
            ORDER BY applied_at DESC
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $application = $stmt->fetch();

        if (!$application) {
            echo json_encode([
                'success' => true,
                'hasApplication' => false,
                'message' => 'No application found'
            ]);
            exit;
        }

        echo json_encode([
            'success' => true,
            'hasApplication' => true,
            'application' => $application
        ]);
        exit;
    }

    // ========== ADMIN ACTIONS ==========
    
    elseif ($action === 'admin-list') {
        // List all gift card applications (admin only)
        $status = $_GET['status'] ?? null;
        
        $query = "SELECT id, user_id, amount, reason, status, applied_at, processed_at, processed_by, admin_notes FROM giftcard_applications";
        
        if ($status && $status !== 'all') {
            $query .= " WHERE status = ?";
        }
        
        $query .= " ORDER BY applied_at DESC";
        
        $stmt = $pdo->prepare($query);
        if ($status && $status !== 'all') {
            $stmt->execute([$status]);
        } else {
            $stmt->execute();
        }
        
        $applications = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $applications
        ]);
        exit;
    }

    elseif ($action === 'admin-approve') {
        // Admin approves gift card application
        $applicationId = $postData['applicationId'] ?? null;
        $adminId = $postData['adminId'] ?? null;
        $adminNotes = $postData['adminNotes'] ?? null;

        if (!$applicationId || !$adminId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Application ID and Admin ID required']);
            exit;
        }

        // Get application details
        $stmt = $pdo->prepare("SELECT user_id, amount FROM giftcard_applications WHERE id = ? AND status = 'pending'");
        $stmt->execute([$applicationId]);
        $application = $stmt->fetch();

        if (!$application) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Application not found or already processed']);
            exit;
        }

        // Begin transaction for data consistency
        $pdo->beginTransaction();

        try {
            // 1. Update application status
            $stmt = $pdo->prepare("
                UPDATE giftcard_applications 
                SET status = 'approved', processed_by = ?, processed_at = NOW(), admin_notes = ?
                WHERE id = ?
            ");
            $stmt->execute([$adminId, $adminNotes, $applicationId]);

            // 2. Generate gift card code
            $giftcardCode = 'GC-' . strtoupper(substr(md5($applicationId . time()), 0, 12));

            // 3. Create gift card in gift_cards table (PRIMARY TABLE)
            // Convert user_id to INT for gift_cards table
            $user_id_int = is_numeric($application['user_id']) ? (int)$application['user_id'] : 1;
            
            $stmt = $pdo->prepare("
                INSERT INTO gift_cards (code, user_id, amount, balance, status, created_at)
                VALUES (?, ?, ?, ?, 'active', NOW())
            ");
            $stmt->execute([$giftcardCode, $user_id_int, $application['amount'], $application['amount']]);

            // 4. Ensure wallet exists for user (using VARCHAR user_id)
            $pdo->prepare("INSERT IGNORE INTO wallets (user_id, total_balance) VALUES (?, 0)")
                ->execute([$application['user_id']]);

            // 5. Add gift card amount to wallet INSTANTLY
            $pdo->prepare("UPDATE wallets SET total_balance = total_balance + ? WHERE user_id = ?")
                ->execute([$application['amount'], $application['user_id']]);

            // 6. Record transaction for audit trail
            $pdo->prepare("
                INSERT INTO wallet_transactions 
                (user_id, type, amount, description, status) 
                VALUES (?, 'credit', ?, ?, 'completed')
            ")->execute([$application['user_id'], $application['amount'], 'Gift Card Approved - ' . $giftcardCode]);

            // Commit transaction
            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Gift card approved and amount added to wallet instantly',
                'giftcardCode' => $giftcardCode,
                'amount' => $application['amount'],
                'walletUpdated' => true
            ]);
            exit;

        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to approve gift card: ' . $e->getMessage()
            ]);
            exit;
        }
    }

    elseif ($action === 'admin-reject') {
        // Admin rejects gift card application
        $applicationId = $postData['applicationId'] ?? null;
        $adminId = $postData['adminId'] ?? null;
        $reason = $postData['reason'] ?? null;

        if (!$applicationId || !$adminId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Application ID and Admin ID required']);
            exit;
        }

        // Update application status
        $stmt = $pdo->prepare("
            UPDATE giftcard_applications 
            SET status = 'rejected', processed_by = ?, processed_at = NOW(), admin_notes = ?
            WHERE id = ?
        ");
        $stmt->execute([$adminId, $reason, $applicationId]);

        echo json_encode([
            'success' => true,
            'message' => 'Gift card application rejected'
        ]);
        exit;
    }

    // ========== GET GIFT CARD HISTORY ==========
    
    elseif ($action === 'user-giftcards') {
        // Get user's gift cards
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID required']);
            exit;
        }

        // Convert user_id to INT for gift_cards table lookup
        $user_id_int = is_numeric($userId) ? (int)$userId : 1;

        $stmt = $pdo->prepare("
            SELECT id, code, amount, status, created_at, used_at
            FROM gift_cards
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$user_id_int]);
        $giftcards = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $giftcards
        ]);
        exit;
    }

    else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        exit;
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
