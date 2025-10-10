<?php
require_once 'config/database.php';

$database = new Database();
$pdo = $database->getConnection();

$sql = file_get_contents('tour_guide_tables.sql');

try {
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            $pdo->exec($statement);
            echo "✅ Executed: " . substr($statement, 0, 50) . "...\n";
        }
    }
    
    echo "\n✅ All tables created successfully!\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
