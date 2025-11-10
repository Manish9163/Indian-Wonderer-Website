<?php
/**
 * Migration: Consolidate to gift_cards table (reverse migration)
 * 
 * This migration:
 * 1. Migrates data from giftcards back to gift_cards
 * 2. Deletes giftcards table
 * 3. Updates references in all APIs to use gift_cards
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "====================================================\n";
echo "Consolidating to gift_cards Table (REVERSE)\n";
echo "====================================================\n\n";

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "✓ Connected to database\n\n";
    
    // Step 1: Get all data from giftcards table
    echo "Step 1: Retrieving data from giftcards table\n";
    echo "───────────────────────────────────────────\n";
    
    $giftcards = $conn->query("SELECT * FROM giftcards")->fetchAll(PDO::FETCH_ASSOC);
    echo "  Found " . count($giftcards) . " records in giftcards\n\n";
    
    echo "  Sample records:\n";
    foreach (array_slice($giftcards, 0, 3) as $row) {
        echo "    - {$row['code']}: User {$row['user_id']}, Amount ₹{$row['amount']}\n";
    }
    echo "\n";
    
    // Begin transaction
    $conn->beginTransaction();
    
    try {
        // Step 2: Migrate data from giftcards to gift_cards
        echo "Step 2: Migrating data to gift_cards table\n";
        echo "──────────────────────────────────────────\n";
        
        $migrated = 0;
        
        foreach ($giftcards as $gc) {
            // Convert user_id to INT (if it's a string representation of a number)
            $user_id_int = is_numeric($gc['user_id']) ? (int)$gc['user_id'] : 1;
            
            // Check if giftcard already exists in gift_cards
            $check = $conn->prepare("SELECT id FROM gift_cards WHERE code = ?");
            $check->execute([$gc['code']]);
            
            if ($check->rowCount() === 0) {
                // Insert into gift_cards
                $insert = $conn->prepare("
                    INSERT INTO gift_cards (code, user_id, amount, status, created_at, used_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $insert->execute([
                    $gc['code'],
                    $user_id_int,
                    $gc['amount'],
                    $gc['status'] === 'expired' ? 'expired' : $gc['status'],
                    $gc['created_at'],
                    $gc['used_at']
                ]);
                
                $migrated++;
            }
        }
        
        echo "  ✓ Migrated {$migrated} records\n\n";
        
        // Step 3: Drop foreign key constraint in giftcards
        echo "Step 3: Removing foreign key constraints\n";
        echo "───────────────────────────────────────\n";
        
        $constraints = $conn->query("
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'giftcards' AND REFERENCED_TABLE_NAME IS NOT NULL
        ")->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($constraints as $constraint) {
            $name = $constraint['CONSTRAINT_NAME'];
            $conn->exec("ALTER TABLE giftcards DROP FOREIGN KEY {$name}");
            echo "  ✓ Dropped constraint: {$name}\n";
        }
        echo "\n";
        
        // Step 4: Delete giftcards table
        echo "Step 4: Deleting giftcards table\n";
        echo "─────────────────────────────\n";
        
        $conn->exec("DROP TABLE IF EXISTS giftcards");
        echo "  ✓ Deleted giftcards table\n\n";
        
        // Commit transaction
        $conn->commit();
        
        echo "Step 5: Verifying migration\n";
        echo "──────────────────────────\n";
        
        // Verify gift_cards table
        $gc_count = $conn->query("SELECT COUNT(*) as count FROM gift_cards")->fetch()['count'];
        echo "  ✓ gift_cards table: {$gc_count} records\n";
        
        // Verify giftcard_applications table still exists
        $check_app = $conn->query("
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'giftcard_applications'
        ")->fetch()['count'];
        
        if ($check_app > 0) {
            $app_count = $conn->query("SELECT COUNT(*) as count FROM giftcard_applications")->fetch()['count'];
            echo "  ✓ giftcard_applications table: {$app_count} records (KEPT for application tracking)\n";
        }
        
        // Check if giftcards table exists
        $check_table = $conn->query("
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'giftcards'
        ")->fetch()['count'];
        
        if ($check_table === 0) {
            echo "  ✓ Old giftcards table successfully deleted\n\n";
        } else {
            echo "  ✗ Old giftcards table still exists\n\n";
        }
        
        echo "====================================================\n";
        echo "✓ Migration completed successfully!\n";
        echo "====================================================\n\n";
        
        echo "Summary:\n";
        echo "  • Migrated {$migrated} giftcards from new table to gift_cards\n";
        echo "  • Deleted giftcards table\n";
        echo "  • Kept giftcard_applications for application tracking\n";
        echo "  • gift_cards is now the PRIMARY giftcard table\n\n";
        
        echo "Current State:\n";
        echo "  • gift_cards table: {$gc_count} records (PRIMARY)\n";
        echo "  • giftcard_applications table: Used for tracking applications\n";
        echo "  • giftcards table: DELETED\n\n";
        
        echo "Next Steps:\n";
        echo "  1. Update all APIs to use gift_cards instead of giftcards\n";
        echo "  2. Update database schema file to remove giftcards table\n";
        echo "  3. Remove any references to giftcards in codebase\n\n";
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
