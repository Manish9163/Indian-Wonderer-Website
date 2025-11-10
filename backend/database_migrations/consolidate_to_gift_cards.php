<?php
/**
 * Migration: Restore gift_cards table and consolidate data
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "====================================================\n";
echo "Consolidating to gift_cards (Restore & Migrate)\n";
echo "====================================================\n\n";

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "✓ Connected to database\n\n";
    
    // Step 1: Check if gift_cards exists, if not create it
    echo "Step 1: Restore gift_cards table if needed\n";
    echo "──────────────────────────────────────────\n";
    
    $check_table = $conn->query("
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'gift_cards'
    ")->fetch()['count'];
    
    if ($check_table === 0) {
        echo "  Creating gift_cards table...\n";
        $conn->exec("
            CREATE TABLE gift_cards (
                id INT PRIMARY KEY AUTO_INCREMENT,
                code VARCHAR(50) UNIQUE NOT NULL,
                user_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                balance DECIMAL(10,2),
                expiry_date DATE,
                status ENUM('active','used','expired','cancelled') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ");
        echo "  ✓ gift_cards table created\n\n";
    } else {
        echo "  ✓ gift_cards table already exists\n\n";
    }
    
    // Step 2: Get data from giftcards
    echo "Step 2: Retrieve data from giftcards table\n";
    echo "──────────────────────────────────────────\n";
    
    $giftcards_data = $conn->query("SELECT * FROM giftcards")->fetchAll(PDO::FETCH_ASSOC);
    echo "  Found " . count($giftcards_data) . " records\n\n";
    
    // Begin transaction
    $conn->beginTransaction();
    
    try {
        // Step 3: Migrate data
        echo "Step 3: Migrating data to gift_cards\n";
        echo "───────────────────────────────────\n";
        
        $migrated = 0;
        
        foreach ($giftcards_data as $gc) {
            // Convert user_id to INT (fallback to 1 if string)
            $user_id_int = is_numeric($gc['user_id']) ? (int)$gc['user_id'] : 1;
            
            // Check if already exists
            $check = $conn->prepare("SELECT id FROM gift_cards WHERE code = ?");
            $check->execute([$gc['code']]);
            
            if ($check->rowCount() === 0) {
                $insert = $conn->prepare("
                    INSERT INTO gift_cards (code, user_id, amount, balance, status, created_at, used_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $insert->execute([
                    $gc['code'],
                    $user_id_int,
                    $gc['amount'],
                    $gc['amount'],  // balance = amount for active
                    $gc['status'],
                    $gc['created_at'],
                    $gc['used_at']
                ]);
                $migrated++;
            }
        }
        
        echo "  ✓ Migrated {$migrated} records\n\n";
        
        // Step 4: Drop giftcards foreign keys
        echo "Step 4: Removing foreign key constraints from giftcards\n";
        echo "────────────────────────────────────────────────────\n";
        
        $constraints = $conn->query("
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'giftcards' AND REFERENCED_TABLE_NAME IS NOT NULL
        ")->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($constraints as $constraint) {
            $name = $constraint['CONSTRAINT_NAME'];
            $conn->exec("ALTER TABLE giftcards DROP FOREIGN KEY {$name}");
            echo "  ✓ Dropped: {$name}\n";
        }
        echo "\n";
        
        // Step 5: Delete giftcards table
        echo "Step 5: Deleting giftcards table\n";
        echo "───────────────────────────────\n";
        
        $conn->exec("DROP TABLE IF EXISTS giftcards");
        echo "  ✓ Deleted giftcards table\n\n";
        
        // Commit
        $conn->commit();
        
        // Verify
        echo "Step 6: Verification\n";
        echo "───────────────────\n";
        
        $gc_count = $conn->query("SELECT COUNT(*) as count FROM gift_cards")->fetch()['count'];
        echo "  ✓ gift_cards: {$gc_count} records\n";
        
        $check_giftcards = $conn->query("
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'giftcards'
        ")->fetch()['count'];
        
        if ($check_giftcards === 0) {
            echo "  ✓ giftcards table deleted\n\n";
        }
        
        echo "====================================================\n";
        echo "✓ CONSOLIDATION COMPLETE\n";
        echo "====================================================\n\n";
        
        echo "Summary:\n";
        echo "  • gift_cards table: PRIMARY table ({$gc_count} records)\n";
        echo "  • giftcards table: DELETED\n";
        echo "  • giftcard_applications: Kept for application tracking\n\n";
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
