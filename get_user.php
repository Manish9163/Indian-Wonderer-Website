<?php
require_once 'backend/config/database.php';
$db = new Database();
$pdo = $db->getConnection();
$stmt = $pdo->prepare('SELECT id FROM users LIMIT 1');
$stmt->execute();
$user = $stmt->fetch();
echo 'First available user ID: ' . $user['id'] . PHP_EOL;
?>
