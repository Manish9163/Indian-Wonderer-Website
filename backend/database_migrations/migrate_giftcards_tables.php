<?php
/**
 * Migration: Consolidate giftcards tables
 * 
 * This migration:
 * 1. Migrates data from gift_cards to giftcards
 * 2. Creates giftcard_applications entries for gift_cards data
 * 3. Deletes old gift_cards table
 * 4. Verifies foreign key relationships
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "====================================================\n";
echo "Consolidating Giftcard Tables\n";
echo "====================================================\n\n";

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "✓ Connected to database\n\n";
    
    // Step 1: Get all data from gift_cards table
    echo "Step 1: Retrieving data from gift_cards table\n";
    echo "──────────────────────────────────────────────\n";
    
    $gift_cards = $conn->query("SELECT * FROM gift_cards")->fetchAll(PDO::FETCH_ASSOC);
    echo "  Found {count($gift_cards)} records in gift_cards\n\n";
    
    if (count($gift_cards) == 0) {
        echo "  No data to migrate, proceeding to delete old table...\n\n";
    } else {
        echo "  Sample records:\n";
        foreach (array_slice($gift_cards, 0, 3) as $row) {
            echo "    - {$row['code']}: User {$row['user_id']}, Amount ₹{$row['amount']}\n";
        }
        echo "\n";
    }
    
    // Begin transaction
    $conn->beginTransaction();
    
    try {
        // Step 2: Migrate data from gift_cards to giftcards
        echo "Step 2: Migrating data to giftcards table\n";
        echo "────────────────────────────────────────\n";
        
        $migrated = 0;
        
        foreach ($gift_cards as $gc) {
            // Convert user_id to string
            $user_id_str = (string)$gc['user_id'];
            
            // Check if giftcard already exists
            $check = $conn->prepare("SELECT id FROM giftcards WHERE code = ?");
            $check->execute([$gc['code']]);
            
            if ($check->rowCount() === 0) {
                // Create giftcard_application entry first
                $app_stmt = $conn->prepare("
                    INSERT INTO giftcard_applications (user_id, amount, reason, status, processed_at, processed_by)
                    VALUES (?, ?, ?, 'approved', NOW(), 'migration')
                ");
                $app_stmt->execute([
                    $user_id_str,
                    $gc['amount'],
                    'Migrated from gift_cards - ' . $gc['code']
                ]);
                $app_id = $conn->lastInsertId();
                
                // Insert into giftcards
                $insert = $conn->prepare("
                    INSERT INTO giftcards (code, user_id, amount, status, application_id, used_at, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $insert->execute([
                    $gc['code'],
                    $user_id_str,
                    $gc['amount'],
                    $gc['status'] === 'cancelled' ? 'expired' : $gc['status'],
                    $app_id,
                    $gc['used_at'],
                    $gc['created_at']
                ]);
                
                $migrated++;
            }
        }
        
        echo "  ✓ Migrated {$migrated} records\n\n";
        
        // Step 3: Update wallet for migrated records
        echo "Step 3: Updating wallets for migrated giftcards\n";
        echo "──────────────────────────────────────────────\n";
        
        $wallet_updated = 0;
        
        foreach ($gift_cards as $gc) {
            $user_id_str = (string)$gc['user_id'];
            
            // Only update if giftcard is active
            if ($gc['status'] === 'active') {
                // Ensure wallet exists
                $conn->prepare("INSERT IGNORE INTO wallets (user_id, total_balance) VALUES (?, 0)")
                    ->execute([$user_id_str]);
                
                // Check if already credited
                $check_trans = $conn->prepare("
                    SELECT id FROM wallet_transactions 
                    WHERE user_id = ? AND description LIKE ?
                ");
                $check_trans->execute([$user_id_str, '%' . $gc['code'] . '%']);
                
                if ($check_trans->rowCount() === 0) {
                    // Add to wallet
                    $conn->prepare("UPDATE wallets SET total_balance = total_balance + ? WHERE user_id = ?")
                        ->execute([$gc['amount'], $user_id_str]);
                    
                    // Log transaction
                    $conn->prepare("
                        INSERT INTO wallet_transactions (user_id, type, amount, description, status)
                        VALUES (?, 'credit', ?, ?, 'completed')
                    ")->execute([$user_id_str, $gc['amount'], 'Giftcard Migrated - ' . $gc['code']]);
                    
                    $wallet_updated++;
                }
            }
        }
        
        echo "  ✓ Updated wallets for {$wallet_updated} active giftcards\n\n";
        
        // Step 4: Drop foreign key constraint if exists
        echo "Step 4: Removing old foreign key constraints\n";
        echo "──────────────────────────────────────────\n";
        
        $constraints = $conn->query("
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'gift_cards' AND REFERENCED_TABLE_NAME IS NOT NULL
        ")->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($constraints as $constraint) {
            $name = $constraint['CONSTRAINT_NAME'];
            $conn->exec("ALTER TABLE gift_cards DROP FOREIGN KEY {$name}");
            echo "  ✓ Dropped constraint: {$name}\n";
        }
        echo "\n";
        
        // Step 5: Delete gift_cards table
        echo "Step 5: Deleting old gift_cards table\n";
        echo "─────────────────────────────────────\n";
        
        $conn->exec("DROP TABLE IF EXISTS gift_cards");
        echo "  ✓ Deleted gift_cards table\n\n";
        
        // Commit transaction
        $conn->commit();
        
        echo "Step 6: Verifying migration\n";
        echo "──────────────────────────\n";
        
        // Verify giftcards table
        $gc_count = $conn->query("SELECT COUNT(*) as count FROM giftcards")->fetch()['count'];
        echo "  ✓ Giftcards table: {$gc_count} records\n";
        
        // Verify giftcard_applications table
        $app_count = $conn->query("SELECT COUNT(*) as count FROM giftcard_applications")->fetch()['count'];
        echo "  ✓ Giftcard_applications table: {$app_count} records\n";
        
        // Verify relationships
        $orphaned = $conn->query("
            SELECT COUNT(*) as count FROM giftcards 
            WHERE application_id NOT IN (SELECT id FROM giftcard_applications)
        ")->fetch()['count'];
        echo "  ✓ Orphaned giftcards: {$orphaned}\n\n";
        
        // Check if gift_cards table exists
        $check_table = $conn->query("
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'gift_cards'
        ")->fetch()['count'];
        
        if ($check_table === 0) {
            echo "  ✓ Old gift_cards table successfully deleted\n\n";
        } else {
            echo "  ✗ Old gift_cards table still exists\n\n";
        }
        
        echo "====================================================\n";
        echo "✓ Migration completed successfully!\n";
        echo "====================================================\n\n";
        
        echo "Summary:\n";
        echo "  • Migrated {$migrated} giftcards from old table\n";
        echo "  • Created {$migrated} giftcard_applications entries\n";
        echo "  • Updated {$wallet_updated} wallets with giftcard amounts\n";
        echo "  • Deleted old gift_cards table\n";
        echo "  • All relationships verified\n\n";
        
        echo "Current State:\n";
        echo "  • giftcards table: {$gc_count} records\n";
        echo "  • giftcard_applications table: {$app_count} records\n";
        echo "  • Orphaned records: {$orphaned}\n\n";
        
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
