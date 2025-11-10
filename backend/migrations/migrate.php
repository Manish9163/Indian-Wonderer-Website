<?php
/**
 * Database Migration Script for Travel System
 */

// Set error handling
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

try {
    // Database connection
    $db_host = 'localhost';
    $db_user = 'root';
    $db_pass = '';
    $db_name = 'indian_wonderer_base';

    $conn = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo json_encode(['status' => 'info', 'message' => 'Starting migration...'], JSON_PRETTY_PRINT) . "\n";

    // Read the migration file
    $migration_file = __DIR__ . '/001_create_travel_system.sql';
    if (!file_exists($migration_file)) {
        throw new Exception('Migration file not found: ' . $migration_file);
    }

    $sql_content = file_get_contents($migration_file);

    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql_content)));

    $success_count = 0;
    $error_count = 0;

    foreach ($statements as $statement) {
        if (empty($statement)) {
            continue;
        }

        try {
            $conn->exec($statement);
            $success_count++;
            echo json_encode(['status' => 'success', 'message' => 'Executed: ' . substr($statement, 0, 50) . '...'], JSON_PRETTY_PRINT) . "\n";
        } catch (Exception $e) {
            $error_count++;
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_PRETTY_PRINT) . "\n";
        }
    }

    echo "\n" . json_encode([
        'status' => 'complete',
        'total_statements' => count($statements),
        'success' => $success_count,
        'errors' => $error_count,
        'message' => 'Migration completed'
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
