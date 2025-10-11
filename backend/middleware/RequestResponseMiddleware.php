<?php


class RequestResponseMiddleware {
    private $startTime;
    
    public function __construct() {
        $this->startTime = microtime(true);
    }
    

    public function handle($request, $next) {
        $this->processRequest();
        
        $this->addResponseHeaders();
        
        $response = $next($request);
        
        $this->processResponse($response);
        
        return $response;
    }
    

    private function processRequest() {
        $this->logRequest();
        
        $this->validateRequest();
        
        $this->parseJsonBody();
    }

    private function addResponseHeaders() {
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        header('X-API-Version: 1.0');
        header('X-Response-Time: ' . round((microtime(true) - $this->startTime) * 1000, 2) . 'ms');
        
        $this->setCacheHeaders();
    }
    

    private function setCacheHeaders() {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        
        if (strpos($uri, 'auth.php') !== false) {
            header('Cache-Control: no-store, no-cache, must-revalidate');
            header('Pragma: no-cache');
        } elseif (strpos($uri, 'tours.php') !== false) {
            header('Cache-Control: public, max-age=300');
        } elseif (strpos($uri, 'dashboard.php') !== false) {
            header('Cache-Control: no-cache, must-revalidate');
        } else {
            header('Cache-Control: public, max-age=3600'); 
        }
    }
    

    private function validateRequest() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            if (strpos($_SERVER['REQUEST_URI'], '.php') !== false && 
                !empty(file_get_contents('php://input')) &&
                strpos($contentType, 'application/json') === false &&
                strpos($contentType, 'multipart/form-data') === false) {
                
                $this->sendBadRequestResponse('Invalid Content-Type. Expected application/json');
            }
        }
    }

    private function parseJsonBody() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            if (strpos($contentType, 'application/json') !== false) {
                $input = file_get_contents('php://input');
                if (!empty($input)) {
                    $decoded = json_decode($input, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        $this->sendBadRequestResponse('Invalid JSON in request body');
                    }
                    
                    $GLOBALS['json_input'] = $decoded;
                }
            }
        }
    }

    private function processResponse($response) {
        $executionTime = round((microtime(true) - $this->startTime) * 1000, 2);
        
        $this->logResponse($executionTime);
        
        if (is_array($response) || is_object($response)) {
            if (!isset($response['meta'])) {
                $response['meta'] = [];
            }
            $response['meta']['execution_time_ms'] = $executionTime;
            $response['meta']['memory_usage'] = round(memory_get_peak_usage(true) / 1024 / 1024, 2) . 'MB';
        }
        
        return $response;
    }

    private function logRequest() {
        if ($this->shouldLog()) {
            $logData = [
                'timestamp' => date('Y-m-d H:i:s'),
                'method' => $_SERVER['REQUEST_METHOD'],
                'uri' => $_SERVER['REQUEST_URI'],
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'direct'
            ];
            
            error_log('API Request: ' . json_encode($logData));
        }
    }

    private function logResponse($executionTime) {
        if ($this->shouldLog()) {
            $logData = [
                'timestamp' => date('Y-m-d H:i:s'),
                'execution_time_ms' => $executionTime,
                'memory_peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
                'response_code' => http_response_code()
            ];
            
            error_log('API Response: ' . json_encode($logData));
        }
    }

    private function shouldLog() {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            return false;
        }
        
        if (strpos($_SERVER['REQUEST_URI'], 'health') !== false) {
            return false;
        }
        
        return true;
    }

    private function sendBadRequestResponse($message) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'error_code' => 'BAD_REQUEST',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    public static function getJsonInput() {
        return $GLOBALS['json_input'] ?? null;
    }
}
?>
