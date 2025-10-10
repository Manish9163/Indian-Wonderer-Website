<?php
// Check gift cards in database
$host = 'localhost';
$dbname = 'indian_wonderer_base';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Gift Card Investigation ===\n\n";
    
    // Check total gift cards
    echo "1. Total Gift Cards:\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM gift_cards");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Total: {$result['total']}\n\n";
    
    // Check gift cards by status
    echo "2. Gift Cards by Status:\n";
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM gift_cards GROUP BY status");
    $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($statuses as $status) {
        echo "   {$status['status']}: {$status['count']}\n";
    }
    
    // Check all gift cards with details
    echo "\n3. All Gift Card Details:\n";
    $stmt = $pdo->query("
        SELECT 
            gc.*,
            u.first_name,
            u.last_name,
            u.email,
            u.phone
        FROM gift_cards gc
        JOIN users u ON gc.user_id = u.id
        ORDER BY gc.created_at DESC
    ");
    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($cards as $card) {
        echo "\n   --- Gift Card #{$card['id']} ---\n";
        echo "   Code: {$card['code']}\n";
        echo "   Customer: {$card['first_name']} {$card['last_name']}\n";
        echo "   Email: {$card['email']}\n";
        echo "   Phone: {$card['phone']}\n";
        echo "   Amount: ₹{$card['amount']}\n";
        echo "   Balance: ₹{$card['balance']}\n";
        echo "   Status: {$card['status']}\n";
        echo "   Expiry: {$card['expiry_date']}\n";
        echo "   Created: {$card['created_at']}\n";
    }
    
    // Check refunds with giftcard method
    echo "\n\n4. Refunds with Gift Card Method:\n";
    $stmt = $pdo->query("
        SELECT 
            r.*,
            b.booking_reference,
            u.first_name,
            u.last_name,
            u.email
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
        JOIN users u ON b.user_id = u.id
        WHERE r.method = 'giftcard'
    ");
    $gcRefunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Found: " . count($gcRefunds) . " gift card refunds\n";
    foreach ($gcRefunds as $refund) {
        echo "\n   --- Refund #{$refund['id']} ---\n";
        echo "   Customer: {$refund['first_name']} {$refund['last_name']}\n";
        echo "   Email: {$refund['email']}\n";
        echo "   Booking: {$refund['booking_reference']}\n";
        echo "   Amount: ₹{$refund['amount']}\n";
        echo "   Status: {$refund['status']}\n";
        echo "   Initiated: {$refund['initiated_at']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
