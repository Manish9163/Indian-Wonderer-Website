<?php

function checkAdminAuth() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['admin_logged_in']) || 
        !$_SESSION['admin_logged_in'] || 
        !isset($_SESSION['admin_id']) || 
        !isset($_SESSION['admin_email'])) {
        return false;
    }
    
    $sessionTimeout = 24 * 60 * 60; 
    if (isset($_SESSION['login_time']) && 
        (time() - $_SESSION['login_time']) > $sessionTimeout) {
        destroyAdminSession();
        return false;
    }
    
    return [
        'admin_id' => $_SESSION['admin_id'],
        'email' => $_SESSION['admin_email'],
        'login_time' => $_SESSION['login_time'] ?? null
    ];
}


function requireAdminAuth($returnJson = true) {
    $admin = checkAdminAuth();
    
    if (!$admin) {
        if ($returnJson) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Authentication required. Please login as admin.'
            ]);
        } else {
            header('Location: /fu/backend/admin_login.html');
        }
        exit();
    }
    
    return $admin;
}


function destroyAdminSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    unset($_SESSION['admin_logged_in']);
    unset($_SESSION['admin_id']);
    unset($_SESSION['admin_email']);
    unset($_SESSION['login_time']);
    
    session_destroy();
    
    session_start();
}


function refreshAdminSession() {
    if (checkAdminAuth()) {
        $_SESSION['login_time'] = time();
        return true;
    }
    return false;
}

function getAdminLogoutUrl() {
    return '/fu/backend/api/admin_logout.php';
}


function logAdminActivity($action, $details = []) {
    $admin = checkAdminAuth();
    if (!$admin) return;
    
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'admin_id' => $admin['admin_id'],
        'admin_email' => $admin['email'],
        'action' => $action,
        'details' => $details,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    $logFile = __DIR__ . '/../logs/admin_activity.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
}
?>
