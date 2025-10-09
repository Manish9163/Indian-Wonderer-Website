<?php
/**
 * Admin Session Management Utility
 * 
 * This utility provides functions for managing admin sessions and authentication.
 * Include this file in admin-protected pages to verify authentication.
 */

/**
 * Check if admin is logged in
 * 
 * @return array Returns admin data if logged in, false otherwise
 */
function checkAdminAuth() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Check if admin session exists and is valid
    if (!isset($_SESSION['admin_logged_in']) || 
        !$_SESSION['admin_logged_in'] || 
        !isset($_SESSION['admin_id']) || 
        !isset($_SESSION['admin_email'])) {
        return false;
    }
    
    // Check session timeout (optional - 24 hours)
    $sessionTimeout = 24 * 60 * 60; // 24 hours in seconds
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

/**
 * Require admin authentication
 * Redirects to login or returns 401 if not authenticated
 * 
 * @param bool $returnJson Whether to return JSON response (for API) or redirect
 */
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

/**
 * Destroy admin session (logout)
 */
function destroyAdminSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Unset admin session variables
    unset($_SESSION['admin_logged_in']);
    unset($_SESSION['admin_id']);
    unset($_SESSION['admin_email']);
    unset($_SESSION['login_time']);
    
    // Destroy the entire session
    session_destroy();
    
    // Start a new session
    session_start();
}

/**
 * Refresh admin session (extend timeout)
 */
function refreshAdminSession() {
    if (checkAdminAuth()) {
        $_SESSION['login_time'] = time();
        return true;
    }
    return false;
}

/**
 * Get admin logout URL
 */
function getAdminLogoutUrl() {
    return '/fu/backend/api/admin_logout.php';
}

/**
 * Log admin activity
 * 
 * @param string $action Action performed by admin
 * @param array $details Additional details to log
 */
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
    
    // Log to file (you can also log to database)
    $logFile = __DIR__ . '/../logs/admin_activity.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
}
?>
