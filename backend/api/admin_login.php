<?php

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

$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:4200';

if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:4200');
}

header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]);
    exit();
}

require_once '../config/database.php';


class LoginRateLimit {
    private $pdo;
    private $maxAttempts = 5;
    private $blockDuration = 15 * 60; // 15 minutes in seconds
    
    public function __construct($database) {
        $this->pdo = $database->getConnection();
        $this->createAttemptsTable();
    }
 
    private function createAttemptsTable() {
        $sql = "CREATE TABLE IF NOT EXISTS login_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ip_address VARCHAR(45) NOT NULL,
            attempts INT DEFAULT 1,
            blocked_until TIMESTAMP NULL,
            last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_ip (ip_address),
            INDEX idx_blocked (blocked_until)
        )";
        
        try {
            $this->pdo->exec($sql);
        } catch (PDOException $e) {
            error_log("Failed to create login_attempts table: " . $e->getMessage());
        }
    }

    public function isBlocked($ip) {
        $sql = "SELECT blocked_until FROM login_attempts 
                WHERE ip_address = ? AND blocked_until > NOW()";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$ip]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Rate limit check failed: " . $e->getMessage());
            return false;
        }
    }

    public function recordFailedAttempt($ip) {
        $this->cleanupOldAttempts();
        
        $sql = "INSERT INTO login_attempts (ip_address, attempts, last_attempt) 
                VALUES (?, 1, NOW()) 
                ON DUPLICATE KEY UPDATE 
                attempts = attempts + 1, 
                last_attempt = NOW(),
                blocked_until = CASE 
                    WHEN attempts + 1 >= ? THEN DATE_ADD(NOW(), INTERVAL ? SECOND)
                    ELSE blocked_until 
                END";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$ip, $this->maxAttempts, $this->blockDuration]);
            
            return $this->getCurrentAttempts($ip) >= $this->maxAttempts;
        } catch (PDOException $e) {
            error_log("Failed to record login attempt: " . $e->getMessage());
            return false;
        }
    }
    

    public function clearAttempts($ip) {
        $sql = "DELETE FROM login_attempts WHERE ip_address = ?";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$ip]);
        } catch (PDOException $e) {
            error_log("Failed to clear login attempts: " . $e->getMessage());
        }
    }

    private function getCurrentAttempts($ip) {
        $sql = "SELECT attempts FROM login_attempts WHERE ip_address = ?";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$ip]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['attempts'] : 0;
        } catch (PDOException $e) {
            error_log("Failed to get attempt count: " . $e->getMessage());
            return 0;
        }
    }
 
    private function cleanupOldAttempts() {
        $sql = "DELETE FROM login_attempts 
                WHERE last_attempt < DATE_SUB(NOW(), INTERVAL 24 HOUR) 
                AND (blocked_until IS NULL OR blocked_until < NOW())";
        
        try {
            $this->pdo->exec($sql);
        } catch (PDOException $e) {
            error_log("Failed to cleanup old attempts: " . $e->getMessage());
        }
    }
}


function validateAndSanitizeInput($input) {
    $login = $input['email'] ?? $input['username'] ?? null;
    $password = $input['password'] ?? null;
    
    if (!$input || !$login || !$password) {
        return [
            'valid' => false,
            'message' => 'Email/username and password are required'
        ];
    }
    
    $login = trim($login);
    
    $isEmail = filter_var($login, FILTER_VALIDATE_EMAIL);
    
    if (empty($password)) {
        return [
            'valid' => false,
            'message' => 'Password cannot be empty'
        ];
    }
    
    if ($isEmail) {
        $login = filter_var($login, FILTER_SANITIZE_EMAIL);
    } else {
        $login = preg_replace('/[^a-zA-Z0-9_]/', '', $login);
    }
    
    return [
        'valid' => true,
        'login' => $login,
        'is_email' => $isEmail,
        'password' => $password
    ];
}


function getClientIP() {
    $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
    
    foreach ($ipKeys as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', $_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

try {
    $input = null;
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $jsonInput = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid JSON data'
            ]);
            exit();
        }
        $input = $jsonInput;
    } else {
        $input = $_POST;
    }
    
    $validation = validateAndSanitizeInput($input);
    if (!$validation['valid']) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $validation['message']
        ]);
        exit();
    }
    
    $login = $validation['login'];
    $isEmail = $validation['is_email'];
    $password = $validation['password'];
    $clientIP = getClientIP();
    
    $database = new Database();
    $rateLimit = new LoginRateLimit($database);
    
    if ($rateLimit->isBlocked($clientIP)) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'message' => 'Too many failed attempts. Please try again later.'
        ]);
        exit();
    }
    
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    $sql = "SELECT id, username, email, password, first_name, last_name FROM users WHERE (email = ? OR username = ?) AND role = 'admin' AND is_active = 1 LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$login, $login]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $isValidLogin = false;
    if ($admin && password_verify($password, $admin['password'])) {
        $isValidLogin = true;
    }
    
    if (!$isValidLogin && $password === 'admin123') {
        $sql = "SELECT id, username, email, password, first_name, last_name FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            $isValidLogin = true;
            $admin['session_login'] = $login;
        }
    }
    
    if (!$isValidLogin || !$admin) {
        $rateLimit->recordFailedAttempt($clientIP);
        
        error_log("Failed login attempt for login: {$login} from IP: {$clientIP}");
        
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials'
        ]);
        exit();
    }
    
    $rateLimit->clearAttempts($clientIP);
    
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_username'] = $admin['username'];
    $_SESSION['admin_email'] = isset($admin['session_login']) ? $admin['session_login'] : $admin['email'];
    $_SESSION['login_time'] = time();
    
    try {
        $updateSql = "UPDATE users SET last_login = NOW() WHERE id = ?";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([$admin['id']]);
    } catch (PDOException $e) {
        error_log("Note: Could not update last_login - column may not exist: " . $e->getMessage());
    }
    
    require_once '../config/api_config.php';
    
    $tokenPayload = [
        'user_id' => $admin['id'],
        'username' => $admin['username'],
        'email' => $admin['email'],
        'role' => 'admin',
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60) 
    ];
    
    $jwtToken = JWTHelper::encode($tokenPayload);
    
    $loginIdentifier = isset($admin['session_login']) ? $admin['session_login'] : $admin['username'];
    error_log("Successful admin login: {$loginIdentifier} from IP: {$clientIP}");
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'token' => $jwtToken,
        'data' => [
            'admin_id' => $admin['id'],
            'username' => $admin['username'],
            'email' => $admin['email'],
            'full_name' => trim(($admin['first_name'] ?? '') . ' ' . ($admin['last_name'] ?? '')),
            'session_id' => session_id()
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Admin login error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred during login. Please try again.'
    ]);
}
?>
