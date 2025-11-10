<?php
require 'backend/config/database.php';
$db = new Database();
$conn = $db->getConnection();

echo "====================================================\n";
echo "Checking Both Giftcard Tables\n";
echo "====================================================\n\n";

// Check gift_cards table structure
echo "1. GIFT_CARDS TABLE STRUCTURE:\n";
$result = $conn->query("DESCRIBE gift_cards")->fetchAll(PDO::FETCH_ASSOC);
foreach ($result as $col) {
    echo "   {$col['Field']} ({$col['Type']})\n";
}

echo "\n2. GIFT_CARDS TABLE DATA COUNT:\n";
$count = $conn->query("SELECT COUNT(*) as count FROM gift_cards")->fetch()['count'];
echo "   Records: {$count}\n";

if ($count > 0) {
    echo "\n   Sample data:\n";
    $samples = $conn->query("SELECT * FROM gift_cards LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($samples as $row) {
        echo "   - ID: {$row['id']}, User: {$row['user_id']}, Amount: {$row['amount']}, Code: {$row['code']}\n";
    }
}

// Check giftcards table structure
echo "\n3. GIFTCARDS TABLE STRUCTURE:\n";
$result = $conn->query("DESCRIBE giftcards")->fetchAll(PDO::FETCH_ASSOC);
foreach ($result as $col) {
    echo "   {$col['Field']} ({$col['Type']})\n";
}

echo "\n4. GIFTCARDS TABLE DATA COUNT:\n";
$count = $conn->query("SELECT COUNT(*) as count FROM giftcards")->fetch()['count'];
echo "   Records: {$count}\n";

if ($count > 0) {
    echo "\n   Sample data:\n";
    $samples = $conn->query("SELECT * FROM giftcards LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($samples as $row) {
        echo "   - ID: {$row['id']}, User: {$row['user_id']}, Amount: {$row['amount']}, Code: {$row['code']}, App ID: {$row['application_id']}\n";
    }
}

// Check foreign keys
echo "\n5. FOREIGN KEY RELATIONSHIPS:\n";
$fks = $conn->query("
    SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ('gift_cards', 'giftcards')
    AND REFERENCED_TABLE_NAME IS NOT NULL
")->fetchAll(PDO::FETCH_ASSOC);

foreach ($fks as $fk) {
    echo "   {$fk['TABLE_NAME']}.{$fk['COLUMN_NAME']} → {$fk['REFERENCED_TABLE_NAME']}({$fk['REFERENCED_COLUMN_NAME']})\n";
}

echo "\n====================================================\n";
?>
