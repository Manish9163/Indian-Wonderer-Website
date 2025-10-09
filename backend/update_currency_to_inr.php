<?php
require_once 'config/database.php';

$database = new Database();
$pdo = $database->getConnection();

try {
    // Update all payments to INR
    $stmt = $pdo->prepare("UPDATE payments SET currency = 'INR' WHERE currency != 'INR'");
    $stmt->execute();
    $updated = $stmt->rowCount();
    
    echo "✅ Updated $updated payments to INR currency\n";
    
    // Show summary
    $summary = $pdo->query("
        SELECT currency, COUNT(*) as count, SUM(amount) as total
        FROM payments
        GROUP BY currency
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\n📊 Currency Summary:\n";
    echo str_repeat("-", 40) . "\n";
    printf("%-10s %10s %15s\n", "Currency", "Count", "Total Amount");
    echo str_repeat("-", 40) . "\n";
    
    foreach ($summary as $row) {
        printf("%-10s %10d ₹%14.2f\n", $row['currency'], $row['count'], $row['total']);
    }
    echo str_repeat("-", 40) . "\n";
    
    echo "\n✅ All payments now use INR currency!\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
