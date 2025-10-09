<?php
/**
 * Authentication Middleware
 * Handles authentication for both React frontend and Angular admin panel
 */

class AuthMiddleware {
    private $db;
    private $excludedPaths = [
        '/auth.php',
        '/tours.php',
        '/health-check.php',
        '/test_connection.php'
    ];
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    /**
     * Process authentication middleware
     */
    public function handle($request, $next) {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $method = $_SERVER['REQUEST_METHOD'];
        
        // Allow OPTIONS requests (CORS preflight)
        if ($method === 'OPTIONS') {
            return $next($request);
        }
        
        // Skip authentication for excluded paths
        if ($this->isExcludedPath($path)) {
            return $next($request);
        }
        
        // Check for admin routes that require special authentication
        if ($this->isAdminRoute($path)) {
            return $this->handleAdminAuth($request, $next);
        }
        
        // Regular user authentication
        return $this->handleUserAuth($request, $next);
    }
    
    /**
     * Check if path is excluded from authentication
     */
    private function isExcludedPath($path) {
        foreach ($this->excludedPaths as $excludedPath) {
            if (strpos($path, $excludedPath) !== false) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check if route requires admin authentication
     */
    private function isAdminRoute($path) {
        $adminRoutes = [
            '/dashboard.php',
            '/users.php',
            '/admin',
            '/analytics.php'
        ];
        
        foreach ($adminRoutes as $adminRoute) {
            if (strpos($path, $adminRoute) !== false) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Handle admin authentication
     */
    private function handleAdminAuth($request, $next) {
        session_start();
        
        // Check session-based admin auth (for Angular admin panel)
        if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            return $next($request);
        }
        
        // Check JWT token (for React admin access)
        $token = $this->getAuthToken();
        if ($token && $this->validateAdminToken($token)) {
            return $next($request);
        }
        
        // Admin access required
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Admin access required',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    /**
     * Handle regular user authentication
     */
    private function handleUserAuth($request, $next) {
        $token = $this->getAuthToken();
        
        if (!$token) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Authentication token required',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit;
        }
        
        if (!$this->validateUserToken($token)) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid or expired token',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit;
        }
        
        return $next($request);
    }
    
    /**
     * Extract authentication token from request
     */
    private function getAuthToken() {
        // Check Authorization header
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        
        // Check query parameter
        if (isset($_GET['token'])) {
            return $_GET['token'];
        }
        
        // Check POST data
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['token'])) {
            return $input['token'];
        }
        
        return null;
    }
    
    /**
     * Validate admin token
     */
    private function validateAdminToken($token) {
        try {
            require_once __DIR__ . '/../config/jwt_helper.php';
            $payload = JWTHelper::decode($token);
            
            // Check if user has admin role
            if (!isset($payload['role']) || $payload['role'] !== 'admin') {
                return false;
            }
            
            // Check token expiration
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return false;
            }
            
            return true;
        } catch (Exception $e) {
            error_log('Admin token validation error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Validate user token
     */
    private function validateUserToken($token) {
        try {
            require_once __DIR__ . '/../config/jwt_helper.php';
            $payload = JWTHelper::decode($token);
            
            // Check token expiration
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return false;
            }
            
            // Verify user exists in database
            if (isset($payload['user_id'])) {
                $stmt = $this->db->prepare("SELECT id FROM users WHERE id = ? AND active = 1");
                $stmt->execute([$payload['user_id']]);
                return $stmt->fetchColumn() !== false;
            }
            
            return true;
        } catch (Exception $e) {
            error_log('User token validation error: ' . $e->getMessage());
            return false;
        }
    }
}
?>
