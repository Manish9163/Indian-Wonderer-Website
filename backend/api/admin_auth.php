<?php
/**
 * Advanced Admin Authentication System
 * Production-ready authentication with role-based access control
 */

require_once '../config/database.php';
require_once '../config/api_config.php';

// Handle CORS for React frontend and Angular admin panel
$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:4201',
    'http://127.0.0.1:4201'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request IMMEDIATELY
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class AdvancedAdminAuth {
    private $pdo;
    private $jwtSecret;
    
    public function __construct() {
        $database = new Database();
        $this->pdo = $database->getConnection();
        $this->jwtSecret = 'your_jwt_secret_key'; // Store in environment variable in production
    }
    
    /**
     * Handle authentication requests
     */
    public function handleRequest() {
        $action = $_GET['action'] ?? 'login';
        $method = $_SERVER['REQUEST_METHOD'];
        
        try {
            switch ($action) {
                case 'login':
                    if ($method === 'POST') {
                        $this->adminLogin();
                    } else {
                        throw new Exception('Method not allowed');
                    }
                    break;
                    
                case 'logout':
                    if ($method === 'POST') {
                        $this->adminLogout();
                    } else {
                        throw new Exception('Method not allowed');
                    }
                    break;
                    
                case 'verify':
                    if ($method === 'GET') {
                        $this->verifyToken();
                    } else {
                        throw new Exception('Method not allowed');
                    }
                    break;
                    
                case 'refresh':
                    if ($method === 'POST') {
                        $this->refreshToken();
                    } else {
                        throw new Exception('Method not allowed');
                    }
                    break;
                    
                case 'permissions':
                    if ($method === 'GET') {
                        $this->getUserPermissions();
                    } else {
                        throw new Exception('Method not allowed');
                    }
                    break;
                    
                case 'sessions':
                    if ($method === 'GET') {
                        $this->getActiveSessions();
                    } else {
                        throw new Exception('Method not allowed');
                    }
                    break;
                    
                case 'activity':
                    if ($method === 'GET') {
                        $this->getLoginActivity();
                    } else {
                        throw new Exception('Method not allowed');
                    }
                    break;
                    
                default:
                    throw new Exception('Invalid action');
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'AUTH_ERROR'
            ]);
        }
    }
    
    /**
     * Advanced admin login with security features
     */
    private function adminLogin() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            // Try to get from POST data
            $input = $_POST;
        }
        
        if (!$input || (empty($input['email']) && empty($input['username'])) || empty($input['password'])) {
            throw new Exception('Email/username and password are required');
        }
        
        $email = $input['email'] ?? null;
        $username = $input['username'] ?? null;
        $password = $input['password'];
        
        // Validate email if provided
        if ($email) {
            $email = filter_var($email, FILTER_VALIDATE_EMAIL);
            if (!$email) {
                throw new Exception('Invalid email format');
            }
        }
        
        // Rate limiting check
        $identifier = $email ?: $username;
        $this->checkRateLimit($identifier);
        
        // Get user with role verification - search by email or username
        $user = null;
        
        if ($email) {
            $stmt = $this->pdo->prepare("
                SELECT id, username, email, password, first_name, last_name, role, is_active, 
                       email_verified, created_at, updated_at,
                       (SELECT COUNT(*) FROM activity_logs WHERE user_id = users.id AND action = 'LOGIN_FAILED' 
                        AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)) as recent_failed_attempts
                FROM users 
                WHERE email = ? AND role IN ('admin', 'guide')
            ");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        if (!$user && $username) {
            $stmt = $this->pdo->prepare("
                SELECT id, username, email, password, first_name, last_name, role, is_active, 
                       email_verified, created_at, updated_at,
                       (SELECT COUNT(*) FROM activity_logs WHERE user_id = users.id AND action = 'LOGIN_FAILED' 
                        AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)) as recent_failed_attempts
                FROM users 
                WHERE username = ? AND role IN ('admin', 'guide')
            ");
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        if (!$user) {
            $this->logFailedAttempt($identifier, 'user_not_found');
            throw new Exception('Invalid credentials');
        }
        
        // Check if account is active
        if (!$user['is_active']) {
            $this->logFailedAttempt($email, 'account_disabled');
            throw new Exception('Account is disabled');
        }
        
        // Check if account is locked due to failed attempts
        if ($user['recent_failed_attempts'] >= 5) {
            $this->logFailedAttempt($email, 'account_locked');
            throw new Exception('Account temporarily locked due to failed login attempts');
        }
        
        // Verify password
        if (!password_verify($input['password'], $user['password'])) {
            $this->logFailedAttempt($email, 'invalid_password');
            throw new Exception('Invalid credentials');
        }
        
        // Check if admin role is required
        if ($user['role'] !== 'admin' && ($input['require_admin'] ?? false)) {
            $this->logFailedAttempt($email, 'insufficient_privileges');
            throw new Exception('Admin privileges required');
        }
        
        // Generate JWT tokens
        $accessToken = $this->generateAccessToken($user);
        $refreshToken = $this->generateRefreshToken($user);
        
        // Store refresh token
        $this->storeRefreshToken($user['id'], $refreshToken);
        
        // Log successful login
        $this->logSuccessfulLogin($user['id']);
        
        // Get user permissions
        $permissions = $this->getUserPermissionsByRole($user['role']);
        
        // Remove password from response
        unset($user['password']);
        unset($user['recent_failed_attempts']);
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'permissions' => $permissions,
                'expires_in' => 3600, // 1 hour
                'token_type' => 'Bearer'
            ]
        ]);
    }
    
    /**
     * Admin logout with session cleanup
     */
    private function adminLogout() {
        $token = $this->getAuthToken();
        
        if ($token) {
            $decoded = $this->decodeToken($token);
            if ($decoded) {
                // Invalidate refresh tokens
                $stmt = $this->pdo->prepare("
                    UPDATE user_refresh_tokens 
                    SET is_active = 0, revoked_at = NOW() 
                    WHERE user_id = ?
                ");
                $stmt->execute([$decoded['user_id']]);
                
                // Log logout
                $this->logActivity($decoded['user_id'], 'LOGOUT', 'auth', null);
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
    
    /**
     * Verify JWT token
     */
    private function verifyToken() {
        $token = $this->getAuthToken();
        
        if (!$token) {
            throw new Exception('No token provided');
        }
        
        $decoded = $this->decodeToken($token);
        
        if (!$decoded) {
            throw new Exception('Invalid or expired token');
        }
        
        // Get fresh user data
        $stmt = $this->pdo->prepare("
            SELECT id, username, email, first_name, last_name, role, is_active 
            FROM users 
            WHERE id = ? AND is_active = 1
        ");
        $stmt->execute([$decoded['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            throw new Exception('User not found or inactive');
        }
        
        echo json_encode([
            'success' => true,
            'valid' => true,
            'data' => [
                'user' => $user,
                'expires_at' => $decoded['exp'],
                'issued_at' => $decoded['iat']
            ]
        ]);
    }
    
    /**
     * Refresh access token
     */
    private function refreshToken() {
        $input = json_decode(file_get_contents('php://input'), true);
        $refreshToken = $input['refresh_token'] ?? '';
        
        if (!$refreshToken) {
            throw new Exception('Refresh token required');
        }
        
        // Validate refresh token
        $stmt = $this->pdo->prepare("
            SELECT rt.*, u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.is_active
            FROM user_refresh_tokens rt
            JOIN users u ON rt.user_id = u.id
            WHERE rt.token = ? AND rt.is_active = 1 AND rt.expires_at > NOW() AND u.is_active = 1
        ");
        $stmt->execute([$refreshToken]);
        $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$tokenData) {
            throw new Exception('Invalid or expired refresh token');
        }
        
        // Generate new access token
        $user = [
            'id' => $tokenData['id'],
            'username' => $tokenData['username'],
            'email' => $tokenData['email'],
            'first_name' => $tokenData['first_name'],
            'last_name' => $tokenData['last_name'],
            'role' => $tokenData['role']
        ];
        
        $newAccessToken = $this->generateAccessToken($user);
        
        echo json_encode([
            'success' => true,
            'message' => 'Token refreshed successfully',
            'data' => [
                'access_token' => $newAccessToken,
                'expires_in' => 3600,
                'token_type' => 'Bearer'
            ]
        ]);
    }
    
    /**
     * Get user permissions based on role
     */
    private function getUserPermissions() {
        $token = $this->getAuthToken();
        $decoded = $this->decodeToken($token);
        
        if (!$decoded) {
            throw new Exception('Valid token required');
        }
        
        $stmt = $this->pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$decoded['user_id']]);
        $role = $stmt->fetchColumn();
        
        if (!$role) {
            throw new Exception('User not found');
        }
        
        $permissions = $this->getUserPermissionsByRole($role);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'role' => $role,
                'permissions' => $permissions
            ]
        ]);
    }
    
    /**
     * Get active user sessions
     */
    private function getActiveSessions() {
        $token = $this->getAuthToken();
        $decoded = $this->decodeToken($token);
        
        if (!$decoded || $decoded['role'] !== 'admin') {
            throw new Exception('Admin access required');
        }
        
        $stmt = $this->pdo->prepare("
            SELECT rt.id, rt.user_id, rt.created_at, rt.expires_at, rt.last_used_at,
                   u.username, u.email, u.first_name, u.last_name,
                   al.ip_address, al.user_agent
            FROM user_refresh_tokens rt
            JOIN users u ON rt.user_id = u.id
            LEFT JOIN activity_logs al ON rt.user_id = al.user_id 
                AND al.action = 'LOGIN_SUCCESS' 
                AND DATE(al.created_at) = DATE(rt.created_at)
            WHERE rt.is_active = 1 AND rt.expires_at > NOW()
            ORDER BY rt.last_used_at DESC
        ");
        $stmt->execute();
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $sessions
        ]);
    }
    
    /**
     * Helper functions
     */
    private function generateAccessToken($user) {
        $payload = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + 3600 // 1 hour
        ];
        
        return $this->encodeJWT($payload);
    }
    
    private function generateRefreshToken($user) {
        return bin2hex(random_bytes(64));
    }
    
    private function storeRefreshToken($userId, $refreshToken) {
        // Clean old tokens
        $stmt = $this->pdo->prepare("
            UPDATE user_refresh_tokens 
            SET is_active = 0 
            WHERE user_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        $stmt->execute([$userId]);
        
        // Store new token
        $stmt = $this->pdo->prepare("
            INSERT INTO user_refresh_tokens (user_id, token, expires_at, created_at, last_used_at) 
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW())
        ");
        $stmt->execute([$userId, $refreshToken]);
    }
    
    private function getUserPermissionsByRole($role) {
        $permissions = [
            'admin' => [
                'tours' => ['create', 'read', 'update', 'delete', 'manage_pricing', 'view_analytics'],
                'users' => ['create', 'read', 'update', 'delete', 'impersonate', 'view_analytics'],
                'bookings' => ['create', 'read', 'update', 'delete', 'confirm', 'cancel', 'view_analytics'],
                'payments' => ['create', 'read', 'update', 'refund', 'view_analytics'],
                'dashboard' => ['view_all_metrics', 'real_time_data', 'export_data'],
                'analytics' => ['view_all', 'export', 'configure'],
                'system' => ['manage_settings', 'view_logs', 'system_health']
            ],
            'guide' => [
                'tours' => ['read', 'update_assigned'],
                'bookings' => ['read', 'update_assigned'],
                'customers' => ['read', 'communicate'],
                'dashboard' => ['view_assigned_tours']
            ],
            'customer' => [
                'tours' => ['read'],
                'bookings' => ['create', 'read_own', 'update_own'],
                'profile' => ['read', 'update']
            ]
        ];
        
        return $permissions[$role] ?? [];
    }
    
    private function checkRateLimit($email) {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as attempts
            FROM activity_logs 
            WHERE action = 'LOGIN_FAILED' 
            AND new_values LIKE ? 
            AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        ");
        $stmt->execute(["%$email%"]);
        $attempts = $stmt->fetch(PDO::FETCH_ASSOC)['attempts'];
        
        if ($attempts >= 10) {
            throw new Exception('Too many failed attempts. Please try again in 15 minutes.');
        }
    }
    
    private function logFailedAttempt($email, $reason) {
        $this->logActivity(null, 'LOGIN_FAILED', 'auth', null, [
            'email' => $email,
            'reason' => $reason,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
    }
    
    private function logSuccessfulLogin($userId) {
        $this->logActivity($userId, 'LOGIN_SUCCESS', 'auth', null, [
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    }
    
    private function logActivity($userId, $action, $tableName, $recordId, $newValues = null) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $action,
                $tableName,
                $recordId,
                $newValues ? json_encode($newValues) : null,
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);
        } catch (Exception $e) {
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }
    
    private function getAuthToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (strpos($authHeader, 'Bearer ') === 0) {
            return substr($authHeader, 7);
        }
        
        return null;
    }
    
    private function encodeJWT($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $this->jwtSecret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    private function decodeToken($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }
        
        $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0])), true);
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
        $signature = $parts[2];
        
        // Verify signature
        $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], 
            base64_encode(hash_hmac('sha256', $parts[0] . "." . $parts[1], $this->jwtSecret, true)));
        
        if ($signature !== $expectedSignature) {
            return false;
        }
        
        // Check expiration
        if ($payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
}

// Initialize and handle request
$auth = new AdvancedAdminAuth();
$auth->handleRequest();
