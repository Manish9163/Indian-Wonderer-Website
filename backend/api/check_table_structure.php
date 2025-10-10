<?php
// Check refunds table structure
$host = 'localhost';
$dbname = 'indian_wonderer_base';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Table Structures ===\n\n";
    
    // Check refunds table
    echo "Refunds table:\n";
    $stmt = $pdo->query("DESCRIBE refunds");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    
    // Check tours table
    echo "\nTours table:\n";
    $stmt = $pdo->query("DESCRIBE tours");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    
    // Check gift_cards table
    echo "\nGift_cards table:\n";
    $stmt = $pdo->query("DESCRIBE gift_cards");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    
    // Check bookings table
    echo "\nBookings table:\n";
    $stmt = $pdo->query("DESCRIBE bookings");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
