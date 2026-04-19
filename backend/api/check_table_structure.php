<?php
require_once __DIR__ . '/../config/config.php';

$host     = Config::getDBHost();
$dbname   = Config::getDBName();
$username = Config::getDBUser();
$password = Config::getDBPass();

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Table Structures ===\n\n";
    
    echo "Refunds table:\n";
    $stmt = $pdo->query("DESCRIBE refunds");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    
    echo "\nTours table:\n";
    $stmt = $pdo->query("DESCRIBE tours");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    
    echo "\nGift_cards table:\n";
    $stmt = $pdo->query("DESCRIBE gift_cards");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    
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
