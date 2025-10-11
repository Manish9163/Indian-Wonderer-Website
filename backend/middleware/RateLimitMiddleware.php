<?php


class RateLimitMiddleware {
    private $db;
    private $limits = [
        'default' => ['requests' => 100, 'window' => 3600], 
        'admin' => ['requests' => 500, 'window' => 3600],   
        'auth' => ['requests' => 10, 'window' => 900],     
    ];
    
    public function __construct($database) {
        $this->db = $database;
        $this->createRateLimitTable();
    }

    public function handle($request, $next) {
        $clientId = $this->getClientIdentifier();
        $endpoint = $this->getEndpointType();
        
        if ($this->isRateLimited($clientId, $endpoint)) {
            $this->sendRateLimitResponse();
            return;
        }
        
        $this->recordRequest($clientId, $endpoint);
        return $next($request);
    }

    private function getClientIdentifier() {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        session_start();
        if (isset($_SESSION['user_id'])) {
            return 'user_' . $_SESSION['user_id'];
        }
        
        if (isset($_SESSION['admin_id'])) {
            return 'admin_' . $_SESSION['admin_id'];
        }
        
        return $ip . '_' . substr(md5($userAgent), 0, 8);
    }

    private function getEndpointType() {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        
        if (strpos($uri, 'auth.php') !== false) {
            return 'auth';
        }
        
        if (strpos($uri, 'dashboard.php') !== false || 
            strpos($uri, 'admin') !== false ||
            strpos($uri, 'users.php') !== false) {
            return 'admin';
        }
        
        return 'default';
    }
    

    private function isRateLimited($clientId, $endpoint) {
        $limit = $this->limits[$endpoint] ?? $this->limits['default'];
        $windowStart = time() - $limit['window'];
        
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as request_count 
                FROM rate_limits 
                WHERE client_id = ? AND endpoint = ? AND timestamp > ?
            ");
            $stmt->execute([$clientId, $endpoint, $windowStart]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result['request_count'] >= $limit['requests'];
        } catch (Exception $e) {
            error_log('Rate limit check error: ' . $e->getMessage());
            return false; 
        }
    }
    

    private function recordRequest($clientId, $endpoint) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO rate_limits (client_id, endpoint, timestamp) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$clientId, $endpoint, time()]);
            
            $this->cleanOldRecords();
        } catch (Exception $e) {
            error_log('Rate limit record error: ' . $e->getMessage());
        }
    }

    private function cleanOldRecords() {
        $maxWindow = max(array_column($this->limits, 'window'));
        $cutoff = time() - ($maxWindow * 2);
        
        try {
            $stmt = $this->db->prepare("DELETE FROM rate_limits WHERE timestamp < ?");
            $stmt->execute([$cutoff]);
        } catch (Exception $e) {
            error_log('Rate limit cleanup error: ' . $e->getMessage());
        }
    }

    private function sendRateLimitResponse() {
        http_response_code(429);
        header('Retry-After: 3600'); // 1 hour
        echo json_encode([
            'success' => false,
            'message' => 'Rate limit exceeded. Please try again later.',
            'error_code' => 'RATE_LIMIT_EXCEEDED',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    private function createRateLimitTable() {
        try {
            $sql = "
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_id VARCHAR(255) NOT NULL,
                    endpoint VARCHAR(100) NOT NULL,
                    timestamp INT NOT NULL,
                    INDEX idx_client_endpoint (client_id, endpoint),
                    INDEX idx_timestamp (timestamp)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ";
            $this->db->exec($sql);
        } catch (Exception $e) {
            error_log('Rate limit table creation error: ' . $e->getMessage());
        }
    }

    public function getRateLimitStatus($clientId, $endpoint) {
        $limit = $this->limits[$endpoint] ?? $this->limits['default'];
        $windowStart = time() - $limit['window'];
        
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as used_requests 
                FROM rate_limits 
                WHERE client_id = ? AND endpoint = ? AND timestamp > ?
            ");
            $stmt->execute([$clientId, $endpoint, $windowStart]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'limit' => $limit['requests'],
                'used' => $result['used_requests'],
                'remaining' => max(0, $limit['requests'] - $result['used_requests']),
                'reset_time' => time() + $limit['window']
            ];
        } catch (Exception $e) {
            error_log('Rate limit status error: ' . $e->getMessage());
            return null;
        }
    }
}
?>
