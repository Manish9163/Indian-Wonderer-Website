<?php

// Include the endpoints configuration
require_once __DIR__ . '/endpoints.php';
require_once __DIR__ . '/database.php';

// NOTE: CORS headers are now set in each API file individually
// to avoid duplicate headers and allow proper credentials handling
// CorsConfig::setCorsHeaders();

/**
 * Standard API response helper
 */
class ApiResponse {
    
    public static function success($data = null, $message = "Success", $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    public static function error($message = "Error", $code = 400, $errors = null) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    public static function notFound($message = "Resource not found") {
        self::error($message, 404);
    }
    
    public static function unauthorized($message = "Unauthorized access") {
        self::error($message, 401);
    }
    
    public static function forbidden($message = "Forbidden") {
        self::error($message, 403);
    }
    
    public static function serverError($message = "Internal server error") {
        self::error($message, 500);
    }
}

/**
 * Input validation helper
 */
class Validator {
    
    public static function required($value, $field) {
        if (empty($value)) {
            return "$field is required";
        }
        return null;
    }
    
    public static function email($email) {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return "Invalid email format";
        }
        return null;
    }
    
    public static function minLength($value, $min, $field) {
        if (strlen($value) < $min) {
            return "$field must be at least $min characters";
        }
        return null;
    }
    
    public static function maxLength($value, $max, $field) {
        if (strlen($value) > $max) {
            return "$field must not exceed $max characters";
        }
        return null;
    }
    
    public static function numeric($value, $field) {
        if (!is_numeric($value)) {
            return "$field must be a number";
        }
        return null;
    }
    
    public static function positive($value, $field) {
        if ($value <= 0) {
            return "$field must be positive";
        }
        return null;
    }
}

/**
 * JWT handling helper
 */
class JWTHelper {
    private static $secret_key = "your_secret_key_here_change_in_production";
    
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secret_key, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    public static function decode($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }
        
        $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0]));
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
        $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[2]));
        
        $expectedSignature = hash_hmac('sha256', $parts[0] . "." . $parts[1], self::$secret_key, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }
        
        return json_decode($payload, true);
    }
    
    public static function verify($token) {
        $decoded = self::decode($token);
        
        if (!$decoded) {
            return false;
        }
        
        // Check expiration
        if (isset($decoded['exp']) && $decoded['exp'] < time()) {
            return false;
        }
        
        return $decoded;
    }
}

/**
 * Get request body as JSON
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

/**
 * Get authorization header
 */
function getAuthorizationHeader() {
    $headers = getallheaders();
    
    if (isset($headers['Authorization'])) {
        return str_replace('Bearer ', '', $headers['Authorization']);
    }
    
    return null;
}

/**
 * Log activity for audit trail
 */
function logActivity($user_id, $action, $table_name = null, $record_id = null, $old_values = null, $new_values = null) {
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        $query = "INSERT INTO activity_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) 
                  VALUES (:user_id, :action, :table_name, :record_id, :old_values, :new_values, :ip_address, :user_agent)";
        
        $stmt = $db->prepare($query);
        
        // Pre-encode JSON values to avoid reference warnings
        $old_values_json = json_encode($old_values);
        $new_values_json = json_encode($new_values);
        $remote_addr = $_SERVER['REMOTE_ADDR'] ?? '';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':table_name', $table_name);
        $stmt->bindParam(':record_id', $record_id);
        $stmt->bindParam(':old_values', $old_values_json);
        $stmt->bindParam(':new_values', $new_values_json);
        $stmt->bindParam(':ip_address', $remote_addr);
        $stmt->bindParam(':user_agent', $user_agent);
        
        $stmt->execute();
    } catch (Exception $e) {
        // Log error but don't break the main operation
        error_log("Activity logging failed: " . $e->getMessage());
    }
}
?>
