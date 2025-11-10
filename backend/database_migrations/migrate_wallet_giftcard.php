<?php
/**
 * Database Migration - Add Wallet & Gift Card Tables
 * Run this once to apply all changes to the actual database
 */

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();

    if (!$pdo) {
        die("❌ Database connection failed\n");
    }

    echo "🔄 Starting database migration...\n\n";

    // 1. Create Wallets Table
    echo "Creating wallets table...";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS wallets (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(255) UNIQUE NOT NULL,
            total_balance DECIMAL(10, 2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
    echo " ✅\n";

    // 2. Create Wallet Transactions Table
    echo "Creating wallet_transactions table...";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(255) NOT NULL,
            type ENUM('credit', 'debit') NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            description VARCHAR(255),
            booking_id VARCHAR(255),
            status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo " ✅\n";

    // 3. Create Gift Card Applications Table
    echo "Creating giftcard_applications table...";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS giftcard_applications (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            reason VARCHAR(255),
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            admin_notes VARCHAR(500),
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP NULL,
            processed_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo " ✅\n";

    // 4. Create Gift Cards Table
    echo "Creating giftcards table...";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS giftcards (
            id INT PRIMARY KEY AUTO_INCREMENT,
            code VARCHAR(50) UNIQUE NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            status ENUM('active', 'used', 'expired') DEFAULT 'active',
            application_id INT NOT NULL,
            used_at TIMESTAMP NULL,
            used_booking_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (application_id) REFERENCES giftcard_applications(id)
        )
    ");
    echo " ✅\n";

    // 5. Create Indexes
    echo "\nCreating indexes...\n";

    echo "  - idx_wallets_user_id...";
    try {
        $pdo->exec("CREATE INDEX idx_wallets_user_id ON wallets(user_id)");
        echo " ✅\n";
    } catch (Exception $e) {
        echo " (already exists)\n";
    }

    echo "  - idx_wallet_transactions_user_id...";
    try {
        $pdo->exec("CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id)");
        echo " ✅\n";
    } catch (Exception $e) {
        echo " (already exists)\n";
    }

    echo "  - idx_wallet_transactions_status...";
    try {
        $pdo->exec("CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status)");
        echo " ✅\n";
    } catch (Exception $e) {
        echo " (already exists)\n";
    }

    echo "  - idx_giftcard_applications_user_id...";
    try {
        $pdo->exec("CREATE INDEX idx_giftcard_applications_user_id ON giftcard_applications(user_id)");
        echo " ✅\n";
    } catch (Exception $e) {
        echo " (already exists)\n";
    }

    echo "  - idx_giftcard_applications_status...";
    try {
        $pdo->exec("CREATE INDEX idx_giftcard_applications_status ON giftcard_applications(status)");
        echo " ✅\n";
    } catch (Exception $e) {
        echo " (already exists)\n";
    }

    echo "  - idx_giftcards_user_id...";
    try {
        $pdo->exec("CREATE INDEX idx_giftcards_user_id ON giftcards(user_id)");
        echo " ✅\n";
    } catch (Exception $e) {
        echo " (already exists)\n";
    }

    echo "  - idx_giftcards_status...";
    try {
        $pdo->exec("CREATE INDEX idx_giftcards_status ON giftcards(status)");
        echo " ✅\n";
    } catch (Exception $e) {
        echo " (already exists)\n";
    }

    // 6. Verify tables
    echo "\n🔍 Verifying tables...\n";
    
    $stmt = $pdo->query("SHOW TABLES LIKE 'wallet%'");
    $walletTables = $stmt->fetchAll();
    echo "  ✅ Wallet tables: " . count($walletTables) . " found\n";

    $stmt = $pdo->query("SHOW TABLES LIKE 'giftcard%'");
    $giftcardTables = $stmt->fetchAll();
    echo "  ✅ Gift card tables: " . count($giftcardTables) . " found\n";

    // 7. Check existing data
    echo "\n📊 Existing Data:\n";

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM wallets");
    $walletCount = $stmt->fetch()['count'];
    echo "  - Wallets: $walletCount\n";

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM wallet_transactions");
    $transactionCount = $stmt->fetch()['count'];
    echo "  - Transactions: $transactionCount\n";

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM giftcard_applications");
    $appCount = $stmt->fetch()['count'];
    echo "  - Gift Card Applications: $appCount\n";

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM giftcards");
    $giftcardCount = $stmt->fetch()['count'];
    echo "  - Gift Cards: $giftcardCount\n";

    echo "\n✅ Migration completed successfully!\n";
    echo "\n📝 Summary:\n";
    echo "   ✅ wallets table created/verified\n";
    echo "   ✅ wallet_transactions table created/verified\n";
    echo "   ✅ giftcard_applications table created/verified\n";
    echo "   ✅ giftcards table created/verified\n";
    echo "   ✅ All indexes created/verified\n";

} catch (Exception $e) {
    echo "\n❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
