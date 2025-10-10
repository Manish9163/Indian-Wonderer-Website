<?php
/**
 * Automatic Gift Card Expiry Checker
 * Runs periodically to expire gift cards past their expiry date
 */

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Update expired gift cards
    $stmt = $pdo->prepare("
        UPDATE gift_cards 
        SET status = 'expired'
        WHERE status = 'active' 
        AND expiry_date < CURDATE()
    ");
    
    $stmt->execute();
    $expiredCount = $stmt->rowCount();
    
    // Get list of expired cards
    $stmt = $pdo->prepare("
        SELECT 
            gc.id,
            gc.code,
            gc.balance,
            gc.expiry_date,
            u.first_name,
            u.last_name,
            u.email
        FROM gift_cards gc
        JOIN users u ON gc.user_id = u.id
        WHERE gc.status = 'expired'
        AND gc.expiry_date < CURDATE()
    ");
    
    $stmt->execute();
    $expiredCards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => "Expired {$expiredCount} gift card(s)",
        'expired_count' => $expiredCount,
        'expired_cards' => $expiredCards,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
