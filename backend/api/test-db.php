<?php
// Test database connection and check tables
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

echo "=== Database Connection Test ===\n";
if (!$pdo) {
    echo "❌ Database connection FAILED\n";
} else {
    echo "✅ Database connection SUCCESS\n";
}

echo "\n=== Checking Wallet Tables ===\n";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'wallet%'");
    $tables = $stmt->fetchAll();
    if ($tables) {
        echo "Found wallet tables:\n";
        foreach ($tables as $table) {
            echo "  - " . $table[0] . "\n";
        }
    } else {
        echo "❌ No wallet tables found\n";
    }
} catch (Exception $e) {
    echo "Error checking tables: " . $e->getMessage() . "\n";
}

echo "\n=== Checking Data ===\n";
try {
    $stmt = $pdo->query("SELECT * FROM wallets LIMIT 5");
    $wallets = $stmt->fetchAll();
    echo "Total wallets: " . count($wallets) . "\n";
    if ($wallets) {
        foreach ($wallets as $wallet) {
            echo "  User: {$wallet['user_id']}, Balance: {$wallet['total_balance']}\n";
        }
    }
} catch (Exception $e) {
    echo "Error reading wallets: " . $e->getMessage() . "\n";
}
?>
