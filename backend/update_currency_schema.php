<?php
require_once 'config/database.php';

$database = new Database();
$pdo = $database->getConnection();

try {
    // Update default currency to INR
    $pdo->exec("ALTER TABLE payments MODIFY COLUMN currency VARCHAR(3) DEFAULT 'INR'");
    
    echo "✅ Updated payments table default currency to INR\n";
    
    // Show table structure
    $result = $pdo->query("SHOW COLUMNS FROM payments LIKE 'currency'")->fetch(PDO::FETCH_ASSOC);
    echo "\nColumn Details:\n";
    echo "Field: " . $result['Field'] . "\n";
    echo "Type: " . $result['Type'] . "\n";
    echo "Default: " . $result['Default'] . "\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
