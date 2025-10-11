<?php


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

    public function handle($request, $next) {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'OPTIONS') {
            return $next($request);
        }
        
        if ($this->isExcludedPath($path)) {
            return $next($request);
        }
        
        if ($this->isAdminRoute($path)) {
            return $this->handleAdminAuth($request, $next);
        }
        
        return $this->handleUserAuth($request, $next);
    }
    

    private function isExcludedPath($path) {
        foreach ($this->excludedPaths as $excludedPath) {
            if (strpos($path, $excludedPath) !== false) {
                return true;
            }
        }
        return false;
    }

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
 
    private function handleAdminAuth($request, $next) {
        session_start();
        
        if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            return $next($request);
        }
        
        $token = $this->getAuthToken();
        if ($token && $this->validateAdminToken($token)) {
            return $next($request);
        }
        
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Admin access required',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    

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

    private function getAuthToken() {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        
        if (isset($_GET['token'])) {
            return $_GET['token'];
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['token'])) {
            return $input['token'];
        }
        
        return null;
    }

    private function validateAdminToken($token) {
        try {
            require_once __DIR__ . '/../config/jwt_helper.php';
            $payload = JWTHelper::decode($token);
            
            if (!isset($payload['role']) || $payload['role'] !== 'admin') {
                return false;
            }
            
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return false;
            }
            
            return true;
        } catch (Exception $e) {
            error_log('Admin token validation error: ' . $e->getMessage());
            return false;
        }
    }

    private function validateUserToken($token) {
        try {
            require_once __DIR__ . '/../config/jwt_helper.php';
            $payload = JWTHelper::decode($token);
            
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return false;
            }
            
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
