<?php
// Secure Session Management for Tour System
// CSRF protection and session security

class SessionManager {
    
    public function __construct() {
        $this->startSecureSession();
    }
    
    // Start secure session with proper configuration
    private function startSecureSession() {
        if (session_status() === PHP_SESSION_NONE) {
            // Set secure session parameters
            ini_set('session.cookie_httponly', 1);
            ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
            ini_set('session.use_strict_mode', 1);
            ini_set('session.cookie_samesite', 'Strict');
            
            session_start();
            
            // Regenerate session ID periodically for security
            if (!isset($_SESSION['created'])) {
                $_SESSION['created'] = time();
            } else if (time() - $_SESSION['created'] > 1800) { // 30 minutes
                session_regenerate_id(true);
                $_SESSION['created'] = time();
            }
        }
    }
    
    // Generate CSRF token
    public function generateCSRFToken() {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    // Validate CSRF token
    public function validateCSRFToken($token) {
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
    
    // Set session variable
    public function set($key, $value) {
        $_SESSION[$key] = $value;
    }
    
    // Get session variable
    public function get($key, $default = null) {
        return $_SESSION[$key] ?? $default;
    }
    
    // Check if key exists
    public function has($key) {
        return isset($_SESSION[$key]);
    }
    
    // Remove session variable
    public function remove($key) {
        unset($_SESSION[$key]);
    }
    
    // Destroy session
    public function destroy() {
        session_destroy();
        $_SESSION = [];
    }
    
    // Check if admin is logged in
    public function isAdminLoggedIn() {
        return $this->has('admin_id') && $this->has('admin_email');
    }
    
    // Set admin session
    public function setAdminSession($adminData) {
        $this->set('admin_id', $adminData['id']);
        $this->set('admin_email', $adminData['email']);
        $this->set('admin_name', $adminData['full_name']);
        $this->set('login_time', time());
    }
    
    // Clear admin session
    public function clearAdminSession() {
        $this->remove('admin_id');
        $this->remove('admin_email');
        $this->remove('admin_name');
        $this->remove('login_time');
    }
    
    // Get admin data
    public function getAdminData() {
        if ($this->isAdminLoggedIn()) {
            return [
                'id' => $this->get('admin_id'),
                'email' => $this->get('admin_email'),
                'name' => $this->get('admin_name'),
                'login_time' => $this->get('login_time')
            ];
        }
        return null;
    }
}

// Input validation and sanitization
class InputValidator {
    
    // Sanitize string input
    public static function sanitizeString($input) {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
    
    // Validate email
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    // Validate phone number
    public static function validatePhone($phone) {
        return preg_match('/^[+]?[0-9\s\-\(\)]{10,20}$/', $phone);
    }
    
    // Validate required fields
    public static function validateRequired($data, $required_fields) {
        $errors = [];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                $errors[] = ucfirst($field) . " is required";
            }
        }
        return $errors;
    }
    
    // Sanitize array of data
    public static function sanitizeArray($data) {
        $sanitized = [];
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = self::sanitizeString($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        return $sanitized;
    }
}

// Response helper
class ResponseHelper {
    
    // Send JSON response
    public static function json($data, $status_code = 200) {
        http_response_code($status_code);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
    
    // Send success response
    public static function success($message, $data = null) {
        $response = ['success' => true, 'message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        self::json($response);
    }
    
    // Send error response
    public static function error($message, $status_code = 400) {
        self::json(['success' => false, 'message' => $message], $status_code);
    }
    
    // Redirect with message
    public static function redirect($url, $message = null, $type = 'info') {
        if ($message) {
            $_SESSION['flash_message'] = $message;
            $_SESSION['flash_type'] = $type;
        }
        header("Location: $url");
        exit;
    }
}

// Logger class for admin actions
class AdminLogger {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function log($admin_id, $action, $table_name = null, $record_id = null, $old_values = null, $new_values = null) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        $sql = "INSERT INTO admin_logs (admin_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $params = [
            $admin_id,
            $action,
            $table_name,
            $record_id,
            $old_values ? json_encode($old_values) : null,
            $new_values ? json_encode($new_values) : null,
            $ip,
            $user_agent
        ];
        
        $this->db->executeQuery($sql, $params);
    }
}

// Global session manager
$session = new SessionManager();
?>
